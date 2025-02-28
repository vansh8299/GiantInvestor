// app/api/user/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/prisma';
import { getToken } from 'next-auth/jwt';

export async function GET(request: NextRequest) {
  try {
    // Get the token from the session
    const token = await getToken({ 
      req: request,
      secret: process.env.NEXTAUTH_SECRET
    });

    // If no token found, return unauthorized
    

    // Find the user by id
    const user = await db.user.findUnique({
      where: {
        email: token?.email as string
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