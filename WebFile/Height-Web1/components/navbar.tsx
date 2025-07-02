// components/navbar.tsx - Fixed and Simplified
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
  TrendingUp,
  CreditCard,
  Bitcoin,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const NAVIGATION_ITEMS = [
  { href: '/home', label: 'Dashboard', icon: Home },
  { href: '/trading', label: 'Crypto Trading', icon: Bitcoin, badge: 'NEW' },
  { href: '/watchlist', label: 'Watchlist', icon: BookmarkCheck },
  { href: '/portfolio', label: 'Portfolio', icon: PieChart },
  { href: '/ai', label: 'AI Assistant', icon: Brain, badge: 'New' },
  { href: '/news', label: 'News', icon: Globe },
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
      await signOut();
      
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

  if (!mounted) {
    return (
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-b">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2">
              <HeightsLogo size="lg" />
              <span className="text-xl font-bold bg-gradient-to-r from-[#27391C] to-[#1F7D53] bg-clip-text text-transparent">
                Heights
              </span>
            </Link>
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav className={cn(
      "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
      scrolled 
        ? "bg-background/95 backdrop-blur-md shadow-lg border-b" 
        : "bg-background/80 backdrop-blur-sm border-b"
    )}>
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link 
            href={isAuthenticated ? "/home" : "/"} 
            className="flex items-center gap-2 flex-shrink-0"
          >
            <HeightsLogo size="lg" />
            <span className="hidden sm:block text-xl font-bold bg-gradient-to-r from-[#27391C] to-[#1F7D53] bg-clip-text text-transparent">
              Heights
            </span>
          </Link>

          {/* Desktop Navigation - Center */}
          {isAuthenticated && (
            <div className="hidden lg:flex items-center gap-1 flex-1 justify-center max-w-3xl mx-8">
              {NAVIGATION_ITEMS.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href || 
                  (item.href !== '/home' && pathname?.startsWith(item.href));
                
                return (
                  <Link key={item.href} href={item.href}>
                    <Button
                      variant={isActive ? "default" : "ghost"}
                      size="sm"
                      className={cn(
                        "relative gap-2 transition-all duration-200",
                        isActive 
                          ? 'bg-gradient-to-r from-[#27391C] to-[#1F7D53] text-white shadow-lg' 
                          : 'hover:bg-muted/80'
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      <span className="font-medium">{item.label}</span>
                      {item.badge && (
                        <Badge variant="secondary" className="text-xs ml-1">
                          {item.badge}
                        </Badge>
                      )}
                    </Button>
                  </Link>
                );
              })}
            </div>
          )}

          {/* Right Side Actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {isAuthenticated ? (
              <>
                {/* Connect Wallet Button - Desktop Only */}
                {!isConnected && (
                  <div className="hidden md:block">
                    <ConnectWalletButton />
                  </div>
                )}

                {/* Balance Display - Desktop Only */}
                {isConnected && walletBalance && (
                  <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-muted/50 rounded-full border">
                    <Wallet className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">
                      {formatBalance(walletBalance.balance)}
                    </span>
                  </div>
                )}

                {/* Theme Toggle */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-9 w-9 p-0">
                      {getThemeIcon()}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setTheme('light')}>
                      <Sun className="h-4 w-4 mr-2" />
                      Light
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setTheme('dark')}>
                      <Moon className="h-4 w-4 mr-2" />
                      Dark
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setTheme('system')}>
                      <Monitor className="h-4 w-4 mr-2" />
                      System
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* User Menu - Desktop */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="hidden sm:flex relative gap-2 h-auto py-1.5 px-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage 
                          src={profile?.avatar_url || ''} 
                          alt={profile?.full_name || user?.email || 'User'} 
                        />
                        <AvatarFallback>
                          {(profile?.full_name || user?.email || 'U').charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="hidden md:block text-left">
                        <p className="text-sm font-medium">
                          {profile?.full_name || user?.email?.split('@')[0]}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {profile?.kyc_completed ? 'Verified' : 'Unverified'}
                        </p>
                      </div>
                      <ChevronDown className="h-4 w-4 opacity-50" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>
                      <div className="flex flex-col">
                        <p className="font-medium">
                          {profile?.full_name || user?.email?.split('@')[0]}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {user?.email}
                        </p>
                      </div>
                    </DropdownMenuLabel>
                    
                    <DropdownMenuSeparator />
                    
                    <DropdownMenuItem asChild>
                      <Link href="/profile">
                        <User className="h-4 w-4 mr-2" />
                        Profile
                      </Link>
                    </DropdownMenuItem>
                    
                    <DropdownMenuItem asChild>
                      <Link href="/portfolio">
                        <PieChart className="h-4 w-4 mr-2" />
                        Portfolio
                      </Link>
                    </DropdownMenuItem>
                    
                    <DropdownMenuItem asChild>
                      <Link href="/wallet">
                        <CreditCard className="h-4 w-4 mr-2" />
                        Wallet
                      </Link>
                    </DropdownMenuItem>
                    
                    <DropdownMenuSeparator />
                    
                    <DropdownMenuItem 
                      onClick={handleSignOut}
                      disabled={isLoggingOut}
                      className="text-red-600 focus:text-red-600"
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
                      className="lg:hidden h-9 w-9 p-0"
                    >
                      <Menu className="h-5 w-5" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="right" className="w-[300px] sm:w-[350px]">
                    <SheetHeader>
                      <SheetTitle>Menu</SheetTitle>
                    </SheetHeader>
                    
                    <div className="mt-6 flex flex-col gap-4">
                      {/* User Info */}
                      <div className="flex items-center gap-3 pb-4 border-b">
                        <Avatar className="h-10 w-10">
                          <AvatarImage 
                            src={profile?.avatar_url || ''} 
                            alt={profile?.full_name || user?.email || 'User'} 
                          />
                          <AvatarFallback>
                            {(profile?.full_name || user?.email || 'U').charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">
                            {profile?.full_name || user?.email?.split('@')[0]}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {user?.email}
                          </p>
                        </div>
                      </div>

                      {/* Mobile Wallet Connect */}
                      {!isConnected && (
                        <div className="pb-4 border-b">
                          <ConnectWalletButton />
                        </div>
                      )}

                      {/* Navigation Items */}
                      <div className="space-y-1">
                        {NAVIGATION_ITEMS.map((item) => {
                          const Icon = item.icon;
                          const isActive = pathname === item.href || 
                            (item.href !== '/home' && pathname?.startsWith(item.href));
                          
                          return (
                            <Link key={item.href} href={item.href}>
                              <Button
                                variant={isActive ? "secondary" : "ghost"}
                                className="w-full justify-start gap-3"
                                onClick={() => setMobileMenuOpen(false)}
                              >
                                <Icon className="h-4 w-4" />
                                {item.label}
                                {item.badge && (
                                  <Badge variant="secondary" className="ml-auto">
                                    {item.badge}
                                  </Badge>
                                )}
                              </Button>
                            </Link>
                          );
                        })}
                      </div>

                      {/* Mobile Footer Actions */}
                      <div className="mt-auto pt-4 border-t space-y-1">
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
                          className="w-full justify-start gap-3 text-red-600 hover:text-red-600"
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
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-9 w-9 p-0">
                      {getThemeIcon()}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setTheme('light')}>
                      <Sun className="h-4 w-4 mr-2" />
                      Light
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setTheme('dark')}>
                      <Moon className="h-4 w-4 mr-2" />
                      Dark
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setTheme('system')}>
                      <Monitor className="h-4 w-4 mr-2" />
                      System
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <Button variant="ghost" size="sm" asChild className="hidden sm:flex">
                  <Link href="/login">Sign In</Link>
                </Button>
                <Button size="sm" asChild className="bg-gradient-to-r from-[#27391C] to-[#1F7D53]">
                  <Link href="/signup">Get Started</Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}