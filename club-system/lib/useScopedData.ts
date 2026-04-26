"use client";

import { useMemo } from "react";
import { useData } from "@/components/DataProvider";
import { useAuth } from "@/lib/auth";

export function useScopedData() {
  const data = useData();
  const { user } = useAuth();

  return useMemo(() => {
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

    const filteredUsers = data.users.filter((u) => u.theme === user.theme);

    return {
      ...data,
      users: filteredUsers,
      teams: data.teams.filter((t) => t.theme === user.theme),
      announcements: data.announcements.filter((a) => a.theme === user.theme),
      criteria: data.criteria.filter((c) => c.theme === user.theme),
      suggestions: data.suggestions.filter((s) => s.theme === user.theme),
      tasks: data.tasks.filter((t) => {
        const assignedUser = data.users.find(u => u.id === t.assigned_to);
        return assignedUser?.theme === user.theme;
      }),

      addTeam: (team: any) => data.addTeam({ ...team, theme: user.theme }),
      addAnnouncement: (a: any) => data.addAnnouncement({ ...a, theme: user.theme }),
      addCriterion: (c: any) => data.addCriterion({ ...c, theme: user.theme }),
      addUser: (u: any) => data.addUser({ ...u, theme: user.theme }),
      addTask: (task: any) => data.addTask({ ...task, theme: user.theme }),
      resetUserPoints: data.resetUserPoints,
      addSuggestion: (s: any) => data.addSuggestion({ ...s, theme: user.theme }),
      deleteSuggestion: data.deleteSuggestion,
    };
  }, [data, user]);
}
