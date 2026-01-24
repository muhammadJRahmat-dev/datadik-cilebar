import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export default async function proxy(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const pathname = request.nextUrl.pathname;
  const isIgnoredPath =
    pathname.startsWith('/api/') ||
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/_static/') ||
    pathname.startsWith('/_vercel/') ||
    /\/[\w-]+\.\w+$/.test(pathname);
  if (isIgnoredPath) {
    return response;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  const hasSupabase = !!supabaseUrl && !!supabaseKey;
  let session: any = null;
  if (hasSupabase) {
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
    const { data } = await supabase.auth.getSession();
    session = data.session;
  }

  const url = request.nextUrl;
  const hostname = request.headers.get('host') || 'datadikcilebar.my.id';
  const path = url.pathname;

  if (path.startsWith('/dashboard')) {
    if (!session) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  if (path === '/login' && session) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

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

  if (rootDomains.includes(hostname)) {
    if (path === '/') {
      return NextResponse.rewrite(new URL(`/home`, request.url));
    }
    return response;
  }

  const subdomain = hostname.split('.')[0];
  if (subdomain && !rootDomains.includes(hostname)) {
    return NextResponse.rewrite(new URL(`/sites/${subdomain}${fullPath}`, request.url));
  }

  return response;
}
