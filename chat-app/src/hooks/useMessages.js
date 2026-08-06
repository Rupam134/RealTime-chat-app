import { useEffect, useState, useRef, useCallback } from "react";
import { supabase } from "../lib/supabase";

const PAGE_SIZE = 30;

export function useMessages(conversationId) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const pageRef = useRef(0);

  const loadPage = useCallback(async (page = 0) => {
    if (!conversationId) return;
    setLoading(true);
    const from = page * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: false })
      .range(from, to);

    if (!error) {
      const reversed = (data || []).reverse();
      if (page === 0) {
        setMessages(reversed);
      } else {
        setMessages(prev => [...reversed, ...prev]);
      }
      setHasMore((data || []).length === PAGE_SIZE);
    }
    setLoading(false);
    pageRef.current = page;
  }, [conversationId]);

  useEffect(() => {
    if (!conversationId) return;
    pageRef.current = 0;
    loadPage(0);

    const channel = supabase
      .channel(`messages-${conversationId}`)
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "messages",
        filter: `conversation_id=eq.${conversationId}`
      }, (payload) => {
        setMessages(prev => {
          if (prev.find(m => m.id === payload.new.id)) return prev;
          return [...prev, payload.new];
        });
      })
      .on("postgres_changes", {
        event: "UPDATE",
        schema: "public",
        table: "messages",
        filter: `conversation_id=eq.${conversationId}`
      }, (payload) => {
        setMessages(prev => prev.map(m => m.id === payload.new.id ? payload.new : m));
      })
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [conversationId, loadPage]);

  const loadMore = () => {
    if (!loading && hasMore) loadPage(pageRef.current + 1);
  };

  return { messages, loading, hasMore, loadMore };
}