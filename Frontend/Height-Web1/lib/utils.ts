import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Format currency values
export function formatCurrency(value: number, currency = 'USD', options = {}) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    ...options,
  }).format(value);
}

// Format percentage values
export function formatPercentage(value: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'percent',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    signDisplay: 'exceptZero',
  }).format(value / 100);
}

// Generate random number within range
export function getRandomNumber(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

// Generate mock market data for demo purposes
export function generateMockMarketData(count: number = 10) {
  const assets = [
    { symbol: 'BTC', name: 'Bitcoin', type: 'crypto' },
    { symbol: 'ETH', name: 'Ethereum', type: 'crypto' },
    { symbol: 'SOL', name: 'Solana', type: 'crypto' },
    { symbol: 'AAPL', name: 'Apple Inc.', type: 'stock' },
    { symbol: 'MSFT', name: 'Microsoft', type: 'stock' },
    { symbol: 'GOOGL', name: 'Alphabet', type: 'stock' },
    { symbol: 'AMZN', name: 'Amazon', type: 'stock' },
    { symbol: 'TSLA', name: 'Tesla', type: 'stock' },
    { symbol: 'NIFTY', name: 'Nifty 50', type: 'index' },
    { symbol: 'SENSEX', name: 'BSE Sensex', type: 'index' },
  ];

  return assets.slice(0, count).map((asset) => {
    const price = getRandomNumber(
      asset.type === 'crypto' ? 100 : 1000,
      asset.type === 'crypto' ? 50000 : 5000
    );
    const change24h = getRandomNumber(-5, 5);
    const volume24h = getRandomNumber(1000000, 10000000);

    return {
      ...asset,
      price,
      change24h,
      volume24h,
      sparkline: Array(24)
        .fill(0)
        .map(() => price + getRandomNumber(-price * 0.05, price * 0.05)),
    };
  });
}

// Generate chart data points
export function generateChartData(days = 30, trend: 'up' | 'down' | 'volatile' = 'volatile') {
  let baseValue = 100;
  const volatility = 0.03;
  
  const trendFactor = trend === 'up' ? 0.01 : trend === 'down' ? -0.01 : 0;
  
  return Array(days).fill(0).map((_, i) => {
    // Add some randomness based on trend
    const change = baseValue * (trendFactor + (Math.random() - 0.5) * volatility);
    baseValue += change;
    
    return {
      date: new Date(Date.now() - (days - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      value: Math.max(baseValue, 1), // Ensure value doesn't go below 1
    };
  });
}