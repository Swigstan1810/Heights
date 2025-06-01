"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function CryptoPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to home page with crypto tab selected
    router.push('/?tab=crypto');
  }, [router]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <h2 className="text-xl font-semibold mb-2">Redirecting...</h2>
        <p className="text-muted-foreground">Taking you to the crypto section</p>
      </div>
    </div>
  );
}