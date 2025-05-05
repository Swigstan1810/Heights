"use client";

import { useEffect, useState } from "react";
import { motion, useScroll } from "framer-motion";

interface ProgressBarSection {
  id: string;
  color: string;
}

interface ProgressBarProps {
  sections: ProgressBarSection[];
}

export function ProgressBar({ sections }: ProgressBarProps) {
  const { scrollYProgress } = useScroll();
  const [sectionProgress, setSectionProgress] = useState<number[]>(Array(sections.length).fill(0));
  const [activeSection, setActiveSection] = useState<number>(0);
  
  useEffect(() => {
    const updateSectionProgress = () => {
      const sectionElements = sections.map(section => document.getElementById(section.id));
      const validSectionElements = sectionElements.filter(el => el !== null) as HTMLElement[];
      
      if (validSectionElements.length === 0) return;
      
      const windowHeight = window.innerHeight;
      const documentHeight = document.body.offsetHeight;
      const scrollPosition = window.scrollY;
      
      // Calculate section boundaries
      const sectionBoundaries = validSectionElements.map(el => {
        const rect = el.getBoundingClientRect();
        const offsetTop = rect.top + scrollPosition;
        const height = rect.height;
        return { top: offsetTop, bottom: offsetTop + height };
      });
      
      // Calculate progress for each section
      const newSectionProgress = sectionBoundaries.map((boundary, index) => {
        const sectionScrollStart = boundary.top - windowHeight;
        const sectionScrollEnd = boundary.bottom;
        const sectionScrollRange = sectionScrollEnd - sectionScrollStart;
        
        if (scrollPosition < sectionScrollStart) return 0;
        if (scrollPosition > sectionScrollEnd) return 1;
        
        return (scrollPosition - sectionScrollStart) / sectionScrollRange;
      });
      
      setSectionProgress(newSectionProgress);
      
      // Determine active section
      let active = 0;
      for (let i = 0; i < sectionBoundaries.length; i++) {
        const midpoint = sectionBoundaries[i].top + (sectionBoundaries[i].bottom - sectionBoundaries[i].top) / 2;
        if (scrollPosition > midpoint - windowHeight / 2) {
          active = i;
        }
      }
      setActiveSection(active);
    };
    
    window.addEventListener("scroll", updateSectionProgress);
    updateSectionProgress(); // Initial call
    
    return () => window.removeEventListener("scroll", updateSectionProgress);
  }, [sections]);
  
  return (
    <div className="fixed right-4 top-1/2 -translate-y-1/2 z-40 hidden md:block">
      <div className="flex flex-col items-center space-y-4">
        {sections.map((section, index) => (
          <motion.button
            key={section.id}
            className="relative w-3 h-3 rounded-full bg-muted group"
            onClick={() => {
              const element = document.getElementById(section.id);
              if (element) {
                element.scrollIntoView({ behavior: "smooth" });
              }
            }}
            animate={{
              backgroundColor: activeSection === index ? section.color : "hsl(var(--muted))"
            }}
            whileHover={{ scale: 1.2 }}
          >
            <motion.div 
              className="absolute inset-0 rounded-full"
              style={{ backgroundColor: section.color }}
              initial={{ scale: 0 }}
              animate={{ scale: sectionProgress[index] }}
            />
            <div className="absolute top-1/2 -translate-y-1/2 right-full mr-3 opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="bg-background px-2 py-1 rounded-md border border-border text-xs whitespace-nowrap">
                {section.id.charAt(0).toUpperCase() + section.id.slice(1)}
              </div>
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
}