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
import { useSession } from "next-auth/react";
import { OTPVerificationModal } from "@/components/OTPVerificationModal";
// Remove the direct import of jsonwebtoken
// import jwt from 'jsonwebtoken';

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
interface TransactionDetails {
  symbol: string;
  quantity: number;
  price: number;
  actionType: 'buy' | 'sell';
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
  const { data: session } = useSession();
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
  const [isOTPModalOpen, setIsOTPModalOpen] = useState(false);
  const [transactionDetails, setTransactionDetails] = useState<TransactionDetails | null>(null);
  const [dailyData, setDailyData] = useState<{ date: string; price: number; adjustedClose: number; dividendAmount?: string; volume?: string; splitCoefficient?: string }[]>([]);
  const [userEmail, setUserEmail] = useState<string>(''); // Add this state
  const router = useRouter();

  // Fetch and set the email
  useEffect(() => {
    const fetchEmail = async () => {
      const email = await getEmail();
      if (email) {
        setUserEmail(email);
      }
    };

    fetchEmail();
  }, []);
  const getEmail = async () => {
    if (session?.user?.email) {
      return session.user.email;
    } else {
      try {
        const response = await fetch('/actions/decodeEmail', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
  
        if (response.ok) {
          const data = await response.json();
          return data.email;
        }
        return null;
      } catch (e) {
        console.error("Error getting user email:", e);
        return null;
      }
    }
  };

 
  useEffect(() => {
    const fetchUserEmail = async () => {
      if (!session?.user?.email) {
        const email = await getEmail();

      }
    };
    
    fetchUserEmail();
    
    const fetchUserStocks = async () => {
      try {
        setLoading(true);
        const response = await fetch('/actions/getStocks');
    
        if (!response.ok) {
          throw new Error('Failed to fetch portfolio data');
        }
    
        const { data } = await response.json();
        const updatedStocks = await Promise.all(data.stocks.map(async (stock: Stock) => {
          let latestAdjustedClose = stock.currentPrice;
    
          try {
            const dailyRes = await fetch(`/actions/daily/${stock.symbol}`);
            if (dailyRes.ok) {
              const dailyData = await dailyRes.json();
              const timeSeriesDaily = dailyData["Time Series (Daily)"] as Record<string, { "5. adjusted close": string }> | undefined;
              if (timeSeriesDaily && Object.values(timeSeriesDaily).length > 0) {
                latestAdjustedClose = parseFloat(Object.values(timeSeriesDaily)[0]["5. adjusted close"]);
              }
            }
          } catch (e) {
            console.error(`Error fetching daily data for ${stock.symbol}:`, e);
          }
    
          if (latestAdjustedClose === stock.currentPrice) {
            try {
              const weeklyRes = await fetch(`/actions/weekly/${stock.symbol}`);
              if (weeklyRes.ok) {
                const weeklyData = await weeklyRes.json();
                const timeSeriesWeekly = weeklyData["Weekly Adjusted Time Series"] as Record<string, { "5. adjusted close": string }> | undefined;
                if (timeSeriesWeekly && Object.values(timeSeriesWeekly).length > 0) {
                  latestAdjustedClose = parseFloat(Object.values(timeSeriesWeekly)[0]["5. adjusted close"]);
                }
              }
            } catch (e) {
              console.error(`Error fetching weekly data for ${stock.symbol}:`, e);
            }
          }
    
          return { ...stock, currentPrice: latestAdjustedClose };
        }));
    
        setStocks(updatedStocks);
        setPortfolioStats(calculatePortfolioStats(updatedStocks));
      } catch (err) {
        console.error("Error in fetchUserStocks:", err);
        setError(typeof err === 'object' && err !== null && 'message' in err ? String(err.message) : 'An unknown error occurred');
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserStocks();
  }, [session]);

  const calculatePortfolioStats = (stocks: Stock[]): PortfolioStats => {
    if (!stocks || stocks.length === 0) {
      return {
        totalInvestment: 0,
        currentValue: 0,
        profitLoss: 0,
        profitLossPercentage: 0,
        stockCount: 0,
      };
    }
    
    const totalInvestment = stocks.reduce((sum, stock) => sum + stock.quantity * stock.purchasePrice, 0);
    const currentValue = stocks.reduce((sum, stock) => sum + stock.quantity * stock.currentPrice, 0);
    const profitLoss = currentValue - totalInvestment;
    const profitLossPercentage = totalInvestment > 0 ? (profitLoss / totalInvestment) * 100 : 0;
    const stockCount = stocks.length;

    return {
      totalInvestment,
      currentValue,
      profitLoss,
      profitLossPercentage,
      stockCount,
    };
  };

  const handleQuantityChange = (delta: number) => {
    setQuantity(prev => Math.max(1, prev + delta));
  };

  const handleSubmit = async () => {
    if (!selectedStock) {
      toast.error('Please select a stock');
      return;
    }
  
    setIsSubmitting(true);
  
    const details: TransactionDetails = {
      symbol: selectedStock.symbol,
      quantity: quantity,
      price: selectedStock.currentPrice,
      actionType: actionType
    };
  
    try {
      if (actionType === 'sell') {
        const email = await getEmail();
  
        if (!email) {
          toast.error('User email not found. Please log in again.');
          setIsSubmitting(false);
          return;
        }
  
        const response = await fetch('/actions/sellverify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            email: email,
            type: 'transaction',
            transactionDetails: details
          })
        });
  
        const data = await response.json();
        if (response.ok) {
          setTransactionDetails(details);
          setIsOTPModalOpen(true);
        } else {
          toast.error(data.error || 'Failed to send OTP');
          setIsSubmitting(false);
        }
      } else {
        await processSellOrBuy(details);
      }
    } catch (error) {
      console.error("Submit error:", error);
      toast.error('An unexpected error occurred');
      setIsSubmitting(false);
    }
  };
  
  const verifyOTP = async (otp: string): Promise<boolean> => {
    if (!transactionDetails) return false;
  
    try {
      const email = await getEmail();
  
      if (!email) {
        toast.error('User email not found. Please log in again.');
        setIsSubmitting(false);
        return false;
      }
  
      const response = await fetch('/actions/verifyotp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: email, 
          otp,
          type: 'transaction',
          transactionDetails 
        })
      });
  
      const data = await response.json();
      if (response.ok && data.verified) {
        await processSellOrBuy(transactionDetails);
        return true;
      }
  
      setIsSubmitting(false);
      return false;
    } catch (error) {
      console.error('OTP verification error:', error);
      setIsSubmitting(false);
      return false;
    }
  };
  
  const processSellOrBuy = async (details: TransactionDetails) => {
    try {
      setIsSubmitting(true);
  
      const response = await fetch('/actions/investment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(details),
      });
  
      const data = await response.json();
  
      if (!response.ok) {
        toast.error(data.error || 'Transaction failed');
      } else {
        toast.success(data.message);
        setSelectedStock(null);
        setQuantity(1);
        window.location.reload();
      }
    } catch (error) {
      console.error('Transaction error:', error);
      toast.error('An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
      setIsOTPModalOpen(false);
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
              ${portfolioStats.profitLoss.toFixed(2)} ({portfolioStats.profitLossPercentage.toFixed(2)}%)
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
      <OTPVerificationModal
  isOpen={isOTPModalOpen}
  onClose={() => {
    setIsOTPModalOpen(false);
    setIsSubmitting(false);
  }}
  onVerify={verifyOTP}
  email={userEmail}
  transactionDetails={transactionDetails} // Pass the transactionDetails here
/>

      {/* Stock Drawer */}
      <Sheet open={!!selectedStock} onOpenChange={() => {
        setSelectedStock(null);
        setIsSubmitting(false);
      }}>
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
              {isSubmitting ? (
                <div className="flex items-center justify-center">
                  <svg 
                    className="animate-spin h-5 w-5 mr-3" 
                    viewBox="0 0 24 24"
                  >
                    <circle 
                      className="opacity-25" 
                      cx="12" 
                      cy="12" 
                      r="10" 
                      stroke="currentColor" 
                      strokeWidth="4"
                    ></circle>
                    <path 
                      className="opacity-75" 
                      fill="currentColor" 
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Processing...
                </div>
              ) : (
                actionType === "buy" ? "Buy" : "Sell"
              )}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default Portfolio;