import { getAvatarColor } from "../../lib/avatarColors";
import { formatMessageTime } from "../../lib/timeFormat";

export default function ConversationItem({ conv, isActive, onClick }) {
  const color = getAvatarColor(conv.other_email);
  const name = conv.other_name || conv.other_username || conv.other_email;
  const time = conv.last_message_at ? formatMessageTime(conv.last_message_at) : "";
  const hasUnread = conv.unread_count > 0;

  return (
    <div className={`contact-item ${isActive ? "active" : ""}`} onClick={onClick}>
      <div className={`contact-avatar ${color}`} style={{ position: "relative" }}>
        {conv.other_avatar
          ? <img src={conv.other_avatar} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "14px" }} />
          : name.charAt(0).toUpperCase()
        }
      </div>
      <div className="contact-info">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div className="contact-name">{name}</div>
          {time && <span style={{ fontSize: 10, color: hasUnread ? "#818cf8" : "#334155" }}>{time}</span>}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div className="contact-preview" style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {conv.last_message
              ? (conv.last_message_sender === "you" ? "You: " : "") + conv.last_message
              : "Start a conversation"
            }
          </div>
          {hasUnread && (
            <span style={{
              background: "linear-gradient(135deg, #818cf8, #a78bfa)",
              color: "white",
              fontSize: 10,
              fontWeight: 700,
              borderRadius: 999,
              padding: "2px 6px",
              marginLeft: 6,
              flexShrink: 0
            }}>
              {conv.unread_count > 99 ? "99+" : conv.unread_count}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}