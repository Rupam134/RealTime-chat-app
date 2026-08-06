import { useEffect, useState, useCallback } from "react";
import { supabase } from "../lib/supabase";

export function useConversations(currentUser) {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!currentUser) return;
    const { data, error } = await supabase.rpc("get_my_conversations", { my_email: currentUser });
    if (!error) setConversations(data || []);
    setLoading(false);
  }, [currentUser]);

  useEffect(() => {
    load();
    const channel = supabase
      .channel(`conversations-${currentUser}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "conversations" }, load)
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "conversation_members",
        filter: `user_email=eq.${currentUser}`
      }, load)
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [currentUser, load]);

  return { conversations, loading, reload: load };
}