// components/layout/mobile-layout-wrapper.tsx
"use client";

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface MobileLayoutWrapperProps {
  children: React.ReactNode;
  className?: string;
  enableViewportHeight?: boolean;
  enableScrollOptimization?: boolean;
  enableTouchOptimization?: boolean;
}

export function MobileLayoutWrapper({
  children,
  className,
  enableViewportHeight = true,
  enableScrollOptimization = true,
  enableTouchOptimization = true
}: MobileLayoutWrapperProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [viewportHeight, setViewportHeight] = useState(0);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    const handleViewportChange = () => {
      if (enableViewportHeight) {
        const vh = window.innerHeight * 0.01;
        document.documentElement.style.setProperty('--vh', `${vh}px`);
        setViewportHeight(window.innerHeight);
      }
    };

    const handleOrientationChange = () => {
      // Delay to ensure viewport dimensions are updated
      setTimeout(handleViewportChange, 100);
    };

    // Initial setup
    checkMobile();
    handleViewportChange();

    // Event listeners
    window.addEventListener('resize', checkMobile);
    window.addEventListener('resize', handleViewportChange);
    window.addEventListener('orientationchange', handleOrientationChange);

    // Touch optimization
    if (enableTouchOptimization && isMobile) {
      document.body.style.touchAction = 'manipulation';
      document.body.style.webkitUserSelect = 'none';
      document.body.style.userSelect = 'none';
    }

    // Scroll optimization
    if (enableScrollOptimization) {
      document.body.style.overscrollBehavior = 'contain';
      (document.body.style as any)['webkitOverflowScrolling'] = 'touch';
    }

    return () => {
      window.removeEventListener('resize', checkMobile);
      window.removeEventListener('resize', handleViewportChange);
      window.removeEventListener('orientationchange', handleOrientationChange);
    };
  }, [enableViewportHeight, enableScrollOptimization, enableTouchOptimization, isMobile]);

  // Prevent flash of unstyled content
  if (!isClient) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className={cn(
        "min-h-screen bg-black text-white relative overflow-x-hidden",
        // Mobile-specific optimizations
        isMobile && [
          "touch-manipulation",
          "select-none",
          "overscroll-contain"
        ],
        // Viewport height handling
        enableViewportHeight && "min-h-screen-mobile",
        className
      )}
      style={{
        ...(enableViewportHeight && isMobile && {
          minHeight: `calc(var(--vh, 1vh) * 100)`
        })
      }}
    >
      {/* Global background elements */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        {/* Base gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-black to-blue-500/5" />
        
        {/* Grid pattern */}
        <div 
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `
              linear-gradient(rgba(16, 185, 129, 0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(16, 185, 129, 0.1) 1px, transparent 1px)
            `,
            backgroundSize: isMobile ? '30px 30px' : '50px 50px'
          }}
        />
        
        {/* Animated orbs - reduced on mobile for performance */}
        {!isMobile && (
          <>
            <motion.div
              className="absolute top-20 left-[10%] w-96 h-96 bg-gradient-to-r from-emerald-500/10 to-blue-500/10 rounded-full blur-3xl"
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.3, 0.6, 0.3],
                x: [0, 50, 0],
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
                x: [0, -30, 0],
              }}
              transition={{
                duration: 10,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
          </>
        )}
        
        {/* Mobile-optimized floating particles */}
        {isMobile ? (
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {[...Array(15)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1 h-1 bg-emerald-400/20 rounded-full"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                }}
                animate={{
                  y: [-10, 10, -10],
                  x: [-5, 5, -5],
                  opacity: [0.2, 0.5, 0.2],
                }}
                transition={{
                  duration: 4 + Math.random() * 2,
                  repeat: Infinity,
                  delay: Math.random() * 2,
                  ease: "easeInOut"
                }}
              />
            ))}
          </div>
        ) : (
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {[...Array(30)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1 h-1 bg-emerald-400/30 rounded-full"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                }}
                animate={{
                  y: [-20, 20, -20],
                  x: [-10, 10, -10],
                  opacity: [0.3, 0.8, 0.3],
                }}
                transition={{
                  duration: 3 + Math.random() * 4,
                  repeat: Infinity,
                  delay: Math.random() * 2,
                  ease: "easeInOut"
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Scroll indicator for mobile */}
      {isMobile && (
        <div className="fixed top-0 left-0 right-0 h-1 bg-gray-900 z-40">
          <motion.div
            className="h-full bg-gradient-to-r from-emerald-500 to-blue-500"
            style={{
              scaleX: 0,
              transformOrigin: "left"
            }}
            whileInView={{
              scaleX: 1
            }}
          />
        </div>
      )}

      {/* Main content */}
      <div className="relative z-10">
        {children}
      </div>

      {/* Mobile-specific optimizations */}
      {isMobile && (
        <>
          {/* Prevent zoom on input focus */}
          <style jsx global>{`
            input, textarea, select {
              font-size: 16px !important;
            }
          `}</style>
          
          {/* Safe area handling for newer phones */}
          <style jsx global>{`
            .safe-area-top {
              padding-top: env(safe-area-inset-top);
            }
            .safe-area-bottom {
              padding-bottom: env(safe-area-inset-bottom);
            }
            .safe-area-left {
              padding-left: env(safe-area-inset-left);
            }
            .safe-area-right {
              padding-right: env(safe-area-inset-right);
            }
          `}</style>
        </>
      )}
    </motion.div>
  );
}

// Hook for mobile detection
export function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return isMobile;
}

// Hook for viewport height
export function useViewportHeight() {
  const [viewportHeight, setViewportHeight] = useState(0);

  useEffect(() => {
    const handleResize = () => {
      setViewportHeight(window.innerHeight);
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  return viewportHeight;
}

// Hook for safe area insets
export function useSafeAreaInsets() {
  const [insets, setInsets] = useState({
    top: 0,
    bottom: 0,
    left: 0,
    right: 0
  });

  useEffect(() => {
    const updateInsets = () => {
      const computedStyle = getComputedStyle(document.documentElement);
      setInsets({
        top: parseInt(computedStyle.getPropertyValue('env(safe-area-inset-top)')) || 0,
        bottom: parseInt(computedStyle.getPropertyValue('env(safe-area-inset-bottom)')) || 0,
        left: parseInt(computedStyle.getPropertyValue('env(safe-area-inset-left)')) || 0,
        right: parseInt(computedStyle.getPropertyValue('env(safe-area-inset-right)')) || 0,
      });
    };

    updateInsets();
    window.addEventListener('resize', updateInsets);
    
    return () => window.removeEventListener('resize', updateInsets);
  }, []);

  return insets;
}