import { NextResponse } from 'next/server';

export async function GET() {
  const apiKey = process.env.ALPHA_VANTAGE_API_KEY; // Store your API key in .env
  // const url = `https://www.alphavantage.co/query?function=LISTING_STATUS&apikey=${apiKey}`;
  const url = `https://www.alphavantage.co/query?function=LISTING_STATUS&apikey=${apiKey}`;


  try {
    const response = await fetch(url);
    const csvData = await response.text();

  
    const rows = csvData.split("\n").slice(1); 
    const data = rows.map((row) => {
      const [symbol, name, exchange, assetType, ipoDate, delistingDate, status] = row.split(",");
      return { symbol, name, exchange, assetType, ipoDate, delistingDate, status };
    });

    
    // const stockData = data.filter((item) => item.assetType === "Stock");

    return NextResponse.json({ success: true, data: data });
  } catch (error) {
    console.error("Error fetching data:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch data" }, { status: 500 });
  }
}