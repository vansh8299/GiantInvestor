/* eslint-disable @typescript-eslint/no-unused-vars */
"use client"

import React, { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ArrowRight, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import { toast, Toaster } from "sonner";

interface Stock {
  id: string;
  symbol: string;
  quantity: number;
  purchasePrice: number;
  currentPrice: number;
}

interface PortfolioStats {
  totalInvestment: number;
  currentValue: number;
  profitLoss: number;
  profitLossPercentage: number;
  stockCount: number;
}

interface StockTableProps {
  stocks: Stock[];
  onRowClick: (stock: Stock, actionType: "buy" | "sell") => void;
}

const StockTable: React.FC<StockTableProps> = ({ stocks, onRowClick }) => {
  if (stocks.length === 0) {
    return <div className="text-center py-8 text-gray-500">No stocks found</div>;
  }

  return (
    <div className="overflow-x-auto bg-green-50">
      <table className="w-full border-collapse">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Symbol</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avg. Purchase Price</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Current Price</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Value</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Profit/Loss</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">P/L %</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {stocks.map((stock) => {
            const totalValue = stock.quantity * stock.currentPrice;
            const investmentValue = stock.quantity * stock.purchasePrice;
            const profitLoss = totalValue - investmentValue;
            const profitLossPercentage = ((stock.currentPrice - stock.purchasePrice) / stock.purchasePrice) * 100;

            return (
              <tr key={stock.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <a href={`/pages/getAllStocks/${stock.symbol}`} className="text-blue-600 hover:underline font-medium">
                    {stock.symbol}
                  </a>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">{stock.quantity}</td>
                <td className="px-6 py-4 whitespace-nowrap">${stock.purchasePrice.toFixed(2)}</td>
                <td className="px-6 py-4 whitespace-nowrap">${stock.currentPrice.toFixed(2)}</td>
                <td className="px-6 py-4 whitespace-nowrap">${totalValue.toFixed(2)}</td>
                <td className={`px-6 py-4 whitespace-nowrap ${profitLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  ${profitLoss.toFixed(2)}
                </td>
                <td className={`px-6 py-4 whitespace-nowrap ${profitLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {profitLossPercentage.toFixed(2)}%
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <Button
                    variant="outline"
                    className="mr-2 bg-green-500 text-white hover:bg-green-600"
                    onClick={() => onRowClick(stock, "buy")}
                  >
                    Buy
                  </Button>
                  <Button
                    variant="outline"
                    className="bg-red-500 text-white hover:bg-red-600"
                    onClick={() => onRowClick(stock, "sell")}
                  >
                    Sell
                  </Button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

const Portfolio: React.FC = () => {
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [portfolioStats, setPortfolioStats] = useState<PortfolioStats>({
    totalInvestment: 0,
    currentValue: 0,
    profitLoss: 0,
    profitLossPercentage: 0,
    stockCount: 0,
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStock, setSelectedStock] = useState<Stock | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [actionType, setActionType] = useState<"buy" | "sell">("buy");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showError, setShowError] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const router = useRouter()

  useEffect(() => {
    const fetchUserStocks = async () => {
      try {
        setLoading(true);
        const response = await fetch('/actions/getStocks');

        if (!response.ok) {
          throw new Error('Failed to fetch portfolio data');
        }

        const { data } = await response.json();
        setStocks(data.stocks);
        setPortfolioStats(data.portfolioStats);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchUserStocks();
  }, []);

  const handleQuantityChange = (delta: number) => {
    setQuantity(prev => Math.max(1, prev + delta));
  };

  const handleSubmit = async () => {
    if (!selectedStock) return;

    try {
      setIsSubmitting(true);
      const response = await fetch('/actions/investment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          symbol: selectedStock.symbol,
          quantity: quantity,
          price: selectedStock.currentPrice,
          actionType: actionType,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || 'Transaction failed');
      } else {
        toast.success(data.message);
        setSelectedStock(null); // Close the drawer
        setQuantity(1); // Reset quantity
        window.location.reload();
        
      }
    } catch (error) {
      console.error('Transaction error:', error);
      toast.error('An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 p-4 rounded-md text-red-800">
        Error: {error}
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 mt-12 bg-green-50">
            <Toaster position="bottom-right" />
      <h1 className="text-3xl font-bold mb-6 text-green-600">My Portfolio</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Investment</CardDescription>
            <CardTitle className="text-2xl">${portfolioStats.totalInvestment.toFixed(2)}</CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Current Value</CardDescription>
            <CardTitle className="text-2xl">${portfolioStats.currentValue.toFixed(2)}</CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Profit/Loss</CardDescription>
            <CardTitle
              className={`text-2xl ${portfolioStats.profitLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}
            >
              ${portfolioStats.profitLoss.toFixed(2)} ({portfolioStats.profitLossPercentage}%)
            </CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Stocks Owned</CardDescription>
            <CardTitle className="text-2xl">{portfolioStats.stockCount}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList>
          <TabsTrigger value="all">All Stocks</TabsTrigger>
          <TabsTrigger value="profitable">Profitable</TabsTrigger>
          <TabsTrigger value="loss">Loss</TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <StockTable stocks={stocks} onRowClick={(stock, actionType) => {
            setSelectedStock(stock);
            setActionType(actionType);
          }} />
        </TabsContent>

        <TabsContent value="profitable">
          <StockTable stocks={stocks.filter(stock => stock.currentPrice >= stock.purchasePrice)} onRowClick={(stock, actionType) => {
            setSelectedStock(stock);
            setActionType(actionType);
          }} />
        </TabsContent>

        <TabsContent value="loss">
          <StockTable stocks={stocks.filter(stock => stock.currentPrice < stock.purchasePrice)} onRowClick={(stock, actionType) => {
            setSelectedStock(stock);
            setActionType(actionType);
          }} />
        </TabsContent>
      </Tabs>

      {/* Stock Drawer */}
      <Sheet open={!!selectedStock} onOpenChange={() => setSelectedStock(null)}>
        <SheetContent side="bottom" className="h-[40vh]">
        <SheetHeader>
  <div className="flex items-center">
    <SheetTitle className="text-green-600">{selectedStock?.symbol}</SheetTitle>
    <a href={`/pages/getAllStocks/${selectedStock?.symbol}`} className="ml-2">
      <ArrowRight size={24} />
    </a>
  </div>
  <SheetDescription className="text-lg font-bold text-black">
    Current Price: ${selectedStock?.currentPrice.toFixed(2)}
  </SheetDescription>
</SheetHeader>
          <div className="mt-4 text-base font-bold text-black">
            <p>Quantity: {selectedStock?.quantity}</p>
            
            <div className="flex items-center justify-between mt-6">
              <Button onClick={() => handleQuantityChange(-1)} variant="outline" size="sm">
                -
              </Button>
              <Input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                className="mx-2 text-center"
                min="1"
              />
              <Button onClick={() => handleQuantityChange(1)} variant="outline" size="sm">
                +
              </Button>
            </div>
            <Button 
              onClick={handleSubmit} 
              className={`w-full mt-4 ${actionType === "buy" ? "bg-green-500" : "bg-red-500"} text-white`}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Processing..." : actionType === "buy" ? "Buy" : "Sell"}
            </Button>
          </div>
        </SheetContent>
      </Sheet>

   
    </div>
  );
};

export default Portfolio;