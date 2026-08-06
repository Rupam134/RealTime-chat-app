import { formatChatTime } from "../../lib/timeFormat";

export default function Message({ msg, currentUser, getAvatarColor, prevMsg }) {
  if (!msg) return null;

  const isMe = msg.sender_email === currentUser;
  const time = formatChatTime(msg.created_at);
  const avatarColor = getAvatarColor ? getAvatarColor(msg.sender_email) : "avatar-a";

  // Group: hide avatar if same sender as previous message
  const isSameSenderAsPrev = prevMsg && prevMsg.sender_email === msg.sender_email;
  const isImage = msg.file_url && msg.file_type?.startsWith("image/");
  const isVideo = msg.file_url && msg.file_type?.startsWith("video/");

  return (
    <div className={`msg-row ${isMe ? "sent" : "received"}`} style={{ marginBottom: isSameSenderAsPrev ? 2 : 8 }}>
      {!isMe && (
        <div className={`msg-avatar ${avatarColor}`} style={{ visibility: isSameSenderAsPrev ? "hidden" : "visible" }}>
          {msg.sender_email?.charAt(0).toUpperCase() ?? "?"}
        </div>
      )}
      <div className="msg-col">
        {msg.file_url ? (
          isImage ? (
            <a href={msg.file_url} target="_blank" rel="noreferrer">
              <img
                src={msg.file_url}
                alt="Image"
                style={{
                  maxWidth: 240,
                  maxHeight: 300,
                  borderRadius: 14,
                  objectFit: "cover",
                  display: "block",
                  border: "1px solid rgba(255,255,255,0.08)"
                }}
              />
            </a>
          ) : isVideo ? (
            <video
              src={msg.file_url}
              controls
              style={{ maxWidth: 240, borderRadius: 14, display: "block" }}
            />
          ) : (
            <a
              href={msg.file_url}
              target="_blank"
              rel="noreferrer"
              className={`file-bubble ${isMe ? "sent" : "received"}`}
            >
              <div className="file-icon">📎</div>
              <span>{msg.file_name ?? "Download file"}</span>
            </a>
          )
        ) : (
          <div className={`bubble ${isMe ? "sent" : "received"}`}>
            {msg.text ?? ""}
          </div>
        )}
        <div className="msg-meta">
          <span className="msg-time">{time}</span>
          {isMe && (
            <span style={{ fontSize: 10, color: "#475569" }} title="Sent">✓</span>
          )}
        </div>
      </div>
    </div>
  );
}