"use client";

import Link from 'next/link';
import { useOptimizedNavigation } from '@/hooks/use-optimized-navigation';
import { ReactNode, MouseEvent, useState } from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface OptimizedLinkProps {
  href: string;
  children: ReactNode;
  className?: string;
  prefetch?: boolean;
  showLoader?: boolean;
  onClick?: (e: MouseEvent<HTMLAnchorElement>) => void;
  disabled?: boolean;
}

export function OptimizedLink({ 
  href, 
  children, 
  className, 
  prefetch = true,
  showLoader = false,
  onClick,
  disabled = false
}: OptimizedLinkProps) {
  const { navigateWithPreload, prefetchRoute } = useOptimizedNavigation();
  const [isNavigating, setIsNavigating] = useState(false);

  const handleClick = async (e: MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    
    if (disabled) return;
    
    if (onClick) {
      onClick(e);
    }

    setIsNavigating(true);
    
    try {
      await navigateWithPreload(href);
    } catch (error) {
      console.error('Navigation error:', error);
    } finally {
      setIsNavigating(false);
    }
  };

  const handleMouseEnter = () => {
    if (prefetch && !disabled) {
      prefetchRoute(href);
    }
  };

  const linkClassName = cn(
    className,
    disabled && 'pointer-events-none opacity-50',
    isNavigating && 'cursor-wait'
  );

  return (
    <Link 
      href={href} 
      className={linkClassName}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      tabIndex={disabled ? -1 : undefined}
      aria-disabled={disabled}
    >
      <span className="flex items-center gap-2">
        {children}
        {showLoader && isNavigating && (
          <Loader2 className="h-3 w-3 animate-spin" />
        )}
      </span>
    </Link>
  );
}