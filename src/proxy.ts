import { NextRequest, NextResponse } from "next/server"

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (pathname === "/") {
    return NextResponse.redirect(new URL("/pos", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
