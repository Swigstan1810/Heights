// app/api/news/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

interface NewsArticle {
  id: string;
  title: string;
  summary: string;
  content: string;
  category: 'crypto' | 'stock' | 'economy' | 'india' | 'global';
  sentiment: 'positive' | 'negative' | 'neutral';
  impact: 'high' | 'medium' | 'low';
  timestamp: string;
  tags: string[];
  source: string;
  trending: boolean;
}

export async function GET(request: NextRequest) {
  let limit = 20;
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category') || 'all';
    limit = parseInt(searchParams.get('limit') || '20');

    // Initialize Gemini model
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    // Create a comprehensive prompt for news generation
    const prompt = `
      Generate ${limit} realistic and current financial news articles for ${new Date().toLocaleDateString()}. 
      Focus on cryptocurrency markets, Indian stock markets, and global economic trends.
      
      Requirements:
      - Include mix of crypto news (Bitcoin, Ethereum, Solana, Indian crypto regulations)
      - Include Indian market news (Nifty, Sensex, major Indian companies, RBI policies)
      - Include global economic news affecting markets
      - Make articles realistic and timely
      - Include both positive and negative sentiment news
      - Vary impact levels (high, medium, low)
      
      Return ONLY a valid JSON array with this exact structure:
      [
        {
          "id": "unique-id",
          "title": "Compelling news headline",
          "summary": "2-3 sentence summary",
          "content": "Detailed 150-200 word article content",
          "category": "crypto|stock|economy|india|global",
          "sentiment": "positive|negative|neutral",
          "impact": "high|medium|low",
          "timestamp": "${new Date().toISOString()}",
          "tags": ["tag1", "tag2", "tag3"],
          "source": "Reuters|Bloomberg|Economic Times|CoinDesk|LiveMint",
          "trending": true|false
        }
      ]
      
      Categories should be distributed as:
      - 40% crypto-related news
      - 30% Indian market news  
      - 20% global economy
      - 10% general financial news
      
      Make sure all JSON is properly formatted and valid.
    `;

    // Generate content using Gemini
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Parse the JSON response
    let newsArticles: NewsArticle[];
    try {
      // Extract JSON from the response (in case there's extra text)
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        newsArticles = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No valid JSON found in response');
      }
    } catch (parseError) {
      console.error('Error parsing Gemini response:', parseError);
      // Fallback to mock data if parsing fails
      newsArticles = generateFallbackNews(limit);
    }

    // Filter by category if specified
    if (category !== 'all') {
      newsArticles = newsArticles.filter(article => article.category === category);
    }

    // Add some randomization to make it feel more real-time
    newsArticles = newsArticles.map(article => ({
      ...article,
      id: `news-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(Date.now() - Math.random() * 3600000 * 24).toISOString(), // Random time within last 24 hours
    }));

    // Sort by timestamp (newest first)
    newsArticles.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return NextResponse.json({
      success: true,
      data: newsArticles.slice(0, limit),
      total: newsArticles.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error generating news:', error);
    
    // Return fallback news on error
    const fallbackNews = generateFallbackNews(limit);
    
    return NextResponse.json({
      success: true,
      data: fallbackNews,
      total: fallbackNews.length,
      timestamp: new Date().toISOString(),
      fallback: true
    });
  }
}

function generateFallbackNews(limit: number): NewsArticle[] {
  const fallbackArticles: NewsArticle[] = [
    {
      id: 'fb1',
      title: 'Bitcoin Surges Past $50,000 as Institutional Adoption Accelerates',
      summary: 'Bitcoin price rallies to new monthly highs as major corporations announce BTC treasury allocations. Market sentiment turns bullish amid ETF inflows.',
      content: 'Bitcoin has broken through the $50,000 resistance level for the first time this month, driven by increased institutional adoption and positive regulatory developments. Major corporations including MicroStrategy and Tesla have expanded their Bitcoin holdings, while BlackRock\'s spot Bitcoin ETF continues to see significant inflows. The cryptocurrency market cap has gained over $100 billion in the past week, with analysts predicting further upside momentum. Regulatory clarity in key markets and the upcoming Bitcoin halving event are contributing to the positive sentiment.',
      category: 'crypto',
      sentiment: 'positive',
      impact: 'high',
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      tags: ['Bitcoin', 'Cryptocurrency', 'ETF', 'Institutional'],
      source: 'CoinDesk',
      trending: true
    },
    {
      id: 'fb2',
      title: 'Nifty 50 Hits Record High as FII Inflows Boost Indian Markets',
      summary: 'Indian benchmark index reaches new all-time high driven by strong FII inflows and robust corporate earnings. Banking and IT sectors lead the rally.',
      content: 'The Nifty 50 index closed at a record high of 22,500, marking its fifth consecutive session of gains. Foreign institutional investors (FIIs) have pumped in over ₹15,000 crores in the past week, attracted by India\'s strong economic fundamentals and corporate earnings growth. Banking giants like HDFC Bank and ICICI Bank gained over 3%, while IT majors TCS and Infosys also contributed to the rally. Market analysts expect the momentum to continue, citing India\'s GDP growth projections and improving global sentiment towards emerging markets.',
      category: 'india',
      sentiment: 'positive',
      impact: 'high',
      timestamp: new Date(Date.now() - 7200000).toISOString(),
      tags: ['Nifty', 'Indian Markets', 'FII', 'Banking'],
      source: 'Economic Times',
      trending: true
    },
    {
      id: 'fb3',
      title: 'RBI Maintains Repo Rate at 6.5%, Focuses on Inflation Control',
      summary: 'Reserve Bank of India keeps policy rates unchanged for the sixth consecutive meeting. Governor emphasizes commitment to bringing inflation within target range.',
      content: 'The Reserve Bank of India\'s Monetary Policy Committee unanimously decided to maintain the repo rate at 6.5% during its latest meeting. RBI Governor Shaktikanta Das highlighted the central bank\'s focus on ensuring inflation remains within the 4% target range while supporting economic growth. The decision was in line with market expectations, with most economists anticipating a pause in the rate cycle. The RBI also revised its GDP growth forecast for FY25 to 7.2% from the earlier projection of 7%. Banking stocks reacted positively to the announcement, with investors welcoming the stable policy environment.',
      category: 'india',
      sentiment: 'neutral',
      impact: 'medium',
      timestamp: new Date(Date.now() - 10800000).toISOString(),
      tags: ['RBI', 'Interest Rates', 'Monetary Policy', 'Inflation'],
      source: 'LiveMint',
      trending: false
    },
    {
      id: 'fb4',
      title: 'Ethereum Layer 2 Solutions See Record Activity as Gas Fees Drop',
      summary: 'Polygon, Arbitrum, and Optimism report surge in transaction volumes. Layer 2 adoption accelerates as Ethereum mainnet congestion eases.',
      content: 'Ethereum Layer 2 scaling solutions have reported record-breaking transaction volumes this week, with Polygon processing over 3 million daily transactions and Arbitrum crossing the 2 million mark. The surge in L2 activity coincides with a significant drop in Ethereum mainnet gas fees, making DeFi and NFT transactions more affordable for retail users. Optimism has announced a major protocol upgrade that reduces transaction costs by an additional 40%. The growing L2 ecosystem is seen as crucial for Ethereum\'s scalability roadmap, with total value locked across all L2 solutions exceeding $20 billion for the first time.',
      category: 'crypto',
      sentiment: 'positive',
      impact: 'medium',
      timestamp: new Date(Date.now() - 14400000).toISOString(),
      tags: ['Ethereum', 'Layer 2', 'DeFi', 'Scaling'],
      source: 'CoinDesk',
      trending: true
    },
    {
      id: 'fb5',
      title: 'Global Central Banks Signal Coordinated Approach to Digital Currencies',
      summary: 'Major central banks including Fed, ECB, and Bank of Japan announce collaborative framework for CBDC development and cross-border payments.',
      content: 'Central banks from G7 nations have unveiled a coordinated approach to developing central bank digital currencies (CBDCs) and improving cross-border payment systems. The framework aims to ensure interoperability between different CBDC implementations while maintaining monetary sovereignty. Federal Reserve Chair Jerome Powell emphasized the importance of international cooperation in digital currency development. The European Central Bank is expected to launch its digital euro pilot program next year, while the Bank of Japan is accelerating its CBDC research. The announcement has sparked discussions about the future of global monetary systems and the role of cryptocurrencies.',
      category: 'global',
      sentiment: 'neutral',
      impact: 'high',
      timestamp: new Date(Date.now() - 18000000).toISOString(),
      tags: ['CBDC', 'Central Banks', 'Digital Currency', 'Global Economy'],
      source: 'Reuters',
      trending: false
    }
  ];

  return fallbackArticles.slice(0, limit);
}