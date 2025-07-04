"use client";
import { motion } from "framer-motion";
import { HeightsLogo } from "@/components/ui/heights-logo";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function PortfolioComingSoon() {
  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center bg-gradient-to-br from-background to-muted px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        className="flex flex-col items-center gap-4"
      >
        <HeightsLogo className="w-16 h-16 mb-2 animate-bounce-slow" />
        <motion.h1
          initial={{ scale: 0.95 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, duration: 0.5, type: "spring" }}
          className="text-3xl md:text-5xl font-extrabold text-center bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent drop-shadow-lg"
        >
          Portfolio Coming Soon
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="text-lg md:text-2xl text-muted-foreground text-center max-w-xl"
        >
          We're building something amazing for your investments. Track, analyze, and grow your portfolio—all in one place. Stay tuned!
        </motion.p>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="mt-6 flex flex-col sm:flex-row gap-3"
        >
          <Button asChild size="lg" className="shadow-lg animate-pulse">
            <Link href="/dashboard">Back to Dashboard</Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="shadow-lg">
            <Link href="/support">Contact Support</Link>
          </Button>
        </motion.div>
      </motion.div>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.15 }}
        transition={{ delay: 1, duration: 1.5 }}
        className="fixed inset-0 pointer-events-none z-0"
      >
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/20 via-accent/10 to-transparent animate-gradient-fade" />
      </motion.div>
    </div>
  );
}