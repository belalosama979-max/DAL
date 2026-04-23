"use client";
import { isAdmin } from "@/lib/roleUtils";

import { useAuth } from "@/lib/auth";
import { useScopedData as useData } from "@/lib/useScopedData";
import { Megaphone, Plus, Trash2, X, Clock, PlayCircle } from "lucide-react";
import { useState } from "react";
import { Announcement } from "@/lib/mockData";
import { CountdownTimer } from "@/components/CountdownTimer";

export default function AdminAnnouncementsPage() {
  const { user } = useAuth();
  const { announcements, addAnnouncement, deleteAnnouncement } = useData();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [type, setType] = useState<Announcement["type"]>("info");
  const [startTime, setStartTime] = useState("");
  const [deadline, setDeadline] = useState("");

  if (!user || !isAdmin(user.role)) return null;

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const newAnn: Announcement = {
      id: crypto.randomUUID(),
      title,
      content,
      type,
      start_time: startTime || undefined,
      deadline: deadline || undefined,
      date: new Date().toISOString().split("T")[0],
      theme: user.theme as "male" | "female",
    };
    addAnnouncement(newAnn);
    setIsModalOpen(false);
    setTitle("");
    setContent("");
    setType("info");
    setStartTime("");
    setDeadline("");
  };

  const formatDateTime = (dt?: string) => {
    if (!dt) return null;
    return new Date(dt).toLocaleString("ar-SA", {
      dateStyle: "short",
      timeStyle: "short",
    });
  };

  return (
    <div className="animate-[fade-in_0.5s_ease-out] flex flex-col gap-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
        <div className="flex items-center gap-3">
          <Megaphone className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-black text-foreground">التعاميم والإعلانات</h1>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-xl font-bold shadow-md hover:bg-primary/90 transition-all"
        >
          <Plus className="w-5 h-5" /> إعلان جديد
        </button>
      </div>

      <div className="bg-background border border-secondary rounded-3xl p-6 shadow-sm">
        <h2 className="text-xl font-bold text-foreground mb-6">سجل الإعلانات</h2>

        <div className="space-y-4">
          {announcements.length === 0 ? (
            <div className="text-center p-10 text-foreground/50 border-2 border-dashed border-secondary rounded-2xl">
              لا توجد إعلانات لنشرها.
            </div>
          ) : (
            announcements.map((a) => (
              <div
                key={a.id}
                className="p-5 bg-secondary/10 border border-secondary/50 rounded-2xl flex flex-col sm:flex-row sm:items-start justify-between gap-4 group hover:bg-secondary/20 transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        a.type === "warning"
                          ? "bg-red-500/20 text-red-600"
                          : a.type === "success"
                          ? "bg-green-500/20 text-green-600"
                          : "bg-primary/20 text-primary"
                      }`}
                    >
                      {a.type === "warning" ? "تنبيه" : a.type === "success" ? "تهنئة" : "معلومة"}
                    </span>
                    <span className="text-xs text-foreground/50 font-mono">{a.date}</span>
                  </div>

                  <h3 className="font-bold text-lg text-foreground mb-1">{a.title}</h3>
                  <p className="text-foreground/70 text-sm leading-relaxed max-w-3xl mb-2">{a.content}</p>

                  {/* توقيتات */}
                  <div className="flex flex-wrap gap-3 text-[11px] text-foreground/50 mt-1">
                    {a.start_time && (
                      <span className="flex items-center gap-1">
                        <PlayCircle className="w-3 h-3 text-blue-500" />
                        يبدأ: {formatDateTime(a.start_time)}
                      </span>
                    )}
                    {a.deadline && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-orange-500" />
                        ينتهي: {formatDateTime(a.deadline)}
                      </span>
                    )}
                  </div>

                  <CountdownTimer start_time={a.start_time} deadline={a.deadline} />
                </div>

                <button
                  onClick={() => deleteAnnouncement(a.id)}
                  className="p-2 text-foreground/40 hover:text-red-500 hover:bg-red-500/10 rounded-lg self-end sm:self-auto shrink-0 transition-colors opacity-0 group-hover:opacity-100"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-[fade-in_0.2s_ease-out]">
          <div className="bg-background border border-secondary rounded-3xl p-8 max-w-md w-full shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-6 left-6 p-2 text-foreground/50 hover:bg-secondary rounded-full"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-2xl font-bold text-foreground mb-6">إضافة إعلان جديد</h2>
            <form onSubmit={handleAdd} className="flex flex-col gap-4">
              <input
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="عنوان الإعلان"
                className="p-3 rounded-xl bg-secondary/30 border border-secondary/50 text-foreground"
              />
              <textarea
                required
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="محتوى الإعلان..."
                className="p-3 rounded-xl bg-secondary/30 border border-secondary/50 text-foreground min-h-28 resize-none"
              />

              <select
                value={type}
                onChange={(e) => setType(e.target.value as Announcement["type"])}
                className="p-3 rounded-xl bg-secondary/30 border border-secondary/50 text-foreground"
              >
                <option value="info">معلومة عادية</option>
                <option value="success">تهنئة أو إنجاز</option>
                <option value="warning">تنبيه أو تحذير</option>
              </select>

              {/* وقت البدء */}
              <div className="flex flex-col gap-2 p-4 bg-blue-500/5 border border-blue-500/20 rounded-xl">
                <label className="text-sm font-bold text-foreground flex items-center gap-2">
                  <PlayCircle className="w-4 h-4 text-blue-500" />
                  وقت بدء الإعلان (اختياري)
                </label>
                <input
                  type="datetime-local"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="p-3 rounded-xl bg-background border border-secondary/50 text-foreground w-full"
                />
                <p className="text-[11px] text-foreground/50">
                  إذا تركته فارغاً، سيبدأ الإعلان فوراً عند النشر.
                </p>
              </div>

              {/* وقت الانتهاء */}
              <div className="flex flex-col gap-2 p-4 bg-orange-500/5 border border-orange-500/20 rounded-xl">
                <label className="text-sm font-bold text-foreground flex items-center gap-2">
                  <Clock className="w-4 h-4 text-orange-500" />
                  وقت انتهاء الإعلان (اختياري)
                </label>
                <input
                  type="datetime-local"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="p-3 rounded-xl bg-background border border-secondary/50 text-foreground w-full"
                />
                <p className="text-[11px] text-foreground/50">
                  إذا تركته فارغاً، سيبقى الإعلان نشطاً لأجل غير مسمى.
                </p>
              </div>

              {/* معاينة المنطق */}
              {(startTime || deadline) && (
                <div className="p-3 bg-secondary/20 rounded-xl text-xs text-foreground/70 leading-relaxed">
                  <span className="font-bold block mb-1">📋 ملخص:</span>
                  {!startTime && !deadline && "ينشر الآن ويبقى دائمًا."}
                  {startTime && !deadline && `ينشر عند: ${formatDateTime(startTime)} ويبقى دائمًا.`}
                  {!startTime && deadline && `ينشر الآن وينتهي عند: ${formatDateTime(deadline)}.`}
                  {startTime && deadline &&
                    `ينشر عند: ${formatDateTime(startTime)} وينتهي عند: ${formatDateTime(deadline)}.`}
                </div>
              )}

              <button
                type="submit"
                className="mt-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl font-bold shadow-lg shadow-primary/30 hover:opacity-90 transition-all"
              >
                نشر الإعلان
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
