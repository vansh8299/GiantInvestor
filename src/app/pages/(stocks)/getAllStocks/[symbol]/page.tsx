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

const StockDetailPage = () => {
  const { symbol } = useParams();
  const [intradayData, setIntradayData] = useState<{ time: string; price: number }[]>([]);
  const [dailyData, setDailyData] = useState<{ date: string; price: number }[]>([]);
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

        // Transform options data and extract unique expiration dates
        const formattedOptionsData = optionsData.data as OptionsData[];
        const uniqueExpirations = [...new Set(formattedOptionsData.map(option => option.expiration))].sort();
        setOptionsData(formattedOptionsData);
        setExpirationDates(uniqueExpirations);
        setSelectedExpiration(uniqueExpirations[0] || "");

        // Previous data transformations remain the same
        const formattedIntradayData = Object.entries(intradayData["Time Series (5min)"]).map(([time, values]) => ({
          time,
          price: parseFloat((values as { "1. open": string })["1. open"]),
        }));

        const formattedDailyData = Object.entries(dailyData["Time Series (Daily)"]).map(([date, values]) => ({
          date,
          price: parseFloat((values as { "4. close": string })["4. close"]),
        }));

        const formattedWeeklyData = Object.entries(weeklyData["Weekly Adjusted Time Series"]).map(([date, values]) => {
          const typedValues = values as { "4. close": string; "6. volume": string; "7. dividend amount": string };
          return {
            date,
            price: parseFloat(typedValues["4. close"]),
            volume: typedValues["6. volume"],
            dividend: typedValues["7. dividend amount"]
          };
        });

        const formattedMonthlyData = Object.entries(monthlyData["Monthly Adjusted Time Series"]).map(([date, values]) => {
          const typedValues = values as { "4. close": string; "6. volume": string; "7. dividend amount": string };
          return {
            date,
            price: parseFloat(typedValues["4. close"]),
            volume: typedValues["6. volume"],
            dividend: typedValues["7. dividend amount"]
          };
        });

        setIntradayData(formattedIntradayData);
        setDailyData(formattedDailyData);
        setWeeklyData(formattedWeeklyData);
        setMonthlyData(formattedMonthlyData);

        // Set latest metrics from daily data
        const latestDailyEntry = Object.values(dailyData["Time Series (Daily)"])[0] as {
          "7. dividend amount": string;
          "6. volume": string;
          "8. split coefficient": string;
        };
        setDividend(latestDailyEntry["7. dividend amount"]);
        setVolume(latestDailyEntry["6. volume"]);
        setSplit(latestDailyEntry["8. split coefficient"]);

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (error) {
        setError("Error fetching data");
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, [symbol]);

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

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="loader ease-linear rounded-full border-4 border-t-4 border-gray-200 h-12 w-12"></div>
      </div>
    );
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div className="min-h-screen bg-gray-200">
      {/* Add the drawer in the top-left corner with proper accessibility */}
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
            <SheetHeader className="mt-28">
              <SheetTitle className="text-3xl mb-4">Giant Investor</SheetTitle>
              <SheetDescription className="mt-8 text-lg">Explore More</SheetDescription>
       
            </SheetHeader>
            <div className="py-6">
              <nav className="space-y-4 mt-10">
             
                <a href={`/pages/companydetail/${symbol}`} className="text-xl mt-8 pb-6 block text-green-600 hover:underline">Company Overview</a>
                <a href="/portfolio" className="text-xl mt-8 pb-6 block text-green-600 hover:underline">Portfolio</a>
                <a href="/settings" className="text-xl mt-8 pb-6 block text-green-600 hover:underline">Settings</a>
            
              </nav>
            </div>
          </SheetContent>
        </Sheet>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-center mb-8 mt-16">
          Stock Details for {symbol}
        </h1>

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