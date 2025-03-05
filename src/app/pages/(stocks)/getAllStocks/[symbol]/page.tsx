/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { 
  Sheet, 
  SheetContent, 
  SheetTrigger,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast, Toaster } from "sonner";
import { useSession } from "next-auth/react";
import { OTPVerificationModal } from "@/components/OTPVerificationModal";

interface TransactionDetails {
  symbol: string;
  quantity: number;
  price: number;
  actionType: 'buy' | 'sell';
}

interface OptionsData {
  contractID: string;
  expiration: string;
  strike: string;
  type: string;
  last: string;
  mark: string;
  volume: string;
  open_interest: string;
  implied_volatility: string;
}

interface Stock {
  id: string;
  symbol: string;
  quantity: number;
  purchasePrice: number;
  currentPrice: number;
}

const StockDetailPage = () => {
  const { data: session } = useSession();
  const { symbol } = useParams();
  const [intradayData, setIntradayData] = useState<{ time: string; price: number }[]>([]);
  const [dailyData, setDailyData] = useState<{ date: string; price: number; adjustedClose: number; dividendAmount?: string; volume?: string; splitCoefficient?: string }[]>([]);
  const [weeklyData, setWeeklyData] = useState<{ date: string; price: number; volume: string; dividend: string }[]>([]);
  const [monthlyData, setMonthlyData] = useState<{ date: string; price: number; volume: string; dividend: string }[]>([]);
  const [optionsData, setOptionsData] = useState<OptionsData[]>([]);
  const [expirationDates, setExpirationDates] = useState<string[]>([]);
  const [selectedExpiration, setSelectedExpiration] = useState<string>("");
  const [dividend, setDividend] = useState<string>("0.0000");
  const [volume, setVolume] = useState<string>("0");
  const [split, setSplit] = useState<string>("1.0");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [actionType, setActionType] = useState<"buy" | "sell">("buy");
  const [quantity, setQuantity] = useState(1);
   const [isOTPModalOpen, setIsOTPModalOpen] = useState(false);
    const [transactionDetails, setTransactionDetails] = useState<TransactionDetails | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
const [selectedStock, setSelectedStock] = useState<Stock | null>(null);
  const ITEMS_PER_PAGE = 10;

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        const [intradayRes, dailyRes, weeklyRes, monthlyRes, optionsRes] = await Promise.all([
          fetch(`/actions/intraday/${symbol}`),
          fetch(`/actions/daily/${symbol}`),
          fetch(`/actions/weekly/${symbol}`),
          fetch(`/actions/monthly/${symbol}`),
          fetch(`/actions/F&O/${symbol}`)
        ]);

        if (!intradayRes.ok || !dailyRes.ok || !weeklyRes.ok || !monthlyRes.ok || !optionsRes.ok) {
          throw new Error('Failed to fetch data');
        }

        const [intradayData, dailyData, weeklyData, monthlyData, optionsData] = await Promise.all([
          intradayRes.json(),
          dailyRes.json(),
          weeklyRes.json(),
          monthlyRes.json(),
          optionsRes.json()
        ]);

        // Transform intraday data
        const formattedIntradayData = intradayData["Time Series (5min)"] ? Object.entries(intradayData["Time Series (5min)"]).map(([time, values]) => ({
          time,
          price: parseFloat((values as { "1. open": string })["1. open"]),
        })) : [];

        setIntradayData(formattedIntradayData);

        // Transform daily data
        const formattedDailyData = dailyData["Time Series (Daily)"] ? Object.entries(dailyData["Time Series (Daily)"]).map(([date, values]) => ({
          date,
          price: parseFloat((values as { "4. close": string })["4. close"]),
          adjustedClose: parseFloat((values as { "5. adjusted close": string })["5. adjusted close"] || "0"),
        })) : [];

        setDailyData(formattedDailyData);

        // Transform weekly data
        const formattedWeeklyData = weeklyData["Weekly Adjusted Time Series"] ? Object.entries(weeklyData["Weekly Adjusted Time Series"]).map(([date, values]) => ({
          date,
          price: parseFloat((values as { "4. close": string })["4. close"]),
          volume: (values as { "6. volume": string })["6. volume"] || "0",
          dividend: (values as { "7. dividend amount": string })["7. dividend amount"] || "0.0000",
        })) : [];

        setWeeklyData(formattedWeeklyData);

        // Transform monthly data
        const formattedMonthlyData = monthlyData["Monthly Adjusted Time Series"] ? Object.entries(monthlyData["Monthly Adjusted Time Series"]).map(([date, values]) => ({
          date,
          price: parseFloat((values as { "4. close": string })["4. close"]),
          volume: (values as { "6. volume": string })["6. volume"] || "0",
          dividend: (values as { "7. dividend amount": string })["7. dividend amount"] || "0.0000",
        })) : [];

        setMonthlyData(formattedMonthlyData);

        // Transform options data
        const formattedOptionsData: OptionsData[] = optionsData.data ? optionsData.data.map((option: OptionsData) => ({
          contractID: option.contractID,
          expiration: option.expiration,
          strike: option.strike,
          type: option.type,
          last: option.last,
          mark: option.mark,
          volume: option.volume,
          open_interest: option.open_interest,
          implied_volatility: option.implied_volatility,
        })) : [];

        setOptionsData(formattedOptionsData);
        setExpirationDates([...new Set(formattedOptionsData.map((option: OptionsData) => option.expiration))].sort() as string[]);
        setSelectedExpiration(formattedOptionsData[0]?.expiration || "");

        // Set latest metrics from daily data
        const latestDailyEntry = formattedDailyData[0] as { date: string; price: number; adjustedClose: number; dividendAmount?: string; volume?: string; splitCoefficient?: string } || {
          dividendAmount: "0.0000",
          volume: "0",
          splitCoefficient: "1.0",
        };

        setDividend(latestDailyEntry.dividendAmount || "0.0000");
        setVolume(latestDailyEntry.volume || "0");
        setSplit(latestDailyEntry.splitCoefficient || "1.0");

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (error) {
        setError("Error fetching data");
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, [symbol]);
  const createStockObject = (): Stock => ({
    id: symbol as string,
    symbol: symbol as string,
    quantity: 0, // This will be set by user
    purchasePrice: dailyData.length > 0 ? dailyData[0].adjustedClose : 0,
    currentPrice: dailyData.length > 0 ? dailyData[0].adjustedClose : 0
  });

 
  const getFilteredOptionsData = () => {
    return optionsData.filter(option => option.expiration === selectedExpiration);
  };

  const formatOptionsDataForChart = () => {
    const filteredData = getFilteredOptionsData();
    return filteredData.map(option => ({
      strike: parseFloat(option.strike),
      last: parseFloat(option.last),
      volume: parseInt(option.volume),
      openInterest: parseInt(option.open_interest),
      type: option.type
    }));
  };

  const handleBuySellClick = (type: "buy" | "sell") => {
    // Create a stock object when buy/sell is clicked
    const stock = createStockObject();
    setSelectedStock(stock);
    setActionType(type);
    setIsDrawerOpen(true);
  };
  const handleQuantityChange = (delta: number) => {
    setQuantity(prev => Math.max(1, prev + delta));
  };

  const handleSubmit = async () => {
    if (!selectedStock) {
      toast.error('Please select a stock');
      return;
    }
  
    // Set submitting state immediately
    setIsSubmitting(true);
  
    const details: TransactionDetails = {
      symbol: selectedStock.symbol,
      quantity: quantity,
      price: selectedStock.currentPrice,
      actionType: actionType
    };
  
    try {
      if (actionType === 'sell') {
        const response = await fetch('/actions/sellverify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            email: session?.user?.email,
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
          // Ensure submitting state is reset on error
          setIsSubmitting(false);
        }
      } else {
        // For buy action, proceed directly
        await processSellOrBuy(details);
      }
    } catch (error) {
      toast.error('An unexpected error occurred');
      // Ensure submitting state is reset on error
      setIsSubmitting(false);
    }
  };
  
  const verifyOTP = async (otp: string): Promise<boolean> => {
    if (!transactionDetails) return false;
  
    try {
      const response = await fetch('/actions/verifyotp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: session?.user?.email, 
          otp,
          type: 'transaction',
          transactionDetails 
        })
      });
  
      const data = await response.json();
      if (response.ok && data.verified) {
        // If OTP is verified, proceed with the transaction
        await processSellOrBuy(transactionDetails);
        return true;
      }
      
      // Reset submitting state if OTP verification fails
      setIsSubmitting(false);
      return false;
    } catch (error) {
      console.error('OTP verification error:', error);
      // Reset submitting state on error
      setIsSubmitting(false);
      return false;
    }
  };
  
  const processSellOrBuy = async (details: TransactionDetails) => {
    try {
      // Ensure submitting state is set
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
      // Always reset submitting state
      setIsSubmitting(false);
      setIsOTPModalOpen(false);
    }
  };
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-green-500"></div>
      </div>
    );
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  const latestAdjustedClose = dailyData.length > 0 ? dailyData[0].adjustedClose : "N/A";

  return (
    <div className="min-h-screen bg-green-50">
      {/* Add the drawer in the top-left corner with proper accessibility */}
      <Toaster position="bottom-right" />
      <div className="fixed top-24 left-4 z-50 bg-gray-200">
        <Sheet>
          <SheetTrigger asChild>
            <button 
              className="p-2 bg-white rounded-md shadow-md hover:bg-gray-100 transition-colors" 
              aria-label="Open navigation menu"
            >
              <Menu className="h-6 w-6" />
            </button>
          </SheetTrigger>
          <SheetContent side="left">
            <SheetHeader className="mt-14">
              <SheetTitle className="text-3xl">Giant Investor</SheetTitle>
              <SheetDescription className="text-lg">Explore More</SheetDescription>
            </SheetHeader>
            <div className="py-3">
              <nav className="space-y-2">
                <a href={`/pages/getAllStocks/${symbol}`} className="text-xl mt-8 pb-6 block text-green-600 hover:underline">Performance</a>
                <a href={`/pages/companydetail/${symbol}`} className="text-xl mt-8 pb-6 block text-green-600 hover:underline">Company Overview</a>
                <a href={`/pages/Dividend/${symbol}`} className="text-xl mt-8 pb-6 block text-green-600 hover:underline">Dividend</a>
                <a href={`/pages/splits/${symbol}`} className="text-xl mt-8 pb-6 block text-green-600 hover:underline">Splits</a>
                <a href={`/pages/income/${symbol}`} className="text-xl mt-8 pb-6 block text-green-600 hover:underline">Income</a>
                <a href={`/pages/balancesheet/${symbol}`} className="text-xl mt-8 pb-6 block text-green-600 hover:underline">Balance Sheet</a>
                <a href={`/pages/cashFlow/${symbol}`} className="text-xl mt-8 pb-6 block text-green-600 hover:underline">Cash Flow</a>
                <a href={`/pages/earnings/${symbol}`} className="text-xl mt-8 pb-6 block text-green-600 hover:underline">Earnings</a>
              </nav>
            </div>
          </SheetContent>
        </Sheet>
      </div>
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-center mb-4 mt-16">
          Stock Details for {symbol}
        </h1>
        <div className="flex justify-between items-center mb-8 mt-10">
          <p className="text-2xl font-semibold text-green-600">
            Price: <span className="font-bold">{latestAdjustedClose}</span>
          </p>
          <div className="flex space-x-2">
            <Button onClick={() => handleBuySellClick("buy")} className="px-10 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors">
              Buy
            </Button>
            <Button onClick={() => handleBuySellClick("sell")} className="px-10 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors">
              Sell
            </Button>
          </div>
        </div>

        {/* Buy/Sell Drawer */}
        <Sheet open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
          <SheetContent side="bottom" className="h-[35vh]">
            <SheetHeader>
              <SheetTitle>{actionType === "buy" ? "Buy" : "Sell"} {symbol}</SheetTitle>
              
              <SheetDescription>
              <div>
  <p>
   <span className="font-bold mb-8 text-lg text-green-500"> Price: {latestAdjustedClose}</span>
  </p>
  <p className="text-base">Enter the quantity you want to {actionType}.</p>
</div>

           
              </SheetDescription>
            </SheetHeader>
            <div className="mt-6">
              <div className="flex items-center justify-between">
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
           <OTPVerificationModal
          isOpen={isOTPModalOpen}
          onClose={() => setIsOTPModalOpen(false)}
          onVerify={verifyOTP}
          email={session?.user?.email || ''}
        />
        <Tabs defaultValue="intraday" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="intraday">Intraday</TabsTrigger>
            <TabsTrigger value="daily">Daily</TabsTrigger>
            <TabsTrigger value="weekly">Weekly</TabsTrigger>
            <TabsTrigger value="monthly">Monthly</TabsTrigger>
            <TabsTrigger value="F&O">F & O</TabsTrigger>
          </TabsList>

          {/* Intraday Tab Content */}
          <TabsContent value="intraday" className="mt-4">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold mb-4">Intraday Details</h2>
              {intradayData.length > 0 ? (
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={intradayData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="price" stroke="#8884d8" activeDot={{ r: 1 }} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <p>No intraday data available</p>
              )}
            </div>
          </TabsContent>

          {/* Daily Tab Content */}
          <TabsContent value="daily" className="mt-4">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold mb-4">Daily Details</h2>
              {dailyData.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={400}>
                    <LineChart data={dailyData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="price" stroke="#82ca9d" dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                  <div className="mt-6 grid grid-cols-3 gap-4">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-500">Dividend Amount</p>
                      <p className="text-lg font-semibold">{dividend}</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-500">Volume</p>
                      <p className="text-lg font-semibold">{volume}</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-500">Split Coefficient</p>
                      <p className="text-lg font-semibold">{split}</p>
                    </div>
                  </div>
                </>
              ) : (
                <p>No daily data available</p>
              )}
            </div>
          </TabsContent>

          {/* Weekly Tab Content */}
          <TabsContent value="weekly" className="mt-4">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold mb-4">Weekly Details</h2>
              {weeklyData.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={400}>
                    <LineChart data={weeklyData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="price" stroke="#2563eb" dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                  <div className="mt-6 grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-500">Latest Weekly Volume</p>
                      <p className="text-lg font-semibold">{weeklyData[0]?.volume || "N/A"}</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-500">Latest Weekly Dividend</p>
                      <p className="text-lg font-semibold">{weeklyData[0]?.dividend || "0.0000"}</p>
                    </div>
                  </div>
                </>
              ) : (
                <p>No weekly data available</p>
              )}
            </div>
          </TabsContent>

          {/* Monthly Tab Content */}
          <TabsContent value="monthly" className="mt-4">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold mb-4">Monthly Details</h2>
              {monthlyData.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={400}>
                    <LineChart data={monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="price" stroke="#2563eb" dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                  <div className="mt-6 grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-500">Latest Monthly Volume</p>
                      <p className="text-lg font-semibold">{monthlyData[0]?.volume || "N/A"}</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-500">Latest Monthly Dividend</p>
                      <p className="text-lg font-semibold">{monthlyData[0]?.dividend || "0.0000"}</p>
                    </div>
                  </div>
                </>
              ) : (
                <p>No Monthly data available</p>
              )}
            </div>
          </TabsContent>

          {/* F&O Tab Content */}
          <TabsContent value="F&O" className="mt-4">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold">Future & Options</h2>
                <Select value={selectedExpiration} onValueChange={setSelectedExpiration}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select expiration" />
                  </SelectTrigger>
                  <SelectContent>
                    {expirationDates.map((date) => (
                      <SelectItem key={date} value={date}>
                        {new Date(date).toLocaleDateString()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {optionsData.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={400}>
                    <LineChart data={formatOptionsDataForChart()}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="strike" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="last" stroke="#8884d8" name="Last Price" dot={false} />
                      <Line type="monotone" dataKey="openInterest" stroke="#82ca9d" name="Open Interest" dot={false} />
                    </LineChart>
                  </ResponsiveContainer>

                  <div className="mt-6 overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Strike</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Volume</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Open Interest</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">IV</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {getFilteredOptionsData()
                          .slice(currentPage * ITEMS_PER_PAGE, (currentPage + 1) * ITEMS_PER_PAGE)
                          .map((option) => (
                            <tr key={option.contractID}>
                              <td className="px-6 py-4 whitespace-nowrap">{option.strike}</td>
                              <td className="px-6 py-4 whitespace-nowrap capitalize">{option.type}</td>
                              <td className="px-6 py-4 whitespace-nowrap">{option.last}</td>
                              <td className="px-6 py-4 whitespace-nowrap">{option.volume}</td>
                              <td className="px-6 py-4 whitespace-nowrap">{option.open_interest}</td>
                              <td className="px-6 py-4 whitespace-nowrap">{option.implied_volatility}</td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="flex justify-between items-center mt-4">
                    <button
                      onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 0))}
                      disabled={currentPage === 0}
                      className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
                    >
                      Previous
                    </button>
                    <span>
                      Page {currentPage + 1} of {Math.ceil(getFilteredOptionsData().length / ITEMS_PER_PAGE)}
                    </span>
                    <button
                      onClick={() =>
                        setCurrentPage((prev) =>
                          Math.min(prev + 1, Math.ceil(getFilteredOptionsData().length / ITEMS_PER_PAGE) - 1)
                        )
                      }
                      disabled={
                        currentPage >= Math.ceil(getFilteredOptionsData().length / ITEMS_PER_PAGE) - 1
                      }
                      className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
                    >
                      Next
                    </button>
                  </div>
                </>
              ) : (
                <p>No options data available</p>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

    </div>
  );
};

export default StockDetailPage;