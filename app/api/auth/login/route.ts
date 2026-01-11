import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Use service role for security checks (bypassing RLS for brute force table)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const { npsn, password } = await req.json();
    const ip = req.headers.get('x-forwarded-for') || 'unknown';

    // 1. Check Brute Force (Max 5 attempts in 15 mins)
    const { data: recentAttempts, error: checkError } = await supabaseAdmin
      .from('login_attempts')
      .select('id')
      .eq('npsn', npsn)
      .eq('is_successful', false)
      .gt('attempted_at', new Date(Date.now() - 15 * 60 * 1000).toISOString());

    if (recentAttempts && recentAttempts.length >= 5) {
      return NextResponse.json({ 
        error: 'Akun terkunci sementara karena terlalu banyak percobaan. Silakan coba lagi dalam 15 menit.' 
      }, { status: 429 });
    }

    // 2. Map NPSN to Email
    const email = `${npsn}@datadikcilebar.id`;

    // 3. Attempt Login
    // We use the regular client here but we'll log the attempt with admin
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    // 4. Log the attempt
    await supabaseAdmin.from('login_attempts').insert({
      npsn,
      ip_address: ip,
      is_successful: !authError
    });

    if (authError) {
      return NextResponse.json({ error: 'NPSN atau Password salah.' }, { status: 401 });
    }

    return NextResponse.json({ success: true, session: data.session });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
