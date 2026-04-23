"use client";
import { isAdmin } from "@/lib/roleUtils";

import { useAuth } from "@/lib/auth";
import { useScopedData as useData } from "@/lib/useScopedData";
import { Activity, Plus, Users as UsersIcon, X, Upload, Link2 } from "lucide-react";
import { useState, useRef } from "react";
import { Team } from "@/lib/mockData";
import Link from "next/link";
import { TeamLogo } from "@/components/TeamLogo";

export default function AdminTeamsPage() {
  const { user } = useAuth();
  const { teams, users, addTeam } = useData();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [name, setName] = useState("");
  const [color, setColor] = useState("#0ea5e9");
  const [logoUrl, setLogoUrl] = useState("");
  const [logoMode, setLogoMode] = useState<"color" | "url" | "upload">("color");
  const fileRef = useRef<HTMLInputElement>(null);

  if (!user || !isAdmin(user.role)) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setLogoUrl(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const newTeam: Team = {
      id: crypto.randomUUID(),
      name,
      color_code: color,
      logo_url: logoMode !== "color" && logoUrl ? logoUrl : undefined,
      points: 0,
      theme: user.theme,
    };
    addTeam(newTeam);
    setIsModalOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setName(""); setColor("#0ea5e9"); setLogoUrl(""); setLogoMode("color");
  };

  return (
    <div className="animate-[fade-in_0.5s_ease-out] flex flex-col gap-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
        <div className="flex items-center gap-3">
          <Activity className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-black text-foreground">الفرق والأنشطة</h1>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-xl font-bold shadow-md hover:bg-primary/90 transition-all"
        >
          <Plus className="w-5 h-5" /> إنشاء فريق
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {teams.map((team) => {
          const membersCount = users.filter((u) => u.team_ids?.includes(team.id)).length;
          return (
            <div
              key={team.id}
              className="bg-background border border-secondary rounded-3xl p-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group"
            >
              {/* شريط اللون العلوي */}
              <div className="absolute top-0 right-0 w-full h-2" style={{ backgroundColor: team.color_code }} />

              <div className="mt-2 flex items-start justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-foreground">{team.name}</h2>
                  <p className="font-mono text-sm text-primary font-bold mt-1">{team.points} نقطة إجمالية</p>
                </div>
                <TeamLogo
                  name={team.name}
                  colorCode={team.color_code}
                  logoUrl={team.logo_url}
                  size="md"
                />
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-secondary/50">
                <div className="flex items-center gap-2 text-foreground/70">
                  <UsersIcon className="w-4 h-4" />
                  <span className="text-sm font-semibold">{membersCount} أعضاء</span>
                </div>
                <Link href={`/admin/teams/${team.id}`} className="text-sm font-bold text-primary hover:underline">
                  إدارة الفريق
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-8 bg-background border border-secondary rounded-3xl p-8 shadow-sm">
        <h2 className="text-xl font-bold text-foreground mb-4">أحدث الأنشطة المنجزة</h2>
        <div className="text-center py-10 text-foreground/50 border-2 border-dashed border-secondary rounded-2xl">
          الأنشطة المنجزة من الفرق ستظهر هنا للمراجعة والاعتماد.
        </div>
      </div>

      {/* Modal إنشاء فريق */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-[fade-in_0.2s_ease-out]">
          <div className="bg-background border border-secondary rounded-3xl p-8 max-w-md w-full shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => { setIsModalOpen(false); resetForm(); }}
              className="absolute top-6 left-6 p-2 text-foreground/50 hover:bg-secondary rounded-full"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-2xl font-bold text-foreground mb-6">إنشاء فريق جديد</h2>

            <form onSubmit={handleAdd} className="flex flex-col gap-5">
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="اسم الفريق"
                className="p-3 rounded-xl bg-secondary/30 border border-secondary/50 text-foreground"
              />

              {/* اللون دائماً متاح */}
              <div>
                <label className="block text-sm font-bold text-foreground/80 mb-2">اللون المميز</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="w-12 h-10 rounded-lg cursor-pointer bg-transparent border-0 p-0"
                  />
                  <span className="font-mono text-foreground/50 text-sm uppercase">{color}</span>
                </div>
              </div>

              {/* الشعار - اختياري */}
              <div className="flex flex-col gap-3 p-4 bg-secondary/10 border border-secondary/30 rounded-2xl">
                <label className="text-sm font-bold text-foreground/80">شعار الفريق (اختياري)</label>

                {/* أزرار اختيار الطريقة */}
                <div className="flex gap-2 text-xs font-bold">
                  {(["color", "url", "upload"] as const).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => { setLogoMode(mode); setLogoUrl(""); }}
                      className={`px-3 py-1.5 rounded-lg transition-colors ${
                        logoMode === mode
                          ? "bg-primary text-primary-foreground"
                          : "bg-secondary/50 text-foreground/60 hover:bg-secondary"
                      }`}
                    >
                      {mode === "color" ? "لون فقط" : mode === "url" ? "رابط URL" : "رفع صورة"}
                    </button>
                  ))}
                </div>

                {logoMode === "url" && (
                  <div className="flex items-center gap-2">
                    <Link2 className="w-4 h-4 text-foreground/40 shrink-0" />
                    <input
                      type="url"
                      value={logoUrl}
                      onChange={(e) => setLogoUrl(e.target.value)}
                      placeholder="https://example.com/logo.png"
                      className="w-full p-2.5 rounded-xl bg-background border border-secondary/50 text-foreground text-sm"
                    />
                  </div>
                )}

                {logoMode === "upload" && (
                  <div>
                    <input
                      ref={fileRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileRef.current?.click()}
                      className="w-full flex items-center justify-center gap-2 p-3 border-2 border-dashed border-secondary rounded-xl text-foreground/60 hover:border-primary hover:text-primary transition-colors text-sm font-semibold"
                    >
                      <Upload className="w-4 h-4" />
                      {logoUrl ? "تغيير الصورة" : "اختر صورة من جهازك"}
                    </button>
                  </div>
                )}

                {/* معاينة اللوجو */}
                {(logoMode !== "color") && (
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs text-foreground/50">معاينة:</span>
                    <TeamLogo
                      name={name || "فريق"}
                      colorCode={color}
                      logoUrl={logoUrl || undefined}
                      size="md"
                    />
                    {!logoUrl && <span className="text-xs text-foreground/40">في انتظار الصورة...</span>}
                  </div>
                )}
              </div>

              <button
                type="submit"
                className="px-6 py-3 bg-primary text-primary-foreground rounded-xl font-bold shadow-lg shadow-primary/30 hover:opacity-90 transition-all"
              >
                إنشاء الفريق
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
