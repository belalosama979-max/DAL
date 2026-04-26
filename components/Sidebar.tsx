"use client";

import { useAuth } from "@/lib/auth";
import { Home, Users, Activity, Award, LogOut, Megaphone, MessageSquarePlus } from "lucide-react";
import { usePathname } from "next/navigation";
import { isAdmin, isLeader, getRoleLabel } from "@/lib/roleUtils";

export function Sidebar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();

  const adminLinks = [
    { name: "الرئيسية", href: "/admin", icon: Home },
    { name: "الفرق", href: "/admin/teams", icon: Users },
    { name: "إدارة الأعضاء", href: "/admin/users", icon: Users },
    { name: "إدارة المعايير", href: "/admin/criteria", icon: Activity },
    { name: "التقييمات", href: "/admin/evaluations", icon: Award },
    { name: "الإعلانات", href: "/admin/announcements", icon: Megaphone },
  ];

  if (user && (user.role === "admin" || user.role === "vice_president")) {
    adminLinks.push({ name: "اقتراحات للأفرقة", href: "/admin/suggestions", icon: MessageSquarePlus });
  }

  const leaderLinks = [
    { name: "الرئيسية", href: "/member", icon: Home },
    { name: "فريقي", href: "/member/team", icon: Users },
    { name: "إدارة المعايير", href: "/admin/criteria", icon: Activity },
    { name: "التقييمات والمهام", href: "/admin/evaluations", icon: Award },
  ];

  const memberLinks = [
    { name: "الرئيسية", href: "/member", icon: Home },
    { name: "فريقي", href: "/member/team", icon: Users },
    { name: "المهام والأنشطة", href: "/member/activities", icon: Activity },
  ];

  const links = isAdmin(user?.role) ? adminLinks : isLeader(user?.role) ? leaderLinks : memberLinks;

  if (!user) {
    return (
      <aside className="w-64 bg-background border-l border-secondary hidden md:flex flex-col h-screen fixed right-0 top-0 pt-6 animate-pulse">
        <div className="px-6 mb-10 h-11 w-40 bg-secondary/50 rounded-xl" />
        <div className="flex-1 px-4 flex flex-col gap-4">
          <div className="h-10 w-full bg-secondary/30 rounded-xl" />
          <div className="h-10 w-full bg-secondary/30 rounded-xl" />
          <div className="h-10 w-full bg-secondary/30 rounded-xl" />
        </div>
      </aside>
    );
  }

  return (
    <aside className="w-64 bg-background border-l border-secondary hidden md:flex flex-col h-screen fixed right-0 top-0 pt-6 z-40">
      <div className="px-6 mb-10 flex items-center gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.png" alt="شعار المبادرة" className="w-11 h-11 object-contain shrink-0" />
        <div className="flex flex-col gap-1">
          <h2 className="font-black text-xl text-foreground leading-normal tracking-tight">مبادرة دال</h2>
          <p className="text-xs font-bold text-foreground/50 tracking-wider">
            {isAdmin(user.role) ? 'لوحة الإدارة' : isLeader(user.role) ? 'لوحة القائد' : 'لوحة العضو'}
          </p>
        </div>
      </div>

      <nav className="flex-1 px-4 flex flex-col gap-1 overflow-y-auto">
        {links.map((link, idx) => {
          const isActive = pathname === link.href;
          const Icon = link.icon;
          return (
            <a
              key={`${link.href}-${idx}`}
              href={link.href}
              className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl transition-all no-underline ${
                isActive
                  ? "bg-primary/10 text-primary font-bold"
                  : "text-foreground/70 hover:bg-secondary hover:text-foreground"
              }`}
            >
              <Icon className={`w-5 h-5 shrink-0 ${isActive ? "text-primary" : ""}`} />
              <span>{link.name}</span>
            </a>
          );
        })}
      </nav>

      <div className="p-4 border-t border-secondary">
        <a href="/profile" className="block bg-secondary/50 rounded-2xl p-4 mb-3 hover:bg-secondary transition-colors no-underline">
          <div className="flex items-center gap-3">
            {user.avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={user.avatar} alt="Avatar" className="w-10 h-10 rounded-full object-cover shadow-sm bg-background border border-secondary" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold shadow-sm text-sm">
                {user.name.substring(0, 1)}
              </div>
            )}
            <div className="overflow-hidden">
              <p className="font-semibold text-sm text-foreground truncate">{user.name}</p>
              <p className="text-xs text-foreground/60 truncate">{getRoleLabel(user.role, user.theme)}</p>
            </div>
          </div>
        </a>
        <button
          onClick={logout}
          className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-red-500 hover:bg-red-500/10 transition-colors font-semibold"
        >
          <LogOut className="w-5 h-5" />
          تسجيل الخروج
        </button>
      </div>
    </aside>
  );
}
