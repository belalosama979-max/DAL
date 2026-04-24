"use client";
import { isAdmin, isLeader } from "@/lib/roleUtils";

import { useAuth } from "@/lib/auth";
import { useScopedData as useData } from "@/lib/useScopedData";
import { Trash2, Pencil, ListChecks } from "lucide-react";
import { useState } from "react";
import { Criterion } from "@/lib/mockData";
import { useToast } from "@/components/ToastProvider";

export default function AdminCriteriaPage() {
  const { user } = useAuth();
  const { criteria, addCriterion, deleteCriterion, editCriterion } = useData();
  const { toast, confirm } = useToast();

  const [title, setTitle] = useState("");
  const [target, setTarget] = useState<"member" | "leader">("member");
  const [editingId, setEditingId] = useState<string | null>(null);

  if (!user || (!isAdmin(user.role) && !isLeader(user.role))) return null;

  const canManageLeaderCriteria = isAdmin(user.role);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) { toast("اسم المعيار مطلوب", "warning"); return; }
    if (editingId) {
      editCriterion({ id: editingId, title, target, theme: user.theme });
      setEditingId(null);
      toast("تم تعديل المعيار بنجاح ✓", "success");
    } else {
      addCriterion({ id: crypto.randomUUID(), title, target, theme: user.theme as "male" | "female" });
      toast("تم إضافة المعيار بنجاح ✓", "success");
    }
    setTitle("");
    setTarget("member");
  };

  const handleEdit = (c: Criterion) => {
    setTitle(c.title);
    setTarget(c.target);
    setEditingId(c.id);
  };

  const handleDelete = async (id: string) => {
    if (await confirm("هل أنت متأكد من حذف هذا المعيار؟")) {
      deleteCriterion(id);
      toast("تم حذف المعيار", "info");
    }
  };

  return (
    <div className="animate-[fade-in_0.5s_ease-out] flex flex-col gap-8 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-secondary/50 pb-6">
        <h1 className="text-3xl font-black text-foreground flex items-center gap-3">
          <ListChecks className="w-8 h-8 text-primary" />
          إدارة معايير التقييم
        </h1>
      </div>

      {/* فورم الإضافة / التعديل */}
      <div className="bg-background border border-secondary rounded-3xl p-8 shadow-sm">
        <h2 className="text-xl font-bold text-foreground mb-6">
          {editingId ? "تعديل المعيار" : "إضافة معيار جديد"}
        </h2>
        <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-4 items-start md:items-end">
          <div className="w-full">
            <label className="block text-sm font-bold text-foreground/80 mb-2">اسم المعيار</label>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="مثال: تفاعل وإبداع"
              className="w-full p-3 rounded-xl bg-secondary/30 border border-secondary/50 text-foreground outline-none focus:border-primary"
            />
          </div>
          <div className="w-full">
            <label className="block text-sm font-bold text-foreground/80 mb-2">الفئة المستهدفة</label>
            <select
              value={target}
              onChange={e => setTarget(e.target.value as "member" | "leader")}
              className="w-full p-3 rounded-xl bg-secondary/30 border border-secondary/50 text-foreground outline-none focus:border-primary"
            >
              <option value="member">الأعضاء (يستخدم لتقييم الأعضاء)</option>
              {canManageLeaderCriteria && (
                <option value="leader">مسؤولو الفرق (يستخدم لتقييم القادة)</option>
              )}
            </select>
          </div>
          <button type="submit" className="w-full md:w-auto px-8 py-3 bg-primary text-primary-foreground text-sm rounded-xl font-bold hover:opacity-90 transition-all shrink-0">
            {editingId ? "حفظ التعديل" : "إضافة"}
          </button>
          {editingId && (
            <button type="button" onClick={() => { setEditingId(null); setTitle(""); }} className="w-full md:w-auto px-8 py-3 bg-secondary text-foreground text-sm rounded-xl font-bold hover:opacity-90 transition-all shrink-0">
              إلغاء
            </button>
          )}
        </form>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* معايير الأعضاء */}
        <div className="bg-background border border-secondary rounded-3xl p-8 shadow-sm">
          <h2 className="text-xl font-bold text-foreground mb-6 flex items-center justify-between">
            معايير تقييم الأعضاء
            <span className="text-sm px-3 py-1 bg-primary/10 text-primary rounded-lg">{criteria.filter(c => c.target === "member").length} معيار</span>
          </h2>
          <div className="flex flex-col gap-3">
            {criteria.filter(c => c.target === "member").length === 0 ? (
              <p className="text-foreground/50 text-center py-4">لا توجد معايير للأعضاء بعد.</p>
            ) : criteria.filter(c => c.target === "member").map(c => (
              <div key={c.id} className="flex items-center justify-between p-4 bg-secondary/10 border border-secondary/50 rounded-xl">
                <span className="font-bold text-foreground">{c.title}</span>
                <div className="flex items-center gap-2">
                  <button onClick={() => handleEdit(c)} className="p-2 text-foreground/50 hover:text-primary hover:bg-primary/10 rounded-lg"><Pencil className="w-4 h-4" /></button>
                  <button onClick={() => handleDelete(c.id)} className="p-2 text-foreground/50 hover:text-red-500 hover:bg-red-500/10 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* معايير القادة - للإدارة فقط */}
        {canManageLeaderCriteria && (
          <div className="bg-background border border-secondary rounded-3xl p-8 shadow-sm">
            <h2 className="text-xl font-bold text-foreground mb-6 flex items-center justify-between">
              معايير تقييم القادة
              <span className="text-sm px-3 py-1 bg-yellow-500/10 text-yellow-500 rounded-lg">{criteria.filter(c => c.target === "leader").length} معيار</span>
            </h2>
            <div className="flex flex-col gap-3">
              {criteria.filter(c => c.target === "leader").length === 0 ? (
                <p className="text-foreground/50 text-center py-4">لا توجد معايير للقادة بعد.</p>
              ) : criteria.filter(c => c.target === "leader").map(c => (
                <div key={c.id} className="flex items-center justify-between p-4 bg-secondary/10 border border-secondary/50 rounded-xl">
                  <span className="font-bold text-foreground">{c.title}</span>
                  <div className="flex items-center gap-2">
                    <button onClick={() => handleEdit(c)} className="p-2 text-foreground/50 hover:text-primary hover:bg-primary/10 rounded-lg"><Pencil className="w-4 h-4" /></button>
                    <button onClick={() => handleDelete(c.id)} className="p-2 text-foreground/50 hover:text-red-500 hover:bg-red-500/10 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
