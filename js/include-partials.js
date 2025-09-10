// Include header & footer partials, set active nav, greeting, theme, and mobile toggle
(async function injectPartials() {
  const headerHost = document.querySelector('[data-include="header"]');
  const footerHost = document.querySelector('[data-include="footer"]');

  // Helper to fetch text
  const load = async (url) => (await fetch(url, { cache: 'no-cache' })).text();

  if (headerHost) {
    headerHost.innerHTML = await load('partials/header.html');

    // Active link highlighting based on current file name
    const path = location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.site-nav a[data-nav]').forEach(a => {
      if (a.getAttribute('data-nav') === path) a.classList.add('is-active');
    });

    // Greeting (session only, name/type set elsewhere)
    const name = sessionStorage.getItem('nsn_name');
    const type = sessionStorage.getItem('nsn_type');
    const greetEl = document.getElementById('headerGreeting');
    if (greetEl && name) {
      const label = type === 'student' ? 'Future Achiever'
                  : type === 'graduate' ? 'Rising Graduate'
                  : type === 'professional' ? 'Career Changer' : 'Explorer';
      greetEl.textContent = `Hi, ${name} — ${label}`;
    }

    // Theme toggle
    const themeToggle = document.getElementById('themeToggle');
    const root = document.documentElement;
    const KEY = 'nsn_theme';
    const applyTheme = (t) => root.setAttribute('data-theme', t);
    const saved = localStorage.getItem(KEY) || 'light';
    applyTheme(saved);
    if (themeToggle) {
      themeToggle.addEventListener('click', () => {
        const next = (root.getAttribute('data-theme') === 'dark') ? 'light' : 'dark';
        applyTheme(next);
        localStorage.setItem(KEY, next);
      });
    }

    // Mobile nav toggle
    const navToggle = document.getElementById('navToggle');
    const nav = document.getElementById('primaryNav');
    if (navToggle && nav) {
      navToggle.addEventListener('click', () => {
        const expanded = navToggle.getAttribute('aria-expanded') === 'true';
        navToggle.setAttribute('aria-expanded', String(!expanded));
        nav.classList.toggle('is-open', !expanded);
      });
    }
  }

  if (footerHost) {
    footerHost.innerHTML = await load('partials/footer.html');
  }
})();
