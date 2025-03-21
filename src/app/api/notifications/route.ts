// app/api/notifications/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { db } from "@/lib/prisma";
import jwt from 'jsonwebtoken';

export async function GET(req: NextRequest) {
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
    
    // If no token found, return unauthorized
    if (!token || !token.email) {
      return NextResponse.json(
        { error: "You must be logged in to view notifications" },
        { status: 401 }
      );
    }
    
    // Get user from database
    const user = await db.user.findUnique({
      where: { email: token.email as string },
    });
    
    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }
    
    // Get notifications from database
    const notifications = await db.notification.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
    });
    
    return NextResponse.json({ 
      success: true,
      notifications 
    });
    
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return NextResponse.json(
      { error: "Failed to fetch notifications" },
      { status: 500 }
    );
  }
}