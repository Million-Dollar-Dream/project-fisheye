import { NextResponse } from "next/server";
import { ROLE_COOKIE, isRole } from "@/lib/role";

export async function POST(request: Request) {
  const formData = await request.formData();
  const role = formData.get("role");
  const next = formData.get("next");

  if (typeof role !== "string" || !isRole(role)) {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  }

  const destination = role === "worker" ? "/log" : typeof next === "string" && next ? next : "/";
  const response = NextResponse.redirect(new URL(destination, request.url));
  response.cookies.set(ROLE_COOKIE, role, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
  return response;
}
