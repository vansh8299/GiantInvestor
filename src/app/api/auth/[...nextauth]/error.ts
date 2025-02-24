// pages/api/auth/error.ts
import { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { error } = req.query;
  console.error('Authentication error:', error);

  res.status(200).json({
    message: 'Authentication failed',
    error: error || 'Unknown error',
  });
}