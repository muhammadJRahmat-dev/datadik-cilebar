import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;
    const hostname = request.headers.get('host');

    // 1. Handle Subdomains (Multi-tenancy)
    // Skip for localhost (unless using a local domain setup) and main domain
    // Adjust 'localhost:3000' and 'datadikcilebar.id' as needed for production
    const currentHost = process.env.NODE_ENV === 'production'
        ? hostname?.replace(`.${process.env.NEXT_PUBLIC_ROOT_DOMAIN}`, '')
        : hostname?.replace('.localhost:3000', '');

    // If there's a subdomain and it's not 'www' or the main domain itself
    if (currentHost && currentHost !== 'www' && currentHost !== 'localhost:3000' && !pathname.startsWith('/sites')) {
        // Rewrite to /sites/[subdomain]
        const url = request.nextUrl.clone();
        url.pathname = `/sites/${currentHost}${url.pathname}`;
        return NextResponse.rewrite(url);
    }

    // 2. Auth Protection
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
                getAll() {
                    return request.cookies.getAll();
                },
                setAll(cookiesToSet: { name: string; value: string; options: any }[]) {
                    cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
                    response = NextResponse.next({
                        request: {
                            headers: request.headers,
                        },
                    });
                    cookiesToSet.forEach(({ name, value, options }) =>
                        response.cookies.set(name, value, options)
                    );
                },
            },
        }
    );

    const { data: { session } } = await supabase.auth.getSession();

    // Protect Admin Routes
    if (pathname.startsWith('/admin') && !session) {
        return NextResponse.redirect(new URL('/login', request.url));
    }

    // Protect Dashboard Routes
    if (pathname.startsWith('/dashboard') && !session) {
        return NextResponse.redirect(new URL('/login', request.url));
    }

    return response;
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public folder
         */
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
};
