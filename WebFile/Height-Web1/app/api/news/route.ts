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
  category: string;
  sentiment?: string;
  impact?: string;
  timestamp: string;
  tags: string[];
  source: string;
  trending?: boolean;
  url?: string;
  image?: string;
}

async function fetchGNews(category: string, limit: number): Promise<NewsArticle[]> {
  const url = `https://gnews.io/api/v4/top-headlines?topic=${category === 'all' ? 'world' : category}&lang=en&max=${limit}&token=${GNEWS_API_KEY}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('GNews error');
  const data = await res.json();
  return (data.articles || []).map((a: any, i: number) => ({
    id: a.publishedAt + '-' + i,
    title: a.title,
    summary: a.description || '',
    content: a.content || '',
    category: category,
    timestamp: a.publishedAt,
    tags: a.keywords || [],
    source: a.source?.name || 'GNews',
    url: a.url,
    image: a.image,
    trending: false,
  }));
}

async function fetchNewsAPI(category: string, limit: number): Promise<NewsArticle[]> {
  const url = `https://newsapi.org/v2/top-headlines?category=${category === 'all' ? 'general' : category}&language=en&pageSize=${limit}&apiKey=${NEWSAPI_KEY}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('NewsAPI error');
  const data = await res.json();
  return (data.articles || []).map((a: any, i: number) => ({
    id: a.publishedAt + '-' + i,
    title: a.title,
    summary: a.description || '',
    content: a.content || '',
    category: category,
    timestamp: a.publishedAt,
    tags: [],
    source: a.source?.name || 'NewsAPI',
    url: a.url,
    image: a.urlToImage,
    trending: false,
  }));
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category') || 'all';
  const limit = parseInt(searchParams.get('limit') || '20');

  let articles: NewsArticle[] = [];
  let source = '';

  try {
    articles = await fetchGNews(category, limit);
    source = 'gnews';
  } catch (e) {
    try {
      articles = await fetchNewsAPI(category, limit);
      source = 'newsapi';
    } catch (e2) {
      return NextResponse.json({
        success: false,
        data: [],
        error: 'Failed to fetch news from both GNews and NewsAPI',
        source: null,
      }, { status: 500 });
    }
  }

  return NextResponse.json({
    success: true,
    data: articles,
    total: articles.length,
    source,
    timestamp: new Date().toISOString(),
  });
}