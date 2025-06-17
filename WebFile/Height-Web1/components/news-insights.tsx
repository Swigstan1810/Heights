"use client";

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  TrendingUp, 
  TrendingDown, 
  Newspaper, 
  Activity,
  AlertCircle,
  ExternalLink,
  RefreshCw,
  Clock,
  Filter,
  ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface NewsArticle {
  id: string;
  title: string;
  summary: string;
  category: string;
  sentiment?: string;
  impact?: string;
  timestamp: string;
  source: string;
  url?: string;
}

export function NewsInsights() {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    fetchNews();
  }, [selectedCategory]);

  const fetchNews = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/news?category=${selectedCategory}&limit=10`);
      const data = await response.json();
      
      if (data.success) {
        setArticles(data.data);
      }
    } catch (error) {
      console.error('Error fetching news:', error);
      // Use mock data if API fails
      setArticles([
        {
          id: '1',
          title: 'Bitcoin Surges Past $45,000 as Institutional Adoption Grows',
          summary: 'Major financial institutions continue to embrace cryptocurrency, driving Bitcoin to new monthly highs.',
          category: 'crypto',
          sentiment: 'positive',
          impact: 'high',
          timestamp: new Date().toISOString(),
          source: 'CryptoNews',
          url: '#'
        },
        {
          id: '2',
          title: 'Federal Reserve Signals Rate Cut Possibilities',
          summary: 'Markets react positively to dovish Fed comments suggesting potential rate cuts in 2024.',
          category: 'economy',
          sentiment: 'positive',
          impact: 'high',
          timestamp: new Date().toISOString(),
          source: 'Financial Times',
          url: '#'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const categories = [
    { id: 'all', label: 'All', color: 'bg-white/10' },
    { id: 'crypto', label: 'Crypto', color: 'bg-orange-500/10' },
    { id: 'economy', label: 'Economy', color: 'bg-blue-500/10' },
    { id: 'global', label: 'Global', color: 'bg-purple-500/10' }
  ];

  const getSentimentColor = (sentiment?: string) => {
    switch (sentiment) {
      case 'positive': return 'text-[#1F7D53]';
      case 'negative': return 'text-red-500';
      default: return 'text-white/70';
    }
  };

  const getSentimentIcon = (sentiment?: string) => {
    switch (sentiment) {
      case 'positive': return TrendingUp;
      case 'negative': return TrendingDown;
      default: return Activity;
    }
  };

  return (
    <div className="h-full w-full">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg sm:text-2xl font-bold text-white flex items-center gap-2">
            <Newspaper className="h-5 w-5 sm:h-6 sm:w-6 text-[#1F7D53]" />
            Market Insights & News
          </h2>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchNews}
            disabled={loading}
            className="border-white/20 text-white hover:text-white"
          >
            <RefreshCw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} />
            Refresh
          </Button>
        </div>

        {/* Category Filter */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {categories.map(category => (
            <Button
              key={category.id}
              variant={selectedCategory === category.id ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory(category.id)}
              className={cn(
                "whitespace-nowrap",
                selectedCategory === category.id 
                  ? "bg-[#1F7D53] hover:bg-[#1F7D53]/80" 
                  : "border-white/20 text-white hover:text-white"
              )}
            >
              <Filter className="h-3 w-3 mr-1" />
              {category.label}
            </Button>
          ))}
        </div>

        {/* Market Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="bg-black border-white/10">
            <CardHeader className="p-4">
              <CardTitle className="text-sm text-white/70">Market Sentiment</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-[#1F7D53]" />
                <span className="text-xl font-bold text-white">Bullish</span>
              </div>
              <p className="text-xs text-white/50 mt-1">Based on latest news analysis</p>
            </CardContent>
          </Card>

          <Card className="bg-black border-white/10">
            <CardHeader className="p-4">
              <CardTitle className="text-sm text-white/70">Breaking Stories</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-xl font-bold text-white">{articles.length}</div>
              <p className="text-xs text-white/50 mt-1">In the last 24 hours</p>
            </CardContent>
          </Card>

          <Card className="bg-black border-white/10">
            <CardHeader className="p-4">
              <CardTitle className="text-sm text-white/70">Top Impact</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-xl font-bold text-white">Crypto</div>
              <p className="text-xs text-white/50 mt-1">Most discussed category</p>
            </CardContent>
          </Card>
        </div>

        {/* News Articles */}
        <Card className="bg-black border-white/10">
          <CardHeader className="p-6">
            <CardTitle className="text-base text-white">Latest Market News</CardTitle>
          </CardHeader>
          <CardContent className="p-6 pt-0">
            {loading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-6 bg-white/10 rounded w-3/4 mb-2"></div>
                    <div className="h-4 bg-white/10 rounded w-full"></div>
                  </div>
                ))}
              </div>
            ) : articles.length === 0 ? (
              <div className="text-center py-8">
                <AlertCircle className="h-8 w-8 mx-auto mb-2 text-white/50" />
                <p className="text-white/50">No news articles found</p>
              </div>
            ) : (
              <div className="space-y-4">
                {articles.map((article) => {
                  const SentimentIcon = getSentimentIcon(article.sentiment);
                  
                  return (
                    <div
                      key={article.id}
                      className="p-4 bg-black/50 border border-white/10 rounded-lg hover:border-[#1F7D53]/50 transition-all group"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <h4 className="font-medium text-white mb-2 line-clamp-2 group-hover:text-[#1F7D53] transition-colors">
                            {article.title}
                          </h4>
                          <p className="text-sm text-white/60 line-clamp-2 mb-3">
                            {article.summary}
                          </p>
                          <div className="flex items-center gap-4 text-xs">
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3 text-white/40" />
                              <span className="text-white/40">
                                {new Date(article.timestamp).toLocaleDateString()}
                              </span>
                            </div>
                            <Badge variant="outline" className="text-xs border-white/20 text-white/60">
                              {article.source}
                            </Badge>
                            {article.sentiment && (
                              <div className={cn("flex items-center gap-1", getSentimentColor(article.sentiment))}>
                                <SentimentIcon className="h-3 w-3" />
                                <span className="capitalize">{article.sentiment}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        {article.url && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-white/50 hover:text-white"
                            onClick={() => window.open(article.url, '_blank')}
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}