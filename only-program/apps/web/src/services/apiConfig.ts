const rawUrl = (
  import.meta.env.VITE_API_URL || "http://localhost:4005"
).replace(/\/+$/, "");
export const API_URL = rawUrl.endsWith("/api") ? rawUrl : `${rawUrl}/api`;
