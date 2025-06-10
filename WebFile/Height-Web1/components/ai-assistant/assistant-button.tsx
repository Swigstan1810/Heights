"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { AssistantDialog } from "./assistant-dialog";
import { HeightsLogo } from "@/components/ui/heights-logo";

/**
 * AssistantButton component
 * Floating button that opens the AI assistant dialog
 */
export function AssistantButton() {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <>
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.5, type: "spring", stiffness: 260, damping: 20 }}
        className="fixed right-6 bottom-6 z-40"
      >
        <Button
          onClick={() => setIsOpen(true)}
          className="h-14 w-14 rounded-full shadow-lg p-0 overflow-hidden relative group"
          size="icon"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-[#27391C] to-[#1F7D53] transition-all duration-300 group-hover:scale-110" />
          
          <div className="relative z-10">
            <HeightsLogo size="md" className="text-white" animate={false} />
          </div>
          
          {/* Animated pulse effect */}
          <motion.div 
            className="absolute inset-0 rounded-full border-2 border-white/20"
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ repeat: Infinity, duration: 2 }}
          />
          
          {/* Ripple effect on hover */}
          <motion.div 
            className="absolute inset-0 bg-white rounded-full opacity-0 group-hover:opacity-20"
            whileHover={{ scale: 1.2 }}
            transition={{ duration: 0.3 }}
          />
        </Button>
      </motion.div>
      
      <AnimatePresence>
        {isOpen && <AssistantDialog onClose={() => setIsOpen(false)} />}
      </AnimatePresence>
    </>
  );
}