export interface MarketData {
  symbol: string;
  productId: string;
  price: number;
  change24h: number;
  change24hPercent: number;
  volume24h: number;
  high24h: number;
  low24h: number;
  timestamp: Date;
  source: 'coinbase';
}

let coinbaseProductsCache: any[] | null = null;
let lastCacheTime: number | null = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

async function getCoinbaseProducts() {
  const now = Date.now();
  if (!coinbaseProductsCache || !lastCacheTime || now - lastCacheTime > CACHE_DURATION) {
    try {
      const response = await fetch('https://api.exchange.coinbase.com/products');
      if (!response.ok) {
        // Log the error but don't throw, to avoid breaking the whole sync process
        console.error(`[Coinbase] Failed to fetch products: ${response.status} ${response.statusText}`);
        // Return existing cache if available, otherwise an empty array
        return coinbaseProductsCache || []; 
      }
      coinbaseProductsCache = await response.json();
      lastCacheTime = now;
      console.log('[Coinbase] Product cache updated.');
    } catch (error) {
      console.error('[Coinbase] Error fetching product cache:', error);
      return coinbaseProductsCache || []; // Return old cache on error
    }
  }
  return coinbaseProductsCache;
}

export async function getMarketData(symbol: string): Promise<MarketData | null> {
  try {
    const products = (await getCoinbaseProducts()) || [];
    const productId = `${symbol.toUpperCase()}-USD`;
    const validProduct = products.find((p: any) => p.id === productId);

    if (!validProduct) {
      // This is expected for non-crypto symbols, so we don't log an error.
      // console.log(`[Coinbase] Product ${productId} not found on Coinbase.`);
      return null;
    }

    // Add a delay to avoid hitting rate limits, especially for initial batch syncs
    await new Promise(resolve => setTimeout(resolve, 300)); // 300ms delay

    const response = await fetch(`https://api.exchange.coinbase.com/products/${productId}/ticker`);
    
    if (response.status === 429) {
      console.warn(`[Coinbase] Rate limit hit for ${productId}. Skipping for now.`);
      return null;
    }
    
    if (!response.ok) {
       console.error(`[Coinbase] Failed to fetch ticker for ${productId}: ${response.status} ${response.statusText}`);
       return null;
    }

    const ticker = await response.json();
    const price = parseFloat(ticker.price);
    
    // The 'open' field from Coinbase is the open price of the last 24 hours, which is what we need.
    const open24h = parseFloat(ticker.open); 
    const change24h = price - open24h;

    return {
      symbol: symbol.toUpperCase(),
      productId,
      price,
      change24h,
      change24hPercent: open24h > 0 ? (change24h / open24h) * 100 : 0,
      volume24h: parseFloat(ticker.volume),
      high24h: parseFloat(ticker.high),
      low24h: parseFloat(ticker.low),
      timestamp: new Date(),
      source: 'coinbase',
    };
  } catch (error) {
    console.error(`[Coinbase] REST API error for ${symbol}:`, error);
    return null;
  }
} 