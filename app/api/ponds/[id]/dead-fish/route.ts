import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const pondId = Number((await params).id);
  if (Number.isNaN(pondId)) {
    return NextResponse.json({ error: "Invalid pond id" }, { status: 400 });
  }

  const records = await prisma.deadFishRecord.findMany({
    where: { pondId },
    orderBy: { date: "desc" },
  });
  return NextResponse.json(records);
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  const pondId = Number((await params).id);
  if (Number.isNaN(pondId)) {
    return NextResponse.json({ error: "Invalid pond id" }, { status: 400 });
  }

  const body = await request.json();
  const { date, tailCount, avgWeight, kg } = body;

  if (
    !date ||
    typeof tailCount !== "number" ||
    typeof avgWeight !== "number" ||
    typeof kg !== "number"
  ) {
    return NextResponse.json(
      {
        error:
          "date (ISO string), tailCount (number), avgWeight (number), and kg (number) are required",
      },
      { status: 400 },
    );
  }

  const record = await prisma.deadFishRecord.create({
    data: { pondId, tailCount, avgWeight, kg, date: new Date(date) },
  });
  return NextResponse.json(record, { status: 201 });
}
