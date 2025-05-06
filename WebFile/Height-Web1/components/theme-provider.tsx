"use client";
 
 import { createContext, useContext, useEffect, useState } from "react";
 import { useTheme } from "next-themes";
 
 type ThemeProviderProps = {
   children: React.ReactNode;
   defaultTheme?: string;
 };
 
 const ThemeContext = createContext<{
   theme: string;
   setTheme: (theme: string) => void;
   toggleTheme: () => void;
 }>({
   theme: "dark",
   setTheme: () => null,
   toggleTheme: () => null,
 });
 
 export function ThemeProvider({
   children,
   defaultTheme = "dark",
 }: ThemeProviderProps) {
   const { theme, setTheme } = useTheme();
   const [mounted, setMounted] = useState(false);
 
   // After mounting, we have access to the theme
   useEffect(() => {
     setMounted(true);
     if (!theme) {
       setTheme(defaultTheme);
     }
   }, [theme, defaultTheme, setTheme]);
 
   const toggleTheme = () => {
     setTheme(theme === "dark" ? "light" : "dark");
   };
 
   return (
     <ThemeContext.Provider
       value={{
         theme: theme || defaultTheme,
         setTheme,
         toggleTheme,
       }}
     >
       {mounted && children}
     </ThemeContext.Provider>
   );
 }
 
 export const useHeightsTheme = () => useContext(ThemeContext);