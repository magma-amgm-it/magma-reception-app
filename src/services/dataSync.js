import {
  getSupplyRequests,
  getInventoryItems,
  getClientLogEntries,
  getPurchaseOrders,
} from './graphApi';

const ACTIVE_INTERVAL = 60 * 1000;   // 60 seconds when tab is visible
const HIDDEN_INTERVAL = 300 * 1000;  // 5 minutes when tab is hidden

export function createDataSyncManager(onDataUpdate, onError) {
  let intervalId = null;
  let currentInterval = ACTIVE_INTERVAL;
  let isRunning = false;

  async function fetchAllData() {
    try {
      const [supplyRes, inventoryRes, clientLogRes, purchaseOrdersRes] =
        await Promise.all([
          getSupplyRequests(),
          getInventoryItems(),
          getClientLogEntries(),
          getPurchaseOrders(),
        ]);

      const data = {
        supplyRequests: supplyRes?.value || [],
        inventory: inventoryRes?.value || [],
        clientLog: clientLogRes?.value || [],
        purchaseOrders: purchaseOrdersRes?.value || [],
        lastUpdated: new Date().toISOString(),
      };

      onDataUpdate(data);
      return data;
    } catch (error) {
      console.error('Data sync failed:', error);
      if (onError) onError(error);
      throw error;
    }
  }

  function startPolling() {
    if (isRunning) return;
    isRunning = true;

    // Initial fetch
    fetchAllData();

    // Set up interval
    currentInterval = document.hidden ? HIDDEN_INTERVAL : ACTIVE_INTERVAL;
    intervalId = setInterval(fetchAllData, currentInterval);

    // Adjust interval when tab visibility changes
    document.addEventListener('visibilitychange', handleVisibilityChange);
  }

  function stopPolling() {
    isRunning = false;
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }
    document.removeEventListener('visibilitychange', handleVisibilityChange);
  }

  function handleVisibilityChange() {
    const newInterval = document.hidden ? HIDDEN_INTERVAL : ACTIVE_INTERVAL;
    if (newInterval !== currentInterval) {
      currentInterval = newInterval;
      // Restart interval with new timing
      if (intervalId) clearInterval(intervalId);
      intervalId = setInterval(fetchAllData, currentInterval);

      // If tab became visible again, fetch immediately
      if (!document.hidden) {
        fetchAllData();
      }
    }
  }

  function manualRefresh() {
    return fetchAllData();
  }

  return {
    startPolling,
    stopPolling,
    manualRefresh,
  };
}
