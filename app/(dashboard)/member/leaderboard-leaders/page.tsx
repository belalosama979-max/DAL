"use client";
import { isAdmin, isLeader, getRoleLabel } from "@/lib/roleUtils";

import { useAuth } from "@/lib/auth";
import { useScopedData as useData } from "@/lib/useScopedData";
import { Trophy, Medal, Star } from "lucide-react";

export default function LeaderboardLeadersPage() {
  const { user } = useAuth();
  const { users } = useData();

  // Only allow admin and leader to see this
  if (!user || (!isAdmin(user.role) && !isLeader(user.role))) return null;

  // Filter only leaders
  const sortedLeaders = users
    .filter(u => u.role === "leader")
    .sort((a, b) => b.points - a.points); // Ascending points

  return (
    <div className="animate-[fade-in_0.5s_ease-out] flex flex-col gap-6 max-w-4xl mx-auto">
      <div className="flex flex-col items-center justify-center py-10 bg-linear-to-b from-yellow-500/20 to-transparent rounded-3xl border border-yellow-500/20 shadow-sm relative overflow-hidden">
        <Star className="w-48 h-48 absolute -right-10 -top-10 text-yellow-500/10 rotate-12" />
        <Trophy className="w-64 h-64 absolute -left-10 -bottom-10 text-yellow-500/10 -rotate-12" />
        
        <div className="bg-yellow-500/20 p-4 rounded-full mb-4 animate-bounce relative z-10">
          <Trophy className="w-12 h-12 text-yellow-600" />
        </div>
        <h1 className="text-4xl md:text-5xl font-black text-foreground mb-4 relative z-10 text-center">
          لوحة شرف القادة
        </h1>
        <p className="text-foreground/70 max-w-lg text-center font-bold text-lg relative z-10">
          هنا يتنافس رؤساء الفرق على المركز الأول! أثبت جدارتك واستحقاقك للقيادة.
        </p>
      </div>

      <div className="flex flex-col gap-4 mt-4">
        {sortedLeaders.length === 0 ? (
          <p className="text-center py-6 text-foreground/50 border-2 border-dashed border-secondary rounded-2xl">لا يوجد رؤساء فرق حالياً.</p>
        ) : sortedLeaders.map((leader, index) => (
          <div 
            key={leader.id} 
            className={`flex items-center justify-between p-5 rounded-2xl border transition-all ${
              index === 0 
                ? "bg-linear-to-r from-yellow-500/20 to-yellow-500/5 border-yellow-500 shadow-lg shadow-yellow-500/10 scale-[1.02]" 
                : index === 1
                ? "bg-secondary/20 border-secondary/50"
                : index === 2
                ? "bg-secondary/10 border-secondary/30"
                : "bg-background border-secondary/20 opacity-80"
            }`}
          >
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className={`w-14 h-14 rounded-full flex items-center justify-center font-bold text-xl shadow-sm ${
                  index === 0 ? "bg-yellow-500 text-white" : "bg-primary/20 text-primary"
                }`}>
                  {leader.name.charAt(0)}
                </div>
                {index < 3 && (
                  <div className={`absolute -top-2 -right-2 w-7 h-7 rounded-full flex items-center justify-center shadow-md border-2 border-background ${
                    index === 0 ? "bg-yellow-400 text-white" :
                    index === 1 ? "bg-gray-400 text-white" :
                    "bg-orange-400 text-white"
                  }`}>
                    <Medal className="w-4 h-4" />
                  </div>
                )}
              </div>
              
              <div>
                <div className="flex items-center gap-2">
                  <h3 className={`font-black text-lg ${index === 0 ? "text-yellow-600" : "text-foreground"}`}>
                    {leader.name}
                  </h3>
                  {user.id === leader.id && (
                    <span className="px-2 py-0.5 text-[10px] bg-primary text-primary-foreground rounded border border-primary/50 shadow-sm">
                      أنت
                    </span>
                  )}
                </div>
                <p className="text-sm font-bold text-foreground/50">المركز {index + 1}</p>
              </div>
            </div>

            <div className="flex flex-col items-end">
              <div className={`text-3xl font-black font-mono ${
                index === 0 ? "text-yellow-500 drop-shadow-sm" : "text-primary"
              }`}>
                {leader.points}
              </div>
              <span className="text-xs font-bold text-foreground/50">نقطة</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
