import { NextRequest, NextResponse } from "next/server";
import { generateOTP } from "@/lib/utils/otp";
import { sendEmail } from "@/lib/utils/sendEmail";
import { getToken } from "next-auth/jwt";
import { PrismaClient } from "@prisma/client";
import jwt from 'jsonwebtoken';
const prisma = new PrismaClient();

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

    if (!token || !token.email) {
      return NextResponse.json(
        { error: "You must be logged in to send messages" },
        { status: 401 }
      );
    }

    const { 
      email, 
      type = 'registration', 
      transactionDetails 
    } = await req.json();

    console.log(email)
    console.log(token.email)

    if (email !== token.email) {
      return NextResponse.json(
        { error: "Invalid email" },
        { status: 400 }
      );
    }

    // Generate OTP
    const otp = generateOTP();

    // Prepare metadata for transaction-specific OTP
    const metadata = type === 'transaction' 
      ? JSON.stringify(transactionDetails)
      : null;

    // Delete any existing OTP for this email and type
    await prisma.otpVerification.deleteMany({
      where: { 
        email: email,
        type: type
      }
    });

    // Store OTP in database with expiration
    await prisma.otpVerification.create({
      data: {
        email: email,
        otp: otp,
        type: type,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        metadata: metadata as any,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes expiry
      }
    });

    // Prepare email subject and text based on type
    let subject = 'Verification OTP';
    let text = `Your OTP is: ${otp}. This OTP will expire in 10 minutes.`;

    switch (type) {
      case 'registration':
        subject = 'Email Verification OTP';
        break;
      case 'reset':
        subject = 'Password Reset OTP';
        break;
      case 'transaction':
        subject = 'Transaction Verification OTP';
        text = `Your OTP for transaction is: ${otp}. 
Transaction Details:
${Object.entries(transactionDetails || {})
  .map(([key, value]) => `${key}: ${value}`)
  .join('\n')}
This OTP will expire in 10 minutes.`;
        break;
    }

    // Send OTP via email
    await sendEmail({
      to: email,
      subject: subject,
      text: text
    });

    return NextResponse.json({ 
      message: 'OTP sent successfully',
      type: type 
    }, { status: 200 });
  } catch (error) {
    console.error('OTP generation error:', error);
    return NextResponse.json(
      { error: "Failed to send OTP" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}