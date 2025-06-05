// app/api/news/route.ts
import { NextRequest, NextResponse } from 'next/server';

// Using NewsAPI (you'll need to sign up for a free API key at https://newsapi.org/)
const NEWS_API_KEY = process.env.NEWS_API_KEY || '';
const NEWS_API_BASE_URL = 'https://newsapi.org';

// Alternative free news APIs as fallbacks
const GNEWS_API_KEY = process.env.GNEWS_API_KEY || '';
const GNEWS_BASE_URL = 'https://gnews.io';

export interface NewsArticle {
  id: string;
  title: string;
  description: string;
  content: string;
  url: string;
  urlToImage: string;
  publishedAt: string;
  source: {
    id: string;
    name: string;
  };
  category: string;
}

// Fallback news data for demo
const FALLBACK_NEWS: NewsArticle[] = [
  {
    id: '1',
    title: 'Bitcoin Reaches New All-Time High as Institutional Adoption Grows',
    description: 'Bitcoin continues its bullish run as major corporations and investment firms increase their crypto holdings.',
    content: 'Bitcoin has reached a new all-time high this week, driven by increased institutional adoption and growing confidence in cryptocurrency as a legitimate asset class.',
    url: 'https://example.com/bitcoin-ath',
    urlToImage: 'https://images.unsplash.com/photo-1518544866330-4e5e15dcb7a4?w=800&h=600&fit=crop',
    publishedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
    source: { id: 'crypto-news', name: 'Crypto News Daily' },
    category: 'cryptocurrency'
  },
  {
    id: '2',
    title: 'Indian Stock Market Sees Record Trading Volume in Q4',
    description: 'The National Stock Exchange of India reports unprecedented trading activity as retail investors continue to participate.',
    content: 'The Indian stock market has witnessed record-breaking trading volumes in the fourth quarter, with retail participation reaching historic levels.',
    url: 'https://example.com/indian-stock-market',
    urlToImage: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&h=600&fit=crop',
    publishedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), // 4 hours ago
    source: { id: 'market-watch', name: 'Market Watch India' },
    category: 'business'
  },
  {
    id: '3',
    title: 'Ethereum 2.0 Staking Rewards Attract More Validators',
    description: 'The Ethereum network sees increased validator participation as staking rewards remain attractive.',
    content: 'Ethereum 2.0 continues to gain momentum with more validators joining the network, attracted by competitive staking rewards and the upcoming protocol upgrades.',
    url: 'https://example.com/ethereum-staking',
    urlToImage: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=800&h=600&fit=crop',
    publishedAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), // 6 hours ago
    source: { id: 'eth-daily', name: 'Ethereum Daily' },
    category: 'cryptocurrency'
  },
  {
    id: '4',
    title: 'RBI Announces New Digital Currency Pilot Program',
    description: 'The Reserve Bank of India expands its digital rupee trials to include more banks and use cases.',
    content: 'The Reserve Bank of India has announced an expansion of its Central Bank Digital Currency pilot program, bringing more financial institutions into the digital rupee ecosystem.',
    url: 'https://example.com/rbi-digital-currency',
    urlToImage: 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=800&h=600&fit=crop',
    publishedAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(), // 8 hours ago
    source: { id: 'rbi-news', name: 'RBI Official' },
    category: 'business'
  },
  {
    id: '5',
    title: 'AI and Blockchain Convergence Drives Innovation in Fintech',
    description: 'The intersection of artificial intelligence and blockchain technology is creating new opportunities in financial services.',
    content: 'Financial technology companies are increasingly leveraging the combination of AI and blockchain to create innovative solutions for trading, lending, and digital payments.',
    url: 'https://example.com/ai-blockchain-fintech',
    urlToImage: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&h=600&fit=crop',
    publishedAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(), // 12 hours ago
    source: { id: 'fintech-today', name: 'FinTech Today' },
    category: 'technology'
  },
  {
    id: '6',
    title: 'Global Markets React to Federal Reserve Interest Rate Decision',
    description: 'International markets show mixed reactions following the latest Fed announcement on monetary policy.',
    content: 'Global financial markets displayed varied responses to the Federal Reserve recent interest rate decision, with emerging markets showing particular sensitivity to policy changes.',
    url: 'https://example.com/fed-rates-global-markets',
    urlToImage: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&h=600&fit=crop',
    publishedAt: new Date(Date.now() - 18 * 60 * 60 * 1000).toISOString(), // 18 hours ago
    source: { id: 'global-finance', name: 'Global Finance Report' },
    category: 'business'
  }
];

async function fetchNewsFromAPI(category: string = 'business', page: number = 1): Promise<NewsArticle[]> {
  // Try NewsAPI first
  if (NEWS_API_KEY) {
    try {
      const url = `https://newsapi.org/v2/top-headlines?category=${category}&country=us&pageSize=20&page=${page}&apiKey=${NEWS_API_KEY}`;
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Heights-Trading-Platform/1.0'
        },
        cache: 'no-store'
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.status === 'ok' && data.articles && data.articles.length > 0) {
          return data.articles.map((article: any, index: number) => ({
            id: `newsapi_${Date.now()}_${index}`,
            title: article.title || 'No title',
            description: article.description || '',
            content: article.content || article.description || '',
            url: article.url || '#',
            urlToImage: article.urlToImage || 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&h=600&fit=crop',
            publishedAt: article.publishedAt || new Date().toISOString(),
            source: article.source || { id: 'unknown', name: 'Unknown' },
            category: category
          }));
        }
      }
    } catch (error) {
      console.error('NewsAPI error:', error);
    }
  }
  
  // Return fallback news immediately if API fails
  return FALLBACK_NEWS.filter(article => 
    category === 'general' || article.category === category
  );
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category') || 'business';
    const page = parseInt(searchParams.get('page') || '1');

    // Validate category
    const validCategories = ['business', 'technology', 'general', 'cryptocurrency'];
    const selectedCategory = validCategories.includes(category) ? category : 'business';

    // For cryptocurrency, we'll search for business news but filter for crypto-related content
    const searchCategory = selectedCategory === 'cryptocurrency' ? 'business' : selectedCategory;

    let articles = await fetchNewsFromAPI(searchCategory, page);

    // Filter for crypto-related news if requested
    if (selectedCategory === 'cryptocurrency') {
      const cryptoKeywords = ['bitcoin', 'ethereum', 'crypto', 'blockchain', 'defi', 'nft', 'digital currency', 'cryptocurrency'];
      articles = articles.filter(article => 
        cryptoKeywords.some(keyword => 
          article.title.toLowerCase().includes(keyword) ||
          article.description.toLowerCase().includes(keyword)
        )
      );
      
      // If no crypto articles found, add fallback crypto articles
      if (articles.length === 0) {
        articles = FALLBACK_NEWS.filter(article => article.category === 'cryptocurrency');
      }
    }

    // Sort by publication date (newest first)
    articles.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

    return NextResponse.json({
      success: true,
      articles: articles.slice(0, 20), // Limit to 20 articles
      category: selectedCategory,
      page,
      totalResults: articles.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('News API error:', error);
    
    // Return fallback news on error
    return NextResponse.json({
      success: false,
      articles: FALLBACK_NEWS,
      category: 'general',
      page: 1,
      totalResults: FALLBACK_NEWS.length,
      error: 'Failed to fetch news, showing cached content',
      timestamp: new Date().toISOString()
    });
  }
}