/* cinziamolisano.it · script comune */
(function () {
  const root = document.body;
  const navbar = document.getElementById('navbar');
  const menu = document.getElementById('mainMenu');
  const menuToggle = document.getElementById('menuToggle');
  const themeToggle = document.getElementById('themeToggle');
  const STORAGE_KEY = 'cinzia-theme';

  /* --- Navbar: ombra quando si scorre --- */
  const onScroll = () => navbar && navbar.classList.toggle('scrolled', window.scrollY > 20);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* --- Menu mobile --- */
  function setMenu(open) {
    if (!menu || !menuToggle) return;
    menu.classList.toggle('open', open);
    menuToggle.setAttribute('aria-expanded', String(open));
    menuToggle.setAttribute('aria-label', open ? 'Chiudi menu' : 'Apri menu');
  }
  menuToggle && menuToggle.addEventListener('click', () => setMenu(!menu.classList.contains('open')));
  menu && menu.querySelectorAll('a').forEach(a => a.addEventListener('click', () => setMenu(false)));
  document.addEventListener('keydown', e => { if (e.key === 'Escape') setMenu(false); });
  document.addEventListener('click', e => {
    if (menu && menu.classList.contains('open') && navbar && !navbar.contains(e.target)) setMenu(false);
  });

  /* --- Tema chiaro/scuro ---
     La classe viene già applicata da un piccolo script in cima al <body>
     (così la pagina non "lampeggia"); qui gestiamo solo il pulsante. */
  function readTheme() { try { return localStorage.getItem(STORAGE_KEY); } catch (e) { return null; } }
  function saveTheme(v) { try { localStorage.setItem(STORAGE_KEY, v); } catch (e) {} }
  if (!readTheme() && window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches) {
    root.classList.add('dark-theme');
  } else if (readTheme() === 'dark') {
    root.classList.add('dark-theme');
  }
  function updateThemeButton() {
    if (!themeToggle) return;
    const dark = root.classList.contains('dark-theme');
    themeToggle.textContent = dark ? '☀' : '☾';
    themeToggle.setAttribute('aria-pressed', String(dark));
    themeToggle.setAttribute('aria-label', dark ? 'Passa al tema chiaro' : 'Passa al tema scuro');
    themeToggle.title = dark ? 'Tema chiaro' : 'Tema scuro';
  }
  updateThemeButton();
  themeToggle && themeToggle.addEventListener('click', () => {
    root.classList.toggle('dark-theme');
    saveTheme(root.classList.contains('dark-theme') ? 'dark' : 'light');
    updateThemeButton();
  });

  /* --- Comparsa morbida delle sezioni --- */
  const reveals = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08 });
    reveals.forEach(el => revealObserver.observe(el));

    /* --- Voce di menu attiva mentre si scorre la home --- */
    const sections = document.querySelectorAll('main section[id]');
    const navLinks = document.querySelectorAll('.menu a[href^="#"]');
    if (navLinks.length) {
      const sectionObserver = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) return;
          navLinks.forEach(link => {
            link.classList.toggle('active', link.getAttribute('href') === '#' + entry.target.id);
          });
        });
      }, { rootMargin: '-35% 0px -55% 0px' });
      sections.forEach(s => sectionObserver.observe(s));
    }
  } else {
    reveals.forEach(el => el.classList.add('visible'));
  }

  /* --- Anno nel footer --- */
  document.querySelectorAll('[data-year]').forEach(el => { el.textContent = new Date().getFullYear(); });
})();
