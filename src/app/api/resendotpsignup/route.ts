import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import nodemailer from 'nodemailer';

const prisma = new PrismaClient();

const createTransporter = async () => {
  try {
    // Debug log environment variables (mask sensitive data)
    console.log('Email User:', process.env.EMAIL_USER ? 'Set' : 'Not Set');
    console.log('Email Pass:', process.env.EMAIL_PASS ? 'Set' : 'Not Set');

    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      throw new Error('Email configuration is missing. Please check EMAIL_USER and EMAIL_PASS environment variables.');
    }

    // Try creating transporter with alternative settings
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587, // Changed from 465 to 587 for TLS
      secure: false, // Changed from true to false for TLS
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      tls: {
        rejectUnauthorized: false, // Allow self-signed certificates
        ciphers: 'SSLv3'
      },
      debug: true,
      logger: true
    });

    // Test the connection with timeout
    try {
      const verify = await Promise.race([
        transporter.verify(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Connection timeout')), 5000)
        )
      ]);
      console.log('Transporter verification result:', verify);
      return transporter;
    } catch (verifyError) {
      console.error('Transporter verification failed:', verifyError);
      throw verifyError;
    }
  } catch (error) {
    console.error('Error creating transporter:', error);
    throw new Error(`Failed to create email transporter: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

export async function POST(req: NextRequest) {
  let transporter;
  
  try {
    transporter = await createTransporter();
    const { email } = await req.json();

    // Input validation
    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User with this email does not exist' },
        { status: 404 }
      );
    }

    // Generate new OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

    // Update user with new OTP
    await prisma.user.update({
      where: { email },
      data: {
        otp,
        otpExpiry,
      },
    });

    // Send email with new OTP
    await transporter.sendMail({
      from: {
        name: 'Giant Investor',
        address: process.env.EMAIL_USER as string
      },
      to: email,
      subject: 'Your New OTP',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>Giant Investor OTP Resend</h2>
          <p>Hello,</p>
          <p>Your new verification code is: <strong>${otp}</strong></p>
          <p>This code will expire in 10 minutes.</p>
          <p>If you didn't request this code, please ignore this email.</p>
        </div>
      `,
    });

    return NextResponse.json(
      { message: 'New OTP sent successfully' },
      { status: 200 }
    );

  } catch (error) {
    console.error('Resend OTP error:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error 
          ? error.message 
          : 'Internal server error during OTP resend'
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}