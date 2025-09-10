// Home page logic: session capture, tailored menu, clock, geolocation, visitor counter,
// recommendations, recently viewed.
(function () {
  const qs  = (sel, el = document) => el.querySelector(sel);
  const qsa = (sel, el = document) => [...el.querySelectorAll(sel)];

  // Elements
  const form          = qs('#welcomeForm');
  const nameInput     = qs('#userName');
  const greetingEl    = qs('#greeting');
  const utError       = qs('#utError');
  const tailoredMenu  = qs('#tailoredMenu');
  const suggestionsEl = qs('#suggestions');
  const recentEl      = qs('#recentlyViewed');
  const clockNow      = qs('#clockNow');
  const geoCity       = qs('#geoCity');
  const visitorCount  = qs('#visitorCount');

  const SS_NAME = 'nsn_name';
  const SS_TYPE = 'nsn_type';
  const LS_VIS  = 'nsn_visitors';
  const LS_REC  = 'nsn_recent';

  // Bootstrap validation helper
  function enableBootstrapValidation() {
    if (!form) return;
    form.addEventListener('submit', function (event) {
      const userType = getSelectedUserType();
      if (!form.checkValidity() || !userType) {
        event.preventDefault();
        event.stopPropagation();
        if (!userType && utError) utError.style.display = 'block';
      } else {
        if (utError) utError.style.display = 'none';
      }
      form.classList.add('was-validated');
    }, false);
  }

  function getSelectedUserType() {
    const r = qs('input[name="userType"]:checked');
    return r ? r.value : null;
  }

  // Session handling
  function setSession(name, type) {
    sessionStorage.setItem(SS_NAME, name);
    sessionStorage.setItem(SS_TYPE, type);
  }
  function getSession() {
    return { name: sessionStorage.getItem(SS_NAME), type: sessionStorage.getItem(SS_TYPE) };
  }
  function labelFor(type) {
    if (type === 'student') return 'Future Achiever';
    if (type === 'graduate') return 'Rising Graduate';
    if (type === 'professional') return 'Career Changer';
    return 'Explorer';
  }
  function showGreeting(name, type) {
    if (!greetingEl) return;
    greetingEl.hidden = false;
    greetingEl.textContent = `Welcome, ${name}! (${labelFor(type)})`;
  }

  // Tailored menu
  const MENU_BY_TYPE = {
    student: [
      { href: 'careers.html',    title: 'Career Bank', text: 'Filter by industry and compare paths.' },
      { href: 'quiz.html',       title: 'Interest Quiz', text: 'Find your stream in minutes.' },
      { href: 'admissions.html', title: 'Admissions & Coaching', text: 'Stream selection and interview prep.' },
      { href: 'resources.html',  title: 'Resource Library', text: 'Articles, eBooks & checklists.' },
    ],
    graduate: [
      { href: 'quiz.html',       title: 'Interest Quiz', text: 'Align your degree with careers.' },
      { href: 'careers.html',    title: 'Career Bank', text: 'Skills, salaries, and education paths.' },
      { href: 'resources.html',  title: 'Resource Library', text: 'Resume, interview, upskilling.' },
      { href: 'multimedia.html', title: 'Multimedia', text: 'Talks & podcasts from pros.' },
    ],
    professional: [
      { href: 'careers.html',    title: 'Career Bank', text: 'Explore transitions & salary ranges.' },
      { href: 'resources.html',  title: 'Resource Library', text: 'Practical guides & webinars.' },
      { href: 'stories.html',    title: 'Success Stories', text: 'Real journeys across domains.' },
      { href: 'multimedia.html', title: 'Multimedia', text: 'Insights from industry voices.' },
    ]
  };
  function renderTailoredMenu(type) {
    if (!tailoredMenu) return;
    const items = MENU_BY_TYPE[type] || MENU_BY_TYPE.student;
    tailoredMenu.innerHTML = items.map(i => `
      <div class="col-12 col-sm-6 col-lg-3">
        <a href="${i.href}" class="tile" data-track="tile">
          <div class="tile-title">${i.title}</div>
          <p class="tile-text">${i.text}</p>
        </a>
      </div>
    `).join('');
    qsa('[data-track="tile"]', tailoredMenu).forEach(a => {
      a.addEventListener('click', () => {
        trackRecent({ title: a.querySelector('.tile-title')?.textContent || 'Item', url: a.getAttribute('href') });
      });
    });
  }

  // Visitor counter (simulated)
  function bumpVisitorCounter() {
    try {
      let n = parseInt(localStorage.getItem(LS_VIS) || '0', 10);
      n = isFinite(n) ? n + 1 : 1;
      localStorage.setItem(LS_VIS, String(n));
      if (visitorCount) visitorCount.textContent = n.toLocaleString();
    } catch {
      if (visitorCount) visitorCount.textContent = '—';
    }
  }

  // Live clock
  function startClock() {
    if (!clockNow) return;
    const fmt = new Intl.DateTimeFormat([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const tick = () => clockNow.textContent = fmt.format(new Date());
    tick();
    setInterval(tick, 1000);
  }

  // Geolocation (no external reverse geocode; show coordinates)
  function tryGeolocation() {
    if (!geoCity || !('geolocation' in navigator)) {
      if (geoCity) geoCity.textContent = 'Unavailable';
      return;
    }
    navigator.geolocation.getCurrentPosition(
      pos => {
        const { latitude, longitude } = pos.coords;
        geoCity.textContent = `${latitude.toFixed(2)}, ${longitude.toFixed(2)}`;
      },
      _err => { geoCity.textContent = 'Permission denied'; },
      { enableHighAccuracy: false, timeout: 5000, maximumAge: 60000 }
    );
  }

  // Recommendations & Recently viewed
  const RECO_BY_TYPE = {
    student: [
      { title: 'Top 10 STEM careers', meta: 'Article • Library', url: 'resources.html' },
      { title: 'How to pick a stream after Grade 10', meta: 'Guide • Admissions', url: 'admissions.html' },
      { title: 'What data analysts actually do', meta: 'Video • Multimedia', url: 'multimedia.html' },
    ],
    graduate: [
      { title: 'Entry roles in product & data', meta: 'Webinar • Library', url: 'resources.html' },
      { title: 'Interview fundamentals', meta: 'Guide • Admissions', url: 'admissions.html' },
      { title: 'From CS degree to SWE', meta: 'Story • Success', url: 'stories.html' },
    ],
    professional: [
      { title: 'Pivoting careers without a pay cut', meta: 'Article • Library', url: 'resources.html' },
      { title: 'Resume refresh in 30 minutes', meta: 'Checklist • Library', url: 'resources.html' },
      { title: 'Real transitions into tech', meta: 'Podcast • Multimedia', url: 'multimedia.html' },
    ]
  };
  function renderRecommendations(type) {
    if (!suggestionsEl) return;
    const list = RECO_BY_TYPE[type] || RECO_BY_TYPE.student;
    suggestionsEl.innerHTML = list.map(x => `
      <div class="col-12 col-md-6 col-lg-4">
        <div class="sugg-card">
          <div class="sugg-title">${x.title}</div>
          <div class="sugg-meta">${x.meta}</div>
          <a class="stretched-link text-decoration-none" href="${x.url}" data-track="sugg">Open →</a>
        </div>
      </div>
    `).join('');
    qsa('[data-track="sugg"]', suggestionsEl).forEach(a => {
      a.addEventListener('click', () => {
        const title = a.parentElement?.querySelector('.sugg-title')?.textContent || 'Recommended';
        trackRecent({ title, url: a.getAttribute('href') });
      });
    });
  }

  function trackRecent(item) {
    try {
      const nowList = JSON.parse(localStorage.getItem(LS_REC) || '[]');
      const filtered = nowList.filter(x => x.url !== item.url);
      filtered.unshift({ ...item, ts: Date.now() });
      const trimmed = filtered.slice(0, 8);
      localStorage.setItem(LS_REC, JSON.stringify(trimmed));
    } catch { /* ignore */ }
  }
  function renderRecent() {
    if (!recentEl) return;
    let list = [];
    try { list = JSON.parse(localStorage.getItem(LS_REC) || '[]'); } catch {}
    if (!list.length) {
      recentEl.innerHTML = `<div class="col-12"><div class="text-secondary">No items yet.</div></div>`;
      return;
    }
    recentEl.innerHTML = list.map(x => `
      <div class="col-12 col-md-6 col-lg-4">
        <div class="recent-card">
          <div class="recent-title">${x.title}</div>
          <div class="recent-meta">${timeAgo(x.ts)}</div>
          <a class="stretched-link text-decoration-none" href="${x.url}">Open →</a>
        </div>
      </div>
    `).join('');
  }
  function timeAgo(ts) {
    if (!ts) return '';
    const s = Math.max(1, Math.floor((Date.now() - ts) / 1000));
    if (s < 60) return `${s}s ago`;
    const m = Math.floor(s / 60);
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    const d = Math.floor(h / 24);
    return `${d}d ago`;
  }

  // Init
  function initFromSession() {
    const { name, type } = getSession();
    if (name) {
      const t = type || 'student';
      showGreeting(name, t);
      renderTailoredMenu(t);
      renderRecommendations(t);
    }
  }
  function wireForm() {
    if (!form) return;
    form.addEventListener('submit', (e) => {
      if (!form.checkValidity() || !getSelectedUserType()) {
        e.preventDefault(); e.stopPropagation();
        if (!getSelectedUserType() && utError) utError.style.display = 'block';
        return;
      }
      e.preventDefault();
      const name = nameInput.value.trim();
      const type = getSelectedUserType();
      setSession(name, type);
      showGreeting(name, type);
      renderTailoredMenu(type);
      renderRecommendations(type);
    });
    qsa('input[name="userType"]').forEach(r => {
      r.addEventListener('change', () => { if (utError) utError.style.display = 'none'; });
    });
  }
  function markHomeVisited() {
    trackRecent({ title: 'Home', url: 'index.html' });
  }

  document.addEventListener('DOMContentLoaded', () => {
    enableBootstrapValidation();
    initFromSession();
    wireForm();

    bumpVisitorCounter();
    startClock();
    tryGeolocation();

    renderRecent();
    markHomeVisited();
  });
})();
