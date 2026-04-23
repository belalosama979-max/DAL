"use client";

import { Sidebar } from "@/components/Sidebar";
import { TutorialOverlay } from "@/components/TutorialOverlay";
import { ChatProvider } from "@/components/chat/ChatProvider";
import { ChatWidget } from "@/components/chat/ChatWidget";
import { useAuth } from "@/lib/auth";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useAuth();

  if (!user) return <div className="min-h-screen flex items-center justify-center">جاري التحميل...</div>;

  return (
    <ChatProvider>
      <TutorialOverlay />
      <div className="min-h-screen bg-secondary/30">
        <Sidebar />
        <div className="md:pr-64 min-h-screen flex flex-col">
          <header className="h-20 border-b border-secondary/50 bg-background/50 backdrop-blur-md flex items-center px-8 sticky top-0 z-30">
            <h1 className="text-xl font-bold text-foreground">
              مرحباً بك، {user.name} 👋
            </h1>
          </header>
          <main className="flex-1 p-8">
            {children}
          </main>
        </div>
        <ChatWidget />
      </div>
    </ChatProvider>
  );
}
