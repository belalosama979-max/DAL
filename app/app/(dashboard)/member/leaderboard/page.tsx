"use client";
import { isAdmin, isLeader, getRoleLabel } from "@/lib/roleUtils";

import { useAuth } from "@/lib/auth";
import { useScopedData as useData } from "@/lib/useScopedData";
import { Award, Medal, Crown } from "lucide-react";

export default function LeaderboardPage() {
  const { user } = useAuth();
  const { users, teams } = useData();
  
  if (!user || (user.role !== "member" && !isLeader(user.role))) return null;

  // Global ranking
  const rankedUsers = [...users]
    .filter(u => u.role === "member")
    .sort((a, b) => b.points - a.points);
    
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
    <div className="animate-[fade-in_0.5s_ease-out] flex flex-col gap-8 max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-2">
        <Award className="w-8 h-8 text-primary" />
        <h1 className="text-3xl font-black text-foreground">لوحة الشرف</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Top Members */}
        <div className="bg-background border border-secondary rounded-3xl p-8 shadow-sm">
          <h2 className="text-xl font-bold text-foreground mb-6">أفضل الأعضاء (ترتيب عام)</h2>
          
          <div className="flex flex-col gap-4">
            {rankedUsers.map((u, idx) => (
              <div 
                key={u.id} 
                className={`flex items-center justify-between p-4 rounded-2xl transition-all ${
                  u.id === user.id 
                    ? "bg-primary/10 border border-primary/30 scale-105 shadow-md z-10" 
                    : "bg-secondary/20 border border-transparent"
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className="flex items-center justify-center w-8 shrink-0">
                    {getRankIcon(idx)}
                  </div>
                  <div className="w-10 h-10 rounded-full bg-primary/20 text-primary font-bold flex items-center justify-center">
                    {u.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground">
                      {u.name} {u.id === user.id && <span className="text-xs font-normal text-primary ml-1">(أنت)</span>}
                    </h3>
                    <p className="text-xs text-foreground/50">
                      {u.team_ids && u.team_ids.length > 0 
                        ? u.team_ids.map(id => teams.find(t => t.id === id)?.name).filter(Boolean).join("، ")
                        : "لا ينتمي لفريق"}
                    </p>
                  </div>
                </div>
                <div className="font-mono font-black text-lg text-primary">{u.points}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Teams */}
        <div className="bg-background border border-secondary rounded-3xl p-8 shadow-sm h-fit">
          <h2 className="text-xl font-bold text-foreground mb-6">أفضل الفرق</h2>
          
          <div className="flex flex-col gap-4">
            {rankedTeams.map((team, idx) => (
              <div 
                key={team.id} 
                className={`flex items-center justify-between p-4 rounded-2xl border ${
                  user.team_ids?.includes(team.id)
                    ? "bg-primary/5 border-primary/30" 
                    : "bg-background border-secondary"
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className="flex items-center justify-center w-8 shrink-0">
                    {getRankIcon(idx)}
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: team.color_code }} />
                      {team.name}
                    </h3>
                  </div>
                </div>
                <div className="font-mono font-black text-lg text-foreground">{team.points}</div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
