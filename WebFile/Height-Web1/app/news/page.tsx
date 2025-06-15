// app/news/page.tsx - Enhanced News Page
"use client";

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { 
  TrendingUp,
  TrendingDown,
  Search,
  RefreshCw,
  Newspaper,
  Globe,
  IndianRupee,
  Bitcoin,
  BarChart3,
  Clock,
  Filter,
  Flame,
  Zap,
  Target,
  AlertCircle,
  ExternalLink,
  BookOpen,
  Eye,
  Share2,
  Bookmark,
  Loader2,
  Sparkles,
  Activity
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Navbar } from '@/components/navbar';

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

export default function NewsPage() {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [filteredArticles, setFilteredArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedArticle, setSelectedArticle] = useState<NewsArticle | null>(null);
  const [bookmarkedArticles, setBookmarkedArticles] = useState<Set<string>>(new Set());

  // Category configurations
  const categories = [
    { 
      id: 'all', 
      label: 'All News', 
      icon: Newspaper, 
      gradient: 'from-blue-500 to-purple-500',
      bg: 'bg-gradient-to-br from-blue-500/10 to-purple-500/10 border-blue-500/20'
    },
    { 
      id: 'crypto', 
      label: 'Crypto', 
      icon: Bitcoin, 
      gradient: 'from-orange-500 to-yellow-500',
      bg: 'bg-gradient-to-br from-orange-500/10 to-yellow-500/10 border-orange-500/20'
    },
    { 
      id: 'india', 
      label: 'Indian Markets', 
      icon: IndianRupee, 
      gradient: 'from-green-600 to-blue-600',
      bg: 'bg-gradient-to-br from-green-600/10 to-blue-600/10 border-green-600/20'
    },
    { 
      id: 'global', 
      label: 'Global', 
      icon: Globe, 
      gradient: 'from-purple-500 to-pink-500',
      bg: 'bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/20'
    },
    { 
      id: 'economy', 
      label: 'Economy', 
      icon: BarChart3, 
      gradient: 'from-red-500 to-orange-500',
      bg: 'bg-gradient-to-br from-red-500/10 to-orange-500/10 border-red-500/20'
    }
  ];

  // Fetch news articles
  const fetchNews = useCallback(async (category: string = 'all', showLoading: boolean = true) => {
    try {
      if (showLoading) setLoading(true);
      setRefreshing(!showLoading);

      const response = await fetch(`/api/news?category=${category}&limit=30`);
      const data = await response.json();

      if (data.success) {
        setArticles(data.data);
        setFilteredArticles(data.data);
        
        if (data.fallback) {
          toast.info('Using offline news data - Gemini API unavailable');
        } else {
          toast.success(`${data.data.length} latest articles loaded`);
        }
      } else {
        throw new Error('Failed to fetch news');
      }
    } catch (error) {
      console.error('Error fetching news:', error);
      toast.error('Failed to load news articles');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Filter articles based on search and category
  useEffect(() => {
    let filtered = articles;

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(article => article.category === selectedCategory);
    }

    if (searchQuery) {
      filtered = filtered.filter(article =>
        article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        article.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
        article.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    setFilteredArticles(filtered);
  }, [articles, selectedCategory, searchQuery]);

  // Get sentiment styling
  const getSentimentStyle = (sentiment: string) => {
    switch (sentiment) {
      case 'positive':
        return { 
          color: 'text-green-600 dark:text-green-400', 
          bg: 'bg-green-500/10 border-green-500/30',
          icon: TrendingUp 
        };
      case 'negative':
        return { 
          color: 'text-red-600 dark:text-red-400', 
          bg: 'bg-red-500/10 border-red-500/30',
          icon: TrendingDown 
        };
      default:
        return { 
          color: 'text-blue-600 dark:text-blue-400', 
          bg: 'bg-blue-500/10 border-blue-500/30',
          icon: Activity 
        };
    }
  };

  // Get impact styling
  const getImpactStyle = (impact: string) => {
    switch (impact) {
      case 'high':
        return { 
          color: 'text-red-600 dark:text-red-400', 
          bg: 'bg-red-500/10 border-red-500/30',
          icon: Flame,
          label: 'High Impact'
        };
      case 'medium':
        return { 
          color: 'text-yellow-600 dark:text-yellow-400', 
          bg: 'bg-yellow-500/10 border-yellow-500/30',
          icon: Zap,
          label: 'Medium Impact'
        };
      default:
        return { 
          color: 'text-blue-600 dark:text-blue-400', 
          bg: 'bg-blue-500/10 border-blue-500/30',
          icon: Target,
          label: 'Low Impact'
        };
    }
  };

  // Format timestamp
  const formatTime = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffMs = now.getTime() - time.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMins = Math.floor(diffMs / (1000 * 60));

    if (diffHours >= 24) {
      return time.toLocaleDateString();
    } else if (diffHours > 0) {
      return `${diffHours}h ago`;
    } else if (diffMins > 0) {
      return `${diffMins}m ago`;
    } else {
      return 'Just now';
    }
  };

  // Toggle bookmark
  const toggleBookmark = (articleId: string) => {
    const newBookmarks = new Set(bookmarkedArticles);
    if (newBookmarks.has(articleId)) {
      newBookmarks.delete(articleId);
      toast.success('Removed from bookmarks');
    } else {
      newBookmarks.add(articleId);
      toast.success('Added to bookmarks');
    }
    setBookmarkedArticles(newBookmarks);
  };

  // Share article
  const shareArticle = async (article: NewsArticle) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: article.title,
          text: article.summary,
          url: window.location.href
        });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      // Fallback to clipboard
      navigator.clipboard.writeText(`${article.title}\n\n${article.summary}\n\n${window.location.href}`);
      toast.success('Article details copied to clipboard');
    }
  };

  // Initial load
  useEffect(() => {
    fetchNews();
    
    // Auto refresh every 5 minutes
    const interval = setInterval(() => fetchNews('all', false), 300000);
    return () => clearInterval(interval);
  }, [fetchNews]);

  // Handle category change
  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    if (category !== 'all') {
      fetchNews(category, false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <Navbar />
      
      <div className="container mx-auto px-4 pt-20 pb-8">
        {/* Enhanced Header */}
        <motion.div 
          className="mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="text-center mb-8">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black mb-4">
              <span className="bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500 bg-clip-text text-transparent">
                Market
              </span>
              <span className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 bg-clip-text text-transparent ml-3">
                News
              </span>
            </h1>
            <p className="text-muted-foreground text-lg font-medium max-w-2xl mx-auto">
              Real-time cryptocurrency and financial market news powered by AI
            </p>
            <div className="flex items-center justify-center gap-2 mt-4">
              <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/30 font-bold">
                <Sparkles className="h-3 w-3 mr-1" />
                AI-Powered
              </Badge>
              <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/30 font-bold">
                <Activity className="h-3 w-3 mr-1 animate-pulse" />
                Live Updates
              </Badge>
            </div>
          </div>

          {/* Controls */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-6">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search news, companies, or topics..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 border-2 focus:border-primary/50 bg-background/50 backdrop-blur-sm font-medium"
              />
            </div>
            <Button
              variant="outline"
              onClick={() => fetchNews(selectedCategory)}
              disabled={refreshing}
              className="font-medium border-2 hover:border-primary/50 transition-all"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>

          {/* Category Tabs */}
          <div className="flex flex-wrap items-center justify-center gap-2">
            {categories.map((category) => {
              const IconComponent = category.icon;
              const isActive = selectedCategory === category.id;
              
              return (
                <motion.button
                  key={category.id}
                  onClick={() => handleCategoryChange(category.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-all border-2 ${
                    isActive 
                      ? `${category.bg} border-current scale-105 shadow-lg` 
                      : 'bg-background/50 border-transparent hover:bg-muted/30 hover:border-muted'
                  }`}
                  whileHover={{ scale: isActive ? 1.05 : 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <IconComponent className={`h-4 w-4 ${
                    isActive 
                      ? `bg-gradient-to-r ${category.gradient} bg-clip-text text-transparent` 
                      : 'text-muted-foreground'
                  }`} />
                  <span className={isActive ? `bg-gradient-to-r ${category.gradient} bg-clip-text text-transparent` : 'text-muted-foreground'}>
                    {category.label}
                  </span>
                  {isActive && (
                    <Badge variant="secondary" className="text-xs">
                      {filteredArticles.length}
                    </Badge>
                  )}
                </motion.button>
              );
            })}
          </div>
        </motion.div>

        {/* News Content */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(9)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="animate-pulse"
              >
                <Card className="h-96 border-2">
                  <CardHeader>
                    <div className="h-6 bg-gradient-to-r from-muted to-muted/50 rounded"></div>
                    <div className="h-4 bg-muted rounded w-3/4"></div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="h-20 bg-gradient-to-br from-muted/50 to-muted rounded"></div>
                    <div className="flex gap-2">
                      <div className="h-6 bg-muted rounded w-16"></div>
                      <div className="h-6 bg-muted rounded w-20"></div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        ) : filteredArticles.length === 0 ? (
          <motion.div 
            className="text-center py-16"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <AlertCircle className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-bold mb-2">No articles found</h3>
            <p className="text-muted-foreground mb-4">Try adjusting your search or category filter</p>
            <Button onClick={() => {
              setSearchQuery('');
              setSelectedCategory('all');
            }}>
              Clear Filters
            </Button>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence>
              {filteredArticles.map((article, index) => {
                const sentimentStyle = getSentimentStyle(article.sentiment);
                const impactStyle = getImpactStyle(article.impact);
                const SentimentIcon = sentimentStyle.icon;
                const ImpactIcon = impactStyle.icon;
                
                return (
                  <motion.div
                    key={article.id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: index * 0.05 }}
                    whileHover={{ scale: 1.02 }}
                    className="group"
                  >
                    <Card className="h-full border-2 shadow-lg bg-gradient-to-br from-card/90 to-muted/20 backdrop-blur-sm hover:shadow-xl transition-all duration-300">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex flex-wrap gap-1">
                            <Badge variant="outline" className={`${sentimentStyle.bg} ${sentimentStyle.color} text-xs font-bold`}>
                              <SentimentIcon className="h-3 w-3 mr-1" />
                              {article.sentiment.charAt(0).toUpperCase() + article.sentiment.slice(1)}
                            </Badge>
                            <Badge variant="outline" className={`${impactStyle.bg} ${impactStyle.color} text-xs font-bold`}>
                              <ImpactIcon className="h-3 w-3 mr-1" />
                              {impactStyle.label}
                            </Badge>
                            {article.trending && (
                              <Badge variant="outline" className="bg-orange-500/10 text-orange-600 border-orange-500/30 text-xs font-bold">
                                <Flame className="h-3 w-3 mr-1" />
                                Trending
                              </Badge>
                            )}
                          </div>
                          <div className="flex gap-1">
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => toggleBookmark(article.id)}
                            >
                              <Bookmark className={`h-3 w-3 ${
                                bookmarkedArticles.has(article.id) 
                                  ? 'fill-yellow-500 text-yellow-500' 
                                  : 'text-muted-foreground'
                              }`} />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => shareArticle(article)}
                            >
                              <Share2 className="h-3 w-3 text-muted-foreground" />
                            </Button>
                          </div>
                        </div>
                        
                        <CardTitle className="text-base font-bold line-clamp-2 group-hover:text-primary transition-colors">
                          {article.title}
                        </CardTitle>
                        
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatTime(article.timestamp)}
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {article.source}
                          </Badge>
                        </div>
                      </CardHeader>
                      
                      <CardContent className="space-y-3">
                        <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">
                          {article.summary}
                        </p>
                        
                        <div className="flex flex-wrap gap-1">
                          {article.tags.slice(0, 3).map((tag, tagIndex) => (
                            <Badge 
                              key={tagIndex} 
                              variant="secondary" 
                              className="text-xs bg-muted/50 hover:bg-muted transition-colors cursor-pointer"
                            >
                              {tag}
                            </Badge>
                          ))}
                          {article.tags.length > 3 && (
                            <Badge variant="secondary" className="text-xs bg-muted/50">
                              +{article.tags.length - 3} more
                            </Badge>
                          )}
                        </div>
                        
                        <div className="flex items-center justify-between pt-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedArticle(article)}
                            className="font-medium hover:bg-primary hover:text-primary-foreground transition-all"
                          >
                            <BookOpen className="h-3 w-3 mr-1" />
                            Read More
                          </Button>
                          
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Eye className="h-3 w-3" />
                              {Math.floor(Math.random() * 1000) + 100}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}

        {/* Article Modal */}
        <AnimatePresence>
          {selectedArticle && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-background/80 backdrop-blur-md flex items-center justify-center p-4"
              onClick={() => setSelectedArticle(null)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="bg-background border-2 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-6 border-b">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h2 className="text-xl font-bold mb-3 leading-tight">
                        {selectedArticle.title}
                      </h2>
                      <div className="flex flex-wrap gap-2 mb-3">
                        <Badge variant="outline" className={`${getSentimentStyle(selectedArticle.sentiment).bg} ${getSentimentStyle(selectedArticle.sentiment).color} text-xs font-bold`}>
                          {selectedArticle.sentiment.charAt(0).toUpperCase() + selectedArticle.sentiment.slice(1)}
                        </Badge>
                        <Badge variant="outline" className={`${getImpactStyle(selectedArticle.impact).bg} ${getImpactStyle(selectedArticle.impact).color} text-xs font-bold`}>
                          {getImpactStyle(selectedArticle.impact).label}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {selectedArticle.source}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {formatTime(selectedArticle.timestamp)}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedArticle(null)}
                    >
                      Close
                    </Button>
                  </div>
                </div>
                
                <ScrollArea className="max-h-[50vh] p-6">
                  <div className="space-y-4">
                    <p className="text-muted-foreground font-medium leading-relaxed">
                      {selectedArticle.summary}
                    </p>
                    <Separator />
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                      <p className="leading-relaxed">
                        {selectedArticle.content}
                      </p>
                    </div>
                    <Separator />
                    <div>
                      <h4 className="font-bold mb-2">Tags</h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedArticle.tags.map((tag, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </ScrollArea>
                
                <div className="p-4 border-t bg-muted/20">
                  <div className="flex items-center justify-between">
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleBookmark(selectedArticle.id)}
                      >
                        <Bookmark className={`h-4 w-4 mr-1 ${
                          bookmarkedArticles.has(selectedArticle.id) 
                            ? 'fill-yellow-500 text-yellow-500' 
                            : ''
                        }`} />
                        {bookmarkedArticles.has(selectedArticle.id) ? 'Bookmarked' : 'Bookmark'}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => shareArticle(selectedArticle)}
                      >
                        <Share2 className="h-4 w-4 mr-1" />
                        Share
                      </Button>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(`https://www.google.com/search?q=${encodeURIComponent(selectedArticle.title)}`, '_blank')}
                    >
                      <ExternalLink className="h-4 w-4 mr-1" />
                      Learn More
                    </Button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}