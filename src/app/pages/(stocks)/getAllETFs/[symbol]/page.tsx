"use client";

import { useParams } from "next/navigation";
import React, { useEffect, useState } from "react";

interface ETFSector {
  sector: string;
  weight: string;
}

interface ETFHoldings {
  symbol: string;
  description: string;
  weight: string;
}

interface ETFData {
  net_assets: string;
  net_expense_ratio: string;
  portfolio_turnover: string;
  dividend_yield: string;
  inception_date: string;
  leveraged: string;
  sectors: ETFSector[];
  holdings: ETFHoldings[];
}

const ETFDetail = () => {
  const { symbol } = useParams();
  const [etfData, setETFData] = useState<ETFData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => {
    const fetchETFData = async () => {
      try {
        const response = await fetch(`/actions/ETFs/${symbol}`);
        if (!response.ok) {
          throw new Error("Failed to fetch ETF data");
        }
        const data = await response.json();
        setETFData(data);
      } catch (err) {
        setError("Error fetching ETF data. Please try again later.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchETFData();
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

  if (!etfData) {
    return <div className="text-center py-8">No data available.</div>;
  }

  // Helper function to check if data is available
  const isDataAvailable = (value: string | ETFSector[] | ETFHoldings[]): boolean => {
    if (Array.isArray(value)) {
      return value.length > 0;
    }
    return Boolean(value && value !== "n/a" && value !== "NO" && value !== "");
  };

  // Make sure holdings exists before calculating pagination
  const holdings = etfData.holdings || [];
  
  // Pagination logic
  const totalPages = Math.ceil((holdings.length || 1) / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentHoldings = holdings.slice(indexOfFirstItem, indexOfLastItem);

  const handlePrevPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  };

  return (
    <div className="bg-gray-50 min-h-screen p-6 mt-14">
      {/* Header */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <h1 className="text-2xl font-bold text-green-600">
          {symbol} ETF Details
        </h1>
        <p className="text-gray-600">
          Inception Date: {isDataAvailable(etfData.inception_date) ? etfData.inception_date : "No information available"}
        </p>
      </div>

      {/* Overview Section */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <h2 className="text-xl font-semibold text-green-600 mb-4">Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-gray-100 p-4 rounded-lg">
            <p className="text-gray-600">Net Assets</p>
            <p className="text-lg font-bold text-gray-800">
              {isDataAvailable(etfData.net_assets) 
                ? `$${parseFloat(etfData.net_assets).toLocaleString()}`
                : "No information available"}
            </p>
          </div>
          <div className="bg-gray-100 p-4 rounded-lg">
            <p className="text-gray-600">Expense Ratio</p>
            <p className="text-lg font-bold text-gray-800">
              {isDataAvailable(etfData.net_expense_ratio)
                ? `${(parseFloat(etfData.net_expense_ratio) * 100).toFixed(2)}%`
                : "No information available"}
            </p>
          </div>
          <div className="bg-gray-100 p-4 rounded-lg">
            <p className="text-gray-600">Dividend Yield</p>
            <p className="text-lg font-bold text-gray-800">
              {isDataAvailable(etfData.dividend_yield)
                ? `${(parseFloat(etfData.dividend_yield) * 100).toFixed(2)}%`
                : "No information available"}
            </p>
          </div>
        </div>
      </div>

      {/* Sectors Section */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <h2 className="text-xl font-semibold text-green-600 mb-4">Sectors</h2>
        {isDataAvailable(etfData.sectors || []) ? (
          <div className="space-y-3">
            {(etfData.sectors || []).map((sector, index) => (
              <div key={index} className="flex justify-between items-center">
                <p className="text-gray-700">{sector.sector}</p>
                <p className="text-green-600 font-semibold">
                  {(parseFloat(sector.weight) * 100).toFixed(1)}%
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-gray-600 py-4">No information available</div>
        )}
      </div>

      {/* Top Holdings Section with Pagination */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold text-green-600 mb-4">Top Holdings</h2>
        {isDataAvailable(holdings) ? (
          <>
            <div className="space-y-3">
              {currentHoldings.map((holding, index) => (
                <div key={index} className="flex justify-between items-center">
                  <div>
                    <p className="text-gray-800 font-semibold">{holding.symbol}</p>
                    <p className="text-green-600 text-sm">{holding.description}</p>
                  </div>
                  <p className="text-green-600 font-semibold">
                    {(parseFloat(holding.weight) * 100).toFixed(1)}%
                  </p>
                </div>
              ))}
            </div>
            
            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center mt-6 space-x-4">
                <button
                  onClick={handlePrevPage}
                  disabled={currentPage === 1}
                  className={`px-4 py-2 rounded ${
                    currentPage === 1
                      ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                      : "bg-green-600 text-white hover:bg-green-700"
                  }`}
                >
                  Previous
                </button>
                <span className="text-gray-700">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages}
                  className={`px-4 py-2 rounded ${
                    currentPage === totalPages
                      ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                      : "bg-green-600 text-white hover:bg-green-700"
                  }`}
                >
                  Next
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="text-gray-600 py-4">No information available</div>
        )}
      </div>
    </div>
  );
};

export default ETFDetail;