/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import React, { useState } from 'react';
import { useEffect } from 'react';
import { Wallet, Gift } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Link from "next/link";
import { Button } from '@/components/ui/button';
import ReferralModal from '@/components/ReferModal';
import AddMoneyModal from '@/components/AddMoneyModal';

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
  const [isReferralModalOpen, setIsReferralModalOpen] = useState(false);
  const [isAddMoneyModalOpen, setIsAddMoneyModalOpen] = useState(false);

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

  const handleAddMoney = async (amount: number) => {
    try {
      // Step 1: Create a transaction and get the order ID
      const response = await fetch('/actions/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: 'cm7n56a9h0001lhkci8p9a677', // Replace with actual user ID
          amount,
          type: 'deposit',
          status: 'pending',
        }),
      });
  
      if (!response.ok) {
        throw new Error('Failed to create transaction');
      }
  
      const orderData = await response.json();
      
      if (!orderData.success || !orderData.transaction || !orderData.orderId) {
        throw new Error('Invalid order data received');
      }
  
      const transactionId = orderData.transaction.id;
      
      // Step 2: Initialize Razorpay
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: amount * 100, // Razorpay expects amount in paise
        currency: "INR",
        name: "Your Company Name",
        description: "Add Money to Wallet",
        order_id: orderData.orderId, // Make sure this is passed from the backend
        handler: function(response: any) {
          // Step 3: Verify the payment
          verifyPayment(response, transactionId);
        },
        prefill: {
          name: "User Name",
          email: "user@example.com",
        },
        theme: {
          color: "#3399cc",
        },
      };
    
      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (error) {
      console.error('Error in payment process:', error);
      alert('Payment process failed: ' + error);
    }
  };
  
  // Separate function to verify payment
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const verifyPayment = async (response: any, transactionId: string) => {
    try {
      // Make sure all required fields are present
      if (!response.razorpay_payment_id || !response.razorpay_order_id || !response.razorpay_signature) {
        throw new Error('Incomplete payment details received from Razorpay');
      }
  
      const verifyResponse = await fetch('/actions/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          razorpay_payment_id: response.razorpay_payment_id,
          razorpay_order_id: response.razorpay_order_id,
          razorpay_signature: response.razorpay_signature,
          transactionId,
        }),
      });
  
      if (!verifyResponse.ok) {
        throw new Error('Payment verification request failed');
      }
  
      const verifyResult = await verifyResponse.json();
  
      if (!verifyResult.success) {
        throw new Error(verifyResult.error || 'Payment verification failed');
      }
  
      // Payment successful
      alert('Payment successful!');
      setIsAddMoneyModalOpen(false);
    } catch (error) {
      console.error('Error verifying payment:', error);
      alert('Payment verification failed: ' + error);
    }
  };
  const stockIndices = [
    { name: 'NIFTY 50', value: '22,419.50', change: '+0.45%', isPositive: true },
    { name: 'SENSEX', value: '73,821.20', change: '+0.38%', isPositive: true },
    { name: 'BANK NIFTY', value: '47,312.30', change: '-0.12%', isPositive: false }
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-green-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Toaster for notifications */}
  
      {/* Referral Modal */}
      <ReferralModal 
        isOpen={isReferralModalOpen} 
        onClose={() => setIsReferralModalOpen(false)} 
      />

      {/* Add Money Modal */}
      <AddMoneyModal 
        isOpen={isAddMoneyModalOpen} 
        onClose={() => setIsAddMoneyModalOpen(false)} 
        onProceed={handleAddMoney}
      />
      
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
          <button 
            className="flex items-center justify-center gap-2 bg-green-600 text-white rounded-lg py-3"
            onClick={() => setIsAddMoneyModalOpen(true)}
          >
            <Wallet className="w-5 h-5" />
            Add Money
          </button>
          <button 
            className="flex items-center justify-center gap-2 border border-green-600 text-green-600 rounded-lg py-3"
            onClick={() => setIsReferralModalOpen(true)}
          >
            <Gift className="w-5 h-5" />
            Refer to a friend
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
              <Link href="/pages/getAllETFs"><Button className='ml-5 bg-green-600'>See all ETFs</Button></Link>
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