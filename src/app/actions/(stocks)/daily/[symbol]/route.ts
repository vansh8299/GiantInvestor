// app/api/[symbol]/route.ts
import { NextResponse } from 'next/server';

export async function GET(request: Request, { params }: { params: { symbol: string } }) {
  const apiKey = process.env.ALPHA_VANTAGE_API_KEY; 
  const { symbol } =  await params;
  console.log('Symbol:', symbol);

  // Construct the API URL with the provided symbol
  const apiUrl = `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY_ADJUSTED&symbol=${symbol}&outputsize=full&apikey=${apiKey}`;

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