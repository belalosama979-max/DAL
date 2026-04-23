import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const { email, password, name, role, theme, team_ids, points } = await req.json();

    if (!email || !name) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const finalPassword = password || '1234';
    let userId: string;

    // 1. Try to create the user in Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: finalPassword,
      email_confirm: true,
      user_metadata: { name, role, theme }
    });

    if (authError) {
      // If user already exists in Auth (e.g. was deleted from profiles but not Auth),
      // find them by email and update their password
      if (authError.message.toLowerCase().includes('already') || authError.message.toLowerCase().includes('exists')) {
        const { data: existingList } = await supabaseAdmin.auth.admin.listUsers();
        const existingUser = existingList?.users?.find(u => u.email === email);

        if (existingUser) {
          // Update password for the existing Auth user
          await supabaseAdmin.auth.admin.updateUserById(existingUser.id, {
            password: finalPassword,
            email_confirm: true,
            user_metadata: { name, role, theme }
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

    // 2. Upsert into profiles table with ALL correct data (overwrites trigger-created row)
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .upsert([{
        id: userId,
        name,
        email,
        role: role || 'member',
        theme: theme || 'male',
        team_ids: team_ids || [],
        points: points || 0,
        must_change_password: true
      }], { onConflict: 'id' });

    if (profileError) {
      console.error("Profile Upsert Error:", profileError);
      // Don't delete the auth user — profile error shouldn't remove the account
      return NextResponse.json({ error: profileError.message }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      user: {
        id: userId,
        name,
        email,
        role: role || 'member',
        theme: theme || 'male',
        team_ids: team_ids || [],
        points: points || 0,
        mustChangePassword: true
      }
    }, { status: 200 });

  } catch (error: any) {
    console.error("Server Error:", error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { userId } = await req.json();
    if (!userId) return NextResponse.json({ error: 'Missing userId' }, { status: 400 });

    // Delete from Auth (service role required)
    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (error) {
      console.error("Auth Delete Error:", error);
      // Don't fail — profile deletion on client handles DB side
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
