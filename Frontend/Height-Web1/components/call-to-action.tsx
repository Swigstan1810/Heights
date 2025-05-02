"use client";

import { motion } from "framer-motion";

export function CallToAction() {
  return (
    <section className="py-20 px-4 md:px-8 lg:px-16 relative">
      <div className="max-w-7xl mx-auto">
        <div className="relative overflow-hidden rounded-xl p-8 md:p-12 lg:p-16 bg-gradient-to-r from-chart-1/20 to-chart-2/20 border border-border/50">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="max-w-2xl"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Trade with Confidence?</h2>
            <p className="text-lg text-muted-foreground mb-8">
              Join thousands of traders who have already made the switch to Heights. Get started for free and experience the future of trading.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <button className="w-full sm:w-auto px-8 py-3 text-base font-medium rounded-md bg-primary text-primary-foreground hover:opacity-90 transition-opacity">
                  Create Free Account
                </button>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <button className="w-full sm:w-auto px-8 py-3 text-base font-medium rounded-md bg-card text-card-foreground border border-border hover:bg-muted transition-colors">
                  Schedule Demo
                </button>
              </motion.div>
            </div>
          </motion.div>
          
          {/* Background elements */}
          <div className="absolute -right-16 -bottom-16 w-64 h-64 opacity-70">
            <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
              <path 
                fill="hsl(var(--chart-1))" 
                d="M47.1,-61.5C61.3,-52.4,73.3,-39.2,79.5,-23.4C85.8,-7.6,86.4,11,79.9,26.1C73.5,41.3,60,53.1,45,61.9C30,70.7,13.6,76.4,-1.3,78C-16.1,79.5,-29.7,76.9,-44,70.2C-58.2,63.4,-73.1,52.4,-79.9,37.9C-86.7,23.3,-85.4,5.2,-80.3,-10.9C-75.3,-27.1,-66.4,-41.3,-53.8,-50.9C-41.2,-60.5,-24.9,-65.5,-8,-68.7C8.9,-71.9,32.9,-70.5,47.1,-61.5Z" 
                transform="translate(100 100)" 
                style={{ opacity: 0.07 }}
              />
            </svg>
          </div>
        </div>
      </div>
    </section>
  );
}