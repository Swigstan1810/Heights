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
  Unplug
} from 'lucide-react';
import { motion, AnimatePresence } from "framer-motion";

const NAVIGATION_ITEMS = [
  { href: '/home', label: 'Dashboard', icon: Home },
  { href: '/crypto', label: 'Trade', icon: Star },
  { href: '/watchlist', label: 'Watchlist', icon: BookmarkCheck },
  { href: '/portfolio', label: 'Portfolio', icon: PieChart },
  { href: '/ai', label: 'AI Assistant', icon: Brain },
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

  useEffect(() => {
    setMounted(true);
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
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800">
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
      className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-b border-border"
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link href={isAuthenticated ? "/home" : "/"} className="flex items-center gap-2">
            <HeightsLogo size="lg" />
            <span className="text-xl font-bold bg-gradient-to-r from-[#27391C] to-[#1F7D53] bg-clip-text text-transparent">
              Heights
            </span>
          </Link>

          {isAuthenticated && (
            <div className="hidden md:flex items-center gap-1">
              {NAVIGATION_ITEMS.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href || 
                  (item.href !== '/home' && pathname && pathname.startsWith(item.href));
                
                return (
                  <Link key={item.href} href={item.href}>
                    <Button
                      variant={isActive ? "default" : "ghost"}
                      className={`relative gap-2 ${
                        isActive 
                          ? 'bg-primary text-primary-foreground' 
                          : 'hover:bg-muted'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      {item.label}
                      {item.label === 'AI Assistant' && (
                        <Badge variant="secondary" className="text-xs">
                          New
                        </Badge>
                      )}
                      {item.label === 'Trade' && !isConnected && (
                        <Badge variant="outline" className="text-xs">
                          <Unplug className="h-3 w-3 mr-1" />
                          Connect
                        </Badge>
                      )}
                    </Button>
                  </Link>
                );
              })}
            </div>
          )}

          <div className="flex items-center gap-2">
            {isAuthenticated ? (
              <>
                <div className="hidden sm:block">
                  <ConnectWalletButton />
                </div>

                {walletBalance && !isConnected && (
                  <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-muted rounded-full">
                    <Wallet className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">
                      {formatBalance(walletBalance.balance)}
                    </span>
                  </div>
                )}

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="relative">
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

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage 
                          src={profile?.avatar_url || profile?.google_avatar_url || ''} 
                          alt={profile?.full_name || user?.email || 'User'} 
                        />
                        <AvatarFallback>
                          {(profile?.full_name || user?.email || 'U').charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="hidden sm:block text-left">
                        <p className="text-sm font-medium">
                          {profile?.full_name || user?.email?.split('@')[0]}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {profile?.kyc_completed ? 'Verified' : 'Unverified'}
                        </p>
                      </div>
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarImage 
                            src={profile?.avatar_url || profile?.google_avatar_url || ''} 
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
                          <p className="text-xs text-muted-foreground">
                            {user?.email}
                          </p>
                        </div>
                      </div>
                    </DropdownMenuLabel>
                    
                    {isConnected && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem disabled>
                          <div className="flex items-center gap-2 text-xs">
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                            <span>Wallet Connected</span>
                          </div>
                        </DropdownMenuItem>
                      </>
                    )}
                    
                    <DropdownMenuSeparator />
                    
                    <DropdownMenuItem asChild>
                      <Link href="/profile" className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Profile
                      </Link>
                    </DropdownMenuItem>
                    
                    <DropdownMenuItem asChild>
                      <Link href="/wallet" className="flex items-center gap-2">
                        <Wallet className="h-4 w-4" />
                        Wallet
                      </Link>
                    </DropdownMenuItem>
                    
                    <DropdownMenuItem asChild>
                      <Link href="/portfolio" className="flex items-center gap-2">
                        <PieChart className="h-4 w-4" />
                        Portfolio
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
                      <Bookmark className="h-4 w-4 mr-2" />
                      Saved Analysis
                    </DropdownMenuItem>
                    
                    <DropdownMenuSeparator />
                    
                    <DropdownMenuItem asChild>
                      <Link href="/settings" className="flex items-center gap-2">
                        <Settings className="h-4 w-4" />
                        Settings
                      </Link>
                    </DropdownMenuItem>
                    
                    <DropdownMenuItem>
                      <Shield className="h-4 w-4 mr-2" />
                      Security
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

                <Button
                  variant="ghost"
                  size="sm"
                  className="md:hidden"
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                >
                  {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
                </Button>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
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

                <Button variant="ghost" asChild>
                  <Link href="/login">Sign In</Link>
                </Button>
                <Button asChild>
                  <Link href="/signup">Get Started</Link>
                </Button>
              </div>
            )}
          </div>
        </div>

        <AnimatePresence>
          {mobileMenuOpen && isAuthenticated && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden border-t border-border"
            >
              <div className="py-4 space-y-2">
                <div className="px-4 pb-4">
                  <ConnectWalletButton />
                </div>

                {walletBalance && !isConnected && (
                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg mb-4 mx-4">
                    <div className="flex items-center gap-2">
                      <Wallet className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium">Available Balance</span>
                    </div>
                    <span className="font-bold">
                      {formatBalance(walletBalance.balance)}
                    </span>
                  </div>
                )}

                {NAVIGATION_ITEMS.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href || 
                    (item.href !== '/home' && pathname && pathname.startsWith(item.href));
                  
                  return (
                    <Link key={item.href} href={item.href}>
                      <Button
                        variant={isActive ? "default" : "ghost"}
                        className="w-full justify-start gap-3"
                      >
                        <Icon className="h-4 w-4" />
                        {item.label}
                        {item.label === 'AI Assistant' && (
                          <Badge variant="secondary" className="text-xs ml-auto">
                            New
                          </Badge>
                        )}
                        {item.label === 'Trade' && !isConnected && (
                          <Badge variant="outline" className="text-xs ml-auto">
                            <Unplug className="h-3 w-3 mr-1" />
                            Connect
                          </Badge>
                        )}
                      </Button>
                    </Link>
                  );
                })}

                <div className="pt-4 border-t border-border">
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
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.nav>
  );
}