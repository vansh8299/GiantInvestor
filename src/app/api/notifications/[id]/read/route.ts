// app/api/notifications/[id]/read/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { db } from "@/lib/prisma";
import jwt from 'jsonwebtoken';

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
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
        { error: "You must be logged in to update notifications" },
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
    
    // Find the notification
    const notification = await db.notification.findUnique({
      where: { id },
    });
    
    if (!notification) {
      return NextResponse.json(
        { error: "Notification not found" },
        { status: 404 }
      );
    }
    
    // Check if the notification belongs to the user
    if (notification.userId !== user.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403 }
      );
    }
    
    // Update the notification
    const updatedNotification = await db.notification.update({
      where: { id },
      data: { read: true },
    });
    
    return NextResponse.json({ 
      success: true,
      notification: updatedNotification
    });
    
  } catch (error) {
    console.error("Error updating notification:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}