import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

// Used in any component that wants to WATCH someone else's presence
export function usePresence(email) {
  const [presence, setPresence] = useState(null);

  useEffect(() => {
    if (!email) return;

    supabase.from("presence").select("*").eq("email", email).single()
      .then(({ data }) => setPresence(data));

    const channel = supabase
      .channel(`presence-watch-${email}`)
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "presence",
        filter: `email=eq.${email}`
      }, (payload) => setPresence(payload.new))
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [email]);

  return presence;
}

// Used ONCE in App.jsx to keep YOUR OWN presence alive
export function useMyPresence(email) {
  useEffect(() => {
    if (!email) return;

    const go = (is_online) => supabase.from("presence").upsert({
      email,
      is_online,
      last_seen: new Date().toISOString()
    });

    go(true);

    const interval = setInterval(() => go(true), 30000);

    const handleUnload = () => go(false);
    window.addEventListener("beforeunload", handleUnload);

    return () => {
      clearInterval(interval);
      window.removeEventListener("beforeunload", handleUnload);
      go(false);
    };
  }, [email]);
}