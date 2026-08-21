const fs = require("fs");
const path = require("path");

const dir = "/Users/carlair/.gemini/antigravity/scratch/laxou-production";
const htmlPath = path.join(dir, "bien-etre-animal.html");
let html = fs.readFileSync(htmlPath, "utf-8");

const headerMatch = html.match(/<header class="site-header">[\s\S]*?<\/header>/);
const footerMatch = html.match(/<footer class="site-footer-aubagne">[\s\S]*?<\/footer>/);

const headerHTML = headerMatch ? headerMatch[0] : "";
const footerHTML = footerMatch ? footerMatch[0] : "";
let ts = Date.now().toString().slice(-6);

const fullHTML = \`<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bien-être animal | POC Laxou</title>
  <link rel="icon" type="image/png" href="assets/favicon.png">
  
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Outfit:wght@600;700;800&display=swap" rel="stylesheet">
  
  <!-- ATTENTION : FONT AWESOME EST SUPPRIMÉ VOLONTAIREMENT -->
  
  <link rel="stylesheet" href="styles.css?v=9014\${ts}">
</head>
<body>

  \${headerHTML}

  <main>
    <!-- Header Éditorial Pur -->
    <section class="editorial-header">
      <div class="container">
        <div class="pole-breadcrumb editorial-breadcrumb">
          <a href="index.html">Accueil</a> &gt; <a href="laxou-nature.html">Laxou Nature</a> &gt; <span>Bien-être animal</span>
        </div>
        
        <div class="editorial-title-wrapper">
          <span class="editorial-eyebrow">Vivre ensemble à Laxou</span>
          <h1 class="editorial-main-title">Bien-être Animal</h1>
          <p class="editorial-subtitle">
            Parce qu'ils partagent notre quotidien, la Ville agit concrètement pour la protection et l'épanouissement de nos compagnons. Découvrez nos actions, des conseils pratiques aux événements qui les célèbrent.
          </p>
        </div>
      </div>
    </section>

    <!-- Navigation Minimaliste (Texte Uniquement) -->
    <nav class="minimal-sticky-nav">
      <div class="container" style="display:flex; justify-content:center; gap:40px; overflow-x:auto;">
        <a href="#comite" class="nav-link active" data-index="0">Le Comité</a>
        <a href="#fiches" class="nav-link" data-index="1">Fiches Pratiques</a>
        <a href="#realisations" class="nav-link" data-index="2">Réalisations</a>
        <a href="#animalaxou" class="nav-link" data-index="3">Animalaxou</a>
      </div>
    </nav>

    <!-- CONTAINER FULL-BLEED (SANS PRISON) -->
    <div class="fullbleed-carousel-wrap">
      <button class="arrow-clean left" id="prevBtn" aria-label="Précédent">‹</button>
      <button class="arrow-clean right" id="nextBtn" aria-label="Suivant">›</button>

      <div class="fullbleed-slides-container" id="slidesContainer">
        
        <!-- PAGE 1 : Le Comité -->
        <section id="comite" class="fullbleed-slide-panel">
          <div class="slide-inner-content">
            
            <div class="slide-header">
              <h2 class="slide-main-title">Le comité consultatif pour le bien-être animal</h2>
              <span class="slide-badge">Créé le 4 nov. 2020</span>
            </div>
            
            <div class="content-grid-2">
              <div>
                <p class="slide-lead-text">
                  Composé de <strong>12 membres, dont 4 élus municipaux</strong>, le comité est un groupe de réflexion permanent qui a pour mission de faire jaillir des idées novatrices pour améliorer la condition et la cohabitation animale à Laxou.
                </p>
                <div class="clean-callout">
                  <h3>Les projets du Conseil consultatif</h3>
                  <p>À travers les comptes-rendus de réunions, retrouvez les actions concrètes que le comité souhaite mettre en place.</p>
                  <a href="#" class="btn-clean">Télécharger les projets (PDF)</a>
                </div>
              </div>

              <div>
                <h3 class="section-subtitle">Comptes-Rendus & Synthèses</h3>

                <details class="cr-accordion-clean" open>
                  <summary>Synthèses des réunions (2022 - 2025)</summary>
                  <div class="cr-accordion-content">
                    <div class="cr-grid">
                      <a href="#" class="cr-card-clean"><span class="cr-title">Synthèse 2025</span><span class="cr-badge">PDF</span></a>
                      <a href="#" class="cr-card-clean"><span class="cr-title">Synthèse 2024</span><span class="cr-badge">PDF</span></a>
                      <a href="#" class="cr-card-clean"><span class="cr-title">Synthèse 2023</span><span class="cr-badge">PDF</span></a>
                      <a href="#" class="cr-card-clean"><span class="cr-title">Synthèse 2022</span><span class="cr-badge">PDF</span></a>
                    </div>
                  </div>
                </details>

                <details class="cr-accordion-clean">
                  <summary>Comptes-Rendus détaillés (2021)</summary>
                  <div class="cr-accordion-content">
                    <div class="cr-grid">
                      <a href="#" class="cr-card-clean"><span class="cr-title">8 novembre 2021</span><span class="cr-badge">PDF</span></a>
                      <a href="#" class="cr-card-clean"><span class="cr-title">27 septembre 2021</span><span class="cr-badge">PDF</span></a>
                      <a href="#" class="cr-card-clean"><span class="cr-title">6 septembre 2021</span><span class="cr-badge">PDF</span></a>
                      <a href="#" class="cr-card-clean"><span class="cr-title">29 juin 2021</span><span class="cr-badge">PDF</span></a>
                      <a href="#" class="cr-card-clean"><span class="cr-title">31 mai 2021</span><span class="cr-badge">PDF</span></a>
                      <a href="#" class="cr-card-clean"><span class="cr-title">26 avril 2021</span><span class="cr-badge">PDF</span></a>
                      <a href="#" class="cr-card-clean"><span class="cr-title">15 mars 2021</span><span class="cr-badge">PDF</span></a>
                      <a href="#" class="cr-card-clean"><span class="cr-title">15 février 2021</span><span class="cr-badge">PDF</span></a>
                    </div>
                  </div>
                </details>
              </div>
            </div>

          </div>
        </section>

        <!-- PAGE 2 : Fiches Pratiques -->
        <section id="fiches" class="fullbleed-slide-panel">
          <div class="slide-inner-content">
            
            <div class="slide-header">
              <h2 class="slide-main-title">Fiches pratiques & Ouvrages conseillés</h2>
            </div>
            
            <p class="slide-lead-text">
              Parce que le bien-être animal passe aussi par une bonne information, la Ville de Laxou met à votre disposition des guides d'accompagnement au quotidien et une sélection d'ouvrages recommandés.
            </p>

            <div style="margin: 40px 0;">
              <h3 class="section-subtitle">Fiches Pratiques à télécharger</h3>
              <div class="cr-grid">
                <a href="#" class="cr-card-clean"><span class="cr-title">Guide du propriétaire de chien</span><span class="cr-badge">PDF</span></a>
                <a href="#" class="cr-card-clean"><span class="cr-title">Protection et statut des chats libres</span><span class="cr-badge">PDF</span></a>
                <a href="#" class="cr-card-clean"><span class="cr-title">Chaleur et canicule : protéger son animal</span><span class="cr-badge">PDF</span></a>
                <a href="#" class="cr-card-clean"><span class="cr-title">Les gestes de premiers secours</span><span class="cr-badge">PDF</span></a>
              </div>
            </div>

            <h3 class="section-subtitle">Ouvrages & Lectures recommandées</h3>
            <div class="book-grid">
              
              <div class="book-card">
                <div class="book-cover-wrapper">
                  <img src="assets/livre_harmony_portee_de_pattes.jpg" alt="Couverture Harmony à portée de pattes" class="book-cover-img">
                </div>
                <span class="book-badge">Éducation & Conseils</span>
                <h4 class="book-title">Harmony à portée de pattes</h4>
                <p class="book-desc">
                  Facile à lire, il va à l'essentiel : les achats à prévoir, la santé (de la vaccination à la trousse de secours), les apprentissages (de la propreté au rappel), et l'éducation positive. <strong>En prime : 10 activités à réaliser soi-même.</strong>
                </p>
                <div class="book-footer">
                  <span>Par Marine (Comportementaliste)</span>
                  <span style="color:var(--user-accent); font-weight:700;">111 pages</span>
                </div>
              </div>

              <div class="book-card">
                <div class="book-cover-wrapper">
                  <img src="assets/livre_aux_animaux_debreux.jpg" alt="Couverture Aux animaux ma vie de vétérinaire en Lorraine" class="book-cover-img">
                </div>
                <span class="book-badge">Témoignage Lorraine</span>
                <h4 class="book-title">Aux animaux ma vie de vétérinaire</h4>
                <p class="book-desc">
                  La réalité crue de la profession de vétérinaire rural en Lorraine par Albert DEBREUX. Un métier vécu comme une passion, alternant anecdotes amusantes, drames, échecs et réussites. Facile à lire et émouvant.
                </p>
                <div class="book-footer">
                  <span>Éditions Gérard Louis</span>
                  <span style="color:var(--user-accent); font-weight:700;">237 pages</span>
                </div>
              </div>

              <div class="book-card">
                <div class="book-cover-wrapper">
                  <img src="assets/livre_au_nom_de_tous_les_animaux.jpg" alt="Couverture Au nom de tous les animaux" class="book-cover-img">
                </div>
                <span class="book-badge">Droit Animalier</span>
                <h4 class="book-title">Au nom de tous les animaux</h4>
                <p class="book-desc">
                  Magnifique plaidoyer d'Olivia SYMNIACOS, avocate spécialisée en droit animalier. Des histoires bouleversantes qui montrent que la cause animale mérite un engagement total.
                </p>
                <div class="book-footer">
                  <a href="https://animalex-avocats.com" target="_blank" style="color:var(--user-accent); text-decoration:none; font-weight:700;">animalex-avocats.com</a>
                  <span style="color:var(--user-accent); font-weight:700;">199 pages</span>
                </div>
              </div>

            </div>

          </div>
        </section>

        <!-- PAGE 3 : Réalisations -->
        <section id="realisations" class="fullbleed-slide-panel">
          <div class="slide-inner-content">
            
            <div class="slide-header">
              <h2 class="slide-main-title">Réalisations existantes & futures</h2>
            </div>

            <div class="clean-callout" style="margin-bottom:40px;">
              <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px; margin-bottom:15px;">
                <h3 style="margin:0; font-size:1.4rem;">Partenariat Mutuelle Santé</h3>
                <span class="slide-badge">Convention NOVAMUT</span>
              </div>
              <p style="margin-bottom: 20px;">
                Vos animaux font partie intégrante de votre famille. Pour vous aider à faire face aux coûts des soins vétérinaires (accidents, maladies, opérations), la <strong>Ville de Laxou</strong> a signé une convention de partenariat avec <strong>NOVAMUT Courtage</strong>.
              </p>
              <div class="cr-grid">
                <div style="background:#fff; padding:15px; border-radius:8px; border:1px solid #e2e8f0; font-weight:500;"><strong>3 niveaux</strong> de garanties</div>
                <div style="background:#fff; padding:15px; border-radius:8px; border:1px solid #e2e8f0; font-weight:500;"><strong>Tarifs négociés</strong> et maîtrisés</div>
                <div style="background:#fff; padding:15px; border-radius:8px; border:1px solid #e2e8f0; font-weight:500;"><strong>Remboursements</strong> rapides</div>
                <div style="background:#fff; padding:15px; border-radius:8px; border:1px solid #e2e8f0; font-weight:500;">Produit <strong>Made in France</strong></div>
              </div>
            </div>

            <div style="background:#f8fafc; border-radius:14px; padding:35px; border:1px solid #e2e8f0;">
              <h3 style="font-family: var(--font-heading); font-size: 1.5rem; color: var(--user-primary-dark); margin-bottom: 12px;">Projet : Parc Canin à l'Hôtel de Ville</h3>
              <p style="color: #475569; line-height: 1.7; margin-bottom: 25px; font-size:1.05rem;">
                Le comité étudie la création d'une aire canine dédiée dans le parc de l'Hôtel de Ville. Un espace clos permettant aux chiens d'évoluer en toute liberté sans déranger les autres usagers du parc.
              </p>

              <h4 style="font-family: var(--font-heading); font-size: 1.1rem; color: var(--user-primary-dark); margin-bottom: 15px;">Les trois avantages du projet</h4>
              <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap:25px;">
                <div style="background:#fff; padding:20px; border-radius:10px; border:1px solid #e2e8f0;">
                  <h5 style="color:var(--user-accent); font-weight:700; margin-bottom:10px; font-size:1.1rem;">1. Socialisation</h5>
                  <p style="font-size:0.95rem; color:#64748b; margin:0; line-height:1.5;">Espace de jeu indispensable au développement et à l'équilibre comportemental du chien.</p>
                </div>
                <div style="background:#fff; padding:20px; border-radius:10px; border:1px solid #e2e8f0;">
                  <h5 style="color:var(--user-accent); font-weight:700; margin-bottom:10px; font-size:1.1rem;">2. Mixité & Convivialité</h5>
                  <p style="font-size:0.95rem; color:#64748b; margin:0; line-height:1.5;">Lieu de rencontre entre propriétaires de tous âges, contribuant à rompre l'isolement.</p>
                </div>
                <div style="background:#fff; padding:20px; border-radius:10px; border:1px solid #e2e8f0;">
                  <h5 style="color:var(--user-accent); font-weight:700; margin-bottom:10px; font-size:1.1rem;">3. Propreté Urbaine</h5>
                  <p style="font-size:0.95rem; color:#64748b; margin:0; line-height:1.5;">Réduction des déjections sur les trottoirs grâce à la sensibilisation et aux bornes de propreté.</p>
                </div>
              </div>
            </div>

          </div>
        </section>

        <!-- PAGE 4 : Animalaxou -->
        <section id="animalaxou" class="fullbleed-slide-panel">
          <div class="slide-inner-content">
            
            <div class="slide-header">
              <h2 class="slide-main-title">Le Salon Animalaxou</h2>
              <span class="slide-badge">Événement Annuel Plein Air</span>
            </div>

            <p class="slide-lead-text">
              <strong>Depuis 2022, le comité organise chaque année son salon "Animalaxou"</strong>, le plus grand salon de plein air de Lorraine dédié au bien-être animal. Un événement 100% gratuit avec des stands d'information, des démonstrations et des rencontres avec des professionnels.
            </p>

            <h3 class="section-subtitle" style="margin-top:40px;">Historique des Éditions</h3>

            <div class="edition-card" style="border-left-color:#22c55e; background:#f0fdf4;">
              <div class="edition-header">
                <h4 style="margin:0; font-family:var(--font-heading); font-size:1.3rem; color:var(--user-primary-dark);">4ᵉ édition — 2025</h4>
                <span class="edition-badge" style="background:#22c55e;">Dimanche 28 septembre 2025</span>
              </div>
              <p style="color:#475569; line-height:1.6; margin:0; font-size:1.05rem;">
                Rendez-vous pour la 4ᵉ édition ! <em>Animalaxou, c'est l'occasion rêvée de découvrir, apprendre, partager... et surtout d'agir ! Chaque petit geste compte.</em>
              </p>
            </div>

            <div class="edition-card">
              <div class="edition-header">
                <h4 style="margin:0; font-family:var(--font-heading); font-size:1.2rem; color:var(--user-primary-dark);">3ᵉ édition — 2024</h4>
                <span class="edition-badge" style="background:#94a3b8;">Édition Passée</span>
              </div>
              <p style="color:#475569; line-height:1.6; margin:0;">
                <strong>Thème :</strong> <em>"Être soi-même acteur du bien-être animal"</em>. L'humain au cœur de la relation homme-animal.
              </p>
            </div>

            <div class="edition-card">
              <div class="edition-header">
                <h4 style="margin:0; font-family:var(--font-heading); font-size:1.2rem; color:var(--user-primary-dark);">2ᵉ édition — 2023</h4>
                <span class="edition-badge" style="background:#94a3b8;">Édition Passée</span>
              </div>
              <p style="color:#475569; line-height:1.6; margin:0;">
                <strong>Thème :</strong> <em>"La santé par l'animal, la santé pour l'animal"</em>. Thérapies assistées, soins naturels, nutrition et prévention vétérinaire.
              </p>
            </div>

            <div class="edition-card">
              <div class="edition-header">
                <h4 style="margin:0; font-family:var(--font-heading); font-size:1.2rem; color:var(--user-primary-dark);">1ʳᵉ édition — 2022</h4>
                <span class="edition-badge" style="background:#94a3b8;">Lancement</span>
              </div>
              <p style="color:#475569; line-height:1.6; margin:0;">
                Inauguration du salon en plein air avec les associations locales, démonstrations canines et sensibilisation citoyenne.
              </p>
            </div>

          </div>
        </section>

      </div>
    </div>

  </main>

  \${footerHTML}

  <script>
    document.addEventListener("DOMContentLoaded", function() {
      const container = document.getElementById("slidesContainer");
      const tabs = document.querySelectorAll(".nav-link");
      const nextBtn = document.getElementById("nextBtn");
      const prevBtn = document.getElementById("prevBtn");
      const faces = Array.from(document.querySelectorAll('.fullbleed-slide-panel'));

      function goToSlide(index) {
        const slideWidth = container.clientWidth;
        container.scrollTo({ left: index * slideWidth, behavior: 'smooth' });
      }

      tabs.forEach((tab) => {
        tab.addEventListener("click", function(e) {
          e.preventDefault();
          const index = parseInt(this.getAttribute("data-index"));
          goToSlide(index);
        });
      });

      function updateUI() {
        const index = Math.round(container.scrollLeft / container.clientWidth);
        
        // Mettre à jour les onglets
        tabs.forEach(t => t.classList.remove("active"));
        if(tabs[index]) tabs[index].classList.add("active");
        
        // Mettre à jour l'URL sans saut
        if(tabs[index]) {
          const hash = tabs[index].getAttribute("href");
          if (window.location.hash !== hash) {
            history.replaceState(null, null, hash);
          }
        }

        // Mettre à jour les flèches
        if(index === 0) {
          prevBtn.style.opacity = '0.3';
          prevBtn.style.pointerEvents = 'none';
        } else {
          prevBtn.style.opacity = '1';
          prevBtn.style.pointerEvents = 'auto';
        }

        if(index === faces.length - 1) {
          nextBtn.style.opacity = '0.3';
          nextBtn.style.pointerEvents = 'none';
        } else {
          nextBtn.style.opacity = '1';
          nextBtn.style.pointerEvents = 'auto';
        }

        // Effet de parallaxe / flou léger pour ne pas être une "page rigide"
        faces.forEach((face, i) => {
          const fr = face.getBoundingClientRect();
          const center = container.getBoundingClientRect().left + container.clientWidth / 2;
          const faceCenter = fr.left + fr.width / 2;
          const delta = (faceCenter - center) / container.clientWidth;
          const clamped = Math.max(-1, Math.min(1, delta));
          
          const scale = 1 - Math.abs(clamped) * 0.05;
          const opacity = 1 - Math.abs(clamped) * 0.5;
          
          face.style.transform = \`scale(\${scale})\`;
          face.style.opacity = opacity;
        });
      }

      let isScrolling;
      container.addEventListener("scroll", function() {
        window.clearTimeout(isScrolling);
        updateUI(); // Maj instantanée pour animation fluide
        isScrolling = setTimeout(updateUI, 50); 
      }, {passive:true});

      prevBtn.addEventListener('click', () => {
        const currentIndex = Math.round(container.scrollLeft / container.clientWidth);
        goToSlide(Math.max(0, currentIndex - 1));
      });
      nextBtn.addEventListener('click', () => {
        const currentIndex = Math.round(container.scrollLeft / container.clientWidth);
        goToSlide(Math.min(faces.length - 1, currentIndex + 1));
      });

      // Initialisation URL Hash
      if(window.location.hash) {
        setTimeout(() => {
          const targetTab = Array.from(tabs).find(t => t.getAttribute("href") === window.location.hash);
          if (targetTab) {
            goToSlide(parseInt(targetTab.getAttribute("data-index")));
          }
        }, 100);
      }
      
      updateUI();
    });
  </script>
</body>
</html>\`;

fs.writeFileSync(htmlPath, fullHTML, "utf-8");

// CSS UPDATE 
const cssPath = path.join(dir, "styles.css");
let css = fs.readFileSync(cssPath, "utf-8");

// We will append the new clear fullbleed styles
const fullbleedCSS = \`
/* =========================================
   CLEAN FULLBLEED CAROUSEL (NO PRISON, NO ICONS)
   ========================================= */
.minimal-sticky-nav {
  position: sticky;
  top: 0;
  z-index: 100;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  padding: 15px 20px;
  border-bottom: 1px solid #e2e8f0;
}
.nav-link {
  color: #64748b;
  text-decoration: none;
  font-family: var(--font-heading);
  font-weight: 700;
  font-size: 1rem;
  padding: 5px 0;
  border-bottom: 2px solid transparent;
  transition: color 0.2s, border-color 0.2s;
  white-space: nowrap;
}
.nav-link:hover {
  color: var(--user-primary-dark);
}
.nav-link.active {
  color: var(--user-primary-dark);
  border-bottom-color: var(--user-accent);
}

.fullbleed-carousel-wrap {
  width: 100vw;
  margin-left: calc(-50vw + 50%);
  position: relative;
  background: #fdfdfd;
}

.fullbleed-slides-container {
  display: flex;
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  scroll-behavior: smooth;
  -ms-overflow-style: none; 
  scrollbar-width: none; 
}
.fullbleed-slides-container::-webkit-scrollbar {
  display: none;
}

.fullbleed-slide-panel {
  flex: 0 0 100vw;
  scroll-snap-align: start;
  padding: 60px 0 100px; /* Espace vertical généreux */
  will-change: transform, opacity;
  transform-origin: center center;
}

.slide-inner-content {
  max-width: 1000px; /* Largeur de lecture normale */
  margin: 0 auto;
  padding: 0 25px;
}

.slide-header {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 30px;
  border-bottom: 1px solid #e2e8f0;
  padding-bottom: 20px;
}
.slide-main-title {
  font-family: var(--font-heading);
  font-size: 2.2rem;
  color: var(--user-primary-dark);
  margin: 0;
}
.slide-badge {
  background: #f1f5f9;
  color: #64748b;
  font-size: 0.85rem;
  font-weight: 700;
  padding: 6px 14px;
  border-radius: 20px;
  white-space: nowrap;
}
.slide-lead-text {
  font-size: 1.15rem;
  line-height: 1.8;
  color: #334155;
  margin-bottom: 30px;
}
.section-subtitle {
  font-family: var(--font-heading);
  font-size: 1.4rem;
  color: var(--user-primary-dark);
  margin-bottom: 20px;
}

/* CLEAN UI ELEMENTS */
.clean-callout {
  background: #f8fafc;
  padding: 30px;
  border-radius: 12px;
  border-left: 4px solid var(--user-accent);
}
.clean-callout h3 {
  font-family: var(--font-heading);
  font-size: 1.3rem;
  color: var(--user-primary-dark);
  margin-bottom: 10px;
}
.clean-callout p {
  color: #64748b;
  margin-bottom: 20px;
  line-height: 1.6;
}
.btn-clean {
  display: inline-block;
  background: var(--user-accent);
  color: #fff;
  text-decoration: none;
  font-weight: 700;
  padding: 12px 24px;
  border-radius: 8px;
  transition: background 0.2s;
}
.btn-clean:hover {
  background: #5a8f22;
}

/* ACCORDIONS CLEAN */
.cr-accordion-clean {
  margin-bottom: 15px;
  border-bottom: 1px solid #e2e8f0;
}
.cr-accordion-clean summary {
  padding: 20px 0;
  font-family: var(--font-heading);
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--user-primary-dark);
  cursor: pointer;
  list-style: none;
}
.cr-accordion-clean summary::-webkit-details-marker { display: none; }
.cr-accordion-content {
  padding: 0 0 20px 0;
}

/* CARDS CLEAN */
.cr-card-clean {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 15px;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  text-decoration: none;
  transition: border-color 0.2s;
}
.cr-card-clean:hover {
  border-color: var(--user-accent);
}
.cr-title {
  font-weight: 600;
  color: #334155;
}
.cr-badge {
  background: #f1f5f9;
  color: #64748b;
  font-size: 0.75rem;
  font-weight: 700;
  padding: 4px 8px;
  border-radius: 4px;
}

/* CLEAN ARROWS */
.arrow-clean {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  z-index: 10;
  width: 50px;
  height: 50px;
  border-radius: 50%;
  border: 1px solid #e2e8f0;
  background: rgba(255,255,255,0.9);
  backdrop-filter: blur(5px);
  color: var(--user-primary-dark);
  font-size: 28px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s, color 0.2s;
  line-height: 0;
  padding-bottom: 4px; /* Centrage optique */
}
.arrow-clean:hover {
  background: var(--user-primary-dark);
  color: #fff;
}
.arrow-clean.left { left: 2vw; }
.arrow-clean.right { right: 2vw; }

@media (max-width: 900px) {
  .slide-header { flex-direction: column; align-items: flex-start; gap: 10px; }
  .arrow-clean { display: none; } /* Hide arrows on small screens, rely on swipe */
}
\`;

css = css + fullbleedCSS;
fs.writeFileSync(cssPath, css, "utf-8");

console.log("Rewrite complete: Clean UI, no icons, full-bleed 100vw pages.");
