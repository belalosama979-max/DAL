import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { useScopedData as useData } from "@/lib/useScopedData";
import { useToast } from "@/components/ToastProvider";
import { Send, ChevronDown } from "lucide-react";

export function SuggestionBox() {
  const { user } = useAuth();
  const { addSuggestion, teams } = useData();
  const { toast } = useToast();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("evaluation_team");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!user) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    setIsSubmitting(true);
    try {
      await addSuggestion({
        title,
        content,
        author_id: user.id,
        theme: user.theme,
        category
      });
      toast("تم إرسال اقتراحك بنجاح! شكراً لمساهمتك.", "success");
      setTitle("");
      setContent("");
      setCategory("evaluation_team");
    } catch {
      toast("حدث خطأ أثناء إرسال الاقتراح", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-background border border-secondary rounded-3xl p-6 shadow-sm mb-8">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-full bg-yellow-500/10 text-yellow-500 flex items-center justify-center text-xl">
          💡
        </div>
        <div>
          <h3 className="text-xl font-bold text-foreground">اقتراحات للأفرقة</h3>
          <p className="text-sm text-foreground/60">أرسل اقتراحاتك — تصل مباشرة للجهة المعنية</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Category selector */}
        <div className="relative">
          <select
            value={category}
            onChange={e => setCategory(e.target.value)}
            className="w-full p-3 pr-10 rounded-xl bg-secondary/30 border border-secondary/50 text-foreground outline-none focus:border-primary/50 transition-colors text-sm appearance-none cursor-pointer"
          >
            <option value="evaluation_team">📊 فريق التقييم والتطوير</option>
            {teams.map(t => (
              <option key={t.id} value={t.id}>🏷️ {t.name}</option>
            ))}
          </select>
          <ChevronDown className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/40 pointer-events-none" />
        </div>

        <input
          required
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="عنوان الفكرة أو الاقتراح"
          className="p-3 rounded-xl bg-secondary/30 border border-secondary/50 text-foreground outline-none focus:border-primary/50 transition-colors text-sm"
        />
        <textarea
          required
          value={content}
          onChange={e => setContent(e.target.value)}
          placeholder="تفاصيل الفكرة وطبيعتها..."
          rows={3}
          className="p-3 rounded-xl bg-secondary/30 border border-secondary/50 text-foreground outline-none focus:border-primary/50 transition-colors text-sm resize-none"
        />
        <button
          type="submit"
          disabled={isSubmitting || !title.trim() || !content.trim()}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl font-bold shadow-md hover:bg-primary/90 transition-all disabled:opacity-50 w-fit self-end"
        >
          {isSubmitting ? "جاري الإرسال..." : (
            <>إرسال الاقتراح <Send className="w-4 h-4" /></>
          )}
        </button>
      </form>
    </div>
  );
}
