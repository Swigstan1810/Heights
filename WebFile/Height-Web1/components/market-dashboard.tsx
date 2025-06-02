"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Search, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import MarketDataWidget from "@/components/ui/market-data-widget";

// Default symbols for different tabs
const DEFAULT_STOCKS = ["AAPL", "MSFT", "GOOGL", "AMZN", "TSLA"];
const DEFAULT_CRYPTO = ["BTC", "ETH", "XRP", "SOL", "DOT"];
const DEFAULT_INDICES = ["^GSPC", "^DJI", "^IXIC", "^FTSE", "^NSEI"]; // S&P 500, Dow Jones, NASDAQ, FTSE, Nifty 50

export default function MarketDashboard() {
  const [activeTab, setActiveTab] = useState("stocks");
  const [stocks, setStocks] = useState<string[]>(DEFAULT_STOCKS);
  const [crypto, setCrypto] = useState<string[]>(DEFAULT_CRYPTO);
  const [indices, setIndices] = useState<string[]>(DEFAULT_INDICES);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [newSymbol, setNewSymbol] = useState("");
  
  // Helper to get current symbols based on active tab
  const getCurrentSymbols = () => {
    switch (activeTab) {
      case "crypto":
        return crypto;
      case "indices":
        return indices;
      case "stocks":
      default:
        return stocks;
    }
  };
  
  // Helper to set symbols for the active tab
  const setCurrentSymbols = (symbols: string[]) => {
    switch (activeTab) {
      case "crypto":
        setCrypto(symbols);
        break;
      case "indices":
        setIndices(symbols);
        break;
      case "stocks":
      default:
        setStocks(symbols);
        break;
    }
  };
  
  // Filter symbols based on search query
  const filteredSymbols = getCurrentSymbols().filter(symbol => 
    searchQuery === "" || symbol.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  // Add a new symbol
  const handleAddSymbol = () => {
    if (newSymbol && !getCurrentSymbols().includes(newSymbol.toUpperCase())) {
      setCurrentSymbols([...getCurrentSymbols(), newSymbol.toUpperCase()]);
      setNewSymbol("");
    }
  };
  
  // Remove a symbol
  const handleRemoveSymbol = (symbolToRemove: string) => {
    setCurrentSymbols(getCurrentSymbols().filter(symbol => symbol !== symbolToRemove));
  };
  
  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col-reverse md:flex-row md:justify-between md:items-center gap-4"
      >
        <Tabs defaultValue="stocks" value={activeTab} onValueChange={setActiveTab} className="w-full md:w-auto">
          <TabsList className="grid grid-cols-3 w-full md:w-auto">
            <TabsTrigger value="stocks">Stocks</TabsTrigger>
            <TabsTrigger value="crypto">Crypto</TabsTrigger>
            <TabsTrigger value="indices">Indices</TabsTrigger>
          </TabsList>
        </Tabs>
        
        <div className="flex w-full md:w-auto gap-2">
          <div className="relative flex-1 md:w-60">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search markets..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div className="flex gap-2">
            <Input
              placeholder="Add symbol..."
              className="w-24 md:w-32"
              value={newSymbol}
              onChange={(e) => setNewSymbol(e.target.value.toUpperCase())}
            />
            <Button size="icon" onClick={handleAddSymbol}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </motion.div>
      
      {/* Tab content */}
      <TabsContent value="stocks" className="m-0">
        {filteredSymbols.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredSymbols.map((symbol) => (
              <MarketDataWidget
                key={`stock-${symbol}`}
                symbol={symbol}
                type="stock"
                interval="1d"
                className="relative"
              >
                <Button
                  size="icon" 
                  variant="ghost" 
                  className="h-6 w-6 absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => handleRemoveSymbol(symbol)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </MarketDataWidget>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No stocks found. Add some stocks to track.</p>
          </div>
        )}
      </TabsContent>
      
      <TabsContent value="crypto" className="m-0">
        {filteredSymbols.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredSymbols.map((symbol) => (
              <MarketDataWidget
                key={`crypto-${symbol}`}
                symbol={symbol}
                type="crypto"
                interval="1d"
                className="relative group"
              >
                <Button
                  size="icon" 
                  variant="ghost" 
                  className="h-6 w-6 absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => handleRemoveSymbol(symbol)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </MarketDataWidget>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No cryptocurrencies found. Add some crypto to track.</p>
          </div>
        )}
      </TabsContent>
      
      <TabsContent value="indices" className="m-0">
        {filteredSymbols.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredSymbols.map((symbol) => (
              <MarketDataWidget
                key={`index-${symbol}`}
                symbol={symbol}
                type="stock" // Indices are treated as stocks in most APIs
                interval="1d"
                className="relative group"
              >
                <Button
                  size="icon" 
                  variant="ghost" 
                  className="h-6 w-6 absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => handleRemoveSymbol(symbol)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </MarketDataWidget>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No indices found. Add some indices to track.</p>
          </div>
        )}
      </TabsContent>
    </div>
  );
}