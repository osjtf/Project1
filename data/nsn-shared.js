/*!
 * NextStep Navigator — Shared JS
 * Put this file at: /assets/nsn-shared.js
 * Include it BEFORE page-specific scripts (home/careers/quiz/multimedia).
 * Provides:
 *  - DOM utils: $, $$
 *  - Year setter
 *  - Header personalization
 *  - Recently Viewed (sanitized, deduped, capped)
 *  - Bookmarks (shared across pages)
 *  - Safe JSON loader with friendly error
 */
(function (global) {
  "use strict";

  /** ---------- Tiny DOM helpers ---------- */
  const $  = (s, root=document) => root.querySelector(s);
  const $$ = (s, root=document) => [...root.querySelectorAll(s)];

  /** ---------- Keys ---------- */
  const KEYS = {
    RECENT: 'nsn_recent',
    BOOKMARKS: 'nsn_bookmarks',
  };

  /** ---------- Small utilities ---------- */
  const utils = {
    $,
    $$,
    toDate: (s) => new Date(s),
    capitalize: (s='') => s.charAt(0).toUpperCase() + s.slice(1),
    escapeHTML: (str='') => str.replace(/[&<>"']/g, m => ({
      '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
    }[m])),
    setYear: (selector='#year') => { const el = $(selector); if (el) el.textContent = new Date().getFullYear(); },
  };

  /** ---------- Header personalization ---------- */
  function paintHeaderProfile(helloSel='#helloUser', activeSel='#activeProfile', prefillUserTypeSel='#userTypeFilter') {
    const nm = sessionStorage.getItem('nsn_name') || '';
    const tp = sessionStorage.getItem('nsn_type') || '';

    const helloEl = $(helloSel);
    const activeEl = $(activeSel);

    if (helloEl) helloEl.textContent = (nm || tp)
      ? `Hi ${nm ? nm : ''}${nm && tp ? ' • ' : ''}${tp ? tp[0].toUpperCase()+tp.slice(1) : ''}` : '';

    if (activeEl) activeEl.textContent = tp ? `Tailored for: ${tp}` : '';

    // Optional: prefill a user type filter once
    const sel = $(prefillUserTypeSel);
    if (tp && sel && !sel.value) sel.value = tp;
  }

  /** ---------- Recently Viewed (safe) ---------- */
  function readRecentRaw() {
    try { return JSON.parse(localStorage.getItem(KEYS.RECENT) || '[]'); }
    catch { return []; }
  }

  function sanitizeRecentList(list) {
    const clean = [];
    const seen = new Set();
    for (const item of Array.isArray(list) ? list : []) {
      const label = (item && typeof item.label === 'string') ? item.label.trim() : '';
      const href  = (item && typeof item.href  === 'string') ? item.href.trim()  : '#';
      if (!label) continue; // skip bad
      const key = `${label}::${href}`;
      if (seen.has(key)) continue;
      seen.add(key);
      clean.push({ label, href, ts: Number(item?.ts) || Date.now() });
    }
    return clean.slice(0, 8);
  }

  function getRecent() {
    const sanitized = sanitizeRecentList(readRecentRaw());
    localStorage.setItem(KEYS.RECENT, JSON.stringify(sanitized));
    return sanitized;
  }

  /** Safe writer. Will not add if label is missing. De-duplicates by label+href. */
  function pushRecent(label, href = '#', listSel='#recentList') {
    const name = (typeof label === 'string') ? label.trim() : '';
    const link = (typeof href  === 'string') ? href.trim()  : '#';
    if (!name) return;

    const list = getRecent().filter(x => !(x.label === name && x.href === link));
    list.unshift({ label: name, href: link, ts: Date.now() });
    localStorage.setItem(KEYS.RECENT, JSON.stringify(list.slice(0, 8)));
    paintRecent(listSel);
  }

  function paintRecent(listSel='#recentList') {
    const el = $(listSel);
    if (!el) return;
    const arr = getRecent();
    el.innerHTML = arr.length
      ? arr.map(x => `<li><a href="${x.href || '#'}">${utils.escapeHTML(x.label || '(untitled)')}</a></li>`).join('')
      : '<li class="text-muted">Nothing yet.</li>';
  }

  /** ---------- Bookmarks (shared) ---------- */
  function getBookmarks() {
    try { return JSON.parse(localStorage.getItem(KEYS.BOOKMARKS) || '[]'); }
    catch { return []; }
  }

  function isBookmarked(id) {
    return getBookmarks().some(x => x.id === id);
  }

  function toggleBookmark(entry, listSel='#bookmarkList') {
    if (!entry || !entry.id) return;
    const list = getBookmarks();
    const idx = list.findIndex(x => x.id === entry.id);
    if (idx >= 0) list.splice(idx, 1);
    else list.unshift({ id: entry.id, href: entry.href || '#', label: entry.label || 'Untitled' });
    localStorage.setItem(KEYS.BOOKMARKS, JSON.stringify(list.slice(0, 200)));
    paintBookmarks(listSel);
  }

  function paintBookmarks(listSel='#bookmarkList') {
    const el = $(listSel); if (!el) return;
    const list = getBookmarks();
    el.innerHTML = list.length
      ? list.map(x => `<li><i class="bi bi-heart text-danger me-1"></i>${utils.escapeHTML(x.label)}</li>`).join('')
      : '<li class="text-muted">No bookmarks yet.</li>';
  }

  function exportBookmarks(filename='Bookmarks.txt') {
    const list = getBookmarks();
    if (!list.length) { alert('No bookmarks to export.'); return; }
    const lines = list.map((x,i)=> `${i+1}. ${x.label}${x.href ? ` — ${x.href}`:''}`);
    const blob = new Blob([lines.join('\n')], {type:'text/plain'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  }

  function clearBookmarks(listSel='#bookmarkList') {
    localStorage.removeItem(KEYS.BOOKMARKS);
    paintBookmarks(listSel);
  }

  /** ---------- JSON loader (with friendly error + fallback hook) ---------- */
  async function loadJSON(url, { fallback=null, onErrorMessageSelector='#resultCount' } = {}) {
    try {
      const r = await fetch(url, { cache: 'no-store' });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return await r.json();
    } catch (e) {
      const out = $(onErrorMessageSelector);
      if (out) out.textContent = `Could not load ${url}. ${e.message}. Are you using http(s), not file:// ?`;
      console.error(`Failed to load ${url}`, e);
      return fallback ?? null;
    }
  }

  /** ---------- Public API ---------- */
  const NSN = {
    KEYS, utils,
    // personalization
    paintHeaderProfile,
    // recent
    getRecent, pushRecent, paintRecent,
    // bookmarks
    getBookmarks, isBookmarked, toggleBookmark, paintBookmarks, exportBookmarks, clearBookmarks,
    // data
    loadJSON
  };

  // Attach to window
  global.NSN = NSN;

})(window);
