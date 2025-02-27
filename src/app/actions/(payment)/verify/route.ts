// app/actions/verify/route.ts
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const { razorpay_payment_id, razorpay_order_id, razorpay_signature, transactionId } = await request.json();
    
    // Validate that all required fields are present
    if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature || !transactionId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Missing required payment verification parameters' 
      }, { status: 400 });
    }

    // Verify the payment signature
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
      .update(body.toString())
      .digest('hex');
    
    console.log('Body:', body);
    console.log('Expected Signature:', expectedSignature);
    console.log('Received Signature:', razorpay_signature);
    
    const isAuthentic = expectedSignature === razorpay_signature;
   
    if (!isAuthentic) {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid payment signature' 
      }, { status: 400 });
    }

    // Retrieve the transaction to make sure it exists and check its current status
    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId }
    });

    if (!transaction) {
      return NextResponse.json({ 
        success: false, 
        error: 'Transaction not found' 
      }, { status: 404 });
    }

    if (transaction.status === 'completed') {
      return NextResponse.json({ 
        success: true, 
        message: 'Payment already verified' 
      }, { status: 200 });
    }

    // Update the transaction with Razorpay payment details
    const updatedTransaction = await prisma.transaction.update({
      where: { id: transactionId },
      data: {
        razorpayPaymentId: razorpay_payment_id,
        status: 'completed',
      },
    });

    // Update the user's balance ONLY after successful verification
    await prisma.user.update({
      where: { id: updatedTransaction.userId },
      data: {
        balance: {
          increment: updatedTransaction.amount,
        },
      },
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Error verifying payment:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal Server Error' 
    }, { status: 500 });
  }
}