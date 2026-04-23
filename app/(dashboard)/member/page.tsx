"use client";
import { isLeader } from "@/lib/roleUtils";

import { useAuth } from "@/lib/auth";
import { useScopedData as useData } from "@/lib/useScopedData";
import { Trophy, Star, Bell, Users, CheckCircle2, Clock, RotateCcw, Crown, Medal } from "lucide-react";
import { CountdownTimer } from "@/components/CountdownTimer";
import { SuggestionBox } from "@/components/SuggestionBox";

export default function MemberDashboard() {
  const { user } = useAuth();
  const { users, teams, announcements, tasks, toggleTaskStatus } = useData();

  if (!user || (user.role !== "member" && !isLeader(user.role)))
    return <div>غير مصرح</div>;

  const currentPoints = users.find((u) => u.id === user.id)?.points || 0;
  const myTeams = user.team_ids
    ? teams.filter((t) => user.team_ids!.includes(t.id))
    : [];

  // مهام هذا العضو فقط
  const myTasks = tasks.filter((t) => t.assigned_to === user.id);

  // تصفية الإعلانات: المنتهية تختفي تلقائياً
  const now = Date.now();
  const visibleAnnouncements = announcements.filter((a) => {
    if (a.deadline && new Date(a.deadline).getTime() <= now) return false;
    if (a.deadline && new Date(a.deadline).getTime() <= now) return false;
    return true;
  });

  const rankedTeams = [...teams].sort((a, b) => b.points - a.points);

  const getRankIcon = (index: number) => {
    switch (index) {
      case 0: return <Crown className="w-6 h-6 text-yellow-400" />;
      case 1: return <Medal className="w-6 h-6 text-gray-400" />;
      case 2: return <Medal className="w-6 h-6 text-amber-700" />;
      default: return <span className="font-bold text-foreground/50 w-6 text-center">{index + 1}</span>;
    }
  };

  return (
    <div className="animate-[fade-in_0.5s_ease-out] flex flex-col gap-8">
      <SuggestionBox />

      {/* Hero / Quick Stats */}
      <div className="bg-linear-to-r from-primary to-accent rounded-3xl p-8 shadow-xl text-primary-foreground relative overflow-hidden">
        <div className="absolute right-[-10%] top-[-50%] w-[50%] h-[200%] bg-white/10 rotate-12 blur-2xl"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h2 className="text-3xl font-black mb-2 flex items-center gap-2">
              <Star className="w-8 h-8 text-yellow-300 fill-yellow-300" />
              أهلاً بك يا {user.name.split(" ")[0]}!
            </h2>
            <p className="text-primary-foreground/80 text-lg">
              استمر في تألقك، مجموع نقاطك الحالي:
            </p>
          </div>
          <div className="bg-background/20 backdrop-blur-md rounded-2xl px-8 py-4 border border-white/20 text-center">
            <span className="block text-4xl font-black">{currentPoints}</span>
            <span className="text-sm font-semibold text-white/80">نقطة إجمالية</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        <div className="lg:col-span-2 flex flex-col gap-8">
          {myTeams.length > 0 ? (
            myTeams.map((myTeam) => {
              const teamMembers = users
                .filter((u) => u.team_ids?.includes(myTeam.id))
                .sort((a, b) => b.points - a.points); // Sort descending by points
              
              return (
                <div
                  key={myTeam.id}
                  className="bg-background border border-secondary rounded-3xl p-8 shadow-sm"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
                    <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
                      <Trophy className="w-6 h-6 text-yellow-500" />
                      لوحة الشرف: {myTeam.name}
                    </h3>
                    <div className="flex flex-col items-end gap-2">
                      <div className="px-4 py-2 rounded-xl bg-secondary/30 border border-secondary text-sm font-bold text-foreground flex items-center gap-2 shadow-sm">
                        إجمالي نقاط الفريق: <span className="text-primary font-mono text-base">{myTeam.points}</span>
                      </div>
                      {myTeam.motivation_deadline && !myTeam.motivation_handled && (
                        <div className="px-3 py-1.5 rounded-lg bg-orange-500/10 text-orange-600 border border-orange-500/20 text-xs font-bold flex items-center gap-2">
                          <Clock className="w-3.5 h-3.5" />
                          نهاية التقييم: <CountdownTimer deadline={myTeam.motivation_deadline} />
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col gap-3">
                    {teamMembers.map((m, index) => (
                      <div
                        key={m.id}
                        className={`flex items-center gap-4 p-4 rounded-2xl border transition-all ${
                          index === 0 ? "bg-yellow-500/10 border-yellow-500/30 shadow-md transform hover:-translate-y-1" : 
                          index === 1 ? "bg-gray-400/10 border-gray-400/30 shadow-sm" :
                          index === 2 ? "bg-amber-700/10 border-amber-700/30 shadow-sm" :
                          "bg-secondary/10 border-secondary/50 hover:bg-secondary/30"
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shrink-0 shadow-sm ${
                          index === 0 ? "bg-yellow-500 text-white" :
                          index === 1 ? "bg-gray-400 text-white" :
                          index === 2 ? "bg-amber-700 text-white" :
                          "bg-secondary text-foreground/70"
                        }`}>
                          {index + 1}
                        </div>
                        <div className="w-10 h-10 rounded-full bg-background flex items-center justify-center font-bold text-sm shadow-sm shrink-0 border border-secondary/50">
                          {m.name.substring(0, 1)}
                        </div>
                        <div className="flex-1">
                          <p className="font-bold text-foreground text-sm flex items-center gap-2">
                            {m.name} 
                            {m.id === user.id && <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-md text-[10px]">(أنت)</span>}
                          </p>
                        </div>
                        <div className="text-left shrink-0">
                          <p className={`font-mono font-bold text-lg ${
                            index === 0 ? "text-yellow-600 dark:text-yellow-400" :
                            index === 1 ? "text-gray-600 dark:text-gray-300" :
                            index === 2 ? "text-amber-700 dark:text-amber-500" :
                            "text-primary"
                          }`}>
                            {m.points} <span className="text-xs font-sans opacity-70">pt</span>
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="bg-background border border-secondary rounded-3xl p-8 shadow-sm text-center text-foreground/50">
              لست منضماً لأي فريق بعد.
            </div>
          )}

          <div className="bg-background border border-secondary rounded-3xl p-8 shadow-sm">
            <h3 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
              <Trophy className="w-6 h-6 text-yellow-500" />
              المهام والإنجازات الحالية
            </h3>
            {myTasks.length === 0 ? (
              <div className="text-center py-10 text-foreground/50 border-2 border-dashed border-secondary rounded-2xl">
                لا توجد مهام مسجلة حالياً. تواصل مع مدير الفريق.
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {myTasks.map((task) => (
                  <div
                    key={task.id}
                    className={`p-4 rounded-2xl border flex items-center justify-between gap-3 transition-all ${
                      task.status === "completed"
                        ? "bg-green-500/5 border-green-500/30"
                        : "bg-secondary/10 border-secondary/50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {task.status === "completed" ? (
                        <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
                      ) : (
                        <Clock className="w-5 h-5 text-orange-400 shrink-0" />
                      )}
                      <div>
                        <p className={`font-bold text-sm ${
                          task.status === "completed" ? "line-through opacity-60" : "text-foreground"
                        }`}>{task.title}</p>
                        <p className="text-xs text-primary font-mono font-bold">+{task.points} pt</p>
                      </div>
                    </div>
                    <button
                      onClick={() => toggleTaskStatus(task.id)}
                      className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 shrink-0 ${
                        task.status === "completed"
                          ? "bg-red-500/10 text-red-500 hover:bg-red-500/20"
                          : "bg-primary/10 text-primary hover:bg-primary/20"
                      }`}
                    >
                      {task.status === "completed"
                        ? <><RotateCcw className="w-3 h-3" /> إلغاء</>
                        : <><CheckCircle2 className="w-3 h-3" /> إكمال</>
                      }
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="flex flex-col gap-8">
          
          {/* Top Teams */}
          <div className="bg-background border border-secondary rounded-3xl p-8 shadow-sm h-fit">
            <h3 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
              <Trophy className="w-6 h-6 text-primary" />
              أفضل الفرق
            </h3>
            <div className="flex flex-col gap-3">
              {rankedTeams.map((team, idx) => (
                <div 
                  key={team.id} 
                  className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${
                    user.team_ids?.includes(team.id)
                      ? "bg-primary/5 border-primary/30 shadow-sm" 
                      : "bg-background border-secondary/50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-6 shrink-0">
                      {getRankIcon(idx)}
                    </div>
                    <div>
                      <h4 className="font-bold text-foreground flex items-center gap-2 text-sm">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: team.color_code }} />
                        {team.name}
                      </h4>
                    </div>
                  </div>
                  <div className="font-mono font-black text-base text-foreground">{team.points}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Announcements */}
          <div className="bg-background border border-secondary rounded-3xl p-8 shadow-sm h-fit">
            <h3 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
              <Bell className="w-6 h-6 text-accent" />
              أحدث الإعلانات
            </h3>
            <div className="flex flex-col gap-4">
              {visibleAnnouncements.length === 0 ? (
                <div className="text-center py-8 text-foreground/40 text-sm">
                  لا توجد إعلانات حالية.
                </div>
              ) : (
                visibleAnnouncements.map((a) => (
                  <div
                    key={a.id}
                    className="pb-4 border-b border-secondary/50 last:border-0 last:pb-0"
                  >
                    <h4 className="font-bold text-foreground mb-1 text-sm">
                      {a.title}
                    </h4>
                    <p className="text-foreground/60 text-xs leading-relaxed mb-1">
                      {a.content}
                    </p>
                    <p className="text-[#a1a1aa] text-[10px]">{a.date}</p>
                    <CountdownTimer
                      start_time={a.start_time}
                      deadline={a.deadline}
                    />
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
