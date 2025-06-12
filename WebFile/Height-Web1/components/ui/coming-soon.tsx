// components/ui/coming-soon.tsx
"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { ArrowLeft, Rocket } from "lucide-react";

interface ComingSoonProps {
  title: string;
  description?: string;
}

export function ComingSoon({ title, description }: ComingSoonProps) {
  const router = useRouter();

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center max-w-md px-4"
      >
        <Rocket className="h-24 w-24 mx-auto mb-6 text-primary/50" />
        <h1 className="text-3xl font-bold mb-2">{title}</h1>
        <p className="text-muted-foreground mb-8">
          {description || "We're working hard to bring you this feature. Stay tuned!"}
        </p>
        <Button
          onClick={() => router.push("/crypto")}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Crypto
        </Button>
      </motion.div>
    </div>
  );
}