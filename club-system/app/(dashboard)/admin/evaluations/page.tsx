"use client";
import { isAdmin, isLeader, getRoleLabel } from "@/lib/roleUtils";

import { useAuth } from "@/lib/auth";
import { useScopedData as useData } from "@/lib/useScopedData";
import { Award, CheckCircle2, ChevronDown, ListTodo, Plus, X, CalendarDays, RotateCcw, Trash2, RefreshCcw, MinusCircle } from "lucide-react";
import { useState } from "react";
import { Task } from "@/lib/mockData";
import { useToast } from "@/components/ToastProvider";

type Tab = "evaluations" | "tasks";

export default function AdminEvaluationsPage() {
  const { user } = useAuth();
  const { users, teams, criteria, evaluateUser, tasks, addTask, toggleTaskStatus, deleteTask, resetUserPoints } = useData();
  const { toast, confirm } = useToast();

  const [activeTab, setActiveTab] = useState<Tab>("evaluations");

  // --- Evaluation state ---
  const [pointsInput, setPointsInput] = useState<Record<string, string>>({});
  const [criteriaInput, setCriteriaInput] = useState<Record<string, string>>({});
  const [teamInput, setTeamInput] = useState<Record<string, string>>({});
  const [leaderPointsInput, setLeaderPointsInput] = useState<Record<string, string>>({});
  const [leaderCriteriaInput, setLeaderCriteriaInput] = useState<Record<string, string>>({});

  // --- Task modal state ---
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDesc, setTaskDesc] = useState("");
  const [taskPoints, setTaskPoints] = useState("");
  const [taskAssignedTo, setTaskAssignedTo] = useState("");
  const [taskTeamId, setTaskTeamId] = useState("");
  const [taskDeadline, setTaskDeadline] = useState("");

  if (!user || (!isAdmin(user.role) && !isLeader(user.role))) return null;

  const leaders = users.filter(u => u.role === "leader");
  
  const standardMembers = isAdmin(user.role)
    ? users.filter(u => u.id !== user.id && (u.role === "member" || (u.team_ids && u.team_ids.length > 0)))
    : users.filter(u => u.id !== user.id && u.team_ids?.some(tid => user.team_ids?.includes(tid)));

  const memberCriteria = criteria.filter(c => c.target === "member");
  const leaderCriteria = criteria.filter(c => c.target === "leader");

  // من يمكن تكليفهم: جميع من في الفريق (بالنسبة لمسؤول الفريق)، أو الجميع (بالنسبة للرئيس)
  const assignableUsers = isAdmin(user.role)
    ? users.filter(u => u.id !== user.id && u.role !== "admin")
    : users.filter(u => u.id !== user.id && u.team_ids?.some(tid => user.team_ids?.includes(tid)));

  const visibleTasks = isAdmin(user.role)
    ? tasks
    : tasks.filter(t => t.team_id && user.team_ids?.includes(t.team_id) || t.assigned_by === user.id);

  const handleEvaluate = (userId: string, isLeaderSection: boolean = false) => {
    const pts = parseInt(isLeaderSection ? leaderPointsInput[userId] : pointsInput[userId]);
    if (!pts || isNaN(pts) || pts <= 0) { toast("أدخل قيمة صحيحة للنقاط", "error"); return; }
    const crit = isLeaderSection ? leaderCriteriaInput[userId] : criteriaInput[userId];
    if (!crit) { toast("اختر معياراً للتقييم", "warning"); return; }
    const targetTeamId = teamInput[userId];
    const userTeams = users.find(u => u.id === userId)?.team_ids || [];
    if (!isLeaderSection && userTeams.length > 0 && !targetTeamId) { toast("حدد الفريق الذي ستذهب إليه النقاط.", "warning"); return; }
    evaluateUser(userId, pts, targetTeamId);
    if (isLeaderSection) {
      setLeaderPointsInput(prev => ({ ...prev, [userId]: "" }));
      setLeaderCriteriaInput(prev => ({ ...prev, [userId]: "" }));
    } else {
      setPointsInput(prev => ({ ...prev, [userId]: "" }));
      setCriteriaInput(prev => ({ ...prev, [userId]: "" }));
    }
    setTeamInput(prev => ({ ...prev, [userId]: "" }));
    toast("تم التقييم بنجاح وإضافة النقاط ✓", "success");
  };

  const handleDeduct = (userId: string, isLeaderSection: boolean = false) => {
    const pts = parseInt(isLeaderSection ? leaderPointsInput[userId] : pointsInput[userId]);
    if (!pts || isNaN(pts) || pts <= 0) { toast("أدخل قيمة صحيحة لخصم النقاط", "error"); return; }
    
    evaluateUser(userId, -pts);
    if (isLeaderSection) {
      setLeaderPointsInput(prev => ({ ...prev, [userId]: "" }));
    } else {
      setPointsInput(prev => ({ ...prev, [userId]: "" }));
    }
    toast("تم خصم النقاط بنجاح", "success");
  };

  const handleReset = async (userId: string) => {
    if (await confirm("هل أنت متأكد من تصفير نقاط هذا العضو نهائياً؟")) {
      resetUserPoints(userId);
      toast("تم تصفير النقاط", "success");
    }
  };

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskAssignedTo) { toast("اختر العضو المُكلَّف بالمهمة.", "warning"); return; }
    const assignedUser = users.find(u => u.id === taskAssignedTo);
    const newTask: Task = {
      id: "task_" + Date.now(),
      title: taskTitle,
      description: taskDesc || undefined,
      points: parseInt(taskPoints) || 0,
      assigned_to: taskAssignedTo,
      assigned_by: user.id,
      team_id: taskTeamId || assignedUser?.team_ids?.[0],
      status: "pending",
      deadline: taskDeadline || undefined,
      date: new Date().toISOString().split("T")[0],
      theme: user.theme,
    };
    addTask(newTask);
    toast("تمت إضافة المهمة بنجاح ✓", "success");
    setIsTaskModalOpen(false);
    setTaskTitle(""); setTaskDesc(""); setTaskPoints("");
    setTaskAssignedTo(""); setTaskTeamId(""); setTaskDeadline("");
  };

  const getAssignedUserName = (id: string) => users.find(u => u.id === id)?.name || "غير معروف";

  return (
    <div className="animate-[fade-in_0.5s_ease-out] flex flex-col gap-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-2">
        <Award className="w-8 h-8 text-primary" />
        <h1 className="text-3xl font-black text-foreground">التقييمات والمهام</h1>
      </div>

      {/* تبويبات */}
      <div className="flex gap-2 bg-secondary/20 p-1.5 rounded-2xl w-fit">
        <button
          onClick={() => setActiveTab("evaluations")}
          className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2 ${
            activeTab === "evaluations"
              ? "bg-background text-foreground shadow-sm"
              : "text-foreground/50 hover:text-foreground"
          }`}
        >
          <Award className="w-4 h-4" /> المعايير والتقييم
        </button>
        <button
          onClick={() => setActiveTab("tasks")}
          className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2 ${
            activeTab === "tasks"
              ? "bg-background text-foreground shadow-sm"
              : "text-foreground/50 hover:text-foreground"
          }`}
        >
          <ListTodo className="w-4 h-4" /> المهام
          {visibleTasks.length > 0 && (
            <span className="w-5 h-5 bg-primary text-primary-foreground rounded-full text-[10px] font-black flex items-center justify-center">
              {visibleTasks.length}
            </span>
          )}
        </button>
      </div>

      {/* ===== تبويب التقييمات ===== */}
      {activeTab === "evaluations" && (
        <div className="flex flex-col gap-12">
          {/* Leader Evaluations */}
          {isAdmin(user.role) && (
            <div className="bg-background border border-secondary rounded-3xl p-8 shadow-sm">
              <h2 className="text-xl font-bold text-foreground mb-6 flex items-center justify-between pb-4 border-b border-secondary/50">
                <span className="flex items-center gap-2">
                  <Award className="w-6 h-6 text-yellow-500" />
                  تقييم مسؤولي الفرق
                </span>
                <span className="text-sm px-3 py-1 bg-yellow-500/10 text-yellow-500 rounded-lg font-bold">{leaders.length} مسؤول</span>
              </h2>
              <div className="flex flex-col gap-4">
                {leaders.length === 0 ? (
                  <p className="text-center py-6 text-foreground/50 border-2 border-dashed border-secondary rounded-2xl">لا يوجد مسؤولو فرق حالياً.</p>
                ) : leaders.map((m) => (
                  <div key={m.id} className="flex flex-col md:flex-row md:items-center justify-between p-5 bg-yellow-500/5 hover:bg-yellow-500/10 border border-yellow-500/20 rounded-2xl gap-4 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-yellow-500/20 text-yellow-600 flex items-center justify-center font-bold text-lg">{m.name.substring(0, 1)}</div>
                      <div>
                        <p className="font-bold text-foreground text-lg">{m.name}</p>
                        <p className="text-sm text-yellow-600 font-mono font-bold mt-1">الرصيد: {m.points} نقطة</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 w-full md:w-auto items-end">
                      <div className="relative">
                        <select value={leaderCriteriaInput[m.id] || ""} onChange={(e) => setLeaderCriteriaInput(prev => ({ ...prev, [m.id]: e.target.value }))} className="appearance-none bg-background border border-secondary text-foreground py-2.5 pl-10 pr-4 rounded-xl text-sm focus:border-yellow-500 outline-none w-full">
                          <option value="">اختر معياراً...</option>
                          {leaderCriteria.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                        </select>
                        <ChevronDown className="w-4 h-4 absolute left-3 top-3 text-foreground/50 pointer-events-none" />
                      </div>
                      <input type="number" placeholder="النقاط" value={leaderPointsInput[m.id] || ""} onChange={(e) => setLeaderPointsInput(prev => ({ ...prev, [m.id]: e.target.value }))} className="bg-background border border-secondary text-foreground py-2.5 px-4 rounded-xl text-sm text-center font-mono font-bold w-full" min="0" />
                      <div className="flex gap-2">
                        <button onClick={() => handleEvaluate(m.id, true)} className="bg-yellow-500 hover:bg-yellow-600 text-white px-5 py-2.5 rounded-xl text-sm font-black transition-all shadow-md flex-1">تقييم</button>
                        <button onClick={() => handleDeduct(m.id, true)} className="bg-red-500/10 text-red-500 hover:bg-red-500/20 px-3 py-2.5 rounded-xl transition-all shadow-sm flex items-center justify-center" title="خصم">
                          <MinusCircle className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleReset(m.id)} className="bg-foreground/5 text-foreground/50 hover:bg-foreground/10 hover:text-foreground px-3 py-2.5 rounded-xl transition-all shadow-sm flex items-center justify-center" title="تصفير">
                          <RefreshCcw className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Member Evaluations */}
          <div className="bg-background border border-secondary rounded-3xl p-8 shadow-sm">
            <h2 className="text-xl font-bold text-foreground mb-6 pb-4 border-b border-secondary/50">تقييم الأعضاء</h2>
            <div className="space-y-4">
              {standardMembers.length === 0 ? (
                <p className="text-center py-6 text-foreground/50 border-2 border-dashed border-secondary rounded-2xl">لا يوجد أعضاء حالياً.</p>
              ) : standardMembers.map(m => (
                <div key={m.id} className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-secondary/10 border border-secondary/50 rounded-2xl gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold">{m.name.charAt(0)}</div>
                    <div>
                      <h3 className="font-bold text-foreground text-sm">{m.name}</h3>
                      <p className="text-xs text-foreground/50">رصيد: <span className="font-mono text-primary font-bold">{m.points} pt</span></p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3 w-full items-end">
                    {m.team_ids && m.team_ids.length > 0 && (
                      <div className="relative">
                        <select value={teamInput[m.id] || ""} onChange={(e) => setTeamInput(prev => ({ ...prev, [m.id]: e.target.value }))} className="appearance-none bg-background border border-secondary text-foreground py-2.5 pl-10 pr-4 rounded-xl text-sm focus:border-primary outline-none w-full">
                          <option value="">الفريق المستفيد...</option>
                          {teams.filter(t => m.team_ids!.includes(t.id)).map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                        </select>
                        <ChevronDown className="w-4 h-4 absolute left-3 top-3 text-foreground/50 pointer-events-none" />
                      </div>
                    )}
                    <div className="relative">
                      <select value={criteriaInput[m.id] || ""} onChange={(e) => setCriteriaInput(prev => ({ ...prev, [m.id]: e.target.value }))} className="appearance-none bg-background border border-secondary text-foreground py-2.5 pl-10 pr-4 rounded-xl text-sm focus:border-primary outline-none w-full">
                        <option value="">اختر معياراً...</option>
                        {memberCriteria.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                      </select>
                      <ChevronDown className="w-4 h-4 absolute left-3 top-3 text-foreground/50 pointer-events-none" />
                    </div>
                    <input type="number" placeholder="النقاط" value={pointsInput[m.id] || ""} onChange={(e) => setPointsInput(prev => ({ ...prev, [m.id]: e.target.value }))} className="bg-background border border-secondary text-foreground py-2.5 px-4 rounded-xl text-sm text-center font-mono font-bold w-full" min="0" />
                    <div className="flex gap-2 w-full md:w-auto mt-2 md:mt-0 col-span-1 md:col-span-4 lg:col-span-1">
                      <button onClick={() => handleEvaluate(m.id)} className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-2.5 rounded-xl text-sm font-black transition-all shadow-md flex-1">تقييم</button>
                      <button onClick={() => handleDeduct(m.id)} className="bg-red-500/10 text-red-500 hover:bg-red-500/20 px-3 py-2.5 rounded-xl transition-all shadow-sm flex items-center justify-center" title="خصم">
                        <MinusCircle className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleReset(m.id)} className="bg-foreground/5 text-foreground/50 hover:bg-foreground/10 hover:text-foreground px-3 py-2.5 rounded-xl transition-all shadow-sm flex items-center justify-center" title="تصفير">
                        <RefreshCcw className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ===== تبويب المهام ===== */}
      {activeTab === "tasks" && (
        <div className="flex flex-col gap-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-foreground">إدارة المهام</h2>
            <button
              onClick={() => setIsTaskModalOpen(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-xl font-bold shadow-md hover:bg-primary/90 transition-all"
            >
              <Plus className="w-4 h-4" /> إضافة مهمة
            </button>
          </div>

          {visibleTasks.length === 0 ? (
            <div className="text-center py-16 border-2 border-dashed border-secondary rounded-3xl text-foreground/40 font-semibold">
              لا توجد مهام بعد. أضف أول مهمة عبر الزر أعلاه.
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {visibleTasks.map((task) => (
                <div
                  key={task.id}
                  className={`p-5 rounded-2xl border transition-all group ${
                    task.status === "completed"
                      ? "bg-green-500/5 border-green-500/30"
                      : "bg-background border-secondary"
                  }`}
                >
                  <div className="flex flex-col sm:flex-row justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className={`font-bold text-lg ${task.status === "completed" ? "line-through opacity-60" : ""}`}>
                          {task.title}
                        </h3>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          task.status === "completed"
                            ? "bg-green-500/20 text-green-600"
                            : "bg-orange-500/20 text-orange-600"
                        }`}>
                          {task.status === "completed" ? "مكتملة" : "قيد الإنجاز"}
                        </span>
                      </div>
                      {task.description && <p className="text-sm text-foreground/60 mb-2">{task.description}</p>}
                      <div className="flex flex-wrap gap-3 text-xs text-foreground/50">
                        <span className="flex items-center gap-1">
                          👤 مُكلَّف: <strong>{getAssignedUserName(task.assigned_to)}</strong>
                        </span>
                        <span className="font-mono font-bold text-primary">+{task.points} pt</span>
                        {task.deadline && (
                          <span className="flex items-center gap-1">
                            <CalendarDays className="w-3 h-3" /> {task.deadline}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-auto">
                      <button
                        onClick={() => toggleTaskStatus(task.id)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                          task.status === "completed"
                            ? "bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/20"
                            : "bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20"
                        }`}
                      >
                        {task.status === "completed"
                          ? <><RotateCcw className="w-3 h-3" /> إلغاء</>
                          : <><CheckCircle2 className="w-3 h-3" /> إكمال</>
                        }
                      </button>
                      <button
                        onClick={async () => { if (await confirm("حذف هذه المهمة نهائياً؟")) { deleteTask(task.id); toast("تم حذف المهمة", "info"); } }}
                        className="p-2 text-foreground/30 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modal إضافة مهمة */}
      {isTaskModalOpen && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-[fade-in_0.2s_ease-out]">
          <div className="bg-background border border-secondary rounded-3xl p-8 max-w-md w-full shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button onClick={() => setIsTaskModalOpen(false)} className="absolute top-6 left-6 p-2 text-foreground/50 hover:bg-secondary rounded-full">
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
              <ListTodo className="w-6 h-6 text-primary" /> إضافة مهمة جديدة
            </h2>
            <form onSubmit={handleAddTask} className="flex flex-col gap-4">
              <input
                required
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
                placeholder="عنوان المهمة"
                className="p-3 rounded-xl bg-secondary/30 border border-secondary/50 text-foreground"
              />
              <textarea
                value={taskDesc}
                onChange={(e) => setTaskDesc(e.target.value)}
                placeholder="وصف المهمة (اختياري)..."
                className="p-3 rounded-xl bg-secondary/30 border border-secondary/50 text-foreground min-h-20 resize-none text-sm"
              />

              {/* العضو المُكلَّف */}
              <div>
                <label className="text-sm font-bold text-foreground/70 block mb-1.5">تكليف إلى</label>
                <div className="relative">
                  <select
                    required
                    value={taskAssignedTo}
                    onChange={(e) => {
                      setTaskAssignedTo(e.target.value);
                      const u = users.find(u => u.id === e.target.value);
                      setTaskTeamId(u?.team_ids?.[0] || "");
                    }}
                    className="appearance-none bg-background border border-secondary text-foreground py-2.5 pl-10 pr-4 rounded-xl text-sm outline-none w-full focus:border-primary"
                  >
                    <option value="">اختر العضو...</option>
                    {assignableUsers.map(u => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({getRoleLabel(u.role, u.theme)})
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 absolute left-3 top-3 text-foreground/50 pointer-events-none" />
                </div>
              </div>

              {/* الفريق المستفيد */}
              {taskAssignedTo && (users.find(u => u.id === taskAssignedTo)?.team_ids?.length || 0) > 0 && (
                <div>
                  <label className="text-sm font-bold text-foreground/70 block mb-1.5">الفريق المستفيد من النقاط</label>
                  <div className="relative">
                    <select
                      value={taskTeamId}
                      onChange={(e) => setTaskTeamId(e.target.value)}
                      className="appearance-none bg-background border border-secondary text-foreground py-2.5 pl-10 pr-4 rounded-xl text-sm outline-none w-full focus:border-primary"
                    >
                      <option value="">بدون فريق محدد</option>
                      {teams
                        .filter(t => users.find(u => u.id === taskAssignedTo)?.team_ids?.includes(t.id))
                        .map(t => <option key={t.id} value={t.id}>{t.name}</option>)
                      }
                    </select>
                    <ChevronDown className="w-4 h-4 absolute left-3 top-3 text-foreground/50 pointer-events-none" />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-bold text-foreground/70 block mb-1.5">النقاط</label>
                  <input
                    required
                    type="number"
                    min="1"
                    value={taskPoints}
                    onChange={(e) => setTaskPoints(e.target.value)}
                    placeholder="مثال: 50"
                    className="p-3 rounded-xl bg-secondary/30 border border-secondary/50 text-foreground text-center font-mono font-bold w-full"
                  />
                </div>
                <div>
                  <label className="text-sm font-bold text-foreground/70 block mb-1.5">الموعد النهائي</label>
                  <input
                    type="date"
                    value={taskDeadline}
                    onChange={(e) => setTaskDeadline(e.target.value)}
                    className="p-3 rounded-xl bg-secondary/30 border border-secondary/50 text-foreground w-full text-sm"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="mt-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl font-bold shadow-lg shadow-primary/30 hover:opacity-90 transition-all"
              >
                إضافة المهمة
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
