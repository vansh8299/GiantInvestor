import React from 'react';
import Link from "next/link";
import { Search } from "lucide-react";
import { useSearchContext } from "@/context/SearchContext";

const SearchDropdown = () => {
  const { searchQuery, setSearchQuery } = useSearchContext();
  const [stocks, setStocks] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [isOpen, setIsOpen] = React.useState(false);
  const dropdownRef = React.useRef(null);
  const inputRef = React.useRef(null);

  React.useEffect(() => {
    const fetchStocks = async () => {
      if (!searchQuery.trim()) {
        setStocks([]);
        return;
      }
      
      setLoading(true);
      try {
        const response = await fetch("/actions/getallStocks");
        const result = await response.json();
        
        if (result.success) {
          // Add null checks for name and symbol properties
          const filteredStocks = result.data.filter(stock =>
            (stock.name && stock.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
            (stock.symbol && stock.symbol.toLowerCase().includes(searchQuery.toLowerCase()))
          );
          setStocks(filteredStocks);
          setIsOpen(true);
        }
      } catch (err) {
        console.error("Error fetching stocks:", err);
      } finally {
        setLoading(false);
      }
    };

    const debounceTimeout = setTimeout(fetchStocks, 300);
    return () => clearTimeout(debounceTimeout);
  }, [searchQuery]);

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle keyboard navigation
  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  // Highlight matching text with null check
  const highlightMatch = (text, query) => {
    if (!text || !query) return text || "";
    const regex = new RegExp(`(${query})`, 'gi');
    return text.split(regex).map((part, index) => 
      regex.test(part) ? (
        <span key={index} className="bg-yellow-200">{part}</span>
      ) : (
        part
      )
    );
  };

  // Function to determine the correct route based on stock properties
  const getStockRoute = (stock) => {
    // Check if stock.name or stock.assetType contains "ETF"
    const isEtf = 
      (stock.name && stock.name.toUpperCase().includes("ETF")) || 
      (stock.assetType && stock.assetType.toUpperCase().includes("ETF"));
    
    return isEtf 
      ? `/pages/getAllETFs/${stock.symbol}`
      : `/pages/getAllStocks/${stock.symbol}`;
  };

  return (
    <div className="relative w-[35rem]" ref={dropdownRef}>
      <div className="flex items-center bg-gray-100 rounded-lg px-3 py-2">
        <Search className="w-5 h-5 text-gray-400 flex-shrink-0" />
        <input 
          ref={inputRef}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          type="text"
          placeholder="Search stocks, mutual funds & more"
          className="bg-transparent w-full ml-2 focus:outline-none"
        />
      </div>
      
      {/* Scrollable Dropdown Results */}
      {isOpen && (searchQuery.trim() !== '') && (
        <div className="absolute w-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
          {loading ? (
            <div className="p-4 text-center text-gray-500">Loading...</div>
          ) : stocks.length > 0 ? (
            <div className="max-h-[60vh] overflow-y-auto overscroll-contain">
              <div className="sticky top-0 bg-gray-50 p-2 text-xs text-gray-500 border-b">
                {stocks.length} results found
              </div>
              <div className="py-2">
                {stocks.map((stock, index) => (
                  <Link 
                    key={index} 
                    href={getStockRoute(stock)}
                    className="block px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-0"
                    onClick={() => {
                      setIsOpen(false);
                      setSearchQuery('');
                    }}
                  >
                    <div className="flex justify-between items-center gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="font-medium text-gray-900 truncate">
                          {highlightMatch(stock.symbol, searchQuery)}
                        </div>
                        <div className="text-sm text-gray-500 truncate">
                          {highlightMatch(stock.name, searchQuery)}
                        </div>
                      </div>
                      <div className="text-sm text-gray-400 flex-shrink-0">
                        {stock.exchange}
                      </div>
                    </div>
                    {stock.ipoDate && (
                      <div className="text-xs text-gray-400 mt-1">
                        IPO: {stock.ipoDate}
                      </div>
                    )}
                  </Link>
                ))}
              </div>
            </div>
          ) : (
            <div className="p-4 text-center text-gray-500">
              No results found for "{searchQuery}"
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchDropdown;