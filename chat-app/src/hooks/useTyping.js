import { useEffect, useState, useRef } from "react";
import { supabase } from "../lib/supabase";

export function useTyping(conversationId, currentUser) {
  const [typingUsers, setTypingUsers] = useState([]);
  const timeout = useRef(null);

  useEffect(() => {
    if (!conversationId) return;

    const channel = supabase
      .channel(`typing-${conversationId}`)
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "typing",
        filter: `room=eq.${conversationId}`
      }, (payload) => {
        if (payload.eventType === "DELETE" || !payload.new?.email) {
          setTypingUsers(prev => prev.filter(e => e !== payload.old?.email));
        } else if (payload.new.email !== currentUser) {
          setTypingUsers(prev =>
            prev.includes(payload.new.email) ? prev : [...prev, payload.new.email]
          );
          // Auto-clear after 4s in case delete event is missed
          setTimeout(() => {
            setTypingUsers(prev => prev.filter(e => e !== payload.new.email));
          }, 4000);
        }
      })
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [conversationId, currentUser]);

  const sendTyping = () => {
    if (!conversationId) return;
    supabase.from("typing").upsert(
      { email: currentUser, room: conversationId, updated_at: new Date().toISOString() },
      { onConflict: "email,room" }
    );
    clearTimeout(timeout.current);
    timeout.current = setTimeout(() => {
      supabase.from("typing").delete().eq("email", currentUser).eq("room", conversationId);
    }, 2500);
  };

  const stopTyping = () => {
    if (!conversationId) return;
    clearTimeout(timeout.current);
    supabase.from("typing").delete().eq("email", currentUser).eq("room", conversationId);
  };

  return { typingUsers, sendTyping, stopTyping };
}