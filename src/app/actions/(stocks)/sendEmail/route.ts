// app/api/sendReferralEmail/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { sendEmail } from '@/lib/utils/sendEmail';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      return NextResponse.json(
        { message: 'Invalid email address' },
        { status: 400 }
      );
    }



    const subject = 'Invitation to join our Giant Investor Investing platform';
    const text = `
Hello,

Your friend has invited you to join our Giant Investor Investing platform!

Sign up today and receive ₹100 in your account to start investing.

Click the link below to get started:
http://localhost:3000/

Happy investing!
Giant Investor
    `;

    await sendEmail({ to: email, subject, text });

    return NextResponse.json(
      { message: 'Invitation sent successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error sending referral email:', error);
    
    return NextResponse.json(
      { message: 'Failed to send invitation' },
      { status: 500 }
    );
  }
}