// middleware.ts
import { NextResponse, NextRequest } from "next/server";

const PROTECTED = ["/generator", "/api/generate"]; // ต้องล็อกอินเท่านั้น
const AUTH_FREE = [
  "/login",
  "/api/login",
  "/api/logout",
  "/api/register",
  "/favicon.ico",
  "/_next",
];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // ปล่อยผ่านเส้นทาง auth / ระบบ
  if (AUTH_FREE.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // เช็คเฉพาะ path ที่ต้องล็อกอิน
  const needsAuth = PROTECTED.some((p) => pathname.startsWith(p));
  if (!needsAuth) return NextResponse.next();

  const session = req.cookies.get("session")?.value;
  if (!session) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }
  return NextResponse.next();
}

export const config = { matcher: ["/:path*"] };
