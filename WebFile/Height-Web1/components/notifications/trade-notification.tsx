// components/notifications/trade-notification.tsx
import { toast } from 'sonner';
import { CheckCircle2, TrendingUp, TrendingDown, Wallet } from 'lucide-react';

export const showTradeSuccess = (
  type: 'buy' | 'sell',
  symbol: string,
  quantity: number,
  price: number,
  total: number
) => {
  toast.success(
    <div className="flex items-start gap-3">
      <div className={`p-2 rounded-full ${
        type === 'buy' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
      }`}>
        {type === 'buy' ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
      </div>
      <div className="flex-1">
        <p className="font-semibold">
          {type === 'buy' ? 'Purchase' : 'Sale'} Successful
        </p>
        <p className="text-sm text-muted-foreground mt-1">
          {type === 'buy' ? 'Bought' : 'Sold'} {quantity.toFixed(6)} {symbol}
        </p>
        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
          <span>Price: ₹{price.toLocaleString()}</span>
          <span>Total: ₹{total.toLocaleString()}</span>
        </div>
      </div>
    </div>,
    {
      duration: 5000,
      position: 'top-right',
    }
  );
};

export const showWalletUpdate = (newBalance: number, change: number) => {
  toast.info(
    <div className="flex items-center gap-3">
      <Wallet className="h-5 w-5 text-blue-600" />
      <div>
        <p className="font-medium">Wallet Updated</p>
        <p className="text-sm text-muted-foreground">
          New Balance: ₹{newBalance.toLocaleString()}
        </p>
      </div>
    </div>,
    {
      duration: 3000,
      position: 'bottom-right',
    }
  );
};