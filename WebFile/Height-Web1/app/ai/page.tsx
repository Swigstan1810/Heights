"use client";

import AIDashboard from "@/components/ai-dashboard";
import { Navbar } from "@/components/navbar";

export default function AIPage() {
  return (
    <main className="min-h-screen bg-background dark:bg-black">
      <Navbar />
      {/* Add proper spacing after navbar */}
      <div className="pt-20">
        <AIDashboard />
      </div>
    </main>
  );
}