import { NextResponse, NextRequest } from "next/server";

// ✅ Route ที่ต้อง login
const PROTECTED = [
  "/generator",
  "/my-catalog",      // ✅ เก็บ
  "/dashboard",      // ✅ เก็บ
  "/admin",          // ✅ เก็บ
];

// ✅ Route ที่ปล่อยผ่าน (ไม่ต้อง login)
const AUTH_FREE = [
  "/",
  "/login",
  "/register",
  "/api/auth",
  "/api/login",
  "/api/logout",
  "/api/register",
  "/favicon.ico",
  "/_next",
  "/globals.css",
];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  console.log(`[middleware] 🔍 ${req.method} ${pathname}`);

  // ✅ ปล่อยผ่าน static files และ API ที่เป็น public
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/auth") ||
    pathname === "/favicon.ico" ||
    pathname.endsWith(".png") ||
    pathname.endsWith(".jpg") ||
    pathname.endsWith(".css") ||
    pathname.endsWith(".js")
  ) {
    return NextResponse.next();
  }

  // ✅ ปล่อยผ่าน public pages
  if (AUTH_FREE.includes(pathname)) {
    console.log(`[middleware] ✅ Public page: ${pathname}`);
    return NextResponse.next();
  }

  // ✅ ตรวจสอบ cookie
  const session = req.cookies.get("session_token")?.value;

  // ✅ ถ้าเป็น protected route แต่ไม่มี session ให้ redirect ไป login
  if (PROTECTED.some((p) => pathname.startsWith(p))) {
    if (!session) {
      console.log(`[middleware] 🔴 Redirecting to login: ${pathname}`);
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(loginUrl);
    }
    console.log(`[middleware] ✅ Authorized: ${pathname}`);
    return NextResponse.next();
  }

  // ✅ Route อื่น ๆ ปล่อยผ่าน
  return NextResponse.next();
}

export const config = {
  matcher: [
    // ✅ Match ทุก route ยกเว้น static files
    "/((?!_next/static|_next/image|favicon.ico|.*\\.png|.*\\.jpg|.*\\.css|.*\\.js).*)",
  ],
};
