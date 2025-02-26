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
interface IncomeStatement {
  fiscalDateEnding: string;
  reportedCurrency: string;
  grossProfit: string;
  totalRevenue: string;
  costOfRevenue: string;
  operatingIncome: string;
  netIncome: string;
  ebitda: string;
}

const Income = () => {
  const { symbol } = useParams();
  const [annualData, setAnnualData] = useState<IncomeStatement[]>([]);
  const [quarterlyData, setQuarterlyData] = useState<IncomeStatement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(`/actions/income/${symbol}`);
        if (!response.ok) {
          throw new Error("Failed to fetch data");
        }
        const data = await response.json();
        setAnnualData(data.annualReports.slice(0, 5)); // Show only the last 5 years
        setQuarterlyData(data.quarterlyReports.slice(0, 4)); // Show only the last 4 quarters
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [symbol]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-green-500"></div>
      </div>
    );
  }

  if (error) {
    return <div className="text-center py-8 text-red-500">{error}</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
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
      <h1 className="text-2xl font-bold text-green-600 ml-12 mt-16">
        Income Statement for {symbol}
      </h1>

      {/* Annual Reports Table */}
      <div className="mb-8 pl-12 pt-5">
        <h2 className="text-xl font-semibold text-gray-700 mb-4">
          Annual Reports
        </h2>
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fiscal Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Revenue
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Gross Profit
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Operating Income
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Net Income
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  EBITDA
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {annualData.map((item, index) => (
                <tr key={index} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {item.fiscalDateEnding}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${parseInt(item.totalRevenue).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${parseInt(item.grossProfit).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${parseInt(item.operatingIncome).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${parseInt(item.netIncome).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${parseInt(item.ebitda).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quarterly Reports Table */}
      <div className="pl-12 pt-5">
        <h2 className="text-xl font-semibold text-gray-700 mb-4">
          Quarterly Reports
        </h2>
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fiscal Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Revenue
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Gross Profit
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Operating Income
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Net Income
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  EBITDA
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {quarterlyData.map((item, index) => (
                <tr key={index} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {item.fiscalDateEnding}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${parseInt(item.totalRevenue).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${parseInt(item.grossProfit).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${parseInt(item.operatingIncome).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${parseInt(item.netIncome).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${parseInt(item.ebitda).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Income;