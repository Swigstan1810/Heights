"use client";

import { useEffect, useState } from "react";
import { motion, useScroll, useSpring } from "framer-motion";

type ProgressBarProps = {
  sections?: {
    id: string;
    color: string;
  }[];
};

export function ProgressBar({ sections }: ProgressBarProps = {}) {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  });
  
  const [activeSection, setActiveSection] = useState(0);
  
  // Update active section based on scroll position
  useEffect(() => {
    if (!sections || sections.length === 0) return;
    
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      const windowHeight = window.innerHeight;
      const docHeight = document.body.clientHeight;
      
      // Calculate which section we're in based on scroll percentage
      const scrollPercentage = scrollPosition / (docHeight - windowHeight);
      const sectionPercentage = 1 / sections.length;
      
      const newActiveSection = Math.min(
        Math.floor(scrollPercentage / sectionPercentage),
        sections.length - 1
      );
      
      if (newActiveSection !== activeSection) {
        setActiveSection(newActiveSection);
      }
    };
    
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [sections, activeSection]);
  
  // Default color if no sections provided
  const barColor = sections && sections.length > 0
    ? sections[Math.max(0, activeSection)].color
    : "var(--primary)";
  
  return (
    <motion.div
      className="fixed top-0 left-0 right-0 h-1 z-50 origin-left"
      style={{ 
        scaleX,
        background: barColor,
      }}
      transition={{ type: "spring" }}
    />
  );
}