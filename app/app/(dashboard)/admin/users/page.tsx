"use client";
import { isAdmin, isLeader, getRoleLabel } from "@/lib/roleUtils";

import { useAuth } from "@/lib/auth";
import { useScopedData as useData } from "@/lib/useScopedData";
import { Users, Plus, Pencil, Trash2, X } from "lucide-react";
import { useState } from "react";
import { User, UserRole } from "@/lib/mockData";
import { useToast } from "@/components/ToastProvider";

export default function AdminUsersPage() {
  const { user } = useAuth();
  const { users, teams, addUser, deleteUser, editUser } = useData();
  const { toast, confirm } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<UserRole>("member");
  const [teamIds, setTeamIds] = useState<string[]>([]);

  if (!user || !isAdmin(user.role)) return null;

  const openAddModal = () => {
    setEditingUser(null);
    setName(""); setEmail(""); setRole("member"); setTeamIds([]);
    setIsModalOpen(true);
  };

  const openEditModal = (u: User) => {
    setEditingUser(u);
    setName(u.name); setEmail(u.email); setRole(u.role); setTeamIds(u.team_ids || []);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    if (editingUser) {
      editUser({ ...editingUser, name, email, role, team_ids: teamIds });
      toast("تم تحديث بيانات العضو بنجاح ✓", "success");
      setIsLoading(false);
      setIsModalOpen(false);
    } else {
      // Create new user via API (handles Supabase Auth creation)
      const defaultPassword = '1234';
      try {
        const res = await fetch('/api/admin/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email,
            password: defaultPassword,
            name,
            role,
            theme: user.theme,
            team_ids: teamIds,
            points: 0
          })
        });
        
        const data = await res.json();
        
        if (res.ok && data.user) {
          // Build the full User object using the Auth UUID returned from API
          const newUser: User = {
            id: data.user.id,  // UUID from Supabase Auth
            name,
            email,
            role,
            team_ids: teamIds,
            points: 0,
            theme: user.theme,
            mustChangePassword: true
          };
          // addUser inserts into profiles table with the correct Auth UUID
          await addUser(newUser);
          toast(`تم إضافة العضو وتسجيله في النظام! كلمة المرور المبدئية: 1234 (سيُطلب منه تغييرها عند أول دخول)`, "success");
          setIsModalOpen(false);
        } else {
          toast("حدث خطأ أثناء الإضافة: " + (data.error || 'خطأ غير معروف'), "error");
        }
      } catch (err: any) {
        toast("حدث خطأ في الاتصال بالخادم", "error");
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (await confirm("هل أنت متأكد من حذف هذا العضو؟ لا يمكن التراجع عن هذا الإجراء.")) {
      deleteUser(id);
      toast("تم حذف العضو", "info");
    }
  };

  return (
    <div className="animate-[fade-in_0.5s_ease-out] flex flex-col gap-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
        <div className="flex items-center gap-3">
          <Users className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-black text-foreground">إدارة الأعضاء</h1>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-xl font-bold shadow-md hover:bg-primary/90 transition-all"
        >
          <Plus className="w-5 h-5" /> عضو جديد
        </button>
      </div>

      <div className="bg-background border border-secondary rounded-3xl p-6 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead>
              <tr className="border-b border-secondary">
                <th className="pb-5 font-bold text-foreground/60 w-12 text-center">#</th>
                <th className="pb-5 font-bold text-foreground/60 whitespace-nowrap">الاسم</th>
                <th className="pb-5 font-bold text-foreground/60 whitespace-nowrap">البريد الإلكتروني</th>
                <th className="pb-5 font-bold text-foreground/60">الفرق</th>
                <th className="pb-5 font-bold text-foreground/60 whitespace-nowrap">الرتبة</th>
                <th className="pb-5 font-bold text-foreground/60 text-center whitespace-nowrap">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u, idx) => (
                <tr key={u.id} className="border-b border-secondary/50 last:border-0 hover:bg-secondary/10 transition-colors">
                  <td className="py-5 font-mono text-sm text-foreground/50 text-center">{idx + 1}</td>
                  <td className="py-5 font-bold text-foreground">
                    <div className="flex items-center gap-4">
                      {u.avatar ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={u.avatar} alt={u.name} className="w-10 h-10 rounded-full object-cover shadow-sm border border-secondary" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-primary/20 text-primary flex items-center justify-center text-sm shadow-sm">
                          {u.name.charAt(0)}
                        </div>
                      )}
                      <span className="whitespace-nowrap">{u.name}</span>
                    </div>
                  </td>
                  <td className="py-5 text-foreground/70 font-medium">{u.email}</td>
                  <td className="py-5">
                    {u.team_ids && u.team_ids.length > 0 ? (
                      <div className="flex flex-wrap gap-2 justify-start">
                        {teams.filter(t => u.team_ids!.includes(t.id)).map(t => (
                          <span key={t.id} className="px-3.5 py-1.5 bg-secondary/40 rounded-xl text-xs font-bold text-foreground border border-secondary shadow-sm whitespace-nowrap">
                            {t.name}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="px-3 py-1 bg-background rounded-lg text-foreground/40 text-xs font-semibold border border-dashed border-secondary/50">بدون فريق</span>
                    )}
                  </td>
                  <td className="py-5">
                    <span className={`px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm whitespace-nowrap ${
                      isAdmin(u.role) ? 'bg-accent/20 text-accent-foreground border border-accent/20' :
                      isLeader(u.role) ? 'bg-yellow-500/20 text-yellow-500 border border-yellow-500/20' :
                      'bg-primary/10 text-primary border border-primary/20'
                    }`}>
                      {getRoleLabel(u.role, u.theme)}
                    </span>
                  </td>
                  <td className="py-5">
                    <div className="flex items-center justify-center gap-3">
                      <button
                        onClick={() => openEditModal(u)}
                        className="p-2.5 text-foreground/60 hover:text-primary hover:bg-primary/10 rounded-xl transition-all shadow-sm bg-background border border-secondary"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      {!isAdmin(u.role) && (
                        <button
                          onClick={() => handleDelete(u.id)}
                          className="p-2.5 text-foreground/60 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all shadow-sm bg-background border border-secondary"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-[fade-in_0.2s_ease-out]">
          <div className="bg-background border border-secondary rounded-3xl p-8 max-w-md w-full shadow-2xl relative">
            <button onClick={() => setIsModalOpen(false)} className="absolute top-6 left-6 p-2 text-foreground/50 hover:bg-secondary rounded-full">
              <X className="w-5 h-5"/>
            </button>
            <h2 className="text-2xl font-bold text-foreground mb-6">
              {editingUser ? "تعديل بيانات العضو" : "إضافة عضو جديد"}
            </h2>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <input required value={name} onChange={e=>setName(e.target.value)} placeholder="الاسم كامل" className="p-3 rounded-xl bg-secondary/30 border border-secondary/50 text-foreground" />
              <input required type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="البريد الإلكتروني" className="p-3 rounded-xl bg-secondary/30 border border-secondary/50 text-foreground" />

              <select value={role} onChange={e=>setRole(e.target.value as UserRole)} className="p-3 rounded-xl bg-secondary/30 border border-secondary/50 text-foreground">
                <option value="member">{getRoleLabel("member", user.theme)}</option>
                <option value="vice_leader">{getRoleLabel("vice_leader", user.theme)}</option>
                <option value="leader">{getRoleLabel("leader", user.theme)}</option>
                <option value="vice_president">{getRoleLabel("vice_president", user.theme)}</option>
                <option value="admin">{getRoleLabel("admin", user.theme)}</option>
              </select>

              <div className="flex flex-col gap-2 p-3 rounded-xl bg-secondary/30 border border-secondary/50">
                <span className="text-sm font-bold text-foreground">الفرق المنضم إليها:</span>
                <div className="flex flex-wrap gap-3">
                  {teams.map(t => (
                    <label key={t.id} className="flex items-center gap-2 cursor-pointer text-sm text-foreground">
                      <input
                        type="checkbox"
                        checked={teamIds.includes(t.id)}
                        onChange={(e) => {
                          if (e.target.checked) setTeamIds(prev => [...prev, t.id]);
                          else setTeamIds(prev => prev.filter(id => id !== t.id));
                        }}
                        className="w-4 h-4 rounded border-secondary"
                      />
                      {t.name}
                    </label>
                  ))}
                </div>
              </div>

              <button type="submit" disabled={isLoading} className="mt-4 px-6 py-3 bg-primary text-primary-foreground rounded-xl font-bold shadow-lg shadow-primary/30 hover:opacity-90 transition-all disabled:opacity-50">
                {isLoading ? "جاري المعالجة..." : (editingUser ? "حفظ التعديلات" : "إضافة عضو")}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
