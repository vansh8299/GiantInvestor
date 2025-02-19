import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
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
    console.log('Starting email transporter creation...');
    transporter = await createTransporter();
    console.log('Email transporter created successfully');

    const { firstName, lastName, email, password } = await req.json();

    // Input validation
    if (!firstName || !lastName || !email || !password) {
      return NextResponse.json(
        { error: 'Missing required fields' },
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

    // Check for existing user
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

    // Create user first
    const newUser = await prisma.user.create({
      data: {
        firstName,
        lastName,
        email,
        password: hashedPassword,
        otp,
        otpExpiry,
      },
    });

    // Send email with detailed error logging
    try {
      console.log('Attempting to send email...');
      const info = await transporter.sendMail({
        from: {
          name: 'Giant Investor',
          address: process.env.EMAIL_USER as string
        },
        to: email,
        subject: 'Verify your email',
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px;">
            <h2>Welcome to Giant Investor!</h2>
            <p>Hello ${firstName},</p>
            <p>Your verification code is: <strong>${otp}</strong></p>
            <p>This code will expire in 10 minutes.</p>
            <p>If you didn't request this code, please ignore this email.</p>
          </div>
        `,
      });
      console.log('Email sent successfully:', info.messageId);

    } catch (emailError) {
      console.error('Detailed email error:', emailError);
      
      // Clean up the created user
      await prisma.user.delete({
        where: { id: newUser.id }
      });

      throw emailError;
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...userWithoutPassword } = newUser;

    return NextResponse.json(
      {
        message: 'User created successfully. Please check your email to verify your account.',
        user: userWithoutPassword,
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error 
          ? error.message 
          : 'Internal server error during signup'
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}