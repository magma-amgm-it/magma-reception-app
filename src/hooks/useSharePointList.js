import { useState, useEffect, useCallback, useRef } from 'react';
import {
  getSupplyRequests,
  getInventoryItems,
  getClientLogEntries,
  getPurchaseOrders,
} from '../services/graphApi';

const LIST_FETCHERS = {
  supplyRequests: getSupplyRequests,
  inventory: getInventoryItems,
  clientLog: getClientLogEntries,
  purchaseOrders: getPurchaseOrders,
};

const REFRESH_INTERVAL = 60 * 1000; // 60 seconds

export function useSharePointList(listName, filters) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const intervalRef = useRef(null);

  const fetchData = useCallback(async () => {
    const fetcher = LIST_FETCHERS[listName];
    if (!fetcher) {
      setError(new Error(`Unknown list name: ${listName}`));
      setLoading(false);
      return;
    }

    try {
      setError(null);
      const result = await fetcher(filters);
      setData(result?.value || []);
      setLastUpdated(new Date().toISOString());
    } catch (err) {
      console.error(`Failed to fetch ${listName}:`, err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [listName, filters]);

  // Initial fetch and polling
  useEffect(() => {
    setLoading(true);
    fetchData();

    intervalRef.current = setInterval(fetchData, REFRESH_INTERVAL);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [fetchData]);

  const refresh = useCallback(() => {
    setLoading(true);
    return fetchData();
  }, [fetchData]);

  return { data, loading, error, refresh, lastUpdated };
}
