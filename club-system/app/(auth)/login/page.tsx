"use client";

import { useAuth } from "@/lib/auth";
import { ArrowRight, LogIn } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-primary/20 blur-[100px]" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full bg-accent/20 blur-[100px]" />

      <div className="w-full max-w-md p-8 rounded-3xl bg-background/60 shadow-2xl backdrop-blur-xl border border-secondary relative z-10 animate-[fade-in_0.5s_ease-out]">
        <Link href="/" className="inline-flex items-center gap-2 text-foreground/50 hover:text-primary transition-colors mb-8 text-sm font-semibold">
          <ArrowRight className="w-4 h-4" /> العودة للرئيسية
        </Link>
        
        <div className="mb-10 text-center">
          <div className="w-20 h-20 flex items-center justify-center mx-auto mb-4">
            <img src="/logo.png" alt="شعار مبادرة دال" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-3xl font-black text-foreground mb-2">تسجيل الدخول</h1>
          <p className="text-foreground/60">أدخل بريدك الإلكتروني للوصول لمنصة مبادرة دال</p>
        </div>

        <form onSubmit={handleLogin} className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <label htmlFor="email" className="text-sm font-semibold text-foreground/80">البريد الإلكتروني</label>
            <input 
              id="email"
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="مثال: admin@dal.com" 
              className="px-4 py-3 rounded-xl bg-secondary/30 border border-secondary/50 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-foreground"
              required
            />
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="password" className="text-sm font-semibold text-foreground/80">كلمة المرور</label>
            <input 
              id="password"
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••" 
              className="px-4 py-3 rounded-xl bg-secondary/30 border border-secondary/50 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-foreground"
              required
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="mt-4 px-6 py-4 bg-primary text-primary-foreground rounded-xl font-bold shadow-lg shadow-primary/30 hover:opacity-90 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <LogIn className="w-5 h-5" />
            )}
            {loading ? "جاري الدخول..." : "الدخول الآن"}
          </button>
        </form>


      </div>
    </div>
  );
}
