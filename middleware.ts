// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { Permission, Role } from "@prisma/client";

// --------------------------------------------------
// Helper functions
// --------------------------------------------------
function isPublicRoute(path: string): boolean {
  const PUBLIC = ["/about", "/contact"];
  return PUBLIC.some((route) => path === route || path.startsWith(route + "/"));
}

function isAuthRoute(path: string): boolean {
  const AUTH_ROUTES = ["/auth/signin"];
  return AUTH_ROUTES.some(
    (route) => path === route || path.startsWith(route + "/")
  );
}

function hasPermission(token: any, requiredPermissions: string[]): boolean {
  if (token.role === Role.ADMIN) return true;
  if (!token?.permissions) return false;
  return requiredPermissions.every((perm) => token.permissions.includes(perm));
}

// --------------------------------------------------
// Unified route configuration
// --------------------------------------------------
interface RouteConfig {
  roles?: Role[];
  permissions?: Permission[];
  authOnly?: boolean;
  public?: boolean;
}

const ROUTES: Record<string, RouteConfig> = {
  // Public
  "/about": { public: true },
  "/contact": { public: true },

  // Auth only
  "/profile": { authOnly: true },

  // Role-only
  "/admin": { roles: [Role.ADMIN] },

  // Permission-based
  "/accounts": { permissions: [Permission.USER_VIEW] },
  "/companies": { permissions: [Permission.COMPANY_VIEW] },
  "/services": { permissions: [Permission.SERVICE_VIEW] },
  "/sale-invoices": { permissions: [Permission.SALE_INVOICE_VIEW] },
  "/bills": { permissions: [Permission.BILL_VIEW] },
};

// --------------------------------------------------
// Middleware logic
// --------------------------------------------------
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip static & API routes
  if (
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // Get auth token
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  // 1️⃣ Auth routes (signin/register) - redirect if already logged in
  if (isAuthRoute(pathname)) {
    if (token) return NextResponse.redirect(new URL("/", request.url));
    return NextResponse.next();
  }

  // 2️⃣ Public routes
  if (isPublicRoute(pathname)) {
    return NextResponse.next();
  }

  // 3️⃣ Authentication required for all other routes
  if (!token) {
    const signInUrl = new URL(`/auth/signin`, request.url);
    signInUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(signInUrl);
  }

  // 4️⃣ Unified route check
  for (const [route, config] of Object.entries(ROUTES)) {
    if (pathname.startsWith(route)) {
      // Role-based restriction
      if (config.roles && !config.roles.includes(token.role as Role)) {
        return NextResponse.redirect(new URL(`/unauthorized`, request.url));
      }

      // Permission-based restriction
      if (config.permissions && !hasPermission(token, config.permissions)) {
        return NextResponse.redirect(new URL(`/unauthorized`, request.url));
      }

      // Auth-only routes (just needs login)
      if (config.authOnly) {
        return NextResponse.next();
      }

      // Public routes (always allow)
      if (config.public) {
        return NextResponse.next();
      }
    }
  }

  // 5️⃣ Default allow
  return NextResponse.next();
}

// --------------------------------------------------
// Matcher config
// --------------------------------------------------
export const config = {
  matcher: ["/((?!api|_next/static|_next/image|.*\\..*).*)"],
};
