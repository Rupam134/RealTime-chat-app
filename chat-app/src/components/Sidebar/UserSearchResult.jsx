import { getAvatarColor } from "../../lib/avatarColors";

export default function UserSearchResult({ user, onClick }) {
  const color = getAvatarColor(user.email);
  const name = user.name || user.username;

  return (
    <div className="contact-item" onClick={onClick} style={{ cursor: "pointer" }}>
      <div className={`contact-avatar ${color}`}>
        {user.avatar_url
          ? <img src={user.avatar_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "14px" }} />
          : name.charAt(0).toUpperCase()
        }
      </div>
      <div className="contact-info">
        <div className="contact-name">{name}</div>
        <div className="contact-preview">@{user.username}</div>
      </div>
    </div>
  );
}