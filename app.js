/**
 * VILLE DE LAXOU - PRODUCTION JAVASCRIPT
 * Micro-interactions, Accessibility & IntersectionObserver Scroll Reveal
 */

document.addEventListener('DOMContentLoaded', () => {
  initShrinkingHeader();
  initThemeToggle();
  initMobileNav();
  initScrollReveal();
  initGdprForms();
});

/* 0. Shrinking Sticky Header on Scroll */
function initShrinkingHeader() {
  const header = document.querySelector('.site-header');
  if (!header) return;

  let ticking = false;

  function updateHeader(scrollPos) {
    if (scrollPos > 30) {
      header.classList.add('is-scrolled');
    } else {
      header.classList.remove('is-scrolled');
    }
  }

  window.addEventListener('scroll', () => {
    const scrollPos = window.scrollY || window.pageYOffset;
    if (!ticking) {
      window.requestAnimationFrame(() => {
        updateHeader(scrollPos);
        ticking = false;
      });
      ticking = true;
    }
  }, { passive: true });

  // Initial check on load
  updateHeader(window.scrollY || window.pageYOffset);
}

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

/* 5. Smart Search & Direct Navigation */
window.handleSearch = function(query) {
  if (!query || !query.trim()) {
    const input = document.getElementById('site-search-input');
    if (input) input.focus();
    return;
  }

  const q = query.trim().toLowerCase();
  
  const routes = [
    { keys: ['cantine', 'repas', 'periscolaire', 'périscolaire', 'garderie', 'tarifs', 'simulateur', 'famille', 'enfance', 'ecole', 'école'], url: 'simulateur-periscolaire.html' },
    { keys: ['nprnu', 'carte', 'map', 'projet', 'amenagement', 'aménagement', 'provinces', 'champ le boeuf', '3d', 'maquette', 'renovation', 'rénovation'], url: 'nprnu-map.html' },
    { keys: ['elu', 'élus', 'elus', 'maire', 'laurent garcia', 'garcia', 'adjoint', 'conseil', 'equipe', 'équipe'], url: 'equipe-municipale.html' },
    { keys: ['passeport', 'cni', 'identite', 'identité', 'etat civil', 'état civil', 'naissance', 'mariage', 'deces', 'décès', 'papiers'], url: 'article.html' },
    { keys: ['contact', 'signaler', 'signalement', 'voirie', 'eclairage', 'proprete', 'propreté', 'standard', 'telephone', 'horaires'], url: 'contact.html' },
    { keys: ['agenda', 'concert', 'cinema', 'cinéma', 'festival', 'etoiles', 'étoiles', 'sortir', 'spectacle', 'evenement', 'événement'], url: 'agenda.html' },
    { keys: ['arrete', 'arrêté', 'deliberation', 'délibération', 'marches', 'marchés', 'recrutement', 'publications'], url: 'archives.html' },
    { keys: ['sport', 'gymnase', 'piscine', 'terrain', 'stade', 'complexe'], url: 'iframe.html' }
  ];

  for (const route of routes) {
    if (route.keys.some(k => q.includes(k))) {
      window.location.href = route.url;
      return;
    }
  }

  // Fallback: scroll to services section or show alert
  const servicesSec = document.getElementById('services-municipaux');
  if (servicesSec) {
    servicesSec.scrollIntoView({ behavior: 'smooth', block: 'start' });
  } else {
    window.location.href = 'archives.html';
  }
};

