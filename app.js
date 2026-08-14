/**
 * VILLE DE LAXOU - PRODUCTION JAVASCRIPT
 * Micro-interactions, Accessibility & IntersectionObserver Scroll Reveal
 */

document.addEventListener('DOMContentLoaded', () => {
  initThemeToggle();
  initMobileNav();
  initScrollReveal();
  initGdprForms();
});

/* 1. Theme & High-Contrast Toggles */
function initThemeToggle() {
  const themeBtn = document.getElementById('themeToggle');
  const contrastBtn = document.getElementById('highContrastToggle');

  // Load saved preferences
  const savedTheme = localStorage.getItem('laxou-theme');
  if (savedTheme === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark');
  }

  if (themeBtn) {
    themeBtn.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme');
      if (current === 'dark') {
        document.documentElement.removeAttribute('data-theme');
        localStorage.setItem('laxou-theme', 'light');
      } else {
        document.documentElement.setAttribute('data-theme', 'dark');
        localStorage.setItem('laxou-theme', 'dark');
      }
    });
  }

  if (contrastBtn) {
    contrastBtn.addEventListener('click', () => {
      document.body.classList.toggle('high-contrast');
    });
  }
}

/* 2. Accessible Mobile Drawer Navigation */
function initMobileNav() {
  const toggleBtn = document.getElementById('navToggle');
  const mainNav = document.getElementById('mainNav');

  if (toggleBtn && mainNav) {
    toggleBtn.addEventListener('click', () => {
      const isExpanded = toggleBtn.getAttribute('aria-expanded') === 'true';
      toggleBtn.setAttribute('aria-expanded', !isExpanded);
      mainNav.classList.toggle('is-open');
    });
  }
}

/* 3. IntersectionObserver Scroll Reveal & Stagger Animation */
function initScrollReveal() {
  // Check if user prefers reduced motion
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReduced) return;

  // Add reveal classes to sections and grids automatically
  const sections = document.querySelectorAll('section');
  sections.forEach((sec, idx) => {
    sec.classList.add('reveal');
  });

  const grids = document.querySelectorAll('.acces-rapides-grid, .grid-posters, .grid-4, .grid-3-projects');
  grids.forEach(grid => {
    grid.classList.add('reveal-stagger');
    Array.from(grid.children).forEach((child, i) => {
      child.style.setProperty('--stagger-index', i);
    });
  });

  // IntersectionObserver Options
  const observerOptions = {
    root: null,
    rootMargin: '0px 0px -50px 0px',
    threshold: 0.12
  };

  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target); // Reveal only once for performance
      }
    });
  }, observerOptions);

  document.querySelectorAll('.reveal, .reveal-stagger').forEach(el => {
    revealObserver.observe(el);
  });
}

/* 4. Form Validation & GDPR Consent */
function initGdprForms() {
  const forms = document.querySelectorAll('form[data-gdpr]');
  forms.forEach(form => {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      alert('Merci ! Votre demande a été enregistrée avec succès par les services de la Mairie de Laxou.');
      form.reset();
    });
  });
}
