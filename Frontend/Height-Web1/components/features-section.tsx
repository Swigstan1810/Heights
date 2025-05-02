"use client";

import { motion } from "framer-motion";
import { useRef } from "react";
import { Globe, BarChart3, Shield, Wallet } from "lucide-react";

const features = [
  {
    icon: <Globe className="h-10 w-10" />,
    title: "Global Markets",
    description: "Access to over 24 markets across the globe, from US equities to Asian indices, all from a single account.",
    color: "hsl(var(--chart-1))",
  },
  {
    icon: <BarChart3 className="h-10 w-10" />,
    title: "Advanced Analytics",
    description: "Powerful charting tools, technical indicators, and AI-powered insights to make informed trading decisions.",
    color: "hsl(var(--chart-2))",
  },
  {
    icon: <Shield className="h-10 w-10" />,
    title: "Bank-Grade Security",
    description: "Your assets are protected with industry-leading security measures and multi-factor authentication.",
    color: "hsl(var(--chart-3))",
  },
  {
    icon: <Wallet className="h-10 w-10" />,
    title: "Unified Portfolio",
    description: "Manage your traditional investments and cryptocurrency holdings from one integrated dashboard.",
    color: "hsl(var(--chart-4))",
  },
];

export function FeaturesSection() {
  const containerRef = useRef(null);
  
  return (
    <section 
      ref={containerRef}
      className="py-20 px-4 md:px-8 lg:px-16 relative bg-secondary/50"
    >
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl font-bold tracking-tight">Why Choose Heights</h2>
          <p className="mt-4 text-xl text-muted-foreground max-w-2xl mx-auto">
            Experience the future of trading with our innovative platform that combines the best of traditional and digital markets.
          </p>
        </motion.div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="relative p-6 rounded-lg bg-card border border-border/50 hover:border-primary/20 transition-all duration-300"
            >
              <div 
                className="h-16 w-16 rounded-full flex items-center justify-center mb-4"
                style={{ backgroundColor: `${feature.color}10` }}
              >
                <div style={{ color: feature.color }}>{feature.icon}</div>
              </div>
              <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}