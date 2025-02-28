import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const keywords = searchParams.get('keywords');

  if (!keywords) {
    return NextResponse.json({ error: 'Keywords parameter is required' }, { status: 400 });
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const apiKey = process.env.ALPHA_VANTAGE_API_KEY;  // Replace with your actual API key
    const apiUrl = `https://www.alphavantage.co/query?function=SYMBOL_SEARCH&keywords=${keywords}&apikey=${apiKey}`;

    const response = await fetch(apiUrl);
    const data = await response.json();

    if (data.Note || data.Information) {
      return NextResponse.json({ error: 'API rate limit exceeded' }, { status: 429 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching data from Alpha Vantage:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}