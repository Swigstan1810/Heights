// app/api/news/route.ts
export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';

const GNEWS_API_KEY = process.env.GNEWS_API_KEY!;
const NEWSAPI_KEY = process.env.NEWSAPI_KEY!;

interface NewsArticle {
  id: string;
  title: string;
  summary: string;
  content: string;
  category: 'crypto' | 'stock' | 'economy' | 'india' | 'global';
  sentiment?: string;
  impact?: string;
  timestamp: string;
  tags: string[];
  source: string;
  trending?: boolean;
  url?: string;
  image?: string;
}

// Enhanced category mapping for better news relevance
const getCategoryConfig = (category: string) => {
  const configs = {
    crypto: {
      searchTerms: ['bitcoin', 'ethereum', 'cryptocurrency', 'blockchain', 'crypto', 'defi', 'nft', 'web3'],
      gNewsQuery: 'cryptocurrency OR bitcoin OR ethereum OR blockchain',
      newsApiCategory: 'technology',
      newsApiQuery: 'cryptocurrency OR bitcoin OR ethereum OR blockchain OR crypto',
      tags: ['Cryptocurrency', 'Bitcoin', 'Ethereum', 'Blockchain', 'DeFi'],
      sentiment: 'neutral',
      impact: 'high'
    },
    india: {
      searchTerms: ['india market', 'indian economy', 'bse', 'nse', 'sensex', 'nifty', 'rupee', 'rbi'],
      gNewsQuery: 'India market OR Indian economy OR BSE OR NSE OR Sensex OR Nifty',
      newsApiCategory: 'business',
      newsApiQuery: 'India market OR Indian economy OR BSE OR NSE OR Sensex OR Nifty OR rupee',
      tags: ['India Market', 'BSE', 'NSE', 'Sensex', 'Nifty', 'Indian Economy'],
      sentiment: 'neutral',
      impact: 'medium'
    },
    global: {
      searchTerms: ['global market', 'world economy', 'international trade', 'forex', 'dow jones', 'nasdaq', 's&p 500'],
      gNewsQuery: 'global market OR world economy OR international trade OR forex',
      newsApiCategory: 'business',
      newsApiQuery: 'global market OR world economy OR international trade OR forex OR "dow jones" OR nasdaq',
      tags: ['Global Markets', 'World Economy', 'International Trade', 'Forex'],
      sentiment: 'neutral',
      impact: 'high'
    },
    economy: {
      searchTerms: ['economy', 'inflation', 'gdp', 'federal reserve', 'interest rates', 'economic policy'],
      gNewsQuery: 'economy OR inflation OR GDP OR "federal reserve" OR "interest rates"',
      newsApiCategory: 'business',
      newsApiQuery: 'economy OR inflation OR GDP OR "federal reserve" OR "interest rates" OR "economic policy"',
      tags: ['Economy', 'Inflation', 'GDP', 'Federal Reserve', 'Interest Rates'],
      sentiment: 'neutral',
      impact: 'high'
    },
    stock: {
      searchTerms: ['stock market', 'shares', 'equity', 'trading', 'wall street', 'stock price'],
      gNewsQuery: 'stock market OR shares OR equity OR trading OR "wall street"',
      newsApiCategory: 'business',
      newsApiQuery: 'stock market OR shares OR equity OR trading OR "wall street" OR "stock price"',
      tags: ['Stock Market', 'Shares', 'Equity', 'Trading', 'Wall Street'],
      sentiment: 'neutral',
      impact: 'medium'
    }
  };
  
  return configs[category as keyof typeof configs] || configs.global;
};

// Enhanced sentiment analysis based on keywords
const analyzeSentiment = (title: string, description: string): string => {
  const text = `${title} ${description}`.toLowerCase();
  
  const positiveWords = ['surge', 'rise', 'gain', 'bull', 'growth', 'profit', 'success', 'breakthrough', 'rally', 'boom', 'up', 'high', 'record', 'strong'];
  const negativeWords = ['fall', 'drop', 'crash', 'bear', 'loss', 'decline', 'recession', 'crisis', 'down', 'low', 'weak', 'plunge', 'collapse'];
  
  const positiveCount = positiveWords.filter(word => text.includes(word)).length;
  const negativeCount = negativeWords.filter(word => text.includes(word)).length;
  
  if (positiveCount > negativeCount) return 'positive';
  if (negativeCount > positiveCount) return 'negative';
  return 'neutral';
};

// Determine impact level based on content
const analyzeImpact = (title: string, description: string, category: string): string => {
  const text = `${title} ${description}`.toLowerCase();
  
  const highImpactWords = ['federal reserve', 'interest rate', 'gdp', 'inflation', 'recession', 'crisis', 'breakthrough', 'regulation', 'ban', 'approval'];
  const mediumImpactWords = ['earnings', 'quarterly', 'merger', 'acquisition', 'partnership', 'launch', 'update'];
  
  if (highImpactWords.some(word => text.includes(word))) return 'high';
  if (mediumImpactWords.some(word => text.includes(word))) return 'medium';
  
  // Category-specific impact rules
  if (category === 'crypto' && (text.includes('bitcoin') || text.includes('ethereum'))) return 'high';
  if (category === 'india' && (text.includes('rbi') || text.includes('sensex'))) return 'high';
  
  return 'low';
};

// Check if article is trending based on keywords
const isTrending = (title: string, description: string): boolean => {
  const text = `${title} ${description}`.toLowerCase();
  const trendingWords = ['breaking', 'urgent', 'alert', 'surge', 'crash', 'record', 'historic', 'unprecedented'];
  return trendingWords.some(word => text.includes(word));
};

async function fetchGNews(category: string, limit: number): Promise<NewsArticle[]> {
  const config = getCategoryConfig(category);
  const query = encodeURIComponent(config.gNewsQuery);
  const url = `https://gnews.io/api/v4/search?q=${query}&lang=en&max=${limit}&token=${GNEWS_API_KEY}`;
  
  const res = await fetch(url);
  if (!res.ok) throw new Error('GNews error');
  const data = await res.json();
  
  return (data.articles || []).map((a: any, i: number) => {
    const sentiment = analyzeSentiment(a.title, a.description || '');
    const impact = analyzeImpact(a.title, a.description || '', category);
    const trending = isTrending(a.title, a.description || '');
    
    return {
      id: `gnews-${a.publishedAt}-${i}`,
      title: a.title,
      summary: a.description || '',
      content: a.content || a.description || '',
      category: category as any,
      sentiment,
      impact,
      timestamp: a.publishedAt,
      tags: [...config.tags, ...extractTags(a.title, a.description || '')],
      source: a.source?.name || 'GNews',
      url: a.url,
      image: a.image,
      trending,
    };
  });
}

async function fetchNewsAPI(category: string, limit: number): Promise<NewsArticle[]> {
  const config = getCategoryConfig(category);
  const query = encodeURIComponent(config.newsApiQuery);
  const url = `https://newsapi.org/v2/everything?q=${query}&language=en&pageSize=${limit}&sortBy=publishedAt&apiKey=${NEWSAPI_KEY}`;
  
  const res = await fetch(url);
  if (!res.ok) throw new Error('NewsAPI error');
  const data = await res.json();
  
  return (data.articles || []).map((a: any, i: number) => {
    const sentiment = analyzeSentiment(a.title, a.description || '');
    const impact = analyzeImpact(a.title, a.description || '', category);
    const trending = isTrending(a.title, a.description || '');
    
    return {
      id: `newsapi-${a.publishedAt}-${i}`,
      title: a.title,
      summary: a.description || '',
      content: a.content || a.description || '',
      category: category as any,
      sentiment,
      impact,
      timestamp: a.publishedAt,
      tags: [...config.tags, ...extractTags(a.title, a.description || '')],
      source: a.source?.name || 'NewsAPI',
      url: a.url,
      image: a.urlToImage,
      trending,
    };
  });
}

// Extract relevant tags from article content
function extractTags(title: string, description: string): string[] {
  const text = `${title} ${description}`.toLowerCase();
  const tagMap = {
    'bitcoin': 'Bitcoin',
    'ethereum': 'Ethereum',
    'crypto': 'Cryptocurrency',
    'blockchain': 'Blockchain',
    'defi': 'DeFi',
    'nft': 'NFT',
    'sensex': 'Sensex',
    'nifty': 'Nifty',
    'bse': 'BSE',
    'nse': 'NSE',
    'rbi': 'RBI',
    'rupee': 'Indian Rupee',
    'nasdaq': 'NASDAQ',
    'dow jones': 'Dow Jones',
    's&p 500': 'S&P 500',
    'federal reserve': 'Federal Reserve',
    'inflation': 'Inflation',
    'gdp': 'GDP',
    'forex': 'Forex',
    'trading': 'Trading',
    'stock': 'Stock Market'
  };
  
  const extractedTags: string[] = [];
  Object.entries(tagMap).forEach(([keyword, tag]) => {
    if (text.includes(keyword) && !extractedTags.includes(tag)) {
      extractedTags.push(tag);
    }
  });
  
  return extractedTags.slice(0, 5); // Limit to 5 tags
}

// Enhanced fallback data with category-specific content
function getFallbackData(category: string): NewsArticle[] {
  const fallbackData = {
    crypto: [
      {
        id: 'crypto-1',
        title: 'Bitcoin Surges Past $45,000 as Institutional Adoption Grows',
        summary: 'Major financial institutions continue to embrace cryptocurrency, driving Bitcoin to new monthly highs amid increased trading volume.',
        content: 'Bitcoin has experienced significant growth this week, with the price climbing above $45,000 for the first time this month. The surge comes as several major financial institutions announced new cryptocurrency investment products, signaling growing institutional acceptance of digital assets.',
        category: 'crypto' as const,
        sentiment: 'positive',
        impact: 'high',
        timestamp: new Date().toISOString(),
        tags: ['Bitcoin', 'Cryptocurrency', 'Institutional Investment'],
        source: 'CryptoNews',
        trending: true,
        url: '#'
      },
      {
        id: 'crypto-2',
        title: 'Ethereum 2.0 Staking Rewards Attract Institutional Interest',
        summary: 'Major investment firms are exploring Ethereum staking opportunities as the network transitions to proof-of-stake consensus.',
        content: 'The transition to Ethereum 2.0 has created new opportunities for institutional investors seeking yield. Several major investment firms have announced dedicated Ethereum staking services.',
        category: 'crypto' as const,
        sentiment: 'positive',
        impact: 'medium',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        tags: ['Ethereum', 'Staking', 'DeFi'],
        source: 'DeFi Pulse',
        trending: false,
        url: '#'
      }
    ],
    india: [
      {
        id: 'india-1',
        title: 'Indian Stock Market Reaches Record High on Strong Q3 Earnings',
        summary: 'Nifty 50 and Sensex both hit all-time highs as major companies report better-than-expected quarterly results.',
        content: 'The Indian stock market continued its bullish run today as strong corporate earnings drove investor confidence. Major IT and pharmaceutical companies led the rally with impressive quarterly results.',
        category: 'india' as const,
        sentiment: 'positive',
        impact: 'high',
        timestamp: new Date().toISOString(),
        tags: ['Nifty', 'Sensex', 'Earnings', 'India'],
        source: 'Economic Times',
        trending: true,
        url: '#'
      },
      {
        id: 'india-2',
        title: 'RBI Announces New Digital Rupee Pilot Program',
        summary: 'Reserve Bank of India expands its central bank digital currency trials to include retail transactions.',
        content: 'The Reserve Bank of India has announced an expansion of its digital rupee pilot program, marking a significant step in the countrys digital currency adoption journey.',
        category: 'india' as const,
        sentiment: 'neutral',
        impact: 'medium',
        timestamp: new Date(Date.now() - 7200000).toISOString(),
        tags: ['Digital Rupee', 'RBI', 'CBDC'],
        source: 'RBI Bulletin',
        trending: false,
        url: '#'
      }
    ],
    global: [
      {
        id: 'global-1',
        title: 'Global Tech Stocks Face Pressure Amid Rising Interest Rates',
        summary: 'Technology stocks worldwide decline as central banks signal continued monetary tightening to combat inflation.',
        content: 'Global technology stocks faced selling pressure today as investors reassessed valuations in light of rising interest rates. Central banks worldwide continue their hawkish stance to combat persistent inflation.',
        category: 'global' as const,
        sentiment: 'negative',
        impact: 'high',
        timestamp: new Date().toISOString(),
        tags: ['Technology', 'Interest Rates', 'Global Markets'],
        source: 'Financial Times',
        trending: true,
        url: '#'
      },
      {
        id: 'global-2',
        title: 'European Markets Rally on Strong Manufacturing Data',
        summary: 'European indices surge as manufacturing PMI data exceeds expectations across major economies.',
        content: 'European stock markets posted strong gains today following better-than-expected manufacturing data from Germany, France, and Italy. The positive economic indicators have boosted investor confidence.',
        category: 'global' as const,
        sentiment: 'positive',
        impact: 'medium',
        timestamp: new Date(Date.now() - 5400000).toISOString(),
        tags: ['European Markets', 'Manufacturing', 'PMI'],
        source: 'Reuters',
        trending: false,
        url: '#'
      }
    ],
    economy: [
      {
        id: 'economy-1',
        title: 'Federal Reserve Signals Potential Rate Cuts in 2024',
        summary: 'Fed officials hint at possible monetary policy easing as inflation shows signs of cooling.',
        content: 'Federal Reserve officials have indicated that interest rate cuts may be on the table for 2024 if inflation continues its downward trend. The central bank remains cautious but optimistic about economic conditions.',
        category: 'economy' as const,
        sentiment: 'positive',
        impact: 'high',
        timestamp: new Date().toISOString(),
        tags: ['Federal Reserve', 'Interest Rates', 'Inflation'],
        source: 'Wall Street Journal',
        trending: true,
        url: '#'
      }
    ],
    stock: [
      {
        id: 'stock-1',
        title: 'Tech Giants Report Strong Q4 Earnings Despite Market Volatility',
        summary: 'Major technology companies exceed analyst expectations with robust quarterly performance.',
        content: 'Leading technology companies have reported impressive fourth-quarter earnings, demonstrating resilience despite broader market challenges. Cloud computing and AI investments continue to drive growth.',
        category: 'stock' as const,
        sentiment: 'positive',
        impact: 'medium',
        timestamp: new Date().toISOString(),
        tags: ['Tech Stocks', 'Earnings', 'Q4 Results'],
        source: 'MarketWatch',
        trending: false,
        url: '#'
      }
    ]
  };
  
  return fallbackData[category as keyof typeof fallbackData] || fallbackData.global;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category') || 'all';
  const limit = parseInt(searchParams.get('limit') || '20');

  let articles: NewsArticle[] = [];
  let source = '';
  let fallback = false;

  // Handle 'all' category by fetching from multiple categories
  if (category === 'all') {
    const categories = ['crypto', 'india', 'global', 'economy'];
    const promises = categories.map(async (cat) => {
      try {
        const catArticles = await fetchGNews(cat, Math.ceil(limit / categories.length));
        return catArticles;
      } catch (e) {
        try {
          const catArticles = await fetchNewsAPI(cat, Math.ceil(limit / categories.length));
          return catArticles;
        } catch (e2) {
          return getFallbackData(cat).slice(0, 2);
        }
      }
    });
    
    try {
      const results = await Promise.all(promises);
      articles = results.flat().slice(0, limit);
      source = 'mixed';
    } catch (e) {
      // Fallback to mixed category data
      articles = [
        ...getFallbackData('crypto').slice(0, 3),
        ...getFallbackData('india').slice(0, 3),
        ...getFallbackData('global').slice(0, 3),
        ...getFallbackData('economy').slice(0, 3)
      ].slice(0, limit);
      fallback = true;
      source = 'fallback';
    }
  } else {
    // Handle specific category
    try {
      articles = await fetchGNews(category, limit);
      source = 'gnews';
    } catch (e) {
      try {
        articles = await fetchNewsAPI(category, limit);
        source = 'newsapi';
      } catch (e2) {
        articles = getFallbackData(category);
        fallback = true;
        source = 'fallback';
      }
    }
  }

  return NextResponse.json({
    success: true,
    data: articles,
    total: articles.length,
    source,
    fallback,
    category,
    timestamp: new Date().toISOString(),
  });
}
