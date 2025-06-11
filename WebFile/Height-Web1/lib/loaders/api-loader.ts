// lib/loaders/api-loader.ts - Optimized API loading system
interface ApiConfig {
    baseUrl: string;
    timeout: number;
    retries: number;
    cache: boolean;
    cacheTimeout: number;
  }
  
  interface ApiResponse<T> {
    data: T;
    status: number;
    cached: boolean;
    responseTime: number;
  }
  
  interface QueuedRequest {
    url: string;
    options: RequestInit;
    resolve: (value: any) => void;
    reject: (error: any) => void;
    priority: number;
    timestamp: number;
  }
  
  export class ApiLoader {
    private config: ApiConfig;
    private cache = new Map<string, { data: any; timestamp: number; expiry: number }>();
    private requestQueue: QueuedRequest[] = [];
    private activeRequests = new Set<string>();
    private isProcessingQueue = false;
    private maxConcurrentRequests = 6;
    private requestStats = {
      total: 0,
      successful: 0,
      failed: 0,
      cached: 0,
      averageResponseTime: 0
    };
  
    constructor(config: Partial<ApiConfig> = {}) {
      this.config = {
        baseUrl: '',
        timeout: 30000,
        retries: 3,
        cache: true,
        cacheTimeout: 5 * 60 * 1000,
        ...config
      };
  
      // Start queue processor
      this.startQueueProcessor();
    }
  
    // Enhanced fetch with caching, retries, and queueing
    async fetch<T>(url: string, options: RequestInit = {}, priority = 5): Promise<ApiResponse<T>> {
      const fullUrl = this.config.baseUrl + url;
      const cacheKey = this.getCacheKey(fullUrl, options);
      const startTime = Date.now();
  
      // Check cache first
      if (this.config.cache && (options.method === 'GET' || !options.method)) {
        const cached = this.getFromCache<T>(cacheKey);
        if (cached) {
          this.requestStats.cached++;
          return {
            data: cached,
            status: 200,
            cached: true,
            responseTime: Date.now() - startTime
          };
        }
      }
  
      // Add to queue if not already processing
      if (this.activeRequests.size >= this.maxConcurrentRequests) {
        return new Promise((resolve, reject) => {
          this.requestQueue.push({
            url: fullUrl,
            options,
            resolve,
            reject,
            priority,
            timestamp: Date.now()
          });
          this.sortQueue();
        });
      }
  
      return this.executeRequest<T>(fullUrl, options, cacheKey, startTime);
    }
  
    // Execute individual request
    private async executeRequest<T>(
      url: string, 
      options: RequestInit, 
      cacheKey: string, 
      startTime: number
    ): Promise<ApiResponse<T>> {
      this.activeRequests.add(url);
      this.requestStats.total++;
  
      try {
        const response = await this.fetchWithRetry(url, options);
        const data = await response.json();
  
        // Cache successful GET requests
        if (this.config.cache && response.ok && (!options.method || options.method === 'GET')) {
          this.setCache(cacheKey, data);
        }
  
        const responseTime = Date.now() - startTime;
        this.updateAverageResponseTime(responseTime);
  
        if (response.ok) {
          this.requestStats.successful++;
          return {
            data,
            status: response.status,
            cached: false,
            responseTime
          };
        } else {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
  
      } catch (error) {
        this.requestStats.failed++;
        throw error;
      } finally {
        this.activeRequests.delete(url);
        this.processQueue();
      }
    }
  
    // Fetch with retry logic
    private async fetchWithRetry(url: string, options: RequestInit): Promise<Response> {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);
  
      const requestOptions: RequestInit = {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        }
      };
  
      let lastError: Error;
  
      for (let attempt = 1; attempt <= this.config.retries; attempt++) {
        try {
          const response = await fetch(url, requestOptions);
          clearTimeout(timeoutId);
          return response;
        } catch (error) {
          lastError = error as Error;
          console.error(`[ApiLoader] Request failed (attempt ${attempt}/${this.config.retries}):`, error);
  
          if (attempt < this.config.retries) {
            // Exponential backoff
            await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
          }
        }
      }
  
      clearTimeout(timeoutId);
      throw lastError!;
    }
  
    // Queue management
    private startQueueProcessor(): void {
      setInterval(() => {
        if (!this.isProcessingQueue && this.requestQueue.length > 0) {
          this.processQueue();
        }
      }, 100);
    }
  
    private async processQueue(): Promise<void> {
      if (this.isProcessingQueue || this.requestQueue.length === 0) return;
      if (this.activeRequests.size >= this.maxConcurrentRequests) return;
  
      this.isProcessingQueue = true;
  
      while (this.requestQueue.length > 0 && this.activeRequests.size < this.maxConcurrentRequests) {
        const request = this.requestQueue.shift()!;
        const cacheKey = this.getCacheKey(request.url, request.options);
        const startTime = Date.now();
  
        this.executeRequest(request.url, request.options, cacheKey, startTime)
          .then(request.resolve)
          .catch(request.reject);
      }
  
      this.isProcessingQueue = false;
    }
  
    private sortQueue(): void {
      this.requestQueue.sort((a, b) => {
        // Higher priority first, then older requests
        if (a.priority !== b.priority) {
          return b.priority - a.priority;
        }
        return a.timestamp - b.timestamp;
      });
    }
  
    // Cache management
    private getCacheKey(url: string, options: RequestInit): string {
      const method = options.method || 'GET';
      const body = options.body ? JSON.stringify(options.body) : '';
      return `${method}:${url}:${body}`;
    }
  
    private getFromCache<T>(key: string): T | null {
      const entry = this.cache.get(key);
      if (!entry) return null;
  
      if (Date.now() > entry.expiry) {
        this.cache.delete(key);
        return null;
      }
  
      return entry.data;
    }
  
    private setCache(key: string, data: any): void {
      this.cache.set(key, {
        data,
        timestamp: Date.now(),
        expiry: Date.now() + this.config.cacheTimeout
      });
    }
  
    // Batch API operations
    async batchFetch<T>(requests: Array<{ url: string; options?: RequestInit; priority?: number }>): Promise<Array<ApiResponse<T> | Error>> {
      const promises = requests.map(({ url, options = {}, priority = 5 }) =>
        this.fetch<T>(url, options, priority).catch(error => error)
      );
  
      return Promise.all(promises);
    }
  
    // Preload specific endpoints
    async preloadEndpoints(endpoints: string[]): Promise<void> {
      const promises = endpoints.map(endpoint => 
        this.fetch(endpoint, {}, 3).catch(() => null)
      );
      
      await Promise.allSettled(promises);
    }
  
    // Market data specific methods
    async loadMarketData(symbols: string[]): Promise<any[]> {
      const requests = symbols.map(symbol => ({
        url: `/api/market/${symbol}?type=crypto`,
        priority: 8
      }));
  
      const responses = await this.batchFetch(requests);
      return responses.filter(response => !(response instanceof Error)).map((response: any) => response.data);
    }
  
    // News data loading
    async loadNewsData(categories: string[] = ['business']): Promise<any[]> {
      const requests = categories.map(category => ({
        url: `/api/news?category=${category}&pageSize=10`,
        priority: 6
      }));
  
      const responses = await this.batchFetch(requests);
      return responses.filter(response => !(response instanceof Error)).map((response: any) => response.data);
    }
  
    // Portfolio data loading
    async loadPortfolioData(): Promise<{ holdings: any; orders: any; summary: any }> {
      const requests = [
        { url: '/api/portfolio?action=holdings', priority: 9 },
        { url: '/api/portfolio?action=orders', priority: 7 },
        { url: '/api/portfolio?action=summary', priority: 9 }
      ];
  
      const [holdingsRes, ordersRes, summaryRes] = await this.batchFetch(requests);
  
      return {
        holdings: holdingsRes instanceof Error ? [] : (holdingsRes as any).data.holdings,
        orders: ordersRes instanceof Error ? [] : (ordersRes as any).data.orders,
        summary: summaryRes instanceof Error ? {} : (summaryRes as any).data.summary
      };
    }
  
    // AI chat data
    async loadAiData(message: string, context?: any): Promise<any> {
      return this.fetch('/api/ai/chat', {
        method: 'POST',
        body: JSON.stringify({ message, context }),
      }, 10);
    }
  
    // Statistics and monitoring
    private updateAverageResponseTime(responseTime: number): void {
      const { averageResponseTime, successful } = this.requestStats;
      this.requestStats.averageResponseTime = 
        (averageResponseTime * (successful - 1) + responseTime) / successful;
    }
  
    getStats(): typeof this.requestStats & { cacheSize: number; queueSize: number; activeRequests: number } {
      return {
        ...this.requestStats,
        cacheSize: this.cache.size,
        queueSize: this.requestQueue.length,
        activeRequests: this.activeRequests.size
      };
    }
  
    // Cache utilities
    clearCache(pattern?: string): void {
      if (pattern) {
        const regex = new RegExp(pattern);
        this.cache.forEach((_, key) => {
          if (regex.test(key)) {
            this.cache.delete(key);
          }
        });
      } else {
        this.cache.clear();
      }
    }
  
    // Health check
    async healthCheck(): Promise<{ status: string; responseTime: number; apis: any[] }> {
      const startTime = Date.now();
      const apiChecks = [
        { name: 'News API', url: '/api/news?category=business&pageSize=1' },
        { name: 'Market API', url: '/api/market/BTC?type=crypto' },
        { name: 'Portfolio API', url: '/api/portfolio?action=summary' }
      ];
  
      const results = await Promise.allSettled(
        apiChecks.map(async ({ name, url }) => {
          try {
            const response = await this.fetch(url, {}, 10);
            return { name, status: 'healthy', responseTime: response.responseTime };
          } catch (error) {
            return { name, status: 'unhealthy', error: (error as Error).message };
          }
        })
      );
  
      const apis = results.map((result, index) => ({
        ...apiChecks[index],
        ...(result.status === 'fulfilled' ? result.value : { status: 'error', error: 'Promise rejected' })
      }));
  
      const overallStatus = apis.every(api => api.status === 'healthy') ? 'healthy' : 'degraded';
  
      return {
        status: overallStatus,
        responseTime: Date.now() - startTime,
        apis
      };
    }
  }
  
  // Export singleton instance
  export const apiLoader = new ApiLoader({
    baseUrl: '',
    timeout: 30000,
    retries: 3,
    cache: true,
    cacheTimeout: 5 * 60 * 1000
  });