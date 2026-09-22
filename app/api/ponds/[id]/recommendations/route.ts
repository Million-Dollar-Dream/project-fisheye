import { NextRequest, NextResponse } from "next/server";

type RouteParams = { params: Promise<{ id: string }> };

// Phase 2 stub: predictive feed recommendations based on historical data.
// Not implemented yet - this route reserves the shape of the future response
// so the UI has something stable to call.
export async function GET(_request: NextRequest, { params }: RouteParams) {
  const pondId = Number((await params).id);
  if (Number.isNaN(pondId)) {
    return NextResponse.json({ error: "Invalid pond id" }, { status: 400 });
  }

  return NextResponse.json(
    {
      pondId,
      status: "not_implemented",
      message:
        "AI-driven feed recommendations are planned for a future phase and are not yet available.",
      recommendations: [],
    },
    { status: 200 },
  );
}
