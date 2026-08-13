// js/auth.js — the ONE shared auth/session helper (window.CT.auth).
// Loaded on every page that needs auth, BEFORE js/nav.js. No page should talk
// to the auth endpoints directly — always go through CT.auth, same discipline
// as CT.mapCard.
//
// SESSION STORAGE (Phase 6 hardening) — the JWT now lives in an httpOnly cookie
//   set by the backend on login/register, NOT in localStorage. JS cannot read it,
//   which closes the XSS token-theft exposure from Phase 3. We keep only the
//   non-sensitive USER object in localStorage for instant UI state; the browser
//   attaches the cookie automatically on every request via credentials:'include'.
//   Logout must call the backend (JS can't delete an httpOnly cookie).
//
//   CROSS-SITE CAVEAT: the site and API are on different registrable domains
//   (chasetrackr.com vs onrender.com), so the session cookie is a THIRD-PARTY
//   cookie. It works where third-party cookies are allowed (verified in Chrome),
//   but Safari (ITP) and Chrome with third-party cookies disabled will drop it,
//   breaking login. The durable fix is serving the API first-party from
//   api.chasetrackr.com — pairs with the DNS cutover step.
window.CT = window.CT || {};

(function () {
  const B = window.CT.BACKEND || 'https://chasetrackr-backend.onrender.com';
  const USER_KEY = 'ct_user';

  const saveUser = (user) => localStorage.setItem(USER_KEY, JSON.stringify(user));
  const clear    = () => localStorage.removeItem(USER_KEY);
  const user     = () => { try { return JSON.parse(localStorage.getItem(USER_KEY) || 'null'); } catch { return null; } };

  async function post(path, body) {
    const res = await fetch(`${B}${path}`, {
      method: 'POST',
      credentials: 'include',                 // send/receive the httpOnly session cookie
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
    getUser:    user,
    // Optimistic: presence of the cached user. The cookie is the real credential;
    // refresh()/authFetch() reconcile with the backend and clear on 401.
    isLoggedIn: () => !!user(),
    isVerified: () => { const u = user(); return !!(u && u.is_verified); },

    async logout() {
      // JS can't delete an httpOnly cookie — the backend clears it.
      try { await fetch(`${B}/api/v1/auth/logout`, { method: 'POST', credentials: 'include' }); }
      catch { /* clear local state regardless */ }
      clear();
    },

    async register(email, password) {
      const d = await post('/api/v1/auth/register', { email, password });
      saveUser(d.user);                       // cookie already set by the response
      return d;
    },
    async login(email, password) {
      const d = await post('/api/v1/auth/login', { email, password });
      saveUser(d.user);
      return d;
    },
    // Refresh the cached user from the backend; clears session on 401.
    async refresh() {
      const res = await fetch(`${B}/api/v1/auth/me`, { credentials: 'include' });
      if (res.status === 401) { clear(); return null; }
      if (!res.ok) return user();
      const d = await res.json();
      if (d && d.user) saveUser(d.user);
      return d && d.user;
    },
    forgotPassword:     (email)             => post('/api/v1/auth/forgot-password', { email }),
    resetPassword:      (tok, new_password) => post('/api/v1/auth/reset-password', { token: tok, new_password }),
    verifyEmail:        (tok)               => post('/api/v1/auth/verify', { token: tok }),
    resendVerification: (email)             => post('/api/v1/auth/resend-verification', { email }),

    // For protected endpoints (portfolio/watchlist): the cookie authenticates,
    // so just include credentials. Clears the session on a 401 so the UI reacts.
    async authFetch(path, opts = {}) {
      const res = await fetch(`${B}${path}`, { ...opts, credentials: 'include' });
      if (res.status === 401) clear();
      return res;
    },
  };
})();
