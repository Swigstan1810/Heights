"use client";

import { useState, useEffect } from "react";
import { motion, useScroll } from "framer-motion";
import Link from "next/link";
import { 
  Menu, 
  X, 
  Sun, 
  Moon, 
  Wallet, 
  Bell, 
  LineChart, 
  BarChart4, 
  Settings, 
  LogOut, 
  User 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useHeightsTheme } from "@/components/theme-provider";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
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
  
  const handleSignOut = async () => {
    await signOut();
    router.push("/");
  };
  
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
            <Link href="#crypto" className="text-sm font-medium hover:text-primary transition-colors">Crypto</Link>
            <Link href="#stocks" className="text-sm font-medium hover:text-primary transition-colors">Stocks</Link>
            
            {/* Conditional navigation links based on authentication */}
            {user ? (
              <>
                <Link href="/dashboard" className="text-sm font-medium hover:text-primary transition-colors">Dashboard</Link>
                <Link href="/trade" className="text-sm font-medium hover:text-primary transition-colors">Trade</Link>
                <Link href="/portfolio" className="text-sm font-medium hover:text-primary transition-colors">Portfolio</Link>
              </>
            ) : (
              <Link href="#learn" className="text-sm font-medium hover:text-primary transition-colors">Learn</Link>
            )}
          </nav>
          
          <div className="flex items-center space-x-2">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={toggleTheme} 
              className="hidden md:flex"
              type="button"
            >
              {theme === "dark" ? <Sun className="h-[1.2rem] w-[1.2rem]" /> : <Moon className="h-[1.2rem] w-[1.2rem]" />}
            </Button>
            
            {/* Conditional UI elements based on authentication */}
            {user ? (
              <>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="hidden md:flex"
                  type="button"
                >
                  <Bell className="h-[1.2rem] w-[1.2rem]" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="hidden md:flex"
                  onClick={() => router.push("/wallet")}
                  type="button"
                >
                  <Wallet className="h-[1.2rem] w-[1.2rem]" />
                </Button>
                
                {/* User profile dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="hidden md:flex"
                      type="button"
                    >
                      <User className="h-[1.2rem] w-[1.2rem]" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>My Account</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => router.push("/dashboard")}>
                      <BarChart4 className="mr-2 h-4 w-4" />
                      <span>Dashboard</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => router.push("/trade")}>
                      <LineChart className="mr-2 h-4 w-4" />
                      <span>Trade</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => router.push("/settings")}>
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Settings</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut}>
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Sign out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <>
                <Button 
                  className="hidden md:flex" 
                  onClick={() => router.push("/login")}
                  type="button"
                >
                  Sign In
                </Button>
                <Button 
                  className="hidden md:flex" 
                  variant="default" 
                  onClick={() => router.push("/signup")}
                  type="button"
                >
                  Sign Up
                </Button>
              </>
            )}
            
            <Button 
              variant="ghost" 
              size="icon" 
              className="md:hidden" 
              onClick={() => setIsOpen(!isOpen)}
              type="button"
            >
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
            <Link href="#crypto" className="block py-2 text-base font-medium">Crypto</Link>
            <Link href="#stocks" className="block py-2 text-base font-medium">Stocks</Link>
            
            {/* Conditional mobile menu links */}
            {user ? (
              <>
                <Link href="/dashboard" className="block py-2 text-base font-medium">Dashboard</Link>
                <Link href="/trade" className="block py-2 text-base font-medium">Trade</Link>
                <Link href="/portfolio" className="block py-2 text-base font-medium">Portfolio</Link>
              </>
            ) : (
              <Link href="#learn" className="block py-2 text-base font-medium">Learn</Link>
            )}
            
            <div className="pt-4 flex flex-col space-y-2">
              <Button onClick={toggleTheme} variant="outline" className="justify-start" type="button">
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
              
              {/* Conditional mobile menu buttons */}
              {user ? (
                <>
                  <Button variant="outline" className="justify-start" type="button">
                    <Bell className="mr-2 h-4 w-4" /> Notifications
                  </Button>
                  <Button variant="outline" className="justify-start" onClick={() => router.push("/wallet")} type="button">
                    <Wallet className="mr-2 h-4 w-4" /> Wallet
                  </Button>
                  <Button variant="outline" className="justify-start" onClick={() => router.push("/settings")} type="button">
                    <Settings className="mr-2 h-4 w-4" /> Settings
                  </Button>
                  <Button variant="outline" className="justify-start" onClick={handleSignOut} type="button">
                    <LogOut className="mr-2 h-4 w-4" /> Sign out
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="outline" onClick={() => router.push("/login")} type="button">Sign In</Button>
                  <Button onClick={() => router.push("/signup")} type="button">Sign Up</Button>
                </>
              )}
            </div>
          </div>
        )}
      </motion.div>
    </motion.header>
  );
}