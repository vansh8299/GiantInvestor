import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const { userId, amount, type, status, razorpayPaymentId, razorpayOrderId } = req.body;

    try {
      const transaction = await prisma.transaction.create({
        data: {
          userId,
          amount,
          type,
          status,
          razorpayPaymentId,
          razorpayOrderId,
        },
      });

      // Update user balance
      await prisma.user.update({
        where: { id: userId },
        data: {
          balance: {
            increment: amount,
          },
        },
      });

      res.status(200).json({ success: true, transaction });
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      res.status(500).json({ error: 'Error saving transaction' });
    }
  } else {
    res.setHeader('Allow', 'POST');
    res.status(405).end('Method Not Allowed');
  }
}