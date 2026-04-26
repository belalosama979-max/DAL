"use client";
import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { useScopedData as useData } from "@/lib/useScopedData";
import { Lightbulb, Trash2, ChevronDown, ChevronUp, Users } from "lucide-react";
import { useToast } from "@/components/ToastProvider";

export default function AdminSuggestionsPage() {
  const { user } = useAuth();
  const { users, teams, suggestions, deleteSuggestion } = useData();
  const { toast, confirm } = useToast();
  const [openCategory, setOpenCategory] = useState<string | null>("evaluation_team");

  if (!user || (user.role !== "admin" && user.role !== "vice_president")) {
    return <div className="p-8 text-foreground/60">غير مصرح لك بالوصول لهذه الصفحة.</div>;
  }

  const handleDelete = async (id: string) => {
    if (await confirm("هل أنت متأكد من حذف هذا الاقتراح؟")) {
      deleteSuggestion(id);
      toast("تم حذف الاقتراح", "info");
    }
  };

  const evalSuggestions = suggestions.filter(s => s.category === "evaluation_team" || !s.category);

  const categories = [
    { id: "evaluation_team", label: "فريق التقييم والتطوير 📊", items: evalSuggestions, isEval: true },
    ...teams.map(t => ({ id: t.id, label: t.name, items: suggestions.filter(s => s.category === t.id), isEval: false, color: t.color_code })),
  ];

  return (
    <div className="animate-[fade-in_0.5s_ease-out] flex flex-col gap-4 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-4">
        <Lightbulb className="w-8 h-8 text-yellow-500" />
        <div>
          <h1 className="text-3xl font-black text-foreground">اقتراحات للأفرقة</h1>
          <p className="text-sm text-foreground/60">{suggestions.length} اقتراح مقدم</p>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {categories.map(cat => {
          const isOpen = openCategory === cat.id;
          return (
            <div key={cat.id} className="bg-background border border-secondary rounded-2xl overflow-hidden shadow-sm">
              <button onClick={() => setOpenCategory(isOpen ? null : cat.id)}
                className="w-full flex items-center justify-between px-6 py-4 hover:bg-secondary/30 transition-colors text-right">
                <div className="flex items-center gap-3">
                  {cat.isEval ? (
                    <div className="w-8 h-8 rounded-full bg-yellow-500/10 text-yellow-500 flex items-center justify-center text-sm">📊</div>
                  ) : (
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-sm"
                      style={{ backgroundColor: (cat as {color?: string}).color || '#6366f1' }}>
                      <Users className="w-4 h-4" />
                    </div>
                  )}
                  <span className="font-bold text-foreground text-base">{cat.label}</span>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${cat.items.length > 0 ? "bg-primary/10 text-primary" : "bg-secondary/50 text-foreground/40"}`}>
                    {cat.items.length} اقتراح
                  </span>
                </div>
                {isOpen ? <ChevronUp className="w-5 h-5 text-foreground/40" /> : <ChevronDown className="w-5 h-5 text-foreground/40" />}
              </button>

              {isOpen && (
                <div className="border-t border-secondary/50 p-4">
                  {cat.items.length === 0 ? (
                    <div className="text-center py-8 text-foreground/40 text-sm border-2 border-dashed border-secondary rounded-xl">
                      لا توجد اقتراحات في هذا القسم حالياً.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {cat.items.map(s => {
                        const author = users.find(u => u.id === s.author_id);
                        return (
                          <div key={s.id} className="bg-secondary/10 border border-secondary/50 rounded-2xl p-5 relative group flex flex-col">
                            <button onClick={() => handleDelete(s.id)}
                              className="absolute top-3 left-3 p-1.5 text-foreground/30 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all opacity-0 group-hover:opacity-100">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                            <h3 className="font-bold text-foreground mb-2 text-sm pr-4">{s.title}</h3>
                            <p className="text-foreground/70 text-xs leading-relaxed flex-1 mb-4">{s.content}</p>
                            <div className="flex items-center justify-between mt-auto pt-3 border-t border-secondary/50">
                              <div className="flex items-center gap-1.5">
                                <div className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold">
                                  {author?.name?.substring(0, 1) || "?"}
                                </div>
                                <span className="text-xs text-foreground/60 font-semibold">{author?.name || "عضو"}</span>
                              </div>
                              <span className="text-[10px] text-foreground/40 font-mono">
                                {s.created_at ? new Date(s.created_at).toLocaleDateString('ar-SA') : "—"}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
