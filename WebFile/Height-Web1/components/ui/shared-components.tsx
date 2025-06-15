// components/ui/shared-components.tsx
"use client";

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  BarChart3, 
  Zap, 
  Flame,
  Target,
  Sparkles,
  Clock,
  Eye,
  Bookmark,
  Share2,
  ExternalLink,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Loader2
} from 'lucide-react';

// Loading Skeletons
export function CryptoCardSkeleton() {
  return (
    <Card className="border-2">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Skeleton className="w-12 h-12 rounded-xl" />
            <div>
              <Skeleton className="h-4 w-16 mb-2" />
              <Skeleton className="h-3 w-12" />
            </div>
          </div>
          <div className="text-right">
            <Skeleton className="h-4 w-20 mb-2" />
            <Skeleton className="h-3 w-16" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function NewsCardSkeleton() {
  return (
    <Card className="border-2">
      <CardHeader>
        <div className="flex gap-2 mb-2">
          <Skeleton className="h-6 w-16" />
          <Skeleton className="h-6 w-20" />
        </div>
        <Skeleton className="h-6 w-full mb-2" />
        <div className="flex justify-between">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-3 w-20" />
        </div>
      </CardHeader>
      <CardContent>
        <Skeleton className="h-20 w-full mb-3" />
        <div className="flex gap-2 mb-3">
          <Skeleton className="h-5 w-12" />
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-5 w-14" />
        </div>
        <div className="flex justify-between">
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-4 w-16" />
        </div>
      </CardContent>
    </Card>
  );
}

// Enhanced Price Change Indicator
interface PriceChangeProps {
  value: number;
  prefix?: string;
  suffix?: string;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  animated?: boolean;
}

export function PriceChange({ 
  value, 
  prefix = '', 
  suffix = '%', 
  size = 'md',
  showIcon = true,
  animated = true 
}: PriceChangeProps) {
  const isPositive = value >= 0;
  const isNeutral = Math.abs(value) < 0.01;
  
  const sizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  };
  
  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5'
  };

  const colorClass = isNeutral 
    ? 'text-muted-foreground' 
    : isPositive 
      ? 'text-green-600 dark:text-green-400' 
      : 'text-red-600 dark:text-red-400';

  const bgClass = isNeutral
    ? 'bg-muted/20'
    : isPositive
      ? 'bg-green-500/10'
      : 'bg-red-500/10';

  const content = (
    <div className={`flex items-center gap-1 px-2 py-1 rounded-full ${bgClass} ${colorClass} ${sizeClasses[size]} font-bold`}>
      {showIcon && !isNeutral && (
        isPositive ? (
          <TrendingUp className={iconSizes[size]} />
        ) : (
          <TrendingDown className={iconSizes[size]} />
        )
      )}
      {showIcon && isNeutral && (
        <Activity className={iconSizes[size]} />
      )}
      <span>
        {prefix}{isPositive && value > 0 ? '+' : ''}{value.toFixed(2)}{suffix}
      </span>
    </div>
  );

  if (animated) {
    return (
      <motion.div
        key={value}
        initial={{ scale: 0.8, opacity: 0.7 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        {content}
      </motion.div>
    );
  }

  return content;
}

// Enhanced Status Badge
interface StatusBadgeProps {
  status: 'positive' | 'negative' | 'neutral' | 'high' | 'medium' | 'low' | 'trending' | 'live';
  label?: string;
  animated?: boolean;
  size?: 'sm' | 'md';
}

export function StatusBadge({ status, label, animated = false, size = 'md' }: StatusBadgeProps) {
  const configs = {
    positive: {
      color: 'text-green-600 dark:text-green-400',
      bg: 'bg-green-500/10 border-green-500/30',
      icon: TrendingUp,
      defaultLabel: 'Positive'
    },
    negative: {
      color: 'text-red-600 dark:text-red-400',
      bg: 'bg-red-500/10 border-red-500/30',
      icon: TrendingDown,
      defaultLabel: 'Negative'
    },
    neutral: {
      color: 'text-blue-600 dark:text-blue-400',
      bg: 'bg-blue-500/10 border-blue-500/30',
      icon: Activity,
      defaultLabel: 'Neutral'
    },
    high: {
      color: 'text-red-600 dark:text-red-400',
      bg: 'bg-red-500/10 border-red-500/30',
      icon: Flame,
      defaultLabel: 'High Impact'
    },
    medium: {
      color: 'text-yellow-600 dark:text-yellow-400',
      bg: 'bg-yellow-500/10 border-yellow-500/30',
      icon: Zap,
      defaultLabel: 'Medium Impact'
    },
    low: {
      color: 'text-blue-600 dark:text-blue-400',
      bg: 'bg-blue-500/10 border-blue-500/30',
      icon: Target,
      defaultLabel: 'Low Impact'
    },
    trending: {
      color: 'text-orange-600 dark:text-orange-400',
      bg: 'bg-orange-500/10 border-orange-500/30',
      icon: Flame,
      defaultLabel: 'Trending'
    },
    live: {
      color: 'text-green-600 dark:text-green-400',
      bg: 'bg-green-500/10 border-green-500/30',
      icon: Activity,
      defaultLabel: 'Live'
    }
  };

  const config = configs[status];
  const IconComponent = config.icon;
  const displayLabel = label || config.defaultLabel;
  
  const sizeClasses = size === 'sm' ? 'text-xs h-6' : 'text-sm h-7';
  const iconSize = size === 'sm' ? 'h-3 w-3' : 'h-4 w-4';

  const badge = (
    <Badge 
      variant="outline" 
      className={`${config.bg} ${config.color} border font-bold ${sizeClasses} px-2`}
    >
      <IconComponent className={`${iconSize} mr-1 ${animated && status === 'live' ? 'animate-pulse' : ''}`} />
      {displayLabel}
    </Badge>
  );

  if (animated && status === 'trending') {
    return (
      <motion.div
        animate={{ scale: [1, 1.05, 1] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        {badge}
      </motion.div>
    );
  }

  return badge;
}

// Loading States
interface LoadingStateProps {
  type: 'spinner' | 'pulse' | 'bars' | 'dots';
  size?: 'sm' | 'md' | 'lg';
  text?: string;
}

export function LoadingState({ type, size = 'md', text }: LoadingStateProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8'
  };

  const textSizes = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  };

  const renderLoader = () => {
    switch (type) {
      case 'spinner':
        return <Loader2 className={`${sizeClasses[size]} animate-spin`} />;
      
      case 'pulse':
        return (
          <div className={`${sizeClasses[size]} bg-primary rounded-full animate-pulse`} />
        );
      
      case 'bars':
        return (
          <div className="flex gap-1">
            {[0, 1, 2].map(i => (
              <motion.div
                key={i}
                className={`w-1 bg-primary rounded-full ${size === 'sm' ? 'h-4' : size === 'md' ? 'h-6' : 'h-8'}`}
                animate={{ scaleY: [1, 2, 1] }}
                transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.2 }}
              />
            ))}
          </div>
        );
      
      case 'dots':
        return (
          <div className="flex gap-1">
            {[0, 1, 2].map(i => (
              <motion.div
                key={i}
                className={`${size === 'sm' ? 'w-2 h-2' : size === 'md' ? 'w-3 h-3' : 'w-4 h-4'} bg-primary rounded-full`}
                animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
                transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
              />
            ))}
          </div>
        );
      
      default:
        return <Loader2 className={`${sizeClasses[size]} animate-spin`} />;
    }
  };

  return (
    <div className="flex flex-col items-center gap-3">
      {renderLoader()}
      {text && (
        <p className={`text-muted-foreground font-medium ${textSizes[size]}`}>
          {text}
        </p>
      )}
    </div>
  );
}

// Empty State Component
interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-center py-12"
    >
      <div className="mb-4">
        {icon || <BarChart3 className="h-16 w-16 mx-auto text-muted-foreground" />}
      </div>
      <h3 className="text-xl font-bold mb-2">{title}</h3>
      {description && (
        <p className="text-muted-foreground mb-6 max-w-md mx-auto">{description}</p>
      )}
      {action && (
        <Button onClick={action.onClick} variant="outline">
          {action.label}
        </Button>
      )}
    </motion.div>
  );
}

// Error State Component
interface ErrorStateProps {
  title?: string;
  message: string;
  retry?: () => void;
  type?: 'error' | 'warning' | 'info';
}

export function ErrorState({ 
  title = 'Something went wrong', 
  message, 
  retry, 
  type = 'error' 
}: ErrorStateProps) {
  const configs = {
    error: {
      icon: XCircle,
      color: 'text-red-600',
      bg: 'bg-red-500/10'
    },
    warning: {
      icon: AlertTriangle,
      color: 'text-yellow-600',
      bg: 'bg-yellow-500/10'
    },
    info: {
      icon: CheckCircle,
      color: 'text-blue-600',
      bg: 'bg-blue-500/10'
    }
  };

  const config = configs[type];
  const IconComponent = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`text-center py-12 px-6 rounded-xl ${config.bg}`}
    >
      <IconComponent className={`h-16 w-16 mx-auto mb-4 ${config.color}`} />
      <h3 className="text-xl font-bold mb-2">{title}</h3>
      <p className="text-muted-foreground mb-6 max-w-md mx-auto">{message}</p>
      {retry && (
        <Button onClick={retry} variant="outline">
          Try Again
        </Button>
      )}
    </motion.div>
  );
}

// Stats Grid Component
interface Stat {
  label: string;
  value: string | number;
  change?: number;
  icon?: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
}

interface StatsGridProps {
  stats: Stat[];
  columns?: 2 | 3 | 4;
}

export function StatsGrid({ stats, columns = 3 }: StatsGridProps) {
  const gridCols = {
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'
  };

  return (
    <div className={`grid ${gridCols[columns]} gap-4`}>
      {stats.map((stat, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <Card className="border-2 bg-gradient-to-br from-card/90 to-muted/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-muted-foreground">
                  {stat.label}
                </p>
                {stat.icon && (
                  <div className="text-muted-foreground">
                    {stat.icon}
                  </div>
                )}
              </div>
              
              <div className="flex items-end justify-between">
                <p className="text-2xl font-bold">
                  {typeof stat.value === 'number' 
                    ? stat.value.toLocaleString() 
                    : stat.value}
                </p>
                
                {stat.change !== undefined && (
                  <PriceChange 
                    value={stat.change} 
                    size="sm"
                    animated={true}
                  />
                )}
              </div>
              
              {stat.trend && (
                <div className="mt-2">
                  <StatusBadge 
                    status={stat.trend === 'up' ? 'positive' : stat.trend === 'down' ? 'negative' : 'neutral'}
                    size="sm"
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}

// Quick Actions Component
interface QuickAction {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  variant?: 'default' | 'outline' | 'destructive';
  disabled?: boolean;
}

interface QuickActionsProps {
  actions: QuickAction[];
  title?: string;
}

export function QuickActions({ actions, title }: QuickActionsProps) {
  return (
    <Card className="border-2">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">
          {title || 'Quick Actions'}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {actions.map((action, index) => (
          <Button
            key={index}
            variant={action.variant || 'outline'}
            className="w-full justify-start"
            onClick={action.onClick}
            disabled={action.disabled}
          >
            {action.icon}
            <span className="ml-2">{action.label}</span>
          </Button>
        ))}
      </CardContent>
    </Card>
  );
}

// Progress Bar Component
interface ProgressBarProps {
  value: number;
  max?: number;
  label?: string;
  showPercentage?: boolean;
  color?: 'primary' | 'green' | 'red' | 'yellow';
  size?: 'sm' | 'md' | 'lg';
  animated?: boolean;
}

export function ProgressBar({ 
  value, 
  max = 100, 
  label, 
  showPercentage = true, 
  color = 'primary',
  size = 'md',
  animated = true 
}: ProgressBarProps) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));
  
  const colorClasses = {
    primary: 'bg-primary',
    green: 'bg-green-500',
    red: 'bg-red-500',
    yellow: 'bg-yellow-500'
  };
  
  const sizeClasses = {
    sm: 'h-2',
    md: 'h-3',
    lg: 'h-4'
  };

  return (
    <div className="space-y-2">
      {(label || showPercentage) && (
        <div className="flex justify-between items-center text-sm">
          {label && <span className="font-medium">{label}</span>}
          {showPercentage && (
            <span className="text-muted-foreground">{percentage.toFixed(1)}%</span>
          )}
        </div>
      )}
      
      <div className={`w-full bg-muted rounded-full overflow-hidden ${sizeClasses[size]}`}>
        <motion.div
          className={`${colorClasses[color]} ${sizeClasses[size]} rounded-full`}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: animated ? 0.8 : 0, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
}

// Time Ago Component
interface TimeAgoProps {
  timestamp: string | Date;
  showIcon?: boolean;
  format?: 'relative' | 'absolute' | 'both';
}

export function TimeAgo({ timestamp, showIcon = true, format = 'relative' }: TimeAgoProps) {
  const now = new Date();
  const time = new Date(timestamp);
  const diffMs = now.getTime() - time.getTime();
  
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  const getRelativeTime = () => {
    if (diffSecs < 60) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return time.toLocaleDateString();
  };

  const getAbsoluteTime = () => {
    return time.toLocaleString();
  };

  const displayTime = format === 'relative' 
    ? getRelativeTime()
    : format === 'absolute'
      ? getAbsoluteTime()
      : `${getRelativeTime()} (${getAbsoluteTime()})`;

  return (
    <div className="flex items-center gap-1 text-xs text-muted-foreground">
      {showIcon && <Clock className="h-3 w-3" />}
      <span title={getAbsoluteTime()}>{displayTime}</span>
    </div>
  );
}