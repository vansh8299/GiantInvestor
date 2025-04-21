// app/api/dividends/route.js
import { NextResponse } from 'next/server';

export async function GET(request, { params }) {
  const {symbol} = await params; 
  // eslint-disable-next-line no-unused-vars
  const apiKey = process.env.ALPHA_VANTAGE_API_KEY; 

  try {
    const response = await fetch(
      `https://www.alphavantage.co/query?function=DIVIDENDS&symbol=${symbol}&apikey=${apiKey}`
    );

    if (!response.ok) {
      throw new Error('Failed to fetch dividend data');
    }

    const data = await response.json();
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching dividend data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dividend data' },
      { status: 500 }
    );
  }
}