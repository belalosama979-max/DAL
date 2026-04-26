"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { User, Team, Announcement, Criterion, Task, Suggestion } from "@/lib/mockData";
import supabase from "@/lib/supabase";

interface DataContextType {
  users: User[];
  teams: Team[];
  announcements: Announcement[];
  criteria: Criterion[];
  tasks: Task[];
  suggestions: Suggestion[];
  loading: boolean;
  addUser: (user: User) => void;
  deleteUser: (id: string) => void;
  editUser: (user: User) => void;
  evaluateUser: (id: string, points: number, targetTeamId?: string) => void;
  addTeam: (team: Team) => void;
  editTeam: (team: Team) => void;
  deleteTeam: (id: string) => void;
  addAnnouncement: (announcement: Announcement) => void;
  deleteAnnouncement: (id: string) => void;
  addCriterion: (c: Criterion) => void;
  editCriterion: (c: Criterion) => void;
  deleteCriterion: (id: string) => void;
  addTask: (task: Task) => void;
  editTask: (task: Task) => void;
  deleteTask: (id: string) => void;
  addSuggestion: (s: Omit<Suggestion, "id" | "created_at">) => void;
  deleteSuggestion: (id: string) => void;
  toggleTaskStatus: (taskId: string) => void;
  resetUserPoints: (id: string) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [users, setUsers] = useState<User[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [criteria, setCriteria] = useState<Criterion[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(true);

  // Load from Supabase on mount
  useEffect(() => {
    async function fetchData() {
      try {
        const [
          { data: profiles, error: pErr },
          { data: dbTeams, error: tErr },
          { data: dbAnns, error: aErr },
          { data: dbCriteria, error: cErr },
          { data: dbTasks, error: tkErr },
          { data: dbSuggestions, error: sErr }
        ] = await Promise.all([
          supabase.from('profiles').select('*'),
          supabase.from('teams').select('*'),
          supabase.from('announcements').select('*'),
          supabase.from('criteria').select('*'),
          supabase.from('tasks').select('*'),
          supabase.from('suggestions').select('*')
        ]);

        if (pErr) console.error("Profiles error:", pErr);
        if (tErr) console.error("Teams error:", tErr);

        let teamsToUpdate = dbTeams || [];
        let usersToUpdate = profiles ? profiles.map((p: any) => ({
          id: p.id,
          name: p.name || "مستخدم جديد",
          email: p.email,
          role: p.role || "member",
          theme: p.theme || "male",
          points: p.points || 0,
          team_ids: p.team_ids || [],
          avatar: p.avatar_url,
          mustChangePassword: !!p.must_change_password
        })) : [];

        // Check for expired motivation timers
        if (teamsToUpdate) {
          const now = Date.now();
          for (const t of teamsToUpdate) {
            if (t.motivation_deadline && !t.motivation_handled && new Date(t.motivation_deadline).getTime() <= now) {
              // Expired! Reset team points and members points
              t.points = 0;
              t.motivation_handled = true;
              
              await supabase.from('teams').update({ points: 0, motivation_handled: true }).eq('id', t.id);
              
              // Find users in this team and reset their points
              const affectedUsers = usersToUpdate.filter(u => u.team_ids.includes(t.id));
              for (const u of affectedUsers) {
                u.points = 0;
                await supabase.from('profiles').update({ points: 0 }).eq('id', u.id);
              }
            }
          }
        }

        if (usersToUpdate.length > 0) setUsers(usersToUpdate);
        if (teamsToUpdate) setTeams(teamsToUpdate);
        if (dbAnns) setAnnouncements(dbAnns);
        if (dbCriteria) setCriteria(dbCriteria);
        if (dbTasks) {
          setTasks(dbTasks.map((t: any) => ({
            ...t,
            points: t.points || 0,
            status: t.status || "pending",
            assigned_to: t.assigned_to,
            assigned_by: t.assigned_by
          })));
        }
        if (dbSuggestions) setSuggestions(dbSuggestions);
      } catch (err) {
        console.error("Critical fetch error:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const addUser = async (user: User) => {
    // Use upsert to handle cases where a Supabase trigger already created the profile row
    const { error } = await supabase.from('profiles').upsert([{
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      theme: user.theme,
      points: user.points || 0,
      team_ids: user.team_ids || [],
      avatar_url: user.avatar,
      must_change_password: true
    }], { onConflict: 'id' });
    if (error) { console.error("AddUser Error:", error); alert("خطأ في الإضافة: " + error.message); }
    else setUsers(prev => [...prev.filter(u => u.id !== user.id), user]);
  };

  const deleteUser = async (id: string) => {
    // Delete from profiles (DB)
    const { error } = await supabase.from('profiles').delete().eq('id', id);
    if (error) { console.error("DeleteUser Error:", error); alert("خطأ في الحذف: " + error.message); return; }
    // Also delete from Supabase Auth via service-role API
    try {
      await fetch('/api/admin/users', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: id })
      });
    } catch (e) {
      console.warn("Could not delete from Auth:", e);
    }
    setUsers(prev => prev.filter(u => u.id !== id));
  };

  const editUser = async (updatedUser: User) => {
    const { error } = await supabase.from('profiles').update({
      name: updatedUser.name,
      role: updatedUser.role,
      points: updatedUser.points,
      team_ids: updatedUser.team_ids,
      avatar_url: updatedUser.avatar,
      must_change_password: updatedUser.mustChangePassword
    }).eq('id', updatedUser.id);
    if (error) { console.error("EditUser Error:", error); alert("خطأ في التعديل: " + error.message); }
    else setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
  };

  const evaluateUser = async (userId: string, points: number, targetTeamId?: string) => {
    const user = users.find(u => u.id === userId);
    if (!user) return;
    
    const newPoints = Math.max(0, user.points + points);
    const { error: uError } = await supabase.from('profiles').update({ points: newPoints }).eq('id', userId);
    
    if (!uError) {
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, points: newPoints } : u));
      
      if (targetTeamId) {
        const team = teams.find(t => t.id === targetTeamId);
        if (team) {
          const newTeamPoints = Math.max(0, team.points + points);
          await supabase.from('teams').update({ points: newTeamPoints }).eq('id', targetTeamId);
          setTeams(prev => prev.map(t => t.id === targetTeamId ? { ...t, points: newTeamPoints } : t));
        }
      }
    }
  };

  const resetUserPoints = async (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (user) {
      await supabase.from('profiles').update({ points: 0 }).eq('id', userId);
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, points: 0 } : u));
    }
  };

  const addTeam = async (team: Team) => {
    const { error } = await supabase.from('teams').insert([team]);
    if (error) { console.error("AddTeam Error:", error); alert("خطأ: " + error.message); }
    else setTeams(prev => [...prev, team]);
  };

  const editTeam = async (updatedTeam: Team) => {
    const { error } = await supabase.from('teams').update(updatedTeam).eq('id', updatedTeam.id);
    if (error) { console.error("EditTeam Error:", error); alert("خطأ: " + error.message); }
    else setTeams(prev => prev.map(t => t.id === updatedTeam.id ? updatedTeam : t));
  };

  const deleteTeam = async (id: string) => {
    const { error } = await supabase.from('teams').delete().eq('id', id);
    if (!error) {
      setTeams(prev => prev.filter(t => t.id !== id));
      setUsers(prev => prev.map(u => ({
        ...u,
        team_ids: u.team_ids ? u.team_ids.filter(tId => tId !== id) : []
      })));
    }
  };

  const addAnnouncement = async (a: Announcement) => {
    const { error } = await supabase.from('announcements').insert([a]);
    if (error) { console.error("AddAnnouncement Error:", error); alert("خطأ: " + error.message); }
    else setAnnouncements(prev => [a, ...prev]);
  };

  const deleteAnnouncement = async (id: string) => {
    const { error } = await supabase.from('announcements').delete().eq('id', id);
    if (!error) setAnnouncements(prev => prev.filter(a => a.id !== id));
  };

  const addCriterion = async (c: Criterion) => {
    const { error } = await supabase.from('criteria').insert([c]);
    if (error) { console.error("AddCriterion Error:", error); alert("خطأ: " + error.message); }
    else setCriteria(prev => [...prev, c]);
  };

  const editCriterion = async (updated: Criterion) => {
    const { error } = await supabase.from('criteria').update(updated).eq('id', updated.id);
    if (!error) setCriteria(prev => prev.map(c => c.id === updated.id ? updated : c));
  };

  const deleteCriterion = async (id: string) => {
    const { error } = await supabase.from('criteria').delete().eq('id', id);
    if (!error) setCriteria(prev => prev.filter(c => c.id !== id));
  };

  const addTask = async (task: Task) => {
    const { error } = await supabase.from('tasks').insert([task]);
    if (error) { console.error("AddTask Error:", error); alert("خطأ: " + error.message); }
    else setTasks(prev => [task, ...prev]);
  };

  const editTask = async (updated: Task) => {
    const { error } = await supabase.from('tasks').update(updated).eq('id', updated.id);
    if (!error) setTasks(prev => prev.map(t => t.id === updated.id ? updated : t));
  };

  const deleteTask = async (id: string) => {
    const { error } = await supabase.from('tasks').delete().eq('id', id);
    if (!error) setTasks(prev => prev.filter(t => t.id !== id));
  };

  const addSuggestion = async (s: Omit<Suggestion, "id" | "created_at">) => {
    const newSugg = { ...s, id: crypto.randomUUID() };
    const { data, error } = await supabase.from('suggestions').insert([newSugg]).select().single();
    if (error) { console.error("AddSuggestion Error:", error); alert("خطأ في إرسال الاقتراح: " + error.message); }
    else setSuggestions(prev => [data, ...prev]);
  };

  const deleteSuggestion = async (id: string) => {
    const { error } = await supabase.from('suggestions').delete().eq('id', id);
    if (!error) setSuggestions(prev => prev.filter(s => s.id !== id));
  };

  const toggleTaskStatus = (taskId: string) => {
    setTasks(prev => {
      const task = prev.find(t => t.id === taskId);
      if (!task) return prev;
      const newStatus = task.status === "completed" ? "pending" : "completed";
      const pointsDelta = newStatus === "completed" ? task.points : -task.points;

      setUsers(u => u.map(usr => usr.id === task.assigned_to ? { ...usr, points: usr.points + pointsDelta } : usr));
      if (task.team_id) {
        setTeams(tm => tm.map(t => t.id === task.team_id ? { ...t, points: t.points + pointsDelta } : t));
      }
      return prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t);
    });
  };

  return (
    <DataContext.Provider value={{
      users, teams, announcements, criteria, tasks, suggestions, loading,
      addUser, deleteUser, editUser, evaluateUser,
      addTeam, editTeam, deleteTeam,
      addAnnouncement, deleteAnnouncement,
      addCriterion, editCriterion, deleteCriterion,
      addTask, editTask, deleteTask, toggleTaskStatus,
      addSuggestion, deleteSuggestion,
      resetUserPoints
    }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error("useData must be used within a DataProvider");
  }
  return context;
}
