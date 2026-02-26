import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(req: NextRequest) {
  const isAdmin = req.nextUrl.pathname.startsWith("/admin")
  const isLogin = req.nextUrl.pathname === "/admin/login"

  if (!isAdmin || isLogin) return NextResponse.next()

  const auth = req.cookies.get("admin-auth")?.value
  if (auth !== "true") {
    return NextResponse.redirect(new URL("/admin/login", req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/admin/:path*"],
}
