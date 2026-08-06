const COLORS = [
  "avatar-a","avatar-b","avatar-c","avatar-d","avatar-e",
  "avatar-f","avatar-g","avatar-h","avatar-i","avatar-j"
];

export function getAvatarColor(str) {
  if (!str) return "avatar-a";
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return COLORS[Math.abs(hash) % COLORS.length];
}