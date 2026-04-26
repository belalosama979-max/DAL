import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const { email, password, name, role, theme, team_ids, points } = await req.json();
    if (!email || !name) return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });

    const finalPassword = password || '1234';
    let userId: string;

    // 1. Try to create user in Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email, password: finalPassword, email_confirm: true,
      user_metadata: { name, role, theme }
    });

    if (authError) {
      // If email already exists, find and update them
      if (authError.message.toLowerCase().includes('already') || authError.message.toLowerCase().includes('exists')) {
        const { data: existingList } = await supabaseAdmin.auth.admin.listUsers();
        const existingUser = existingList?.users?.find(u => u.email === email);
        if (existingUser) {
          await supabaseAdmin.auth.admin.updateUserById(existingUser.id, {
            password: finalPassword, email_confirm: true, user_metadata: { name, role, theme }
          });
          userId = existingUser.id;
        } else {
          return NextResponse.json({ error: authError.message }, { status: 400 });
        }
      } else {
        return NextResponse.json({ error: authError.message }, { status: 400 });
      }
    } else {
      userId = authData.user.id;
    }

    // 2. Upsert profile with all correct data (overrides any trigger-created row)
    const { error: profileError } = await supabaseAdmin.from('profiles').upsert([{
      id: userId, name, email, role: role || 'member', theme: theme || 'male',
      team_ids: team_ids || [], points: points || 0, must_change_password: true
    }], { onConflict: 'id' });

    if (profileError) {
      console.error("Profile Upsert Error:", profileError);
      return NextResponse.json({ error: profileError.message }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      user: { id: userId, name, email, role: role || 'member', theme: theme || 'male', team_ids: team_ids || [], points: points || 0, mustChangePassword: true }
    }, { status: 200 });

  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { userId } = await req.json();
    if (!userId) return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (error) console.error("Auth Delete Error:", error);
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
