"use client";

import { useParams } from "next/navigation";
import React, { useEffect, useState } from "react";
import { 
    Sheet, 
    SheetContent, 
    SheetTrigger,
    SheetHeader,
    SheetTitle,
    SheetDescription,
    
  } from "@/components/ui/sheet";
import { Menu } from 'lucide-react';


// Define the type for the split data
interface SplitData {
  effective_date: string;
  split_factor: string;
}

const Splits = () => {
  const { symbol } = useParams(); // Get the symbol from the URL
  const [splits, setSplits] = useState<SplitData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch data from the API
  useEffect(() => {
    const fetchSplits = async () => {
      try {
        const response = await fetch(`/actions/splits/${symbol}`);
        if (!response.ok) {
          throw new Error('Failed to fetch dividend data');
        }

        const data = await response.json();
        setSplits(data.data || []); // Set the splits data
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (err) {
        setError("Failed to fetch stock splits data. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchSplits();
  }, [symbol]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-green-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen text-red-500">
        {error}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-6 mt-16">
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
        <h1 className="text-3xl font-bold text-green-600 mb-6">
          Stock Splits for {symbol}
        </h1>

        {splits.length === 0 ? (
          <p className="text-gray-600">No stock splits data available.</p>
        ) : (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="grid grid-cols-2 gap-4 font-semibold text-gray-700 border-b pb-2">
              <div>Effective Date</div>
              <div>Split Factor</div>
            </div>
            {splits.map((split, index) => (
              <div
                key={index}
                className="grid grid-cols-2 gap-4 py-4 border-b last:border-b-0 hover:bg-gray-50 transition-colors"
              >
                <div className="text-gray-600">{split.effective_date}</div>
                <div className="text-gray-600">{split.split_factor}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Splits;