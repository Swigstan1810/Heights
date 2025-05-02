"use client";

import { motion } from "framer-motion";
import { MainChart } from "@/components/main-chart";

export function HeroSection() {
  return (
    <section className="relative pt-20 md:pt-28 pb-16 px-4 md:px-8 lg:px-16 overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="order-2 lg:order-1">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
                Trading at New{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-chart-1 to-chart-2">
                  Heights
                </span>
              </h1>
              <p className="mt-4 text-xl text-muted-foreground">
                Trade with confidence across global markets and crypto all from one unified platform.
              </p>
              
              <div className="mt-8 flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <button className="w-full sm:w-auto px-8 py-3 text-base font-medium rounded-md bg-primary text-primary-foreground hover:opacity-90 transition-opacity">
                    Start Trading
                  </button>
                </motion.div>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <button className="w-full sm:w-auto px-8 py-3 text-base font-medium rounded-md border border-border bg-background hover:bg-muted transition-colors">
                    Learn More
                  </button>
                </motion.div>
              </div>
              
              <div className="mt-12 grid grid-cols-3 gap-8">
                <div>
                  <p className="text-3xl font-bold">24+</p>
                  <p className="text-sm text-muted-foreground">Global Markets</p>
                </div>
                <div>
                  <p className="text-3xl font-bold">100K+</p>
                  <p className="text-sm text-muted-foreground">Active Traders</p>
                </div>
                <div>
                  <p className="text-3xl font-bold">₹10B+</p>
                  <p className="text-sm text-muted-foreground">Daily Volume</p>
                </div>
              </div>
            </motion.div>
          </div>
          
          <motion.div
            className="order-1 lg:order-2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <MainChart />
          </motion.div>
        </div>
      </div>
      
      {/* Background elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 opacity-30">
        <div className="absolute top-10 left-[10%] w-64 h-64 bg-chart-1/20 rounded-full filter blur-3xl" />
        <div className="absolute bottom-10 right-[10%] w-80 h-80 bg-chart-2/20 rounded-full filter blur-3xl" />
      </div>
    </section>
  );
}