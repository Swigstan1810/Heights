// app/news/page.tsx - Consistent Modern UI Design
"use client";

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
  BarChart3,
  Clock,
  Flame,
  Zap,
  Target,
  AlertCircle,
  ExternalLink,
  BookOpen,
  Eye,
  Share2,
  Bookmark,
  Sparkles,
  Activity,
  Filter,
  Calendar,
  Star,
  Bitcoin,
  Building2,
  TrendingDownIcon,
  Info,
  ChevronRight
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
  image?: string;
  url?: string;
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

  // Enhanced category configurations with consistent design
  const categories = [
    { 
      id: 'all', 
      label: 'All News', 
      icon: Newspaper, 
      gradient: 'from-blue-500 to-purple-500',
      bg: 'bg-gradient-to-br from-blue-50/50 to-purple-50/50 dark:from-blue-950/10 dark:to-purple-950/10',
      border: 'border-blue-200/50 dark:border-blue-800/50',
      count: 0
    },
    { 
      id: 'crypto', 
      label: 'Crypto', 
      icon: Bitcoin, 
      gradient: 'from-orange-500 to-yellow-500',
      bg: 'bg-gradient-to-br from-orange-50/50 to-yellow-50/50 dark:from-orange-950/10 dark:to-yellow-950/10',
      border: 'border-orange-200/50 dark:border-orange-800/50',
      count: 0
    },
    { 
      id: 'india', 
      label: 'India Market', 
      icon: IndianRupee, 
      gradient: 'from-green-600 to-blue-600',
      bg: 'bg-gradient-to-br from-green-50/50 to-blue-50/50 dark:from-green-950/10 dark:to-blue-950/10',
      border: 'border-green-200/50 dark:border-green-800/50',
      count: 0
    },
    { 
      id: 'global', 
      label: 'Global', 
      icon: Globe, 
      gradient: 'from-purple-500 to-pink-500',
      bg: 'bg-gradient-to-br from-purple-50/50 to-pink-50/50 dark:from-purple-950/10 dark:to-pink-950/10',
      border: 'border-purple-200/50 dark:border-purple-800/50',
      count: 0
    },
    { 
      id: 'economy', 
      label: 'Economy', 
      icon: BarChart3, 
      gradient: 'from-red-500 to-orange-500',
      bg: 'bg-gradient-to-br from-red-50/50 to-orange-50/50 dark:from-red-950/10 dark:to-orange-950/10',
      border: 'border-red-200/50 dark:border-red-800/50',
      count: 0
    }
  ];

  // Fetch news articles with enhanced error handling and category-specific messaging
  const fetchNews = useCallback(async (category: string = 'all', showLoading: boolean = true) => {
    try {
      if (showLoading) setLoading(true);
      setRefreshing(!showLoading);

      const response = await fetch(`/api/news?category=${category}&limit=30`);
      const data = await response.json();

      if (data.success) {
        setArticles(data.data);
        setFilteredArticles(data.data);
        
        // Enhanced feedback based on data source and category
        if (data.fallback) {
          toast.info(`Showing ${category === 'all' ? 'sample' : category} news (offline mode)`);
        } else {
          const categoryLabel = category === 'all' ? 'latest' : category;
          toast.success(`${data.data.length} ${categoryLabel} articles loaded from ${data.source}`);
        }
      } else {
        throw new Error('Failed to fetch news');
      }
    } catch (error) {
      console.error('Error fetching news:', error);
      toast.error(`Failed to load ${category === 'all' ? 'news' : category} articles`);
      
      // Enhanced fallback with category-specific mock data
      const getCategoryMockData = (cat: string): NewsArticle[] => {
        const mockData = {
          crypto: [
            {
              id: 'mock-crypto-1',
              title: 'Bitcoin Surges Past $45,000 as Institutional Adoption Grows',
              summary: 'Major financial institutions continue to embrace cryptocurrency, driving Bitcoin to new monthly highs amid increased trading volume.',
              content: 'Bitcoin has experienced significant growth this week, with the price climbing above $45,000 for the first time this month. The surge comes as several major financial institutions announced new cryptocurrency investment products, signaling growing institutional acceptance of digital assets.',
              category: 'crypto' as const,
              sentiment: 'positive' as const,
              impact: 'high' as const,
              timestamp: new Date().toISOString(),
              tags: ['Bitcoin', 'Cryptocurrency', 'Institutional Investment'],
              source: 'CryptoNews',
              trending: true,
              url: '#'
            },
            {
              id: 'mock-crypto-2',
              title: 'Ethereum 2.0 Staking Rewards Attract Institutional Interest',
              summary: 'Major investment firms are exploring Ethereum staking opportunities as the network transitions to proof-of-stake consensus.',
              content: 'The transition to Ethereum 2.0 has created new opportunities for institutional investors seeking yield. Several major investment firms have announced dedicated Ethereum staking services.',
              category: 'crypto' as const,
              sentiment: 'positive' as const,
              impact: 'medium' as const,
              timestamp: new Date(Date.now() - 3600000).toISOString(),
              tags: ['Ethereum', 'Staking', 'DeFi'],
              source: 'DeFi Pulse',
              trending: false,
              url: '#'
            }
          ],
          india: [
            {
              id: 'mock-india-1',
              title: 'Indian Stock Market Reaches Record High on Strong Q3 Earnings',
              summary: 'Nifty 50 and Sensex both hit all-time highs as major companies report better-than-expected quarterly results.',
              content: 'The Indian stock market continued its bullish run today as strong corporate earnings drove investor confidence. Major IT and pharmaceutical companies led the rally with impressive quarterly results.',
              category: 'india' as const,
              sentiment: 'positive' as const,
              impact: 'high' as const,
              timestamp: new Date().toISOString(),
              tags: ['Nifty', 'Sensex', 'Earnings', 'India'],
              source: 'Economic Times',
              trending: true,
              url: '#'
            },
            {
              id: 'mock-india-2',
              title: 'RBI Announces New Digital Rupee Pilot Program',
              summary: 'Reserve Bank of India expands its central bank digital currency trials to include retail transactions.',
              content: 'The Reserve Bank of India has announced an expansion of its digital rupee pilot program, marking a significant step in the countrys digital currency adoption journey.',
              category: 'india' as const,
              sentiment: 'neutral' as const,
              impact: 'medium' as const,
              timestamp: new Date(Date.now() - 7200000).toISOString(),
              tags: ['Digital Rupee', 'RBI', 'CBDC'],
              source: 'RBI Bulletin',
              trending: false,
              url: '#'
            }
          ],
          global: [
            {
              id: 'mock-global-1',
              title: 'Global Tech Stocks Face Pressure Amid Rising Interest Rates',
              summary: 'Technology stocks worldwide decline as central banks signal continued monetary tightening to combat inflation.',
              content: 'Global technology stocks faced selling pressure today as investors reassessed valuations in light of rising interest rates. Central banks worldwide continue their hawkish stance to combat persistent inflation.',
              category: 'global' as const,
              sentiment: 'negative' as const,
              impact: 'high' as const,
              timestamp: new Date().toISOString(),
              tags: ['Technology', 'Interest Rates', 'Global Markets'],
              source: 'Financial Times',
              trending: true,
              url: '#'
            },
            {
              id: 'mock-global-2',
              title: 'European Markets Rally on Strong Manufacturing Data',
              summary: 'European indices surge as manufacturing PMI data exceeds expectations across major economies.',
              content: 'European stock markets posted strong gains today following better-than-expected manufacturing data from Germany, France, and Italy. The positive economic indicators have boosted investor confidence.',
              category: 'global' as const,
              sentiment: 'positive' as const,
              impact: 'medium' as const,
              timestamp: new Date(Date.now() - 5400000).toISOString(),
              tags: ['European Markets', 'Manufacturing', 'PMI'],
              source: 'Reuters',
              trending: false,
              url: '#'
            }
          ],
          economy: [
            {
              id: 'mock-economy-1',
              title: 'Federal Reserve Signals Potential Rate Cuts in 2024',
              summary: 'Fed officials hint at possible monetary policy easing as inflation shows signs of cooling.',
              content: 'Federal Reserve officials have indicated that interest rate cuts may be on the table for 2024 if inflation continues its downward trend. The central bank remains cautious but optimistic about economic conditions.',
              category: 'economy' as const,
              sentiment: 'positive' as const,
              impact: 'high' as const,
              timestamp: new Date().toISOString(),
              tags: ['Federal Reserve', 'Interest Rates', 'Inflation'],
              source: 'Wall Street Journal',
              trending: true,
              url: '#'
            }
          ],
          stock: [
            {
              id: 'mock-stock-1',
              title: 'Tech Giants Report Strong Q4 Earnings Despite Market Volatility',
              summary: 'Major technology companies exceed analyst expectations with robust quarterly performance.',
              content: 'Leading technology companies have reported impressive fourth-quarter earnings, demonstrating resilience despite broader market challenges. Cloud computing and AI investments continue to drive growth.',
              category: 'stock' as const,
              sentiment: 'positive' as const,
              impact: 'medium' as const,
              timestamp: new Date().toISOString(),
              tags: ['Tech Stocks', 'Earnings', 'Q4 Results'],
              source: 'MarketWatch',
              trending: false,
              url: '#'
            }
          ]
        };
        
        if (cat === 'all') {
          return [
            ...mockData.crypto.slice(0, 2),
            ...mockData.india.slice(0, 2),
            ...mockData.global.slice(0, 2),
            ...mockData.economy.slice(0, 1),
            ...mockData.stock.slice(0, 1)
          ];
        }
        
        return mockData[cat as keyof typeof mockData] || mockData.global;
      };
      
      const mockArticles = getCategoryMockData(category);
      setArticles(mockArticles);
      setFilteredArticles(mockArticles);
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

  // Update category counts
  useEffect(() => {
    categories.forEach(category => {
      if (category.id === 'all') {
        category.count = articles.length;
      } else {
        category.count = articles.filter(article => article.category === category.id).length;
      }
    });
  }, [articles]);

  // Get sentiment styling
  const getSentimentStyle = (sentiment: string) => {
    switch (sentiment) {
      case 'positive':
        return { 
          color: 'text-green-600 dark:text-green-400', 
          bg: 'bg-green-50/50 dark:bg-green-950/10 border-green-200/50 dark:border-green-800/50',
          icon: TrendingUp 
        };
      case 'negative':
        return { 
          color: 'text-red-600 dark:text-red-400', 
          bg: 'bg-red-50/50 dark:bg-red-950/10 border-red-200/50 dark:border-red-800/50',
          icon: TrendingDown 
        };
      default:
        return { 
          color: 'text-blue-600 dark:text-blue-400', 
          bg: 'bg-blue-50/50 dark:bg-blue-950/10 border-blue-200/50 dark:border-blue-800/50',
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
          bg: 'bg-red-50/50 dark:bg-red-950/10 border-red-200/50 dark:border-red-800/50',
          icon: Flame,
          label: 'High Impact'
        };
      case 'medium':
        return { 
          color: 'text-yellow-600 dark:text-yellow-400', 
          bg: 'bg-yellow-50/50 dark:bg-yellow-950/10 border-yellow-200/50 dark:border-yellow-800/50',
          icon: Zap,
          label: 'Medium Impact'
        };
      default:
        return {
          color: 'text-blue-600 dark:text-blue-400',
          bg: 'bg-blue-50/50 dark:bg-blue-950/10 border-blue-200/50 dark:border-blue-800/50',
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
    <main className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 pt-20 pb-8">
        {/* Modern Header with Gradient */}
        <motion.div 
          className="mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500/10 via-blue-500/10 to-purple-500/10 border border-border/50 p-6 md:p-8">
            {/* Background Pattern */}
            <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
            
            <div className="relative z-10">
              <div className="text-center mb-8">
                <div className="flex items-center justify-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-blue-500 flex items-center justify-center text-white shadow-lg">
                    <Newspaper className="h-6 w-6" />
                  </div>
                  <div>
                    <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
                      Market News
                    </h1>
                  </div>
                </div>
                <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                  Real-time cryptocurrency and financial market news powered by AI
                </p>
                <div className="flex items-center justify-center gap-2 mt-4">
                  <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/30">
                    <Sparkles className="h-3 w-3 mr-1" />
                    AI-Powered
                  </Badge>
                  <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/30">
                    <Activity className="h-3 w-3 mr-1 animate-pulse" />
                    Live Updates
                  </Badge>
                </div>
              </div>

              {/* Controls */}
              <div className="flex flex-col md:flex-row items-center justify-center gap-4 mb-6">
                <div className="relative w-full md:w-80">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search news, companies, or topics..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 border-border/50 focus:border-primary/50 bg-background/50 backdrop-blur-sm"
                  />
                </div>
                <Button
                  variant="outline"
                  onClick={() => fetchNews(selectedCategory)}
                  disabled={refreshing}
                  className="border-border/50 hover:border-primary/50 transition-all backdrop-blur-sm"
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
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all border ${
                        isActive 
                          ? `${category.bg} ${category.border} scale-105 shadow-lg` 
                          : 'bg-background/50 border-border/50 hover:bg-background/70 hover:border-border'
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
            </div>
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
                <Card className="h-96 border-border/50 shadow-lg">
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
                const sentimentStyle = getSentimentStyle(article.sentiment ?? 'neutral');
                const impactStyle = getImpactStyle(article.impact ?? 'low');
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
                    <Card className="h-full border-border/50 shadow-lg bg-card/50 backdrop-blur-sm hover:shadow-xl transition-all duration-300">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between gap-2 mb-3">
                          <div className="flex flex-wrap gap-2">
                            <Badge variant="outline" className={`${sentimentStyle.bg} ${sentimentStyle.color} text-xs border`}>
                              <SentimentIcon className="h-3 w-3 mr-1" />
                              {(article.sentiment ?? 'neutral').charAt(0).toUpperCase() + (article.sentiment ?? 'neutral').slice(1)}
                            </Badge>
                            <Badge variant="outline" className={`${impactStyle.bg} ${impactStyle.color} text-xs border`}>
                              <ImpactIcon className="h-3 w-3 mr-1" />
                              {impactStyle.label}
                            </Badge>
                            {article.trending && (
                              <Badge variant="outline" className="bg-orange-500/10 text-orange-600 border-orange-500/30 text-xs">
                                <Flame className="h-3 w-3 mr-1" />
                                Trending
                              </Badge>
                            )}
                          </div>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-6 w-6"
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
                              className="h-6 w-6"
                              onClick={() => shareArticle(article)}
                            >
                              <Share2 className="h-3 w-3 text-muted-foreground" />
                            </Button>
                          </div>
                        </div>
                        
                        {article.image && (
                          <a href={article.url} target="_blank" rel="noopener noreferrer">
                            <img
                              src={article.image}
                              alt={article.title}
                              className="w-full h-40 object-cover rounded-lg mb-3 border border-border/50"
                              loading="lazy"
                            />
                          </a>
                        )}
                        
                        <CardTitle className="text-base font-bold line-clamp-2 group-hover:text-primary transition-colors">
                          {article.url ? (
                            <a href={article.url} target="_blank" rel="noopener noreferrer" className="hover:underline flex items-start gap-2">
                              <span className="flex-1">{article.title}</span>
                              <ExternalLink className="h-4 w-4 flex-shrink-0 mt-0.5" />
                            </a>
                          ) : (
                            article.title
                          )}
                        </CardTitle>
                        
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatTime(article.timestamp)}
                          </div>
                          <Badge variant="outline" className="text-xs border-border/50">
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
                        
                        <div className="flex items-center justify-between pt-3 border-t border-border/30">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedArticle(article)}
                            className="border-border/50 hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all"
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
                className="bg-card border border-border/50 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-6 border-b border-border/50">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h2 className="text-xl font-bold mb-3 leading-tight">
                        {selectedArticle.title}
                      </h2>
                      <div className="flex flex-wrap gap-2 mb-3">
                        <Badge variant="outline" className={`${getSentimentStyle(selectedArticle.sentiment ?? 'neutral').bg} ${getSentimentStyle(selectedArticle.sentiment ?? 'neutral').color} text-xs border`}>
                          {(selectedArticle.sentiment ?? 'neutral').charAt(0).toUpperCase() + (selectedArticle.sentiment ?? 'neutral').slice(1)}
                        </Badge>
                        <Badge variant="outline" className={`${getImpactStyle(selectedArticle.impact ?? 'low').bg} ${getImpactStyle(selectedArticle.impact ?? 'low').color} text-xs border`}>
                          {getImpactStyle(selectedArticle.impact ?? 'low').label}
                        </Badge>
                        {selectedArticle.url && (
                          <Badge variant="outline" className="text-xs border-border/50">
                            <a href={selectedArticle.url} target="_blank" rel="noopener noreferrer" className="hover:underline flex items-center gap-1">
                              {selectedArticle.source}
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          </Badge>
                        )}
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
                
                {selectedArticle.image && (
                  <a href={selectedArticle.url} target="_blank" rel="noopener noreferrer">
                    <img
                      src={selectedArticle.image}
                      alt={selectedArticle.title}
                      className="w-full h-56 object-cover border-b border-border/50"
                      loading="lazy"
                    />
                  </a>
                )}
                
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
                
                <div className="p-4 border-t border-border/50 bg-muted/20">
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