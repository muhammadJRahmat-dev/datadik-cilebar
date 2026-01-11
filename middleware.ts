import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

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

export default async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: '', ...options });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({ name, value: '', ...options });
        },
      },
    }
  );

  const { data: { session } } = await supabase.auth.getSession();

  const url = request.nextUrl;
  const hostname = request.headers.get('host') || 'datadikcilebar.my.id';
  const path = url.pathname;

  // 1. Protection for /dashboard
  if (path.startsWith('/dashboard')) {
    if (!session) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  // 2. Redirect logged-in users away from /login
  if (path === '/login' && session) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // 3. Subdomain Routing Logic
  const rootDomains = [
    'localhost:3000', 
    'datadikcilebar.my.id', 
    'www.datadikcilebar.my.id',
    'datadik-cilebar.vercel.app',
    'kemendikdasmen.go.id',
    'www.kemendikdasmen.go.id'
  ];

  const searchParams = url.searchParams.toString();
  const fullPath = `${path}${searchParams.length > 0 ? `?${searchParams}` : ''}`;

  // If it's a root domain
  if (rootDomains.includes(hostname)) {
    // If it's the root path, rewrite to /home
    if (path === '/') {
      return NextResponse.rewrite(new URL(`/home`, request.url));
    }
    // Otherwise just continue (for /login, /dashboard, etc.)
    return response;
  }

  // If it's a subdomain, rewrite to /sites/[subdomain]
  const subdomain = hostname.split('.')[0];
  if (subdomain && !rootDomains.includes(hostname)) {
    // Prevent subdomains from accessing /dashboard or /login directly if needed, 
    // but usually they just see the school site.
    return NextResponse.rewrite(new URL(`/sites/${subdomain}${fullPath}`, request.url));
  }

  return response;
}
