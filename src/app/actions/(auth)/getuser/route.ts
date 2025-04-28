import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/prisma';
import { getToken } from 'next-auth/jwt';
import jwt from 'jsonwebtoken';

export async function GET(request: NextRequest) {
  try {
    let token;
    
    // Try to get the token from NextAuth
    const nextAuthToken = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET
    });
    
    if (nextAuthToken) {
      token = nextAuthToken;
    } else {
      // Check for custom token or other NextAuth cookie variants
      const customToken = request.cookies.get('token')?.value;
      const nextAuthSessionToken = request.cookies.get('next-auth.session-token')?.value;
      const secureNextAuthSessionToken = request.cookies.get('__Secure-next-auth.session-token')?.value;
      
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
    
    if (!token?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const user = await db.user.findUnique({
      where: {
        email: token.email
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        emailVerified: true,
        isVerified: true,
        balance: true,
        createdAt: true,
        updatedAt: true,
        image: true,
        // Exclude sensitive fields like password, otp, etc.
      }
    });
    
    // If user not found, return not found
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    // Return the user details
    return NextResponse.json({ user }, { status: 200 });
  } catch (error) {
    console.error('Error fetching user details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user details' },
      { status: 500 }
    );
  }
}