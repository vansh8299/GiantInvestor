import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getToken } from "next-auth/jwt";
import jwt from 'jsonwebtoken';
const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    const { email, otp, type = 'registration', transactionDetails } = await req.json();

    // Validate required fields
    if (!email) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Skip token check for 'registration' and 'reset' types
    if (type !== 'registration' && type !== 'reset') {
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
      // Ensure email matches token
      if (email !== token.email) {
        return NextResponse.json(
          { error: 'Invalid email' },
          { status: 400 }
        );
      }
    }

    // Skip OTP record check for 'registration' and 'reset' types
    let otpRecord = null;
    if (type !== 'registration' && type !== 'reset') {
      // Find OTP record
      otpRecord = await prisma.otpVerification.findFirst({
        where: {
          email,
          otp,
          type,
          expiresAt: { gt: new Date() }
        }
      });

      // Validate OTP
      if (!otpRecord) {
        return NextResponse.json(
          { error: 'Invalid or expired OTP' },
          { status: 400 }
        );
      }
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Handle different verification types
    switch (type) {
      case 'reset':
        // Verify password reset
        if (!user.passwordResetRequested) {
          return NextResponse.json(
            { error: 'No password reset requested' },
            { status: 400 }
          );
        }

        // Update user for password reset
        await prisma.user.update({
          where: { email },
          data: {
            isVerified: true,
            passwordResetVerified: true,
            passwordResetRequested: false,
          },
        });
        break;

      case 'registration':
        // Verify email registration
        await prisma.user.update({
          where: { email },
          data: {
            isVerified: true,
            emailVerified: new Date(),
          },
        });
        break;

      case 'transaction':
        // Validate transaction details
        if (!transactionDetails) {
          return NextResponse.json(
            { error: 'Transaction details required' },
            { status: 400 }
          );
        }

        // Validate transaction metadata
        const metadata = otpRecord?.metadata 
          ? JSON.parse(otpRecord.metadata as string)
          : null;

        if (!metadata) {
          return NextResponse.json(
            { error: 'Invalid transaction context' },
            { status: 400 }
          );
        }

        // Compare transaction details with stored metadata
        const isValidTransaction = Object.keys(transactionDetails).every(
          key => metadata[key] === transactionDetails[key]
        );

        if (!isValidTransaction) {
          return NextResponse.json(
            { error: 'Transaction details do not match' },
            { status: 400 }
          );
        }

        // Mark user as transaction OTP verified
        await prisma.user.update({
          where: { email },
          data: { 
            transactionOtpVerified: true 
          },
        });
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid verification type' },
          { status: 400 }
        );
    }

    // Delete the used OTP record if it exists
    if (otpRecord) {
      await prisma.otpVerification.delete({
        where: { id: otpRecord.id }
      });
    }

    return NextResponse.json(
      {
        message: type === 'reset' 
          ? 'Password reset verification successful' 
          : type === 'transaction'
            ? 'Transaction OTP verified successfully'
            : 'Verification successful',
        verified: true,
        type: type
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Verify OTP error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}