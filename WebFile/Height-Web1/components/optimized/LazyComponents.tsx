// components/optimized/LazyComponents.tsx
import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Activity, Info } from 'lucide-react';

// Loading components
const LoadingSkeleton = () => (
  <div className="space-y-4">
    <Skeleton className="h-8 w-full" />
    <Skeleton className="h-32 w-full" />
    <Skeleton className="h-4 w-3/4" />
  </div>
);

const ChartLoading = () => (
  <div className="h-[400px] w-full flex items-center justify-center">
    <Loader2 className="h-8 w-8 animate-spin" />
  </div>
);

// Simple NewsWidget component (avoiding complex imports)
export const NewsWidget = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Market News
        </CardTitle>
        <CardDescription>
          Latest financial and cryptocurrency news
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-center py-8">
          <Info className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground mb-4">News loading...</p>
        </div>
      </CardContent>
    </Card>
  );
};

// Dynamically imported components with proper loading states
export const TradingViewWidget = dynamic(
  () => import('@/components/trading/tradingview-widget').catch(() => ({
    default: () => (
      <div className="h-[400px] w-full flex items-center justify-center bg-muted/20 rounded-lg">
        <p className="text-muted-foreground">Chart unavailable</p>
      </div>
    )
  })),
  {
    loading: () => <ChartLoading />,
    ssr: false,
  }
);

export const PortfolioChart = dynamic(
  () => import('@/components/portfolio/portfolio-chart').catch(() => ({
    default: () => (
      <div className="h-[300px] w-full flex items-center justify-center bg-muted/20 rounded-lg">
        <p className="text-muted-foreground">Portfolio chart unavailable</p>
      </div>
    )
  })),
  {
    loading: () => <ChartLoading />,
    ssr: false,
  }
);

// TODO: MarketChart component does not exist
// export const MarketChart = dynamic(
//   () => import('@/components/market/market-chart').catch(() => ({
//     default: () => (
//       <div className="h-[300px] w-full flex items-center justify-center bg-muted/20 rounded-lg">
//         <p className="text-muted-foreground">Market chart unavailable</p>
//       </div>
//     )
//   })),
//   {
//     loading: () => <ChartLoading />, 
//     ssr: false,
//   }
// );

// TODO: AIAssistant component path may need to be updated if not found
// export const AIAssistant = dynamic(
//   () => import('@/components/ai-assistant').catch(() => ({
//     default: () => (
//       <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
//         <span className="text-xs">AI</span>
//       </div>
//     )
//   })),
//   {
//     loading: () => (
//       <div className="h-10 w-10 rounded-full bg-primary/10 animate-pulse" />
//     ),
//     ssr: false,
//   }
// );

// Optimized form components
// TODO: AuthForm component does not exist
// export const AuthForm = dynamic(
//   () => import('@/components/auth/auth-form').catch(() => ({
//     default: () => <LoadingSkeleton />
//   })),
//   {
//     loading: () => <LoadingSkeleton />, 
//     ssr: false,
//   }
// );

// TODO: TradeForm component does not exist
// export const TradeForm = dynamic(
//   () => import('@/components/trade/trade-form').catch(() => ({
//     default: () => <LoadingSkeleton />
//   })),
//   {
//     loading: () => <LoadingSkeleton />, 
//     ssr: false,
//   }
// );

// Analytics components (low priority)
// TODO: AnalyticsWidget component does not exist
// export const AnalyticsWidget = dynamic(
//   () => import('@/components/analytics/analytics-widget').catch(() => ({
//     default: () => <LoadingSkeleton />
//   })),
//   {
//     loading: () => <LoadingSkeleton />, 
//     ssr: false,
//   }
// );

// Advanced trading components
// TODO: OrderBook component does not exist
// export const OrderBook = dynamic(
//   () => import('@/components/trading/order-book').catch(() => ({
//     default: () => <LoadingSkeleton />
//   })),
//   {
//     loading: () => <LoadingSkeleton />, 
//     ssr: false,
//   }
// );

// TODO: TradingHistory component does not exist
// export const TradingHistory = dynamic(
//   () => import('@/components/trading/trading-history').catch(() => ({
//     default: () => <LoadingSkeleton />
//   })),
//   {
//     loading: () => <LoadingSkeleton />, 
//     ssr: false,
//   }
// );

// Component registry for dynamic loading
export const LazyComponentRegistry = {
  TradingViewWidget,
  PortfolioChart,
  // MarketChart, // commented out
  NewsWidget,
  // AIAssistant, // commented out
  // AuthForm, // commented out
  // TradeForm, // commented out
  // AnalyticsWidget, // commented out
  // OrderBook, // commented out
  // TradingHistory, // commented out
} as const;

export type LazyComponentName = keyof typeof LazyComponentRegistry;