import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    const { email, otp, mode } = await req.json();

    // Validate required fields
    if (!email || !otp) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
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

    // Validate OTP
    if (!user.otp || user.otp !== otp) {
      return NextResponse.json(
        { error: 'Invalid OTP' },
        { status: 400 }
      );
    }

    // Check OTP expiration
    if (!user.otpExpiry || new Date() > user.otpExpiry) {
      return NextResponse.json(
        { error: 'OTP has expired' },
        { status: 400 }
      );
    }

    // Handle password reset mode
    if (mode === 'reset') {
      if (!user.passwordResetRequested) {
        return NextResponse.json(
          { error: 'No password reset requested' },
          { status: 400 }
        );
      }

      // Update user for password reset verification
      await prisma.user.update({
        where: { email },
        data: {
          isVerified: true,
          passwordResetVerified: true,
          otp: null,
          otpExpiry: null,
        },
      });

      return NextResponse.json(
        {
          message: 'Password reset verification successful',
          verified: true,
          mode: 'reset'
        },
        { status: 200 }
      );
    }

    // Handle registration verification (default mode)
    await prisma.user.update({
      where: { email },
      data: {
        isVerified: true,
        emailVerified: new Date(),
        otp: null,
        otpExpiry: null,
      },
    });

    return NextResponse.json(
      {
        message: 'Email verified successfully',
        verified: true,
        mode: 'registration'
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