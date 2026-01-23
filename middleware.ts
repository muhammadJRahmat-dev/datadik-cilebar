import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
  const url = req.nextUrl.clone();
  const hostname = req.headers.get('host') || '';

  // Define root domains (including www)
  const rootDomains = ['localhost:3000', 'datadikcilebar.my.id', 'www.datadikcilebar.my.id'];
  
  // Skip middleware for internal Next.js requests, API routes, and static files
  if (
    url.pathname.startsWith('/_next') ||
    url.pathname.startsWith('/api') ||
    url.pathname.startsWith('/static') ||
    url.pathname.includes('.') // for images, favicons, etc.
  ) {
    return NextResponse.next();
  }

  // Check if it's a subdomain
  const isRootDomain = rootDomains.includes(hostname.toLowerCase());

  if (!isRootDomain) {
    // Extract subdomain
    // Example: sdn1.datadikcilebar.my.id -> sdn1
    const subdomain = hostname.split('.')[0];
    
    if (subdomain && subdomain !== 'www') {
      // Rewrite to /sites/[subdomain]
      url.pathname = `/sites/${subdomain}${url.pathname}`;
      return NextResponse.rewrite(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
