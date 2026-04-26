"use client";
import { isAdmin, isLeader, getRoleLabel } from "@/lib/roleUtils";

import { useAuth } from "@/lib/auth";
import { useScopedData as useData } from "@/lib/useScopedData";
import { Users, ChevronDown, CheckCircle2, MinusCircle, RefreshCcw } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/components/ToastProvider";

export default function LeaderManageTeamPage() {
  const { user } = useAuth();
  const { users, criteria, evaluateUser, resetUserPoints } = useData();
  const { toast } = useToast();
  const [pointsInput, setPointsInput] = useState<Record<string, string>>({});
  const [criteriaInput, setCriteriaInput] = useState<Record<string, string>>({});

  if (!user || !isLeader(user.role)) return null; // Only leaders can access

  // Team Leader can only evaluate users who share a team with them
  // Assuming a team leader has `team_ids` representing the teams they manage
  const leaderTeams = user.team_ids || [];
  
  // Members who are in at least one of the leader's teams, and are NOT admins or other leaders (or maybe they can evaluate other leaders in their team? Usually just members)
  const teamMembers = users.filter(u => 
    u.id !== user.id && 
    u.role === "member" &&
    u.team_ids?.some(id => leaderTeams.includes(id))
  );

  const memberCriteria = criteria.filter(c => c.target === "member");

  const handleEvaluate = (userId: string) => {
    const pts = parseInt(pointsInput[userId]);
    if (!pts || isNaN(pts) || pts <= 0) { toast("أدخل قيمة صحيحة للنقاط", "error"); return; }
    const crit = criteriaInput[userId];
    if (!crit) { toast("اختر معياراً للتقييم", "warning"); return; }

    // The point goes directly to the user's overall points. 
    // And possibly to their team. If they share a team, could pick one, but assuming it goes to user's first shared team.
    const member = teamMembers.find(m => m.id === userId);
    const sharedTeamId = member?.team_ids?.find(id => leaderTeams.includes(id));

    evaluateUser(userId, pts, sharedTeamId);
    setPointsInput(prev => ({ ...prev, [userId]: "" }));
    setCriteriaInput(prev => ({ ...prev, [userId]: "" }));
    toast("تم التقييم بنجاح وإضافة النقاط ✓", "success");
  };

  const handleDeduct = (userId: string) => {
    const pts = parseInt(pointsInput[userId]);
    if (!pts || isNaN(pts) || pts <= 0) { toast("أدخل قيمة صحيحة لخصم النقاط", "error"); return; }
    
    evaluateUser(userId, -pts); // targetTeamId not strictly needed for negative points but you can optionally reduce team points too
    setPointsInput(prev => ({ ...prev, [userId]: "" }));
    setCriteriaInput(prev => ({ ...prev, [userId]: "" }));
    toast("تم خصم النقاط بنجاح", "success");
  };

  const handleReset = async (userId: string) => {
    if (await confirm("هل أنت متأكد من تصفير نقاط هذا العضو نهائياً؟")) {
      resetUserPoints(userId);
      toast("تم تصفير النقاط", "success");
    }
  };

  return (
    <div className="animate-[fade-in_0.5s_ease-out] flex flex-col gap-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-2">
        <Users className="w-8 h-8 text-primary" />
        <h1 className="text-3xl font-black text-foreground">لوحة تحكم القائد</h1>
      </div>

      <div className="bg-background border border-secondary rounded-3xl p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between border-b border-secondary/50 pb-6 mb-6">
          <div>
            <h2 className="text-xl font-bold text-foreground">تقييم أعضاء فريقي</h2>
            <p className="text-foreground/60 text-sm mt-1">تستطيع هنا تقييم وإضافة النقاط لأعضاء الفرق التي تشرف عليها.</p>
          </div>
          <button className="px-5 py-2.5 bg-primary text-primary-foreground rounded-xl font-bold flex items-center justify-center gap-2 shadow-md hover:bg-primary/90 transition-all">
            اعتماد التقييمات الشاملة <CheckCircle2 className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-4">
          {teamMembers.length === 0 ? (
            <p className="text-center py-6 text-foreground/50 border-2 border-dashed border-secondary rounded-2xl">لا يوجد أعضاء في فريقك حالياً.</p>
          ) : teamMembers.map(m => (
            <div key={m.id} className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-secondary/10 border border-secondary/50 rounded-2xl gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold">
                  {m.name.charAt(0)}
                </div>
                <div>
                  <h3 className="font-bold text-foreground text-sm">{m.name}</h3>
                  <p className="text-xs text-foreground/50">رصيد النقاط: <span className="font-mono text-primary font-bold">{m.points} pt</span></p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 w-full justify-end flex-wrap items-end xl:flex-nowrap xl:w-auto">
                <div className="relative w-full xl:w-48">
                  <select 
                    value={criteriaInput[m.id] || ""}
                    onChange={(e) => setCriteriaInput(prev => ({...prev, [m.id]: e.target.value}))}
                    className="appearance-none bg-background border border-secondary text-foreground py-2.5 pl-10 pr-4 rounded-xl text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none w-full transition-all"
                  >
                    <option value="">اختر معياراً...</option>
                    {memberCriteria.map(c => (

                      <option key={c.id} value={c.id}>{c.title}</option>
                    ))}
                  </select>
                  <ChevronDown className="w-5 h-5 absolute left-3 top-2.5 text-foreground/50 pointer-events-none" />
                </div>
                
                <div className="flex w-full gap-3 md:col-span-2 xl:col-span-1 xl:w-auto xl:justify-end">
                  <input 
                    type="number" 
                    placeholder="النقاط" 
                    value={pointsInput[m.id] || ""}
                    onChange={(e) => setPointsInput(prev => ({...prev, [m.id]: e.target.value}))}
                    className="w-full xl:w-28 bg-background border border-secondary text-foreground py-2.5 px-4 rounded-xl text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-center font-mono font-bold"
                    min="0" max="100"
                  />
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleEvaluate(m.id)}
                      className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-2.5 rounded-xl text-sm font-black transition-all shadow-md shrink-0 flex-1"
                    >
                      مكافأة
                    </button>
                    <button 
                      onClick={() => handleDeduct(m.id)}
                      className="bg-red-500/10 text-red-500 hover:bg-red-500/20 px-3 py-2.5 rounded-xl transition-all shadow-sm flex items-center justify-center shrink-0" 
                      title="خصم"
                    >
                      <MinusCircle className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleReset(m.id)}
                      className="bg-foreground/5 text-foreground/50 hover:bg-foreground/10 hover:text-foreground px-3 py-2.5 rounded-xl transition-all shadow-sm flex items-center justify-center shrink-0" 
                      title="تصفير"
                    >
                      <RefreshCcw className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
