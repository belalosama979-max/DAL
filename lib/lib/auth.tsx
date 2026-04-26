"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { User } from "./mockData";
import { useRouter } from "next/navigation";
import { useTheme } from "@/components/ThemeProvider";
import { isAdmin } from "@/lib/roleUtils";

import supabase from "./supabase";

interface AuthContextType {
  user: User | null;
  login: (email: string, password?: string) => Promise<void>;
  logout: () => Promise<void>;
  changePassword: (newPassword: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { setTheme } = useTheme();

  useEffect(() => {
    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchProfile = async (userId: string) => {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profile) {
        const mappedUser: User = {
          id: profile.id,
          name: profile.name,
          email: profile.email,
          role: profile.role,
          theme: profile.theme,
          points: profile.points,
          team_ids: profile.team_ids,
          avatar: profile.avatar_url,
          mustChangePassword: profile.must_change_password
        };
        setUser(mappedUser);
        setTheme(mappedUser.theme);
      }
    } catch (err) {
      console.error("Error fetching profile:", err);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password?: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password: password || '',
    });

    if (error) {
      alert("خطأ في تسجيل الدخول: " + error.message);
      return;
    }

    if (data.user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single();

      if (profile?.must_change_password) {
        router.push("/change-password");
      } else if (profile) {
        router.push(isAdmin(profile.role) ? "/admin" : "/member");
      }
    }
  };

  const changePassword = async (newPassword: string) => {
    if (!user) return;

    const { error: authError } = await supabase.auth.updateUser({
      password: newPassword
    });

    if (authError) {
      alert("خطأ في تحديث كلمة المرور: " + authError.message);
      return;
    }

    // Update profile to set must_change_password to false
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ must_change_password: false })
      .eq('id', user.id);

    if (profileError) {
      alert("تم تغيير كلمة المرور في النظام، ولكن فشل تحديث حالتك في القاعدة: " + profileError.message);
      return;
    }

    setUser({ ...user, mustChangePassword: false });
    router.push(isAdmin(user.role) ? "/admin" : "/member");
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    router.push("/login");
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, changePassword }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
