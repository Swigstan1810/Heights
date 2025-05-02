"use client";

import { motion } from "framer-motion";
import { generateMockMarketData } from "@/lib/utils";
import { MarketCard } from "@/components/ui/market-card";

type MarketSectionProps = {
  title: string;
  subtitle: string;
  type: "crypto" | "stock" | "index";
  limit?: number;
  color: string;
};

export function MarketSection({ title, subtitle, type, limit = 4, color }: MarketSectionProps) {
  const data = generateMockMarketData().filter(item => item.type === type);
  
  return (
    <section className="py-16 px-4 md:px-8 lg:px-16">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <h2 className="text-3xl font-bold tracking-tight">{title}</h2>
          <p className="text-muted-foreground mt-2">{subtitle}</p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {data.slice(0, limit).map((item, i) => (
            <motion.div
              key={item.symbol}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
            >
              <MarketCard
                symbol={item.symbol}
                name={item.name}
                price={item.price}
                change24h={item.change24h}
                sparkline={item.sparkline}
                type={item.type as "crypto" | "stock" | "index"}
              />
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mt-8 text-center"
        >
          <button 
            className="inline-flex items-center justify-center text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2 rounded-md"
            style={{ borderColor: color, color }}
          >
            View All {title}
          </button>
        </motion.div>
      </div>
    </section>
  );
}