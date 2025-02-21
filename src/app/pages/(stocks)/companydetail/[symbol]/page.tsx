"use client";

import { useParams } from 'next/navigation';
import React, { useEffect, useState } from 'react';

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
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500"></div>
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
      <h1 className="text-4xl font-bold mb-8 text-blue-700">{companyData.Name}</h1>
      
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