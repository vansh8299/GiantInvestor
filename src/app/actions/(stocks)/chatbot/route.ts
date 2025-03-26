import { NextRequest, NextResponse } from 'next/server';
import { getToken } from "next-auth/jwt";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

// Helper function to delete expired messages
async function cleanupExpiredMessages() {
  await prisma.chatMessage.deleteMany({
    where: {
      expiresAt: {
        lte: new Date()
      }
    }
  });
}

export async function POST(req: NextRequest) {
  try {
    let token;
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

    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    if (!GEMINI_API_KEY) {
      return NextResponse.json(
        { error: 'API key is not configured' }, 
        { status: 500 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: token.email as string },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const { message } = await req.json();

    // Save user message (expiresAt will be automatically set by DB)
    await prisma.chatMessage.create({
      data: {
        userId: user.id,
        text: message,
        sender: 'user'
      }
    });

    const enhancedPrompt = `You are a professional stock market assistant...`; // Your existing prompt

    const result = await model.generateContent(enhancedPrompt);
    const botResponse = result.response.text();

    // Save bot message
    await prisma.chatMessage.create({
      data: {
        userId: user.id,
        text: botResponse,
        sender: 'bot'
      }
    });

    return NextResponse.json({ text: botResponse });
  } catch (error) {
    console.error('Error in stock market chat:', error);
    return NextResponse.json(
      { error: 'Failed to process your stock market query' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    let token;
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
        { error: "You must be logged in to view messages" },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: token.email as string },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Clean up expired messages first
    await cleanupExpiredMessages();

    // Fetch non-expired messages
    const messages = await prisma.chatMessage.findMany({
      where: { 
        userId: user.id,
        expiresAt: {
          gt: new Date() // Only messages that haven't expired
        }
      },
      orderBy: { createdAt: 'asc' }
    });

    return NextResponse.json(messages);
  } catch (error) {
    console.error('Error fetching chat history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch chat history' },
      { status: 500 }
    );
  }
}