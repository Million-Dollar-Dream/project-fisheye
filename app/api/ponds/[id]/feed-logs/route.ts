import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const pondId = Number((await params).id);
  if (Number.isNaN(pondId)) {
    return NextResponse.json({ error: "Invalid pond id" }, { status: 400 });
  }

  const feedLogs = await prisma.feedLog.findMany({
    where: { pondId },
    include: { feedType: true },
    orderBy: { date: "desc" },
  });
  return NextResponse.json(feedLogs);
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  const pondId = Number((await params).id);
  if (Number.isNaN(pondId)) {
    return NextResponse.json({ error: "Invalid pond id" }, { status: 400 });
  }

  const body = await request.json();
  const { date, feedTypeId, quantity } = body;

  if (!date || typeof feedTypeId !== "number" || typeof quantity !== "number") {
    return NextResponse.json(
      { error: "date (ISO string), feedTypeId (number), and quantity (number) are required" },
      { status: 400 },
    );
  }

  const feedLog = await prisma.feedLog.create({
    data: { pondId, feedTypeId, quantity, date: new Date(date) },
    include: { feedType: true },
  });
  return NextResponse.json(feedLog, { status: 201 });
}
