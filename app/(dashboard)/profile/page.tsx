"use client";

import { useAuth } from "@/lib/auth";
import { useScopedData as useData } from "@/lib/useScopedData";
import { isAdmin, getRoleLabel } from "@/lib/roleUtils";
import { useState, useRef, useEffect } from "react";
import { UserCircle, Camera, Save, ArrowRight, Upload } from "lucide-react";
import { useRouter } from "next/navigation";

export default function ProfilePage() {
  const { user } = useAuth();
  const { editUser, teams } = useData();
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [avatar, setAvatar] = useState<string | undefined>(undefined);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) {
      setName(user.name);
      setEmail(user.email);
      setAvatar(user.avatar);
    }
  }, [user]);

  if (!user) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatar(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    setTimeout(() => {
      editUser({
        ...user,
        name,
        email,
        avatar
      });
      setIsSaving(false);
    }, 500); // Simulate network delay for UX
  };

  return (
    <div className="animate-[fade-in_0.5s_ease-out] flex flex-col gap-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-4 mb-2">
        <button 
          onClick={() => router.back()}
          className="p-2 rounded-xl bg-background border border-secondary text-foreground hover:bg-secondary transition-colors"
        >
          <ArrowRight className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-3">
          <UserCircle className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-black text-foreground">الملف الشخصي</h1>
        </div>
      </div>

      <div className="bg-background border border-secondary rounded-3xl p-8 shadow-sm">
        <form onSubmit={handleSave} className="flex flex-col gap-8">
          
          {/* Avatar Section */}
          <div className="flex flex-col items-center gap-4">
            <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
              {avatar ? (
                <img src={avatar} alt="Profile" className="w-32 h-32 rounded-full object-cover border-4 border-background shadow-xl" />
              ) : (
                <div className="w-32 h-32 rounded-full bg-secondary/50 flex items-center justify-center text-4xl font-bold text-foreground/50 border-4 border-background shadow-xl">
                  {name.substring(0, 1) || user.name.substring(0, 1)}
                </div>
              )}
              <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera className="w-8 h-8 text-white" />
              </div>
              <input 
                type="file" 
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                className="hidden"
              />
            </div>
            <div className="text-center">
              <p className="text-sm font-bold text-foreground">تغيير الصورة</p>
              <p className="text-xs text-foreground/50">اضغط على الصورة لرفع واحدة جديدة</p>
            </div>
          </div>

          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold text-foreground">الاسم الكامل</label>
              <input 
                required 
                value={name} 
                onChange={e => setName(e.target.value)} 
                className="p-3.5 rounded-xl bg-secondary/20 border border-secondary/50 text-foreground focus:outline-none focus:border-primary/50 transition-colors" 
                placeholder="أدخل اسمك"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold text-foreground">البريد الإلكتروني</label>
              <input 
                required 
                type="email"
                value={email} 
                onChange={e => setEmail(e.target.value)} 
                className="p-3.5 rounded-xl bg-secondary/20 border border-secondary/50 text-foreground focus:outline-none focus:border-primary/50 transition-colors" 
                placeholder="أدخل بريدك الإلكتروني"
              />
            </div>

            {/* Read-only fields for context */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
              <div className="p-5 bg-secondary/10 rounded-2xl border border-secondary/30 flex flex-col justify-center">
                <p className="text-xs font-bold text-foreground/50 mb-1.5 uppercase tracking-wider">الرتبة والفرق</p>
                <p className="font-bold text-foreground text-sm leading-relaxed">
                  {isAdmin(user.role) ? getRoleLabel(user.role, user.theme) : (
                    user.team_ids && user.team_ids.length > 0 
                      ? `${getRoleLabel(user.role, user.theme)} في ${teams.filter(t => user.team_ids!.includes(t.id)).map(t => t.name).join(' و ')}`
                      : `${getRoleLabel(user.role, user.theme)} ليس بفريق`
                  )}
                </p>
              </div>
              <div className="p-5 bg-secondary/10 rounded-2xl border border-secondary/30 flex flex-col justify-center items-start sm:items-end">
                <p className="text-xs font-bold text-foreground/50 mb-1.5 uppercase tracking-wider">النقاط المكتسبة</p>
                <p className="font-bold text-primary font-mono text-2xl">{user.points}</p>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-secondary mt-2 flex flex-col sm:flex-row gap-4">
            <button 
              type="button"
              onClick={() => { window.location.href = "/change-password"; }}
              className="flex-1 flex items-center justify-center gap-2 py-4 bg-secondary text-foreground rounded-xl font-bold hover:bg-secondary/80 transition-all text-lg"
            >
              تغيير كلمة السر
            </button>
            <button 
              type="submit" 
              disabled={isSaving}
              className="flex-1 flex items-center justify-center gap-2 py-4 bg-primary text-primary-foreground rounded-xl font-bold shadow-lg shadow-primary/30 hover:opacity-90 disabled:opacity-50 transition-all text-lg"
            >
              {isSaving ? (
                "جاري الحفظ..."
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  حفظ التعديلات
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
