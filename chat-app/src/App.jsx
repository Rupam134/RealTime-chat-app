import { useEffect, useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { supabase } from "./supabase";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Sidebar from "./components/Sidebar";
import ChatWindow from "./components/ChatWindow";

export default function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeContact, setActiveContact] = useState(null);
  const [currentName, setCurrentName] = useState("");

  
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session) return;
    const email = session.user.email;

    // Load this user's name from users table
    supabase.from("users").select("name").eq("email", email).single()
      .then(({ data }) => {
        if (data?.name) setCurrentName(data.name);
      });

    // Upsert into users + presence
    supabase.from("users").upsert({ email }).then(({ error }) => {
      if (error) console.error("users upsert:", error.message);
    });

    supabase.from("presence").upsert({
      email,
      is_online: true,
      last_seen: new Date().toISOString()
    }).then(({ error }) => {
      if (error) console.error("presence upsert:", error.message);
    });

    const handleUnload = () => {
      supabase.from("presence").upsert({
        email,
        is_online: false,
        last_seen: new Date().toISOString()
      });
    };
    window.addEventListener("beforeunload", handleUnload);
    return () => {
      window.removeEventListener("beforeunload", handleUnload);
      supabase.from("presence").upsert({
        email,
        is_online: false,
        last_seen: new Date().toISOString()
      });
    };
  }, [session]);

  if (loading) return <div className="loading">Loading…</div>;

  if (!session) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    );
  }

  return (
    <div className="app-layout">
      <Sidebar
        currentUser={session.user.email}
        currentName={currentName}
        activeContact={activeContact}
        onSelectContact={setActiveContact}
      />
      <ChatWindow
        currentUser={session.user.email}
        currentName={currentName}
        contact={activeContact}
      />
    </div>
  );
}