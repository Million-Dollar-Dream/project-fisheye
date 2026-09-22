import { NextRequest, NextResponse } from "next/server";
import { getPondSummary } from "@/lib/pondSummary";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const pondId = Number((await params).id);
  if (Number.isNaN(pondId)) {
    return NextResponse.json({ error: "Invalid pond id" }, { status: 400 });
  }

  const summary = await getPondSummary(pondId);
  return NextResponse.json(summary);
}
