"use client";

import { useData } from "@/components/DataProvider";
import { useAuth } from "@/lib/auth";

export function useScopedData() {
  const data = useData();
  const { user } = useAuth();

  if (!user) {
    return {
      ...data,
      users: [],
      teams: [],
      announcements: [],
      criteria: [],
      tasks: [],
      suggestions: [],
    };
  }

  // Filter lists based on the active user's gender (theme)
  return {
    ...data,
    users: data.users.filter((u) => u.theme === user.theme),
    teams: data.teams.filter((t) => t.theme === user.theme),
    announcements: data.announcements.filter((a) => a.theme === user.theme),
    criteria: data.criteria.filter((c) => c.theme === user.theme),
    suggestions: data.suggestions.filter((s) => s.theme === user.theme),
    // المهام: لا تُفلتر بالـtheme لأنها مرتبطة بـ user.id مباشرة
    // الفلترة الفعلية تتم في كل component حسب assigned_to
    tasks: data.tasks.filter((t) => {
      const assignedUser = data.users.find(u => u.id === t.assigned_to);
      return assignedUser?.theme === user.theme;
    }),

    // Auto-override the created entities to strictly enforce matching gender theme
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    addTeam: (team: any) => data.addTeam({ ...team, theme: user.theme }),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    addAnnouncement: (a: any) => data.addAnnouncement({ ...a, theme: user.theme }),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    addCriterion: (c: any) => data.addCriterion({ ...c, theme: user.theme }),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    addUser: (u: any) => data.addUser({ ...u, theme: user.theme }),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    addTask: (task: any) => data.addTask({ ...task, theme: user.theme }),
    resetUserPoints: data.resetUserPoints,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    addSuggestion: (s: any) => data.addSuggestion({ ...s, theme: user.theme }),
    deleteSuggestion: data.deleteSuggestion,
  };
}
