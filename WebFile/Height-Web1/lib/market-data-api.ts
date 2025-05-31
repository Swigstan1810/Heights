/**
 * Market Data API Integration for Heights
 * 
 * This file provides functions to fetch real-time and historical market data
 * from various financial APIs.
 */

// We're using Alpha Vantage as our primary data source
// You'll need to register for a free API key at https://www.alphavantage.co/support/#api-key
const ALPHA_VANTAGE_API_KEY = process.env.ALPHA_VANTAGE_API_KEY || '';

// Fallback to Yahoo Finance API which doesn't require an API key but has rate limits
// We use this as backup or when Alpha Vantage data is unavailable

/**
 * Types for market data
 */
export interface MarketQuote {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  open: number;
  high: number;
  low: number;
  previousClose: number;
  volume: number;
  timestamp: number;
  exchange: string;
  lastUpdated: Date;
  source: 'alpha-vantage' | 'yahoo-finance' | 'simulated';
}

export interface HistoricalDataPoint {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface MarketData {
  quote: MarketQuote;
  historical?: HistoricalDataPoint[];
  success: boolean;
  error?: string;
}

/**
 * Fetches real-time market data for a specific symbol
 * 
 * @param symbol The stock or crypto symbol (e.g., AAPL, BTC)
 * @param type The asset type: 'stock' or 'crypto'
 * @returns Market data including current price and daily change
 */
export async function fetchMarketData(symbol: string, type: 'stock' | 'crypto' = 'stock'): Promise<MarketData> {
  // Try Alpha Vantage first
  try {
    if (ALPHA_VANTAGE_API_KEY) {
      return await fetchAlphaVantageData(symbol, type);
    } else {
      console.warn('Alpha Vantage API key not configured, falling back to Yahoo Finance');
      return await fetchYahooFinanceData(symbol, type);
    }
  } catch (error) {
    console.error(`Error fetching market data from Alpha Vantage: ${error}`);
    
    // Try Yahoo Finance as backup
    try {
      return await fetchYahooFinanceData(symbol, type);
    } catch (yahooError) {
      console.error(`Error fetching market data from Yahoo Finance: ${yahooError}`);
      
      // If all APIs fail, return simulated data
      return getSimulatedMarketData(symbol, type);
    }
  }
}

/**
 * Fetches market data from Alpha Vantage API
 */
async function fetchAlphaVantageData(symbol: string, type: 'stock' | 'crypto'): Promise<MarketData> {
  const endpoint = type === 'crypto' 
    ? `https://www.alphavantage.co/query?function=CRYPTO_INTRADAY&symbol=${symbol}&market=USD&interval=5min&apikey=${ALPHA_VANTAGE_API_KEY}`
    : `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${ALPHA_VANTAGE_API_KEY}`;
  
  const response = await fetch(endpoint);
  
  if (!response.ok) {
    throw new Error(`Alpha Vantage API error: ${response.statusText}`);
  }
  
  const data = await response.json();
  
  // Check for error responses
  if (data['Error Message'] || data['Information']) {
    throw new Error(data['Error Message'] || data['Information']);
  }
  
  if (type === 'stock') {
    const quote = data['Global Quote'];
    
    if (!quote || !quote['05. price']) {
      throw new Error('Invalid data received from Alpha Vantage');
    }
    
    return {
      success: true,
      quote: {
        symbol: quote['01. symbol'],
        price: parseFloat(quote['05. price']),
        change: parseFloat(quote['09. change']),
        changePercent: parseFloat(quote['10. change percent'].replace('%', '')),
        open: parseFloat(quote['02. open']),
        high: parseFloat(quote['03. high']),
        low: parseFloat(quote['04. low']),
        previousClose: parseFloat(quote['08. previous close']),
        volume: parseInt(quote['06. volume']),
        timestamp: Date.parse(quote['07. latest trading day']),
        exchange: 'NYSE/NASDAQ',
        lastUpdated: new Date(),
        source: 'alpha-vantage'
      }
    };
  } else {
    // Handle crypto data (different format)
    const timeSeries = data['Time Series Crypto (5min)'];
    const timestamps = Object.keys(timeSeries).sort().reverse();
    
    if (!timeSeries || timestamps.length === 0) {
      throw new Error('Invalid crypto data received from Alpha Vantage');
    }
    
    const latestData = timeSeries[timestamps[0]];
    const previousData = timestamps.length > 1 ? timeSeries[timestamps[1]] : null;
    
    const currentPrice = parseFloat(latestData['4. close']);
    const previousPrice = previousData ? parseFloat(previousData['4. close']) : currentPrice;
    const change = currentPrice - previousPrice;
    const changePercent = (change / previousPrice) * 100;
    
    return {
      success: true,
      quote: {
        symbol: symbol,
        price: currentPrice,
        change: change,
        changePercent: changePercent,
        open: parseFloat(latestData['1. open']),
        high: parseFloat(latestData['2. high']),
        low: parseFloat(latestData['3. low']),
        previousClose: previousPrice,
        volume: parseInt(latestData['5. volume']),
        timestamp: Date.parse(timestamps[0]),
        exchange: 'Crypto',
        lastUpdated: new Date(),
        source: 'alpha-vantage'
      }
    };
  }
}

/**
 * Fetches market data from Yahoo Finance API
 */
async function fetchYahooFinanceData(symbol: string, type: 'stock' | 'crypto'): Promise<MarketData> {
  // For crypto, we need to add suffix
  const yahooSymbol = type === 'crypto' ? `${symbol}-USD` : symbol;
  
  // Yahoo Finance API endpoint
  const endpoint = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${yahooSymbol}`;
  
  const response = await fetch(endpoint, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    }
  });
  
  if (!response.ok) {
    throw new Error(`Yahoo Finance API error: ${response.statusText}`);
  }
  
  const data = await response.json();
  
  if (!data.quoteResponse || !data.quoteResponse.result || data.quoteResponse.result.length === 0) {
    throw new Error('Invalid data received from Yahoo Finance');
  }
  
  const quote = data.quoteResponse.result[0];
  
  return {
    success: true,
    quote: {
      symbol: quote.symbol,
      price: quote.regularMarketPrice,
      change: quote.regularMarketChange,
      changePercent: quote.regularMarketChangePercent,
      open: quote.regularMarketOpen,
      high: quote.regularMarketDayHigh,
      low: quote.regularMarketDayLow,
      previousClose: quote.regularMarketPreviousClose,
      volume: quote.regularMarketVolume,
      timestamp: quote.regularMarketTime * 1000,
      exchange: quote.exchange,
      lastUpdated: new Date(),
      source: 'yahoo-finance'
    }
  };
}

/**
 * Generates simulated market data when APIs are unavailable
 */
function getSimulatedMarketData(symbol: string, type: 'stock' | 'crypto'): MarketData {
  // Base price depends on symbol and type for better realism
  let basePrice = 100; // Default

  // Set realistic base prices for common stocks
  if (type === 'stock') {
    const stockPrices: {[key: string]: number} = {
      'AAPL': 178.42,
      'MSFT': 412.88,
      'GOOGL': 168.85,
      'AMZN': 179.53,
      'TSLA': 184.86,
      'META': 476.70,
      'NFLX': 624.65,
      'NVDA': 936.00,
      'JPM': 198.87,
      'V': 279.26
    };
    
    basePrice = stockPrices[symbol] || 50 + Math.random() * 200;
  } else if (type === 'crypto') {
    const cryptoPrices: {[key: string]: number} = {
      'BTC': 62453.75,
      'ETH': 3018.42,
      'XRP': 0.5125,
      'LTC': 84.56,
      'ADA': 0.4578,
      'DOT': 6.18,
      'DOGE': 0.1324,
      'SOL': 144.21,
      'AVAX': 35.89,
      'MATIC': 0.5973
    };
    
    basePrice = cryptoPrices[symbol] || 1 + Math.random() * 500;
  }
  
  // Generate realistic price change
  const direction = Math.random() > 0.5 ? 1 : -1;
  const changePercent = direction * (Math.random() * 3); // -3% to +3%
  const change = basePrice * (changePercent / 100);
  const price = basePrice + change;
  
  // Generate realistic daily high, low based on change
  const volatilityFactor = type === 'crypto' ? 2 : 1; // Crypto is more volatile
  const rangeSize = Math.abs(change) * volatilityFactor;
  const high = price + (rangeSize * Math.random());
  const low = price - (rangeSize * Math.random());
  
  // Generate realistic volume
  const volume = type === 'crypto' 
    ? Math.floor(10000 + Math.random() * 1000000) 
    : Math.floor(100000 + Math.random() * 10000000);
  
  return {
    success: true,
    quote: {
      symbol: symbol,
      price: parseFloat(price.toFixed(2)),
      change: parseFloat(change.toFixed(2)),
      changePercent: parseFloat(changePercent.toFixed(2)),
      open: parseFloat((price - (change * 0.3)).toFixed(2)),
      high: parseFloat(high.toFixed(2)),
      low: parseFloat(low.toFixed(2)),
      previousClose: parseFloat((price - change).toFixed(2)),
      volume: volume,
      timestamp: Date.now(),
      exchange: type === 'crypto' ? 'CRYPTO' : 'NYSE',
      lastUpdated: new Date(),
      source: 'simulated'
    }
  };
}

/**
 * Fetches historical market data for a specific symbol
 * 
 * @param symbol The stock or crypto symbol
 * @param type The asset type: 'stock' or 'crypto'
 * @param interval The data interval: '1d', '1w', '1m'
 * @param limit Number of data points to return
 */
export async function fetchHistoricalData(
  symbol: string, 
  type: 'stock' | 'crypto' = 'stock',
  interval: '1d' | '1w' | '1m' = '1d',
  limit: number = 30
): Promise<HistoricalDataPoint[]> {
  try {
    if (ALPHA_VANTAGE_API_KEY) {
      // Convert interval to Alpha Vantage format
      const avInterval = interval === '1d' ? 'DAILY' : interval === '1w' ? 'WEEKLY' : 'MONTHLY';
      const apiFunction = type === 'crypto' ? 'DIGITAL_CURRENCY_' + avInterval : 'TIME_SERIES_' + avInterval;
      
      const endpoint = type === 'crypto'
        ? `https://www.alphavantage.co/query?function=${apiFunction}&symbol=${symbol}&market=USD&apikey=${ALPHA_VANTAGE_API_KEY}`
        : `https://www.alphavantage.co/query?function=${apiFunction}&symbol=${symbol}&apikey=${ALPHA_VANTAGE_API_KEY}`;
      
      const response = await fetch(endpoint);
      
      if (!response.ok) {
        throw new Error(`Alpha Vantage API error: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Check for error responses
      if (data['Error Message'] || data['Information']) {
        throw new Error(data['Error Message'] || data['Information']);
      }
      
      // Parse data based on type and interval
      const timeSeriesKey = type === 'crypto'
        ? `Time Series (Digital Currency ${avInterval})`
        : `Time Series (${avInterval})`;
      
      const timeSeries = data[timeSeriesKey];
      
      if (!timeSeries) {
        throw new Error('Invalid historical data received from Alpha Vantage');
      }
      
      // Convert to array and sort by date
      return Object.entries(timeSeries)
        .map(([date, values]: [string, any]) => ({
          date,
          open: parseFloat(values[type === 'crypto' ? '1a. open (USD)' : '1. open']),
          high: parseFloat(values[type === 'crypto' ? '2a. high (USD)' : '2. high']),
          low: parseFloat(values[type === 'crypto' ? '3a. low (USD)' : '3. low']),
          close: parseFloat(values[type === 'crypto' ? '4a. close (USD)' : '4. close']),
          volume: parseInt(values[type === 'crypto' ? '5. volume' : '5. volume']),
        }))
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, limit);
    } else {
      // Fall back to Yahoo Finance
      return await fetchYahooHistoricalData(symbol, type, interval, limit);
    }
  } catch (error) {
    console.error(`Error fetching historical data from Alpha Vantage: ${error}`);
    
    try {
      // Try Yahoo Finance as backup
      return await fetchYahooHistoricalData(symbol, type, interval, limit);
    } catch (yahooError) {
      console.error(`Error fetching historical data from Yahoo Finance: ${yahooError}`);
      
      // Return simulated historical data
      return getSimulatedHistoricalData(symbol, type, interval, limit);
    }
  }
}

/**
 * Fetches historical data from Yahoo Finance
 */
async function fetchYahooHistoricalData(
  symbol: string, 
  type: 'stock' | 'crypto',
  interval: '1d' | '1w' | '1m',
  limit: number
): Promise<HistoricalDataPoint[]> {
  // For crypto, we need to add suffix
  const yahooSymbol = type === 'crypto' ? `${symbol}-USD` : symbol;
  
  // Convert interval to Yahoo Finance format
  const yahooInterval = interval === '1d' ? '1d' : interval === '1w' ? '1wk' : '1mo';
  
  // Calculate period based on interval and limit
  const period = interval === '1d' ? '3mo' : interval === '1w' ? '1y' : '10y';
  
  // Yahoo Finance API endpoint
  const endpoint = `https://query1.finance.yahoo.com/v8/finance/chart/${yahooSymbol}?interval=${yahooInterval}&range=${period}`;
  
  const response = await fetch(endpoint, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    }
  });
  
  if (!response.ok) {
    throw new Error(`Yahoo Finance API error: ${response.statusText}`);
  }
  
  const data = await response.json();
  
  if (!data.chart || !data.chart.result || data.chart.result.length === 0) {
    throw new Error('Invalid historical data received from Yahoo Finance');
  }
  
  const result = data.chart.result[0];
  const { timestamp, indicators } = result;
  const quote = indicators.quote[0];
  
  const historicalData: HistoricalDataPoint[] = [];
  
  for (let i = 0; i < timestamp.length && i < limit; i++) {
    const date = new Date(timestamp[i] * 1000).toISOString().split('T')[0];
    historicalData.push({
      date,
      open: quote.open[i] || 0,
      high: quote.high[i] || 0,
      low: quote.low[i] || 0,
      close: quote.close[i] || 0,
      volume: quote.volume[i] || 0
    });
  }
  
  return historicalData.reverse();
}

/**
 * Generates simulated historical data
 */
function getSimulatedHistoricalData(
  symbol: string, 
  type: 'stock' | 'crypto',
  interval: '1d' | '1w' | '1m',
  limit: number
): HistoricalDataPoint[] {
  // Get a baseline price for the symbol
  const basePrice = type === 'crypto' 
    ? (symbol === 'BTC' ? 62000 : symbol === 'ETH' ? 3000 : 50) 
    : (symbol === 'AAPL' ? 180 : symbol === 'MSFT' ? 410 : 100);
  
  const volatility = type === 'crypto' ? 0.03 : 0.015; // Daily volatility
  const data: HistoricalDataPoint[] = [];
  
  let currentPrice = basePrice;
  let currentDate = new Date();
  
  // Number of days per interval
  const daysPerPeriod = interval === '1d' ? 1 : interval === '1w' ? 7 : 30;
  
  for (let i = 0; i < limit; i++) {
    // Move date back by interval
    currentDate = new Date(currentDate.getTime() - (daysPerPeriod * 24 * 60 * 60 * 1000));
    
    // Generate price movement
    const dailyChange = (Math.random() * 2 - 1) * volatility * currentPrice;
    
    // Calculate daily high, low, open
    const high = currentPrice + Math.abs(dailyChange) * 0.5;
    const low = currentPrice - Math.abs(dailyChange) * 0.5;
    const open = low + Math.random() * (high - low);
    const close = currentPrice + dailyChange;
    
    // Calculate volume
    const volume = type === 'crypto' 
      ? Math.floor(1000 + Math.random() * 100000) 
      : Math.floor(10000 + Math.random() * 1000000);
    
    // Add data point
    data.push({
      date: currentDate.toISOString().split('T')[0],
      open: parseFloat(open.toFixed(2)),
      high: parseFloat(high.toFixed(2)),
      low: parseFloat(low.toFixed(2)),
      close: parseFloat(close.toFixed(2)),
      volume
    });
    
    // Update current price for next iteration
    currentPrice = close;
  }
  
  return data.reverse();
}