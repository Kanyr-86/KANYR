import { useState, useCallback, useRef } from 'react';

// Simple cache implementation with TTL
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

const useApiCache = () => {
  const abortControllers = useRef(new Map());

  const getCachedData = useCallback((key) => {
    const cached = cache.get(key);
    if (cached) {
      const now = Date.now();
      if (now - cached.timestamp < CACHE_TTL) {
        return cached.data;
      } else {
        cache.delete(key);
      }
    }
    return null;
  }, []);

  const setCachedData = useCallback((key, data) => {
    cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }, []);

  const clearCache = useCallback((pattern = null) => {
    if (pattern) {
      for (const key of cache.keys()) {
        if (key.includes(pattern)) {
          cache.delete(key);
        }
      }
    } else {
      cache.clear();
    }
  }, []);

  const fetchData = useCallback(async (key, fetchFunction, options = {}) => {
    const { useCache = true, invalidateCache = false } = options;

    // Cancel previous request if exists
    if (abortControllers.current.has(key)) {
      abortControllers.current.get(key).abort();
    }

    // Create new abort controller
    const abortController = new AbortController();
    abortControllers.current.set(key, abortController);

    try {
      // Check cache first (unless invalidating)
      if (useCache && !invalidateCache) {
        const cachedData = getCachedData(key);
        if (cachedData) {
          return cachedData;
        }
      }

      // Fetch data
      const data = await fetchFunction(abortController.signal);
      
      // Cache the result if not aborted and not invalidating
      if (!abortController.signal.aborted && useCache && !invalidateCache) {
        setCachedData(key, data);
      }

      return data;
    } catch (error) {
      if (error.name !== 'AbortError') {
        throw error;
      }
      return null;
    } finally {
      abortControllers.current.delete(key);
    }
  }, [getCachedData, setCachedData]);

  const invalidateCache = useCallback((pattern) => {
    clearCache(pattern);
  }, [clearCache]);

  return {
    fetchData,
    invalidateCache,
    clearCache
  };
};

export default useApiCache;