import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const { npsn, full_name, role, password } = await req.json();

    // 1. Create user in Auth
    const email = role === 'admin_kecamatan' ? `${npsn || 'admin'}@admin.kecamatan` : `${npsn}@datadikcilebar.id`;
    
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { npsn, full_name, role }
    });

    if (authError) throw authError;

    // 2. Create profile in public schema
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .upsert({
        id: authData.user.id,
        role,
        full_name,
        npsn: role === 'operator' ? npsn : null
      });

    if (profileError) throw profileError;

    return NextResponse.json({ success: true, user: authData.user });
  } catch (err: any) {
    console.error('Admin create user error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { id, npsn, full_name, role, password } = await req.json();

    if (!id) throw new Error('ID required');

    // 1. Update user in Auth if password or email changes
    const updateData: any = {
      user_metadata: { npsn, full_name, role }
    };

    if (password) {
      updateData.password = password;
    }

    // Determine email based on role and NPSN if it changed
    const email = role === 'admin_kecamatan' ? `${npsn || 'admin'}@admin.kecamatan` : `${npsn}@datadikcilebar.id`;
    updateData.email = email;

    const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(id, updateData);
    if (authError) throw authError;

    // 2. Update profile in public schema
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({
        role,
        full_name,
        npsn: role === 'operator' ? npsn : null
      })
      .eq('id', id);

    if (profileError) throw profileError;

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Admin update user error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) throw new Error('ID required');

    // Delete from Auth (cascades to profiles if configured, but let's be safe)
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(id);
    if (authError) throw authError;

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Admin delete user error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function GET() {
  // We can fetch profiles directly via client Supabase if RLS allows, 
  // but for admin stuff, sometimes service role is easier.
  try {
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}