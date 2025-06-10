// components/ui/heights-logo.tsx
"use client";

import { motion } from 'framer-motion';

interface HeightsLogoProps {
  className?: string;
  animate?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export function HeightsLogo({ className = "", animate = true, size = 'md' }: HeightsLogoProps) {
  const sizes = {
    sm: 'h-8 w-8',
    md: 'h-12 w-12',
    lg: 'h-16 w-16',
    xl: 'h-24 w-24'
  };

  const logoContent = (
    <svg viewBox="0 0 200 200" className={`${sizes[size]} ${className}`} xmlns="http://www.w3.org/2000/svg">
      {/* L-shaped logo */}
      <g className="fill-current">
        <rect x="20" y="20" width="40" height="160" />
        <rect x="20" y="20" width="160" height="40" />
      </g>
      
      {/* Animated gradient overlay for premium effect */}
      {animate && (
        <defs>
          <linearGradient id="shimmer" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1F7D53" stopOpacity="0">
              <animate attributeName="stop-opacity" values="0;0.3;0" dur="3s" repeatCount="indefinite" />
            </stop>
            <stop offset="50%" stopColor="#255F38" stopOpacity="0.3">
              <animate attributeName="stop-opacity" values="0.3;0.6;0.3" dur="3s" repeatCount="indefinite" />
            </stop>
            <stop offset="100%" stopColor="#27391C" stopOpacity="0">
              <animate attributeName="stop-opacity" values="0;0.3;0" dur="3s" repeatCount="indefinite" />
            </stop>
          </linearGradient>
        </defs>
      )}
      
      {animate && (
        <g fill="url(#shimmer)">
          <rect x="20" y="20" width="40" height="160" />
          <rect x="20" y="20" width="160" height="40" />
        </g>
      )}
    </svg>
  );

  if (animate) {
    return (
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        {logoContent}
      </motion.div>
    );
  }

  return logoContent;
}