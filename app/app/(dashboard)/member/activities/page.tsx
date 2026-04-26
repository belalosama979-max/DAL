"use client";

import { useAuth } from "@/lib/auth";
import { useScopedData as useData } from "@/lib/useScopedData";
import { CheckCircle2, Clock, CalendarDays, Activity, RotateCcw } from "lucide-react";

export default function ActivitiesPage() {
  const { user } = useAuth();
  const { tasks, toggleTaskStatus } = useData();

  if (!user) return null;

  // الأعضاء يرون مهامهم فقط، المسؤولون يرون كل المهام من نفس الجنس
  const myTasks = (user.role === "member" || user.role === "vice_leader")
    ? tasks.filter((t) => t.assigned_to === user.id)
    : tasks; // المسؤولون يرون الكل

  const completedCount = myTasks.filter((t) => t.status === "completed").length;
  const totalPoints = myTasks
    .filter((t) => t.status === "completed")
    .reduce((sum, t) => sum + t.points, 0);

  return (
    <div className="animate-[fade-in_0.5s_ease-out] flex flex-col gap-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-2">
        <Activity className="w-8 h-8 text-primary" />
        <h1 className="text-3xl font-black text-foreground">المهام والأنشطة</h1>
      </div>

      {/* إحصائيات سريعة */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-background border border-secondary rounded-2xl p-4 text-center shadow-sm">
          <p className="text-2xl font-black text-foreground">{myTasks.length}</p>
          <p className="text-xs text-foreground/50 font-semibold mt-1">إجمالي المهام</p>
        </div>
        <div className="bg-background border border-green-500/30 rounded-2xl p-4 text-center shadow-sm">
          <p className="text-2xl font-black text-green-600">{completedCount}</p>
          <p className="text-xs text-foreground/50 font-semibold mt-1">مكتملة</p>
        </div>
        <div className="bg-background border border-primary/30 rounded-2xl p-4 text-center shadow-sm">
          <p className="text-2xl font-black text-primary">{totalPoints}</p>
          <p className="text-xs text-foreground/50 font-semibold mt-1">نقاط محققة</p>
        </div>
      </div>

      <div className="bg-background border border-secondary rounded-3xl p-8 shadow-sm">
        <h2 className="text-xl font-bold text-foreground mb-6">قائمة مهامك الحالية</h2>

        <div className="flex flex-col gap-4">
          {myTasks.length === 0 ? (
            <div className="text-center p-12 text-foreground/50 border-2 border-dashed border-secondary rounded-2xl font-medium">
              لا توجد مهام مسجلة حالياً
            </div>
          ) : (
            myTasks.map((task) => (
              <div
                key={task.id}
                className={`p-5 rounded-2xl border transition-all ${
                  task.status === "completed"
                    ? "bg-green-500/5 border-green-500/30"
                    : "bg-secondary/20 border-secondary hover:border-primary/50"
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    {task.status === "completed" ? (
                      <CheckCircle2 className="w-6 h-6 text-green-500 mt-1 shrink-0" />
                    ) : (
                      <Clock className="w-6 h-6 text-orange-500 mt-1 shrink-0" />
                    )}
                    <div>
                      <h3 className={`font-bold text-lg ${task.status === "completed" ? "text-foreground line-through opacity-70" : "text-foreground"}`}>
                        {task.title}
                      </h3>
                      {task.description && (
                        <p className="text-sm text-foreground/60 mt-1">{task.description}</p>
                      )}
                      <div className="flex items-center gap-2 mt-2 text-sm text-foreground/60">
                        <CalendarDays className="w-4 h-4" />
                        <span>{task.deadline || task.date}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-auto flex-wrap justify-end">
                    <span className="font-mono font-bold px-3 py-1 bg-background rounded-lg border border-secondary text-primary">
                      +{task.points} pt
                    </span>
                    <span className={`px-3 py-1 rounded-lg text-xs font-bold ${
                      task.status === "completed"
                        ? "bg-green-500/20 text-green-600 dark:text-green-400"
                        : "bg-orange-500/20 text-orange-600 dark:text-orange-400"
                    }`}>
                      {task.status === "completed" ? "مكتملة ✓" : "بانتظار الإنجاز"}
                    </span>

                    {/* زر toggle - للعضو على مهامه فقط، وللمسؤولين على أي مهمة */}
                    {(task.assigned_to === user.id || user.role !== "member") && (
                      <button
                        onClick={() => toggleTaskStatus(task.id)}
                        title={task.status === "completed" ? "إلغاء الإكمال" : "تعيين كمكتملة"}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                          task.status === "completed"
                            ? "bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/20"
                            : "bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20"
                        }`}
                      >
                        {task.status === "completed" ? (
                          <><RotateCcw className="w-3 h-3" /> إلغاء الإكمال</>
                        ) : (
                          <><CheckCircle2 className="w-3 h-3" /> تعيين كمكتملة</>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
