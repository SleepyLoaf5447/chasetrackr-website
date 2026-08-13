// Shared navy nav — injected into every page via <div id="site-nav"></div>.
// Auth-aware: reads window.CT.auth (loaded before this file). Logged-out shows
// Log In / Sign Up; logged-in shows Watchlist / My Portfolio + account + Log Out,
// plus a "verify your email" banner when the account is unverified.
(function () {
  const auth     = window.CT && window.CT.auth;
  const loggedIn = !!(auth && auth.isLoggedIn());
  const verified = !!(auth && auth.isVerified());
  const user     = (auth && auth.getUser()) || null;
  const esc = (s) => String(s || '').replace(/[<>&"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' }[c]));

  // Watchlist / My Portfolio only exist for logged-in users (pages arrive in
  // Phase 4 — hrefs are "#" until then).
  const authedLinks = loggedIn ? `
      <li><a href="watchlist.html" class="nav-link" data-page="watchlist">Watchlist</a></li>
      <li><a href="portfolio.html" class="nav-link" data-page="portfolio">My Portfolio</a></li>` : '';

  const rightSide = loggedIn ? `
    <span class="nav-account" title="${esc(user && user.email)}">${esc(user && user.email)}</span>
    <button type="button" class="btn-nav-ghost" id="nav-logout">Log Out</button>`
    : `
    <a class="btn-nav-ghost nav-link" href="signin.html" data-page="signin">Log In</a>
    <a class="btn-nav-primary nav-link" href="signin.html?tab=signup" data-page="signup">Sign Up</a>`;

  const drawerLinks = loggedIn
    ? `<a href="watchlist.html">Watchlist</a><a href="portfolio.html">My Portfolio</a><a href="#" id="nav-drawer-logout">Log Out</a>`
    : `<a href="signin.html">Log In / Sign Up</a>`;

  const NAV_HTML = `
<nav class="site-nav" role="navigation" aria-label="Main navigation">
  <a class="nav-logo" href="index.html" aria-label="ChaseTrackr home">
    <img class="nav-icon" src="brand_assets/Homescreen App icon.png" alt="" />
    <span class="nav-wordmark">Chase<span class="cyan">Trackr</span></span>
  </a>

  <div class="nav-search-wrap">
    <svg class="nav-search-icon" width="20" height="20" viewBox="0 0 20 20" fill="none">
      <circle cx="8.5" cy="8.5" r="5.5" stroke="rgba(255,255,255,0.5)" stroke-width="1.75"/>
      <path d="M13 13L18 18" stroke="rgba(255,255,255,0.5)" stroke-width="1.75" stroke-linecap="round"/>
    </svg>
    <input class="nav-search" id="nav-search-input" type="search"
      placeholder="Search cards, sets, rarity…" autocomplete="off" aria-label="Search cards" />
  </div>

  <div class="nav-right">
    <ul class="nav-links">
      <li><a href="search.html" class="nav-link" data-page="search">All Cards</a></li>
      <li><a href="trends.html" class="nav-link" data-page="trends">Market Trends</a></li>
      ${authedLinks}
    </ul>
    ${rightSide}
    <button class="nav-hamburger" aria-label="Toggle menu" aria-expanded="false">
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <rect y="4"  width="22" height="2" rx="1" fill="currentColor"/>
        <rect y="10" width="22" height="2" rx="1" fill="currentColor"/>
        <rect y="16" width="22" height="2" rx="1" fill="currentColor"/>
      </svg>
    </button>
  </div>
</nav>

<div class="nav-mobile-drawer" id="nav-drawer" role="menu">
  <a href="index.html">Home</a>
  <a href="search.html">All Cards</a>
  <a href="trends.html">Market Trends</a>
  ${drawerLinks}
</div>

${loggedIn && !verified ? `
<div class="verify-banner" id="verify-banner">
  <span class="verify-banner-text">⚠ Verify your email to unlock portfolios &amp; price alerts.</span>
  <button type="button" class="verify-resend" id="verify-resend">Resend email</button>
  <button type="button" class="verify-dismiss" id="verify-dismiss" aria-label="Dismiss">×</button>
</div>` : ''}
  `.trim();

  // Inject
  const placeholder = document.getElementById('site-nav');
  if (placeholder) placeholder.outerHTML = NAV_HTML;
  else document.body.insertAdjacentHTML('afterbegin', NAV_HTML);

  // Active link by filename
  const page = location.pathname.split('/').pop().replace('.html', '') || 'index';
  document.querySelectorAll('.site-nav .nav-link[data-page]').forEach((link) => {
    if (link.dataset.page === page) link.classList.add('active');
  });

  // Search: on search.html → inline filter; elsewhere → navigate
  const searchInput = document.getElementById('nav-search-input');
  if (searchInput) {
    const params = new URLSearchParams(location.search);
    if (params.has('q')) searchInput.value = params.get('q');
    searchInput.addEventListener('keydown', function (e) {
      if (e.key !== 'Enter') return;
      const q = this.value.trim();
      if (!q) return;
      if (page === 'search') document.dispatchEvent(new CustomEvent('ct:search', { detail: { q } }));
      else location.href = 'search.html?q=' + encodeURIComponent(q);
    });
  }

  // Log out
  function doLogout(e) { if (e) e.preventDefault(); if (auth) auth.logout(); location.href = 'index.html'; }
  document.getElementById('nav-logout')?.addEventListener('click', doLogout);
  document.getElementById('nav-drawer-logout')?.addEventListener('click', doLogout);

  // Verify banner: resend + dismiss
  const banner = document.getElementById('verify-banner');
  if (banner) {
    document.getElementById('verify-dismiss')?.addEventListener('click', () => banner.remove());
    document.getElementById('verify-resend')?.addEventListener('click', async function () {
      this.disabled = true; this.textContent = 'Sending…';
      try {
        if (user && user.email) await auth.resendVerification(user.email);
        this.textContent = 'Email sent ✓';
      } catch (err) {
        this.textContent = err.status === 429 ? 'Try again later' : 'Failed — retry';
        this.disabled = false;
      }
    });
  }

  // Hamburger toggle
  const hamburger = document.querySelector('.nav-hamburger');
  const drawer = document.getElementById('nav-drawer');
  if (hamburger && drawer) {
    hamburger.addEventListener('click', function () {
      const open = drawer.classList.toggle('open');
      this.setAttribute('aria-expanded', open);
    });
    document.addEventListener('click', function (e) {
      if (!hamburger.contains(e.target) && !drawer.contains(e.target)) {
        drawer.classList.remove('open');
        hamburger.setAttribute('aria-expanded', 'false');
      }
    });
  }

  // Background session refresh: cached state renders instantly; then confirm
  // with the backend. If the token is invalid/expired (401), reload as logged
  // out; if the email got verified elsewhere, drop the banner.
  if (loggedIn && auth) {
    auth.refresh().then((u) => {
      if (!u) { location.reload(); return; }            // session cleared → re-render logged-out
      if (u.is_verified) banner?.remove();
    }).catch(() => { /* offline/cold-start — keep cached view */ });
  }
})();
