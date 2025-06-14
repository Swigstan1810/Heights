// components/navbar.tsx - Enhanced Responsive Design
"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useAuth } from '@/contexts/auth-context';
import { HeightsLogo } from '@/components/ui/heights-logo';
import { useTheme } from 'next-themes';
import { ConnectWalletButton } from '@/components/wallet/connect-wallet-button';
import { useAccount } from 'wagmi';
import { 
  Home, 
  PieChart, 
  Globe, 
  User, 
  Settings, 
  LogOut,
  Menu,
  X,
  Wallet,
  Brain,
  ChevronDown,
  Star,
  Bookmark,
  History,
  Shield,
  HelpCircle,
  Sun,
  Moon,
  Monitor,
  BookmarkCheck,
  Unplug,
  Activity,
  Bell,
  Search,
  TrendingUp,
  CreditCard,
  Smartphone
} from 'lucide-react';
import { motion, AnimatePresence } from "framer-motion";
import { cn } from '@/lib/utils';

const NAVIGATION_ITEMS = [
  { href: '/home', label: 'Dashboard', icon: Home, description: 'Overview & portfolio' },
  { href: '/crypto', label: 'Trade', icon: TrendingUp, description: 'Buy & sell crypto' },
  { href: '/watchlist', label: 'Watchlist', icon: BookmarkCheck, description: 'Track your favorites' },
  { href: '/portfolio', label: 'Portfolio', icon: PieChart, description: 'Your investments' },
  { href: '/ai', label: 'AI Assistant', icon: Brain, description: 'Smart investment help', badge: 'New' },
  { href: '/news', label: 'News', icon: Globe, description: 'Market updates' },
];

export function Navbar() {
  const { user, isAuthenticated, signOut, walletBalance, profile } = useAuth();
  const { theme, setTheme } = useTheme();
  const { isConnected } = useAccount();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  const handleSignOut = async () => {
    try {
      setIsLoggingOut(true);
      console.log('[Navbar] Starting logout process...');
      
      await signOut();
      
      console.log('[Navbar] Logout successful, redirecting...');
      
      if (typeof window !== 'undefined') {
        localStorage.removeItem('heights_remember_email');
        localStorage.removeItem('supabase.auth.token');
        sessionStorage.clear();
      }
      
      window.location.href = '/login';
      
    } catch (error) {
      console.error('[Navbar] Error during logout:', error);
      window.location.href = '/login';
    } finally {
      setIsLoggingOut(false);
    }
  };

  const formatBalance = (balance: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(balance);
  };

  const getThemeIcon = () => {
    if (!mounted) return <Monitor className="h-4 w-4" />;
    switch (theme) {
      case 'light':
        return <Sun className="h-4 w-4" />;
      case 'dark':
        return <Moon className="h-4 w-4" />;
      default:
        return <Monitor className="h-4 w-4" />;
    }
  };

  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme);
  };

  if (!mounted) {
    return (
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-gray-950/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2">
              <HeightsLogo size="lg" />
              <span className="text-xl font-bold bg-gradient-to-r from-[#27391C] to-[#1F7D53] bg-clip-text text-transparent">
                Heights
              </span>
            </Link>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" disabled>
                <Monitor className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </nav>
    );
  }

  return (
    <motion.nav 
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        scrolled 
          ? "bg-background/95 backdrop-blur-md shadow-lg border-b border-border/50" 
          : "bg-background/80 backdrop-blur-sm border-b border-border/30"
      )}
    >
      <div className="container mx-auto px-3 sm:px-4 lg:px-6">
        <div className="flex items-center justify-between h-14 sm:h-16">
          {/* Logo */}
          <Link 
            href={isAuthenticated ? "/home" : "/"} 
            className="flex items-center gap-2 shrink-0"
          >
            <HeightsLogo size="lg" />
            <span className="hidden sm:block text-xl font-bold bg-gradient-to-r from-[#27391C] to-[#1F7D53] bg-clip-text text-transparent">
              Heights
            </span>
          </Link>

          {/* Desktop Navigation */}
          {isAuthenticated && (
            <div className="hidden lg:flex items-center gap-1 flex-1 justify-center max-w-2xl mx-8">
              {NAVIGATION_ITEMS.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href || 
                  (item.href !== '/home' && pathname && pathname.startsWith(item.href));
                
                return (
                  <Link key={item.href} href={item.href}>
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Button
                        variant={isActive ? "default" : "ghost"}
                        size="sm"
                        className={cn(
                          "relative gap-2 transition-all duration-200",
                          isActive 
                            ? 'bg-gradient-to-r from-[#27391C] to-[#1F7D53] text-white shadow-lg' 
                            : 'hover:bg-muted/80 hover:scale-105'
                        )}
                      >
                        <Icon className="h-4 w-4" />
                        <span className="font-medium">{item.label}</span>
                        {item.badge && (
                          <Badge variant="secondary" className="text-xs ml-1 animate-pulse">
                            {item.badge}
                          </Badge>
                        )}
                        {item.label === 'Trade' && !isConnected && (
                          <Badge variant="outline" className="text-xs ml-1">
                            <Unplug className="h-3 w-3 mr-1" />
                            Connect
                          </Badge>
                        )}
                      </Button>
                    </motion.div>
                  </Link>
                );
              })}
            </div>
          )}

          {/* Right Side Actions */}
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            {isAuthenticated ? (
              <>
                {/* Wallet Connect - Hidden on small screens */}
                <div className="hidden md:block">
                  <ConnectWalletButton />
                </div>

                {/* Balance Display - Hidden on small screens */}
                {walletBalance && !isConnected && (
                  <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-muted/50 rounded-full border">
                    <Wallet className="h-3 w-3 text-primary" />
                    <span className="text-sm font-medium">
                      {formatBalance(walletBalance.balance)}
                    </span>
                  </div>
                )}

                {/* Notifications - Hidden on mobile */}
                <Button variant="ghost" size="sm" className="hidden sm:flex relative">
                  <Bell className="h-4 w-4" />
                  <Badge variant="destructive" className="absolute -top-1 -right-1 h-4 w-4 p-0 text-xs">
                    3
                  </Badge>
                </Button>

                {/* Theme Toggle */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      {getThemeIcon()}
                      <span className="sr-only">Toggle theme</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="min-w-[120px]">
                    <DropdownMenuItem 
                      onClick={() => handleThemeChange('light')}
                      className={`cursor-pointer ${theme === 'light' ? 'bg-accent' : ''}`}
                    >
                      <Sun className="h-4 w-4 mr-2" />
                      Light
                      {theme === 'light' && <span className="ml-auto text-primary">✓</span>}
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => handleThemeChange('dark')}
                      className={`cursor-pointer ${theme === 'dark' ? 'bg-accent' : ''}`}
                    >
                      <Moon className="h-4 w-4 mr-2" />
                      Dark
                      {theme === 'dark' && <span className="ml-auto text-primary">✓</span>}
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => handleThemeChange('system')}
                      className={`cursor-pointer ${theme === 'system' ? 'bg-accent' : ''}`}
                    >
                      <Monitor className="h-4 w-4 mr-2" />
                      System
                      {theme === 'system' && <span className="ml-auto text-primary">✓</span>}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* User Menu - Desktop */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="hidden sm:flex relative gap-2 h-auto py-1.5 px-2">
                      <Avatar className="h-7 w-7">
                        <AvatarImage 
                          src={profile?.avatar_url || profile?.google_avatar_url || ''} 
                          alt={profile?.full_name || user?.email || 'User'} 
                        />
                        <AvatarFallback className="text-xs">
                          {(profile?.full_name || user?.email || 'U').charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="hidden md:block text-left text-xs">
                        <p className="font-medium leading-none">
                          {profile?.full_name || user?.email?.split('@')[0]}
                        </p>
                        <p className="text-muted-foreground">
                          {profile?.kyc_completed ? 'Verified' : 'Unverified'}
                        </p>
                      </div>
                      <ChevronDown className="h-3 w-3 opacity-50" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-64">
                    <DropdownMenuLabel>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage 
                            src={profile?.avatar_url || profile?.google_avatar_url || ''} 
                            alt={profile?.full_name || user?.email || 'User'} 
                          />
                          <AvatarFallback>
                            {(profile?.full_name || user?.email || 'U').charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">
                            {profile?.full_name || user?.email?.split('@')[0]}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {user?.email}
                          </p>
                          <div className="flex items-center gap-1 mt-1">
                            {profile?.kyc_completed ? (
                              <Badge variant="secondary" className="text-xs">
                                <Shield className="h-3 w-3 mr-1" />
                                Verified
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-xs">
                                Unverified
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </DropdownMenuLabel>
                    
                    {/* Connection Status */}
                    {isConnected && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem disabled className="justify-center">
                          <div className="flex items-center gap-2 text-xs text-green-600">
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                            <span>Wallet Connected</span>
                          </div>
                        </DropdownMenuItem>
                      </>
                    )}
                    
                    {/* Balance on Mobile */}
                    {walletBalance && !isConnected && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem disabled>
                          <div className="flex items-center justify-between w-full">
                            <div className="flex items-center gap-2">
                              <Wallet className="h-4 w-4 text-primary" />
                              <span>Balance</span>
                            </div>
                            <span className="font-bold">
                              {formatBalance(walletBalance.balance)}
                            </span>
                          </div>
                        </DropdownMenuItem>
                      </>
                    )}
                    
                    <DropdownMenuSeparator />
                    
                    {/* Quick Actions */}
                    <DropdownMenuItem asChild>
                      <Link href="/profile" className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Profile & Settings
                      </Link>
                    </DropdownMenuItem>
                    
                    <DropdownMenuItem asChild>
                      <Link href="/portfolio" className="flex items-center gap-2">
                        <PieChart className="h-4 w-4" />
                        Portfolio
                      </Link>
                    </DropdownMenuItem>
                    
                    <DropdownMenuItem asChild>
                      <Link href="/wallet" className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4" />
                        Wallet & Cards
                      </Link>
                    </DropdownMenuItem>
                    
                    <DropdownMenuSeparator />
                    
                    <DropdownMenuItem>
                      <Star className="h-4 w-4 mr-2" />
                      Favorites
                    </DropdownMenuItem>
                    
                    <DropdownMenuItem>
                      <History className="h-4 w-4 mr-2" />
                      Order History
                    </DropdownMenuItem>
                    
                    <DropdownMenuItem>
                      <HelpCircle className="h-4 w-4 mr-2" />
                      Help & Support
                    </DropdownMenuItem>
                    
                    <DropdownMenuSeparator />
                    
                    <DropdownMenuItem 
                      onClick={handleSignOut}
                      disabled={isLoggingOut}
                      className="text-red-600 focus:text-red-600 cursor-pointer"
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      {isLoggingOut ? 'Signing Out...' : 'Sign Out'}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Mobile Menu Toggle */}
                <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                  <SheetTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="lg:hidden h-8 w-8 p-0"
                    >
                      <Menu className="h-4 w-4" />
                      <span className="sr-only">Toggle menu</span>
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="right" className="w-[300px] sm:w-[350px] p-0">
                    <SheetHeader className="p-6 pb-4 border-b">
                      <SheetTitle className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage 
                            src={profile?.avatar_url || profile?.google_avatar_url || ''} 
                            alt={profile?.full_name || user?.email || 'User'} 
                          />
                          <AvatarFallback>
                            {(profile?.full_name || user?.email || 'U').charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 text-left">
                          <p className="font-semibold">
                            {profile?.full_name || user?.email?.split('@')[0]}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {user?.email}
                          </p>
                        </div>
                      </SheetTitle>
                    </SheetHeader>

                    <div className="flex flex-col h-full">
                      {/* Wallet Section */}
                      <div className="p-6 space-y-4">
                        <ConnectWalletButton />
                        {/* Balance Display */}
                        {walletBalance && !isConnected && (
                          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border">
                            <div className="flex items-center gap-2">
                              <Wallet className="h-4 w-4 text-primary" />
                              <span className="text-sm font-medium">Available</span>
                            </div>
                            <span className="font-bold">
                              {formatBalance(walletBalance.balance)}
                            </span>
                          </div>
                        )}

                        {/* Connection Status */}
                        {isConnected && (
                          <div className="flex items-center justify-center p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
                            <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                              <span>Wallet Connected</span>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Navigation Items */}
                      <div className="flex-1 px-6 space-y-2">
                        {NAVIGATION_ITEMS.map((item) => {
                          const Icon = item.icon;
                          const isActive = pathname === item.href || 
                            (item.href !== '/home' && pathname && pathname.startsWith(item.href));
                          
                          return (
                            <Link key={item.href} href={item.href}>
                              <motion.div
                                whileTap={{ scale: 0.95 }}
                                className="w-full"
                              >
                                <Button
                                  variant={isActive ? "default" : "ghost"}
                                  className={cn(
                                    "w-full justify-start gap-3 h-12",
                                    isActive && "bg-gradient-to-r from-[#27391C] to-[#1F7D53] text-white"
                                  )}
                                >
                                  <Icon className="h-4 w-4" />
                                  <div className="flex-1 text-left">
                                    <p className="font-medium">{item.label}</p>
                                    <p className="text-xs opacity-70">{item.description}</p>
                                  </div>
                                  {item.badge && (
                                    <Badge variant="secondary" className="text-xs">
                                      {item.badge}
                                    </Badge>
                                  )}
                                  {item.label === 'Trade' && !isConnected && (
                                    <Badge variant="outline" className="text-xs">
                                      <Unplug className="h-3 w-3 mr-1" />
                                      Connect
                                    </Badge>
                                  )}
                                </Button>
                              </motion.div>
                            </Link>
                          );
                        })}
                      </div>

                      {/* Footer Actions */}
                      <div className="p-6 border-t space-y-2">
                        <Button
                          variant="ghost"
                          className="w-full justify-start gap-3"
                          asChild
                        >
                          <Link href="/settings">
                            <Settings className="h-4 w-4" />
                            Settings
                          </Link>
                        </Button>
                        
                        <Button
                          variant="ghost"
                          className="w-full justify-start gap-3"
                        >
                          <HelpCircle className="h-4 w-4" />
                          Help & Support
                        </Button>
                        
                        <Button
                          variant="ghost"
                          className="w-full justify-start gap-3 text-red-600 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
                          onClick={handleSignOut}
                          disabled={isLoggingOut}
                        >
                          <LogOut className="h-4 w-4" />
                          {isLoggingOut ? 'Signing Out...' : 'Sign Out'}
                        </Button>
                      </div>
                    </div>
                  </SheetContent>
                </Sheet>
              </>
            ) : (
              /* Unauthenticated State */
              <div className="flex items-center gap-2">
                {/* Theme Toggle for Unauthenticated */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      {getThemeIcon()}
                      <span className="sr-only">Toggle theme</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="min-w-[120px]">
                    <DropdownMenuItem 
                      onClick={() => handleThemeChange('light')}
                      className={`cursor-pointer ${theme === 'light' ? 'bg-accent' : ''}`}
                    >
                      <Sun className="h-4 w-4 mr-2" />
                      Light
                      {theme === 'light' && <span className="ml-auto text-primary">✓</span>}
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => handleThemeChange('dark')}
                      className={`cursor-pointer ${theme === 'dark' ? 'bg-accent' : ''}`}
                    >
                      <Moon className="h-4 w-4 mr-2" />
                      Dark
                      {theme === 'dark' && <span className="ml-auto text-primary">✓</span>}
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => handleThemeChange('system')}
                      className={`cursor-pointer ${theme === 'system' ? 'bg-accent' : ''}`}
                    >
                      <Monitor className="h-4 w-4 mr-2" />
                      System
                      {theme === 'system' && <span className="ml-auto text-primary">✓</span>}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <Button variant="ghost" size="sm" asChild className="hidden sm:flex">
                  <Link href="/login">Sign In</Link>
                </Button>
                <Button size="sm" asChild className="bg-gradient-to-r from-[#27391C] to-[#1F7D53] hover:from-[#255F38] hover:to-[#1F7D53]">
                  <Link href="/signup">
                    <span className="hidden sm:inline">Get Started</span>
                    <span className="sm:hidden">Join</span>
                  </Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.nav>
  );
}