// utils/performance.ts
// Utility functions for performance optimization

/**
 * Debounce function to limit function calls
 */
export function debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number
  ): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout | null = null;
    
    return function executedFunction(...args: Parameters<T>) {
      const later = () => {
        timeout = null;
        func(...args);
      };
      
      if (timeout) clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }
  
  /**
   * Throttle function to limit function execution rate
   */
  export function throttle<T extends (...args: any[]) => any>(
    func: T,
    limit: number
  ): (...args: Parameters<T>) => void {
    let inThrottle = false;
    
    return function(...args: Parameters<T>) {
      if (!inThrottle) {
        func(...args);
        inThrottle = true;
        setTimeout(() => (inThrottle = false), limit);
      }
    };
  }
  
  /**
   * Lazy load images with Intersection Observer
   */
  export function lazyLoadImages() {
    if (typeof window === 'undefined') return;
    
    const images = document.querySelectorAll('img[data-src]');
    
    const imageObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target as HTMLImageElement;
          img.src = img.dataset.src || '';
          img.removeAttribute('data-src');
          observer.unobserve(img);
        }
      });
    });
    
    images.forEach(img => imageObserver.observe(img));
  }
  
  /**
   * Preload critical resources
   */
  export function preloadCriticalResources(resources: string[]) {
    if (typeof window === 'undefined') return;
    
    resources.forEach(resource => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.href = resource;
      
      // Determine resource type
      if (resource.endsWith('.css')) {
        link.as = 'style';
      } else if (resource.endsWith('.js')) {
        link.as = 'script';
      } else if (/\.(woff2?|ttf|otf)$/.test(resource)) {
        link.as = 'font';
        link.crossOrigin = 'anonymous';
      } else if (/\.(jpg|jpeg|png|webp|avif)$/.test(resource)) {
        link.as = 'image';
      }
      
      document.head.appendChild(link);
    });
  }
  
  /**
   * Request idle callback polyfill
   */
  export const requestIdleCallback =
    (typeof window !== 'undefined' && window.requestIdleCallback)
      ? window.requestIdleCallback.bind(window)
      : function (cb: IdleRequestCallback) {
          const start = Date.now();
          return setTimeout(function () {
            cb({
              didTimeout: false,
              timeRemaining: function () {
                return Math.max(0, 50 - (Date.now() - start));
              },
            } as IdleDeadline);
          }, 1);
        };
  
  /**
   * Cancel idle callback polyfill
   */
  export const cancelIdleCallback =
    (typeof window !== 'undefined' && window.cancelIdleCallback)
      ? window.cancelIdleCallback.bind(window)
      : function (id: number) {
          clearTimeout(id);
        };
  