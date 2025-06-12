
  // hooks/useThrottle.ts
  import { useRef, useEffect, useCallback } from 'react';
  
  export function useThrottle<T extends (...args: any[]) => any>(
    callback: T,
    delay: number
  ): T {
    const lastRun = useRef(Date.now());
    
    return useCallback(
      (...args: Parameters<T>) => {
        if (Date.now() - lastRun.current >= delay) {
          lastRun.current = Date.now();
          return callback(...args);
        }
      },
      [callback, delay]
    ) as T;
  }