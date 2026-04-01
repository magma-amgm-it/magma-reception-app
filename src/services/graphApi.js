import { getAccessToken } from './auth';

const GRAPH_BASE = 'https://graph.microsoft.com/v1.0';
const SHAREPOINT_SITE_URL = 'magmaamgmorg.sharepoint.com:/sites/Intake2/ReceptionInventoryManagement';

const LIST_NAMES = {
  supplyRequests: 'Supply Requests',
  inventory: 'Inventory',
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
