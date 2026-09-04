import { useState, useEffect, useRef } from "react";
import { Send, MessageSquare } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { supabase, db } from "../lib/supabase";
import { Avatar } from "../components/ui/Avatar";
import { EmptyState } from "../components/ui/EmptyState";
import { useAuth } from "../contexts/AuthContext";
import type { Conversation, Message } from "../types";

interface MessagesPageProps {
  layout: React.ComponentType<{ children: React.ReactNode }>;
}

export default function MessagesPage({ layout: Layout }: MessagesPageProps) {
  const { user, profile } = useAuth();
  const [searchParams] = useSearchParams();
  const withUserId = searchParams.get("with");
  const rentalId = searchParams.get("rental");

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => { if (user) loadConversations(); }, [user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!selectedConv) return;
    loadMessages(selectedConv.id);
    const sub = supabase
      .channel(`messages:${selectedConv.id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${selectedConv.id}` },
        payload => setMessages(m => [...m, payload.new as Message]))
      .subscribe();
    return () => { supabase.removeChannel(sub); };
  }, [selectedConv]);

  const loadConversations = async () => {
    const { data } = await supabase
      .from("conversations")
      .select("*, renter:profiles!conversations_renter_id_fkey(id,full_name,avatar_url), lessor:profiles!conversations_lessor_id_fkey(id,full_name,avatar_url)")
      .or(`renter_id.eq.${user!.id},lessor_id.eq.${user!.id}`)
      .order("last_message_at", { ascending: false, nullsFirst: false });
    const convs = (data as unknown as Conversation[]) || [];
    setConversations(convs);

    // If ?with= param present, open or create that conversation
    if (withUserId) {
      const existing = convs.find(c =>
        (c.renter_id === user!.id && c.lessor_id === withUserId) ||
        (c.lessor_id === user!.id && c.renter_id === withUserId)
      );
      if (existing) {
        setSelectedConv(existing);
      } else {
        // Create new conversation
        const isRenter = profile?.role === "renter";
        const payload = isRenter
          ? { renter_id: user!.id, lessor_id: withUserId, rental_request_id: rentalId || null }
          : { renter_id: withUserId, lessor_id: user!.id, rental_request_id: rentalId || null };
        const { data: newConv } = await db.from("conversations").insert(payload).select(
          "*, renter:profiles!conversations_renter_id_fkey(id,full_name,avatar_url), lessor:profiles!conversations_lessor_id_fkey(id,full_name,avatar_url)"
        ).single();
        if (newConv) {
          const conv = newConv as unknown as Conversation;
          setConversations(c => [conv, ...c]);
          setSelectedConv(conv);
        }
      }
    }
  };

  const loadMessages = async (convId: string) => {
    const { data } = await supabase
      .from("messages")
      .select("*, sender:profiles!messages_sender_id_fkey(id,full_name,avatar_url)")
      .eq("conversation_id", convId)
      .order("created_at", { ascending: true });
    setMessages((data as unknown as Message[]) || []);
    await db.from("messages").update({ is_read: true }).eq("conversation_id", convId).neq("sender_id", user!.id);
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConv || sending) return;
    setSending(true);
    await db.from("messages").insert({
      conversation_id: selectedConv.id,
      sender_id: user!.id,
      content: newMessage.trim(),
    });
    await db.from("conversations").update({ last_message_at: new Date().toISOString() }).eq("id", selectedConv.id);
    setNewMessage("");
    setSending(false);
  };

  const otherUser = (conv: Conversation) => profile?.role === "renter" ? conv.lessor : conv.renter;

  return (
    <Layout>
      <div className="bg-white border border-[var(--border)] rounded-2xl overflow-hidden flex" style={{ height: "calc(100vh - 10rem)" }}>
        {/* Conversations list */}
        <div className="w-72 border-r border-[var(--border)] flex flex-col shrink-0">
          <div className="p-4 border-b border-[var(--border)]">
            <h2 className="font-bold">Messages</h2>
          </div>
          <div className="flex-1 overflow-y-auto">
            {conversations.length === 0 ? (
              <div className="p-4">
                <EmptyState icon={<MessageSquare className="w-6 h-6" />} title="No conversations" description="Message a lessor from any listing." />
              </div>
            ) : (
              conversations.map(conv => {
                const other = otherUser(conv);
                return (
                  <button key={conv.id} onClick={() => setSelectedConv(conv)}
                    className={`w-full flex items-center gap-3 p-4 border-b border-[var(--border)] text-left hover:bg-[var(--muted)] transition-colors ${selectedConv?.id === conv.id ? "bg-amber-50 border-l-2 border-l-amber-400" : ""}`}>
                    <Avatar src={other?.avatar_url} name={other?.full_name} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">{other?.full_name}</p>
                      {conv.last_message_at && (
                        <p className="text-xs text-[var(--muted-foreground)]">{new Date(conv.last_message_at).toLocaleDateString()}</p>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Chat area */}
        <div className="flex-1 flex flex-col min-w-0">
          {!selectedConv ? (
            <div className="flex-1 flex items-center justify-center">
              <EmptyState icon={<MessageSquare className="w-8 h-8" />} title="Select a conversation" description="Choose a conversation or message a lessor from a listing." />
            </div>
          ) : (
            <>
              <div className="p-4 border-b border-[var(--border)] flex items-center gap-3">
                <Avatar src={otherUser(selectedConv)?.avatar_url} name={otherUser(selectedConv)?.full_name} size="sm" />
                <p className="font-semibold text-sm">{otherUser(selectedConv)?.full_name}</p>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.length === 0 && (
                  <p className="text-center text-xs text-[var(--muted-foreground)] py-4">No messages yet. Say hello!</p>
                )}
                {messages.map(m => {
                  const isMe = m.sender_id === user!.id;
                  return (
                    <div key={m.id} className={`flex ${isMe ? "justify-end" : "justify-start"} gap-2 items-end`}>
                      {!isMe && <Avatar src={(m as any).sender?.avatar_url} name={(m as any).sender?.full_name} size="xs" />}
                      <div className={`max-w-xs lg:max-w-md px-4 py-2.5 rounded-2xl text-sm ${isMe ? "bg-[var(--primary)] text-white rounded-br-sm" : "bg-[var(--muted)] text-[var(--foreground)] rounded-bl-sm"}`}>
                        <p className="leading-relaxed">{m.content}</p>
                        <p className={`text-xs mt-1 ${isMe ? "text-white/60" : "text-[var(--muted-foreground)]"}`}>
                          {new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              <div className="p-4 border-t border-[var(--border)] flex gap-2">
                <input
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                  placeholder="Type a message…"
                  className="flex-1 border border-[var(--border)] rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[var(--primary)] transition-colors"
                />
                <button
                  onClick={sendMessage}
                  disabled={sending || !newMessage.trim()}
                  className="w-10 h-10 bg-[var(--primary)] text-white rounded-xl flex items-center justify-center hover:bg-amber-700 disabled:opacity-40 transition-colors shrink-0"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </Layout>
  );
}
