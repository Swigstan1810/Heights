"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export function CallToAction() {
  const router = useRouter();
  
  return (
    <section className="py-24 px-4 md:px-8 lg:px-16 relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-primary/20 -z-10"></div>
      
      {/* Decorative elements */}
      <div className="absolute -top-20 -right-20 w-64 h-64 bg-primary/10 rounded-full blur-3xl -z-10"></div>
      <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-primary/10 rounded-full blur-3xl -z-10"></div>
      
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6">
            Ready to Start Trading?
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-10">
            Join thousands of traders who have already discovered the power of Heights.
            Create your account today and elevate your trading experience.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button 
              size="lg" 
              onClick={() => router.push("/signup")}
              className="min-w-[150px]"
            >
              Sign Up Now
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              onClick={() => router.push("#learn")}
              className="min-w-[150px]"
            >
              Learn More
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}