import { NextRequest, NextResponse } from "next/server";
import { ROLE_COOKIE, isRole } from "@/lib/role";

const PUBLIC_PATHS = ["/select-role"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    PUBLIC_PATHS.includes(pathname) ||
    /\.[a-zA-Z0-9]+$/.test(pathname)
  ) {
    return NextResponse.next();
  }

  const role = request.cookies.get(ROLE_COOKIE)?.value;

  if (!isRole(role)) {
    const url = request.nextUrl.clone();
    url.pathname = "/select-role";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if (role === "worker" && pathname !== "/log") {
    const url = request.nextUrl.clone();
    url.pathname = "/log";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
