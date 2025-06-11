// components/loading-screen.tsx - Enhanced loading screen component
"use client";

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLoader } from '@/contexts/loader-context';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { 
  Loader2, 
  CheckCircle, 
  AlertCircle, 
  Zap, 
  Rocket, 
  TrendingUp,
  Activity,
  Shield,
  Globe,
  RefreshCw
} from 'lucide-react';

interface LoadingScreenProps {
  showProgress?: boolean;
  showTasks?: boolean;
  showStats?: boolean;
  theme?: 'dark' | 'light';
  minimal?: boolean;
}

export function LoadingScreen({ 
  showProgress = true, 
  showTasks = true, 
  showStats = false,
  theme = 'dark',
  minimal = false
}: LoadingScreenProps) {
  const { state, stats, refreshData, clearCache } = useLoader();
  const [showDetails, setShowDetails] = useState(false);
  const [tipIndex, setTipIndex] = useState(0);

  const tips = [
    "Heights uses real-time data from Coinbase and other premium sources",
    "Our AI assistant can help analyze market trends and make predictions",
    "Portfolio tracking includes automatic P&L calculations",
    "News sentiment analysis helps you understand market psychology",
    "All your data is encrypted and stored securely",
    "Dark mode is optimized for extended trading sessions"
  ];

  // Rotate tips every 3 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setTipIndex((prev) => (prev + 1) % tips.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [tips.length]);

  // Auto-hide loading screen when complete
  useEffect(() => {
    if (state.loadingStage === 'complete' && !minimal) {
      const timer = setTimeout(() => {
        // Additional cleanup can be done here
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [state.loadingStage, minimal]);

  const getStageIcon = () => {
    switch (state.loadingStage) {
      case 'initializing':
        return <Rocket className="h-8 w-8 text-blue-500" />;
      case 'loading-critical':
        return <Zap className="h-8 w-8 text-yellow-500" />;
      case 'loading-page':
        return <Activity className="h-8 w-8 text-green-500" />;
      case 'loading-assets':
        return <Globe className="h-8 w-8 text-purple-500" />;
      case 'complete':
        return <CheckCircle className="h-8 w-8 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-8 w-8 text-red-500" />;
      default:
        return <Loader2 className="h-8 w-8 text-primary animate-spin" />;
    }
  };

  const getStageMessage = () => {
    switch (state.loadingStage) {
      case 'initializing':
        return 'Starting Heights Trading Platform...';
      case 'loading-critical':
        return 'Loading your trading data...';
      case 'loading-page':
        return 'Preparing your workspace...';
      case 'loading-assets':
        return 'Optimizing resources...';
      case 'complete':
        return 'Welcome to Heights!';
      case 'error':
        return 'Something went wrong...';
      default:
        return 'Loading...';
    }
  };

  const formatTime = (ms: number) => {
    if (ms < 1000) return `${Math.round(ms)}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  if (minimal) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          >
            <Loader2 className="h-8 w-8 text-primary mx-auto mb-2" />
          </motion.div>
          <p className="text-sm text-muted-foreground">{state.currentTask}</p>
        </motion.div>
      </div>
    );
  }

  return (
    <AnimatePresence>
      {(state.isLoading || state.loadingStage === 'error') && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className={`fixed inset-0 z-50 flex items-center justify-center ${
            theme === 'dark' ? 'bg-background' : 'bg-white'
          }`}
        >
          {/* Background Animation */}
          <div className="absolute inset-0 overflow-hidden">
            <motion.div
              className="absolute top-20 left-[10%] w-96 h-96 bg-gradient-to-r from-primary/10 to-blue-600/10 rounded-full blur-3xl"
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.3, 0.6, 0.3],
              }}
              transition={{
                duration: 8,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
            <motion.div
              className="absolute bottom-20 right-[10%] w-80 h-80 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-full blur-3xl"
              animate={{
                scale: [1.2, 1, 1.2],
                opacity: [0.2, 0.5, 0.2],
              }}
              transition={{
                duration: 10,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
          </div>

          <div className="relative z-10 w-full max-w-md mx-auto p-8">
            {/* Logo and Title */}
            <motion.div
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6 }}
              className="text-center mb-8"
            >
              <motion.div
                animate={{ 
                  scale: [1, 1.05, 1],
                  filter: ['hue-rotate(0deg)', 'hue-rotate(20deg)', 'hue-rotate(0deg)']
                }}
                transition={{ duration: 3, repeat: Infinity }}
                className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-primary to-blue-600 rounded-2xl flex items-center justify-center"
              >
                <TrendingUp className="h-8 w-8 text-white" />
              </motion.div>
              <h1 className="text-2xl font-bold mb-2">Heights</h1>
              <p className="text-muted-foreground">Trading Platform</p>
            </motion.div>

            {/* Stage Indicator */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="flex items-center justify-center mb-6"
            >
              <motion.div
                key={state.loadingStage}
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ duration: 0.5, type: "spring" }}
                className="relative"
              >
                {getStageIcon()}
                {state.loadingStage === 'loading-critical' && (
                  <motion.div
                    className="absolute inset-0 rounded-full border-2 border-yellow-500"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  />
                )}
              </motion.div>
            </motion.div>

            {/* Stage Message */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="text-center mb-6"
            >
              <h2 className="text-lg font-semibold mb-2">{getStageMessage()}</h2>
              <motion.p
                key={state.currentTask}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-sm text-muted-foreground"
              >
                {state.currentTask}
              </motion.p>
            </motion.div>

            {/* Progress Bar */}
            {showProgress && state.isLoading && (
              <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 0.5, delay: 0.6 }}
                className="mb-6"
              >
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">Progress</span>
                  <span className="text-sm text-muted-foreground">
                    {Math.round(state.progress)}%
                  </span>
                </div>
                <Progress value={state.progress} className="h-2" />
                {state.estimatedTimeRemaining > 0 && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Est. {formatTime(state.estimatedTimeRemaining)} remaining
                  </p>
                )}
              </motion.div>
            )}

            {/* Tasks List */}
            {showTasks && state.completedTasks.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.8 }}
                className="mb-6"
              >
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {state.completedTasks.slice(-3).map((task, index) => (
                    <motion.div
                      key={task}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-center gap-2 text-sm"
                    >
                      <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                      <span className="text-muted-foreground">{task}</span>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Error State */}
            {state.loadingStage === 'error' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center space-y-4"
              >
                <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                  <h3 className="font-semibold text-red-700 dark:text-red-400 mb-2">
                    Loading Failed
                  </h3>
                  <div className="space-y-1">
                    {state.errors.map((error, index) => (
                      <p key={index} className="text-sm text-red-600 dark:text-red-300">
                        {error}
                      </p>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button onClick={refreshData} variant="outline" size="sm">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Retry
                  </Button>
                  <Button onClick={clearCache} variant="outline" size="sm">
                    Clear Cache
                  </Button>
                </div>
              </motion.div>
            )}

            {/* Loading Tips */}
            {state.isLoading && state.loadingStage !== 'error' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 1 }}
                className="text-center"
              >
                <div className="p-4 bg-muted/50 rounded-lg">
                  <motion.p
                    key={tipIndex}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="text-sm text-muted-foreground"
                  >
                    💡 {tips[tipIndex]}
                  </motion.p>
                </div>
              </motion.div>
            )}

            {/* Debug Info Toggle */}
            {showStats && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.2 }}
                className="mt-6"
              >
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowDetails(!showDetails)}
                  className="w-full text-xs"
                >
                  {showDetails ? 'Hide' : 'Show'} Details
                </Button>
                
                <AnimatePresence>
                  {showDetails && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-4 p-3 bg-muted/30 rounded text-xs space-y-2"
                    >
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <span className="font-medium">API Requests:</span>
                          <div className="text-muted-foreground">
                            Total: {stats.api.total}<br />
                            Cached: {stats.api.cached}<br />
                            Failed: {stats.api.failed}
                          </div>
                        </div>
                        <div>
                          <span className="font-medium">Resources:</span>
                          <div className="text-muted-foreground">
                            Loaded: {stats.resources.loadedResources}<br />
                            Progress: {Math.round(stats.resources.loadingProgress)}%<br />
                            Components: {stats.resources.cachedComponents}
                          </div>
                        </div>
                      </div>
                      <div>
                        <span className="font-medium">Cache Size:</span>
                        <span className="text-muted-foreground ml-2">
                          {Math.round(stats.cache.size / 1024)}KB ({stats.cache.entries.length} entries)
                        </span>
                      </div>
                      {state.startTime > 0 && (
                        <div>
                          <span className="font-medium">Loading Time:</span>
                          <span className="text-muted-foreground ml-2">
                            {formatTime(Date.now() - state.startTime)}
                          </span>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}

            {/* Success Animation */}
            {state.loadingStage === 'complete' && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: [0, 1.2, 1] }}
                transition={{ duration: 0.6, times: [0, 0.6, 1] }}
                className="text-center"
              >
                <motion.div
                  animate={{ 
                    boxShadow: [
                      '0 0 0 0 rgba(34, 197, 94, 0.7)',
                      '0 0 0 20px rgba(34, 197, 94, 0)',
                      '0 0 0 0 rgba(34, 197, 94, 0)'
                    ]
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="w-16 h-16 mx-auto mb-4 bg-green-500 rounded-full flex items-center justify-center"
                >
                  <CheckCircle className="h-8 w-8 text-white" />
                </motion.div>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="text-green-600 dark:text-green-400 font-medium"
                >
                  Ready to trade! 🚀
                </motion.p>
              </motion.div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}