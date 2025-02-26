"use client"

import { useParams } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { 
    Sheet, 
    SheetContent, 
    SheetTrigger,
    SheetHeader,
    SheetTitle,
    SheetDescription,
    
  } from "@/components/ui/sheet";
import { Menu } from 'lucide-react';

// Define types for the API response
interface DividendItem {
  ex_dividend_date: string;
  declaration_date: string;
  record_date: string;
  payment_date: string;
  amount: string;
}

interface DividendData {
  symbol: string;
  data: DividendItem[];
}

const Dividend = () => {
  const { symbol } = useParams();
  const [dividendData, setDividendData] = useState<DividendData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchDividendData = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/actions/dividend/${symbol}`);
        if (!response.ok) {
          throw new Error('Failed to fetch dividend data');
        }
        const data = await response.json();
        setDividendData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
        console.error('Error fetching dividend data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDividendData();
  }, [symbol]);

  // Format data for the chart
  const chartData = dividendData?.data
    ? dividendData.data.slice(0, 10).map(item => ({
        date: item.payment_date.substring(0, 7), // YYYY-MM format
        amount: parseFloat(item.amount),
      })).reverse()
    : [];



  // Get the total annual dividend amount
  const getAnnualDividend = () => {
    if (!dividendData?.data || dividendData.data.length < 1) return 'N/A';
    const latestAmount = parseFloat(dividendData.data[0].amount);
    return (latestAmount * 4).toFixed(2);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8 mt-14">
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
      <div className="max-w-4xl mx-auto">
        {loading ? (
    <div className="flex justify-center items-center h-screen">
    <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-green-500"></div>
  </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-lg">
            {error}
          </div>
        ) : dividendData && dividendData.data ? (
          <>
            <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-6">
              <div className="bg-green-600 p-6 text-white">
                <div className="flex justify-between items-center">
                  <h1 className="text-2xl font-bold">{dividendData.symbol} Dividend Details</h1>
                  
                </div>
              </div>
              
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  <div className="bg-gray-50 p-4 rounded-lg shadow-sm">
                    <div className="text-sm text-gray-500">Latest Dividend</div>
                    <div className="text-2xl font-bold text-green-600">
                      ${dividendData.data[0]?.amount || 'N/A'}
                    </div>
                    <div className="text-xs text-gray-400">
                      Ex-Date: {dividendData.data[0]?.ex_dividend_date || 'N/A'}
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-lg shadow-sm">
                    <div className="text-sm text-gray-500">Annual Dividend</div>
                    <div className="text-2xl font-bold text-green-600">${getAnnualDividend()}</div>
                    <div className="text-xs text-gray-400">Based on latest quarterly amount</div>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-lg shadow-sm">
                    <div className="text-sm text-gray-500">Payment Frequency</div>
                    <div className="text-2xl font-bold text-green-600">Quarterly</div>
                    <div className="text-xs text-gray-400">Next Payment: {dividendData.data[0]?.payment_date || 'N/A'}</div>
                  </div>
                </div>
                
                <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
                  <h2 className="text-lg font-semibold mb-4 text-gray-800">Dividend History</h2>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={chartData}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                        <XAxis dataKey="date" />
                        <YAxis domain={['auto', 'auto']} />
                        <Tooltip formatter={(value) => ['$' + value, 'Dividend']} />
                        <Line
                          type="monotone"
                          dataKey="amount"
                          stroke="#10b981"
                          strokeWidth={2}
                          dot={{ r: 4, fill: "#10b981" }}
                          activeDot={{ r: 6 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="p-6">
                <h2 className="text-lg font-semibold mb-4 text-gray-800">Dividend Payment Schedule</h2>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ex-Dividend Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Record Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {dividendData.data.slice(0, 8).map((item, index) => (
                        <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.ex_dividend_date}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.record_date}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.payment_date}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">${item.amount}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-600 p-4 rounded-lg">
            No dividend data available
          </div>
        )}
      </div>
    </div>
  );
};

export default Dividend;