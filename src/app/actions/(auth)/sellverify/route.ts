import { NextRequest, NextResponse } from "next/server";
import { generateOTP } from "@/lib/utils/otp";
import { sendEmail } from "@/lib/utils/sendEmail";
// import { getToken } from "next-auth/jwt";
import { PrismaClient } from "@prisma/client";
// import jwt from 'jsonwebtoken';
const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    const { email, type = 'transaction', transactionDetails } = await req.json();

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
        metadata: metadata ?? undefined, // Ensure metadata is stored correctly
        expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes expiry
      }
    });

    // Send OTP via email
    await sendEmail({
      to: email,
      subject: 'Transaction Verification OTP',
      text: `Your OTP for transaction is: ${otp}. 
Transaction Details:
${Object.entries(transactionDetails || {})
  .map(([key, value]) => `${key}: ${value}`)
  .join('\n')}
This OTP will expire in 10 minutes.`
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