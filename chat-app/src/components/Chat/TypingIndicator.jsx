export default function TypingIndicator({ name, color }) {
  return (
    <div className="typing-row" style={{ animation: "fadeIn 0.2s ease" }}>
      <div className={`msg-avatar ${color || "avatar-a"}`}>
        {name?.charAt(0).toUpperCase() ?? "?"}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
        <div className="typing-dots">
          <span /><span /><span />
        </div>
        <span className="typing-label">{name} is typing…</span>
      </div>
    </div>
  );
}