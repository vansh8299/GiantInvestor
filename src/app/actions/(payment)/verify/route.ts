// app/actions/verify/route.ts
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import { createClient } from "@supabase/supabase-js";

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
      where: { id: transactionId },
      include: { user: true } // Include user details for notification
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
      include: { user: true }
    });

    // Update the user's balance ONLY after successful verification
    const updatedUser = await prisma.user.update({
      where: { id: updatedTransaction.userId },
      data: {
        balance: {
          increment: updatedTransaction.amount,
        },
      },
    });

    // Create a persistent notification in the database
    await prisma.notification.create({
      data: {
        userId: updatedTransaction.userId,
        title: 'Payment Successful',
        message: `Your payment of ₹${updatedTransaction.amount.toFixed(2)} was successful. Your new balance is ₹${updatedUser.balance.toFixed(2)}`,
        type: 'success',
        metadata: JSON.stringify({
          amount: updatedTransaction.amount,
          newBalance: updatedUser.balance
        }),
        read: false
      }
    });

    // Initialize Supabase client for realtime notification
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Send realtime notification via Supabase
    await supabase
      .channel(`notifications-${updatedTransaction.userId}`)
      .send({
        type: 'broadcast',
        event: 'notification',
        payload: {
          title: 'Payment Successful',
          message: `Your payment of ₹${updatedTransaction.amount.toFixed(2)} was successful. Your new balance is ₹${updatedUser.balance.toFixed(2)}`,
          data: {
            type: 'success',
            amount: updatedTransaction.amount,
            newBalance: updatedUser.balance
          }
        }
      });

    // Also send to general channel if needed
    await supabase
      .channel('notifications-general')
      .send({
        type: 'broadcast',
        event: 'notification',
        payload: {
          title: 'Payment Successful',
          message: `A payment of ₹${updatedTransaction.amount.toFixed(2)} was processed`,
          data: {
            type: 'info'
          }
        }
      });

    return NextResponse.json({ 
      success: true,
      message: `Payment of ₹${updatedTransaction.amount.toFixed(2)} verified successfully`,
      newBalance: updatedUser.balance
    }, { status: 200 });
  } catch (error) {
    console.error('Error verifying payment:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal Server Error' 
    }, { status: 500 });
  }
}