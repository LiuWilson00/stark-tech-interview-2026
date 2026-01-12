import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Routes that don't require authentication
const publicRoutes = ['/login', '/register'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if the route is public
  const isPublicRoute = publicRoutes.some((route) => pathname.startsWith(route));

  // Get auth token from cookies
  // Zustand persist stores auth state in cookies with name 'auth-storage'
  const authCookie = request.cookies.get('auth-storage');

  // Parse the auth storage to check if user is authenticated
  let isAuthenticated = false;
  if (authCookie?.value) {
    try {
      const authData = JSON.parse(decodeURIComponent(authCookie.value));
      isAuthenticated = authData.state?.isAuthenticated || false;
    } catch {
      isAuthenticated = false;
    }
  }

  // For protected routes, let client-side handle auth redirect
  // This avoids race conditions with zustand persist
  // The tasks page has its own useEffect to redirect if not authenticated
  if (!isPublicRoute && !isAuthenticated) {
    // Allow the request to proceed - client-side will handle redirect
    return NextResponse.next();
  }

  // Redirect authenticated users away from auth pages
  if (isPublicRoute && isAuthenticated) {
    return NextResponse.redirect(new URL('/tasks', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\..*|api).*)',
  ],
};
