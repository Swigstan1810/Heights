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

export async function getMarketData(symbol: string): Promise<MarketData | null> {
  try {
    const productId = `${symbol.toUpperCase()}-USD`;
    const productsResponse = await fetch('https://api.exchange.coinbase.com/products');
    const products = await productsResponse.json();
    const validProduct = products.find((p: any) => p.id === productId);
    if (!validProduct) return null;

    const response = await fetch(`https://api.exchange.coinbase.com/products/${productId}/ticker`);
    if (!response.ok) return null;

    const ticker = await response.json();
    const price = parseFloat(ticker.price);
    const open24h = parseFloat(ticker.open || ticker.price);
    const change24h = price - open24h;

    return {
      symbol: symbol.toUpperCase(),
      productId,
      price,
      change24h,
      change24hPercent: open24h > 0 ? (change24h / open24h) * 100 : 0,
      volume24h: parseFloat(ticker.volume || '0'),
      high24h: parseFloat(ticker.high || ticker.price),
      low24h: parseFloat(ticker.low || ticker.price),
      timestamp: new Date(),
      source: 'coinbase',
    };
  } catch (error) {
    console.error('[Coinbase] REST API error:', error);
    return null;
  }
} 