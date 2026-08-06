// src/components/Sidebar/Sidebar.jsx
import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { useConversations } from "../../hooks/useConversations";
import { getAvatarColor } from "../../lib/avatarColors";
import { formatMessageTime } from "../../lib/timeFormat";
import ConversationItem from "./ConversationItem";
import UserSearchResult from "./UserSearchResult";

export default function Sidebar({ currentUser, currentProfile, activeConversation, onSelectConversation, onSelectSearchUser }) {
  const { conversations, loading } = useConversations(currentUser);
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    if (!search.trim()) { setSearchResults([]); return; }

    const timer = setTimeout(async () => {
      setSearching(true);
      const { data } = await supabase
        .from("users")
        .select("email, username, name, avatar_url")
        .ilike("username", `%${search.trim()}%`)
        .neq("email", currentUser)
        .limit(10);
      setSearchResults(data || []);
      setSearching(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [search, currentUser]);

  const handleLogout = async () => {
    await supabase.from("presence").upsert({
      email: currentUser, is_online: false, last_seen: new Date().toISOString()
    });
    await supabase.auth.signOut();
  };

  const displayName = currentProfile?.name || currentUser;
  const avatarColor = getAvatarColor(currentUser);
  const isSearching = search.trim().length > 0;

  return (
    <div className="sidebar">
      {/* Profile */}
      <div className="sidebar-profile">
        <div className={`profile-avatar-large ${avatarColor}`}>
          {currentProfile?.avatar_url
            ? <img src={currentProfile.avatar_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "16px" }} />
            : displayName.charAt(0).toUpperCase()
          }
        </div>
        <div className="profile-info">
          <div className="profile-name">{displayName}</div>
          <div className="profile-email">@{currentProfile?.username || "..."}</div>
          <div className="profile-online-badge">Online</div>
        </div>
        <div className="sidebar-actions">
          <div className="icon-btn danger" onClick={handleLogout} title="Sign out">🚪</div>
        </div>
      </div>

      {/* Search */}
      <div className="sidebar-search">
        <div className="search-input-wrap">
          <span className="search-icon">🔍</span>
          <input
            placeholder="Search by username..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "#64748b", cursor: "pointer", fontSize: 16 }}
            >×</button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="contact-list">
        {isSearching ? (
          <>
            {searching && <p className="no-contacts">Searching…</p>}
            {!searching && searchResults.length === 0 && (
              <p className="no-contacts">No users found for "{search}"</p>
            )}
            {searchResults.map(user => (
              <UserSearchResult
                key={user.email}
                user={user}
                onClick={() => { onSelectSearchUser(user); setSearch(""); }}
              />
            ))}
          </>
        ) : (
          <>
            {loading && <p className="no-contacts">Loading…</p>}
            {!loading && conversations.length === 0 && (
              <div className="no-contacts">
                <div style={{ fontSize: 40, marginBottom: 12 }}>💬</div>
                <strong style={{ color: "#64748b", fontSize: 14 }}>No chats yet</strong>
                <br />
                <span>Search someone by username<br />to start chatting</span>
              </div>
            )}
            {conversations.map(conv => (
              <ConversationItem
                key={conv.conversation_id}
                conv={conv}
                isActive={activeConversation?.conversation_id === conv.conversation_id}
                onClick={() => onSelectConversation(conv)}
              />
            ))}
          </>
        )}
      </div>
    </div>
  );
}