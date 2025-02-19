"use client"; // Mark this as a Client Component

import React, { useEffect, useState } from "react";
import { useSearchContext } from "@/context/SearchContext"; // Import search context

interface Stock {
  symbol: string;
  name: string;
  exchange: string;
  ipoDate: string;
  status: string;
}

const GetAllStocks = () => {
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const { searchQuery } = useSearchContext(); // Get search query from context

  useEffect(() => {
    const fetchStocks = async () => {
      try {
        const response = await fetch("/actions/getallStocks");
        const result = await response.json();

        if (result.success) {
          setStocks(result.data);
        } else {
          setError(result.error || "Failed to fetch data");
        }
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (err) {
        setError("An error occurred while fetching data");
      } finally {
        setLoading(false);
      }
    };

    fetchStocks();
  }, []);

  // Filter stocks based on search query
  const filteredStocks = stocks.filter(stock =>
    stock.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Function to highlight matching text
  const highlightMatch = (text: string, query: string) => {
    if (!query) return text;
    const regex = new RegExp(`(${query})`, "gi");
    return text.split(regex).map((part, index) =>
      part.toLowerCase() === query.toLowerCase() ? (
        <span key={index} className="bg-yellow-300">{part}</span>
      ) : (
        part
      )
    );
  };

  // Get current stocks
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentStocks = filteredStocks.slice(indexOfFirstItem, indexOfLastItem);

  const nextPage = () => {
    if (currentPage < Math.ceil(filteredStocks.length / itemsPerPage)) {
      setCurrentPage(currentPage + 1);
    }
  };

  const prevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  if (error) {
    return <div className="text-center py-8 text-red-500">{error}</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-center mb-8">Stock Listings</h1>
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <table className="min-w-full">
            <thead className="bg-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Symbol</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Exchange</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">IPO Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {currentStocks.map((stock, index) => (
                <tr key={index} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{stock.symbol}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {highlightMatch(stock.name, searchQuery)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">{stock.exchange}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{stock.ipoDate}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{stock.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* Pagination Controls */}
        <div className="flex justify-center mt-8 items-center">
          <button onClick={prevPage} disabled={currentPage === 1} className="mx-1 px-4 py-2 bg-green-500 text-white rounded">Previous</button>
          <span className="mx-4 text-gray-700">Page {currentPage} of {Math.ceil(filteredStocks.length / itemsPerPage)}</span>
          <button onClick={nextPage} disabled={currentPage === Math.ceil(filteredStocks.length / itemsPerPage)} className="mx-1 px-4 py-2 bg-green-500 text-white rounded">Next</button>
        </div>
      </div>
    </div>
  );
};

export default GetAllStocks;
