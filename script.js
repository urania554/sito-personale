const navbar = document.getElementById('navbar');
const menu = document.getElementById('mainMenu');
const menuToggle = document.getElementById('menuToggle');
const themeToggle = document.getElementById('themeToggle');

window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 20);
});

menuToggle?.addEventListener('click', () => {
  const isOpen = menu.classList.toggle('open');
  menuToggle.setAttribute('aria-expanded', String(isOpen));
  menuToggle.setAttribute('aria-label', isOpen ? 'Chiudi menu' : 'Apri menu');
});

menu?.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => {
    menu.classList.remove('open');
    menuToggle?.setAttribute('aria-expanded', 'false');
  });
});

const savedTheme = localStorage.getItem('cinzia-theme');
if (savedTheme === 'dark') {
  document.body.classList.add('dark-theme');
}

function updateThemeIcon() {
  if (!themeToggle) return;
  themeToggle.textContent = document.body.classList.contains('dark-theme') ? '☀' : '☾';
}

updateThemeIcon();

themeToggle?.addEventListener('click', () => {
  document.body.classList.toggle('dark-theme');
  localStorage.setItem('cinzia-theme', document.body.classList.contains('dark-theme') ? 'dark' : 'light');
  updateThemeIcon();
});

const revealObserver = new IntersectionObserver((entries, observer) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });

document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

const sections = document.querySelectorAll('main section[id]');
const navLinks = document.querySelectorAll('.menu a[href^="#"]');

const sectionObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    navLinks.forEach(link => {
      link.classList.toggle('active', link.getAttribute('href') === `#${entry.target.id}`);
    });
  });
}, { rootMargin: '-35% 0px -55% 0px' });

sections.forEach(section => sectionObserver.observe(section));
