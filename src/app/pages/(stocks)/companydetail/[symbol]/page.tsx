"use client";

import { useParams } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import { 
  Sheet, 
  SheetContent, 
  SheetTrigger,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  
} from "@/components/ui/sheet";
import { Menu } from 'lucide-react';

const CompanyDetail = () => {
  const { symbol } = useParams();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [companyData, setCompanyData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCompanyData = async () => {
      try {
        const response = await fetch(`/actions/companydetail/${symbol}`);
        if (!response.ok) {
          throw new Error('Failed to fetch company data');
        }
        const data = await response.json();
        setCompanyData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchCompanyData();
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
      <div className="flex justify-center items-center h-screen">
        <div className="text-red-500 text-xl font-semibold">Error: {error}</div>
      </div>
    );
  }

  if (!companyData) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-gray-700 text-xl font-semibold">No data available</div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-8 bg-white rounded-xl shadow-2xl mt-20">
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
      <h1 className="text-4xl font-bold mb-8 text-green-600">{companyData.Name}</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        {/* Basic Information */}
        <div className="bg-gray-50 p-6 rounded-lg shadow-sm">
          <h2 className="text-2xl font-semibold mb-4 text-gray-800">Basic Information</h2>
          <div className="space-y-3 text-gray-600">
            <p><span className="font-medium">Symbol:</span> {companyData.Symbol}</p>
            <p><span className="font-medium">Exchange:</span> {companyData.Exchange}</p>
            <p><span className="font-medium">Sector:</span> {companyData.Sector}</p>
            <p><span className="font-medium">Industry:</span> {companyData.Industry}</p>
            <p><span className="font-medium">Country:</span> {companyData.Country}</p>
            <p><span className="font-medium">Currency:</span> {companyData.Currency}</p>
          </div>
        </div>

        {/* Financial Highlights */}
        <div className="bg-gray-50 p-6 rounded-lg shadow-sm">
          <h2 className="text-2xl font-semibold mb-4 text-gray-800">Financial Highlights</h2>
          <div className="space-y-3 text-gray-600">
            <p><span className="font-medium">Market Cap:</span> ${parseInt(companyData.MarketCapitalization).toLocaleString()}</p>
            <p><span className="font-medium">EBITDA:</span> ${parseInt(companyData.EBITDA).toLocaleString()}</p>
            <p><span className="font-medium">PE Ratio:</span> {companyData.PERatio}</p>
            <p><span className="font-medium">PEG Ratio:</span> {companyData.PEGRatio}</p>
            <p><span className="font-medium">Dividend Yield:</span> {(companyData.DividendYield * 100).toFixed(2)}%</p>
            <p><span className="font-medium">EPS:</span> ${companyData.EPS}</p>
          </div>
        </div>
      </div>

      {/* Description */}
      <div className="bg-gray-50 p-6 rounded-lg shadow-sm mb-8">
        <h2 className="text-2xl font-semibold mb-4 text-gray-800">Description</h2>
        <p className="text-gray-600 leading-relaxed">{companyData.Description}</p>
      </div>

      {/* Additional Details */}
      <div className="bg-gray-50 p-6 rounded-lg shadow-sm">
        <h2 className="text-2xl font-semibold mb-4 text-gray-800">Additional Details</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-gray-600">
          <div>
            <p><span className="font-medium">Address:</span> {companyData.Address}</p>
            <p><span className="font-medium">Fiscal Year End:</span> {companyData.FiscalYearEnd}</p>
            <p><span className="font-medium">Latest Quarter:</span> {companyData.LatestQuarter}</p>
          </div>
          <div>
            <p><span className="font-medium">Analyst Target Price:</span> ${companyData.AnalystTargetPrice}</p>
            <p><span className="font-medium">52 Week High:</span> ${companyData['52WeekHigh']}</p>
            <p><span className="font-medium">52 Week Low:</span> ${companyData['52WeekLow']}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompanyDetail;