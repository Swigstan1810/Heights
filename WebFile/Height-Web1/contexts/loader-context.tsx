// contexts/loader-context.tsx - React context for loader system
"use client";

import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { appLoader } from '@/lib/loaders/app-loader';
import { apiLoader } from '@/lib/loaders/api-loader';
import { resourceLoader } from '@/lib/loaders/resource-loader';

interface LoaderState {
  isLoading: boolean;
  progress: number;
  currentTask: string;
  loadingStage: 'initializing' | 'loading-critical' | 'loading-page' | 'loading-assets' | 'complete' | 'error';
  errors: string[];
  completedTasks: string[];
  startTime: number;
  estimatedTimeRemaining: number;
}

interface LoaderStats {
  api: ReturnType<typeof apiLoader.getStats>;
  resources: ReturnType<typeof resourceLoader.getStats>;
  cache: ReturnType<typeof appLoader.getCacheStats>;
}

interface LoaderContextType {
  state: LoaderState;
  stats: LoaderStats;
  loadPage: (pageName: string, params?: any) => Promise<void>;
  preloadRoute: (route: string) => Promise<void>;
  clearCache: () => void;
  refreshData: () => Promise<void>;
  getHealthStatus: () => Promise<any>;
}

const LoaderContext = createContext<LoaderContextType | undefined>(undefined);

export function LoaderProvider({ children }: { children: ReactNode }) {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  
  const [state, setState] = useState<LoaderState>({
    isLoading: false,
    progress: 0,
    currentTask: '',
    loadingStage: 'initializing',
    errors: [],
    completedTasks: [],
    startTime: 0,
    estimatedTimeRemaining: 0
  });

  const [stats, setStats] = useState<LoaderStats>({
    api: apiLoader.getStats(),
    resources: resourceLoader.getStats(),
    cache: appLoader.getCacheStats()
  });

  // Initialize loaders
  useEffect(() => {
    const initializeLoaders = async () => {
      setState(prev => ({
        ...prev,
        isLoading: true,
        loadingStage: 'initializing',
        currentTask: 'Initializing application...',
        startTime: Date.now()
      }));

      try {
        // Set up app loader progress callback
        appLoader.onProgress((loaderState) => {
          setState(prev => ({
            ...prev,
            progress: loaderState.progress,
            currentTask: loaderState.currentTask,
            errors: loaderState.errors,
            completedTasks: loaderState.completedTasks,
            estimatedTimeRemaining: calculateTimeRemaining(loaderState.progress, prev.startTime)
          }));
        });

        // Load critical app data if user is authenticated
        if (isAuthenticated && user && !authLoading) {
          setState(prev => ({ ...prev, loadingStage: 'loading-critical' }));
          await appLoader.loadCriticalData(user.id);
          
          setState(prev => ({ ...prev, loadingStage: 'loading-assets' }));
          await resourceLoader.preloadCriticalComponents();
          await resourceLoader.preloadRoute(pathname);
        }

        setState(prev => ({
          ...prev,
          isLoading: false,
          loadingStage: 'complete',
          progress: 100,
          currentTask: 'Ready'
        }));

      } catch (error) {
        console.error('[LoaderProvider] Initialization failed:', error);
        setState(prev => ({
          ...prev,
          isLoading: false,
          loadingStage: 'error',
          errors: [...prev.errors, error instanceof Error ? error.message : 'Initialization failed']
        }));
      }
    };

    initializeLoaders();
  }, [isAuthenticated, user, authLoading, pathname]);

  // Update stats periodically
  useEffect(() => {
    const updateStats = () => {
      setStats({
        api: apiLoader.getStats(),
        resources: resourceLoader.getStats(),
        cache: appLoader.getCacheStats()
      });
    };

    const interval = setInterval(updateStats, 5000); // Update every 5 seconds
    return () => clearInterval(interval);
  }, []);

  // Calculate estimated time remaining
  const calculateTimeRemaining = (progress: number, startTime: number): number => {
    if (progress <= 0) return 0;
    const elapsed = Date.now() - startTime;
    const total = (elapsed / progress) * 100;
    return Math.max(0, total - elapsed);
  };

  // Load specific page data
  const loadPage = useCallback(async (pageName: string, params?: any): Promise<void> => {
    setState(prev => ({
      ...prev,
      isLoading: true,
      loadingStage: 'loading-page',
      currentTask: `Loading ${pageName} page...`,
      progress: 0,
      startTime: Date.now()
    }));

    try {
      // Preload page data and resources in parallel
      await Promise.all([
        appLoader.preloadPageData(pageName, params),
        resourceLoader.preloadPageResources(pageName)
      ]);

      setState(prev => ({
        ...prev,
        isLoading: false,
        loadingStage: 'complete',
        progress: 100,
        currentTask: `${pageName} loaded`
      }));

    } catch (error) {
      console.error(`[LoaderProvider] Failed to load page ${pageName}:`, error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        loadingStage: 'error',
        errors: [...prev.errors, `Failed to load ${pageName}: ${error instanceof Error ? error.message : 'Unknown error'}`]
      }));
    }
  }, []);

  // Preload route
  const preloadRoute = useCallback(async (route: string): Promise<void> => {
    try {
      await resourceLoader.preloadRoute(route);
      const routeParts = route.split('/').filter(Boolean);
      const pageName = routeParts[0] || 'home';
      await appLoader.preloadPageData(pageName, { userId: user?.id });
    } catch (error) {
      console.error(`[LoaderProvider] Failed to preload route ${route}:`, error);
    }
  }, [user?.id]);

  // Clear all caches
  const clearCache = useCallback(() => {
    appLoader.clearCache();
    apiLoader.clearCache();
    resourceLoader.clearCache();
    setStats({
      api: apiLoader.getStats(),
      resources: resourceLoader.getStats(),
      cache: appLoader.getCacheStats()
    });
  }, []);

  // Refresh data
  const refreshData = useCallback(async (): Promise<void> => {
    if (!user) return;

    setState(prev => ({
      ...prev,
      isLoading: true,
      loadingStage: 'loading-critical',
      currentTask: 'Refreshing data...',
      startTime: Date.now()
    }));

    try {
      // Clear caches first
      clearCache();
      
      // Reload critical data
      await appLoader.loadCriticalData(user.id);
      
      setState(prev => ({
        ...prev,
        isLoading: false,
        loadingStage: 'complete',
        progress: 100,
        currentTask: 'Data refreshed'
      }));

    } catch (error) {
      console.error('[LoaderProvider] Failed to refresh data:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        loadingStage: 'error',
        errors: [...prev.errors, error instanceof Error ? error.message : 'Failed to refresh data']
      }));
    }
  }, [user, clearCache]);

  // Get health status
  const getHealthStatus = useCallback(async () => {
    return await apiLoader.healthCheck();
  }, []);

  const value: LoaderContextType = {
    state,
    stats,
    loadPage,
    preloadRoute,
    clearCache,
    refreshData,
    getHealthStatus
  };

  return (
    <LoaderContext.Provider value={value}>
      {children}
    </LoaderContext.Provider>
  );
}

export function useLoader() {
  const context = useContext(LoaderContext);
  if (context === undefined) {
    throw new Error('useLoader must be used within a LoaderProvider');
  }
  return context;
}

// Hook for page-specific loading
export function usePageLoader(pageName: string, params?: any) {
  const { loadPage, state } = useLoader();
  const [hasLoaded, setHasLoaded] = useState(false);

  useEffect(() => {
    if (!hasLoaded) {
      loadPage(pageName, params);
      setHasLoaded(true);
    }
  }, [pageName, params, loadPage, hasLoaded]);

  return {
    isLoading: state.isLoading && state.loadingStage === 'loading-page',
    progress: state.progress,
    currentTask: state.currentTask,
    errors: state.errors
  };
}

// Hook for route preloading
export function useRoutePreloader() {
  const { preloadRoute } = useLoader();
  const router = useRouter();

  const preloadAndNavigate = useCallback(async (route: string) => {
    await preloadRoute(route);
    router.push(route);
  }, [preloadRoute, router]);

  return { preloadAndNavigate };
}