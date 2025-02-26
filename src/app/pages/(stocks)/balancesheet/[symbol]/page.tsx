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

interface BalanceSheetData {
  symbol: string;
  annualReports: {
    fiscalDateEnding: string;
    reportedCurrency: string;
    totalAssets: string;
    totalCurrentAssets: string;
    cashAndCashEquivalentsAtCarryingValue: string;
    inventory: string;
    totalNonCurrentAssets: string;
    totalLiabilities: string;
    totalCurrentLiabilities: string;
    totalNonCurrentLiabilities: string;
    totalShareholderEquity: string;
    commonStockSharesOutstanding: string;
  }[];
  quarterlyReports: {
    fiscalDateEnding: string;
    reportedCurrency: string;
    totalAssets: string;
    totalCurrentAssets: string;
    cashAndCashEquivalentsAtCarryingValue: string;
    inventory: string;
    totalNonCurrentAssets: string;
    totalLiabilities: string;
    totalCurrentLiabilities: string;
    totalNonCurrentLiabilities: string;
    totalShareholderEquity: string;
    commonStockSharesOutstanding: string;
  }[];
}

const BalanceSheet = () => {
  const { symbol } = useParams();
  const [data, setData] = useState<BalanceSheetData | null>(null);
  const [loading, setLoading] = useState(true);
  const [annualPage, setAnnualPage] = useState(1);
  const [quarterlyPage, setQuarterlyPage] = useState(1);
  const recordsPerPage = 6;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(`/actions/balancesheet/${symbol}`);
        const result = await response.json();
        setData(result);
      } catch (error) {
        console.error('Error fetching data:', error);
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


  if (!data) {
    return <div className="flex justify-center items-center h-screen">No data available</div>;
  }

  // Pagination logic for annual reports
  const annualTotalPages = Math.ceil(data.annualReports.length / recordsPerPage);
  const annualStartIndex = (annualPage - 1) * recordsPerPage;
  const annualEndIndex = annualStartIndex + recordsPerPage;
  const annualPaginatedData = data.annualReports.slice(annualStartIndex, annualEndIndex);

  // Pagination logic for quarterly reports
  const quarterlyTotalPages = Math.ceil(data.quarterlyReports.length / recordsPerPage);
  const quarterlyStartIndex = (quarterlyPage - 1) * recordsPerPage;
  const quarterlyEndIndex = quarterlyStartIndex + recordsPerPage;
  const quarterlyPaginatedData = data.quarterlyReports.slice(quarterlyStartIndex, quarterlyEndIndex);

  return (
    <div className="min-h-screen bg-gray-100 p-6">
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
      <div className="max-w-4xl mx-auto mt-16">
        <h1 className="text-2xl font-bold mb-6 text-green-600">{data.symbol} Balance Sheet</h1>

        {/* Annual Reports Table */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Annual Reports</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fiscal Date Ending
                  </th>
                  <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Assets
                  </th>
                  <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Liabilities
                  </th>
                  <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Shareholder Equity
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {annualPaginatedData.map((report, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {report.fiscalDateEnding}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {report.totalAssets}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {report.totalLiabilities}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {report.totalShareholderEquity}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Pagination for Annual Reports */}
          <div className="flex justify-center items-center mt-4">
            <button
              onClick={() => setAnnualPage((prev) => Math.max(prev - 1, 1))}
              disabled={annualPage === 1}
              className="mx-1 px-4 py-2 bg-green-600 text-white rounded"
            >
              Previous
            </button>
            <span className="mx-4">
              Page {annualPage} of {annualTotalPages}
            </span>
            <button
              onClick={() => setAnnualPage((prev) => Math.min(prev + 1, annualTotalPages))}
              disabled={annualPage === annualTotalPages}
              className="mx-1 px-4 py-2 bg-green-600 text-white rounded"
            >
              Next
            </button>
          </div>
        </div>

        {/* Quarterly Reports Table */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Quarterly Reports</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fiscal Date Ending
                  </th>
                  <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Assets
                  </th>
                  <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Liabilities
                  </th>
                  <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Shareholder Equity
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {quarterlyPaginatedData.map((report, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {report.fiscalDateEnding}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {report.totalAssets}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {report.totalLiabilities}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {report.totalShareholderEquity}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Pagination for Quarterly Reports */}
          <div className="flex justify-center items-center mt-4">
            <button
              onClick={() => setQuarterlyPage((prev) => Math.max(prev - 1, 1))}
              disabled={quarterlyPage === 1}
              className="mx-1 px-4 py-2 bg-green-600 text-white rounded"
            >
              Previous
            </button>
            
            <span className="mx-4">
              Page {quarterlyPage} of {quarterlyTotalPages}
            </span>
            <button
              onClick={() => setQuarterlyPage((prev) => Math.min(prev + 1, quarterlyTotalPages))}
              disabled={quarterlyPage === quarterlyTotalPages}
              className="mx-1 px-4 py-2 bg-green-600 text-white rounded"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BalanceSheet;