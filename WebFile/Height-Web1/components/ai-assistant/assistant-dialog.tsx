"use client";

import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { X, MinusCircle, Maximize2, Send, Loader2, User, AlertCircle, RefreshCw, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useAssistant } from "./context";
import { HeightsLogo } from "@/components/ui/heights-logo";

/**
 * AssistantDialog component - Mobile-Optimized
 * Dialog that displays the AI assistant conversation with responsive design
 */
export function AssistantDialog({ onClose }: { onClose: () => void }) {
  const [isMinimized, setIsMinimized] = useState(false);
  const { messages, addMessage, isLoading, assistantName, clearMessages, error } = useAssistant();
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [isMobile, setIsMobile] = useState(false);
  
  // Check if mobile on mount and resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Handle viewport height changes on mobile
  useEffect(() => {
    const handleResize = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);
  
  // Scroll to bottom when messages change with better mobile handling
  useEffect(() => {
    const scrollToBottom = () => {
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ 
          behavior: 'smooth',
          block: 'end'
        });
      }
    };
    
    const delay = isMobile ? 300 : 100;
    const timer = setTimeout(scrollToBottom, delay);
    return () => clearTimeout(timer);
  }, [messages, isMobile]);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    
    addMessage(input, "user");
    setInput("");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };
  
  // Motion variants for animation
  const dialogVariants = {
    hidden: { opacity: 0, scale: 0.8, y: 20 },
    visible: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.2 } },
    exit: { opacity: 0, scale: 0.8, y: 20, transition: { duration: 0.2 } }
  };
  
  const minimizedVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.2 } },
    exit: { opacity: 0, y: 20, transition: { duration: 0.2 } }
  };
  
  return (
    <>
      {isMinimized ? (
        <motion.div
          className="fixed right-4 bottom-4 sm:right-6 sm:bottom-6 p-3 bg-card dark:bg-gray-900 rounded-xl shadow-lg border border-border dark:border-gray-800 z-50 flex items-center space-x-2"
          initial="hidden"
          animate="visible"
          exit="exit"
          variants={minimizedVariants}
        >
          <HeightsLogo size="sm" className="text-primary" animate={false} />
          <span className="font-medium text-sm">Heights+ AI</span>
          <div className="flex space-x-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => setIsMinimized(false)}
            >
              <Maximize2 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </motion.div>
      ) : (
        <motion.div
          className="fixed inset-0 bg-background/80 dark:bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-0 sm:p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className={cn(
              "relative bg-card dark:bg-gray-900 shadow-lg border border-border dark:border-gray-800 overflow-hidden flex flex-col",
              isMobile 
                ? "w-full h-full rounded-none" 
                : "w-full max-w-2xl h-[600px] rounded-xl"
            )}
            style={isMobile ? { height: 'calc(var(--vh, 1vh) * 100)' } : {}}
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={dialogVariants}
          >
            {/* Header - Fixed */}
            <div className="flex-shrink-0 px-4 py-3 border-b border-border dark:border-gray-800 flex items-center justify-between bg-gradient-to-r from-card to-muted/20 dark:from-gray-900 dark:to-gray-800/50">
              <div className="flex items-center space-x-2">
                <HeightsLogo size="sm" className="text-primary" />
                <h2 className="font-bold text-sm sm:text-base">Heights+ AI</h2>
                <Sparkles className="h-4 w-4 text-yellow-500" />
              </div>
              <div className="flex items-center space-x-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={clearMessages}
                  title="Clear conversation"
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
                {!isMobile && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setIsMinimized(true)}
                  >
                    <MinusCircle className="h-4 w-4" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={onClose}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            {/* Messages - Scrollable */}
            <div 
              ref={messagesContainerRef}
              className="flex-1 min-h-0 overflow-y-auto overscroll-behavior-contain bg-gradient-to-b from-background to-muted/5 dark:from-black dark:to-gray-900/20"
              style={{ 
                WebkitOverflowScrolling: 'touch',
                scrollBehavior: 'smooth'
              }}
            >
              <div className="min-h-full flex flex-col justify-end">
                <div className="p-3 sm:p-4 space-y-3 sm:space-y-4">
                  {messages.map((message) => (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                      className={cn(
                        "flex items-start space-x-2 w-full",
                        message.role === "user" ? "flex-row-reverse space-x-reverse" : "",
                        message.role === "system" ? "justify-center" : ""
                      )}
                    >
                      {message.role === "assistant" && (
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#255F38] to-[#1F7D53] flex items-center justify-center overflow-hidden shadow-lg flex-shrink-0">
                          <HeightsLogo size="sm" className="text-white" animate={false} />
                        </div>
                      )}
                      
                      <div
                        className={cn(
                          "p-3 rounded-lg shadow-sm max-w-[85%] sm:max-w-[80%] break-words",
                          message.role === "user" 
                            ? "bg-primary text-primary-foreground" 
                            : message.role === "assistant"
                            ? "bg-card dark:bg-gray-800 border border-border dark:border-gray-700" 
                            : "bg-muted/50 dark:bg-gray-800/50 text-muted-foreground text-sm italic text-center max-w-md mx-auto"
                        )}
                      >
                        <div className="text-sm sm:text-base leading-relaxed whitespace-pre-wrap">
                          {message.content}
                        </div>
                      </div>
                      
                      {message.role === "user" && (
                        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                          <User className="h-4 w-4 text-primary-foreground" />
                        </div>
                      )}
                    </motion.div>
                  ))}
                  
                  {isLoading && (
                    <div className="flex items-start space-x-2">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#255F38] to-[#1F7D53] flex items-center justify-center overflow-hidden">
                        <HeightsLogo size="sm" className="text-white" animate={false} />
                      </div>
                      <div className="p-3 rounded-lg bg-card dark:bg-gray-800 border border-border dark:border-gray-700">
                        <div className="flex items-center space-x-2">
                          <motion.div 
                            className="h-2 w-2 rounded-full bg-[#1F7D53]"
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ repeat: Infinity, duration: 0.6, delay: 0 }}
                          />
                          <motion.div 
                            className="h-2 w-2 rounded-full bg-[#1F7D53]"
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }}
                          />
                          <motion.div 
                            className="h-2 w-2 rounded-full bg-[#1F7D53]"
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ repeat: Infinity, duration: 0.6, delay: 0.4 }}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {error && (
                    <div className="flex items-start space-x-2 w-full justify-center">
                      <div className="bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-md text-sm flex items-center max-w-[90%]">
                        <AlertCircle className="h-4 w-4 mr-2 flex-shrink-0" />
                        <span className="break-words">{error}</span>
                      </div>
                    </div>
                  )}
                  
                  <div ref={messagesEndRef} className="h-4" />
                </div>
              </div>
            </div>
            
            {/* Input - Fixed at bottom */}
            <div className="flex-shrink-0 p-3 sm:p-4 border-t border-border dark:border-gray-800 bg-card dark:bg-gray-900">
              <form onSubmit={handleSubmit} className="flex space-x-2">
                <div className="flex-1 relative">
                  <Textarea
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Ask about trading, markets, or get assistance..."
                    className="min-h-[40px] max-h-[120px] resize-none dark:bg-gray-800 dark:border-gray-700 text-sm sm:text-base"
                    disabled={isLoading}
                    rows={isMobile ? 1 : 2}
                  />
                </div>
                <Button 
                  type="submit" 
                  disabled={isLoading || !input.trim()}
                  className="bg-gradient-to-r from-[#27391C] to-[#1F7D53] hover:from-[#255F38] hover:to-[#1F7D53] h-auto px-3 sm:px-4 py-2"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </form>

              {/* Helper text */}
              <p className="text-xs text-muted-foreground mt-2 text-center">
                Press Enter to send • Shift+Enter for new line
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </>
  );
}