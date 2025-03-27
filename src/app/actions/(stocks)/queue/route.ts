import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { db } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const token = await getToken({ 
      req: req,
      secret: process.env.NEXTAUTH_SECRET
    });
       
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