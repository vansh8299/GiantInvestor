// app/api/stocks/user/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { db } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    // Get the token from the session
    const token = await getToken({ 
      req: req,
      secret: process.env.NEXTAUTH_SECRET
    });

    // If no token found, return unauthorized
    if (!token || !token.email) {
      return NextResponse.json(
        { error: "You must be logged in to access this information" },
        { status: 401 }
      );
    }

    // Get user from database
    const user = await db.user.findUnique({
      where: { email: token.email as string },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Fetch all stocks for the user
    const stocks = await db.stock.findMany({
      where: { userId: user.id },
      orderBy: { purchasedAt: 'desc' }, // Most recent purchases first
    });

    // Calculate portfolio statistics
    const totalInvestment = stocks.reduce((sum, stock) => {
      return sum + (stock.purchasePrice * stock.quantity);
    }, 0);

    const currentValue = stocks.reduce((sum, stock) => {
      return sum + (stock.currentPrice * stock.quantity);
    }, 0);

    const profitLoss = currentValue - totalInvestment;
    const profitLossPercentage = totalInvestment > 0 
      ? (profitLoss / totalInvestment) * 100 
      : 0;

    return NextResponse.json({
      success: true,
      data: {
        stocks,
        portfolioStats: {
          totalInvestment,
          currentValue,
          profitLoss,
          profitLossPercentage: parseFloat(profitLossPercentage.toFixed(2)),
          stockCount: stocks.length
        }
      }
    }, { status: 200 });
  } catch (error) {
    console.error("Error fetching user stocks:", error);
    return NextResponse.json(
      { error: "Failed to fetch stocks" },
      { status: 500 }
    );
  }
}