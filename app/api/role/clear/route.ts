import { NextResponse } from "next/server";
import { ROLE_COOKIE } from "@/lib/role";

export async function POST(request: Request) {
  const response = NextResponse.redirect(new URL("/select-role", request.url));
  response.cookies.delete(ROLE_COOKIE);
  return response;
}
