import { NextRequest, NextResponse } from 'next/server';

export const config = {
  matcher: [
    /*
     * Match all paths except for:
     * 1. /api routes
     * 2. /_next (Next.js internals)
     * 3. /_static (inside /public)
     * 4. all root files inside /public (e.g. /favicon.ico)
     */
    '/((?!api/|_next/|_static/|_vercel|[\\w-]+\\.\\w+).*)',
  ],
};

export default async function middleware(req: NextRequest) {
  const url = req.nextUrl;
  const hostname = req.headers.get('host') || 'datadikcilebar.my.id';

  // Define allowed domains (localhost and production domain)
  const rootDomains = [
    'localhost:3000', 
    'datadikcilebar.my.id', 
    'www.datadikcilebar.my.id',
    'datadik-cilebar.vercel.app'
  ];
  
  // Extract subdomain
  const searchParams = url.searchParams.toString();
  const path = `${url.pathname}${searchParams.length > 0 ? `?${searchParams}` : ''}`;

  // If it's a root domain, rewrite to /home
  if (rootDomains.includes(hostname)) {
    return NextResponse.rewrite(new URL(`/home${path}`, req.url));
  }

  // If it's a subdomain, rewrite to /sites/[subdomain]
  const subdomain = hostname.split('.')[0];
  if (subdomain && !rootDomains.includes(hostname)) {
    return NextResponse.rewrite(new URL(`/sites/${subdomain}${path}`, req.url));
  }

  return NextResponse.next();
}
