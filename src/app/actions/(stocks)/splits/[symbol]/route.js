/* eslint-disable @typescript-eslint/no-unused-vars */
// app/api/splits/route.js
import { NextResponse } from 'next/server';

export async function GET(request, { params }) {
 
    const {symbol} = await params; 

    // eslint-disable-next-line no-unused-vars
    const apiKey = process.env.ALPHA_VANTAGE_API_KEY; 
    const url = `https://www.alphavantage.co/query?function=SPLITS&symbol=${symbol}&apikey=${apiKey}`;

    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error('Failed to fetch data from Alpha Vantage');
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
    }
}