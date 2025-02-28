import { NextResponse } from 'next/server';

export async function GET(request: Request, { params }: { params: { symbol: string } }) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const apiKey = process.env.ALPHA_VANTAGE_API_KEY; // Replace with your Alpha Vantage API key
    const { symbol } = params;
    console.log('Symbol:', symbol);
    const url = `https://www.alphavantage.co/query?function=OVERVIEW&symbol=${symbol}&apikey=${apiKey}`;

    try {
        // Fetch data from Alpha Vantage API
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to fetch data: ${response.statusText}`);
        }

        const data = await response.json();

        // Return the data as a JSON response
        return NextResponse.json(data);
    } catch (error) {
        console.error('Error fetching data:', error);
        return NextResponse.json(
            { error: 'Failed to fetch data' },
            { status: 500 }
        );
    }
}