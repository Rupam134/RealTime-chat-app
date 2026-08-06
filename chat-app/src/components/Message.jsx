export default function Message({ msg, currentUser, getAvatarColor }) {
  if (!msg) return null;
  const isMe = msg.sender_email === currentUser;
  const time = msg.created_at
    ? new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : "";
  const avatarColor = getAvatarColor ? getAvatarColor(msg.sender_email) : "avatar-a";

  return (
    <div className={`msg-row ${isMe ? "sent" : "received"}`}>
      {!isMe && (
        <div className={`msg-avatar ${avatarColor}`}>
          {msg.sender_email?.charAt(0).toUpperCase() ?? "?"}
        </div>
      )}
      <div className="msg-col">
        {msg.file_url ? (
          <a
            href={msg.file_url}
            target="_blank"
            rel="noreferrer"
            className={`file-bubble ${isMe ? "sent" : "received"}`}
          >
            <div className="file-icon">📎</div>
            <span>{msg.file_name ?? "Download file"}</span>
          </a>
        ) : (
          <div className={`bubble ${isMe ? "sent" : "received"}`}>
            {msg.text ?? ""}
          </div>
        )}
        <div className="msg-meta">
          <span className="msg-time">{time}</span>
        </div>
      </div>
    </div>
  );
}