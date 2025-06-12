"use client";

import React, { createContext, useContext, ReactNode } from 'react';

interface LoaderState {
  isLoading: boolean;
  progress: number;
  currentTask: string;
}

interface LoaderContextType {
  state: LoaderState;
  preloadRoute: (route: string) => Promise<void>;
}

const LoaderContext = createContext<LoaderContextType | undefined>(undefined);

export function LoaderProvider({ children }: { children: ReactNode }) {
  const state: LoaderState = {
    isLoading: false,
    progress: 100,
    currentTask: 'Ready'
  };

  const preloadRoute = async (route: string) => {
    // Simple implementation for build
    console.log('Preloading route:', route);
  };

  const value: LoaderContextType = {
    state,
    preloadRoute
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
