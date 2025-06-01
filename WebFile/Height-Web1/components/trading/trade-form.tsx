"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { placeOrder } from "@/lib/market-data";
<<<<<<< HEAD
import { useToast } from "@/components/ui/use-toast";
=======
import { useToast } from "@/hooks/use-toast";
>>>>>>> 016f08c0876be523f2a572c92d2c2da6438ff007
import { Calculator, ArrowUp, ArrowDown } from "lucide-react";

interface TradeFormProps {
  symbol: string;
  currentPrice: number;
  userId: string;
}

export function TradeForm({ symbol, currentPrice, userId }: TradeFormProps) {
  const [orderType, setOrderType] = useState<"market" | "limit">("market");
  const [quantity, setQuantity] = useState("");
  const [price, setPrice] = useState("");
  const [amount, setAmount] = useState("");
  const [percentage, setPercentage] = useState([0]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const availableBalance = 125432; // This should come from user's actual balance

  const calculateTotal = () => {
    const qty = parseFloat(quantity) || 0;
    const prc = orderType === "market" ? currentPrice : (parseFloat(price) || 0);
    return qty * prc;
  };

  const handlePercentageChange = (value: number[]) => {
    setPercentage(value);
    const amountToUse = (availableBalance * value[0]) / 100;
    const priceToUse = orderType === "market" ? currentPrice : (parseFloat(price) || currentPrice);
    if (priceToUse > 0) {
      setQuantity((amountToUse / priceToUse).toFixed(8));
      setAmount(amountToUse.toFixed(2));
    }
  };

  const handleSubmit = async (side: "buy" | "sell") => {
    if (!quantity || parseFloat(quantity) <= 0) {
      toast({
        title: "Invalid quantity",
        description: "Please enter a valid quantity",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      await placeOrder({
        userId,
        symbol,
        side,
        quantity: parseFloat(quantity),
        price: orderType === "limit" ? parseFloat(price) : undefined,
        type: orderType,
      });

      toast({
        title: "Order placed successfully",
        description: `${side.toUpperCase()} order for ${quantity} ${symbol} has been placed`,
      });

      // Reset form
      setQuantity("");
      setPrice("");
      setAmount("");
      setPercentage([0]);
    } catch (error) {
      toast({
        title: "Order failed",
        description: "There was an error placing your order. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <Tabs defaultValue="buy" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="buy" className="data-[state=active]:bg-green-500 data-[state=active]:text-white">
            Buy
          </TabsTrigger>
          <TabsTrigger value="sell" className="data-[state=active]:bg-red-500 data-[state=active]:text-white">
            Sell
          </TabsTrigger>
        </TabsList>

        <TabsContent value="buy" className="space-y-4">
          <TradeFormContent
            side="buy"
            orderType={orderType}
            setOrderType={setOrderType}
            quantity={quantity}
            setQuantity={setQuantity}
            price={price}
            setPrice={setPrice}
            amount={amount}
            setAmount={setAmount}
            percentage={percentage}
            handlePercentageChange={handlePercentageChange}
            currentPrice={currentPrice}
            calculateTotal={calculateTotal}
            handleSubmit={handleSubmit}
            loading={loading}
            symbol={symbol}
          />
        </TabsContent>

        <TabsContent value="sell" className="space-y-4">
          <TradeFormContent
            side="sell"
            orderType={orderType}
            setOrderType={setOrderType}
            quantity={quantity}
            setQuantity={setQuantity}
            price={price}
            setPrice={setPrice}
            amount={amount}
            setAmount={setAmount}
            percentage={percentage}
            handlePercentageChange={handlePercentageChange}
            currentPrice={currentPrice}
            calculateTotal={calculateTotal}
            handleSubmit={handleSubmit}
            loading={loading}
            symbol={symbol}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function TradeFormContent({
  side,
  orderType,
  setOrderType,
  quantity,
  setQuantity,
  price,
  setPrice,
  amount,
  setAmount,
  percentage,
  handlePercentageChange,
  currentPrice,
  calculateTotal,
  handleSubmit,
  loading,
  symbol,
}: any) {
  return (
    <>
      {/* Order Type Selection */}
      <div className="flex gap-2">
        <Button
          variant={orderType === "market" ? "default" : "outline"}
          size="sm"
          onClick={() => setOrderType("market")}
          className="flex-1"
        >
          Market
        </Button>
        <Button
          variant={orderType === "limit" ? "default" : "outline"}
          size="sm"
          onClick={() => setOrderType("limit")}
          className="flex-1"
        >
          Limit
        </Button>
      </div>

      {/* Price Input (for limit orders) */}
      {orderType === "limit" && (
        <div className="space-y-2">
          <Label htmlFor="price">Price</Label>
          <div className="relative">
            <Input
              id="price"
              type="number"
              placeholder="0.00"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="pr-12"
            />
            <span className="absolute right-3 top-3 text-sm text-muted-foreground">
              INR
            </span>
          </div>
        </div>
      )}

      {/* Quantity Input */}
      <div className="space-y-2">
        <Label htmlFor="quantity">Quantity</Label>
        <div className="relative">
          <Input
            id="quantity"
            type="number"
            placeholder="0.00000000"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            className="pr-16"
          />
          <span className="absolute right-3 top-3 text-sm text-muted-foreground">
            {symbol.split(':')[1]?.replace('USDT', '')}
          </span>
        </div>
      </div>

      {/* Amount Slider */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <Label>Amount</Label>
          <span className="text-sm text-muted-foreground">{percentage[0]}%</span>
        </div>
        <Slider
          value={percentage}
          onValueChange={handlePercentageChange}
          max={100}
          step={25}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>0%</span>
          <span>25%</span>
          <span>50%</span>
          <span>75%</span>
          <span>100%</span>
        </div>
      </div>

      {/* Total Display */}
      <div className="p-3 bg-muted/50 rounded-lg space-y-1">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Total</span>
          <span className="font-medium">₹{calculateTotal().toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">Fee (0.1%)</span>
          <span>₹{(calculateTotal() * 0.001).toFixed(2)}</span>
        </div>
      </div>

      {/* Submit Button */}
      <Button
        className={`w-full ${
          side === "buy"
            ? "bg-green-600 hover:bg-green-700"
            : "bg-red-600 hover:bg-red-700"
        }`}
        onClick={() => handleSubmit(side)}
        disabled={loading}
      >
        {loading ? (
          "Processing..."
        ) : (
          <>
            {side === "buy" ? (
              <ArrowDown className="h-4 w-4 mr-2" />
            ) : (
              <ArrowUp className="h-4 w-4 mr-2" />
            )}
            {side === "buy" ? "Buy" : "Sell"} {symbol.split(':')[1]}
          </>
        )}
      </Button>
    </>
  );
}