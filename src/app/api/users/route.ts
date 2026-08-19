import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/users — list all users with profiles
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Only owner and admin can manage users
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || !['owner', 'admin'].includes(profile.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(profiles);
}

// POST /api/users — create new user
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: callerProfile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!callerProfile || !['owner', 'admin'].includes(callerProfile.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await request.json();
  const { email, password, full_name, role } = body;

  // Admin cannot create owner role
  if (callerProfile.role === 'admin' && role === 'owner') {
    return NextResponse.json({ error: 'Admin tidak bisa membuat user dengan role Owner' }, { status: 403 });
  }

  const adminClient = createAdminClient();

  // Invite auth user via email
  const { data: newUser, error: authError } = await adminClient.auth.admin.inviteUserByEmail(email, {
    data: { full_name },
    redirectTo: `${request.nextUrl.origin}/update-password`,
  });

  if (authError) return NextResponse.json({ error: authError.message }, { status: 400 });

  // Update profile role (trigger creates profile with role 'teknisi' by default)
  const { error: profileError } = await adminClient
    .from('profiles')
    .update({ role, full_name })
    .eq('id', newUser.user.id);

  if (profileError) return NextResponse.json({ error: profileError.message }, { status: 500 });

  return NextResponse.json({ success: true, userId: newUser.user.id });
}

// PATCH /api/users — update user role
export async function PATCH(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: callerProfile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!callerProfile || !['owner', 'admin'].includes(callerProfile.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await request.json();
  const { userId, role, full_name } = body;

  // Admin cannot promote to owner
  if (callerProfile.role === 'admin' && role === 'owner') {
    return NextResponse.json({ error: 'Admin tidak bisa memberikan role Owner' }, { status: 403 });
  }

  // Owner cannot be demoted by admin
  if (callerProfile.role === 'admin') {
    const { data: targetProfile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single();
    if (targetProfile?.role === 'owner') {
      return NextResponse.json({ error: 'Admin tidak bisa mengubah role Owner' }, { status: 403 });
    }
  }

  const adminClient = createAdminClient();
  const updates: Record<string, string> = {};
  if (role) updates.role = role;
  if (full_name) updates.full_name = full_name;

  const { error } = await adminClient
    .from('profiles')
    .update(updates)
    .eq('id', userId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

// DELETE /api/users — delete user
export async function DELETE(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: callerProfile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!callerProfile || !['owner', 'admin'].includes(callerProfile.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');
  if (!userId) return NextResponse.json({ error: 'userId diperlukan' }, { status: 400 });

  // Cannot delete yourself
  if (userId === user.id) {
    return NextResponse.json({ error: 'Tidak bisa menghapus akun sendiri' }, { status: 400 });
  }

  // Admin cannot delete owner
  if (callerProfile.role === 'admin') {
    const { data: targetProfile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single();
    if (targetProfile?.role === 'owner') {
      return NextResponse.json({ error: 'Admin tidak bisa menghapus user Owner' }, { status: 403 });
    }
  }

  const adminClient = createAdminClient();
  const { error } = await adminClient.auth.admin.deleteUser(userId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
