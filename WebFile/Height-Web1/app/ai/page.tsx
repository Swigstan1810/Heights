"use client";

import AIDashboard from "@/components/ai-dashboard";
import { Navbar } from "@/components/navbar";

export default function AIPage() {
  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      {/* Add proper spacing after navbar */}
      <div className="pt-180">
        <AIDashboard />
      </div>
    </main>
  );
}