import { NextRequest, NextResponse } from 'next/server';
import { getToken } from "next-auth/jwt";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { PrismaClient } from '@prisma/client';

export async function POST(req: NextRequest) {
  const prisma = new PrismaClient()
    // Get the token from the session
    const token = await getToken({ 
      req: req,
      secret: process.env.NEXTAUTH_SECRET
    });

    // If no token found, return unauthorized
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
  
    try {
      // Find the user in the database
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
  
      // Save user message
      await prisma.chatMessage.create({
        data: {
          userId: user.id,
          text: message,
          sender: 'user'
        }
      });
  
      // Prepend a system prompt to constrain the AI's responses
      const enhancedPrompt = `You are a professional stock market assistant. 
      Provide clear, concise, and accurate financial information. 
      If asked about specific stocks, provide general market insights.
      Do not give specific buy/sell recommendations. 
      Respond professionally to the following query: ${message}`;
  
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
  const prisma = new PrismaClient()
    // Get the token from the session
    const token = await getToken({ 
      req: req,
      secret: process.env.NEXTAUTH_SECRET
    });

    // If no token found, return unauthorized
    if (!token || !token.email) {
      return NextResponse.json(
        { error: "You must be logged in to view messages" },
        { status: 401 }
      );
    }

    try {
      // Find the user in the database
      const user = await prisma.user.findUnique({
        where: { email: token.email as string },
      });

      if (!user) {
        return NextResponse.json(
          { error: "User not found" },
          { status: 404 }
        );
      }

      // Fetch chat messages for the user
      const messages = await prisma.chatMessage.findMany({
        where: { userId: user.id },
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