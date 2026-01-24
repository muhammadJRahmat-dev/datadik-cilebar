import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Use service role for security checks (bypassing RLS for brute force table)
const getSupabaseAdmin = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    return null;
  }
  return createClient(url, key);
};

// Types for better type safety
interface LoginRequest {
  npsn: string;
  password: string;
}

export async function POST(req: NextRequest) {
  const supabaseAdmin = getSupabaseAdmin();
  if (!supabaseAdmin) {
    return NextResponse.json(
      { error: 'Layanan autentikasi belum dikonfigurasi secara lengkap.' },
      { status: 503 }
    );
  }
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    if (
      !url ||
      !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      !process.env.SUPABASE_SERVICE_ROLE_KEY
    ) {
      return NextResponse.json(
        { error: 'Layanan autentikasi belum dikonfigurasi.' },
        { status: 503 }
      );
    }

    const { npsn, password }: LoginRequest = await req.json();

    // Input validation
    if (!npsn || !password) {
      return NextResponse.json(
        { error: 'NPSN dan Password harus diisi.' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password minimal 6 karakter.' },
        { status: 400 }
      );
    }

    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';

    // 1. Check Brute Force (Max 5 attempts in 15 mins)
    const { data: recentAttempts, error: attemptError } = await supabaseAdmin
      .from('login_attempts')
      .select('id')
      .eq('npsn', npsn)
      .eq('is_successful', false)
      .gt('attempted_at', new Date(Date.now() - 15 * 60 * 1000).toISOString());

    if (attemptError) {
      console.error('Error checking login attempts:', attemptError);
      return NextResponse.json(
        { error: 'Terjadi kesalahan sistem.' },
        { status: 500 }
      );
    }

    if (recentAttempts && recentAttempts.length >= 5) {
      return NextResponse.json({
        error: 'Akun terkunci sementara karena terlalu banyak percobaan. Silakan coba lagi dalam 15 menit.'
      }, { status: 429 });
    }

    // 2. Map NPSN to Email
    const email = `${npsn}@datadikcilebar.id`;

    // 3. Attempt Login
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    // 4. Log attempt
    await supabaseAdmin.from('login_attempts').insert({
      npsn,
      ip_address: ip,
      is_successful: !authError
    });

    if (authError) {
      // Log specific auth errors for monitoring
      if (authError.message.includes('Invalid login credentials')) {
        return NextResponse.json({ error: 'NPSN atau Password salah.' }, { status: 401 });
      }
      return NextResponse.json({ error: authError.message }, { status: 401 });
    }

    return NextResponse.json({ success: true, session: data.session });

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan tak terduga. Silakan coba lagi.' },
      { status: 500 }
    );
  }
}
