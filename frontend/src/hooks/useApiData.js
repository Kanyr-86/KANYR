import { useState, useEffect, useCallback } from 'react';
import useApiCache from './useApiCache';

const useApiData = (apiCall, dependencies = [], options = {}) => {
  const { useCache = true, shouldInvalidateCache = false, keyPrefix = '' } = options;
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const { fetchData, invalidateCache: invalidateCacheFn } = useApiCache();

  const fetchDataWithCache = useCallback(async () => {
    if (!apiCall) return;

    setLoading(true);
    setError(null);

    try {
      const cacheKey = `${keyPrefix}_${JSON.stringify(dependencies)}`;
      
      const result = await fetchData(cacheKey, async (signal) => {
        const response = await apiCall();
        if (signal.aborted) {
          throw new Error('Request aborted');
        }
        return response.data;
      }, { useCache, invalidateCache: shouldInvalidateCache });

      if (result) {
        setData(result);
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  }, [apiCall, dependencies, fetchData, useCache, invalidateCache, keyPrefix]);

  useEffect(() => {
    fetchDataWithCache();
  }, [fetchDataWithCache]);

  const refetch = useCallback(() => {
    fetchDataWithCache();
  }, [fetchDataWithCache]);

  const invalidateCache = useCallback(() => {
    invalidateCacheFn(keyPrefix);
  }, [invalidateCacheFn, keyPrefix]);

  return {
    data,
    loading,
    error,
    refetch,
    invalidateCache
  };
};

export default useApiData;