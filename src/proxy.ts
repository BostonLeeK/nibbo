import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export const proxy = auth((req) => {
  const isLoggedIn = !!req.auth;
  const publicPaths = new Set(["/login"]);
  const isPublicPage = publicPaths.has(req.nextUrl.pathname);
  const isApiAuth = req.nextUrl.pathname.startsWith("/api/auth");
  const isPublicModelAsset = req.nextUrl.pathname.startsWith("/models/");

  if (isApiAuth || isPublicModelAsset) return NextResponse.next();

  if (!isLoggedIn && !isPublicPage) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  if (isLoggedIn && req.nextUrl.pathname === "/login") {
    return NextResponse.redirect(new URL("/", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|.*\\..*).*)",
  ],
};
