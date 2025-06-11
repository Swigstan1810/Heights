// components/optimized-link.tsx - Complete optimized link component with preloading
"use client";

import Link from 'next/link';
import { useOptimizedNavigation } from '@/hooks/use-optimized-navigation';
import { ReactNode, MouseEvent, useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface OptimizedLinkProps {
  href: string;
  children: ReactNode;
  className?: string;
  prefetch?: boolean;
  showLoader?: boolean;
  preloadDelay?: number;
  onClick?: (e: MouseEvent<HTMLAnchorElement>) => void;
  onPreloadStart?: () => void;
  onPreloadComplete?: () => void;
  disabled?: boolean;
  replace?: boolean;
  scroll?: boolean;
  shallow?: boolean;
}

export function OptimizedLink({ 
  href, 
  children, 
  className, 
  prefetch = true,
  showLoader = false,
  preloadDelay = 100,
  onClick,
  onPreloadStart,
  onPreloadComplete,
  disabled = false,
  replace = false,
  scroll = true,
  shallow = false
}: OptimizedLinkProps) {
  const { navigateWithPreload, prefetchRoute } = useOptimizedNavigation();
  const [isPreloading, setIsPreloading] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const [preloadTimeout, setPreloadTimeout] = useState<NodeJS.Timeout | null>(null);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (preloadTimeout) {
        clearTimeout(preloadTimeout);
      }
    };
  }, [preloadTimeout]);

  const handleClick = async (e: MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    
    if (disabled) return;
    
    if (onClick) {
      onClick(e);
    }

    setIsNavigating(true);
    
    try {
      if (replace) {
        await navigateWithPreload(href, { replace: true, scroll, shallow });
      } else {
        await navigateWithPreload(href, { scroll, shallow });
      }
    } catch (error) {
      console.error('Navigation error:', error);
    } finally {
      setIsNavigating(false);
    }
  };

  const handleMouseEnter = () => {
    if (!prefetch || disabled || isPreloading) return;

    // Clear any existing timeout
    if (preloadTimeout) {
      clearTimeout(preloadTimeout);
    }

    // Set a delay before preloading to avoid unnecessary requests
    const timeout = setTimeout(async () => {
      setIsPreloading(true);
      onPreloadStart?.();
      
      try {
        await prefetchRoute(href);
        onPreloadComplete?.();
      } catch (error) {
        console.error('Prefetch error:', error);
      } finally {
        setIsPreloading(false);
      }
    }, preloadDelay);

    setPreloadTimeout(timeout);
  };

  const handleMouseLeave = () => {
    // Cancel preloading if user moves away quickly
    if (preloadTimeout) {
      clearTimeout(preloadTimeout);
      setPreloadTimeout(null);
    }
  };

  const handleFocus = () => {
    // Preload on focus for keyboard navigation
    if (prefetch && !disabled && !isPreloading) {
      handleMouseEnter();
    }
  };

  const linkClassName = cn(
    className,
    disabled && 'pointer-events-none opacity-50',
    (isNavigating || (showLoader && isPreloading)) && 'cursor-wait'
  );

  return (
    <Link 
      href={href} 
      className={linkClassName}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={handleFocus}
      tabIndex={disabled ? -1 : undefined}
      aria-disabled={disabled}
    >
      <span className="flex items-center gap-2">
        {children}
        {showLoader && (isPreloading || isNavigating) && (
          <Loader2 className="h-3 w-3 animate-spin" />
        )}
      </span>
    </Link>
  );
}

