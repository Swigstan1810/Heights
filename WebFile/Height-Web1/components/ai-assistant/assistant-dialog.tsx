"use client";

import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { X, MinusCircle, Maximize2, Send, Loader2, User, AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useHeightsTheme } from "@/components/theme-provider";
import { useAssistant } from "./context";

/**
 * Heights Logo SVG Component
 * A custom Heights AI logo for the assistant dialog
 */
function HeightsAILogo() {
  return (
    <svg viewBox="0 0 800 800" className="h-full w-full">
      {/* "H" Shape from Heights Logo */}
      <g transform="translate(220, 180) scale(0.9)">
        <path d="M80,80 L80,400" stroke="currentColor" strokeWidth="60" strokeLinecap="square" fill="none" />
        <path d="M80,80 L380,80" stroke="currentColor" strokeWidth="60" strokeLinecap="square" fill="none" />
      </g>
      
      {/* AI Brain Circuit Overlay */}
      <g transform="translate(400, 400)" stroke="currentColor" strokeWidth="4" fill="none" className="text-primary/70">
        {/* Circuit Board Pattern */}
        <circle cx="0" cy="0" r="180" strokeDasharray="8 12" />
        <circle cx="0" cy="0" r="140" strokeDasharray="5 10" />
        <circle cx="0" cy="0" r="100" strokeDasharray="3 8" />
        
        {/* Connection Lines */}
        <path d="M-160,0 L-120,0" />
        <path d="M120,0 L160,0" />
        <path d="M0,-160 L0,-120" />
        <path d="M0,120 L0,160" />
        
        {/* Brain Circuit Nodes */}
        <circle cx="-60" cy="60" r="12" className="fill-primary" />
        <circle cx="60" cy="-60" r="12" className="fill-primary" />
        <circle cx="40" cy="80" r="8" className="fill-primary" />
        <circle cx="-70" cy="-40" r="8" className="fill-primary" />
        <circle cx="0" cy="0" r="15" className="fill-primary" />
        
        {/* Network Connections */}
        <path d="M-60,60 L0,0" />
        <path d="M60,-60 L0,0" />
        <path d="M40,80 L0,0" />
        <path d="M-70,-40 L0,0" />
        
        {/* Data Flow Dots Animation */}
        <circle cx="-30" cy="30" r="3" className="fill-background">
          <animate attributeName="opacity" values="0;1;0" dur="3s" repeatCount="indefinite" begin="0s"/>
        </circle>
        <circle cx="30" cy="-30" r="3" className="fill-background">
          <animate attributeName="opacity" values="0;1;0" dur="3s" repeatCount="indefinite" begin="1s"/>
        </circle>
        <circle cx="20" cy="40" r="3" className="fill-background">
          <animate attributeName="opacity" values="0;1;0" dur="3s" repeatCount="indefinite" begin="1.5s"/>
        </circle>
        <circle cx="-35" cy="-20" r="3" className="fill-background">
          <animate attributeName="opacity" values="0;1;0" dur="3s" repeatCount="indefinite" begin="2s"/>
        </circle>
      </g>
    </svg>
  );
}

/**
 * AssistantDialog component
 * Dialog that displays the AI assistant conversation
 */
export function AssistantDialog({ onClose }: { onClose: () => void }) {
  const { theme } = useHeightsTheme();
  const [isMinimized, setIsMinimized] = useState(false);
  const { messages, addMessage, isLoading, assistantName, clearMessages, error } = useAssistant();
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    
    addMessage(input, "user");
    setInput("");
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
          className="fixed right-6 bottom-6 p-3 bg-card rounded-xl shadow-lg border border-border z-50 flex items-center space-x-2"
          initial="hidden"
          animate="visible"
          exit="exit"
          variants={minimizedVariants}
        >
          <div className="w-6 h-6 text-primary">
            <HeightsAILogo />
          </div>
          <span className="font-medium text-sm">{assistantName}</span>
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
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="relative w-full max-w-2xl h-[600px] bg-card rounded-xl shadow-lg border border-border overflow-hidden flex flex-col"
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={dialogVariants}
          >
            {/* Header */}
            <div className="px-4 py-3 border-b border-border flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="h-6 w-6 text-primary">
                  <HeightsAILogo />
                </div>
                <h2 className="font-bold">{assistantName}</h2>
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
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setIsMinimized(true)}
                >
                  <MinusCircle className="h-4 w-4" />
                </Button>
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
            
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    "flex items-start space-x-2 max-w-[85%]",
                    message.role === "user" ? "ml-auto" : "",
                    message.role === "system" ? "justify-center w-full max-w-full" : ""
                  )}
                >
                  {message.role === "assistant" && (
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                      <div className="w-5 h-5 text-primary">
                        <HeightsAILogo />
                      </div>
                    </div>
                  )}
                  
                  <div
                    className={cn(
                      "p-3 rounded-lg",
                      message.role === "user" 
                        ? "bg-primary text-primary-foreground" 
                        : message.role === "assistant"
                        ? "bg-muted" 
                        : "bg-muted/50 text-muted-foreground text-sm italic text-center max-w-md mx-auto"
                    )}
                  >
                    {message.content}
                  </div>
                  
                  {message.role === "user" && (
                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                      <User className="h-4 w-4 text-primary-foreground" />
                    </div>
                  )}
                </div>
              ))}
              
              {isLoading && (
                <div className="flex items-start space-x-2">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                    <div className="w-5 h-5 text-primary">
                      <HeightsAILogo />
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-muted">
                    <div className="flex items-center space-x-2">
                      <div className="h-2 w-2 rounded-full bg-primary/50 animate-bounce" style={{ animationDelay: "0ms" }} />
                      <div className="h-2 w-2 rounded-full bg-primary/50 animate-bounce" style={{ animationDelay: "300ms" }} />
                      <div className="h-2 w-2 rounded-full bg-primary/50 animate-bounce" style={{ animationDelay: "600ms" }} />
                    </div>
                  </div>
                </div>
              )}
              
              {error && (
                <div className="flex items-start space-x-2 w-full max-w-full justify-center">
                  <div className="bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-md text-sm flex items-center">
                    <AlertCircle className="h-4 w-4 mr-2 flex-shrink-0" />
                    <span>{error}</span>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
            
            {/* Input */}
            <div className="p-4 border-t border-border">
              <form onSubmit={handleSubmit} className="flex space-x-2">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask about trading, markets, or get assistance..."
                  className="flex-1"
                />
                <Button type="submit" disabled={isLoading || !input.trim()}>
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </Button>
              </form>
            </div>
          </motion.div>
        </motion.div>
      )}
    </>
  );
}