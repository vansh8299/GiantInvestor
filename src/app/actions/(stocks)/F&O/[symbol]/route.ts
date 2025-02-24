// app/api/historical-options/route.ts
import { NextResponse } from 'next/server';

type OptionContract = {
  contractID: string;
  symbol: string;
  expiration: string;
  strike: string;
  type: string;
  last: string;
  mark: string;
  bid: string;
  bid_size: string;
  ask: string;
  ask_size: string;
  volume: string;
  open_interest: string;
  date: string;
  implied_volatility: string;
  delta: string;
  gamma: string;
  theta: string;
  vega: string;
  rho: string;
};

export async function GET(request: Request, { params }: { params: { symbol: string } }) {
    const { symbol } =await params;

  try {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const API_KEY = process.env.ALPHA_VANTAGE_API_KEY;
    
    const response = await fetch(
      `https://www.alphavantage.co/query?function=HISTORICAL_OPTIONS&symbol=${symbol}&apikey=demo`
    );

    if (!response.ok) {
      throw new Error(`Alpha Vantage API error: ${response.status}`);
    }

    const data = await response.json();

    // Add error handling for API response format
    if (data.error) {
      return NextResponse.json(
        { error: 'Alpha Vantage API error', message: data.error },
        { status: 400 }
      );
    }

    // Transform and validate the data
    const options: OptionContract[] = data.data?.map((option: OptionContract) => ({
      contractID: option.contractID,
      symbol: option.symbol,
      expiration: option.expiration,
      strike: option.strike,
      type: option.type,
      last: option.last,
      mark: option.mark,
      bid: option.bid,
      bid_size: option.bid_size,
      ask: option.ask,
      ask_size: option.ask_size,
      volume: option.volume,
      open_interest: option.open_interest,
      date: option.date,
      implied_volatility: option.implied_volatility,
      delta: option.delta,
      gamma: option.gamma,
      theta: option.theta,
      vega: option.vega,
      rho: option.rho,
    }));

    return NextResponse.json({ 
      success: true, 
      data: options 
    });

  } catch (error) {
    console.error('Error fetching historical options:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch historical options data' 
      },
      { status: 500 }
    );
  }
}