// app/getAllStocks/[slug]/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const StockDetailPage = () => {
  const { symbol } = useParams();
  const [intradayData, setIntradayData] = useState<unknown>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(`/actions/intraday/${symbol}`);
        if (!response.ok) {
          throw new Error('Failed to fetch data');
        }
        const data = await response.json();

        setIntradayData(data);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (err) {
        setError("Error");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [symbol]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-center mb-8 mt-24">
          Stock Details for {symbol}
        </h1>

        {/* Tabs for Intraday, Daily, Weekly, Monthly */}
        <Tabs defaultValue="intraday" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="intraday">Intraday</TabsTrigger>
            <TabsTrigger value="daily">Daily</TabsTrigger>
            <TabsTrigger value="weekly">Weekly</TabsTrigger>
            <TabsTrigger value="monthly">Monthly</TabsTrigger>
          </TabsList>

          {/* Intraday Tab Content */}
          <TabsContent value="intraday" className="mt-4">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold mb-4">Intraday Details</h2>
              {intradayData ? (
                <pre>{JSON.stringify(intradayData, null, 2)}</pre>
              ) : (
                <p>No data available</p>
              )}
            </div>
          </TabsContent>

          {/* Daily Tab Content */}
          <TabsContent value="daily" className="mt-4">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold mb-4">Daily Details</h2>
              <p>Display daily data for {symbol} here.</p>
            </div>
          </TabsContent>

          {/* Weekly Tab Content */}
          <TabsContent value="weekly" className="mt-4">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold mb-4">Weekly Details</h2>
              <p>Display weekly data for {symbol} here.</p>
            </div>
          </TabsContent>

          {/* Monthly Tab Content */}
          <TabsContent value="monthly" className="mt-4">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold mb-4">Monthly Details</h2>
              <p>Display monthly data for {symbol} here.</p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default StockDetailPage;