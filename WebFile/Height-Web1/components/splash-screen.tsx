"use client";
 
 import { useEffect, useState } from "react";
 import { motion, useAnimate, stagger } from "framer-motion";
 
 export function SplashScreen() {
   const [isVisible, setIsVisible] = useState(true);
   const [scope, animate] = useAnimate();
   
   useEffect(() => {
     if (!scope.current) return; // <- ensure DOM is ready
   
     const sequence = async () => {
       try {
         await animate(
           ".logo-path-1",
           { pathLength: [0, 1], opacity: [0, 1] },
           { duration: 1, ease: "easeInOut" }
         );
   
         await animate(
           ".logo-path-2",
           { pathLength: [0, 1], opacity: [0, 1] },
           { duration: 1, ease: "easeInOut" }
         );
   
         await animate(
           ".logo-text",
           { opacity: [0, 1], y: [20, 0] },
           { duration: 0.5, delay: stagger(0.1) }
         );
   
         await animate(
           ".tagline",
           { opacity: [0, 1] },
           { duration: 0.5 }
         );
   
         await new Promise(resolve => setTimeout(resolve, 600));
   
         await animate(
           ".logo-container",
           { opacity: [1, 0], scale: [1, 0.95], y: [0, -10] },
           { duration: 0.5 }
         );
   
         await animate(
           ".tagline",
           { opacity: [1, 0], scale: [1, 0.95], y: [0, -10] },
           { duration: 0.5 }
         );
   
         setIsVisible(false);
       } catch (err) {
         console.error("Animation error:", err);
       }
     };
   
     sequence();
   
     const timer = setTimeout(() => setIsVisible(false), 3500);
     return () => clearTimeout(timer);
   }, [animate, scope]);
   
   
   
   if (!isVisible) return null;
   
   return (
     <motion.div
       ref={scope}
       className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background"
       initial={{ opacity: 1 }}
       exit={{ opacity: 0 }}
     >
       <div className="logo-container flex flex-col items-center">
         <motion.div className="relative w-32 h-32">
           <svg
             viewBox="0 0 100 100"
             className="w-full h-full"
           >
             <motion.path
               className="logo-path-1"
               d="M30,20 L30,80"
               stroke="currentColor"
               strokeWidth="16"
               strokeLinecap="square"
               fill="none"
               initial={{ pathLength: 0, opacity: 0 }}
             />
             <motion.path
               className="logo-path-2"
               d="M30,20 L80,20"
               stroke="currentColor"
               strokeWidth="16"
               strokeLinecap="square"
               fill="none"
               initial={{ pathLength: 0, opacity: 0 }}
             />
           </svg>
         </motion.div>
         
         <div className="mt-6 flex items-center">
           <motion.span className="logo-text text-4xl font-bold">H</motion.span>
           <motion.span className="logo-text text-4xl font-bold">e</motion.span>
           <motion.span className="logo-text text-4xl font-bold">i</motion.span>
           <motion.span className="logo-text text-4xl font-bold">g</motion.span>
           <motion.span className="logo-text text-4xl font-bold">h</motion.span>
           <motion.span className="logo-text text-4xl font-bold">t</motion.span>
           <motion.span className="logo-text text-4xl font-bold">s</motion.span>
         </div>
       </div>
       
       <motion.p 
         className="tagline mt-4 text-muted-foreground text-sm font-medium"
         initial={{ opacity: 0 }}
       >
         Elevate Your Trading Experience
       </motion.p>
     </motion.div>
   );
 }