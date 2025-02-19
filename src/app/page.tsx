"use client"

import React from 'react';
import { useEffect, useState } from 'react';
import { Wallet, Gift } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Link from "next/link";
import { Button } from '@/components/ui/button';

type Stock = {
  ticker: string;
  price: string;
  change_percentage: string;
};

type ApiResponse = {
  top_gainers: Stock[];
  top_losers: Stock[];
  most_actively_traded: Stock[];
};

const HomePage = () => {
  const [data, setData] = useState<ApiResponse>({ top_gainers: [], top_losers: [], most_actively_traded: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/actions/topgainersorlosers');
        const result: ApiResponse = await response.json();
        setData(result);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const stockIndices = [
    { name: 'NIFTY 50', value: '22,419.50', change: '+0.45%', isPositive: true },
    { name: 'SENSEX', value: '73,821.20', change: '+0.38%', isPositive: true },
    { name: 'BANK NIFTY', value: '47,312.30', change: '-0.12%', isPositive: false }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="loader ease-linear rounded-full border-4 border-t-4 border-gray-200 h-12 w-12"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Top Navigation */}
    
      {/* Main Content */}
      <main className="pt-28 px-4">
        {/* Market Indices */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-3">Market Indices</h2>
          <div className="flex gap-4 overflow-x-auto">
            {stockIndices.map((index) => (
              <div key={index.name} className="flex-shrink-0 bg-gray-50 rounded-lg p-3 min-w-[200px]">
                <div className="text-sm text-gray-600">{index.name}</div>
                <div className="font-semibold mt-1">{index.value}</div>
                <div className={`text-sm ${index.isPositive ? 'text-green-500' : 'text-red-500'}`}>
                  {index.change}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <button className="flex items-center justify-center gap-2 bg-green-600 text-white rounded-lg py-3">
            <Wallet className="w-5 h-5" />
            Add Money
          </button>
          <button className="flex items-center justify-center gap-2 border border-green-600 text-green-600 rounded-lg py-3">
            <Gift className="w-5 h-5" />
            Refer & Earn
          </button>
        </div>

        {/* Top Stocks */}
        <div className="min-h-screen bg-white">
          <main className="pt-10 px-4">
            <Tabs defaultValue="gainers" className="w-full">
              <TabsList>
                <TabsTrigger value="gainers">Top Gainers</TabsTrigger>
                <TabsTrigger value="losers">Top Losers</TabsTrigger>
                <TabsTrigger value="most_traded">Most Traded</TabsTrigger>
              </TabsList>
              <Link href="/pages/getAllStocks"><Button className='ml-5 bg-green-600'>See all stocks</Button></Link>
              <Link href="/pages/news"><Button className='ml-5 bg-green-600'>Global News</Button></Link>
              <TabsContent value="gainers">
                <StockList stocks={data.top_gainers} />
              </TabsContent>
              <TabsContent value="losers">
                <StockList stocks={data.top_losers} />
              </TabsContent>
              <TabsContent value="most_traded">
                <StockList stocks={data.most_actively_traded} />
              </TabsContent>
            </Tabs>
          </main>
        </div>
      </main>

      {/* Bottom Navigation */}
      {/* <nav className="fixed bottom-0 w-full bg-white border-t border-gray-200">
        <div className="flex justify-around py-3">
          {['Explore', 'Investments', 'Orders', 'Profile'].map((item) => (
            <button key={item} className="flex flex-col items-center text-gray-600">
              <div className="w-6 h-6 mb-1 bg-gray-200 rounded-full" />
              <span className="text-xs">{item}</span>
            </button>
          ))}
        </div>
      </nav> */}
    </div>
  );
};

const StockList = ({ stocks }: { stocks: Stock[] | undefined }) => {
  if (!stocks) {
    return <div>No stocks available</div>;
  }

  return (
    <div className="space-y-3">
      {stocks.map((stock, index) => (
        <div key={index} className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
          <div>
            <div className="font-medium">{stock.ticker}</div>
            <div className="text-sm text-gray-600">${stock.price}</div>
          </div>
          <div className={`text-sm ${stock.change_percentage.includes('+') ? 'text-green-500' : 'text-red-500'}`}>
            {stock.change_percentage}
          </div>
        </div>
      ))}
    </div>
  );
};

export default HomePage;