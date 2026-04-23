export type UserRole = "admin" | "vice_president" | "leader" | "vice_leader" | "member";
export type ThemePreference = "male" | "female";

export interface Criterion {
  id: string;
  title: string;
  target: "member" | "leader";
  theme: ThemePreference;
}

export interface Suggestion {
  id: string;
  title: string;
  content: string;
  author_id: string;
  theme: "male" | "female";
  category: string; // 'evaluation_team' or team id
  created_at: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  theme: ThemePreference;
  team_ids?: string[];
  points: number;
  avatar?: string;
  password?: string;
  mustChangePassword?: boolean;
}

export interface TeamLog {
  id: string;
  type: "deduct" | "reset";
  amount: number;
  reason?: string;
  date: string;
}

export interface Team {
  id: string;
  name: string;
  color_code: string;
  logo_url?: string;
  points: number;
  theme: ThemePreference;
  logs?: TeamLog[];
  motivation_deadline?: string;
  motivation_handled?: boolean;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  date: string;
  type: "info" | "warning" | "success";
  start_time?: string;
  deadline?: string;
  theme: ThemePreference;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  points: number;
  assigned_to: string;   // user id
  assigned_by: string;  // user id
  team_id?: string;      // لتحديد الفريق المستفيد
  status: "pending" | "completed";
  deadline?: string;
  date: string;          // تاريخ الإضافة
  theme: ThemePreference;
}

export const mockTeams: Team[] = [];

export const mockUsers: User[] = [
  { id: "u_admin_male", name: "مدير قسم الطلاب", email: "belalosama@gmail.com", role: "admin", theme: "male", points: 0, team_ids: [], password: "1234", mustChangePassword: true },
  { id: "u_admin_female", name: "مديرة قسم الطالبات", email: "female@dal.com", role: "admin", theme: "female", points: 0, team_ids: [], password: "1234", mustChangePassword: true },
];

export const mockAnnouncements: Announcement[] = [];

export const mockCriteria: Criterion[] = [];

export const mockTasks: Task[] = [];
