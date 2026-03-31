import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const PROTECTED_PATHS = ["/desk"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isProtected = PROTECTED_PATHS.some((p) => pathname.startsWith(p));
  if (!isProtected) return NextResponse.next();

  const token = req.cookies.get("sunriseobx_token")?.value;
  if (!token) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  try {
    const { payload } = await jwtVerify(
      token,
      new TextEncoder().encode(secret)
    );

    if (payload.pending2fa) {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    const role = (payload.role as string) || "superadmin";
    const privileges = (payload.privileges as string[]) || [];

    // Role-based route protection
    if (pathname.startsWith("/desk/admin")) {
      if (role !== "admin" && role !== "superadmin") {
        return NextResponse.redirect(new URL("/desk", req.url));
      }
    }
    if (pathname.startsWith("/desk/trade")) {
      if (!privileges.includes("trade") && role !== "superadmin") {
        return NextResponse.redirect(new URL("/desk", req.url));
      }
    }
    if (pathname.startsWith("/desk/payroll")) {
      if (
        !privileges.includes("view_payroll") &&
        !privileges.includes("manage_payroll") &&
        role !== "superadmin"
      ) {
        return NextResponse.redirect(new URL("/desk", req.url));
      }
    }
    if (pathname.startsWith("/desk/invoices")) {
      if (
        !privileges.includes("view_invoices") &&
        !privileges.includes("manage_invoices") &&
        role !== "superadmin"
      ) {
        return NextResponse.redirect(new URL("/desk", req.url));
      }
    }

    return NextResponse.next();
  } catch {
    return NextResponse.redirect(new URL("/login", req.url));
  }
}

export const config = {
  matcher: ["/desk/:path*"],
};
