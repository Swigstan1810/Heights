// components/trading/enhanced-tradingview-widget.tsx
"use client";

import { useEffect, useRef, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Loader2, 
  TrendingUp, 
  TrendingDown, 
  AlertCircle,
  RefreshCw,
  Maximize2,
  Settings
} from 'lucide-react';

declare global {
  interface Window {
    TradingView?: any;
  }
}

interface EnhancedTradingViewWidgetProps {
  symbol: string;
  assetType?: 'stock' | 'crypto' | 'forex' | 'commodity' | 'bond' | 'mutual_fund';
  height?: number;
  width?: number | string;
  interval?: string;
  theme?: 'light' | 'dark';
  style?: '1' | '2' | '3' | '8' | '9';
  locale?: string;
  toolbar_bg?: string;
  enable_publishing?: boolean;
  hide_side_toolbar?: boolean;
  allow_symbol_change?: boolean;
  watchlist?: string[];
  details?: boolean;
  hotlist?: boolean;
  calendar?: boolean;
  studies?: string[];
  className?: string;
  onSymbolChange?: (symbol: string) => void;
  showControls?: boolean;
}

const SYMBOL_MAPPINGS = {
  // Indian Stocks
  'RELIANCE': 'NSE:RELIANCE',
  'TCS': 'NSE:TCS',
  'INFY': 'NSE:INFY', 
  'HDFCBANK': 'NSE:HDFCBANK',
  'ICICIBANK': 'NSE:ICICIBANK',
  'BHARTIARTL': 'NSE:BHARTIARTL',
  'ITC': 'NSE:ITC',
  'SBIN': 'NSE:SBIN',
  'LT': 'NSE:LT',
  'WIPRO': 'NSE:WIPRO',
  
  // US Stocks
  'AAPL': 'NASDAQ:AAPL',
  'MSFT': 'NASDAQ:MSFT',
  'GOOGL': 'NASDAQ:GOOGL',
  'AMZN': 'NASDAQ:AMZN',
  'TSLA': 'NASDAQ:TSLA',
  'NVDA': 'NASDAQ:NVDA',
  'META': 'NASDAQ:META',
  'NFLX': 'NASDAQ:NFLX',
  
  // Cryptocurrencies
  'BTC': 'COINBASE:BTCUSD',
  'ETH': 'COINBASE:ETHUSD',
  'SOL': 'COINBASE:SOLUSD',
  'MATIC': 'COINBASE:MATICUSD',
  'LINK': 'COINBASE:LINKUSD',
  'AVAX': 'COINBASE:AVAXUSD',
  
  // Commodities
  'GOLD': 'TVC:GOLD',
  'SILVER': 'TVC:SILVER',
  'CRUDE': 'NYMEX:CL1!',
  'COPPER': 'COMEX:HG1!',
  'ALUMINIUM': 'MCX:ALUMINIUM1!',
  'ZINC': 'MCX:ZINC1!',
  'NICKEL': 'MCX:NICKEL1!',
  'NATURALGAS': 'NYMEX:NG1!',
  
  // Bonds - Use related instruments since direct MF symbols might not work
  'GOI_10Y': 'BSE:GSEC',
  'GOI_5Y': 'BSE:GSEC',
  'GOI_30Y': 'BSE:GSEC',
  'CORP_AAA': 'BSE:GSEC',
  'CORP_AA': 'BSE:GSEC',
  'MUNICIPAL': 'BSE:GSEC',
  
  // For Mutual Funds, use benchmark indices
  'HDFC_EQ': 'NSE:NIFTY',
  'ICICI_BC': 'NSE:NIFTY',
  'SBI_LG': 'NSE:NIFTY',
  'AXIS_MC': 'NSE:NIFTYMIDCAP100',
  'KOTAK_SC': 'NSE:NIFTYSMLCAP100',
  'MIRAE_LC': 'NSE:NIFTY',
  'UTI_NF': 'NSE:NIFTY',
  'DSP_EQ': 'NSE:NIFTY',
};

export default function EnhancedTradingViewWidget({
  symbol,
  assetType = 'stock',
  height = 400,
  width = '100%',
  interval = '1D',
  theme = 'light',
  style = '1',
  locale = 'en',
  toolbar_bg = '#f1f3f6',
  enable_publishing = false,
  hide_side_toolbar = false,
  allow_symbol_change = true,
  watchlist = [],
  details = true,
  hotlist = true,
  calendar = true,
  studies = ['MASimple@tv-basicstudies'],
  className = '',
  onSymbolChange,
  showControls = true
}: EnhancedTradingViewWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetRef = useRef<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [currentSymbol, setCurrentSymbol] = useState(symbol);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  // Get the correct TradingView symbol
  const getTradingViewSymbol = (sym: string) => {
    const mappedSymbol = SYMBOL_MAPPINGS[sym as keyof typeof SYMBOL_MAPPINGS];
    if (mappedSymbol) return mappedSymbol;
    
    // Fallback logic based on asset type
    switch (assetType) {
      case 'stock':
        return sym.includes(':') ? sym : `NSE:${sym}`;
      case 'crypto':
        return sym.includes(':') ? sym : `COINBASE:${sym}USD`;
      case 'commodity':
        return sym.includes(':') ? sym : `MCX:${sym}`;
      case 'forex':
        return sym.includes(':') ? sym : `FX:${sym}`;
      default:
        return sym;
    }
  };

  // Load TradingView script
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/tv.js';
    script.async = true;
    script.onload = () => {
      console.log('TradingView script loaded successfully');
      initializeWidget();
    };
    script.onerror = () => {
      console.error('Failed to load TradingView script');
      setIsError(true);
      setIsLoading(false);
    };
    
    document.head.appendChild(script);

    return () => {
      // Cleanup
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
      if (widgetRef.current) {
        try {
          widgetRef.current.remove();
        } catch (e) {
          console.log('Widget cleanup not needed');
        }
      }
    };
  }, []);

  // Initialize widget when symbol changes
  useEffect(() => {
    if (window.TradingView && symbol !== currentSymbol) {
      setCurrentSymbol(symbol);
      initializeWidget();
    }
  }, [symbol]);

  const initializeWidget = () => {
    if (!window.TradingView || !containerRef.current) {
      console.log('TradingView not ready or container not available');
      return;
    }

    setIsLoading(true);
    setIsError(false);

    try {
      // Clear existing widget
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }

      const tradingViewSymbol = getTradingViewSymbol(currentSymbol);
      console.log(`Initializing TradingView widget for: ${tradingViewSymbol}`);

      // Create widget configuration
      const widgetConfig = {
        container_id: containerRef.current.id,
        width: width,
        height: height,
        symbol: tradingViewSymbol,
        interval: interval,
        timezone: "Asia/Kolkata",
        theme: theme,
        style: style,
        locale: locale,
        toolbar_bg: toolbar_bg,
        enable_publishing: enable_publishing,
        hide_side_toolbar: hide_side_toolbar,
        allow_symbol_change: allow_symbol_change,
        details: details,
        hotlist: hotlist,
        calendar: calendar,
        studies: studies,
        show_popup_button: true,
        popup_width: "1000",
        popup_height: "650",
        no_referral_id: true,
        watchlist: watchlist.length > 0 ? watchlist.map(getTradingViewSymbol) : undefined,
        // Additional configuration for better performance
        loading_screen: { backgroundColor: "#ffffff" },
        disabled_features: ["use_localstorage_for_settings"],
        enabled_features: ["study_templates"],
        overrides: {
          "paneProperties.background": theme === 'dark' ? "#1a1a1a" : "#ffffff",
          "paneProperties.vertGridProperties.color": theme === 'dark' ? "#2a2a2a" : "#f0f0f0",
          "paneProperties.horzGridProperties.color": theme === 'dark' ? "#2a2a2a" : "#f0f0f0",
          "symbolWatermarkProperties.transparency": 90,
          "scalesProperties.textColor": theme === 'dark' ? "#ffffff" : "#131722",
        },
        studies_overrides: {},
        datafeed: undefined, // Use default datafeed
        debug: process.env.NODE_ENV === 'development'
      };

      // Create the widget
      widgetRef.current = new window.TradingView.widget(widgetConfig);

      // Set up event listeners
      widgetRef.current.onChartReady(() => {
        console.log('TradingView chart ready');
        setIsLoading(false);
        setIsError(false);
        setRetryCount(0);
      });

      // Handle symbol changes
      if (onSymbolChange) {
        widgetRef.current.subscribe('onSymbolChanged', (symbolInfo: any) => {
          const newSymbol = symbolInfo.name;
          console.log('Symbol changed to:', newSymbol);
          onSymbolChange(newSymbol);
        });
      }

      // Handle errors
      widgetRef.current.subscribe('onError', (error: any) => {
        console.error('TradingView widget error:', error);
        setIsError(true);
        setIsLoading(false);
      });

    } catch (error) {
      console.error('Error initializing TradingView widget:', error);
      setIsError(true);
      setIsLoading(false);
    }
  };

  // Retry mechanism
  const handleRetry = () => {
    if (retryCount < 3) {
      setRetryCount(prev => prev + 1);
      setIsError(false);
      setIsLoading(true);
      
      // Try with fallback symbol if original fails
      setTimeout(() => {
        initializeWidget();
      }, 1000);
    }
  };

  // Fullscreen toggle
  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  // Render error state
  if (isError && retryCount >= 3) {
    return (
      <Card className={`${className} border-red-200`}>
        <CardContent className="p-6 text-center">
          <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-red-700 mb-2">Chart Unavailable</h3>
          <p className="text-red-600 mb-4">
            Unable to load chart for {currentSymbol}. This might be due to:
          </p>
          <ul className="text-sm text-red-600 text-left mb-4 max-w-md mx-auto">
            <li>• Symbol not available on TradingView</li>
            <li>• Market data not accessible</li>
            <li>• Network connectivity issues</li>
          </ul>
          <Button 
            variant="outline" 
            onClick={handleRetry}
            className="border-red-300 text-red-700 hover:bg-red-50"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`${className} relative overflow-hidden`}>
      {showControls && (
        <div className="absolute top-2 right-2 z-10 flex gap-2">
          <Badge variant="secondary" className="bg-white/90 backdrop-blur-sm">
            {currentSymbol}
          </Badge>
          {!isLoading && !isError && (
            <Button
              size="sm"
              variant="ghost"
              onClick={toggleFullscreen}
              className="h-6 w-6 p-0 bg-white/90 backdrop-blur-sm hover:bg-white"
            >
              <Maximize2 className="h-3 w-3" />
            </Button>
          )}
        </div>
      )}
      
      <CardContent className="p-0 relative">
        {isLoading && (
          <div 
            className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-20"
            style={{ height: `${height}px` }}
          >
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-blue-500" />
              <p className="text-sm text-gray-600">Loading chart for {currentSymbol}...</p>
            </div>
          </div>
        )}

        {isError && retryCount < 3 && (
          <div 
            className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-20"
            style={{ height: `${height}px` }}
          >
            <div className="text-center">
              <AlertCircle className="h-8 w-8 mx-auto mb-2 text-amber-500" />
              <p className="text-sm text-gray-600 mb-2">Loading chart...</p>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={handleRetry}
                disabled={isLoading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Retry ({retryCount + 1}/3)
              </Button>
            </div>
          </div>
        )}

        <div
          ref={containerRef}
          id={`tradingview_${currentSymbol}_${Date.now()}`}
          style={{ 
            height: `${height}px`, 
            width: '100%',
            position: 'relative'
          }}
          className="tradingview-widget-container"
        />
      </CardContent>
    </Card>
  );
}