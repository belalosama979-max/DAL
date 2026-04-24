"use client";
import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth";
import { useScopedData as useData } from "@/lib/useScopedData";
import { isAdmin } from "@/lib/roleUtils";
import { ChatConv, ChatMsg, MsgType } from "@/lib/chatTypes";
import supabase from "@/lib/supabase";

interface ChatCtxType {
  conversations: ChatConv[];
  activeConvId: string | null;
  setActiveConvId: (id: string | null) => void;
  isPanelOpen: boolean;
  setIsPanelOpen: (v: boolean) => void;
  sendMessage: (convId: string, content: string, type: MsgType) => void;
  markAsRead: (convId: string) => void;
  findOrCreateDirect: (otherId: string) => string;
  createGroup: (name: string, pIds: string[], admins: string[], restricted: boolean) => string;
  getTypingUsers: (convId: string) => string[];
  setTyping: (convId: string, typing: boolean) => void;
  onlineUsers: Set<string>;
  totalUnread: number;
  deleteMessage: (convId: string, msgId: string) => void;
  editMessage: (convId: string, msgId: string, newContent: string) => void;
  pinnedConvIds: string[];
  togglePinConv: (convId: string) => void;
}

const ChatCtx = createContext<ChatCtxType | null>(null);
export const useChat = () => useContext(ChatCtx)!;

const ONLINE_KEY = (uid: string) => `dal_online_${uid}`;
const TYPING_KEY = "dal_typing_v1";

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { users, teams } = useData();
  const [convs, setConvs] = useState<ChatConv[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const [typingMap, setTypingMap] = useState<Record<string, Record<string, number>>>({});
  const [pinnedConvIds, setPinnedConvIds] = useState<string[]>([]);

  const theme = user?.theme || "male";

  const loadAllData = useCallback(async () => {
    if (!user) return;
    
    // Load conversations
    const { data: dbConvs } = await supabase
      .from('conversations')
      .select('*, messages(*)')
      .eq('theme', theme);
    
    if (dbConvs) {
      const mapped: ChatConv[] = dbConvs.map((c: any) => ({
        id: c.id,
        convType: c.conv_type,
        participantIds: c.participant_ids,
        name: c.name,
        adminIds: c.admin_ids,
        restricted: c.restricted,
        teamId: c.team_id,
        isLeadershipGroup: c.is_leadership_group,
        msgs: (c.messages || []).map((m: any) => ({
          id: m.id,
          senderId: m.sender_id,
          content: m.content,
          type: m.type,
          ts: m.created_at,
          readBy: m.read_by,
          edited: m.edited
        })).sort((a: any, b: any) => new Date(a.ts).getTime() - new Date(b.ts).getTime())
      }));
      setConvs(mapped);
    }
  }, [user, theme]);

  useEffect(() => { loadAllData(); }, [loadAllData]);

  // Real-time messages
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel('schema-db-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, () => {
        loadAllData();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, loadAllData]);

  // Online heartbeat
  useEffect(() => {
    if (!user) return;
    const tick = () => localStorage.setItem(ONLINE_KEY(user.id), Date.now().toString());
    tick();
    const iv = setInterval(tick, 20000);
    return () => clearInterval(iv);
  }, [user]);

  // Check online users
  useEffect(() => {
    const check = () => {
      const now = Date.now();
      const s = new Set<string>();
      users.forEach(u => {
        const ts = localStorage.getItem(ONLINE_KEY(u.id));
        if (ts && now - parseInt(ts) < 120000) s.add(u.id);
      });
      setOnlineUsers(s);
    };
    check();
    const iv = setInterval(check, 10000);
    return () => clearInterval(iv);
  }, [users]);

  const sendMessage = useCallback(async (convId: string, content: string, type: MsgType) => {
    if (!user) return;
    await supabase.from('messages').insert([{
      conversation_id: convId,
      sender_id: user.id,
      content,
      type,
      read_by: [user.id]
    }]);
  }, [user]);

  const markAsRead = useCallback(async (convId: string) => {
    if (!user) return;
    const conv = convs.find(c => c.id === convId);
    if (!conv) return;
    
    for (const m of conv.msgs) {
      if (!m.readBy.includes(user.id)) {
        await supabase.from('messages').update({
          read_by: [...m.readBy, user.id]
        }).eq('id', m.id);
      }
    }
  }, [user, convs]);

  const findOrCreateDirect = useCallback(async (otherId: string): Promise<string> => {
    if (!user) return "";
    const ex = convs.find(c => c.convType === "direct" && c.participantIds.includes(user.id) && c.participantIds.includes(otherId));
    if (ex) return ex.id;
    
    const id = `d_${Date.now()}`;
    await supabase.from('conversations').insert([{
      id,
      conv_type: 'direct',
      participant_ids: [user.id, otherId],
      theme
    }]);
    loadAllData();
    return id;
  }, [user, convs, theme, loadAllData]);

  const createGroup = useCallback(async (name: string, pIds: string[], admins: string[], restricted: boolean): Promise<string> => {
    if (!user) return "";
    const id = `g_${Date.now()}`;
    await supabase.from('conversations').insert([{
      id,
      name,
      conv_type: 'group',
      participant_ids: [...new Set([user.id, ...pIds])],
      admin_ids: [...new Set([user.id, ...admins])],
      restricted,
      theme
    }]);
    loadAllData();
    return id;
  }, [user, theme, loadAllData]);

  const setTyping = useCallback((convId: string, typing: boolean) => {
    // Keep typing in localStorage for simplicity and performance
    if (!user) return;
    let map: Record<string, Record<string, number>> = {};
    try { map = JSON.parse(localStorage.getItem(TYPING_KEY) || "{}"); } catch {}
    if (!map[convId]) map[convId] = {};
    if (typing) map[convId][user.id] = Date.now();
    else delete map[convId][user.id];
    localStorage.setItem(TYPING_KEY, JSON.stringify(map));
    setTypingMap(map);
  }, [user]);

  const getTypingUsers = useCallback((convId: string): string[] => {
    if (!user) return [];
    const now = Date.now();
    return Object.entries(typingMap[convId] || {}).filter(([uid, ts]) => uid !== user.id && now - ts < 4000).map(([uid]) => uid);
  }, [typingMap, user]);

  const deleteMessage = useCallback(async (convId: string, msgId: string) => {
    await supabase.from('messages').delete().eq('id', msgId);
  }, []);

  const editMessage = useCallback(async (convId: string, msgId: string, newContent: string) => {
    await supabase.from('messages').update({
      content: newContent,
      edited: true
    }).eq('id', msgId);
  }, []);

  const togglePinConv = useCallback((convId: string) => {
    setPinnedConvIds(prev => prev.includes(convId) ? prev.filter(id => id !== convId) : [...prev, convId]);
  }, []);

  const myConvs = convs.filter(c => user && c.participantIds.includes(user.id));
  const totalUnread = myConvs.reduce((s, c) => s + c.msgs.filter(m => user && !m.readBy.includes(user.id)).length, 0);

  return (
    <ChatCtx.Provider value={{
      conversations: myConvs, activeConvId, setActiveConvId, isPanelOpen, setIsPanelOpen,
      sendMessage, markAsRead, findOrCreateDirect: (oid) => { findOrCreateDirect(oid); return ""; },
      createGroup: (n, p, a, r) => { createGroup(n,p,a,r); return ""; },
      getTypingUsers, setTyping, onlineUsers, totalUnread, deleteMessage, editMessage, pinnedConvIds, togglePinConv
    }}>
      {children}
    </ChatCtx.Provider>
  );
}
