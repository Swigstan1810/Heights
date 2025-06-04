// components/navbar.tsx
"use client";
 
import { useState, useEffect } from "react";
import { motion, useScroll, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  Menu, 
  X, 
  Sun, 
  Moon, 
  Wallet, 
  Bell, 
  User, 
  LogOut, 
  BarChart2, 
  ChevronDown,
  BrainCircuit,
  Sparkles,
  Plus,
  Newspaper,
  Bitcoin
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useHeightsTheme } from "@/components/theme-provider";
import { useAuth } from "@/contexts/auth-context";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
 
export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [showPlusAnimation, setShowPlusAnimation] = useState(false);
  const { theme, toggleTheme } = useHeightsTheme();
  const { scrollY } = useScroll();
  const { user, signOut } = useAuth();
  const router = useRouter();
  
  useEffect(() => {
    const updateScrollState = () => {
      setIsScrolled(scrollY.get() > 10);
    };
    
    const unsubscribe = scrollY.on("change", updateScrollState);
    return () => unsubscribe();
  }, [scrollY]);

  // Animate the Heights+ on hover
  const handleAIHover = () => {
    setShowPlusAnimation(true);
  };

  const handleAILeave = () => {
    setShowPlusAnimation(false);
  };

  const handleLogout = async () => {
    await signOut();
    setIsOpen(false);
    router.push('/');
  };
  
  const isAuthenticated = !!user;
  
  return (
    <motion.header
      className={cn(
        "fixed top-0 left-0 right-0 z-40 transition-all duration-300",
        isScrolled ? "bg-background/80 backdrop-blur-md border-b border-border/50" : "bg-transparent"
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex items-center">
              <div className="relative flex items-center justify-center h-8 w-8 mr-2">
                <svg viewBox="0 0 100 100" className="h-6 w-6">
                  <path
                    d="M30,20 L30,80"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="16"
                    strokeLinecap="square"
                  />
                  <path
                    d="M30,20 L80,20"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="16"
                    strokeLinecap="square"
                  />
                </svg>
              </div>
              <span className="text-xl font-bold">Heights</span>
            </Link>
          </div>
          
          <nav className="hidden md:flex items-center space-x-8">
            <Link href="/dashboard?tab=crypto" className="text-sm font-medium hover:text-primary transition-colors flex items-center gap-1">
              <Bitcoin className="h-4 w-4" />
              Crypto
            </Link>
            <Link href="/dashboard?tab=stocks" className="text-sm font-medium hover:text-primary transition-colors">Stocks</Link>
            <Link href="/dashboard?tab=mutual-funds" className="text-sm font-medium hover:text-primary transition-colors">Mutual Funds</Link>
            
            {/* Conditionally render protected links */}
            {isAuthenticated && (
              <>
                <Link href="/portfolio" className="text-sm font-medium hover:text-primary transition-colors">Portfolio</Link>
              </>
            )}
            
            {/* Updated AI Assistant link with Heights+ animation */}
            <Link 
              href="/ai" 
              className="text-sm font-medium hover:text-primary transition-colors"
              onMouseEnter={handleAIHover}
              onMouseLeave={handleAILeave}
            >
              <span className="relative flex items-center">
                <BrainCircuit className="h-4 w-4 mr-1.5" />
                <span className="relative">
                  Heights
                  <AnimatePresence>
                    {showPlusAnimation && (
                      <motion.span
                        initial={{ opacity: 0, scale: 0, rotate: -180 }}
                        animate={{ opacity: 1, scale: 1, rotate: 0 }}
                        exit={{ opacity: 0, scale: 0, rotate: 180 }}
                        transition={{ duration: 0.3, type: "spring", stiffness: 200 }}
                        className="absolute -right-3 -top-0.5 text-primary"
                      >
                        <Plus className="h-3 w-3" />
                      </motion.span>
                    )}
                  </AnimatePresence>
                  <motion.span
                    animate={{ opacity: showPlusAnimation ? 0 : 1 }}
                    transition={{ duration: 0.2 }}
                    className="absolute -right-3 -top-1"
                  >
                    <Sparkles className="h-3 w-3 text-primary/50" />
                  </motion.span>
                </span>
              </span>
            </Link>
            
            {/* News section replacing Learn */}
            <Link href="/news" className="text-sm font-medium hover:text-primary transition-colors flex items-center gap-1">
              <Newspaper className="h-4 w-4" />
              News
            </Link>
          </nav>
          
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="icon" onClick={toggleTheme} className="hidden md:flex">
              {theme === "dark" ? <Sun className="h-[1.2rem] w-[1.2rem]" /> : <Moon className="h-[1.2rem] w-[1.2rem]" />}
            </Button>
            
            {isAuthenticated ? (
              <>
                <Button variant="ghost" size="icon" className="hidden md:flex">
                  <Bell className="h-[1.2rem] w-[1.2rem]" />
                </Button>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="hidden md:flex">
                      <User className="h-[1rem] w-[1rem] mr-2" />
                      <span className="truncate max-w-[100px]">
                        {user.email?.split('@')[0]}
                      </span>
                      <ChevronDown className="h-[1rem] w-[1rem] ml-2" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>My Account</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => router.push('/dashboard')}>
                      <BarChart2 className="mr-2 h-4 w-4" />
                      <span>Dashboard</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => router.push('/profile')}>
                      <User className="mr-2 h-4 w-4" />
                      <span>Profile</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => router.push('/crypto')}>
                      <Bitcoin className="mr-2 h-4 w-4" />
                      <span>Crypto</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout}>
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Log out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <>
                <Link href="/login" className="hidden md:flex">
                  <Button variant="outline">Log In</Button>
                </Link>
                <Link href="/signup" className="hidden md:flex">
                  <Button>Sign Up</Button>
                </Link>
              </>
            )}
            
            <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setIsOpen(!isOpen)}>
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>
      </div>
      
      {/* Mobile menu */}
      <motion.div
        className="md:hidden"
        initial={{ height: 0, opacity: 0 }}
        animate={{
          height: isOpen ? "auto" : 0,
          opacity: isOpen ? 1 : 0,
        }}
        transition={{ duration: 0.2 }}
      >
        {isOpen && (
          <div className="px-4 pt-2 pb-5 bg-background/95 backdrop-blur-md border-b border-border/50 space-y-1">
            <Link href="/dashboard?tab=crypto" className="block py-2 text-base font-medium flex items-center gap-2" onClick={() => setIsOpen(false)}>
              <Bitcoin className="h-4 w-4" />
              Crypto
            </Link>
            <Link href="/dashboard?tab=stocks" className="block py-2 text-base font-medium" onClick={() => setIsOpen(false)}>Stocks</Link>
            <Link href="/dashboard?tab=mutual-funds" className="block py-2 text-base font-medium" onClick={() => setIsOpen(false)}>Mutual Funds</Link>
            
            {/* Conditionally render protected links for mobile */}
            {isAuthenticated && (
              <>
                <Link href="/portfolio" className="block py-2 text-base font-medium" onClick={() => setIsOpen(false)}>Portfolio</Link>
              </>
            )}
            
            {/* Updated AI Assistant link for mobile */}
            <Link href="/ai" className="block py-2 text-base font-medium" onClick={() => setIsOpen(false)}>
              <span className="flex items-center">
                <BrainCircuit className="h-5 w-5 mr-2" />
                Heights+
                <Sparkles className="h-3 w-3 ml-1 text-primary" />
              </span>
            </Link>
            
            {/* News section for mobile */}
            <Link href="/news" className="block py-2 text-base font-medium flex items-center gap-2" onClick={() => setIsOpen(false)}>
              <Newspaper className="h-5 w-5" />
              News
            </Link>
            
            <div className="pt-4 flex flex-col space-y-2">
              <Button onClick={toggleTheme} variant="outline" className="justify-start">
                {theme === "dark" ? (
                  <>
                    <Sun className="mr-2 h-4 w-4" /> Light Mode
                  </>
                ) : (
                  <>
                    <Moon className="mr-2 h-4 w-4" /> Dark Mode
                  </>
                )}
              </Button>
              
              {isAuthenticated ? (
                <>
                  <Button variant="outline" className="justify-start" onClick={() => {
                    setIsOpen(false);
                    router.push('/profile');
                  }}>
                    <User className="mr-2 h-4 w-4" /> Profile
                  </Button>
                  <Button variant="outline" className="justify-start" onClick={() => {
                    setIsOpen(false);
                    router.push('/crypto');
                  }}>
                    <Bitcoin className="mr-2 h-4 w-4" /> Crypto
                  </Button>
                  <Button variant="outline" className="justify-start" onClick={() => {
                    setIsOpen(false);
                    router.push('/notifications');
                  }}>
                    <Bell className="mr-2 h-4 w-4" /> Notifications
                  </Button>
                  <Button variant="destructive" onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" /> Log Out
                  </Button>
                </>
              ) : (
                <>
                  <Link href="/login" onClick={() => setIsOpen(false)}>
                    <Button variant="outline" className="w-full">Log In</Button>
                  </Link>
                  <Link href="/signup" onClick={() => setIsOpen(false)}>
                    <Button className="w-full">Sign Up</Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </motion.div>
    </motion.header>
  );
}