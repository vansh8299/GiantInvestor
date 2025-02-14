import React from 'react';
import { Search, TrendingUp, Wallet, Gift, Bell } from 'lucide-react';

const HomePage = () => {
  const stockIndices = [
    { name: 'NIFTY 50', value: '22,419.50', change: '+0.45%', isPositive: true },
    { name: 'SENSEX', value: '73,821.20', change: '+0.38%', isPositive: true },
    { name: 'BANK NIFTY', value: '47,312.30', change: '-0.12%', isPositive: false }
  ];

  const topStocks = [
    { name: 'TCS', price: '4,012.45', change: '+2.3%', isPositive: true },
    { name: 'Reliance', price: '2,845.30', change: '+1.8%', isPositive: true },
    { name: 'HDFC Bank', price: '1,478.90', change: '-0.7%', isPositive: false }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Top Navigation */}
      <nav className="fixed top-0 w-full bg-white border-b border-gray-200 z-10">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="text-2xl font-bold text-green-600">groww</div>
          <div className="flex items-center gap-4">
            <Bell className="w-6 h-6 text-gray-600" />
            <div className="w-8 h-8 rounded-full bg-gray-200" />
          </div>
        </div>
        
        {/* Search Bar */}
        <div className="px-4 py-2">
          <div className="flex items-center bg-gray-100 rounded-lg px-3 py-2">
            <Search className="w-5 h-5 text-gray-400" />
            <input 
              type="text"
              placeholder="Search stocks, mutual funds & more"
              className="bg-transparent w-full ml-2 focus:outline-none"
            />
          </div>
        </div>
      </nav>

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
        <div className="mb-6">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-lg font-semibold">Top Stocks</h2>
            <TrendingUp className="w-5 h-5 text-gray-600" />
          </div>
          <div className="space-y-3">
            {topStocks.map((stock) => (
              <div key={stock.name} className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                <div>
                  <div className="font-medium">{stock.name}</div>
                  <div className="text-sm text-gray-600">₹{stock.price}</div>
                </div>
                <div className={`text-sm ${stock.isPositive ? 'text-green-500' : 'text-red-500'}`}>
                  {stock.change}
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 w-full bg-white border-t border-gray-200">
        <div className="flex justify-around py-3">
          {['Explore', 'Investments', 'Orders', 'Profile'].map((item) => (
            <button key={item} className="flex flex-col items-center text-gray-600">
              <div className="w-6 h-6 mb-1 bg-gray-200 rounded-full" />
              <span className="text-xs">{item}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
};

export default HomePage;