// app/news/page.tsx
"use client";

import { useEffect, useState } from 'react';
import { Navbar } from '@/components/navbar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { motion } from 'framer-motion';
import { 
  Newspaper, 
  ExternalLink, 
  Clock, 
  TrendingUp,
  Bitcoin,
  Building2,
  Zap,
  RefreshCw,
  AlertCircle,
  Settings,
  Loader2,
  Globe,
  Star
} from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/types/supabase';

interface NewsArticle {
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

interface NewsPreferences {
  id: string;
  user_id: string;
  categories: string[];
  created_at: string;
  updated_at: string;
}

const DEFAULT_CATEGORIES = ['cryptocurrency', 'business', 'technology'];

export default function NewsPage() {
  const { user } = useAuth();
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [preferences, setPreferences] = useState<NewsPreferences | null>(null);
  const [activeCategory, setActiveCategory] = useState('business');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const supabase = createClientComponentClient<Database>();

  const categories = [
    { id: 'business', name: 'Business', icon: Building2 },
    { id: 'cryptocurrency', name: 'Cryptocurrency', icon: Bitcoin },
    { id: 'technology', name: 'Technology', icon: Zap },
    { id: 'general', name: 'General', icon: Globe }
  ];

  // Load user preferences
  useEffect(() => {
    const loadPreferences = async () => {
      if (!user) return;

      try {
        const { data: existingPrefs, error } = await supabase
          .from('news_preferences')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (error && error.code === 'PGRST116') {
          // Create default preferences
          const { data: newPrefs, error: createError } = await supabase
            .from('news_preferences')
            .insert({
              user_id: user.id,
              categories: DEFAULT_CATEGORIES
            })
            .select()
            .single();

          if (!createError && newPrefs) {
            setPreferences(newPrefs);
          }
        } else if (!error && existingPrefs) {
          setPreferences(existingPrefs);
        }
      } catch (error) {
        console.error('Error loading preferences:', error);
      }
    };

    if (user) {
      loadPreferences();
    }
  }, [user, supabase]);

  // Fetch news articles
  const fetchNews = async (category: string, pageNum: number = 1, refresh: boolean = false) => {
    try {
      if (refresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const response = await fetch(`/api/news?category=${category}&page=${pageNum}`);
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch news');
      }

      if (pageNum === 1 || refresh) {
        setArticles(data.articles);
      } else {
        setArticles(prev => [...prev, ...data.articles]);
      }

      setHasMore(data.articles.length === 20); // Assuming 20 is the page size
      setPage(pageNum);
    } catch (err) {
      console.error('Error fetching news:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch news');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Load news when category changes
  useEffect(() => {
    fetchNews(activeCategory, 1);
  }, [activeCategory]);

  const handleRefresh = () => {
    fetchNews(activeCategory, 1, true);
  };

  const loadMore = () => {
    if (!loading && hasMore) {
      fetchNews(activeCategory, page + 1);
    }
  };

  const updatePreferences = async (newCategories: string[]) => {
    if (!user || !preferences) return;

    try {
      const { error } = await supabase
        .from('news_preferences')
        .update({
          categories: newCategories,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);

      if (!error) {
        setPreferences(prev => prev ? { ...prev, categories: newCategories } : null);
      }
    } catch (error) {
      console.error('Error updating preferences:', error);
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`;
    } else if (diffInMinutes < 1440) {
      return `${Math.floor(diffInMinutes / 60)}h ago`;
    } else {
      return `${Math.floor(diffInMinutes / 1440)}d ago`;
    }
  };

  const getCategoryIcon = (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId);
    return category ? category.icon : Newspaper;
  };

  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 pt-24 pb-16">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <Newspaper className="h-8 w-8 text-primary" />
                Financial News
              </h1>
              <p className="text-muted-foreground mt-2">
                Stay updated with the latest financial markets, cryptocurrency, and business news
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={refreshing}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>

          {/* User Preferences */}
          {user && preferences && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Your News Preferences
                </CardTitle>
                <CardDescription>
                  Customize which categories you want to see
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {categories.map((category) => {
                    const isSelected = preferences.categories.includes(category.id);
                    const IconComponent = category.icon;
                    return (
                      <Button
                        key={category.id}
                        variant={isSelected ? "default" : "outline"}
                        size="sm"
                        onClick={() => {
                          const newCategories = isSelected
                            ? preferences.categories.filter(c => c !== category.id)
                            : [...preferences.categories, category.id];
                          updatePreferences(newCategories);
                        }}
                      >
                        <IconComponent className="h-4 w-4 mr-2" />
                        {category.name}
                      </Button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Category Tabs */}
        <Tabs value={activeCategory} onValueChange={setActiveCategory} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            {categories.map((category) => {
              const IconComponent = category.icon;
              return (
                <TabsTrigger key={category.id} value={category.id} className="flex items-center gap-2">
                  <IconComponent className="h-4 w-4" />
                  {category.name}
                </TabsTrigger>
              );
            })}
          </TabsList>

          {categories.map((category) => (
            <TabsContent key={category.id} value={category.id}>
              {loading && articles.length === 0 ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <span className="ml-2">Loading news...</span>
                </div>
              ) : (
                <>
                  {/* Featured Article */}
                  {articles.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5 }}
                      className="mb-8"
                    >
                      <Card className="overflow-hidden">
                        <div className="md:flex">
                          <div className="md:w-1/2">
                            <img
                              src={articles[0].urlToImage}
                              alt={articles[0].title}
                              className="w-full h-64 md:h-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&h=600&fit=crop';
                              }}
                            />
                          </div>
                          <div className="md:w-1/2 p-6">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant="secondary">{articles[0].source.name}</Badge>
                              <Badge variant="outline">Featured</Badge>
                            </div>
                            <h2 className="text-2xl font-bold mb-3 line-clamp-2">
                              {articles[0].title}
                            </h2>
                            <p className="text-muted-foreground mb-4 line-clamp-3">
                              {articles[0].description}
                            </p>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Clock className="h-4 w-4" />
                                {formatTimeAgo(articles[0].publishedAt)}
                              </div>
                              <Button asChild>
                                <a href={articles[0].url} target="_blank" rel="noopener noreferrer">
                                  Read More
                                  <ExternalLink className="h-4 w-4 ml-2" />
                                </a>
                              </Button>
                            </div>
                          </div>
                        </div>
                      </Card>
                    </motion.div>
                  )}

                  {/* Articles Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {articles.slice(1).map((article, index) => (
                      <motion.div
                        key={article.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: index * 0.1 }}
                      >
                        <Card className="h-full overflow-hidden hover:shadow-lg transition-shadow">
                          <div className="aspect-video">
                            <img
                              src={article.urlToImage}
                              alt={article.title}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&h=600&fit=crop';
                              }}
                            />
                          </div>
                          <CardContent className="p-4">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant="outline" className="text-xs">
                                {article.source.name}
                              </Badge>
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Clock className="h-3 w-3" />
                                {formatTimeAgo(article.publishedAt)}
                              </div>
                            </div>
                            <h3 className="font-semibold mb-2 line-clamp-2 text-sm">
                              {article.title}
                            </h3>
                            <p className="text-muted-foreground text-xs mb-3 line-clamp-2">
                              {article.description}
                            </p>
                            <Button size="sm" variant="outline" asChild className="w-full">
                              <a href={article.url} target="_blank" rel="noopener noreferrer">
                                Read Full Article
                                <ExternalLink className="h-3 w-3 ml-2" />
                              </a>
                            </Button>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </div>

                  {/* Load More Button */}
                  {hasMore && articles.length > 0 && (
                    <div className="text-center mt-8">
                      <Button
                        onClick={loadMore}
                        disabled={loading}
                        variant="outline"
                      >
                        {loading ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Loading...
                          </>
                        ) : (
                          'Load More Articles'
                        )}
                      </Button>
                    </div>
                  )}

                  {/* Empty State */}
                  {articles.length === 0 && !loading && (
                    <div className="text-center py-12">
                      <Newspaper className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                      <h3 className="text-lg font-semibold mb-2">No articles found</h3>
                      <p className="text-muted-foreground mb-4">
                        We couldn't find any articles for this category. Try refreshing or check another category.
                      </p>
                      <Button onClick={handleRefresh}>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Refresh
                      </Button>
                    </div>
                  )}
                </>
              )}
            </TabsContent>
          ))}
        </Tabs>

        {/* Sidebar with trending topics (if space allows) */}
        <div className="mt-12">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Trending Topics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {[
                  'Bitcoin ETF',
                  'Federal Reserve',
                  'Interest Rates',
                  'Stock Market',
                  'Cryptocurrency',
                  'Inflation',
                  'Economic Policy',
                  'Tech Stocks'
                ].map((topic) => (
                  <Badge key={topic} variant="secondary" className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors">
                    {topic}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Information Footer */}
        <div className="mt-8 p-4 bg-muted/50 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
            <div className="text-sm">
              <h4 className="font-medium mb-1">About Our News</h4>
              <p className="text-muted-foreground">
                News articles are sourced from reputable financial and technology publications. 
                We aggregate content to provide you with comprehensive market coverage. 
                Always verify information from original sources before making investment decisions.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}