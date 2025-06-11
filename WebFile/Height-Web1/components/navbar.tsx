"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
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
  Search,
  ChevronDown,
  Star,
  Bookmark,
  History,
  Shield,
  HelpCircle,
  Sun,
  Moon,
  Monitor,
  BookmarkCheck
} from 'lucide-react';

const NAVIGATION_ITEMS = [
  { href: '/home', label: 'Dashboard', icon: Home },
  { href: '/watchlist', label: 'Watchlist', icon: BookmarkCheck },
  { href: '/portfolio', label: 'Portfolio', icon: PieChart },
  { href: '/crypto', label: 'Crypto', icon: Star },
  { href: '/ai', label: 'AI Assistant', icon: Brain },
  { href: '/news', label: 'News', icon: Globe },
];

export function Navbar() {
  const { user, isAuthenticated, signOut, walletBalance, profile } = useAuth();
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Ensure component is mounted before showing theme
  useEffect(() => {
    setMounted(true);
  }, []);

  // Close mobile menu when route changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  const handleSignOut = async () => {
    await signOut();
    router.push('/login');
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

  return (
    <motion.nav 
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-b border-border"
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href={isAuthenticated ? "/home" : "/"} className="flex items-center gap-2">
            <HeightsLogo size="lg" />
            <span className="text-xl font-bold bg-gradient-to-r from-[#27391C] to-[#1F7D53] bg-clip-text text-transparent">
              Heights
            </span>
          </Link>

          {/* Desktop Navigation */}
          {isAuthenticated && (
            <div className="hidden md:flex items-center gap-1">
              {NAVIGATION_ITEMS.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href || 
                  (item.href !== '/home' && pathname.startsWith(item.href));
                
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
                    </Button>
                  </Link>
                );
              })}
            </div>
          )}

          {/* Right Side Actions */}
          <div className="flex items-center gap-2">
            {isAuthenticated ? (
              <>
                {/* Wallet Balance */}
                {walletBalance && (
                  <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-muted rounded-full">
                    <Wallet className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">
                      {formatBalance(walletBalance.balance)}
                    </span>
                  </div>
                )}

                {/* Theme Toggle */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
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

                {/* User Menu */}
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
                      className="text-red-600 focus:text-red-600"
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Mobile Menu Button */}
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
                {/* Theme Toggle for non-authenticated users */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
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

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileMenuOpen && isAuthenticated && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden border-t border-border"
            >
              <div className="py-4 space-y-2">
                {/* Wallet Balance Mobile */}
                {walletBalance && (
                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg mb-4">
                    <div className="flex items-center gap-2">
                      <Wallet className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium">Available Balance</span>
                    </div>
                    <span className="font-bold">
                      {formatBalance(walletBalance.balance)}
                    </span>
                  </div>
                )}

                {/* Mobile Navigation Items */}
                {NAVIGATION_ITEMS.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href || 
                    (item.href !== '/home' && pathname.startsWith(item.href));
                  
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
                      </Button>
                    </Link>
                  );
                })}

                <div className="pt-4 border-t border-border">
                  <Button
                    variant="ghost"
                    className="w-full justify-start gap-3 text-red-600 hover:text-red-600 hover:bg-red-50"
                    onClick={handleSignOut}
                  >
                    <LogOut className="h-4 w-4" />
                    Sign Out
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