// components/network-status.tsx
"use client";

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { WifiOff, Wifi, AlertCircle } from 'lucide-react';
import { useNetworkStatus } from '@/hooks/use-performance';

export function NetworkStatusBar() {
  const { isOnline, connectionType } = useNetworkStatus();
  const [showOfflineMessage, setShowOfflineMessage] = useState(false);
  const [showSlowConnectionWarning, setShowSlowConnectionWarning] = useState(false);

  useEffect(() => {
    if (!isOnline) {
      setShowOfflineMessage(true);
    } else {
      // Hide message after 2 seconds when back online
      const timer = setTimeout(() => {
        setShowOfflineMessage(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isOnline]);

  useEffect(() => {
    // Show slow connection warning if connectionType is '2g' or 'slow-2g'
    if (isOnline && (connectionType === '2g' || connectionType === 'slow-2g')) {
      setShowSlowConnectionWarning(true);
    } else {
      setShowSlowConnectionWarning(false);
    }
  }, [isOnline, connectionType]);

  return (
    <div className="fixed top-0 left-0 w-full z-50 pointer-events-none">
      <AnimatePresence>
        {showOfflineMessage && (
          <motion.div
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -50, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-red-600 text-white flex items-center gap-2 px-4 py-2 justify-center shadow-md pointer-events-auto"
            role="alert"
          >
            <WifiOff className="w-5 h-5" />
            <span>You are offline. Some features may not be available.</span>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showSlowConnectionWarning && !showOfflineMessage && (
          <motion.div
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -50, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-yellow-500 text-black flex items-center gap-2 px-4 py-2 justify-center shadow-md pointer-events-auto"
            role="alert"
          >
            <AlertCircle className="w-5 h-5" />
            <span>Your connection is slow. Some features may be degraded.</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
