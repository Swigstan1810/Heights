"use client";

import { motion } from "framer-motion";
import { Activity, Globe, Shield, LineChart, DollarSign, Clock } from "lucide-react";

export function FeaturesSection() {
  const features = [
    {
      icon: <Activity className="h-10 w-10" />,
      title: "Real-Time Market Data",
      description: "Stay informed with lightning-fast updates across all markets, ensuring you never miss an opportunity."
    },
    {
      icon: <Globe className="h-10 w-10" />,
      title: "Multi-Market Access",
      description: "Trade seamlessly across Indian stocks, global indices, and cryptocurrencies from one unified platform."
    },
    {
      icon: <Shield className="h-10 w-10" />,
      title: "Bank-Grade Security",
      description: "Rest easy knowing your investments are protected by state-of-the-art encryption and security protocols."
    },
    {
      icon: <LineChart className="h-10 w-10" />,
      title: "Advanced Analytics",
      description: "Make informed decisions with powerful technical analysis tools and customizable chart indicators."
    },
    {
      icon: <DollarSign className="h-10 w-10" />,
      title: "Competitive Pricing",
      description: "Enjoy low transaction fees and zero hidden charges, maximizing your investment returns."
    },
    {
      icon: <Clock className="h-10 w-10" />,
      title: "24/7 Support",
      description: "Our dedicated support team is available around the clock to assist with any questions or concerns."
    }
  ];
  
  return (
    <section className="py-24 px-4 md:px-8 lg:px-16 bg-muted/30">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Why Choose Heights?</h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Our platform is designed to provide you with the best trading experience,
            combining cutting-edge technology with user-friendly features.
          </p>
        </motion.div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="p-6 rounded-lg border border-border bg-card/60 backdrop-blur-sm"
            >
              <div className="mb-4 text-primary">{feature.icon}</div>
              <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}