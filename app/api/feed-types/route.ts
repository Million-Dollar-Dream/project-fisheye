import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const feedTypes = await prisma.feedType.findMany({ orderBy: { code: "asc" } });
  return NextResponse.json(feedTypes);
}
