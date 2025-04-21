/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const { userId, amount, type, status, razorpayPaymentId, razorpayOrderId } = await request.json();

    const transaction = await prisma.transaction.create({
      data: {
        userId,
        amount,
        type,
        status,
        razorpayPaymentId,
        razorpayOrderId,
      },
    });

    // Update user balance
    await prisma.user.update({
      where: { id: userId },
      data: {
        balance: {
          increment: amount,
        },
      },
    });

    return NextResponse.json({ success: true, transaction }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'Error saving transaction' }, { status: 500 });
  }
}