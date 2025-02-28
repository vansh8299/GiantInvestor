import { NextResponse } from 'next/server';

export async function GET() {
    const apiKey = process.env.ALPHA_VANTAGE_API_KEY; 
    // const url = `https://www.alphavantage.co/query?function=NEWS_SENTIMENT&tickers=AAPL&apikey=${apiKey}`;
    const url = `https://www.alphavantage.co/query?function=NEWS_SENTIMENT&tickers=AAPL&apikey=${apiKey}`;

    try {
        const response = await fetch(url);
        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error('Error fetching news data:', error);
        return NextResponse.json({ error: 'Failed to fetch news data' }, { status: 500 });
    }
}