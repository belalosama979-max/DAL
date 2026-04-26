"use client";

import { useAuth } from "@/lib/auth";
import { useState } from "react";
import { Shield, Lock, Check, X, AlertCircle, Eye, EyeOff } from "lucide-react";

export default function ChangePasswordPage() {
  const { user, changePassword } = useAuth();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const criteria = [
    { label: "6 أحرف على الأقل", met: newPassword.length >= 6 },
    { label: "حرف واحد على الأقل", met: /[a-zA-Z]/.test(newPassword) },
    { label: "رقم واحد على الأقل", met: /[0-9]/.test(newPassword) },
  ];
  const allMet = criteria.every(c => c.met);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!allMet) { setError("يرجى استيفاء جميع متطلبات كلمة المرور."); return; }
    if (newPassword !== confirmPassword) { setError("كلمتا المرور غير متطابقتين."); return; }
    setIsSubmitting(true);
    try {
      await changePassword(newPassword);
      setSuccess(true);
    } catch {
      setError("حدث خطأ أثناء تغيير كلمة المرور. حاول مجدداً.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <p className="text-foreground/60">جاري التحميل...</p>
    </div>
  );

  const homeUrl = (user.role === 'admin' || user.role === 'vice_president') ? "/admin" : "/member";

  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden p-4">
      <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-primary/20 blur-[100px]" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full bg-accent/20 blur-[100px]" />
      <div className="w-full max-w-md p-8 rounded-3xl bg-background/80 shadow-2xl backdrop-blur-xl border border-secondary relative z-10 animate-[fade-in_0.4s_ease-out]">
        <div className="mb-8 text-center">
          <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-black text-foreground mb-1">تغيير كلمة المرور</h1>
          <p className="text-foreground/50 text-sm">
            {user.mustChangePassword ? "يجب عليك تعيين كلمة مرور جديدة قبل الاستمرار" : "قم بتحديث كلمة مرور حسابك"}
          </p>
        </div>

        {success ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-green-500" />
            </div>
            <h2 className="text-xl font-bold text-foreground mb-2">تم تغيير كلمة المرور!</h2>
            <p className="text-foreground/60 text-sm mb-6">كلمة مرورك الجديدة فعّالة الآن.</p>
            <a href={homeUrl} className="inline-block px-6 py-3 bg-primary text-primary-foreground rounded-xl font-bold hover:opacity-90 transition-opacity">
              العودة للرئيسية
            </a>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-foreground/80 flex items-center gap-2">
                <Lock className="w-4 h-4" /> كلمة المرور الجديدة
              </label>
              <div className="relative">
                <input type={showNew ? "text" : "password"} value={newPassword} onChange={e => setNewPassword(e.target.value)}
                  className="w-full px-4 py-3 pl-11 rounded-xl bg-secondary/30 border border-secondary/50 focus:border-primary outline-none transition-all text-foreground"
                  placeholder="أدخل كلمة المرور الجديدة" required autoFocus />
                <button type="button" onClick={() => setShowNew(!showNew)} className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/40 hover:text-foreground">
                  {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-foreground/80 flex items-center gap-2">
                <Check className="w-4 h-4" /> تأكيد كلمة المرور
              </label>
              <div className="relative">
                <input type={showConfirm ? "text" : "password"} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3 pl-11 rounded-xl bg-secondary/30 border border-secondary/50 focus:border-primary outline-none transition-all text-foreground"
                  placeholder="أعد إدخال كلمة المرور" required />
                <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/40 hover:text-foreground">
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div className="bg-secondary/20 p-4 rounded-2xl border border-secondary/50">
              <div className="flex flex-col gap-2">
                {criteria.map((c, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs">
                    {c.met ? <Check className="w-4 h-4 text-green-500 shrink-0" /> : <X className="w-4 h-4 text-foreground/30 shrink-0" />}
                    <span className={c.met ? "text-green-600 font-medium" : "text-foreground/50"}>{c.label}</span>
                  </div>
                ))}
                {confirmPassword && (
                  <div className="flex items-center gap-2 text-xs mt-1">
                    {newPassword === confirmPassword ? <Check className="w-4 h-4 text-green-500 shrink-0" /> : <X className="w-4 h-4 text-red-400 shrink-0" />}
                    <span className={newPassword === confirmPassword ? "text-green-600 font-medium" : "text-red-500"}>كلمتا المرور متطابقتان</span>
                  </div>
                )}
              </div>
            </div>
            {error && (
              <div className="flex items-center gap-2 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-500 text-sm">
                <AlertCircle className="w-5 h-5 shrink-0" />{error}
              </div>
            )}
            <div className="flex gap-3 pt-1">
              {!user.mustChangePassword && (
                <a href={homeUrl} className="flex-1 px-4 py-3 rounded-xl bg-secondary text-foreground font-bold text-center hover:bg-secondary/70 transition-colors">
                  إلغاء
                </a>
              )}
              <button type="submit" disabled={!allMet || newPassword !== confirmPassword || isSubmitting}
                className={`flex-1 px-6 py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${
                  allMet && newPassword === confirmPassword && !isSubmitting
                    ? "bg-primary text-primary-foreground shadow-lg hover:opacity-90 cursor-pointer"
                    : "bg-secondary text-foreground/30 cursor-not-allowed"
                }`}>
                {isSubmitting ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Shield className="w-4 h-4" />}
                {isSubmitting ? "جاري الحفظ..." : "تغيير كلمة المرور"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
