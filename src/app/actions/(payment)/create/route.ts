// app/actions/create/route.ts
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import Razorpay from 'razorpay';

const prisma = new PrismaClient();
const razorpay = new Razorpay({
  key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

export async function POST(request: Request) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { userId, amount, type, status } = await request.json();

    // Create Razorpay order
    const orderOptions = {
      amount: amount * 100, // amount in smallest currency unit (paise for INR)
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
    };

    const order = await razorpay.orders.create(orderOptions);

    // Save transaction to the database with pending status
    const transaction = await prisma.transaction.create({
      data: {
        userId,
        amount,
        type,
        status: 'pending', // Always start with pending
        razorpayOrderId: order.id, // Store the Razorpay order ID
      },
    });

    return NextResponse.json({ 
      success: true, 
      transaction, 
      orderId: order.id,
      amount: order.amount
    }, { status: 200 });
  } catch (error) {
    console.error('Error creating transaction:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}