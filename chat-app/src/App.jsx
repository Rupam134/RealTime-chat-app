import { useEffect, useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { supabase } from "./lib/supabase";
import { useMyPresence } from "./hooks/usePresence";
import { useProfile } from "./hooks/useProfile";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Sidebar from "./components/Sidebar/Sidebar";
import ChatWindow from "./components/Chat/ChatWindow";

export default function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  // Active chat state
  const [activeContact, setActiveContact] = useState(null);       // email of person we're chatting with
  const [activeConvId, setActiveConvId] = useState(null);         // existing conversation_id (null if new)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => listener.subscription.unsubscribe();
  }, []);

  const currentUser = session?.user?.email;
  const { profile: currentProfile } = useProfile(currentUser);
  useMyPresence(currentUser);

  // User clicked an existing conversation in sidebar
  const handleSelectConversation = (conv) => {
    setActiveContact(conv.other_email);
    setActiveConvId(conv.conversation_id);
  };

  // User selected someone from search (no conversation yet)
  const handleSelectSearchUser = (user) => {
    setActiveContact(user.email);
    setActiveConvId(null);
  };

  // Conversation was just created on first message
  const handleConversationCreated = (conv) => {
    setActiveConvId(conv.conversation_id);
  };

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
        currentUser={currentUser}
        currentProfile={currentProfile}
        activeConversation={activeConvId ? { conversation_id: activeConvId } : null}
        onSelectConversation={handleSelectConversation}
        onSelectSearchUser={handleSelectSearchUser}
      />
      <ChatWindow
        currentUser={currentUser}
        currentProfile={currentProfile}
        contact={activeContact}
        conversationId={activeConvId}
        onConversationCreated={handleConversationCreated}
      />
    </div>
  );
}