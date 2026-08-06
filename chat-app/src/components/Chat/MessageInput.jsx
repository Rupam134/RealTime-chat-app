import { useState, useRef } from "react";

export default function MessageInput({ onSend, onTyping, onFileUpload, uploading }) {
  const [text, setText] = useState("");
  const fileRef = useRef(null);

  const handleChange = (e) => {
    setText(e.target.value);
    onTyping?.();
  };

  const handleSend = () => {
    if (!text.trim()) return;
    onSend(text);
    setText("");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (file) { onFileUpload(file); e.target.value = ""; }
  };

  return (
    <div className="message-input-bar">
      <label className="file-label" title="Attach file">
        {uploading ? "⏳" : "📎"}
        <input ref={fileRef} type="file" style={{ display: "none" }} onChange={handleFile} disabled={uploading} />
      </label>
      <input
        value={text}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder="Type a message..."
      />
      <button className="send-btn" onClick={handleSend} disabled={!text.trim()}>➤</button>
    </div>
  );
}