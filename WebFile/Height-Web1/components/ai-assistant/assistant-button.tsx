"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { AssistantDialog } from "./assistant-dialog";

/**
 * Heights Logo SVG Component
 * A custom Heights AI logo for the assistant button
 */
function HeightsAILogo() {
  return (
    <svg viewBox="0 0 800 800" className="h-full w-full">
      {/* Background Circle */}
      <circle cx="400" cy="400" r="360" className="fill-primary/10" />
      <circle cx="400" cy="400" r="320" className="fill-primary/5" />
      
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
        
        {/* Diagonal Lines */}
        <path d="M-113,-113 L-85,-85" />
        <path d="M113,-113 L85,-85" />
        <path d="M-113,113 L-85,85" />
        <path d="M113,113 L85,85" />
        
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
 * AssistantButton component
 * Floating button that opens the AI assistant dialog
 */
export function AssistantButton() {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed right-6 bottom-6 h-14 w-14 rounded-full shadow-lg z-40 p-0 overflow-hidden"
        size="icon"
      >
        <div className="absolute inset-0">
          <HeightsAILogo />
        </div>
        
        {/* Animated pulse effect */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="absolute w-full h-full bg-primary rounded-full animate-ping opacity-20" />
        </div>
      </Button>
      
      <AnimatePresence>
        {isOpen && <AssistantDialog onClose={() => setIsOpen(false)} />}
      </AnimatePresence>
    </>
  );
}