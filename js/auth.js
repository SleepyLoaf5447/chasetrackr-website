// js/auth.js — the ONE shared auth/session helper (window.CT.auth).
// Loaded on every page that needs auth, BEFORE js/nav.js. No page should talk
// to the auth endpoints directly — always go through CT.auth, same discipline
// as CT.mapCard.
//
// SESSION STORAGE — the JWT is kept in localStorage.
//   XSS TRADEOFF (explicit): any injected script on our origin could read the
//   token. The safer option is an httpOnly cookie, but that needs the backend
//   to set Set-Cookie (Secure, SameSite=None) and CORS credentials with a
//   locked-down origin (today CORS is "*"). That's a backend change, out of
//   Phase 3 scope — tracked for the pre-launch hardening pass.
window.CT = window.CT || {};

(function () {
  const B = window.CT.BACKEND || 'https://chasetrackr-backend.onrender.com';
  const TOKEN_KEY = 'ct_token';
  const USER_KEY  = 'ct_user';

  const save   = (token, user) => { localStorage.setItem(TOKEN_KEY, token); localStorage.setItem(USER_KEY, JSON.stringify(user)); };
  const clear  = () => { localStorage.removeItem(TOKEN_KEY); localStorage.removeItem(USER_KEY); };
  const token  = () => localStorage.getItem(TOKEN_KEY);
  const user   = () => { try { return JSON.parse(localStorage.getItem(USER_KEY) || 'null'); } catch { return null; } };

  async function post(path, body) {
    const res = await fetch(`${B}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(body || {}),
    });
    let data = null;
    try { data = await res.json(); } catch { /* non-JSON */ }
    if (!res.ok) {
      const err = new Error((data && data.detail) || `Request failed (${res.status})`);
      err.status = res.status;
      throw err;
    }
    return data;
  }

  window.CT.auth = {
    getToken:   token,
    getUser:    user,
    isLoggedIn: () => !!token(),
    isVerified: () => { const u = user(); return !!(u && u.is_verified); },
    logout() { clear(); },

    async register(email, password) {
      const d = await post('/api/v1/auth/register', { email, password });
      save(d.token, d.user);
      return d;
    },
    async login(email, password) {
      const d = await post('/api/v1/auth/login', { email, password });
      save(d.token, d.user);
      return d;
    },
    // Refresh the cached user from the backend; clears session on 401.
    async refresh() {
      const t = token();
      if (!t) return null;
      const res = await fetch(`${B}/api/v1/auth/me`, { headers: { Authorization: `Bearer ${t}` } });
      if (res.status === 401) { clear(); return null; }
      if (!res.ok) return user();
      const d = await res.json();
      if (d && d.user) localStorage.setItem(USER_KEY, JSON.stringify(d.user));
      return d && d.user;
    },
    forgotPassword:     (email)          => post('/api/v1/auth/forgot-password', { email }),
    resetPassword:      (tok, new_password) => post('/api/v1/auth/reset-password', { token: tok, new_password }),
    verifyEmail:        (tok)            => post('/api/v1/auth/verify', { token: tok }),
    resendVerification: (email)          => post('/api/v1/auth/resend-verification', { email }),

    // For protected endpoints (portfolio/watchlist in Phase 4): attaches the
    // Bearer token; clears the session on a 401 so the UI can react.
    async authFetch(path, opts = {}) {
      const t = token();
      const headers = { ...(opts.headers || {}) };
      if (t) headers.Authorization = `Bearer ${t}`;
      const res = await fetch(`${B}${path}`, { ...opts, headers });
      if (res.status === 401) clear();
      return res;
    },
  };
})();
