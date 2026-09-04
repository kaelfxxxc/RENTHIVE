import { useEffect, useState, useCallback } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";

/**
 * Real unread counts for the sidebar / header badges, which previously had
 * a `badge?: number` field that nothing ever populated.
 *
 * Uses head-only `count: "exact"` queries so no rows cross the wire, and
 * re-counts on the same realtime events the app already subscribes to.
 */
export function useUnreadCounts() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState(0);
  const [messages, setMessages] = useState(0);

  const refresh = useCallback(async () => {
    if (!user) {
      setNotifications(0);
      setMessages(0);
      return;
    }

    const [notifRes, convRes] = await Promise.all([
      supabase
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("is_read", false),
      // Only conversations this user is part of, so we can scope the
      // message count without leaking anyone else's threads.
      supabase
        .from("conversations")
        .select("id")
        .or(`renter_id.eq.${user.id},lessor_id.eq.${user.id}`),
    ]);

    setNotifications(notifRes.count ?? 0);

    const conversationIds = (convRes.data ?? []).map(c => c.id);
    if (conversationIds.length === 0) {
      setMessages(0);
      return;
    }

    const { count } = await supabase
      .from("messages")
      .select("id", { count: "exact", head: true })
      .in("conversation_id", conversationIds)
      .eq("is_read", false)
      .neq("sender_id", user.id);

    setMessages(count ?? 0);
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`unread-counts-${user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
        () => refresh(),
      )
      // Messages aren't filterable by recipient at the row level, so recount
      // on any message change and let the query above do the scoping.
      .on("postgres_changes", { event: "*", schema: "public", table: "messages" }, () => refresh())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, refresh]);

  return { notifications, messages, refresh };
}
