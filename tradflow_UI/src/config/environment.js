// Central place to read Vite env vars. Import this instead of import.meta.env
// directly so the rest of the app doesn't care where config comes from.
export const ENV = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8889/api",
  appName: import.meta.env.VITE_APP_NAME ?? "Tradflow",
  mode: import.meta.env.MODE,
};
