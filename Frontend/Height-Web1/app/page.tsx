import { Navbar } from "@/components/navbar";
import { SplashScreen } from "@/components/splash-screen";
import { ProgressBar } from "@/components/ui/progress-bar";
//import { LiveTicker } from "@/components/live-ticker";
import { HeroSection } from "@/components/hero-section";
import { MarketSection } from "@/components/market-section";
import { FeaturesSection } from "@/components/features-section";
import { CallToAction } from "@/components/call-to-action";
import { Footer } from "@/components/footer";

export default function Home() {
  return (
    <main className="min-h-screen">
      <SplashScreen />
      <ProgressBar 
        sections={[
          { id: "hero", color: "hsl(var(--chart-1))" },
          { id: "crypto", color: "hsl(var(--chart-2))" },
          { id: "stocks", color: "hsl(var(--chart-3))" },
          { id: "features", color: "hsl(var(--chart-4))" },
        ]}
      />
      <Navbar />
      
      
      
      <HeroSection />
      
      <div id="crypto">
        <MarketSection 
          title="Cryptocurrency"
          subtitle="Trade the most popular cryptocurrencies with real-time market data"
          type="crypto"
          limit={4}
          color="hsl(var(--chart-1))"
        />
      </div>
      
      <div id="stocks">
        <MarketSection 
          title="Indian Stocks"
          subtitle="Invest in Indian equities with instant execution and live market updates"
          type="stock"
          limit={4}
          color="hsl(var(--chart-2))"
        />
      </div>
      
      <div id="features">
        <FeaturesSection />
      </div>
      
      <CallToAction />
      
      <Footer />
    </main>
  );
}