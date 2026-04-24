import { ThemePreference, UserRole } from "./mockData";

export const getRoleLabel = (role: UserRole, theme: ThemePreference): string => {
  if (theme === "female") {
    switch (role) {
      case "admin": return "الرئيسة";
      case "vice_president": return "نائبة الرئيسة";
      case "leader": return "مسؤولة فريق";
      case "vice_leader": return "نائبة مسؤولة فريق";
      case "member": return "عضوة مشاركة";
      default: return role;
    }
  } else {
    switch (role) {
      case "admin": return "الرئيس";
      case "vice_president": return "نائب الرئيس";
      case "leader": return "مسؤول فريق";
      case "vice_leader": return "نائب مسؤول فريق";
      case "member": return "عضو مشارك";
      default: return role;
    }
  }
};

export const isAdmin = (role?: UserRole | null | string): boolean => {
  if (!role) return false;
  return role === "admin" || role === "vice_president";
};

export const isLeader = (role?: UserRole | null | string): boolean => {
  if (!role) return false;
  return role === "leader" || role === "vice_leader";
};
