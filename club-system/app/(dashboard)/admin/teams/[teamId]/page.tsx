"use client";
import { isAdmin } from "@/lib/roleUtils";

import { useAuth } from "@/lib/auth";
import { useScopedData as useData } from "@/lib/useScopedData";
import { Trash2, ArrowRight, Save, UserMinus, Upload, Link2, MinusCircle, RefreshCcw, Clock } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { User } from "@/lib/mockData";
import { TeamLogo } from "@/components/TeamLogo";
import { useToast } from "@/components/ToastProvider";
import { CountdownTimer } from "@/components/CountdownTimer";

export default function ManageTeamPage() {
  const { user } = useAuth();
  const { teams, users, editTeam, deleteTeam, editUser, loading } = useData();
  const { toast, confirm } = useToast();
  const router = useRouter();
  const params = useParams();

  const teamId = params?.teamId as string;
  const team = teams.find((t) => t.id === teamId);
  const teamMembers = users.filter((u) => u.team_ids?.includes(teamId));

  const [name, setName] = useState("");
  const [color, setColor] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [logoMode, setLogoMode] = useState<"color" | "url" | "upload">("color");
  const fileRef = useRef<HTMLInputElement>(null);

  const [deductAmount, setDeductAmount] = useState("");
  const [deductReason, setDeductReason] = useState("");
  
  const [motivationDeadline, setMotivationDeadline] = useState("");

  useEffect(() => {
    if (team) {
      setName(team.name);
      setColor(team.color_code);
      if (team.logo_url) {
        setLogoUrl(team.logo_url);
        // تحديد الوضع بناءً على نوع URL
        setLogoMode(team.logo_url.startsWith("data:") ? "upload" : "url");
      } else {
        setLogoMode("color");
        setLogoUrl("");
      }
      if (team.motivation_deadline) {
        // datetime-local expects YYYY-MM-DDThh:mm format
        const d = new Date(team.motivation_deadline);
        // adjust for timezone offset
        const tzoffset = d.getTimezoneOffset() * 60000;
        const localISOTime = (new Date(d.getTime() - tzoffset)).toISOString().slice(0, 16);
        setMotivationDeadline(localISOTime);
      } else {
        setMotivationDeadline("");
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [team?.id]);

  if (!user || !isAdmin(user.role)) return null;
  if (loading) return null;

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

  const handleSave = () => {
    editTeam({
      ...team,
      name,
      color_code: color,
      logo_url: logoMode !== "color" && logoUrl ? logoUrl : undefined,
      motivation_deadline: motivationDeadline ? new Date(motivationDeadline).toISOString() : undefined,
      motivation_handled: false
    });
    toast("تم تحديث بيانات الفريق بنجاح ✓", "success");
    router.push("/admin/teams");
  };

  const handleDeleteTeam = async () => {
    if (await confirm("هل أنت متأكد من حذف هذا الفريق؟ سيصبح جميع أعضائه بدون فريق.")) {
      deleteTeam(teamId);
      router.push("/admin/teams");
    }
  };

  const handleRemoveMember = async (member: User) => {
    if (await confirm(`هل أنت متأكد من إزالة ${member.name} من هذا الفريق؟`)) {
      editUser({ ...member, team_ids: member.team_ids?.filter((id) => id !== teamId) || [] });
      toast(`تم إزالة ${member.name} من الفريق`, "info");
    }
  };

  const handleDeductTeam = () => {
    const pts = parseInt(deductAmount);
    if (!pts || isNaN(pts) || pts <= 0) { toast("أدخل قيمة صحيحة لخصم النقاط", "error"); return; }
    if (team.points < pts) { toast("لا يمكن خصم نقاط أكثر من رصيد الفريق الحالي", "warning"); return; }
    
    const newLog = {
      id: "l" + Date.now(),
      type: "deduct" as const,
      amount: pts,
      reason: deductReason,
      date: new Date().toISOString()
    };
    
    editTeam({
      ...team,
      points: team.points - pts,
      logs: [newLog, ...(team.logs || [])]
    });
    
    setDeductAmount("");
    setDeductReason("");
    toast("تم خصم النقاط بنجاح وتسجيل العملية", "success");
  };

  const handleResetTeam = async () => {
    if (await confirm("هل أنت متأكد من تصفير نقاط الفريق؟")) {
      const newLog = {
        id: "l" + Date.now(),
        type: "reset" as const,
        amount: team.points,
        reason: deductReason,
        date: new Date().toISOString()
      };
      editTeam({
        ...team,
        points: 0,
        logs: [newLog, ...(team.logs || [])]
      });
      setDeductReason("");
      toast("تم تصفير نقاط الفريق وتسجيل العملية", "success");
    }
  };

  return (
    <div className="animate-[fade-in_0.5s_ease-out] flex flex-col gap-8 max-w-4xl mx-auto">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-secondary/50 pb-6">
        <div className="flex items-center gap-4">
          <Link href="/admin/teams" className="p-2 hover:bg-secondary/50 rounded-xl transition-colors">
            <ArrowRight className="w-6 h-6" />
          </Link>
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <TeamLogo name={team.name} colorCode={team.color_code} logoUrl={team.logo_url} size="md" />
            <div>
              <h1 className="text-3xl font-black text-foreground">إدارة: {team.name}</h1>
              <p className="text-foreground/50 mt-1">
                النقاط الإجمالية: <span className="font-mono text-primary font-bold">{team.points}</span>
              </p>
              {team.motivation_deadline && !team.motivation_handled && (
                <div className="mt-2 text-sm text-foreground/80 flex items-center gap-2">
                  نهاية التحفيز: <CountdownTimer deadline={team.motivation_deadline} />
                </div>
              )}
            </div>
          </div>
        </div>

        <button
          onClick={handleDeleteTeam}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-red-500/10 text-red-500 hover:bg-red-500/20 rounded-xl font-bold transition-all border border-red-500/20"
        >
          <Trash2 className="w-4 h-4" /> حذف الفريق نهائياً
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Edit Info */}
        <div className="bg-background border border-secondary rounded-3xl p-8 shadow-sm h-fit">
          <h2 className="text-xl font-bold text-foreground mb-6">تعديل بيانات الفريق</h2>
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

            {/* شعار الفريق */}
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

              {/* معاينة */}
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

            <div className="pt-4 border-t border-secondary/50">
              <label className="block text-sm font-bold text-foreground/80 mb-2 flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary" />
                إعداد نظام التحفيز (مؤقت تصفير النقاط)
              </label>
              <p className="text-xs text-foreground/50 mb-3">حدد تاريخ ووقت نهاية التقييم (عند الانتهاء، سيتم تصفير نقاط الفريق وأعضائه تلقائياً). اترك الحقل فارغاً لإلغاء المؤقت.</p>
              <input
                type="datetime-local"
                value={motivationDeadline}
                onChange={(e) => setMotivationDeadline(e.target.value)}
                className="w-full p-3 rounded-xl bg-secondary/30 border border-secondary/50 text-foreground"
              />
            </div>

            <button
              onClick={handleSave}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl font-bold shadow-lg shadow-primary/30 hover:opacity-90 transition-all w-full mt-2"
            >
              <Save className="w-5 h-5" /> حفظ التغييرات
            </button>
          </div>
        </div>

        {/* Team Members */}
        <div className="bg-background border border-secondary rounded-3xl p-8 shadow-sm h-fit">
          <h2 className="text-xl font-bold text-foreground mb-6">أعضاء الفريق ({teamMembers.length})</h2>

          {teamMembers.length === 0 ? (
            <div className="text-center py-10 text-foreground/50 border-2 border-dashed border-secondary rounded-2xl">
              لا يوجد أعضاء في هذا الفريق حالياً.
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {teamMembers.map((m) => (
                <div key={m.id} className="flex items-center justify-between p-3 bg-secondary/10 border border-secondary/50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-sm">
                      {m.name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-bold text-foreground text-sm">{m.name}</h4>
                      <p className="text-xs text-primary font-mono">{m.points} pt</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemoveMember(m)}
                    title="إزالة من الفريق"
                    className="p-2 text-foreground/40 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                  >
                    <UserMinus className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Points Management & Deductions */}
        <div className="bg-background border border-secondary rounded-3xl p-8 shadow-sm h-fit md:col-span-2">
          <h2 className="text-xl font-bold text-foreground mb-6">إدارة رصيد النقاط والخصومات</h2>
          
          <div className="flex flex-col md:flex-row gap-6 mb-8 p-6 bg-red-500/5 border border-red-500/20 rounded-2xl">
            <div className="flex-1 flex flex-col gap-4">
              <div>
                <label className="block text-sm font-bold text-foreground/80 mb-2">مقدار النقاط للخصم</label>
                <input 
                  type="number" 
                  value={deductAmount}
                  onChange={(e) => setDeductAmount(e.target.value)}
                  placeholder="مثال: 50" 
                  className="w-full p-3 rounded-xl bg-background border border-secondary/50 text-foreground font-mono"
                  min="1"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-foreground/80 mb-2">سبب الخصم / التصفير (اختياري)</label>
                <input 
                  type="text" 
                  value={deductReason}
                  onChange={(e) => setDeductReason(e.target.value)}
                  placeholder="مثال: التأخر في تسليم المهام..." 
                  className="w-full p-3 rounded-xl bg-background border border-secondary/50 text-foreground"
                />
              </div>
            </div>
            <div className="flex flex-col gap-3 justify-end sm:min-w-48">
              <button 
                onClick={handleDeductTeam}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-red-500 text-white rounded-xl font-bold shadow-md hover:bg-red-600 transition-all"
              >
                <MinusCircle className="w-5 h-5" /> خصم النقاط
              </button>
              <button 
                onClick={handleResetTeam}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-background border-2 border-red-500/30 text-red-500 hover:bg-red-500/10 rounded-xl font-bold transition-all"
              >
                <RefreshCcw className="w-5 h-5" /> تصفير رصيد الفريق
              </button>
            </div>
          </div>

          <h3 className="text-lg font-bold text-foreground mb-4">سجل الخصومات والتصفير</h3>
          {team.logs && team.logs.length > 0 ? (
            <div className="flex flex-col gap-3">
              {team.logs.map(log => (
                <div key={log.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-secondary/10 border border-secondary/50 rounded-xl gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-2 py-1 rounded-md text-[10px] font-black tracking-wide ${log.type === "reset" ? "bg-red-500/20 text-red-600" : "bg-orange-500/20 text-orange-600"}`}>
                        {log.type === "reset" ? "تصفير شامل" : "خصم نقاط"}
                      </span>
                      <span className="text-xs text-foreground/50">{new Date(log.date).toLocaleDateString("ar-SA")}</span>
                    </div>
                    <p className="text-sm font-bold text-foreground">{log.reason || "لم يتم تحديد سبب"}</p>
                  </div>
                  <div className="font-mono font-black text-xl text-red-500 shrink-0">
                    -{log.amount} pt
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-foreground/50 border-2 border-dashed border-secondary rounded-2xl">
              لا يوجد سجل خصومات أو تصفير مسجل لهذا الفريق.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
