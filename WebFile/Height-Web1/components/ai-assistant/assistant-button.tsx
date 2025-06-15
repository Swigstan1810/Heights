"use client";

import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { AssistantDialog } from "./assistant-dialog";
import { HeightsLogo } from "@/components/ui/heights-logo";
import { MessageSquare, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * AssistantButton component - Mobile-Optimized
 * Floating button that opens the AI assistant dialog with responsive design
 */
export function AssistantButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  
  // Check if mobile on mount and resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Handle scroll-based visibility (optional - can hide on scroll down)
  useEffect(() => {
    let lastScrollY = window.scrollY;
    
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // Show/hide based on scroll direction (optional behavior)
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsVisible(false);
      } else {
        setIsVisible(true);
      }
      
      lastScrollY = currentScrollY;
    };

    // Uncomment to enable scroll-based hiding
    // window.addEventListener('scroll', handleScroll, { passive: true });
    // return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  return (
    <>
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ 
          scale: isVisible ? 1 : 0.8, 
          opacity: isVisible ? 1 : 0.3,
          y: isVisible ? 0 : 20
        }}
        transition={{ 
          delay: 0.5, 
          type: "spring", 
          stiffness: 260, 
          damping: 20 
        }}
        className={cn(
          "fixed z-40 transition-all duration-300",
          isMobile 
            ? "right-4 bottom-4" 
            : "right-6 bottom-6"
        )}
      >
        <Button
          onClick={() => setIsOpen(true)}
          className={cn(
            "rounded-full shadow-lg p-0 overflow-hidden relative group border-2 border-white/20",
            isMobile 
              ? "h-12 w-12" 
              : "h-14 w-14"
          )}
          size="icon"
        >
          {/* Background gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#27391C] to-[#1F7D53] transition-all duration-300 group-hover:scale-110" />
          
          {/* Main content */}
          <div className="relative z-10 flex items-center justify-center">
            {isMobile ? (
              <MessageSquare className="h-5 w-5 text-white" />
            ) : (
              <HeightsLogo size="md" className="text-white" animate={false} />
            )}
          </div>
          
          {/* Animated pulse effect */}
          <motion.div 
            className="absolute inset-0 rounded-full border-2 border-white/30"
            animate={{ 
              scale: [1, 1.2, 1],
              opacity: [0.7, 0.3, 0.7]
            }}
            transition={{ 
              repeat: Infinity, 
              duration: 2,
              ease: "easeInOut"
            }}
          />
          
          {/* Ripple effect on hover */}
          <motion.div 
            className="absolute inset-0 bg-white rounded-full opacity-0 group-hover:opacity-20"
            whileHover={{ scale: 1.2 }}
            transition={{ duration: 0.3 }}
          />

          {/* Notification dot (optional - can be used to show new messages) */}
          <motion.div
            className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white"
            initial={{ scale: 0 }}
            animate={{ scale: [0, 1, 1.2, 1] }}
            transition={{ 
              delay: 2,
              duration: 0.5,
              ease: "easeInOut"
            }}
          >
            <motion.div
              className="w-full h-full bg-red-500 rounded-full"
              animate={{ scale: [1, 1.3, 1] }}
              transition={{ 
                repeat: Infinity, 
                duration: 1.5,
                ease: "easeInOut"
              }}
            />
          </motion.div>

          {/* Sparkle effect */}
          <motion.div
            className="absolute inset-0 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 0] }}
            transition={{ 
              repeat: Infinity, 
              duration: 3,
              delay: 1
            }}
          >
            <Sparkles className="absolute top-1 right-1 h-3 w-3 text-yellow-300" />
          </motion.div>
        </Button>

        {/* Floating tooltip */}
        <motion.div
          initial={{ opacity: 0, x: 10, scale: 0.8 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          transition={{ delay: 3, duration: 0.3 }}
          className={cn(
            "absolute bg-gray-900 text-white text-xs rounded-lg px-3 py-2 shadow-lg pointer-events-none whitespace-nowrap",
            isMobile 
              ? "right-14 top-1/2 -translate-y-1/2" 
              : "right-16 top-1/2 -translate-y-1/2"
          )}
        >
          <div className="flex items-center gap-2">
            <HeightsLogo size="sm" className="text-white" animate={false} />
            <span>AI Assistant Ready!</span>
          </div>
          
          {/* Arrow */}
          <div className={cn(
            "absolute top-1/2 -translate-y-1/2 w-2 h-2 bg-gray-900 rotate-45",
            isMobile ? "-right-1" : "-right-1"
          )} />
        </motion.div>
      </motion.div>
      
      <AnimatePresence>
        {isOpen && <AssistantDialog onClose={() => setIsOpen(false)} />}
      </AnimatePresence>
    </>
  );
}