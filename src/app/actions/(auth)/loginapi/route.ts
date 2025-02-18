

import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

export async function POST(request: { json: () => PromiseLike<{ email: string; password: string; }> | { email: string; password: string; }; }) {

  try {
    const { email, password } = await request.json();

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const secret = process.env.JWT_SECRET || 'default_secret'; // Ensure a default fallback

    const token = jwt.sign({ id: user.id, email: user.email }, secret, { expiresIn: '1d' });

    const response = NextResponse.json({ message: 'Login successful' }, );
    console.log('token', token);
    response.cookies.set('token', token, { maxAge: 86400, path: '/' });
    return response;
  } catch (error) {
    return NextResponse.json({ error}, { status: 500 });
  }
}
