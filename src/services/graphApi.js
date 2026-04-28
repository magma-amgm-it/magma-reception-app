import { getAccessToken } from './auth';

const GRAPH_BASE = 'https://graph.microsoft.com/v1.0';
const SHAREPOINT_SITE_URL = import.meta.env.VITE_SHAREPOINT_SITE_URL;

const LIST_NAMES = {
  supplyRequests: 'Supply Requests',
  inventory: 'Reception Inventory',
  clientLog: 'Client Log',
  purchaseOrders: 'Purchase Orders',
};

// --- Helpers ---

async function graphFetch(url, options = {}) {
  const token = await getAccessToken();
  const { method = 'GET', body, retries = 2 } = options;

  const headers = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };

  for (let attempt = 0; attempt <= retries; attempt++) {
    const response = await fetch(`${GRAPH_BASE}${url}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    if (response.status === 429) {
      // Throttled — respect Retry-After header or default to exponential backoff
      const retryAfter = response.headers.get('Retry-After');
      const waitMs = retryAfter ? parseInt(retryAfter, 10) * 1000 : Math.pow(2, attempt + 1) * 1000;
      console.warn(`Graph API throttled (429). Retrying in ${waitMs}ms...`);
      await new Promise((resolve) => setTimeout(resolve, waitMs));
      continue;
    }

    if (!response.ok) {
      const errorBody = await response.text();
      // Friendlier message for the most common permission-related failures
      if (response.status === 403) {
        const isColumnUpdate = method === 'PATCH' && /\/columns\//.test(url);
        if (isColumnUpdate) {
          throw new Error(
            "You don't have permission to add new options to this list. Ask IT to grant the Sites.Manage.All scope and admin consent in Azure AD."
          );
        }
        throw new Error(
          "Access denied. Your account doesn't have permission for this action — sign out and back in, or ask IT for access."
        );
      }
      if (response.status === 401) {
        throw new Error('Your session has expired. Please sign out and sign back in.');
      }
      throw new Error(
        `Graph API error ${response.status}: ${response.statusText} — ${errorBody}`
      );
    }

    // 204 No Content (e.g. successful PATCH)
    if (response.status === 204) return null;

    return response.json();
  }

  throw new Error('Graph API request failed after maximum retries (429 throttling).');
}

export async function getSiteId() {
  const cached = localStorage.getItem('magma_site_id');
  if (cached) return cached;

  const data = await graphFetch(`/sites/${SHAREPOINT_SITE_URL}`);
  const siteId = data.id;
  localStorage.setItem('magma_site_id', siteId);
  return siteId;
}

async function getListId(listName) {
  const cacheKey = `magma_list_id_${listName}`;
  const cached = localStorage.getItem(cacheKey);
  if (cached) return cached;

  const siteId = await getSiteId();
  const data = await graphFetch(`/sites/${siteId}/lists/${encodeURIComponent(listName)}`);
  const listId = data.id;
  localStorage.setItem(cacheKey, listId);
  return listId;
}

function buildFilterQuery(filters) {
  if (!filters || Object.keys(filters).length === 0) return '';
  const parts = Object.entries(filters).map(
    ([key, value]) => `fields/${key} eq '${value}'`
  );
  return `&$filter=${encodeURIComponent(parts.join(' and '))}`;
}

// --- Supply Requests ---

export async function getSupplyRequests(filters) {
  const siteId = await getSiteId();
  const listId = await getListId(LIST_NAMES.supplyRequests);
  const filterQuery = buildFilterQuery(filters);
  return graphFetch(
    `/sites/${siteId}/lists/${listId}/items?$expand=fields${filterQuery}`
  );
}

export async function createSupplyRequest(data) {
  const siteId = await getSiteId();
  const listId = await getListId(LIST_NAMES.supplyRequests);
  return graphFetch(`/sites/${siteId}/lists/${listId}/items`, {
    method: 'POST',
    body: { fields: data },
  });
}

export async function updateSupplyRequest(id, data) {
  const siteId = await getSiteId();
  const listId = await getListId(LIST_NAMES.supplyRequests);
  return graphFetch(`/sites/${siteId}/lists/${listId}/items/${id}/fields`, {
    method: 'PATCH',
    body: data,
  });
}

// --- Inventory ---

export async function getInventoryItems() {
  const siteId = await getSiteId();
  const listId = await getListId(LIST_NAMES.inventory);
  return graphFetch(
    `/sites/${siteId}/lists/${listId}/items?$expand=fields`
  );
}

export async function updateInventoryItem(id, data) {
  const siteId = await getSiteId();
  const listId = await getListId(LIST_NAMES.inventory);
  return graphFetch(`/sites/${siteId}/lists/${listId}/items/${id}/fields`, {
    method: 'PATCH',
    body: data,
  });
}

export async function createInventoryItem(data) {
  const siteId = await getSiteId();
  const listId = await getListId(LIST_NAMES.inventory);
  return graphFetch(`/sites/${siteId}/lists/${listId}/items`, {
    method: 'POST',
    body: { fields: data },
  });
}

export async function deleteInventoryItem(id) {
  const siteId = await getSiteId();
  const listId = await getListId(LIST_NAMES.inventory);
  return graphFetch(`/sites/${siteId}/lists/${listId}/items/${id}`, {
    method: 'DELETE',
  });
}

// --- Generic choice-column management ---

async function getChoiceColumn(listName, columnName) {
  const siteId = await getSiteId();
  const listId = await getListId(listName);
  const data = await graphFetch(`/sites/${siteId}/lists/${listId}/columns`);
  const col = (data.value || []).find(
    (c) => c.name === columnName || c.displayName === columnName
  );
  if (!col) throw new Error(`Column "${columnName}" not found in "${listName}" list`);
  return { siteId, listId, column: col };
}

async function addChoiceToColumn(listName, columnName, newChoice) {
  const { siteId, listId, column } = await getChoiceColumn(listName, columnName);
  const existing = column.choice?.choices || [];
  if (existing.some((c) => c.toLowerCase() === newChoice.toLowerCase())) {
    return existing;
  }
  const updated = [...existing, newChoice];
  await graphFetch(`/sites/${siteId}/lists/${listId}/columns/${column.id}`, {
    method: 'PATCH',
    body: {
      choice: { ...column.choice, choices: updated },
    },
  });
  return updated;
}

// --- Inventory Category ---

export async function getInventoryCategoryChoices() {
  const { column } = await getChoiceColumn(LIST_NAMES.inventory, 'Category');
  return column.choice?.choices || [];
}

export async function addInventoryCategoryChoice(newCategory) {
  return addChoiceToColumn(LIST_NAMES.inventory, 'Category', newCategory);
}

// --- Client Log Reason for Visit ---

export async function getClientLogReasonChoices() {
  const { column } = await getChoiceColumn(LIST_NAMES.clientLog, 'ReasonForVisit');
  return column.choice?.choices || [];
}

export async function addClientLogReasonChoice(newReason) {
  return addChoiceToColumn(LIST_NAMES.clientLog, 'ReasonForVisit', newReason);
}

// --- Client Log Preferred Language ---

export async function getClientLogLanguageChoices() {
  const { column } = await getChoiceColumn(LIST_NAMES.clientLog, 'PreferredLanguage');
  return column.choice?.choices || [];
}

export async function addClientLogLanguageChoice(newLanguage) {
  return addChoiceToColumn(LIST_NAMES.clientLog, 'PreferredLanguage', newLanguage);
}

// --- Vendor choices (synced across Inventory.PreferredVendor + PurchaseOrders.Vendor) ---

export async function getVendorChoices() {
  // Pull union of both columns so all known vendors appear
  const [invCol, poCol] = await Promise.all([
    getChoiceColumn(LIST_NAMES.inventory, 'PreferredVendor').catch(() => null),
    getChoiceColumn(LIST_NAMES.purchaseOrders, 'Vendor').catch(() => null),
  ]);
  const set = new Set();
  (invCol?.column?.choice?.choices || []).forEach((c) => set.add(c));
  (poCol?.column?.choice?.choices || []).forEach((c) => set.add(c));
  return Array.from(set);
}

export async function addVendorChoice(newVendor) {
  // Add to both columns so the vendor is available everywhere
  const [invResult, poResult] = await Promise.allSettled([
    addChoiceToColumn(LIST_NAMES.inventory, 'PreferredVendor', newVendor),
    addChoiceToColumn(LIST_NAMES.purchaseOrders, 'Vendor', newVendor),
  ]);
  // Return the union of whichever succeeded
  const set = new Set();
  if (invResult.status === 'fulfilled') invResult.value.forEach((c) => set.add(c));
  if (poResult.status === 'fulfilled') poResult.value.forEach((c) => set.add(c));
  // If both failed, rethrow the first error
  if (invResult.status === 'rejected' && poResult.status === 'rejected') {
    throw invResult.reason;
  }
  return Array.from(set);
}

// --- Client Log ---

export async function getClientLogEntries(filters) {
  const siteId = await getSiteId();
  const listId = await getListId(LIST_NAMES.clientLog);
  const filterQuery = buildFilterQuery(filters);
  return graphFetch(
    `/sites/${siteId}/lists/${listId}/items?$expand=fields${filterQuery}`
  );
}

export async function createClientLogEntry(data) {
  const siteId = await getSiteId();
  const listId = await getListId(LIST_NAMES.clientLog);
  return graphFetch(`/sites/${siteId}/lists/${listId}/items`, {
    method: 'POST',
    body: { fields: data },
  });
}

// --- Purchase Orders ---

export async function getPurchaseOrders(filters) {
  const siteId = await getSiteId();
  const listId = await getListId(LIST_NAMES.purchaseOrders);
  const filterQuery = buildFilterQuery(filters);
  return graphFetch(
    `/sites/${siteId}/lists/${listId}/items?$expand=fields${filterQuery}`
  );
}

export async function createPurchaseOrder(data) {
  const siteId = await getSiteId();
  const listId = await getListId(LIST_NAMES.purchaseOrders);
  return graphFetch(`/sites/${siteId}/lists/${listId}/items`, {
    method: 'POST',
    body: { fields: data },
  });
}

export async function updatePurchaseOrder(id, data) {
  const siteId = await getSiteId();
  const listId = await getListId(LIST_NAMES.purchaseOrders);
  return graphFetch(`/sites/${siteId}/lists/${listId}/items/${id}/fields`, {
    method: 'PATCH',
    body: data,
  });
}

// --- Utility: clear cached IDs (use if site/list structure changes) ---

export function clearGraphCache() {
  localStorage.removeItem('magma_site_id');
  Object.values(LIST_NAMES).forEach((name) => {
    localStorage.removeItem(`magma_list_id_${name}`);
  });
}
