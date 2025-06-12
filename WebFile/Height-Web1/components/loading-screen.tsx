"use client";

import React from 'react';
import { useLoader } from '@/contexts/loader-context';
import { Loader2 } from 'lucide-react';

interface LoadingScreenProps {
  showProgress?: boolean;
  showTasks?: boolean;
  showStats?: boolean;
  theme?: 'dark' | 'light';
  minimal?: boolean;
}

export function LoadingScreen({ minimal = false }: LoadingScreenProps) {
  const { state } = useLoader();

  // Don't show loading screen if not loading
  if (!state.isLoading) {
    return null;
  }

  if (minimal) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 text-primary mx-auto mb-2 animate-spin" />
          <p className="text-sm text-muted-foreground">{state.currentTask}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background">
      <div className="text-center">
        <Loader2 className="h-12 w-12 text-primary mx-auto mb-4 animate-spin" />
        <h2 className="text-lg font-semibold mb-2">Loading Heights...</h2>
        <p className="text-sm text-muted-foreground">{state.currentTask}</p>
      </div>
    </div>
  );
}