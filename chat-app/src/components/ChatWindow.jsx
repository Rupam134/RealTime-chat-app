import { useEffect, useRef, useState } from "react";
import { supabase } from "../supabase";
import Message from "./Message";
import TypingIndicator from "./TypingIndicator";

const AVATAR_COLORS = [
  "avatar-a","avatar-b","avatar-c","avatar-d","avatar-e",
  "avatar-f","avatar-g","avatar-h","avatar-i","avatar-j"
];

function getAvatarColor(str) {
  if (!str) return "avatar-a";
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export default function ChatWindow({ currentUser, currentName, contact }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [isContactTyping, setIsContactTyping] = useState(false);
  const [contactOnline, setContactOnline] = useState(false);
  const [contactName, setContactName] = useState("");
  const [uploading, setUploading] = useState(false);
  const bottomRef = useRef(null);
  const typingTimeout = useRef(null);

  const roomKey = contact ? [currentUser, contact].sort().join("__") : null;

  useEffect(() => {
    if (!contact) return;
    supabase.from("users").select("name").eq("email", contact).single()
      .then(({ data }) => setContactName(data?.name || contact));
  }, [contact]);

  useEffect(() => {
    if (!roomKey) return;
    setMessages([]);

    supabase.from("messages").select("*").eq("room", roomKey)
      .order("created_at", { ascending: true })
      .then(({ data, error }) => {
        if (error) console.error("load messages:", error.message);
        else setMessages(data || []);
      });

    const msgChannel = supabase.channel(`messages-${roomKey}`)
      .on("postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `room=eq.${roomKey}` },
        (payload) => {
          setMessages(prev => {
            if (prev.find(m => m.id === payload.new.id)) return prev;
            return [...prev, payload.new];
          });
        }
      ).subscribe();

    const typingChannel = supabase.channel(`typing-${roomKey}`)
      .on("postgres_changes",
        { event: "*", schema: "public", table: "typing", filter: `room=eq.${roomKey}` },
        (payload) => {
          if (payload.new?.email === contact) {
            setIsContactTyping(true);
            setTimeout(() => setIsContactTyping(false), 3000);
          }
        }
      ).subscribe();

    supabase.from("presence").select("is_online").eq("email", contact).single()
      .then(({ data }) => setContactOnline(data?.is_online ?? false));

    const presenceChannel = supabase.channel(`presence-${contact}`)
      .on("postgres_changes",
        { event: "*", schema: "public", table: "presence", filter: `email=eq.${contact}` },
        (payload) => setContactOnline(payload.new?.is_online ?? false)
      ).subscribe();

    return () => {
      supabase.removeChannel(msgChannel);
      supabase.removeChannel(typingChannel);
      supabase.removeChannel(presenceChannel);
    };
  }, [roomKey, contact]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isContactTyping]);

  const handleTyping = (e) => {
    setText(e.target.value);
    if (!roomKey) return;
    supabase.from("typing").upsert(
      { email: currentUser, room: roomKey, updated_at: new Date().toISOString() },
      { onConflict: "email,room" }
    );
    clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => {
      supabase.from("typing").delete().eq("email", currentUser).eq("room", roomKey);
    }, 2000);
  };

  const sendMessage = async () => {
    const trimmed = text.trim();
    if (!trimmed || !roomKey) return;
    setText("");
    const { error } = await supabase.from("messages").insert({
      sender_email: currentUser,
      receiver_email: contact,
      text: trimmed,
      room: roomKey,
    });
    if (error) { console.error("send error:", error.message); setText(trimmed); }
    supabase.from("typing").delete().eq("email", currentUser).eq("room", roomKey);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !roomKey) return;
    setUploading(true);
    const filePath = `${roomKey}/${Date.now()}_${file.name}`;
    const { error: uploadError } = await supabase.storage.from("chat-files").upload(filePath, file);
    if (uploadError) { console.error("upload error:", uploadError.message); setUploading(false); return; }
    const { data: urlData } = supabase.storage.from("chat-files").getPublicUrl(filePath);
    const { error: msgError } = await supabase.from("messages").insert({
      sender_email: currentUser,
      receiver_email: contact,
      file_url: urlData.publicUrl,
      file_name: file.name,
      room: roomKey,
    });
    if (msgError) console.error("file msg error:", msgError.message);
    setUploading(false);
    e.target.value = "";
  };

  if (!contact) {
    return (
      <div className="chat-window">
        <div className="chat-empty">
          <div className="chat-empty-icon">💬</div>
          <p>Select a contact to start chatting</p>
          <span>Your messages are end-to-end private</span>
        </div>
      </div>
    );
  }

  const contactColor = getAvatarColor(contact);
  const contactDisplay = contactName || contact;

  return (
    <div className="chat-window">
      <div className="chat-header">
        <div className={`chat-header-avatar ${contactColor}`} style={{ position: "relative" }}>
          {contactDisplay.charAt(0).toUpperCase()}
          <span
            className={`online-dot ${contactOnline ? "online" : "offline"}`}
            style={{ position: "absolute", bottom: -1, right: -1, border: "2px solid #0d0e14" }}
          />
        </div>
        <div className="chat-header-info">
          <div className="chat-header-name">{contactDisplay}</div>
          <div className={`chat-header-status ${contactOnline ? "online" : "offline"}`}>
            {contactOnline ? "● Active now" : "○ Offline"}
          </div>
        </div>
      </div>

      <div className="messages-area">
        {messages.map(msg => (
          <Message
            key={msg.id}
            msg={msg}
            currentUser={currentUser}
            getAvatarColor={getAvatarColor}
          />
        ))}
        {isContactTyping && <TypingIndicator name={contactDisplay} color={contactColor} />}
        <div ref={bottomRef} />
      </div>

      <div className="message-input-bar">
        <label className="file-label" title="Attach file">
          {uploading ? "⏳" : "📎"}
          <input type="file" style={{ display: "none" }} onChange={handleFileUpload} disabled={uploading} />
        </label>
        <input
          value={text}
          onChange={handleTyping}
          onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }}}
          placeholder="Type a message..."
        />
        <button className="send-btn" onClick={sendMessage}>
          ➤
        </button>
      </div>
    </div>
  );
}