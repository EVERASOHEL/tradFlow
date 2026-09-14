// Rough client-side check only — the source of truth for whether a token is
// still valid is always the server's 401 response, handled in apiClient.
export function getInitials(name) {
  if (!name) return "";
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}
