// app/api/stocks/[symbol]/route.ts
import { NextResponse } from 'next/server';

export async function GET(request: Request, { params }: { params: { symbol: string } }) {
  const { symbol } = params;
  console.log('Symbol:', symbol);

  // Replace with your actual API key or use environment variables
//   const apiKey = 'demo';
  const url = `https://www.alphavantage.co/query?function=TIME_SERIES_INTRADAY&symbol=${symbol}&interval=5min&apikey=demo`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (data['Error Message']) {
      return NextResponse.json({ error: 'Invalid symbol or API error' }, { status: 400 });
    }

    return NextResponse.json(data);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
  }
}