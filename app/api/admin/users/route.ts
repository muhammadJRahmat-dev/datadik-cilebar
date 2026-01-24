import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const getSupabaseAdmin = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    return null;
  }
  return createClient(url, key);
};

// Types for better type safety
interface CreateUserRequest {
  npsn?: string;
  full_name: string;
  role: 'admin_kecamatan' | 'operator';
  password: string;
}

interface UpdateUserRequest {
  id: string;
  npsn?: string;
  full_name: string;
  role: 'admin_kecamatan' | 'operator';
  password?: string;
}

export async function POST(req: NextRequest) {
  const supabaseAdmin = getSupabaseAdmin();
  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'Database admin not configured' }, { status: 503 });
  }
  try {
    const { npsn, full_name, role, password }: CreateUserRequest = await req.json();

    // Input validation
    if (!full_name || !role || !password) {
      return NextResponse.json(
        { error: 'Nama lengkap, role, dan password harus diisi.' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password minimal 6 karakter.' },
        { status: 400 }
      );
    }

    if (role === 'operator' && !npsn) {
      return NextResponse.json(
        { error: 'NPSN wajib diisi untuk operator.' },
        { status: 400 }
      );
    }

    // 1. Create user in Auth
    const email = role === 'admin_kecamatan'
      ? `${npsn || 'admin'}@admin.kecamatan`
      : `${npsn}@datadikcilebar.id`;

    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { npsn, full_name, role }
    });

    if (authError) {
      console.error('Auth create user error:', authError);
      return NextResponse.json(
        { error: authError.message || 'Gagal membuat user autentikasi.' },
        { status: 400 }
      );
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: 'Gagal membuat user autentikasi.' },
        { status: 500 }
      );
    }

    // 2. Create profile in public schema
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .upsert({
        id: authData.user.id,
        role,
        full_name,
        npsn: role === 'operator' ? npsn : null
      });

    if (profileError) {
      console.error('Profile create error:', profileError);
      return NextResponse.json(
        { error: 'Gagal membuat profile user.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, user: authData.user });

  } catch (err: unknown) {
    console.error('Admin create user error:', err);
    const message = err instanceof Error ? err.message : 'Terjadi kesalahan tak terduga.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const supabaseAdmin = getSupabaseAdmin();
  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'Database admin not configured' }, { status: 503 });
  }
  try {
    const { id, npsn, full_name, role, password }: UpdateUserRequest = await req.json();

    // Input validation
    if (!id || !full_name || !role) {
      return NextResponse.json(
        { error: 'ID, nama lengkap, dan role harus diisi.' },
        { status: 400 }
      );
    }

    if (role === 'operator' && !npsn) {
      return NextResponse.json(
        { error: 'NPSN wajib diisi untuk operator.' },
        { status: 400 }
      );
    }

    if (password && password.length < 6) {
      return NextResponse.json(
        { error: 'Password minimal 6 karakter.' },
        { status: 400 }
      );
    }

    // 1. Update user in Auth
    const updateData: Record<string, any> = {
      user_metadata: { npsn, full_name, role }
    };

    if (password) {
      updateData.password = password;
    }

    const email = role === 'admin_kecamatan'
      ? `${npsn || 'admin'}@admin.kecamatan`
      : `${npsn}@datadikcilebar.id`;
    updateData.email = email;

    const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(id, updateData);

    if (authError) {
      console.error('Auth update user error:', authError);
      return NextResponse.json(
        { error: authError.message || 'Gagal mengupdate user autentikasi.' },
        { status: 400 }
      );
    }

    // 2. Update profile in public schema
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({
        role,
        full_name,
        npsn: role === 'operator' ? npsn : null
      })
      .eq('id', id);

    if (profileError) {
      console.error('Profile update error:', profileError);
      return NextResponse.json(
        { error: 'Gagal mengupdate profile user.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });

  } catch (err: unknown) {
    console.error('Admin update user error:', err);
    const message = err instanceof Error ? err.message : 'Terjadi kesalahan tak terduga.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const supabaseAdmin = getSupabaseAdmin();
  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'Database admin not configured' }, { status: 503 });
  }
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'ID user diperlukan.' },
        { status: 400 }
      );
    }

    // Delete from Auth (cascades to profiles if configured)
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(id);

    if (authError) {
      console.error('Auth delete user error:', authError);
      return NextResponse.json(
        { error: authError.message || 'Gagal menghapus user autentikasi.' },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });

  } catch (err: unknown) {
    console.error('Admin delete user error:', err);
    const message = err instanceof Error ? err.message : 'Terjadi kesalahan tak terduga.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET() {
  const supabaseAdmin = getSupabaseAdmin();
  if (!supabaseAdmin) {
    // In build, we might just return empty instead of 503 to avoid build failure if statically optimized
    return NextResponse.json([]);
  }
  try {
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Get users error:', error);
      return NextResponse.json(
        { error: 'Gagal mengambil data users.' },
        { status: 500 }
      );
    }

    return NextResponse.json(data || []);

  } catch (err: unknown) {
    console.error('Get users error:', err);
    const message = err instanceof Error ? err.message : 'Terjadi kesalahan tak terduga.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
