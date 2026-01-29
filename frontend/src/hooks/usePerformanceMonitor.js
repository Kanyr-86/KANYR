import { useEffect, useRef, useCallback } from 'react';

// Performance monitoring hook for tracking render times and API calls
export const usePerformanceMonitor = (componentName) => {
  const renderStartTime = useRef(null);
  const renderCount = useRef(0);
  const apiCallTimes = useRef(new Map());

  // Track render start
  useEffect(() => {
    renderStartTime.current = performance.now();
    renderCount.current += 1;
  });

  // Track render end and log performance
  useEffect(() => {
    if (renderStartTime.current) {
      const renderTime = performance.now() - renderStartTime.current;
      
      // Log slow renders (> 16ms for 60fps, > 32ms for 30fps)
      if (renderTime > 32) {
        console.warn(`${componentName} render time: ${renderTime.toFixed(2)}ms (render #${renderCount.current})`);
      }
    }
  });

  // Track API call performance
  const trackApiCall = useCallback((apiName, startTime, endTime) => {
    const duration = endTime - startTime;
    const existing = apiCallTimes.current.get(apiName) || { times: [], total: 0, count: 0 };
    
    existing.times.push(duration);
    existing.total += duration;
    existing.count += 1;
    existing.avg = existing.total / existing.count;
    
    apiCallTimes.current.set(apiName, existing);

    // Log slow API calls (> 1 second)
    if (duration > 1000) {
      console.warn(`${apiName} API call time: ${duration.toFixed(2)}ms`);
    }
  }, []);

  // Get performance statistics
  const getStats = useCallback(() => {
    const stats = {
      componentName,
      renderCount: renderCount.current,
      apiCalls: {}
    };

    for (const [apiName, data] of apiCallTimes.current.entries()) {
      stats.apiCalls[apiName] = {
        count: data.count,
        avg: data.avg.toFixed(2),
        min: Math.min(...data.times).toFixed(2),
        max: Math.max(...data.times).toFixed(2)
      };
    }

    return stats;
  }, [componentName]);

  // Clear performance data
  const clearStats = useCallback(() => {
    renderCount.current = 0;
    apiCallTimes.current.clear();
  }, []);

  return {
    trackApiCall,
    getStats,
    clearStats
  };
};

// Hook for tracking component mount/unmount times
export const useMountTime = (componentName) => {
  const mountTime = useRef(null);
  const unmountTime = useRef(null);

  useEffect(() => {
    mountTime.current = performance.now();
    return () => {
      unmountTime.current = performance.now();
      if (mountTime.current) {
        const lifetime = unmountTime.current - mountTime.current;
        console.log(`${componentName} lifetime: ${lifetime.toFixed(2)}ms`);
      }
    };
  }, [componentName]);
};

// Hook for tracking memory usage
export const useMemoryMonitor = () => {
  const memoryRef = useRef(null);

  useEffect(() => {
    const checkMemory = () => {
      if (performance.memory) {
        const memory = performance.memory;
        memoryRef.current = {
          used: Math.round(memory.usedJSHeapSize / 1048576), // MB
          total: Math.round(memory.totalJSHeapSize / 1048576), // MB
          limit: Math.round(memory.jsHeapSizeLimit / 1048576)  // MB
        };
      }
    };

    checkMemory();
    const interval = setInterval(checkMemory, 5000); // Check every 5 seconds

    return () => clearInterval(interval);
  }, []);

  return memoryRef.current;
};

// Hook for tracking virtualization performance
export const useVirtualizationMonitor = (itemCount, visibleItems) => {
  const renderTimeRef = useRef(null);
  const lastRenderTime = useRef(0);

  const trackRender = useCallback((renderTime) => {
    renderTimeRef.current = renderTime;
    lastRenderTime.current = performance.now();
  }, []);

  const getVirtualizationStats = useCallback(() => {
    return {
      totalItems: itemCount,
      visibleItems: visibleItems,
      renderTime: renderTimeRef.current,
      efficiency: visibleItems / itemCount
    };
  }, [itemCount, visibleItems]);

  return {
    trackRender,
    getVirtualizationStats
  };
};