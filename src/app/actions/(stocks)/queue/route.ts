import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { db } from "@/lib/prisma";
import jwt from "jsonwebtoken";

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
      // Check for custom token or other NextAuth cookie variants
      const customToken = req.cookies.get('token')?.value;
      const nextAuthSessionToken = req.cookies.get('next-auth.session-token')?.value;
      const secureNextAuthSessionToken = req.cookies.get('__Secure-next-auth.session-token')?.value;
      
      if (customToken) {
        const secret = process.env.JWT_SECRET || 'default_secret';
        const decoded = jwt.verify(customToken, secret) as { email: string };
        token = { email: decoded.email };
      } else if (nextAuthSessionToken) {
        const secret = process.env.NEXTAUTH_SECRET || 'default_secret';
        const decoded = jwt.verify(nextAuthSessionToken, secret) as { email: string };
        token = { email: decoded.email };
      } else if (secureNextAuthSessionToken) {
        const secret = process.env.NEXTAUTH_SECRET || 'default_secret';
        const decoded = jwt.verify(secureNextAuthSessionToken, secret) as { email: string };
        token = { email: decoded.email };
      }
    }
    
    if (!token || !token.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    const user = await db.user.findUnique({
      where: { email: token.email as string },
    });
    
    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }
    
    const queuedOrders = await db.queuedOrder.findMany({
      where: {
        userId: user.id,
        status: "pending",
      },
      orderBy: {
        scheduledAt: "asc",
      },
    });
    
    return NextResponse.json(queuedOrders);
  } catch (error) {
    console.error("Error fetching queued orders:", error);
    return NextResponse.json(
      { error: "Failed to fetch queued orders" },
      { status: 500 }
    );
  }
}