"use client";
import { isAdmin, isLeader, getRoleLabel } from "@/lib/roleUtils";

import { useAuth } from "@/lib/auth";
import { useScopedData as useData } from "@/lib/useScopedData";
import { Users, Info, ShieldAlert } from "lucide-react";

export default function MyTeamPage() {
  const { user } = useAuth();
  const { teams, users } = useData();
  
  if (!user || (user.role !== "member" && !isLeader(user.role))) return null;

  const myTeams = user.team_ids ? teams.filter(t => user.team_ids!.includes(t.id)) : [];

  if (myTeams.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center">
        <ShieldAlert className="w-16 h-16 text-red-500 mb-4" />
        <h2 className="text-2xl font-bold text-foreground">لست منضماً لأي فريق بعد</h2>
        <p className="text-foreground/60 mt-2">يرجى التواصل مع إدارة النادي لتعيينك في فريق.</p>
      </div>
    );
  }

  return (
    <div className="animate-[fade-in_0.5s_ease-out] flex flex-col gap-10 max-w-5xl mx-auto">
      {myTeams.map(myTeam => {
        const teamMembers = users.filter(u => u.team_ids?.includes(myTeam.id)).sort((a, b) => b.points - a.points);
        return (
          <div key={myTeam.id} className="flex flex-col gap-6">
      <div className="bg-background border border-secondary rounded-3xl p-8 shadow-sm flex items-start sm:items-center justify-between flex-col sm:flex-row gap-6 relative overflow-hidden">
        <div className="relative z-10">
          <h1 className="text-3xl font-black text-foreground mb-2 flex items-center gap-3">
            <Users className="w-8 h-8 text-primary" />
            {myTeam.name}
          </h1>
          <p className="text-foreground/70 flex items-center gap-2">
            <Info className="w-4 h-4" /> فريق مخصص للمبادرات والأنشطة الإبداعية بالنادي
          </p>
        </div>
        <div className="bg-primary/10 rounded-2xl p-6 text-center min-w-32 border border-primary/20 relative z-10">
          <span className="block text-3xl font-black text-primary">{myTeam.points}</span>
          <span className="text-sm font-semibold text-primary/80">إجمالي نقاط الفريق</span>
        </div>
        
        {/* Decorative background element matching team color roughly */}
        <div 
          className="absolute -left-20 -top-20 w-64 h-64 rounded-full blur-[100px] opacity-20 pointer-events-none"
          style={{ backgroundColor: myTeam.color_code }}
        />
      </div>

      <div className="bg-background border border-secondary rounded-3xl p-8 shadow-sm">
        <h2 className="text-xl font-bold text-foreground mb-6">أعضاء الفريق والترتيب الداخلي</h2>
        
        <div className="flex flex-col gap-3">
          {teamMembers.map((member, idx) => (
            <div 
              key={member.id} 
              className={`flex items-center justify-between p-4 rounded-2xl border transition-all hover:-translate-y-0.5 ${
                member.id === user.id 
                  ? 'bg-primary/5 border-primary/30 shadow-sm' 
                  : 'bg-secondary/10 border-secondary/50'
              }`}
            >
              <div className="flex items-center gap-4">
                <div className="w-8 h-8 rounded-full bg-secondary text-foreground flex items-center justify-center font-black text-sm">
                  {idx + 1}
                </div>
                <div className="w-12 h-12 rounded-full bg-primary/20 text-primary font-bold flex items-center justify-center text-lg">
                  {member.name.charAt(0)}
                </div>
                <div>
                  <h3 className="font-bold text-foreground inline-flex items-center gap-2">
                    {member.name}
                    {member.id === user.id && <span className="text-xs px-2 py-0.5 bg-primary/20 text-primary rounded-full">أنت</span>}
                  </h3>
                  <p className="text-sm text-foreground/50">{member.email}</p>
                </div>
              </div>
              <div className="font-mono font-bold text-lg text-primary">{member.points} pt</div>
            </div>
          ))}
        </div>
            </div>

          {/* Team Deduction Logs */}
          {myTeam.logs && myTeam.logs.length > 0 && (
            <div className="bg-background border border-red-500/20 rounded-3xl p-8 shadow-sm relative overflow-hidden mt-6">
              <div className="absolute top-0 right-0 w-full h-1 bg-red-500/50" />
              <h2 className="text-xl font-bold text-red-500 mb-6 flex items-center gap-2">
                <ShieldAlert className="w-6 h-6" /> سجل خصومات الفريق
              </h2>
              
              <div className="flex flex-col gap-3">
                {myTeam.logs.map(log => (
                  <div key={log.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-red-500/5 border border-red-500/10 rounded-xl gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`px-2 py-1 rounded-md text-[10px] font-black tracking-wide ${log.type === "reset" ? "bg-red-500/20 text-red-600" : "bg-orange-500/20 text-orange-600"}`}>
                          {log.type === "reset" ? "تصفير شامل" : "خصم نقاط"}
                        </span>
                        <span className="text-xs text-foreground/50">{new Date(log.date).toLocaleDateString("ar-SA")}</span>
                      </div>
                      <p className="text-sm font-bold text-foreground">{log.reason || "إجراء إداري (لم يُذكر سبب)"}</p>
                    </div>
                    <div className="font-mono font-black text-xl text-red-500 shrink-0 flex items-center gap-1">
                      <span className="text-sm font-sans opacity-70">تم خصم</span>
                      {log.amount} pt
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        );
      })}
    </div>
  );
}
