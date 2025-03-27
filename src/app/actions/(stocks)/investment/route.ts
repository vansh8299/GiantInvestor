/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { db } from "@/lib/prisma";
import jwt from 'jsonwebtoken';
import { createClient } from "@supabase/supabase-js";
import { isMarketOpen, getNextMarketOpenTime } from "@/lib/services/orderService";

export async function POST(req: NextRequest) {
  try {
    let token;
       
    // Try to get the token from NextAuth
    const nextAuthToken = await getToken({ 
      req: req,
      secret: process.env.NEXTAUTH_SECRET
    });
       
    if (nextAuthToken) {
      token = nextAuthToken;
    } else {
      const customToken = req.cookies.get('token')?.value;
      if (customToken) {
        const secret = process.env.JWT_SECRET || 'default_secret';
        const decoded = jwt.verify(customToken, secret) as { email: string };
        token = { email: decoded.email };
      }
    }
       
    // If no token found, return unauthorized
    if (!token || !token.email) {
      return NextResponse.json(
        { error: "You must be logged in to send messages" },
        { status: 401 }
      );
    }
       
    const { symbol, quantity, price, actionType } = await req.json();

    // Validate required fields
    if (!symbol || !quantity || !price || !actionType) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Validate quantity is positive integer
    if (!Number.isInteger(quantity)) {
      return NextResponse.json(
        { error: "Quantity must be a whole number" },
        { status: 400 }
      );
    }

    if (quantity <= 0) {
      return NextResponse.json(
        { error: "Quantity must be greater than 0" },
        { status: 400 }
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

    // Check if market is open
    const marketOpen = isMarketOpen();

    if (!marketOpen) {
      // Queue the order for next market open
      const nextMarketOpen = getNextMarketOpenTime();
      
      const queuedOrder = await db.queuedOrder.create({
        data: {
          userId: user.id,
          symbol,
          quantity,
          price,
          actionType,
          scheduledAt: nextMarketOpen,
        },
      });

      // Create notification about queued order
      await db.notification.create({
        data: {
          userId: user.id,
          title: 'Order Queued',
          message: `Your ${actionType} order for ${quantity} shares of ${symbol} has been queued for execution at market open`,
          type: 'info',
          metadata: JSON.stringify({
            symbol,
            quantity,
            price,
            actionType,
            scheduledAt: nextMarketOpen
          }),
          read: false
        }
      });

      return NextResponse.json({
        success: true,
        message: "Order queued for next market open",
        data: queuedOrder,
      });
    }

    // Calculate total transaction amount
    const totalAmount = price * quantity;

    // Initialize Supabase client for notification
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Handle buy action
    if (actionType === "buy") {
      // Check if user has sufficient balance
      if (user.balance < totalAmount) {
        return NextResponse.json(
          { error: "Insufficient balance" },
          { status: 400 }
        );
      }

      // Start a transaction to ensure data consistency
      const result = await db.$transaction(async (tx: { user: { update: (arg0: { where: { id: any; }; data: { balance: number; }; }) => any; }; stock: { findFirst: (arg0: { where: { userId: any; symbol: any; }; }) => any; update: (arg0: { where: { id: any; }; data: { quantity: any; purchasePrice: number; currentPrice: any; updatedAt: Date; }; }) => any; create: (arg0: { data: { userId: any; symbol: any; quantity: any; purchasePrice: any; currentPrice: any; }; }) => any; }; transaction: { create: (arg0: { data: { userId: any; amount: number; type: string; status: string; }; }) => any; }; notification: { create: (arg0: { data: { userId: any; title: string; message: string; type: string; metadata: string; read: boolean; }; }) => any; }; }) => {
        // Deduct amount from user balance
        const updatedUser = await tx.user.update({
          where: { id: user.id },
          data: { balance: user.balance - totalAmount },
        });

        // Find existing stock holding
        const existingStock = await tx.stock.findFirst({
          where: { 
            userId: user.id,
            symbol: symbol 
          },
        });

        let stockResult;
        
        if (existingStock) {
          // Update existing stock holding
          const newQuantity = existingStock.quantity + quantity;
          const newAvgPrice = ((existingStock.quantity * existingStock.purchasePrice) + totalAmount) / newQuantity;
          
          stockResult = await tx.stock.update({
            where: { id: existingStock.id },
            data: {
              quantity: newQuantity,
              purchasePrice: newAvgPrice,
              currentPrice: price,
              updatedAt: new Date(),
            },
          });
        } else {
          // Create new stock holding
          stockResult = await tx.stock.create({
            data: {
              userId: user.id,
              symbol: symbol,
              quantity: quantity,
              purchasePrice: price,
              currentPrice: price,
            },
          });
        }

        // Record transaction
        await tx.transaction.create({
          data: {
            userId: user.id,
            amount: totalAmount,
            type: "stock_purchase",
            status: "completed",
          },
        });

        // Create a persistent notification in the database
        await tx.notification.create({
          data: {
            userId: user.id,
            title: 'Stock Purchase Successful',
            message: `You purchased ${quantity} shares of ${symbol} for $${totalAmount.toFixed(2)}`,
            type: 'success',
            metadata: JSON.stringify({
              symbol,
              quantity,
              amount: totalAmount
            }),
            read: false
          }
        });

        return {
          updatedUser,
          stockResult,
        };
      });

      // Send realtime notification via Supabase
      await supabase
        .channel(`notifications-${user.id}`)
        .send({
          type: 'broadcast',
          event: 'notification',
          payload: {
            title: 'Stock Purchase Successful',
            message: `You purchased ${quantity} shares of ${symbol} for $${totalAmount.toFixed(2)}`,
            data: {
              type: 'success',
              symbol,
              quantity,
              amount: totalAmount
            }
          }
        });

      return NextResponse.json({
        success: true,
        message: `Successfully purchased ${quantity} shares of ${symbol}`,
        data: result,
      });
    } 
    // Handle sell action
    else if (actionType === "sell") {
      // Find existing stock holding
      const existingStock = await db.stock.findFirst({
        where: { 
          userId: user.id,
          symbol: symbol 
        },
      });

      if (!existingStock) {
        return NextResponse.json(
          { error: "You don't own any shares of this stock" },
          { status: 400 }
        );
      }

      if (existingStock.quantity < quantity) {
        return NextResponse.json(
          { error: "You don't have enough shares to sell" },
          { status: 400 }
        );
      }

      // Start a transaction to ensure data consistency
      const result = await db.$transaction(async (tx: { user: { update: (arg0: { where: { id: any; }; data: { balance: any; }; }) => any; }; stock: { delete: (arg0: { where: { id: any; }; }) => any; update: (arg0: { where: { id: any; }; data: { quantity: number; currentPrice: any; updatedAt: Date; }; }) => any; }; transaction: { create: (arg0: { data: { userId: any; amount: number; type: string; status: string; }; }) => any; }; notification: { create: (arg0: { data: { userId: any; title: string; message: string; type: string; metadata: string; read: boolean; }; }) => any; }; }) => {
        // Add amount to user balance
        const updatedUser = await tx.user.update({
          where: { id: user.id },
          data: { balance: user.balance + totalAmount },
        });

        let stockResult;
        
        if (existingStock.quantity === quantity) {
          // Delete stock entry if selling all shares
          stockResult = await tx.stock.delete({
            where: { id: existingStock.id },
          });
        } else {
          // Update stock quantity
          stockResult = await tx.stock.update({
            where: { id: existingStock.id },
            data: {
              quantity: existingStock.quantity - quantity,
              currentPrice: price,
              updatedAt: new Date(),
            },
          });
        }

        // Record transaction
        await tx.transaction.create({
          data: {
            userId: user.id,
            amount: totalAmount,
            type: "stock_sale",
            status: "completed",
          },
        });

        // Create a persistent notification in the database
        await tx.notification.create({
          data: {
            userId: user.id,
            title: 'Stock Sale Successful',
            message: `You sold ${quantity} shares of ${symbol} for $${totalAmount.toFixed(2)}`,
            type: 'success',
            metadata: JSON.stringify({
              symbol,
              quantity,
              amount: totalAmount
            }),
            read: false
          }
        });

        return {
          updatedUser,
          stockResult,
        };
      });

      // Send realtime notification via Supabase
      await supabase
        .channel(`notifications-${user.id}`)
        .send({
          type: 'broadcast',
          event: 'notification',
          payload: {
            title: 'Stock Sale Successful',
            message: `You sold ${quantity} shares of ${symbol} for $${totalAmount.toFixed(2)}`,
            data: {
              type: 'success',
              symbol,
              quantity,
              amount: totalAmount
            }
          }
        });

      return NextResponse.json({
        success: true,
        message: `Successfully sold ${quantity} shares of ${symbol}`,
        data: result,
      });
    } else {
      return NextResponse.json(
        { error: "Invalid action type" },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Stock transaction error:", error);
    return NextResponse.json(
      { error: "Failed to process transaction" },
      { status: 500 }
    );
  }
}