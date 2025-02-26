// app/api/splits/route.ts
import { NextResponse } from 'next/server';

export async function GET(request: Request, { params }: { params: { symbol: string } }) {
 
    const {symbol} = await params; 

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const apiKey = 'demo'; // Replace with your actual API key
    const url = `https://www.alphavantage.co/query?function=SPLITS&symbol=${symbol}&apikey=demo`;

    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error('Failed to fetch data from Alpha Vantage');
        }

        const data = await response.json();
        return NextResponse.json(data);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
    }
}