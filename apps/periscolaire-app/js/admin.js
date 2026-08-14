let currentConfig = null;
let currentHistory = [];

const MASTER_ADMIN_PASSWORD = "Laxou2026!";

const DEFAULT_FALLBACK_CONFIG = {
  "anneeScolaireLabel": "2026 – 2027",
  "zoneScolaire": "Zone B",
  "qfBrackets": [
    { "min": 0, "max": 420, "label": "0 – 420" },
    { "min": 421, "max": 649, "label": "421 – 649" },
    { "min": 650, "max": 850, "label": "650 – 850" },
    { "min": 851, "max": 999999, "label": "851 et plus" }
  ],
  "garderie": {
    "rates": [
      { "normal": 0.68, "reduit": 0.68 },
      { "normal": 0.88, "reduit": 0.68 },
      { "normal": 1.12, "reduit": 0.88 },
      { "normal": 1.36, "reduit": 1.12 }
    ],
    "tarifsUniques": { "occasionnel": 2.10, "exterieur": 1.66 },
    "mois": [
      { "key": "2026-09", "label": "Septembre 2026", "matin": 22, "soir": 17 },
      { "key": "2026-10", "label": "Octobre 2026", "matin": 12, "soir": 10 },
      { "key": "2026-11", "label": "Novembre 2026", "matin": 20, "soir": 17 },
      { "key": "2026-12", "label": "Décembre 2026", "matin": 14, "soir": 11 },
      { "key": "2027-01", "label": "Janvier 2027", "matin": 20, "soir": 16 },
      { "key": "2027-02", "label": "Février 2027", "matin": 15, "soir": 12 },
      { "key": "2027-03", "label": "Mars 2027", "matin": 17, "soir": 13 },
      { "key": "2027-04", "label": "Avril 2027", "matin": 12, "soir": 10 },
      { "key": "2027-05", "label": "Mai 2027", "matin": 18, "soir": 14 },
      { "key": "2027-06-07", "label": "Juin – Juillet 2027", "matin": 24, "soir": 19 }
    ]
  },
  "restauration": {
    "rates": [
      { "normal": 1.17, "reduit": 1.17 },
      { "normal": 2.56, "reduit": 1.17 },
      { "normal": 4.43, "reduit": 2.56 },
      { "normal": 5.89, "reduit": 4.43 }
    ],
    "tarifsUniques": { "pai": 3.97, "occasionnel": 7.00, "ext649": 7.00, "ext650": 8.25 },
    "mois": [
      { "key": "2026-09", "label": "Septembre 2026", "repas": 17 },
      { "key": "2026-10", "label": "Octobre 2026", "repas": 10 },
      { "key": "2026-11", "label": "Novembre 2026", "repas": 17 },
      { "key": "2026-12", "label": "Décembre 2026", "repas": 11 },
      { "key": "2027-01", "label": "Janvier 2027", "repas": 16 },
      { "key": "2027-02", "label": "Février 2027", "repas": 12 },
      { "key": "2027-03", "label": "Mars 2027", "repas": 13 },
      { "key": "2027-04", "label": "Avril 2027", "repas": 10 },
      { "key": "2027-05", "label": "Mai 2027", "repas": 14 },
      { "key": "2027-06-07", "label": "Juin – Juillet 2027", "repas": 19 }
    ]
  },
  "schoolCalendar": {
    "periods": {
      "toussaint": { "endOfClasses": "2026-10-17", "resume": "2026-11-02", "label": "Vacances de la Toussaint" },
      "noel": { "endOfClasses": "2026-12-19", "resume": "2027-01-04", "label": "Vacances de Noël" },
      "hiver": { "endOfClasses": "2027-02-20", "resume": "2027-03-08", "label": "Vacances d'hiver" },
      "printemps": { "endOfClasses": "2027-04-17", "resume": "2027-05-03", "label": "Vacances de printemps" },
      "ete": { "endOfClasses": "2027-07-03", "label": "Vacances d'été" }
    },
    "holidayDates": [
      { "date": "2026-11-11", "label": "Armistice 1918" },
      { "date": "2026-12-25", "label": "Noël" },
      { "date": "2027-01-01", "label": "Nouvel An" },
      { "date": "2027-03-29", "label": "Lundi de Pâques (Pâques 2027 = 28 mars)" },
      { "date": "2027-05-01", "label": "Fête du Travail" },
      { "date": "2027-05-06", "label": "Ascension (39 jours après Pâques)" },
      { "date": "2027-05-08", "label": "Victoire 1945" },
      { "date": "2027-05-17", "label": "Lundi de Pentecôte (50 jours après Pâques)" }
    ],
    "months": {
      "2026-09": { "lundi": 4, "mardi": 5, "mercredi": 5, "jeudi": 4, "vendredi": 4 },
      "2026-10": { "lundi": 4, "mardi": 4, "mercredi": 4, "jeudi": 5, "vendredi": 5 },
      "2026-11": { "lundi": 5, "mardi": 4, "mercredi": 4, "jeudi": 4, "vendredi": 4 },
      "2026-12": { "lundi": 4, "mardi": 5, "mercredi": 5, "jeudi": 5, "vendredi": 4 },
      "2027-01": { "lundi": 4, "mardi": 4, "mercredi": 4, "jeudi": 4, "vendredi": 5 },
      "2027-02": { "lundi": 4, "mardi": 4, "mercredi": 4, "jeudi": 4, "vendredi": 4 },
      "2027-03": { "lundi": 5, "mardi": 5, "mercredi": 5, "jeudi": 4, "vendredi": 4 },
      "2027-04": { "lundi": 4, "mardi": 4, "mercredi": 4, "jeudi": 5, "vendredi": 5 },
      "2027-05": { "lundi": 5, "mardi": 4, "mercredi": 4, "jeudi": 4, "vendredi": 4 },
      "2027-06-07": { "lundi": 8, "mardi": 9, "mercredi": 9, "jeudi": 9, "vendredi": 9 }
    }
  }
};

document.addEventListener('DOMContentLoaded', () => {
  checkAuthSession();
  initSidebarNavigation();
});

function checkAuthSession() {
  const token = localStorage.getItem('laxou_admin_token');
  const email = localStorage.getItem('laxou_admin_email');
  const overlay = document.getElementById('authOverlay');

  if (token && email && email.toLowerCase().endsWith('@laxou.fr')) {
    if (overlay) overlay.style.display = 'none';
    document.getElementById('loggedAgentEmail').textContent = email;
    loadConfig();
    loadHistory();
  } else {
    if (overlay) overlay.style.display = 'flex';
  }
}

async function handleLogin() {
  const emailInput = document.getElementById('agentEmail');
  const passwordInput = document.getElementById('agentPassword');
  const errorDiv = document.getElementById('authError');
  const email = emailInput ? emailInput.value.trim() : '';
  const password = passwordInput ? passwordInput.value : '';

  if (errorDiv) errorDiv.style.display = 'none';

  if (!email || !email.toLowerCase().endsWith('@laxou.fr')) {
    showAuthError("Accès refusé : Seules les adresses e-mail se terminant par @laxou.fr sont autorisées.");
    return;
  }

  if (password !== MASTER_ADMIN_PASSWORD) {
    showAuthError("Mot de passe municipal incorrect. Veuillez saisir le mot de passe Mairie.");
    return;
  }

  const token = "laxou_token_" + btoa(email + ":" + Date.now());
  localStorage.setItem('laxou_admin_token', token);
  localStorage.setItem('laxou_admin_email', email);

  const overlay = document.getElementById('authOverlay');
  if (overlay) overlay.style.display = 'none';

  document.getElementById('loggedAgentEmail').textContent = email;
  loadConfig();
  loadHistory();
}

function showAuthError(msg) {
  const errorDiv = document.getElementById('authError');
  if (errorDiv) {
    errorDiv.textContent = msg;
    errorDiv.style.display = 'block';
  }
}

function handleLogout() {
  localStorage.removeItem('laxou_admin_token');
  localStorage.removeItem('laxou_admin_email');
  const overlay = document.getElementById('authOverlay');
  if (overlay) overlay.style.display = 'flex';
  document.getElementById('loggedAgentEmail').textContent = 'non connecté';
}

function initSidebarNavigation() {
  const links = document.querySelectorAll('.sidebar-link');
  links.forEach(link => {
    link.addEventListener('click', () => {
      links.forEach(l => l.classList.remove('active'));
      link.classList.add('active');
    });
  });
}

async function loadConfig() {
  try {
    const res = await fetch('/api/config');
    const config = await res.json();
    currentConfig = (config && config.qfBrackets) ? config : DEFAULT_FALLBACK_CONFIG;
    renderAllConfig(currentConfig);
  } catch (err) {
    console.error('Erreur chargement config, utilisation fallback:', err);
    currentConfig = DEFAULT_FALLBACK_CONFIG;
    renderAllConfig(currentConfig);
  }
}

function renderAllConfig(config) {
  if (config.anneeScolaireLabel) document.getElementById('anneeScolaireLabel').value = config.anneeScolaireLabel;
  if (config.zoneScolaire) document.getElementById('zoneScolaire').value = config.zoneScolaire;

  renderTranches(config);
  renderTarifsUniques(config);
  renderPlafonds(config);
  renderVacances(config);
  renderHolidays(config);
  renderOccurrences(config);
}

function renderTranches(config) {
  const tbody = document.getElementById('tranchesTbody');
  if (!tbody) return;
  tbody.innerHTML = '';

  const qfBrackets = config.qfBrackets || [];
  const gRates = (config.garderie && config.garderie.rates) || [];
  const rRates = (config.restauration && config.restauration.rates) || [];

  if (document.getElementById('statTranchesCount')) {
    document.getElementById('statTranchesCount').textContent = qfBrackets.length;
  }

  qfBrackets.forEach((b, idx) => {
    const gRate = gRates[idx] || { normal: 0, reduit: 0 };
    const rRate = rRates[idx] || { normal: 0, reduit: 0 };

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><span class="badge-tranche">Tranche ${idx + 1}</span></td>
      <td><input type="number" class="table-input" data-tranche="${idx}" data-field="min" value="${b.min}"></td>
      <td><input type="number" class="table-input" data-tranche="${idx}" data-field="max" value="${b.max}"></td>
      <td><input type="number" step="0.05" class="table-input" data-tranche="${idx}" data-field="gNormal" value="${gRate.normal}"></td>
      <td><input type="number" step="0.05" class="table-input" data-tranche="${idx}" data-field="gReduit" value="${gRate.reduit}"></td>
      <td><input type="number" step="0.05" class="table-input" data-tranche="${idx}" data-field="rNormal" value="${rRate.normal}"></td>
      <td><input type="number" step="0.05" class="table-input" data-tranche="${idx}" data-field="rReduit" value="${rRate.reduit}"></td>
      <td><button type="button" onclick="deleteTranche(${idx})" style="color:var(--danger); background:none; border:none; cursor:pointer; font-weight:700;">Supprimer</button></td>
    `;
    tbody.appendChild(tr);
  });

  tbody.querySelectorAll('input').forEach(input => input.addEventListener('change', showSaveBar));
}

function addTranche() {
  if (!currentConfig) return;
  const newIndex = currentConfig.qfBrackets.length;
  const lastBracket = currentConfig.qfBrackets[newIndex - 1] || { max: 1000 };
  const minVal = lastBracket.max + 1;

  currentConfig.qfBrackets.push({ min: minVal, max: 999999, label: `${minVal} et plus` });
  currentConfig.garderie.rates.push({ normal: 1.50, reduit: 1.20 });
  currentConfig.restauration.rates.push({ normal: 6.50, reduit: 5.00 });

  renderTranches(currentConfig);
  showSaveBar();
}

function deleteTranche(idx) {
  if (!currentConfig || currentConfig.qfBrackets.length <= 1) {
    alert("Vous devez conserver au moins 1 tranche de Quotient Familial.");
    return;
  }
  currentConfig.qfBrackets.splice(idx, 1);
  if (currentConfig.garderie.rates[idx]) currentConfig.garderie.rates.splice(idx, 1);
  if (currentConfig.restauration.rates[idx]) currentConfig.restauration.rates.splice(idx, 1);
  renderTranches(currentConfig);
  showSaveBar();
}

function renderTarifsUniques(config) {
  if (config.garderie && config.garderie.tarifsUniques) {
    document.getElementById('tarifGarderieOccasionnel').value = config.garderie.tarifsUniques.occasionnel || 2.10;
    document.getElementById('tarifGarderieExterieur').value = config.garderie.tarifsUniques.exterieur || 1.66;
  }
  if (config.restauration && config.restauration.tarifsUniques) {
    document.getElementById('tarifRestaurationPai').value = config.restauration.tarifsUniques.pai || 3.97;
    document.getElementById('tarifRestaurationOccasionnel').value = config.restauration.tarifsUniques.occasionnel || 7.00;
    document.getElementById('tarifRestaurationExt649').value = config.restauration.tarifsUniques.ext649 || 7.00;
    document.getElementById('tarifRestaurationExt650').value = config.restauration.tarifsUniques.ext650 || 8.25;
  }

  document.querySelectorAll('#uniques input').forEach(input => input.addEventListener('change', showSaveBar));
}

function renderPlafonds(config) {
  const tbody = document.getElementById('plafondsTbody');
  if (!tbody) return;
  tbody.innerHTML = '';

  const gMois = (config.garderie && config.garderie.mois) || [];
  const rMois = (config.restauration && config.restauration.mois) || [];

  gMois.forEach((m, idx) => {
    const rMatch = rMois.find(rm => rm.key === m.key) || { repas: 15 };
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><strong>${m.label}</strong></td>
      <td><input type="number" class="table-input" data-mois-idx="${idx}" data-field="matin" value="${m.matin}"></td>
      <td><input type="number" class="table-input" data-mois-idx="${idx}" data-field="soir" value="${m.soir}"></td>
      <td><input type="number" class="table-input" data-mois-idx="${idx}" data-field="repas" value="${rMatch.repas}"></td>
    `;
    tbody.appendChild(tr);
  });

  tbody.querySelectorAll('input').forEach(input => input.addEventListener('change', showSaveBar));
}

function renderVacances(config) {
  const tbody = document.getElementById('vacancesTbody');
  if (!tbody) return;
  tbody.innerHTML = '';

  const periods = (config.schoolCalendar && config.schoolCalendar.periods) || {};

  Object.keys(periods).forEach((key) => {
    const p = periods[key];
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><strong>${p.label || key}</strong></td>
      <td><input type="date" class="table-input" style="max-width:160px;" data-vac-key="${key}" data-field="endOfClasses" value="${p.endOfClasses || p.start || ''}"></td>
      <td><input type="date" class="table-input" style="max-width:160px;" data-vac-key="${key}" data-field="resume" value="${p.resume || ''}"></td>
    `;
    tbody.appendChild(tr);
  });

  tbody.querySelectorAll('input').forEach(input => input.addEventListener('change', showSaveBar));
}

function renderHolidays(config) {
  const tbody = document.getElementById('holidaysTbody');
  if (!tbody) return;
  tbody.innerHTML = '';

  const holidays = (config.schoolCalendar && config.schoolCalendar.holidayDates) || [];

  holidays.forEach((h, idx) => {
    const hDate = (typeof h === 'object') ? h.date : h;
    const hLabel = (typeof h === 'object') ? (h.label || '') : '';

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><input type="date" class="table-input" style="max-width:160px;" data-holiday-idx="${idx}" data-field="date" value="${hDate}"></td>
      <td><input type="text" class="table-input" style="max-width:100%; font-weight:normal;" data-holiday-idx="${idx}" data-field="label" value="${hLabel}" placeholder="Libellé du jour férié"></td>
      <td><button type="button" onclick="deleteHoliday(${idx})" style="color:var(--danger); background:none; border:none; cursor:pointer; font-weight:700;">Supprimer</button></td>
    `;
    tbody.appendChild(tr);
  });

  tbody.querySelectorAll('input').forEach(input => input.addEventListener('change', showSaveBar));
}

function addHoliday() {
  if (!currentConfig || !currentConfig.schoolCalendar) return;
  if (!currentConfig.schoolCalendar.holidayDates) currentConfig.schoolCalendar.holidayDates = [];
  currentConfig.schoolCalendar.holidayDates.push({ date: "2027-05-20", label: "Jour férié local" });
  renderHolidays(currentConfig);
  showSaveBar();
}

function deleteHoliday(idx) {
  if (!currentConfig || !currentConfig.schoolCalendar || !currentConfig.schoolCalendar.holidayDates) return;
  currentConfig.schoolCalendar.holidayDates.splice(idx, 1);
  renderHolidays(currentConfig);
  showSaveBar();
}

function renderOccurrences(config) {
  const tbody = document.getElementById('occurrencesTbody');
  if (!tbody) return;
  tbody.innerHTML = '';

  const monthsMap = (config.schoolCalendar && config.schoolCalendar.months) || {};
  const gMois = (config.garderie && config.garderie.mois) || [];

  gMois.forEach((m) => {
    const occ = monthsMap[m.key] || { lundi: 4, mardi: 4, mercredi: 4, jeudi: 4, vendredi: 4 };
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><strong>${m.label}</strong></td>
      <td><input type="number" class="table-input" data-occ-key="${m.key}" data-day="lundi" value="${occ.lundi}"></td>
      <td><input type="number" class="table-input" data-occ-key="${m.key}" data-day="mardi" value="${occ.mardi}"></td>
      <td><input type="number" class="table-input" data-occ-key="${m.key}" data-day="mercredi" value="${occ.mercredi}"></td>
      <td><input type="number" class="table-input" data-occ-key="${m.key}" data-day="jeudi" value="${occ.jeudi}"></td>
      <td><input type="number" class="table-input" data-occ-key="${m.key}" data-day="vendredi" value="${occ.vendredi}"></td>
    `;
    tbody.appendChild(tr);
  });

  tbody.querySelectorAll('input').forEach(input => input.addEventListener('change', showSaveBar));
}

function showSaveBar() {
  const saveBar = document.getElementById('saveBar');
  if (saveBar) saveBar.style.display = 'flex';
}

async function loadHistory() {
  try {
    const res = await fetch('/api/history');
    const data = await res.json();
    if (data.success) {
      currentHistory = data.historiqueRecent || [];
      if (data.statistiquesGlobales) {
        document.getElementById('statSimCount').textContent = data.statistiquesGlobales.totalSimulations || currentHistory.length;
        document.getElementById('statQfMoyen').textContent = data.statistiquesGlobales.qfMoyen || 650;
        document.getElementById('statMensuelMoyen').textContent = `${(data.statistiquesGlobales.mensuelMoyenFoyer || 106.00).toFixed(2)} €`;
      }
      renderHistoryRows(currentHistory);
    }
  } catch (err) {
    console.error('Erreur lors du chargement de l\'historique:', err);
  }
}

function renderHistoryRows(historyList) {
  const tbody = document.getElementById('historyTbody');
  if (!tbody) return;
  tbody.innerHTML = '';

  if (!historyList || historyList.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--muted); padding: 18px;">Aucune simulation enregistrée.</td></tr>`;
    return;
  }

  historyList.forEach(sim => {
    const dateFormatted = new Date(sim.date || Date.now()).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' });
    const tr = document.createElement('tr');
    const qfVal = sim.family ? sim.family.qf : (sim.quotientFamilial || 0);
    const nbKids = sim.family ? sim.family.nbEnfants : (sim.nombreEnfants || 1);
    const prenoms = (sim.family && sim.family.prenoms) ? sim.family.prenoms : '';
    const gTotal = sim.synthese ? sim.synthese.totalGarderie : (sim.estimationGarderie || 0);
    const rTotal = sim.synthese ? sim.synthese.totalRestauration : (sim.estimationRestauration || 0);
    const genTotal = sim.synthese ? sim.synthese.totalGeneral : (sim.estimationMensuelle || 0);

    const prenomsDisplay = prenoms 
      ? `<strong style="color:var(--navy);">${prenoms}</strong> <br><span style="font-size:0.78rem; color:var(--muted);">(${nbKids} enfant${nbKids > 1 ? 's' : ''})</span>`
      : `<strong>${nbKids} enfant(s)</strong>`;

    tr.innerHTML = `
      <td>${dateFormatted}</td>
      <td>${prenomsDisplay}</td>
      <td><strong>${qfVal}</strong></td>
      <td>${gTotal.toFixed(2)} €</td>
      <td>${rTotal.toFixed(2)} €</td>
      <td><strong style="color: var(--gold);">${genTotal.toFixed(2)} €</strong></td>
      <td><button type="button" onclick="deleteHistoryEntry('${sim.id}')" style="color:var(--danger); background:none; border:none; cursor:pointer; font-weight:700;">Supprimer</button></td>
    `;
    tbody.appendChild(tr);
  });
}

function filterHistory() {
  const searchVal = document.getElementById('searchHistoryInput').value.toLowerCase().trim();
  if (!searchVal) {
    renderHistoryRows(currentHistory);
    return;
  }

  const filtered = currentHistory.filter(sim => {
    const prenoms = (sim.family && sim.family.prenoms) ? sim.family.prenoms.toLowerCase() : '';
    const qfStr = (sim.family ? sim.family.qf : '').toString();
    const dateStr = new Date(sim.date || Date.now()).toLocaleString('fr-FR').toLowerCase();
    return prenoms.includes(searchVal) || qfStr.includes(searchVal) || dateStr.includes(searchVal);
  });

  renderHistoryRows(filtered);
}

async function deleteHistoryEntry(simId) {
  if (!confirm("Voulez-vous vraiment supprimer cette simulation de l'historique ?")) {
    return;
  }

  try {
    const res = await fetch('/api/history', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'delete', id: simId })
    });
    const data = await res.json();
    if (data.success) {
      currentHistory = currentHistory.filter(sim => sim.id !== simId);
      filterHistory();
    } else {
      alert("Erreur lors de la suppression : " + (data.error || "Erreur inconnue"));
    }
  } catch (err) {
    alert("Erreur réseau lors de la suppression.");
  }
}

function exportToExcel() {
  if (!currentHistory || currentHistory.length === 0) {
    alert("Aucune donnée d'historique à exporter.");
    return;
  }

  let csvContent = "\uFEFF";
  csvContent += "ID;Date & Heure;Prénoms / Nom Foyer;Quotient Familial (€);Nombre Enfants;Estimation Garderie (€);Estimation Cantine (€);Total General (€)\n";

  currentHistory.forEach(sim => {
    const dateFormatted = new Date(sim.date || Date.now()).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' });
    const prenoms = (sim.family && sim.family.prenoms) ? sim.family.prenoms : '';
    const qfVal = sim.family ? sim.family.qf : (sim.quotientFamilial || 0);
    const nbKids = sim.family ? sim.family.nbEnfants : (sim.nombreEnfants || 1);
    const gTotal = sim.synthese ? sim.synthese.totalGarderie : 0;
    const rTotal = sim.synthese ? sim.synthese.totalRestauration : 0;
    const genTotal = sim.synthese ? sim.synthese.totalGeneral : 0;

    csvContent += `"${sim.id || ''}";"${dateFormatted}";"${prenoms}";"${qfVal}";"${nbKids}";"${gTotal.toFixed(2).replace('.', ',')}";"${rTotal.toFixed(2).replace('.', ',')}";"${genTotal.toFixed(2).replace('.', ',')}"\n`;
  });

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const today = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = `historique-simulations-laxou-${today}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function exportConfigJson() {
  if (!currentConfig) return;
  const jsonStr = JSON.stringify(currentConfig, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `baremes-laxou-${(currentConfig.anneeScolaireLabel || '2026-2027').replace(/\s+/g, '')}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

async function saveConfiguration() {
  if (!currentConfig) return;

  const token = localStorage.getItem('laxou_admin_token');
  if (!token) {
    alert("Accès refusé. Veuillez vous connecter.");
    handleLogout();
    return;
  }

  const btnTop = document.getElementById('btnSaveTop');
  if (btnTop) {
    btnTop.disabled = true;
    btnTop.textContent = 'Enregistrement...';
  }

  currentConfig.anneeScolaireLabel = document.getElementById('anneeScolaireLabel').value;
  currentConfig.zoneScolaire = document.getElementById('zoneScolaire').value;

  // Lire Tranches QF
  const trancheRows = document.querySelectorAll('#tranchesTbody tr');
  trancheRows.forEach((tr, idx) => {
    const inputs = tr.querySelectorAll('input');
    if (inputs.length >= 6) {
      if (!currentConfig.qfBrackets[idx]) {
        currentConfig.qfBrackets[idx] = { min: 0, max: 999999, label: '' };
        currentConfig.garderie.rates[idx] = { normal: 0, reduit: 0 };
        currentConfig.restauration.rates[idx] = { normal: 0, reduit: 0 };
      }
      currentConfig.qfBrackets[idx].min = parseFloat(inputs[0].value) || 0;
      currentConfig.qfBrackets[idx].max = parseFloat(inputs[1].value) || 999999;
      currentConfig.qfBrackets[idx].label = `${inputs[0].value} – ${inputs[1].value}`;

      currentConfig.garderie.rates[idx].normal = parseFloat(inputs[2].value) || 0;
      currentConfig.garderie.rates[idx].reduit = parseFloat(inputs[3].value) || 0;

      currentConfig.restauration.rates[idx].normal = parseFloat(inputs[4].value) || 0;
      currentConfig.restauration.rates[idx].reduit = parseFloat(inputs[5].value) || 0;
    }
  });

  // Lire Tarifs Uniques
  if (currentConfig.garderie && currentConfig.garderie.tarifsUniques) {
    currentConfig.garderie.tarifsUniques.occasionnel = parseFloat(document.getElementById('tarifGarderieOccasionnel').value) || 2.10;
    currentConfig.garderie.tarifsUniques.exterieur = parseFloat(document.getElementById('tarifGarderieExterieur').value) || 1.66;
  }
  if (currentConfig.restauration && currentConfig.restauration.tarifsUniques) {
    currentConfig.restauration.tarifsUniques.pai = parseFloat(document.getElementById('tarifRestaurationPai').value) || 3.97;
    currentConfig.restauration.tarifsUniques.occasionnel = parseFloat(document.getElementById('tarifRestaurationOccasionnel').value) || 7.00;
    currentConfig.restauration.tarifsUniques.ext649 = parseFloat(document.getElementById('tarifRestaurationExt649').value) || 7.00;
    currentConfig.restauration.tarifsUniques.ext650 = parseFloat(document.getElementById('tarifRestaurationExt650').value) || 8.25;
  }

  // Lire Plafonds
  const plafondRows = document.querySelectorAll('#plafondsTbody tr');
  plafondRows.forEach((tr, idx) => {
    const inputs = tr.querySelectorAll('input');
    if (currentConfig.garderie && currentConfig.garderie.mois[idx]) {
      currentConfig.garderie.mois[idx].matin = parseInt(inputs[0].value, 10) || 0;
      currentConfig.garderie.mois[idx].soir = parseInt(inputs[1].value, 10) || 0;
    }
    if (currentConfig.restauration && currentConfig.restauration.mois[idx]) {
      currentConfig.restauration.mois[idx].repas = parseInt(inputs[2].value, 10) || 0;
    }
  });

  // Lire Vacances (Periods)
  const vacInputs = document.querySelectorAll('#vacancesTbody input');
  vacInputs.forEach(input => {
    const key = input.getAttribute('data-vac-key');
    const field = input.getAttribute('data-field');
    if (currentConfig.schoolCalendar && currentConfig.schoolCalendar.periods && currentConfig.schoolCalendar.periods[key]) {
      currentConfig.schoolCalendar.periods[key][field] = input.value;
    }
  });

  // Lire Jours Fériés (Holidays)
  const holRows = document.querySelectorAll('#holidaysTbody tr');
  if (currentConfig.schoolCalendar) {
    const updatedHolidays = [];
    holRows.forEach(tr => {
      const inputs = tr.querySelectorAll('input');
      if (inputs.length >= 2) {
        const dVal = inputs[0].value;
        const lVal = inputs[1].value;
        if (dVal) {
          updatedHolidays.push({ date: dVal, label: lVal });
        }
      }
    });
    currentConfig.schoolCalendar.holidayDates = updatedHolidays;
  }

  // Lire Occurrences (Months)
  const occRows = document.querySelectorAll('#occurrencesTbody tr');
  occRows.forEach((tr) => {
    const inputs = tr.querySelectorAll('input');
    if (inputs.length >= 5) {
      const key = inputs[0].getAttribute('data-occ-key');
      if (currentConfig.schoolCalendar && currentConfig.schoolCalendar.months && currentConfig.schoolCalendar.months[key]) {
        currentConfig.schoolCalendar.months[key].lundi = parseInt(inputs[0].value, 10) || 0;
        currentConfig.schoolCalendar.months[key].mardi = parseInt(inputs[1].value, 10) || 0;
        currentConfig.schoolCalendar.months[key].mercredi = parseInt(inputs[2].value, 10) || 0;
        currentConfig.schoolCalendar.months[key].jeudi = parseInt(inputs[3].value, 10) || 0;
        currentConfig.schoolCalendar.months[key].vendredi = parseInt(inputs[4].value, 10) || 0;
      }
    }
  });

  try {
    const res = await fetch('/api/config', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token
      },
      body: JSON.stringify(currentConfig)
    });

    const data = await res.json();
    if (data.success) {
      alert('✅ Toute la grille tarifaire, les plafonds et le calendrier ont été enregistrés avec succès.');
      const saveBar = document.getElementById('saveBar');
      if (saveBar) saveBar.style.display = 'none';
    } else {
      alert('❌ Erreur lors de la sauvegarde : ' + (data.error || 'Erreur inconnue'));
    }
  } catch (err) {
    alert('❌ Erreur réseau lors de la sauvegarde');
  } finally {
    if (btnTop) {
      btnTop.disabled = false;
      btnTop.textContent = 'Enregistrer toute la grille';
    }
  }
}
