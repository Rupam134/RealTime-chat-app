import { useEffect, useState } from "react";
import { supabase } from "../supabase";

const AVATAR_COLORS = [
  "avatar-a","avatar-b","avatar-c","avatar-d","avatar-e",
  "avatar-f","avatar-g","avatar-h","avatar-i","avatar-j"
];

function getAvatarColor(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export default function Sidebar({ currentUser, currentName, activeContact, onSelectContact }) {
  const [contacts, setContacts] = useState([]);
  const [presence, setPresence] = useState({});
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function loadUsers() {
      const { data, error } = await supabase
        .from("users").select("email, name").neq("email", currentUser);
      if (error) { console.error("users load error:", error.message); return; }
      setContacts(data || []);
    }

    async function loadPresence() {
      const { data } = await supabase.from("presence").select("email, is_online");
      if (data) {
        const map = {};
        data.forEach(r => { map[r.email] = r.is_online; });
        setPresence(map);
      }
    }

    loadUsers();
    loadPresence();

    const presenceChannel = supabase
      .channel("sidebar-presence")
      .on("postgres_changes", { event: "*", schema: "public", table: "presence" }, (payload) => {
        if (payload.new?.email) {
          setPresence(prev => ({ ...prev, [payload.new.email]: payload.new.is_online }));
        }
      }).subscribe();

    const usersChannel = supabase
      .channel("sidebar-users")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "users" }, (payload) => {
        if (payload.new?.email && payload.new.email !== currentUser) {
          setContacts(prev => {
            if (prev.find(c => c.email === payload.new.email)) return prev;
            return [...prev, { email: payload.new.email, name: payload.new.name }];
          });
        }
      }).subscribe();

    return () => {
      supabase.removeChannel(presenceChannel);
      supabase.removeChannel(usersChannel);
    };
  }, [currentUser]);

  const filtered = contacts.filter(c =>
    (c.name || c.email).toLowerCase().includes(search.toLowerCase())
  );

  const handleLogout = async () => {
    await supabase.from("presence").upsert({
      email: currentUser, is_online: false, last_seen: new Date().toISOString()
    });
    await supabase.auth.signOut();
  };

  const displayName = currentName || currentUser;
  const avatarColor = getAvatarColor(currentUser);

  return (
    <div className="sidebar">

      {/* Profile section */}
      <div className="sidebar-profile">
        <div className={`profile-avatar-large ${avatarColor}`}>
          {displayName.charAt(0).toUpperCase()}
        </div>
        <div className="profile-info">
          <div className="profile-name">{displayName}</div>
          <div className="profile-email">{currentUser}</div>
          <div className="profile-online-badge">Online</div>
        </div>
        <div className="sidebar-actions">
          <div className="icon-btn danger" onClick={handleLogout} title="Sign out">🚪</div>
        </div>
      </div>

      <div className="sidebar-heading">Messages</div>

      <div className="sidebar-search">
        <div className="search-input-wrap">
          <span className="search-icon">🔍</span>
          <input
            placeholder="Search by name..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="contact-list">
        {filtered.length === 0 ? (
          <p className="no-contacts">
            No contacts yet.<br />Register from another browser to start chatting.
          </p>
        ) : (
          filtered.map(contact => {
            const isOnline = presence[contact.email] ?? false;
            const isActive = activeContact === contact.email;
            const name = contact.name || contact.email;
            const color = getAvatarColor(contact.email);
            return (
              <div
                key={contact.email}
                className={`contact-item ${isActive ? "active" : ""}`}
                onClick={() => onSelectContact(contact.email)}
              >
                <div className={`contact-avatar ${color}`}>
                  {name.charAt(0).toUpperCase()}
                  <span className={`online-dot ${isOnline ? "online" : "offline"}`} />
                </div>
                <div className="contact-info">
                  <div className="contact-name">{name}</div>
                  <div className="contact-preview" style={{ color: isOnline ? "#22c55e" : "#475569" }}>
                    {isOnline ? "● Online" : "○ Offline"}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}