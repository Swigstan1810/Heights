// lib/loaders/app-loader.ts - Main application loader system
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/types/supabase';

interface LoaderConfig {
  enablePreloading: boolean;
  enableCaching: boolean;
  enablePrefetch: boolean;
  cacheTimeout: number;
  maxRetries: number;
  parallelLoading: boolean;
}

interface LoaderState {
  isLoading: boolean;
  progress: number;
  currentTask: string;
  errors: string[];
  completedTasks: string[];
  startTime: number;
}

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiry: number;
}

export class AppLoader {
  private config: LoaderConfig;
  private state: LoaderState;
  private cache = new Map<string, CacheEntry<any>>();
  private supabase;
  private onProgressCallback?: (state: LoaderState) => void;

  constructor(config: Partial<LoaderConfig> = {}) {
    this.config = {
      enablePreloading: true,
      enableCaching: true,
      enablePrefetch: true,
      cacheTimeout: 5 * 60 * 1000, // 5 minutes
      maxRetries: 3,
      parallelLoading: true,
      ...config
    };

    this.state = {
      isLoading: false,
      progress: 0,
      currentTask: '',
      errors: [],
      completedTasks: [],
      startTime: 0
    };

    this.supabase = createClientComponentClient<Database>();
  }

  // Set progress callback
  onProgress(callback: (state: LoaderState) => void) {
    this.onProgressCallback = callback;
  }

  // Update loading state
  private updateState(updates: Partial<LoaderState>) {
    this.state = { ...this.state, ...updates };
    this.onProgressCallback?.(this.state);
  }

  // Cache management
  private setCache<T>(key: string, data: T, customTimeout?: number): void {
    if (!this.config.enableCaching) return;
    
    const timeout = customTimeout || this.config.cacheTimeout;
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      expiry: Date.now() + timeout
    });
  }

  private getCache<T>(key: string): T | null {
    if (!this.config.enableCaching) return null;
    
    const entry = this.cache.get(key);
    if (!entry) return null;
    
    if (Date.now() > entry.expiry) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data as T;
  }

  // Retry mechanism
  private async withRetry<T>(
    operation: () => Promise<T>,
    taskName: string,
    retries = this.config.maxRetries
  ): Promise<T> {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        console.error(`[AppLoader] ${taskName} failed (attempt ${attempt}/${retries}):`, error);
        
        if (attempt === retries) {
          const errorMsg = `${taskName} failed after ${retries} attempts`;
          this.state.errors.push(errorMsg);
          throw new Error(errorMsg);
        }
        
        // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }
    }
    throw new Error('Retry logic failed');
  }

  // Load critical app data
  async loadCriticalData(userId?: string): Promise<boolean> {
    this.updateState({
      isLoading: true,
      progress: 0,
      startTime: Date.now(),
      errors: [],
      completedTasks: [],
      currentTask: 'Initializing...'
    });

    const tasks = [
      { name: 'User Profile', loader: () => this.loadUserProfile(userId) },
      { name: 'Market Data', loader: () => this.loadMarketData() },
      { name: 'News Data', loader: () => this.loadNewsData() },
      { name: 'Portfolio Data', loader: () => this.loadPortfolioData(userId) },
      { name: 'App Metadata', loader: () => this.loadAppMetadata() }
    ];

    try {
      if (this.config.parallelLoading) {
        await this.loadTasksParallel(tasks);
      } else {
        await this.loadTasksSequential(tasks);
      }

      this.updateState({
        isLoading: false,
        progress: 100,
        currentTask: 'Complete'
      });

      console.log(`[AppLoader] Loading completed in ${Date.now() - this.state.startTime}ms`);
      return true;

    } catch (error) {
      console.error('[AppLoader] Critical loading failed:', error);
      this.updateState({
        isLoading: false,
        currentTask: 'Failed'
      });
      return false;
    }
  }

  // Load tasks in parallel
  private async loadTasksParallel(tasks: Array<{ name: string; loader: () => Promise<any> }>) {
    const promises = tasks.map(async (task, index) => {
      try {
        this.updateState({ currentTask: task.name });
        const result = await this.withRetry(task.loader, task.name);
        this.state.completedTasks.push(task.name);
        this.updateState({
          progress: ((index + 1) / tasks.length) * 100
        });
        return result;
      } catch (error) {
        console.error(`[AppLoader] Task ${task.name} failed:`, error);
        throw error;
      }
    });

    await Promise.allSettled(promises);
  }

  // Load tasks sequentially
  private async loadTasksSequential(tasks: Array<{ name: string; loader: () => Promise<any> }>) {
    for (let i = 0; i < tasks.length; i++) {
      const task = tasks[i];
      try {
        this.updateState({ currentTask: task.name });
        await this.withRetry(task.loader, task.name);
        this.state.completedTasks.push(task.name);
        this.updateState({
          progress: ((i + 1) / tasks.length) * 100
        });
      } catch (error) {
        console.error(`[AppLoader] Task ${task.name} failed:`, error);
        // Continue with other tasks even if one fails
      }
    }
  }

  // Load user profile
  private async loadUserProfile(userId?: string): Promise<any> {
    if (!userId) return null;

    const cacheKey = `profile_${userId}`;
    const cached = this.getCache(cacheKey);
    if (cached) return cached;

    const { data, error } = await this.supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) throw error;

    this.setCache(cacheKey, data);
    return data;
  }

  // Load market data
  private async loadMarketData(): Promise<any> {
    const cacheKey = 'market_data_overview';
    const cached = this.getCache(cacheKey);
    if (cached) return cached;

    // Load popular symbols
    const symbols = ['CRYPTO:BTC', 'CRYPTO:ETH', 'CRYPTO:SOL'];
    const marketPromises = symbols.map(async (symbol) => {
      try {
        const response = await fetch(`/api/market/${symbol}?type=crypto`);
        if (!response.ok) throw new Error(`Failed to fetch ${symbol}`);
        return await response.json();
      } catch (error) {
        console.error(`Failed to load market data for ${symbol}:`, error);
        return null;
      }
    });

    const marketData = await Promise.allSettled(marketPromises);
    const successfulData = marketData
      .filter(result => result.status === 'fulfilled' && result.value)
      .map(result => (result as PromiseFulfilledResult<any>).value);

    this.setCache(cacheKey, successfulData, 60000); // 1 minute cache
    return successfulData;
  }

  // Load news data
  private async loadNewsData(): Promise<any> {
    const cacheKey = 'news_data_overview';
    const cached = this.getCache(cacheKey);
    if (cached) return cached;

    try {
      const response = await fetch('/api/news?category=business&pageSize=10');
      if (!response.ok) throw new Error('Failed to fetch news');
      
      const newsData = await response.json();
      this.setCache(cacheKey, newsData, 300000); // 5 minutes cache
      return newsData;
    } catch (error) {
      console.error('Failed to load news data:', error);
      return null;
    }
  }

  // Load portfolio data
  private async loadPortfolioData(userId?: string): Promise<any> {
    if (!userId) return null;

    const cacheKey = `portfolio_${userId}`;
    const cached = this.getCache(cacheKey);
    if (cached) return cached;

    try {
      const [holdingsResponse, summaryResponse] = await Promise.all([
        fetch('/api/portfolio?action=holdings'),
        fetch('/api/portfolio?action=summary')
      ]);

      const [holdings, summary] = await Promise.all([
        holdingsResponse.ok ? holdingsResponse.json() : { holdings: [] },
        summaryResponse.ok ? summaryResponse.json() : { summary: {} }
      ]);

      const portfolioData = { holdings: holdings.holdings || [], summary: summary.summary || {} };
      this.setCache(cacheKey, portfolioData, 120000); // 2 minutes cache
      return portfolioData;
    } catch (error) {
      console.error('Failed to load portfolio data:', error);
      return null;
    }
  }

  // Load app metadata
  private async loadAppMetadata(): Promise<any> {
    const cacheKey = 'app_metadata';
    const cached = this.getCache(cacheKey);
    if (cached) return cached;

    const metadata = {
      version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
      features: ['trading', 'portfolio', 'ai-assistant', 'news'],
      apis: {
        status: 'operational',
        lastCheck: new Date().toISOString()
      },
      maintenance: false
    };

    this.setCache(cacheKey, metadata, 3600000); // 1 hour cache
    return metadata;
  }

  // Preload page data
  async preloadPageData(pageName: string, params?: any): Promise<void> {
    if (!this.config.enablePreloading) return;

    try {
      switch (pageName) {
        case 'dashboard':
          await this.preloadDashboard(params?.userId);
          break;
        case 'portfolio':
          await this.preloadPortfolio(params?.userId);
          break;
        case 'crypto':
          await this.preloadCrypto();
          break;
        case 'news':
          await this.preloadNews();
          break;
        default:
          console.log(`[AppLoader] No preloader defined for page: ${pageName}`);
      }
    } catch (error) {
      console.error(`[AppLoader] Failed to preload ${pageName}:`, error);
    }
  }

  // Preload dashboard data
  private async preloadDashboard(userId?: string): Promise<void> {
    await Promise.allSettled([
      this.loadUserProfile(userId),
      this.loadPortfolioData(userId),
      this.loadMarketData(),
      this.loadNewsData()
    ]);
  }

  // Preload portfolio data
  private async preloadPortfolio(userId?: string): Promise<void> {
    await Promise.allSettled([
      this.loadPortfolioData(userId),
      this.loadMarketData()
    ]);
  }

  // Preload crypto data
  private async preloadCrypto(): Promise<void> {
    const symbols = ['CRYPTO:BTC', 'CRYPTO:ETH', 'CRYPTO:SOL', 'CRYPTO:MATIC', 'CRYPTO:LINK', 'CRYPTO:AVAX'];
    const promises = symbols.map(symbol => 
      fetch(`/api/market/${symbol}?type=crypto`).catch(() => null)
    );
    await Promise.allSettled(promises);
  }

  // Preload news data
  private async preloadNews(): Promise<void> {
    const categories = ['business', 'cryptocurrency', 'technology'];
    const promises = categories.map(category =>
      fetch(`/api/news?category=${category}&pageSize=5`).catch(() => null)
    );
    await Promise.allSettled(promises);
  }

  // Get cache statistics
  getCacheStats(): { size: number; entries: Array<{ key: string; size: number; age: number }> } {
    const entries = Array.from(this.cache.entries()).map(([key, entry]) => ({
      key,
      size: JSON.stringify(entry.data).length,
      age: Date.now() - entry.timestamp
    }));

    return {
      size: entries.reduce((sum, entry) => sum + entry.size, 0),
      entries
    };
  }

  // Clear cache
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

  // Get loading state
  getState(): LoaderState {
    return { ...this.state };
  }

  // Check if loader is busy
  isLoading(): boolean {
    return this.state.isLoading;
  }
}

// Export singleton instance
export const appLoader = new AppLoader({
  enablePreloading: true,
  enableCaching: true,
  enablePrefetch: true,
  cacheTimeout: 5 * 60 * 1000,
  maxRetries: 3,
  parallelLoading: true
});