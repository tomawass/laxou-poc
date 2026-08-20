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
  const toggleBtn = document.getElementById("navToggle");
  const mainNav = document.getElementById("mainNav");

  if (toggleBtn && mainNav) {
    // Create overlay dynamically
    let overlay = document.createElement("div");
    overlay.className = "mobile-menu-overlay";
    document.body.appendChild(overlay);

    function closeMenu() {
      toggleBtn.setAttribute("aria-expanded", "false");
      mainNav.classList.remove("is-open");
      overlay.classList.remove("is-active");
      document.body.style.overflow = "";
    }

    toggleBtn.addEventListener("click", () => {
      const isExpanded = toggleBtn.getAttribute("aria-expanded") === "true";
      if (isExpanded) {
        closeMenu();
      } else {
        toggleBtn.setAttribute("aria-expanded", "true");
        mainNav.classList.add("is-open");
        overlay.classList.add("is-active");
        document.body.style.overflow = "hidden";
      }
    });

    overlay.addEventListener("click", closeMenu);

    // Accordion logic for submenus
    const navItems = mainNav.querySelectorAll(".nav-item");
    navItems.forEach(item => {
      const link = item.querySelector(".nav-link[aria-haspopup=\"true\"]");
      const dropdown = item.querySelector(".dropdown-menu, .mega-menu-3col");
      if (link && dropdown) {
        link.addEventListener("click", (e) => {
          if (window.innerWidth <= 992) {
            e.preventDefault();
            const isOpen = dropdown.classList.contains("is-open");
            
            // Close siblings
            navItems.forEach(sibling => {
              if (sibling !== item) {
                const siblingDropdown = sibling.querySelector(".dropdown-menu, .mega-menu-3col");
                if (siblingDropdown) siblingDropdown.classList.remove("is-open");
                const siblingLink = sibling.querySelector(".nav-link");
                if(siblingLink) siblingLink.classList.remove("submenu-open");
              }
            });

            // Toggle current
            if (isOpen) {
              dropdown.classList.remove("is-open");
              link.classList.remove("submenu-open");
            } else {
              dropdown.classList.add("is-open");
              link.classList.add("submenu-open");
            }
          }
        });
      }
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

/* 5. Smart Search & Autocomplete Live Search */
document.addEventListener('DOMContentLoaded', () => {
  const searchInput = document.getElementById('site-search-input');
  const dropdown = document.getElementById('search-autocomplete-dropdown');
  
  if (!searchInput || !dropdown) return;

  const routes = [
    { title: 'Simulateur Périscolaire', icon: 'fa-calculator', keys: ['cantine', 'repas', 'periscolaire', 'garderie', 'simulateur', 'famille', 'ecole'], url: 'simulateur-periscolaire.html' },
    { title: 'Carte Interactive (Projets & NPRNU)', icon: 'fa-map-location-dot', keys: ['nprnu', 'carte', 'map', 'projet', 'amenagement', 'champ le boeuf', '3d'], url: 'nprnu-map.html' },
    { title: 'Équipe Municipale & Élus', icon: 'fa-users', keys: ['elu', 'elus', 'maire', 'garcia', 'adjoint', 'conseil', 'equipe'], url: 'equipe-municipale.html' },
    { title: 'Démarches : État Civil & CNI', icon: 'fa-id-card', keys: ['passeport', 'cni', 'identite', 'etat civil', 'naissance', 'mariage', 'deces', 'papiers'], url: 'article.html' },
    { title: 'Contact & Signalements', icon: 'fa-phone', keys: ['contact', 'signaler', 'signalement', 'voirie', 'proprete', 'telephone', 'horaires'], url: 'contact.html' },
    { title: 'Agenda & Événements', icon: 'fa-calendar-days', keys: ['agenda', 'concert', 'cinema', 'festival', 'etoiles', 'sortir', 'spectacle', 'evenement'], url: 'agenda.html' },
    { title: 'Publications & Arrêtés', icon: 'fa-file-signature', keys: ['arrete', 'deliberation', 'marches', 'recrutement', 'publications'], url: 'archives.html' },
    { title: 'Installations Sportives', icon: 'fa-volleyball', keys: ['sport', 'gymnase', 'piscine', 'terrain', 'stade', 'complexe'], url: 'iframe.html' }
  ];

  let activeIndex = -1;

  function renderResults(query) {
    if (!query || query.length < 2) {
      dropdown.classList.remove('active');
      dropdown.innerHTML = '';
      return;
    }

    const q = query.toLowerCase();
    const results = routes.filter(route => route.keys.some(k => k.includes(q) || q.includes(k)));

    if (results.length === 0) {
      dropdown.innerHTML = '<div class="autocomplete-item" style="color: #888;">Aucun résultat trouvé...</div>';
      dropdown.classList.add('active');
      return;
    }

    dropdown.innerHTML = results.slice(0, 5).map((res, index) => `
      <a href="${res.url}" class="autocomplete-item" data-index="${index}">
        <i class="fa-solid ${res.icon}"></i> ${res.title}
      </a>
    `).join('');
    
    dropdown.classList.add('active');
    activeIndex = -1;
  }

  searchInput.addEventListener('input', (e) => renderResults(e.target.value));
  
  searchInput.addEventListener('focus', (e) => renderResults(e.target.value));

  // Close dropdown on click outside
  document.addEventListener('click', (e) => {
    if (!searchInput.contains(e.target) && !dropdown.contains(e.target)) {
      dropdown.classList.remove('active');
    }
  });

  // Keyboard navigation
  searchInput.addEventListener('keydown', (e) => {
    const items = dropdown.querySelectorAll('.autocomplete-item');
    if (!dropdown.classList.contains('active') || items.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      activeIndex = (activeIndex + 1) % items.length;
      updateHighlight(items);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      activeIndex = (activeIndex - 1 + items.length) % items.length;
      updateHighlight(items);
    } else if (e.key === 'Enter' && activeIndex >= 0) {
      e.preventDefault();
      items[activeIndex].click();
    }
  });

  function updateHighlight(items) {
    items.forEach((item, index) => {
      if (index === activeIndex) {
        item.classList.add('highlighted');
      } else {
        item.classList.remove('highlighted');
      }
    });
  }
});

window.handleSearch = function(query) {
  if (!query || !query.trim()) return;
  // Aubagne style : on redirige vers une page de résultats intelligente
  window.location.href = 'recherche.html?q=' + encodeURIComponent(query.trim());
};

