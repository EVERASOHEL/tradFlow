// Thin wrapper around localStorage. Centralizing this means swapping to
// sessionStorage, a cookie, or a native secure-storage bridge later touches
// one file instead of every feature that persists something.
const storageService = {
  get(key) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },
  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Storage can fail in private-browsing / quota-exceeded scenarios.
      // Failing silently here is fine: auth state simply won't persist.
    }
  },
  remove(key) {
    localStorage.removeItem(key);
  },
};

export default storageService;
