// app/(protected)/news/page.tsx - Enhanced News Page with Robust Loading
"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { Navbar } from "@/components/navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  RefreshCw, 
  Filter,
  Calendar,
  Clock,
  ExternalLink,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Loader2,
  BookOpen,
  Globe,
  Star,
  Share,
  Bookmark,
  Eye,
  MessageSquare,
  ArrowUpRight,
  Activity,
  Zap,
  Bell,
  Settings
} from "lucide-react";

interface NewsArticle {
  id: string;
  title: string;
  description: string;
  content?: string;
  url: string;
  urlToImage: string;
  publishedAt: string;
  source: {
    id: string;
    name: string;
  };
  category: string;
}

interface NewsResponse {
  success: boolean;
  articles: NewsArticle[];
  source: string;
  cached?: boolean;
  responseTime?: number;
  error?: string;
}

const CATEGORIES = [
  { id: 'business', label: 'Business', icon: TrendingUp, color: 'text-blue-500' },
  { id: 'cryptocurrency', label: 'Crypto', icon: Star, color: 'text-orange-500' },
  { id: 'technology', label: 'Technology', icon: Zap, color: 'text-purple-500' },
  { id: 'general', label: 'General', icon: Globe, color: 'text-green-500' }
];

const NewsCardSkeleton = () => (
  <Card className="h-full">
    <div className="aspect-video relative overflow-hidden">
      <Skeleton className="w-full h-full" />
    </div>
    <CardHeader className="space-y-2">
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-3 w-1/2" />
    </CardHeader>
    <CardContent className="space-y-2">
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-2/3" />
      <div className="flex justify-between items-center pt-2">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-3 w-20" />
      </div>
    </CardContent>
  </Card>
);

export default function NewsPage() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState(searchParams.get('category') || 'business');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [bookmarkedArticles, setBookmarkedArticles] = useState<Set<string>>(new Set());
  const [readArticles, setReadArticles] = useState<Set<string>>(new Set());
  const [responseInfo, setResponseInfo] = useState<{ source: string; responseTime?: number; cached?: boolean } | null>(null);

  // Check auth and redirect if needed
  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated || !user) {
        console.log('News page - redirecting to login');
        router.push('/login?redirectTo=/news');
        return;
      }
    }
  }, [authLoading, isAuthenticated, user, router]);

  // Enhanced news fetching with retry logic
  const fetchNews = useCallback(async (category: string, pageNum: number = 1, retries = 3) => {
    if (pageNum === 1) {
      setLoading(true);
      setError(null);
    }

    try {
      console.log(`[News] Fetching ${category} news, page ${pageNum}`);
      
      const url = new URL('/api/news', window.location.origin);
      url.searchParams.set('category', category);
      url.searchParams.set('page', pageNum.toString());
      url.searchParams.set('pageSize', '20');

      const response = await fetch(url.toString(), {
        headers: {
          'Cache-Control': 'no-cache',
        },
        signal: AbortSignal.timeout(15000) // 15 second timeout
  });
  
  if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data: NewsResponse = await response.json();
      
      console.log(`[News] Received ${data.articles?.length || 0} articles from ${data.source}`);
      
      setResponseInfo({
        source: data.source,
        responseTime: data.responseTime,
        cached: data.cached
      });

      if (data.articles && data.articles.length > 0) {
        if (pageNum === 1) {
          setArticles(data.articles);
        } else {
          setArticles(prev => [...prev, ...data.articles]);
        }
        setHasMore(data.articles.length === 20); // If we got full page, there might be more
      } else {
        if (pageNum === 1) {
          setArticles([]);
        }
        setHasMore(false);
      }

      if (data.error) {
        console.warn('[News] API warning:', data.error);
      }

    } catch (err) {
      console.error('[News] Fetch error:', err);
      
      if (retries > 0 && !(err instanceof DOMException && err.name === 'AbortError')) {
        console.log(`[News] Retrying in 2s... (${retries} attempts left)`);
        setTimeout(() => {
          fetchNews(category, pageNum, retries - 1);
        }, 2000);
        return;
      }
      
      const errorMsg = err instanceof Error ? err.message : 'Failed to load news';
      setError(errorMsg);
      
      // Don't completely fail - show any existing articles
      if (pageNum === 1 && articles.length === 0) {
        setArticles([]);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [articles.length]);

  // Load news when category changes
  useEffect(() => {
    if (isAuthenticated && user) {
      setPage(1);
      fetchNews(activeCategory, 1);
    }
  }, [activeCategory, isAuthenticated, user, fetchNews]);

  // Handle category change
  const handleCategoryChange = (category: string) => {
    setActiveCategory(category);
    setPage(1);
    setHasMore(true);
    
    // Update URL without triggering navigation
    const url = new URL(window.location.href);
    url.searchParams.set('category', category);
    window.history.replaceState({}, '', url.toString());
  };

  // Handle refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    setError(null);
    setPage(1);
    setHasMore(true);
    await fetchNews(activeCategory, 1);
  };

  // Handle load more
  const handleLoadMore = () => {
    if (!loading && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchNews(activeCategory, nextPage);
    }
  };

  // Handle article interactions
  const toggleBookmark = (articleId: string) => {
    setBookmarkedArticles(prev => {
      const newSet = new Set(prev);
      if (newSet.has(articleId)) {
        newSet.delete(articleId);
      } else {
        newSet.add(articleId);
      }
      return newSet;
    });
  };

  const markAsRead = (articleId: string) => {
    setReadArticles(prev => new Set(prev).add(articleId));
  };

  const openArticle = (article: NewsArticle) => {
    markAsRead(article.id);
    window.open(article.url, '_blank', 'noopener,noreferrer');
  };

  // Filter articles based on search
  const filteredArticles = articles.filter(article => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      article.title.toLowerCase().includes(query) ||
      article.description.toLowerCase().includes(query) ||
      article.source.name.toLowerCase().includes(query)
    );
  });

  // Show loading screen while auth is loading
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading news...</p>
        </div>
      </div>
    );
  }

  // Don't render if not authenticated
  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 pt-24 pb-16">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <BookOpen className="h-8 w-8 text-primary" />
                Market News
              </h1>
              <p className="text-muted-foreground mt-2">
                Stay updated with the latest financial and cryptocurrency news
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              {responseInfo && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Badge variant="outline" className="text-xs">
                    {responseInfo.cached ? 'Cached' : 'Live'}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {responseInfo.source}
                  </Badge>
                  {responseInfo.responseTime && (
                    <Badge variant="outline" className="text-xs">
                      {responseInfo.responseTime}ms
                    </Badge>
                  )}
                </div>
              )}
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={refreshing || loading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative mb-6">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search news articles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Category Tabs */}
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map(({ id, label, icon: Icon, color }) => (
              <Button
                key={id}
                variant={activeCategory === id ? "default" : "outline"}
                size="sm"
                onClick={() => handleCategoryChange(id)}
                className="flex items-center gap-2"
              >
                <Icon className={`h-4 w-4 ${activeCategory === id ? '' : color}`} />
                {label}
              </Button>
            ))}
          </div>
        </div>

        {/* Error Alert */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-6"
            >
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="flex items-center justify-between">
                  <span>{error}</span>
                  <Button size="sm" variant="outline" onClick={handleRefresh}>
                    <RefreshCw className="h-3 w-3 mr-1" />
                    Retry
                  </Button>
                </AlertDescription>
              </Alert>
            </motion.div>
          )}
        </AnimatePresence>

        {/* News Grid */}
        <div className="space-y-6">
          {loading && articles.length === 0 ? (
            // Loading skeletons
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 9 }).map((_, i) => (
                <NewsCardSkeleton key={i} />
              ))}
            </div>
          ) : filteredArticles.length > 0 ? (
            <>
              {/* Featured Article */}
              {filteredArticles.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-8"
                >
                  <Card className="overflow-hidden">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div className="relative aspect-video lg:aspect-auto">
                        <img
                          src={filteredArticles[0].urlToImage}
                          alt={filteredArticles[0].title}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1495020689067-958852a7765e?w=800&h=600&fit=crop';
                          }}
                        />
                        <div className="absolute top-4 left-4">
                          <Badge variant="default">Featured</Badge>
                        </div>
                      </div>
                      <div className="p-6 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline">{filteredArticles[0].source.name}</Badge>
                            <Badge variant="secondary">{filteredArticles[0].category}</Badge>
                          </div>
                          <h2 className="text-2xl font-bold mb-3 line-clamp-2">
                            {filteredArticles[0].title}
                          </h2>
                          <p className="text-muted-foreground mb-4 line-clamp-3">
                            {filteredArticles[0].description}
                          </p>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Clock className="h-4 w-4" />
                            <span>{new Date(filteredArticles[0].publishedAt).toLocaleDateString()}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => toggleBookmark(filteredArticles[0].id)}
                            >
                              <Bookmark 
                                className={`h-4 w-4 ${bookmarkedArticles.has(filteredArticles[0].id) ? 'fill-current' : ''}`} 
                              />
                            </Button>
                            <Button
                              onClick={() => openArticle(filteredArticles[0])}
                              size="sm"
                            >
                              Read More
                              <ExternalLink className="h-4 w-4 ml-2" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              )}

              {/* Articles Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredArticles.slice(1).map((article, index) => (
                  <motion.div
                    key={article.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card className={`h-full cursor-pointer transition-all hover:shadow-lg ${
                      readArticles.has(article.id) ? 'opacity-75' : ''
                    }`}>
                      <div className="aspect-video relative overflow-hidden">
                        <img
                          src={article.urlToImage}
                          alt={article.title}
                          className="w-full h-full object-cover transition-transform hover:scale-105"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1495020689067-958852a7765e?w=800&h=600&fit=crop';
                          }}
                        />
                        <div className="absolute top-2 right-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 w-8 p-0 bg-background/80 hover:bg-background"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleBookmark(article.id);
                            }}
                          >
                            <Bookmark 
                              className={`h-3 w-3 ${bookmarkedArticles.has(article.id) ? 'fill-current' : ''}`} 
                            />
                          </Button>
                        </div>
                      </div>
                      
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between mb-2">
                          <Badge variant="outline" className="text-xs">
                            {article.source.name}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {new Date(article.publishedAt).toLocaleDateString()}
                          </span>
                        </div>
                        <CardTitle className="text-lg line-clamp-2 hover:text-primary transition-colors">
                          {article.title}
                        </CardTitle>
                      </CardHeader>
                      
                      <CardContent>
                        <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
                          {article.description}
                        </p>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="text-xs">
                              {article.category}
                            </Badge>
                            {readArticles.has(article.id) && (
                              <Badge variant="outline" className="text-xs">
                                <Eye className="h-3 w-3 mr-1" />
                                Read
                              </Badge>
                            )}
                          </div>
                          
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openArticle(article)}
                            className="text-primary hover:text-primary"
                          >
                            <ArrowUpRight className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>

              {/* Load More Button */}
              {hasMore && (
                <div className="flex justify-center mt-8">
                  <Button
                    onClick={handleLoadMore}
                    disabled={loading}
                    variant="outline"
                    size="lg"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Loading more...
                      </>
                    ) : (
                      <>
                        Load More Articles
                        <ArrowUpRight className="h-4 w-4 ml-2" />
                      </>
                    )}
                  </Button>
                </div>
              )}
            </>
          ) : (
            // No articles found
            <div className="text-center py-16">
              <BookOpen className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-xl font-semibold mb-2">No articles found</h3>
              <p className="text-muted-foreground mb-6">
                {searchQuery 
                  ? `No articles match your search for "${searchQuery}"`
                  : `No articles available for ${CATEGORIES.find(c => c.id === activeCategory)?.label || activeCategory}`
                }
              </p>
              <div className="flex justify-center gap-2">
                {searchQuery && (
                  <Button variant="outline" onClick={() => setSearchQuery('')}>
                    Clear Search
                  </Button>
                )}
                <Button onClick={handleRefresh} disabled={loading}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh News
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Stats Footer */}
        {filteredArticles.length > 0 && (
          <div className="mt-12 pt-8 border-t border-border">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-primary">{filteredArticles.length}</div>
                <div className="text-sm text-muted-foreground">Articles Loaded</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-primary">{bookmarkedArticles.size}</div>
                <div className="text-sm text-muted-foreground">Bookmarked</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-primary">{readArticles.size}</div>
                <div className="text-sm text-muted-foreground">Articles Read</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-primary">
                  {new Set(filteredArticles.map(a => a.source.name)).size}
                </div>
                <div className="text-sm text-muted-foreground">News Sources</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}