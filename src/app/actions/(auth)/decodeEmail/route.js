// File: app/api/verify-token/route.js or pages/api/verify-token.js (depending on your Next.js version)

import { NextResponse } from 'next/server'; // For App Router
// OR 
// import { NextApiRequest, NextApiResponse } from 'next'; // For Pages Router

import jwt from 'jsonwebtoken';

// For App Router (Next.js 13+)
export async function GET(request) {
  try {
    // Get the token from cookies
    const cookies = request.cookies;
    const token = cookies.get('token')?.value;
    
    if (!token) {
      return NextResponse.json({ error: 'No token found' }, { status: 401 });
    }
    
    // Verify the token
    const secret = process.env.JWT_SECRET || 'default_secret';
    const decoded = jwt.verify(token, secret);
    
    // Return the email from the decoded token
    if (typeof decoded === 'string') {
      return NextResponse.json({ error: 'Invalid token payload' }, { status: 401 });
    }
    return NextResponse.json({ email: decoded.email }, { status: 200 });
  } catch (error) {
    console.error('Error verifying token:', error);
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }
}