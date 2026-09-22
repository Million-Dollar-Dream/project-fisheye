import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const ponds = await prisma.pond.findMany({ orderBy: { id: "asc" } });
  return NextResponse.json(ponds);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { name, capacity } = body;

  if (typeof name !== "string" || !name.trim() || typeof capacity !== "number") {
    return NextResponse.json(
      { error: "name (string) and capacity (number) are required" },
      { status: 400 },
    );
  }

  const pond = await prisma.pond.create({ data: { name, capacity } });
  return NextResponse.json(pond, { status: 201 });
}
