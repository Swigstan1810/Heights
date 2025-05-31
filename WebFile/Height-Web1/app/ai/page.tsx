"use client";

import AIDashboard from "@/components/ai-dashboard";
import { Navbar } from "@/components/navbar";

export default function AIPage() {
  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      <AIDashboard />
    </main>
  );
}