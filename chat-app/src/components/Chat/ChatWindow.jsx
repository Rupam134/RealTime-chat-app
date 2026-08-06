// src/components/Chat/ChatWindow.jsx
import { useEffect, useRef, useState, useCallback } from "react";
import { supabase } from "../../lib/supabase";
import { useMessages } from "../../hooks/useMessages";
import { usePresence } from "../../hooks/usePresence";
import { useTyping } from "../../hooks/useTyping";
import { getAvatarColor } from "../../lib/avatarColors";
import { formatLastSeen } from "../../lib/timeFormat";
import Message from "./Message";
import TypingIndicator from "./TypingIndicator";
import MessageInput from "./MessageInput";

export default function ChatWindow({ currentUser, currentProfile, contact, conversationId: existingConvId, onConversationCreated }) {
  const [conversationId, setConversationId] = useState(existingConvId || null);
  const [uploading, setUploading] = useState(false);
  const bottomRef = useRef(null);
  const messagesAreaRef = useRef(null);
  const [contactProfile, setContactProfile] = useState(null);

  const contactPresence = usePresence(contact);
  const { messages, loading, hasMore, loadMore } = useMessages(conversationId);
  const { typingUsers, sendTyping, stopTyping } = useTyping(conversationId, currentUser);

  // Load contact profile
  useEffect(() => {
    if (!contact) return;
    supabase.from("users").select("*").eq("email", contact).single()
      .then(({ data }) => setContactProfile(data));
  }, [contact]);

  // Sync conversationId when prop changes
  useEffect(() => {
    setConversationId(existingConvId || null);
  }, [existingConvId]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typingUsers]);

  // Mark messages as read when conversation is open
  useEffect(() => {
    if (!conversationId || !currentUser) return;
    supabase.from("conversation_members")
      .update({ last_read_at: new Date().toISOString() })
      .eq("conversation_id", conversationId)
      .eq("user_email", currentUser);
  }, [conversationId, messages.length, currentUser]);

  // Infinite scroll
  const handleScroll = useCallback(() => {
    const el = messagesAreaRef.current;
    if (!el) return;
    if (el.scrollTop === 0 && hasMore && !loading) loadMore();
  }, [hasMore, loading, loadMore]);

  const getOrCreateConversation = async () => {
    if (conversationId) return conversationId;
    const { data, error } = await supabase.rpc("get_or_create_conversation", {
      user_a: currentUser,
      user_b: contact
    });
    if (error) { console.error("create conv error:", error.message); return null; }
    setConversationId(data);
    onConversationCreated?.({ conversation_id: data, other_email: contact });
    return data;
  };

  const sendMessage = async (text) => {
    if (!text.trim() || !contact) return;
    const convId = await getOrCreateConversation();
    if (!convId) return;

    const { error } = await supabase.from("messages").insert({
      sender_email: currentUser,
      receiver_email: contact,
      text: text.trim(),
      conversation_id: convId,
      room: convId,
    });

    if (error) { console.error("send error:", error.message); return; }

    // Update conversation last message
    await supabase.from("conversations").update({
      last_message: text.trim(),
      last_message_at: new Date().toISOString(),
      last_message_sender: currentUser
    }).eq("id", convId);

    stopTyping();
  };

  const handleFileUpload = async (file) => {
    if (!file || !contact) return;
    setUploading(true);

    const convId = await getOrCreateConversation();
    if (!convId) { setUploading(false); return; }

    const filePath = `${convId}/${Date.now()}_${file.name}`;
    const { error: uploadError } = await supabase.storage.from("chat-files").upload(filePath, file);
    if (uploadError) { console.error(uploadError.message); setUploading(false); return; }

    const { data: urlData } = supabase.storage.from("chat-files").getPublicUrl(filePath);
    const isImage = file.type.startsWith("image/");
    const isVideo = file.type.startsWith("video/");

    await supabase.from("messages").insert({
      sender_email: currentUser,
      receiver_email: contact,
      file_url: urlData.publicUrl,
      file_name: file.name,
      file_type: file.type,
      conversation_id: convId,
      room: convId,
      text: isImage ? "📷 Image" : isVideo ? "🎥 Video" : `📎 ${file.name}`
    });

    await supabase.from("conversations").update({
      last_message: isImage ? "📷 Image" : isVideo ? "🎥 Video" : `📎 ${file.name}`,
      last_message_at: new Date().toISOString(),
      last_message_sender: currentUser
    }).eq("id", convId);

    setUploading(false);
  };

  if (!contact) {
    return (
      <div className="chat-window">
        <div className="chat-empty">
          <div className="chat-empty-icon">💬</div>
          <p>Select a chat or search a user</p>
          <span>Start a new conversation</span>
        </div>
      </div>
    );
  }

  const contactColor = getAvatarColor(contact);
  const contactDisplay = contactProfile?.name || contactProfile?.username || contact;
  const isOnline = contactPresence?.is_online ?? false;
  const statusText = isOnline ? "Active now" : formatLastSeen(contactPresence?.last_seen);

  return (
    <div className="chat-window">
      {/* Header */}
      <div className="chat-header">
        <div className={`chat-header-avatar ${contactColor}`} style={{ position: "relative" }}>
          {contactProfile?.avatar_url
            ? <img src={contactProfile.avatar_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "14px" }} />
            : contactDisplay.charAt(0).toUpperCase()
          }
          <span className={`online-dot ${isOnline ? "online" : "offline"}`} style={{ position: "absolute", bottom: -1, right: -1, border: "2px solid #0d0e14" }} />
        </div>
        <div className="chat-header-info">
          <div className="chat-header-name">{contactDisplay}</div>
          {contactProfile?.username && (
            <div style={{ fontSize: 11, color: "#475569" }}>@{contactProfile.username}</div>
          )}
          <div className={`chat-header-status ${isOnline ? "online" : "offline"}`}>
            {statusText}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div
        className="messages-area"
        ref={messagesAreaRef}
        onScroll={handleScroll}
      >
        {hasMore && (
          <div style={{ textAlign: "center", padding: "8px 0" }}>
            <button onClick={loadMore} style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer", fontSize: 12 }}>
              {loading ? "Loading…" : "Load older messages"}
            </button>
          </div>
        )}

        {messages.length === 0 && !loading && (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "#334155", gap: 8, padding: "40px 0" }}>
            <div style={{ fontSize: 48 }}>👋</div>
            <p style={{ fontWeight: 600, color: "#475569" }}>Say hello to {contactDisplay}</p>
            <span style={{ fontSize: 13 }}>This is the start of your conversation</span>
          </div>
        )}

        {messages.map((msg, i) => (
          <Message
            key={msg.id}
            msg={msg}
            currentUser={currentUser}
            getAvatarColor={getAvatarColor}
            prevMsg={messages[i - 1]}
          />
        ))}

        {typingUsers.length > 0 && (
          <TypingIndicator
            name={contactProfile?.name || contactProfile?.username || contact}
            color={contactColor}
          />
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <MessageInput
        onSend={sendMessage}
        onTyping={sendTyping}
        onFileUpload={handleFileUpload}
        uploading={uploading}
      />
    </div>
  );
}