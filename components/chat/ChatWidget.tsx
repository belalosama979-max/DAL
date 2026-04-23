"use client";
import { useState, useRef, useEffect } from "react";
import { useChat } from "./ChatProvider";
import { useAuth } from "@/lib/auth";
import { useScopedData as useData } from "@/lib/useScopedData";
import { ChatConv, ChatMsg } from "@/lib/chatTypes";
import { MessageCircle, X, ArrowRight, Plus, Send, Image as ImageIcon, Smile, Check, CheckCheck, Users, Lock, Mic, Square, Pin, PinOff, Pencil, Trash2, MoreVertical, Star } from "lucide-react";

const EMOJIS = ["😀","😂","😊","❤️","👍","🔥","🎉","🙏","💪","✅","👏","🥳","💯","🌟","😎","😢","😮","🤔","💡","⭐","🎯","📌","✨","🤝","💬"];
const fmt = (ts: string) => new Date(ts).toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" });
const fmtDay = (ts: string) => new Date(ts).toLocaleDateString("ar-SA");

export function ChatWidget() {
  const { user } = useAuth();
  const { users } = useData();
  const chat = useChat();
  const { conversations, activeConvId, setActiveConvId, isPanelOpen, setIsPanelOpen, sendMessage, markAsRead, findOrCreateDirect, createGroup, getTypingUsers, setTyping, onlineUsers, totalUnread, deleteMessage, editMessage, pinnedConvIds, togglePinConv } = chat;

  const [view, setView] = useState<"list" | "chat" | "new" | "newgroup">("list");
  const [search, setSearch] = useState("");
  const [text, setText] = useState("");
  const [showEmoji, setShowEmoji] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [groupMembers, setGroupMembers] = useState<string[]>([]);
  const [groupAdmins, setGroupAdmins] = useState<string[]>([]);
  const [groupRestricted, setGroupRestricted] = useState(false);
  const [recording, setRecording] = useState(false);
  const [msgMenu, setMsgMenu] = useState<{ msgId: string; isMine: boolean; x: number; y: number } | null>(null);
  const [showPinSub, setShowPinSub] = useState(false);
  const [editingMsgId, setEditingMsgId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [starredMsgs, setStarredMsgs] = useState<string[]>(() => { try { return JSON.parse(localStorage.getItem('dal_starred_msgs') || '[]'); } catch { return []; } });
  const [pinnedMsgMap, setPinnedMsgMap] = useState<Record<string, string>>(() => { try { return JSON.parse(localStorage.getItem('dal_pinned_msg_map') || '{}'); } catch { return {}; } });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  const activeConv = conversations.find(c => c.id === activeConvId);
  const otherUsers = users.filter(u => u.id !== user?.id);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeConv?.msgs.length]);

  useEffect(() => {
    if (activeConvId && isPanelOpen) markAsRead(activeConvId);
  }, [activeConvId, isPanelOpen, activeConv?.msgs.length]);

  // Removed useEffect for isPanelOpen to avoid setState in effect

  const getName = (conv: ChatConv) => {
    if (conv.name) return conv.name;
    const oid = conv.participantIds.find(id => id !== user?.id);
    return users.find(u => u.id === oid)?.name || "محادثة";
  };

  const getAvatar = (conv: ChatConv) => getName(conv).charAt(0);

  const getLastMsg = (conv: ChatConv) => {
    const m = conv.msgs[conv.msgs.length - 1];
    if (!m) return "لا توجد رسائل";
    const map: Record<string, string> = { image: "📷 صورة", video: "🎥 فيديو", audio: "🎙️ رسالة صوتية" };
    return map[m.type] || m.content.slice(0, 35);
  };

  const getUnread = (conv: ChatConv) => conv.msgs.filter(m => user && !m.readBy.includes(user.id)).length;

  const getOther = (conv: ChatConv) => {
    const oid = conv.participantIds.find(id => id !== user?.id);
    return users.find(u => u.id === oid);
  };

  const handleSend = () => {
    if (!text.trim() || !activeConvId) return;
    if (activeConv?.restricted && !activeConv.adminIds?.includes(user?.id || "")) return;
    sendMessage(activeConvId, text.trim(), "text");
    setText("");
    setShowEmoji(false);
    if (activeConvId) setTyping(activeConvId, false);
  };

  const handleTyping = (val: string) => {
    setText(val);
    if (!activeConvId) return;
    setTyping(activeConvId, true);
    clearTimeout(typingRef.current);
    typingRef.current = setTimeout(() => setTyping(activeConvId, false), 3000);
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeConvId) return;
    if (file.size > 4 * 1024 * 1024) { alert("الحد الأقصى 4MB"); return; }
    const reader = new FileReader();
    reader.onloadend = () => {
      const type = file.type.startsWith("video") ? "video" : "image";
      sendMessage(activeConvId, reader.result as string, type);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      chunksRef.current = [];
      mr.ondataavailable = e => chunksRef.current.push(e.data);
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        const reader = new FileReader();
        reader.onloadend = () => { if (activeConvId) sendMessage(activeConvId, reader.result as string, "audio"); };
        reader.readAsDataURL(blob);
        stream.getTracks().forEach(t => t.stop());
      };
      mr.start();
      mediaRef.current = mr;
      setRecording(true);
    } catch { alert("لا يمكن الوصول للميكروفون"); }
  };

  const stopRecording = () => {
    mediaRef.current?.stop();
    setRecording(false);
  };

  const openChat = (id: string) => { setActiveConvId(id); setView("chat"); };

  const typingUsers = activeConvId ? getTypingUsers(activeConvId) : [];
  const typingNames = typingUsers.map(id => users.find(u => u.id === id)?.name?.split(" ")[0]).filter(Boolean);
  const isRestricted = activeConv?.restricted && !activeConv.adminIds?.includes(user?.id || "");
  const filtered = [...conversations.filter(c => getName(c).includes(search))].sort((a, b) => {
    const ap = pinnedConvIds.includes(a.id) ? 0 : 1;
    const bp = pinnedConvIds.includes(b.id) ? 0 : 1;
    return ap - bp;
  });

  const ReadIcon = ({ msg }: { msg: ChatMsg }) => {
    if (!activeConv || msg.senderId !== user?.id) return null;
    const others = activeConv.participantIds.filter(id => id !== user.id);
    const readCount = msg.readBy.filter(id => id !== user.id).length;
    if (readCount >= others.length) return <CheckCheck className="w-3 h-3 text-blue-500 inline" />;
    if (msg.readBy.length > 1) return <CheckCheck className="w-3 h-3 text-foreground/40 inline" />;
    return <Check className="w-3 h-3 text-foreground/40 inline" />;
  };

  if (!user) return null;

  return (
    <>
      {/* FAB */}
      <button
        onClick={() => { 
          const nextState = !isPanelOpen;
          setIsPanelOpen(nextState); 
          if (nextState) { 
            setView("list"); 
            setActiveConvId(null); 
          } else {
            setMsgMenu(null);
            setShowPinSub(false);
          }
        }}
        className="fixed bottom-6 left-6 z-[9990] w-14 h-14 bg-primary text-primary-foreground rounded-full shadow-2xl shadow-primary/40 flex items-center justify-center hover:scale-110 transition-transform"
      >
        {isPanelOpen ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
        {!isPanelOpen && totalUnread > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center animate-pulse">
            {totalUnread > 9 ? "9+" : totalUnread}
          </span>
        )}
      </button>

      {/* Message Action Menu */}
      {msgMenu && (
        <>
          <div className="fixed inset-0 z-[9998]" onClick={() => { setMsgMenu(null); setShowPinSub(false); }} />
          <div className="fixed z-[9999] bg-background border border-secondary rounded-2xl shadow-2xl overflow-hidden animate-[fade-in_0.1s_ease-out] min-w-[160px]"
            style={{ top: msgMenu.y, left: Math.min(msgMenu.x, window.innerWidth - 180) }}>
            {/* Edit - only own text messages */}
            {msgMenu.isMine && (
              <button onClick={() => {
                const msg = activeConv?.msgs.find(m => m.id === msgMenu.msgId);
                if (msg) { setEditingMsgId(msg.id); setEditText(msg.content); }
                setMsgMenu(null); setShowPinSub(false);
              }} className="flex items-center gap-2 w-full px-4 py-2.5 hover:bg-secondary text-sm text-foreground transition-colors">
                <Pencil className="w-3.5 h-3.5 text-primary" /> تعديل الرسالة
              </button>
            )}
            {/* Star */}
            <button onClick={() => {
              setStarredMsgs(prev => {
                const next = prev.includes(msgMenu.msgId) ? prev.filter(id => id !== msgMenu.msgId) : [...prev, msgMenu.msgId];
                localStorage.setItem('dal_starred_msgs', JSON.stringify(next));
                return next;
              });
              setMsgMenu(null); setShowPinSub(false);
            }} className="flex items-center gap-2 w-full px-4 py-2.5 hover:bg-secondary text-sm text-foreground transition-colors border-t border-secondary/30">
              <Star className={`w-3.5 h-3.5 ${starredMsgs.includes(msgMenu.msgId) ? 'text-yellow-500 fill-yellow-500' : 'text-foreground/50'}`} />
              {starredMsgs.includes(msgMenu.msgId) ? 'إلغاء التمييز' : 'تمييز (نجمة)'}
            </button>
            {/* Pin with sub-menu */}
            <div className="relative border-t border-secondary/30">
              <button onClick={() => setShowPinSub(!showPinSub)} className="flex items-center justify-between gap-2 w-full px-4 py-2.5 hover:bg-secondary text-sm text-foreground transition-colors">
                <span className="flex items-center gap-2">
                  <Pin className="w-3.5 h-3.5 text-foreground/50" />
                  {pinnedMsgMap[msgMenu.msgId] ? 'إلغاء التثبيت' : 'تثبيت الرسالة'}
                </span>
                <span className="text-foreground/30">›</span>
              </button>
              {showPinSub && (
                <div className="absolute right-full top-0 bg-background border border-secondary rounded-xl shadow-2xl overflow-hidden min-w-[130px]">
                  {[
                    { label: 'لمدة ساعة', hours: 1 },
                    { label: 'لمدة 24 ساعة', hours: 24 },
                    { label: 'لمدة أسبوع', hours: 168 },
                    { label: 'لمدة شهر', hours: 720 },
                  ].map(opt => (
                    <button key={opt.hours} onClick={() => {
                      const expiresAt = new Date(Date.now() + opt.hours * 3600000).toISOString();
                      setPinnedMsgMap(prev => {
                        const next = { ...prev, [msgMenu.msgId]: expiresAt };
                        localStorage.setItem('dal_pinned_msg_map', JSON.stringify(next));
                        return next;
                      });
                      setMsgMenu(null); setShowPinSub(false);
                    }} className="flex w-full px-4 py-2.5 hover:bg-secondary text-sm text-foreground transition-colors">
                      {opt.label}
                    </button>
                  ))}
                  {pinnedMsgMap[msgMenu.msgId] && (
                    <button onClick={() => {
                      setPinnedMsgMap(prev => {
                        const next = { ...prev };
                        delete next[msgMenu.msgId];
                        localStorage.setItem('dal_pinned_msg_map', JSON.stringify(next));
                        return next;
                      });
                      setMsgMenu(null); setShowPinSub(false);
                    }} className="flex w-full px-4 py-2.5 hover:bg-red-500/10 text-sm text-red-500 transition-colors border-t border-secondary/30">
                      إلغاء التثبيت
                    </button>
                  )}
                </div>
              )}
            </div>
            {/* Delete - only own */}
            {msgMenu.isMine && (
              <button onClick={() => {
                if (activeConvId) deleteMessage(activeConvId, msgMenu.msgId);
                setMsgMenu(null); setShowPinSub(false);
              }} className="flex items-center gap-2 w-full px-4 py-2.5 hover:bg-red-500/10 text-sm text-red-500 transition-colors border-t border-secondary/30">
                <Trash2 className="w-3.5 h-3.5" /> حذف الرسالة
              </button>
            )}
          </div>
        </>
      )}

      {/* Panel */}
      {isPanelOpen && (
        <div className="fixed bottom-24 left-6 z-[9991] w-[360px] h-[540px] bg-background border border-secondary rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-[fade-in_0.2s_ease-out]">

          {/* ========== LIST VIEW ========== */}
          {view === "list" && (<>
            <div className="p-4 border-b border-secondary/50 flex items-center justify-between shrink-0">
              <h3 className="font-black text-lg">الدردشة</h3>
              <div className="flex gap-1">
                <button onClick={() => setView("newgroup")} title="مجموعة جديدة" className="p-2 hover:bg-secondary rounded-xl transition-colors"><Users className="w-4 h-4 text-foreground/60" /></button>
                <button onClick={() => setView("new")} title="محادثة جديدة" className="p-2 hover:bg-secondary rounded-xl transition-colors"><Plus className="w-4 h-4 text-foreground/60" /></button>
              </div>
            </div>
            <div className="px-3 pt-2 pb-1 shrink-0">
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="بحث..." className="w-full px-3 py-2 bg-secondary/30 rounded-xl text-sm outline-none focus:ring-1 focus:ring-primary border border-transparent focus:border-primary" />
            </div>
            <div className="flex-1 overflow-y-auto px-2 py-1">
              {filtered.length === 0 && <p className="text-center text-foreground/40 text-sm mt-12">لا توجد محادثات</p>}
              {filtered.map(conv => {
                const other = conv.convType === "direct" ? getOther(conv) : null;
                const unread = getUnread(conv);
                const online = other ? onlineUsers.has(other.id) : false;
                const isPinned = pinnedConvIds.includes(conv.id);
                return (
                  <button key={conv.id} onClick={() => openChat(conv.id)} className="flex items-center gap-3 p-3 rounded-2xl hover:bg-secondary/50 w-full text-right transition-colors group">
                    <div className="relative shrink-0">
                      <div className="w-11 h-11 rounded-full bg-primary/20 text-primary font-bold text-sm flex items-center justify-center">{getAvatar(conv)}</div>
                      {other && <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-background ${online ? "bg-green-500" : "bg-foreground/20"}`} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline">
                        <span className="font-bold text-sm truncate flex items-center gap-1">
                          {isPinned && <Pin className="w-3 h-3 text-primary inline shrink-0" />}
                          {getName(conv)}
                        </span>
                        {conv.msgs.length > 0 && <span className="text-[10px] text-foreground/40 shrink-0 mr-1">{fmt(conv.msgs[conv.msgs.length-1].ts)}</span>}
                      </div>
                      <p className="text-xs text-foreground/50 truncate">{getLastMsg(conv)}</p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {unread > 0 && <span className="w-5 h-5 bg-primary text-primary-foreground text-[10px] font-black rounded-full flex items-center justify-center">{unread}</span>}
                      <button onClick={e => { e.stopPropagation(); togglePinConv(conv.id); }} className="opacity-0 group-hover:opacity-100 p-1 hover:bg-secondary rounded-lg transition-all" title={isPinned ? "إلغاء التثبيت" : "تثبيت"}>
                        {isPinned ? <PinOff className="w-3.5 h-3.5 text-foreground/40" /> : <Pin className="w-3.5 h-3.5 text-foreground/40" />}
                      </button>
                    </div>
                  </button>
                );
              })}
            </div>
          </>)}

          {/* ========== NEW DIRECT ========== */}
          {view === "new" && (<>
            <div className="p-4 border-b border-secondary/50 flex items-center gap-3 shrink-0">
              <button onClick={() => setView("list")} className="p-1.5 hover:bg-secondary rounded-lg"><ArrowRight className="w-4 h-4" /></button>
              <h3 className="font-black">محادثة جديدة</h3>
            </div>
            <div className="flex-1 overflow-y-auto p-2">
              {otherUsers.map(u => (
                <button key={u.id} onClick={() => { openChat(findOrCreateDirect(u.id)); }} className="flex items-center gap-3 p-3 rounded-2xl hover:bg-secondary/50 w-full text-right transition-colors">
                  <div className="relative">
                    <div className="w-10 h-10 rounded-full bg-primary/20 text-primary font-bold flex items-center justify-center">{u.name.charAt(0)}</div>
                    <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-background ${onlineUsers.has(u.id) ? "bg-green-500" : "bg-foreground/20"}`} />
                  </div>
                  <div>
                    <p className="font-bold text-sm">{u.name}</p>
                    <p className="text-xs text-foreground/50">{onlineUsers.has(u.id) ? "🟢 متصل الآن" : "⚫ غير متصل"}</p>
                  </div>
                </button>
              ))}
            </div>
          </>)}

          {/* ========== NEW GROUP ========== */}
          {view === "newgroup" && (<>
            <div className="p-4 border-b border-secondary/50 flex items-center gap-3 shrink-0">
              <button onClick={() => setView("list")} className="p-1.5 hover:bg-secondary rounded-lg"><ArrowRight className="w-4 h-4" /></button>
              <h3 className="font-black">مجموعة جديدة</h3>
            </div>
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
              <input value={groupName} onChange={e => setGroupName(e.target.value)} placeholder="اسم المجموعة *" className="w-full p-2.5 rounded-xl bg-secondary/30 border border-secondary/50 text-sm outline-none" />
              <label className="flex items-center gap-2 text-sm text-foreground/70 cursor-pointer">
                <input type="checkbox" checked={groupRestricted} onChange={e => setGroupRestricted(e.target.checked)} className="w-4 h-4" />
                <Lock className="w-3 h-3" /> الرسائل للمشرفين فقط
              </label>
              <p className="text-xs font-bold text-foreground/50">اختر الأعضاء:</p>
              {otherUsers.map(u => (
                <label key={u.id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-secondary/30 cursor-pointer">
                  <input type="checkbox" checked={groupMembers.includes(u.id)} onChange={e => setGroupMembers(p => e.target.checked ? [...p, u.id] : p.filter(id => id !== u.id))} className="w-4 h-4" />
                  <div className="w-8 h-8 rounded-full bg-primary/20 text-primary font-bold text-xs flex items-center justify-center">{u.name.charAt(0)}</div>
                  <div>
                    <p className="text-sm font-bold">{u.name}</p>
                    <label className="flex items-center gap-1 text-[10px] text-foreground/50 cursor-pointer">
                      <input type="checkbox" checked={groupAdmins.includes(u.id)} onChange={e => setGroupAdmins(p => e.target.checked ? [...p, u.id] : p.filter(id => id !== u.id))} className="w-3 h-3" />
                      مشرف
                    </label>
                  </div>
                </label>
              ))}
            </div>
            <div className="p-4 border-t border-secondary/50 shrink-0">
              <button onClick={() => { if (!groupName.trim() || groupMembers.length === 0) return; const id = createGroup(groupName, groupMembers, groupAdmins, groupRestricted); setGroupName(""); setGroupMembers([]); setGroupAdmins([]); openChat(id); }}
                className="w-full py-2.5 bg-primary text-primary-foreground rounded-xl font-bold text-sm hover:opacity-90 transition-all">
                إنشاء المجموعة
              </button>
            </div>
          </>)}

          {/* ========== CHAT VIEW ========== */}
          {view === "chat" && activeConv && (<>
            {/* Header */}
            <div className="p-3 border-b border-secondary/50 flex items-center gap-3 shrink-0 bg-background">
              <button onClick={() => { setView("list"); setActiveConvId(null); }} className="p-1.5 hover:bg-secondary rounded-lg shrink-0"><ArrowRight className="w-4 h-4" /></button>
              <div className="relative shrink-0">
                <div className="w-9 h-9 rounded-full bg-primary/20 text-primary font-bold text-sm flex items-center justify-center">{getAvatar(activeConv)}</div>
                {activeConv.convType === "direct" && getOther(activeConv) && (
                  <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-background ${onlineUsers.has(getOther(activeConv)!.id) ? "bg-green-500" : "bg-foreground/20"}`} />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm truncate">{getName(activeConv)}</p>
                <p className="text-[10px] text-foreground/50">
                  {activeConv.convType === "direct"
                    ? (getOther(activeConv) && onlineUsers.has(getOther(activeConv)!.id) ? "🟢 متصل الآن" : "⚫ غير متصل")
                    : `${activeConv.participantIds.length} أعضاء`}
                </p>
              </div>
              {activeConv.restricted && <span title="مجموعة مقيدة"><Lock className="w-4 h-4 text-foreground/40 shrink-0" /></span>}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2">
              {activeConv.msgs.length === 0 && <p className="text-center text-foreground/30 text-xs mt-8">ابدأ المحادثة...</p>}
              {activeConv.msgs.map((msg, i) => {
                const isMine = msg.senderId === user.id;
                const sender = users.find(u => u.id === msg.senderId);
                const prevMsg = activeConv.msgs[i - 1];
                const showDay = !prevMsg || fmtDay(msg.ts) !== fmtDay(prevMsg.ts);
                return (
                  <div key={msg.id}>
                    {showDay && <div className="text-center text-[10px] text-foreground/30 my-2 bg-secondary/20 px-3 py-1 rounded-full w-fit mx-auto">{fmtDay(msg.ts)}</div>}
                    {/* Pinned banner */}
                    {pinnedMsgMap[msg.id] && new Date(pinnedMsgMap[msg.id]) > new Date() && (
                      <div className="flex items-center gap-1 text-[10px] text-primary/70 px-2 mb-0.5"><Pin className="w-3 h-3" /> رسالة مثبتة</div>
                    )}
                    <div className={`flex ${isMine ? "justify-start" : "justify-end"} gap-1.5 group/msg items-end`}>
                      {!isMine && <div className="w-6 h-6 rounded-full bg-secondary text-foreground/60 text-[10px] font-bold flex items-center justify-center shrink-0 mb-1">{sender?.name.charAt(0)}</div>}
                      {/* ⋮ button for own messages */}
                      {isMine && (
                        <button onClick={e => { e.stopPropagation(); setMsgMenu({ msgId: msg.id, isMine, x: e.clientX - 160, y: e.clientY }); setShowPinSub(false); }}
                          className="opacity-0 group-hover/msg:opacity-100 transition-opacity p-1 hover:bg-secondary rounded-full shrink-0 mb-1">
                          <MoreVertical className="w-3.5 h-3.5 text-foreground/40" />
                        </button>
                      )}
                      <div className={`max-w-[72%] ${isMine ? "items-start" : "items-end"} flex flex-col gap-0.5`}>
                        {!isMine && activeConv.convType === "group" && <span className="text-[10px] text-primary font-bold px-1">{sender?.name}</span>}
                        {editingMsgId === msg.id ? (
                          <div className="flex gap-1">
                            <input value={editText} onChange={e => setEditText(e.target.value)} className="flex-1 px-2 py-1 rounded-xl bg-secondary/50 border border-primary text-sm outline-none" onKeyDown={e => { if (e.key === 'Enter') { editMessage(activeConvId!, msg.id, editText); setEditingMsgId(null); } if (e.key === 'Escape') setEditingMsgId(null); }} autoFocus />
                            <button onClick={() => { editMessage(activeConvId!, msg.id, editText); setEditingMsgId(null); }} className="px-2 py-1 bg-primary text-primary-foreground rounded-lg text-xs">حفظ</button>
                          </div>
                        ) : (
                          <div className={`px-3 py-2 rounded-2xl text-sm ${isMine ? "bg-secondary/40 text-foreground rounded-tr-sm" : "bg-primary text-primary-foreground rounded-tl-sm"}`}>
                            {msg.type === "text" && <span>{msg.content}{(msg as ChatMsg & { edited?: boolean }).edited && <span className="text-[9px] opacity-50 mr-1">(معدّل)</span>}</span>}
                            {msg.type === "image" && <img src={msg.content} alt="صورة" className="max-w-[200px] rounded-xl" />}
                            {msg.type === "video" && <video src={msg.content} controls className="max-w-[200px] rounded-xl" />}
                            {msg.type === "audio" && <audio src={msg.content} controls className="w-40" />}
                          </div>
                        )}
                        <div className={`flex items-center gap-1 px-1 ${isMine ? "justify-start" : "justify-end"}`}>
                          {starredMsgs.includes(msg.id) && <Star className="w-2.5 h-2.5 text-yellow-500 fill-yellow-500" />}
                          <span className="text-[9px] text-foreground/30">{fmt(msg.ts)}</span>
                          <ReadIcon msg={msg} />
                        </div>
                      </div>
                      {/* ⋮ button for others' messages */}
                      {!isMine && (
                        <button onClick={e => { e.stopPropagation(); setMsgMenu({ msgId: msg.id, isMine, x: e.clientX, y: e.clientY }); setShowPinSub(false); }}
                          className="opacity-0 group-hover/msg:opacity-100 transition-opacity p-1 hover:bg-secondary rounded-full shrink-0 mb-1">
                          <MoreVertical className="w-3.5 h-3.5 text-foreground/40" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
              {typingNames.length > 0 && (
                <div className="flex items-center gap-2 justify-end">
                  <div className="bg-secondary/40 px-3 py-2 rounded-2xl flex gap-1 items-center">
                    <span className="text-xs text-foreground/50">{typingNames.join(" و ")} يكتب...</span>
                    <span className="flex gap-0.5">{[0,1,2].map(i => <span key={i} className="w-1.5 h-1.5 bg-foreground/30 rounded-full animate-bounce" style={{ animationDelay: `${i*0.15}s` }} />)}</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Emoji picker */}
            {showEmoji && (
              <div className="px-3 pb-2 grid grid-cols-8 gap-1 shrink-0">
                {EMOJIS.map(e => <button key={e} onClick={() => setText(t => t + e)} className="text-xl hover:scale-125 transition-transform">{e}</button>)}
              </div>
            )}

            {/* Input */}
            <div className="p-3 border-t border-secondary/50 shrink-0">
              {isRestricted ? (
                <p className="text-center text-xs text-foreground/40 py-2">🔒 مجموعة مقيدة — المشرفون فقط يرسلون</p>
              ) : (
                <div className="flex items-end gap-2">
                  <div className="flex-1 flex items-end gap-1 bg-secondary/30 border border-secondary/50 rounded-2xl px-3 py-2 focus-within:border-primary transition-colors">
                    <textarea
                      value={text}
                      onChange={e => handleTyping(e.target.value)}
                      onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                      placeholder="اكتب رسالة..."
                      className="flex-1 bg-transparent outline-none text-sm resize-none max-h-24 text-foreground"
                      rows={1}
                    />
                    <div className="flex items-center gap-1 shrink-0">
                      <button onClick={() => setShowEmoji(!showEmoji)} className="text-foreground/40 hover:text-primary transition-colors"><Smile className="w-4 h-4" /></button>
                      <input ref={fileRef} type="file" accept="image/*,video/*" onChange={handleFile} className="hidden" />
                      <button onClick={() => fileRef.current?.click()} className="text-foreground/40 hover:text-primary transition-colors"><ImageIcon className="w-4 h-4" /></button>
                    </div>
                  </div>
                  {recording ? (
                    <button onClick={stopRecording} className="w-10 h-10 bg-red-500 text-white rounded-full flex items-center justify-center animate-pulse shrink-0"><Square className="w-4 h-4" /></button>
                  ) : text.trim() ? (
                    <button onClick={handleSend} className="w-10 h-10 bg-primary text-primary-foreground rounded-full flex items-center justify-center hover:opacity-90 transition-all shadow-md shrink-0"><Send className="w-4 h-4" /></button>
                  ) : (
                    <button onClick={startRecording} className="w-10 h-10 bg-secondary text-foreground/60 rounded-full flex items-center justify-center hover:bg-secondary/80 transition-all shrink-0"><Mic className="w-4 h-4" /></button>
                  )}
                </div>
              )}
            </div>
          </>)}
        </div>
      )}
    </>
  );
}
