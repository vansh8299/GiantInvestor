// app/api/[symbol]/route.js
import { NextResponse } from 'next/server';

export async function GET(request, { params }) {
  const { symbol } = await params;
  console.log('Symbol:', symbol);
  const apiKey = process.env.ALPHA_VANTAGE_API_KEY; 
  const apiUrl = `https://www.alphavantage.co/query?function=TIME_SERIES_WEEKLY_ADJUSTED&symbol=${symbol}&apikey=${apiKey}`;

  try {
    // Fetch data from the Alpha Vantage API
    const response = await fetch(apiUrl);
    if (!response.ok) {
      throw new Error('Failed to fetch data from Alpha Vantage API');
    }

    // Parse the JSON response
    const data = await response.json();

    // Return the data as a JSON response
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching data:', error);
    return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
  }
}