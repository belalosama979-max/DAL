"use client";

import { useAuth } from "@/lib/auth";
import { useScopedData as useData } from "@/lib/useScopedData";
import { isAdmin } from "@/lib/roleUtils";
import { ArrowRight, Save, Trash2, Upload, Link2, Shield, ShieldAlert, Users } from "lucide-react";
import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { User } from "@/lib/mockData";
import { TeamLogo } from "@/components/TeamLogo";
import { useToast } from "@/components/ToastProvider";

export default function TeamDetailsPage(props: { params: Promise<{ teamId: string }> }) {
  const { user } = useAuth();
  const { teams, users, editTeam, deleteTeam, editUser, deleteUser, loading } = useData();
  const { toast } = useToast();
  const router = useRouter();

  const { teamId } = React.use(props.params);
  const team = teams.find((t) => t.id === teamId);
  const teamUsers = users.filter((u) => u.team_ids?.includes(teamId));

  const leaders = teamUsers.filter(u => u.role === "leader");
  const viceLeaders = teamUsers.filter(u => u.role === "vice_leader");
  const members = teamUsers.filter(u => u.role === "member");

  const [name, setName] = useState("");
  const [color, setColor] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [logoMode, setLogoMode] = useState<"color" | "url" | "upload">("color");
  const fileRef = useRef<HTMLInputElement>(null);
  
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  useEffect(() => {
    if (team) {
      setName(team.name);
      setColor(team.color_code);
      if (team.logo_url) {
        setLogoUrl(team.logo_url);
        setLogoMode(team.logo_url.startsWith("data:") ? "upload" : "url");
      } else {
        setLogoMode("color");
        setLogoUrl("");
      }
    }
  }, [team?.id]);

  if (!user || !isAdmin(user.role)) return null;
  if (loading || !teamId) return null;

  if (!team) {
    return (
      <div className="flex flex-col items-center justify-center p-20 gap-4 text-center">
        <h1 className="text-3xl font-bold">الفريق غير موجود</h1>
        <Link href="/admin/teams" className="text-primary font-bold hover:underline">العودة للفرق</Link>
      </div>
    );
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setLogoUrl(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    await editTeam({
      ...team,
      name,
      color_code: color,
      logo_url: logoMode !== "color" && logoUrl ? logoUrl : undefined,
    });
    toast("تم تحديث بيانات الفريق بنجاح", "success");
    router.refresh();
  };

  const handleDeleteTeamOptions = async (option: 1 | 2 | 3) => {
    if (option === 1) {
      // Option 1: Delete team + Delete Members ONLY.
      for (const u of teamUsers) {
        if (u.role === "member") {
          await deleteUser(u.id);
        } else {
          await editUser({ ...u, team_ids: u.team_ids?.filter(id => id !== teamId) || [] });
        }
      }
    } else if (option === 2) {
      // Option 2: Delete team only.
      for (const u of teamUsers) {
        await editUser({ ...u, team_ids: u.team_ids?.filter(id => id !== teamId) || [] });
      }
    } else if (option === 3) {
      // Option 3: Delete team + Delete Everyone (Members, Leaders, Vice Leaders).
      for (const u of teamUsers) {
        if (u.role !== "admin" && u.role !== "vice_president") {
          await deleteUser(u.id);
        } else {
          await editUser({ ...u, team_ids: u.team_ids?.filter(id => id !== teamId) || [] });
        }
      }
    }

    await deleteTeam(teamId);
    setDeleteModalOpen(false);
    toast("تم حذف الفريق بنجاح", "success");
    router.push("/admin/teams");
  };

  const UserList = ({ usersList, title, icon: Icon, emptyMsg }: { usersList: User[], title: string, icon: any, emptyMsg: string }) => (
    <div className="bg-secondary/10 border border-secondary/50 rounded-2xl p-5 mb-4">
      <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
        <Icon className="w-5 h-5 text-primary" /> {title} ({usersList.length})
      </h3>
      {usersList.length === 0 ? (
        <p className="text-sm text-foreground/50 italic">{emptyMsg}</p>
      ) : (
        <div className="flex flex-col gap-2">
          {usersList.map(u => (
            <div key={u.id} className="flex items-center gap-3 bg-background p-3 rounded-xl border border-secondary/30">
              <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-xs">
                {u.name.charAt(0)}
              </div>
              <div className="flex-1">
                <p className="font-bold text-sm text-foreground">{u.name}</p>
                <p className="text-xs text-foreground/50">{u.email}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="animate-[fade-in_0.5s_ease-out] flex flex-col gap-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-secondary/50 pb-6">
        <div className="flex items-center gap-4">
          <Link href="/admin/teams" className="p-2 hover:bg-secondary/50 rounded-xl transition-colors">
            <ArrowRight className="w-6 h-6" />
          </Link>
          <div className="flex items-center gap-3">
            <TeamLogo name={team.name} colorCode={team.color_code} logoUrl={team.logo_url} size="md" />
            <div>
              <h1 className="text-3xl font-black text-foreground">تفاصيل الفريق: {team.name}</h1>
            </div>
          </div>
        </div>

        <button
          onClick={() => setDeleteModalOpen(true)}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-red-500/10 text-red-500 hover:bg-red-500/20 rounded-xl font-bold transition-all border border-red-500/20"
        >
          <Trash2 className="w-4 h-4" /> خيارات حذف الفريق
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Edit Form */}
        <div className="bg-background border border-secondary rounded-3xl p-8 shadow-sm h-fit">
          <h2 className="text-xl font-bold text-foreground mb-6">تعديل معلومات الفريق</h2>
          <div className="flex flex-col gap-5">
            <div>
              <label className="block text-sm font-bold text-foreground/80 mb-2">اسم الفريق</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full p-3 rounded-xl bg-secondary/30 border border-secondary/50 text-foreground"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-foreground/80 mb-2">اللون المميز</label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="w-12 h-10 rounded-lg cursor-pointer bg-transparent border-0 p-0"
                />
                <span className="font-mono text-foreground/50 uppercase text-sm">{color}</span>
              </div>
            </div>

            <div className="flex flex-col gap-3 p-4 bg-secondary/10 border border-secondary/30 rounded-2xl">
              <label className="text-sm font-bold text-foreground/80">شعار الفريق</label>
              <div className="flex gap-2 text-xs font-bold flex-wrap">
                {(["color", "url", "upload"] as const).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => { setLogoMode(mode); if (mode === "color") setLogoUrl(""); }}
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
                  <input ref={fileRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
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

              <div className="flex items-center gap-3 mt-1">
                <span className="text-xs text-foreground/50">معاينة:</span>
                <TeamLogo
                  name={name || team.name}
                  colorCode={color}
                  logoUrl={logoMode !== "color" && logoUrl ? logoUrl : undefined}
                  size="lg"
                />
              </div>
            </div>

            <button
              onClick={handleSave}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl font-bold shadow-lg shadow-primary/30 hover:opacity-90 transition-all w-full mt-2"
            >
              <Save className="w-5 h-5" /> حفظ التغييرات
            </button>
          </div>
        </div>

        {/* Team Hierarchy */}
        <div className="bg-background border border-secondary rounded-3xl p-8 shadow-sm h-fit">
          <h2 className="text-xl font-bold text-foreground mb-6">تشكيل الفريق</h2>
          <UserList usersList={leaders} title="مسؤول الفريق" icon={ShieldAlert} emptyMsg="لا يوجد مسؤول معين" />
          <UserList usersList={viceLeaders} title="نائب المسؤول" icon={Shield} emptyMsg="لا يوجد نائب معين" />
          <UserList usersList={members} title="أعضاء الفريق" icon={Users} emptyMsg="لا يوجد أعضاء في هذا الفريق" />
        </div>
      </div>

      {/* Delete Modal */}
      {deleteModalOpen && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-[fade-in_0.2s_ease-out]">
          <div className="bg-background border border-red-500/20 rounded-3xl p-8 max-w-lg w-full shadow-2xl relative">
            <h2 className="text-2xl font-bold text-red-500 mb-4 flex items-center gap-2">
              <Trash2 className="w-6 h-6" /> خيارات حذف الفريق
            </h2>
            <p className="text-foreground/70 mb-6 font-bold">
              يُرجى اختيار الإجراء المناسب للحذف:
            </p>

            <div className="flex flex-col gap-3">
              <button
                onClick={() => handleDeleteTeamOptions(1)}
                className="w-full text-right p-4 bg-secondary/20 hover:bg-secondary/40 border border-secondary rounded-xl transition-all"
              >
                <div className="font-bold text-foreground">حذف الفريق مع كل أعضائه (فقط الأعضاء)</div>
                <div className="text-xs text-foreground/50 mt-1">(يتم حذف حسابات الأعضاء العاديين، ويبقى المسؤول ونائبه في النظام بدون فريق)</div>
              </button>

              <button
                onClick={() => handleDeleteTeamOptions(2)}
                className="w-full text-right p-4 bg-secondary/20 hover:bg-secondary/40 border border-secondary rounded-xl transition-all"
              >
                <div className="font-bold text-foreground">حذف الفريق مع بقاء أعضائه من غير فريق</div>
                <div className="text-xs text-foreground/50 mt-1">(لن يتم حذف أي حسابات نهائياً، فقط إزالة ربطهم بهذا الفريق)</div>
              </button>

              <button
                onClick={() => handleDeleteTeamOptions(3)}
                className="w-full text-right p-4 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 rounded-xl transition-all"
              >
                <div className="font-bold text-red-600">حذف الفريق مع كل أعضائه مع المسؤول ونائب الفريق</div>
                <div className="text-xs text-red-600/70 mt-1">(سيتم حذف جميع الحسابات المرتبطة بهذا الفريق نهائياً من النظام)</div>
              </button>

              <button
                onClick={() => setDeleteModalOpen(false)}
                className="w-full mt-4 px-4 py-3 bg-secondary text-foreground rounded-xl font-bold hover:opacity-80 transition-all text-sm text-center"
              >
                إلغاء التراجع
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
