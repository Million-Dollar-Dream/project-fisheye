import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const pondId = Number((await params).id);
  if (Number.isNaN(pondId)) {
    return NextResponse.json({ error: "Invalid pond id" }, { status: 400 });
  }

  const inventory = await prisma.feedInventory.findMany({
    where: { pondId },
    orderBy: { id: "desc" },
  });
  return NextResponse.json(inventory);
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  const pondId = Number((await params).id);
  if (Number.isNaN(pondId)) {
    return NextResponse.json({ error: "Invalid pond id" }, { status: 400 });
  }

  const body = await request.json();
  const { packingSize, gunnyQuantity, totalWeightKg } = body;

  if (
    typeof packingSize !== "number" ||
    typeof gunnyQuantity !== "number" ||
    typeof totalWeightKg !== "number"
  ) {
    return NextResponse.json(
      {
        error:
          "packingSize (number), gunnyQuantity (number), and totalWeightKg (number) are required",
      },
      { status: 400 },
    );
  }

  const item = await prisma.feedInventory.create({
    data: { pondId, packingSize, gunnyQuantity, totalWeightKg },
  });
  return NextResponse.json(item, { status: 201 });
}
