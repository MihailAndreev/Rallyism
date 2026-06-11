import { jwtVerify } from "jose";
import { NextRequest, NextResponse } from "next/server";

const publicRoutes = new Set(["/", "/about", "/login", "/register"]);
const sessionCookieName = "rallyism_session";

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error("JWT_SECRET is required for route protection.");
  }

  return new TextEncoder().encode(secret);
}

function isPublicRoute(pathname: string) {
  return publicRoutes.has(pathname) || pathname.startsWith("/rally-events/");
}

function getSafeTargetPath(request: NextRequest) {
  const target = `${request.nextUrl.pathname}${request.nextUrl.search}`;

  if (!target.startsWith("/") || target.startsWith("//")) {
    return "/dashboard";
  }

  return target;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isPublicRoute(pathname)) {
    return NextResponse.next();
  }

  const token = request.cookies.get(sessionCookieName)?.value;

  if (token) {
    try {
      await jwtVerify(token, getJwtSecret());
      return NextResponse.next();
    } catch {
      const response = NextResponse.redirect(new URL("/login", request.url));
      response.cookies.delete(sessionCookieName);
      return response;
    }
  }

  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("from", getSafeTargetPath(request));

  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|images|.*\\..*).*)"],
};
