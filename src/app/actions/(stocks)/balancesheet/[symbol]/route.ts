import { NextResponse } from 'next/server';

export async function GET(request: Request, { params }: { params: { symbol: string } }) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const apiKey = process.env.ALPHA_VANTAGE_API_KEY; // Replace with your Alpha Vantage API key
    const {symbol} = await params; 
    const url = `https://www.alphavantage.co/query?function=BALANCE_SHEET&symbol=${symbol}&apikey=${apiKey}`;

    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error('Failed to fetch data');
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error('Error fetching income statement data:', error);
        return NextResponse.json(
            { error: 'Failed to fetch income statement data' },
            { status: 500 }
        );
    }
}