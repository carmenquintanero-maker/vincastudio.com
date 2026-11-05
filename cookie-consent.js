/* Cookie consent + Google Analytics (GA4).
   Google Analytics is NOT loaded until the visitor clicks "Accept".
   The choice is kept for 12 months, then the banner asks again.
   Any element with [data-cookie-settings] reopens the banner (footer link).
   Clicks on elements with [data-track="event_name"] are sent to GA as events (only after consent). */
(function () {
  var GA_ID = 'G-1FJ3N8H4J5';            // ← Google Analytics measurement ID
  var KEY = 'vinca-consent';
  var MAX_AGE = 365 * 24 * 60 * 60 * 1000; // ask again after 12 months
  var COOKIE_EXPIRES = 395 * 24 * 60 * 60; // GA cookies last 13 months

  var es = (document.documentElement.lang || '').toLowerCase().indexOf('es') === 0;
  var T = es ? {
    label: 'Aviso de cookies',
    text: 'Usamos cookies de Google Analytics para saber cuántas personas visitan la web y cómo llegan a ella. Solo se activan si las aceptas.',
    more: 'Política de cookies', href: '/es/cookies',
    reject: 'Rechazar', accept: 'Aceptar'
  } : {
    label: 'Cookie notice',
    text: 'We use Google Analytics cookies to see how many people visit the site and how they find it. They are only set if you accept.',
    more: 'Cookie policy', href: '/cookies',
    reject: 'Reject', accept: 'Accept'
  };

  function read() {
    try {
      var c = JSON.parse(localStorage.getItem(KEY));
      if (c && (c.v === 'granted' || c.v === 'denied') && Date.now() - c.t < MAX_AGE) return c.v;
    } catch (e) {}
    return null;
  }
  function save(v) {
    try { localStorage.setItem(KEY, JSON.stringify({ v: v, t: Date.now() })); } catch (e) {}
  }

  var loaded = false;
  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }

  function loadGA() {
    if (loaded) return;
    if (!/^G-[A-Z0-9]+$/.test(GA_ID) || GA_ID === 'G-XXXXXXXXXX') { console.warn('cookie-consent: set GA_ID'); return; }
    loaded = true;
    window.gtag = gtag;
    gtag('consent', 'default', { analytics_storage: 'granted', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied' });
    gtag('js', new Date());
    gtag('config', GA_ID, { cookie_expires: COOKIE_EXPIRES, allow_google_signals: false, allow_ad_personalization_signals: false });
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_ID;
    document.head.appendChild(s);
  }

  // Remove GA cookies (used when consent is withdrawn). GA is switched off first so it can't write them back.
  function clearGA() {
    window['ga-disable-' + GA_ID] = true;
    var host = location.hostname.replace(/^www\./, '');
    document.cookie.split(';').forEach(function (c) {
      var name = c.split('=')[0].trim();
      if (!/^_ga/.test(name)) return;
      ['', '; domain=' + host, '; domain=.' + host].forEach(function (d) {
        document.cookie = name + '=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/' + d;
      });
    });
  }

  // ── Banner ──────────────────────────────────────────────
  var css =
    '.cc{position:fixed;left:16px;right:16px;bottom:16px;z-index:200;max-width:560px;margin-left:auto;' +
    'background:#20161D;color:#E9E3DC;border:1px solid rgba(255,255,255,0.08);border-radius:20px;padding:1.4rem 1.5rem 1.25rem;' +
    'font-family:Satoshi,system-ui,sans-serif;box-shadow:0 2px 6px rgba(32,22,29,0.18),0 18px 48px rgba(32,22,29,0.32),0 0 0 1px rgba(220,133,183,0.08);' +
    'opacity:0;transform:translateY(16px);transition:opacity .35s ease,transform .55s cubic-bezier(0.34,1.56,0.64,1)}' +
    '.cc.on{opacity:1;transform:none}' +
    '.cc-label{display:block;font-family:Fredoka,system-ui,sans-serif;font-size:.68rem;font-weight:700;letter-spacing:.25em;text-transform:uppercase;color:#DC85B7;margin-bottom:.6rem}' +
    '.cc p{margin:0;font-size:.95rem;line-height:1.6;color:rgba(233,227,220,0.82)}' +
    '.cc p a{color:#E9E3DC;font-weight:600;text-decoration:underline;text-decoration-color:#DC85B7;text-underline-offset:3px;border-radius:2px;transition:color .2s}' +
    '.cc p a:hover{color:#F0B45E}.cc p a:focus-visible{outline:2px solid #F0B45E;outline-offset:2px}.cc p a:active{opacity:.7}' +
    '.cc-btns{display:flex;gap:.75rem;margin-top:1.1rem}' +
    '.cc-btns button{flex:1;font-family:Fredoka,system-ui,sans-serif;font-size:.8rem;font-weight:600;letter-spacing:.08em;text-transform:uppercase;' +
    'padding:.85rem 1rem;border:0;border-radius:100px;cursor:pointer;color:#20161D;line-height:1;' +
    'transition:transform .25s cubic-bezier(0.34,1.56,0.64,1),opacity .2s}' +
    '.cc-btns button:hover{transform:translateY(-2px)}.cc-btns button:active{transform:scale(.97)}' +
    '.cc-btns button:focus-visible{outline:2px solid #DC85B7;outline-offset:3px}' +
    '.cc-reject{background:#E9E3DC}.cc-accept{background:#F0B45E}' +
    '@media (prefers-reduced-motion:reduce){.cc,.cc-btns button{transition:opacity .2s}}';

  var banner;
  function show() {
    if (!banner) {
      var st = document.createElement('style');
      st.textContent = css;
      document.head.appendChild(st);
      banner = document.createElement('div');
      banner.className = 'cc';
      banner.setAttribute('role', 'dialog');
      banner.setAttribute('aria-live', 'polite');
      banner.setAttribute('aria-label', T.label);
      banner.innerHTML =
        '<span class="cc-label">Cookies</span>' +
        '<p>' + T.text + ' <a href="' + T.href + '">' + T.more + '</a>.</p>' +
        '<div class="cc-btns"><button type="button" class="cc-reject">' + T.reject + '</button>' +
        '<button type="button" class="cc-accept">' + T.accept + '</button></div>';
      document.body.appendChild(banner);
      banner.querySelector('.cc-accept').addEventListener('click', function () { choose('granted'); });
      banner.querySelector('.cc-reject').addEventListener('click', function () { choose('denied'); });
    }
    banner.hidden = false;
    requestAnimationFrame(function () { requestAnimationFrame(function () { banner.classList.add('on'); }); });
  }
  function hide() {
    if (!banner) return;
    banner.classList.remove('on');
    setTimeout(function () { banner.hidden = true; }, 350);
  }
  function choose(v) {
    var before = read();
    save(v);
    hide();
    if (v === 'granted') loadGA();
    else if (before === 'granted' || loaded) { clearGA(); location.reload(); }
  }

  function init() {
    var c = read();
    if (c === 'granted') loadGA();
    else {
      if (/(^|;\s*)_ga/.test(document.cookie)) clearGA(); // leftovers from an earlier "Accept"
      if (c === null) show();
    }

    document.addEventListener('click', function (e) {
      var s = e.target.closest && e.target.closest('[data-cookie-settings]');
      if (s) { e.preventDefault(); show(); return; }
      var t = e.target.closest && e.target.closest('[data-track]');
      if (t && loaded) gtag('event', t.getAttribute('data-track'), { link_url: t.href || undefined });
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
