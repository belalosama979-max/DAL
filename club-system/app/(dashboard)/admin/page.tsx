"use client";
import { isAdmin } from "@/lib/roleUtils";

import { useAuth } from "@/lib/auth";
import { useScopedData as useData } from "@/lib/useScopedData";
import { Users, Activity, Target } from "lucide-react";
import { CountdownTimer } from "@/components/CountdownTimer";
import { SuggestionBox } from "@/components/SuggestionBox";

export default function AdminDashboard() {
  const { user } = useAuth();
  const { users, teams, announcements } = useData();
  
  if (!user || !isAdmin(user.role)) return <div>غير مصرح</div>;

  const now = Date.now();
  const activeAnnouncements = announcements.filter((a) => {
    if (a.deadline && new Date(a.deadline).getTime() <= now) return false;
    return true;
  });

  return (
    <div className="animate-[fade-in_0.5s_ease-out]">
      <SuggestionBox />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        
        {/* Stats Cards */}
        <div className="bg-background border border-secondary rounded-3xl p-6 shadow-sm flex items-center gap-5">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
            <Users className="w-7 h-7" />
          </div>
          <div>
            <p className="text-foreground/60 font-medium mb-1">إجمالي الأعضاء</p>
            <p className="text-3xl font-black text-foreground">{users.length}</p>
          </div>
        </div>

        <div className="bg-background border border-secondary rounded-3xl p-6 shadow-sm flex items-center gap-5">
          <div className="w-14 h-14 rounded-2xl bg-accent/10 text-accent flex items-center justify-center">
            <Activity className="w-7 h-7" />
          </div>
          <div>
            <p className="text-foreground/60 font-medium mb-1">عدد الفرق</p>
            <p className="text-3xl font-black text-foreground">{teams.length}</p>
          </div>
        </div>

        <div className="bg-background border border-secondary rounded-3xl p-6 shadow-sm flex items-center gap-5">
          <div className="w-14 h-14 rounded-2xl bg-pink-500/10 text-pink-500 flex items-center justify-center">
            <Target className="w-7 h-7" />
          </div>
          <div>
            <p className="text-foreground/60 font-medium mb-1">الإعلانات النشطة</p>
            <p className="text-3xl font-black text-foreground">{activeAnnouncements.length}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Members */}
        <div className="bg-background border border-secondary rounded-3xl p-8 shadow-sm">
          <h3 className="text-xl font-bold text-foreground mb-6">الأعضاء والتصنيف الحالي</h3>
          <div className="flex flex-col gap-4">
            {users.filter(u => u.role !== 'admin').slice(0, 5).map((u) => (
              <div key={u.id} className="flex items-center justify-between p-4 bg-secondary/30 rounded-2xl border border-secondary/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/20 text-primary font-bold flex items-center justify-center">
                    {u.name.substring(0, 1)}
                  </div>
                  <div>
                    <h4 className="font-bold text-foreground">{u.name}</h4>
                    <p className="text-sm text-foreground/60">{u.team_ids?.length ? u.team_ids.map(id => teams.find(t => t.id === id)?.name).filter(Boolean).join(", ") : "بدون فريق"}</p>
                  </div>
                </div>
                <div className="font-mono font-bold text-primary">{u.points} pt</div>
              </div>
            ))}
          </div>
        </div>

        {/* Announcements */}
        <div className="bg-background border border-secondary rounded-3xl p-8 shadow-sm">
          <h3 className="text-xl font-bold text-foreground mb-6">أحدث الإعلانات</h3>
          <div className="flex flex-col gap-4">
            {activeAnnouncements.length === 0 ? (
              <div className="text-center py-8 text-foreground/40 text-sm">لا توجد إعلانات نشطة.</div>
            ) : activeAnnouncements.slice(0, 4).map((a) => (
              <div key={a.id} className={`p-5 rounded-2xl border-r-4 ${
                a.type === 'warning' ? 'border-r-red-500 bg-red-500/5' :
                a.type === 'success' ? 'border-r-green-500 bg-green-500/5' :
                'border-r-primary bg-primary/5'
              } border border-secondary/50`}>
                <h4 className="font-bold text-foreground mb-2 flex items-center justify-between">
                  {a.title}
                  <span className="text-xs text-foreground/50 font-normal">{a.date}</span>
                </h4>
                <p className="text-foreground/70 text-sm leading-relaxed">{a.content}</p>
                <CountdownTimer start_time={a.start_time} deadline={a.deadline} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
