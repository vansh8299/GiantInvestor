/* eslint-disable @typescript-eslint/no-unused-vars */
import { db } from "@/lib/prisma";
import { CronJob } from "cron";

// Check if current time is within market hours (9:15 AM to 3:30 PM on weekdays)
export function isMarketOpen(): boolean {
  const now = new Date();
  const day = now.getDay(); // 0 is Sunday, 6 is Saturday
  const hours = now.getHours();
  const minutes = now.getMinutes();

  // Check if weekday (1-5)
  if (day >= 1 && day <= 5) {
    // Check if time is between 9:15 and 15:30
    if (
      (hours > 9 || (hours === 9 && minutes >= 15)) &&
      (hours < 15 || (hours === 15 && minutes <= 30))
    ) {
      return true;
    }
  }
  return false;
}

// Calculate next market open time (9:15 AM on next weekday)
export function getNextMarketOpenTime(): Date {
  const now = new Date();
  const nextOpen = new Date(now);
  
  // If today is a weekday and before 9:15 AM
  if (now.getDay() >= 1 && now.getDay() <= 5 && 
      (now.getHours() < 9 || (now.getHours() === 9 && now.getMinutes() < 15))) {
    nextOpen.setHours(9, 15, 0, 0);
    return nextOpen;
  }
  
  // Find next weekday
  let daysToAdd = 1;
  while (true) {
    nextOpen.setDate(nextOpen.getDate() + daysToAdd);
    if (nextOpen.getDay() >= 1 && nextOpen.getDay() <= 5) {
      nextOpen.setHours(9, 15, 0, 0);
      return nextOpen;
    }
    daysToAdd = 1; // Reset to 1 after first iteration
  }
}

// Process queued orders at market open
export async function processQueuedOrders() {
  const now = new Date();
  const orders = await db.queuedOrder.findMany({
    where: {
      status: "pending",
      scheduledAt: { lte: now },
    },
    include: { user: true },
  });

  console.log(`Processing ${orders.length} queued orders at ${now}`);

  for (const order of orders) {
    try {
      // Process the order
      await processOrder(order);
      
      await db.queuedOrder.update({
        where: { id: order.id },
        data: {
          status: "executed",
          executedAt: new Date(),
        },
      });
    } catch (error) {
      console.error(`Failed to process order ${order.id}:`, error);
      await db.queuedOrder.update({
        where: { id: order.id },
        data: { status: "failed" },
      });
    }
  }
}

// Helper function to process an order
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function processOrder(order: any) {
  try {
    const { userId, symbol, quantity, price, actionType } = order;
    const user = order.user;

    // Calculate total transaction amount
    const totalAmount = price * quantity;

    // Handle buy action
    if (actionType === "buy") {
      // Check if user has sufficient balance
      if (user.balance < totalAmount) {
        throw new Error("Insufficient balance");
      }

      // Start a transaction to ensure data consistency
      return await db.$transaction(async (tx) => {
        // Deduct amount from user balance
        const updatedUser = await tx.user.update({
          where: { id: userId },
          data: { balance: { decrement: totalAmount } },
        });

        // Find existing stock holding
        const existingStock = await tx.stock.findFirst({
          where: { 
            userId: userId,
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
              userId: userId,
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
            userId: userId,
            amount: totalAmount,
            type: "stock_purchase",
            status: "completed",
          },
        });

        // Create notification
        await tx.notification.create({
          data: {
            userId: userId,
            title: 'Queued Order Executed',
            message: `Your queued order to buy ${quantity} shares of ${symbol} has been executed at ₹${price.toFixed(2)}`,
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
    } 
    // Handle sell action
    else if (actionType === "sell") {
      // Start a transaction to ensure data consistency
      return await db.$transaction(async (tx) => {
        // Find existing stock holding
        const existingStock = await tx.stock.findFirst({
          where: { 
            userId: userId,
            symbol: symbol 
          },
        });

        if (!existingStock) {
          throw new Error("No shares available to sell");
        }

        if (existingStock.quantity < quantity) {
          throw new Error("Insufficient shares to sell");
        }

        // Add amount to user balance
        const updatedUser = await tx.user.update({
          where: { id: userId },
          data: { balance: { increment: totalAmount } },
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
              quantity: { decrement: quantity },
              currentPrice: price,
              updatedAt: new Date(),
            },
          });
        }

        // Record transaction
        await tx.transaction.create({
          data: {
            userId: userId,
            amount: totalAmount,
            type: "stock_sale",
            status: "completed",
          },
        });

        // Create notification
        await tx.notification.create({
          data: {
            userId: userId,
            title: 'Queued Order Executed',
            message: `Your queued order to sell ${quantity} shares of ${symbol} has been executed at ₹${price.toFixed(2)}`,
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
    } else {
      throw new Error("Invalid action type");
    }
  } catch (error) {
    console.error(`Error processing order ${order.id}:`, error);
    throw error;
  }
}

// Setup cron job to run every minute during market hours
const marketHoursJob = new CronJob(
  "*/1 9-15 * * 1-5", // Every minute from 9-15 (3 PM) on weekdays
  () => {
    if (isMarketOpen()) {
      processQueuedOrders();
    }
  },
  null,
  true,
  "Asia/Kolkata" // Indian timezone
);

// Setup cron job to process queued orders at market open
const marketOpenJob = new CronJob(
  "15 9 * * 1-5", // 9:15 AM on weekdays
  processQueuedOrders,
  null,
  true,
  "Asia/Kolkata"
);