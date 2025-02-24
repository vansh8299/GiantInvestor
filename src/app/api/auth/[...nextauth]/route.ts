import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
    token: string;
  }
}

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  pages: {
    signIn: '/pages/login',
    error: '/pages/auth/error',
  },
  callbacks: {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async signIn({ user, account, profile }) {
      if (account?.provider === 'google') {
        const { name, email } = user;

        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
          where: { email: email as string },
        });

        if (!existingUser) {
          // Create new user if not exists
          await prisma.user.create({
            data: {
              firstName: name?.split(' ')[0] || '',
              lastName: name?.split(' ')[1] || '',
              email: email as string,
              password: '', // No password for Google users
              isVerified: true,
            
            },
          });
        }
      }
      return true;
    },
    async session({ session, token }) {
      // Add token to session
      session.token = token.jwt as string;
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        // Generate JWT token
        const secret = process.env.JWT_SECRET || 'default_secret';
        token.jwt = jwt.sign({ id: user.id, email: user.email }, secret, { expiresIn: '1d' });
      }
      return token;
    },
    async redirect({ url, baseUrl }) {
      if (url.startsWith('/')) return `${baseUrl}${url}`;
      else if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    },
  },
});

export { handler as GET, handler as POST };