const MAX_CHILDREN = 10;

const CONFIG_STATIC = {
  days: [
    { id: "lundi", label: "Lundi" },
    { id: "mardi", label: "Mardi" },
    { id: "mercredi", label: "Mercredi" },
    { id: "jeudi", label: "Jeudi" },
    { id: "vendredi", label: "Vendredi" },
  ],
  slots: {
    preelementaire: [
      { id: "m1", label: "07h30 – 08h05", period: "matin", minutes: 35 },
      { id: "m2", label: "08h05 – 08h40", period: "matin", minutes: 35 },
      { id: "s1", label: "16h35 – 17h00", period: "soir", minutes: 25 },
      { id: "s2", label: "17h00 – 17h30", period: "soir", minutes: 30 },
      { id: "s3", label: "17h30 – 18h00", period: "soir", minutes: 30 },
      { id: "s4", label: "18h00 – 18h30", period: "soir", minutes: 30 },
    ],
    elementaire: [
      { id: "m1", label: "07h30 – 08h05", period: "matin", minutes: 35 },
      { id: "m2", label: "08h05 – 08h40", period: "matin", minutes: 35 },
      { id: "s1", label: "16h35 – 17h00", period: "soir", minutes: 25 },
      { id: "s2", label: "17h00 – 17h30", period: "soir", minutes: 30 },
      { id: "s3", label: "17h30 – 18h00", period: "soir", minutes: 30 },
      { id: "s4", label: "18h00 – 18h30", period: "soir", minutes: 30 },
    ],
  },
  moisGarderie: [
    { key: "2026-09", label: "Septembre 2026", matin: 22, soir: 17 },
    { key: "2026-10", label: "Octobre 2026", matin: 12, soir: 10 },
    { key: "2026-11", label: "Novembre 2026", matin: 20, soir: 17 },
    { key: "2026-12", label: "Décembre 2026", matin: 14, soir: 11 },
    { key: "2027-01", label: "Janvier 2027", matin: 20, soir: 16 },
    { key: "2027-02", label: "Février 2027", matin: 15, soir: 12 },
    { key: "2027-03", label: "Mars 2027", matin: 17, soir: 13 },
    { key: "2027-04", label: "Avril 2027", matin: 12, soir: 10 },
    { key: "2027-05", label: "Mai 2027", matin: 18, soir: 14 },
    { key: "2027-06-07", label: "Juin – Juillet 2027", matin: 24, soir: 19 },
  ],
  moisRestauration: [
    { key: "2026-09", label: "Septembre 2026", repas: 17 },
    { key: "2026-10", label: "Octobre 2026", repas: 10 },
    { key: "2026-11", label: "Novembre 2026", repas: 17 },
    { key: "2026-12", label: "Décembre 2026", repas: 11 },
    { key: "2027-01", label: "Janvier 2027", repas: 16 },
    { key: "2027-02", label: "Février 2027", repas: 12 },
    { key: "2027-03", label: "Mars 2027", repas: 13 },
    { key: "2027-04", label: "Avril 2027", repas: 10 },
    { key: "2027-05", label: "Mai 2027", repas: 14 },
    { key: "2027-06-07", label: "Juin – Juillet 2027", repas: 19 },
  ],
  schoolCalendar: {
    zone: "B",
    schoolYearLabel: "2026 – 2027",
    periods: {
      rentreeEleves: {
        start: "2026-09-01",
        weekday: "mardi",
        label: "Rentrée scolaire des élèves",
      },
      toussaint: {
        endOfClasses: "2026-10-17",
        resume: "2026-11-02",
        label: "Vacances de la Toussaint",
      },
      noel: {
        endOfClasses: "2026-12-19",
        resume: "2027-01-04",
        label: "Vacances de Noël",
      },
      hiver: {
        endOfClasses: "2027-02-20",
        resume: "2027-03-08",
        label: "Vacances d'hiver",
      },
      printemps: {
        endOfClasses: "2027-04-17",
        resume: "2027-05-03",
        label: "Vacances de printemps",
      },
      ete: { endOfClasses: "2027-07-03", label: "Vacances d'été" },
    },
    months: {
      "2026-09": { lundi: 4, mardi: 5, mercredi: 5, jeudi: 4, vendredi: 4 },
      "2026-10": { lundi: 4, mardi: 4, mercredi: 4, jeudi: 5, vendredi: 5 },
      "2026-11": { lundi: 5, mardi: 4, mercredi: 4, jeudi: 4, vendredi: 4 },
      "2026-12": { lundi: 4, mardi: 5, mercredi: 5, jeudi: 5, vendredi: 4 },
      "2027-01": { lundi: 4, mardi: 4, mercredi: 4, jeudi: 4, vendredi: 5 },
      "2027-02": { lundi: 4, mardi: 4, mercredi: 4, jeudi: 4, vendredi: 4 },
      "2027-03": { lundi: 5, mardi: 5, mercredi: 5, jeudi: 4, vendredi: 4 },
      "2027-04": { lundi: 4, mardi: 4, mercredi: 4, jeudi: 5, vendredi: 5 },
      "2027-05": { lundi: 5, mardi: 4, mercredi: 4, jeudi: 4, vendredi: 4 },
      "2027-06-07": { lundi: 8, mardi: 9, mercredi: 9, jeudi: 9, vendredi: 9 },
    },
  },
};

function defaultChild(i) {
  return {
    id: "c" + (i + 1),
    prenom: "",
    niveau: "preelementaire",
    garderie: {
      type: "classique",
      mode: "hebdo",
      routineAlternance: false,
      activeWeek: "A",
      hebdo: {},
      hebdoB: {},
      mensuel: {
        months: CONFIG_STATIC.moisGarderie.reduce((acc, m, mi) => {
          acc[m.key] = { selected: mi === 0, matin: m.matin, soir: m.soir };
          return acc;
        }, {}),
      },
    },
    restauration: {
      type: "classique",
      mode: "hebdo",
      routineAlternance: false,
      activeWeek: "A",
      hebdo: {},
      hebdoB: {},
      mensuel: {
        months: CONFIG_STATIC.moisRestauration.reduce((acc, m, mi) => {
          acc[m.key] = { selected: mi === 0, repas: m.repas };
          return acc;
        }, {}),
      },
    },
  };
}

const state = {
  family: {
    qf: 0,
    resident: true,
    nbEnfants: 1,
    children: Array.from({ length: MAX_CHILDREN }, (_, i) => defaultChild(i)),
  },
  garderie: { enabled: true },
  restauration: { enabled: true },
};

let serverResultCache = null;

function activeChildren() {
  return state.family.children.slice(0, state.family.nbEnfants);
}

function formatEuro(n) {
  return (
    (Math.round((n + Number.EPSILON) * 100) / 100).toLocaleString("fr-FR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }) + " €"
  );
}

function displayName(child, index) {
  return child.prenom && child.prenom.trim()
    ? child.prenom.trim()
    : "Enfant " + (index + 1);
}

function initials(name) {
  return name
    .trim()
    .split(/\s+/)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function slotsForChild(child) {
  return child.niveau === "preelementaire"
    ? CONFIG_STATIC.slots.preelementaire
    : CONFIG_STATIC.slots.elementaire;
}

function isSlotVisible(child, dayId, slot) {
  if (
    child.niveau === "preelementaire" &&
    dayId === "mercredi" &&
    slot.period === "soir"
  )
    return false;
  if (
    child.niveau === "elementaire" &&
    dayId === "mercredi" &&
    slot.id !== "m1"
  )
    return false;
  return true;
}

function weekSelection(moduleState, which) {
  if (which === "B") {
    if (!moduleState.hebdoB) moduleState.hebdoB = {};
    return moduleState.hebdoB;
  }
  return moduleState.hebdo || {};
}

// Appel au moteur Serverless /api/calculate
async function calculateOnServer() {
  try {
    const prenomsList = activeChildren()
      .map((c, i) =>
        c.prenom && c.prenom.trim() ? c.prenom.trim() : "Enfant " + (i + 1),
      )
      .join(" et ");
    state.family.prenoms = prenomsList;

    const res = await fetch("/api/calculate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(state),
    });
    const data = await res.json();
    if (data && data.success) {
      serverResultCache = data;
      renderSyntheseWithServerData(data);
    }
  } catch (err) {
    console.error("Erreur appel /api/calculate:", err);
  }
}

// Rendu des badges famille
function renderFamilyBadges() {
  const el = document.getElementById("familyBadges");
  if (!el) return;
  const qfVal = state.family.qf || 0;
  let qfLabel = "0 – 420";
  if (qfVal >= 851) qfLabel = "851 et plus";
  else if (qfVal >= 650) qfLabel = "650 – 850";
  else if (qfVal >= 421) qfLabel = "421 – 649";

  const isRes = state.family.resident !== false;

  el.innerHTML = `
    <span class="badge"><span class="dot"></span>Résidence : ${isRes ? "Laxou (Habitant)" : "Extérieur"}</span>
    <span class="badge"><span class="dot"></span>QF renseigné : ${qfVal}</span>
    <span class="badge gold"><span class="dot"></span>Tranche QF : ${qfLabel}</span>
    <span class="badge ${isRes ? "green" : ""}"><span class="dot"></span>Tarif réduit : ${isRes ? "Automatique dès le 2e enfant" : "Non applicable"}</span>
    <span class="badge"><span class="dot"></span>${state.family.nbEnfants} enfant${state.family.nbEnfants > 1 ? "s" : ""} inscrit${state.family.nbEnfants > 1 ? "s" : ""}</span>
  `;
}

// Rendu des entrées enfants
function renderChildrenInputs() {
  const container = document.getElementById("childrenContainer");
  if (!container) return;
  container.innerHTML = "";
  activeChildren().forEach((child, i) => {
    const card = document.createElement("div");
    card.className = "card";
    card.style.marginBottom = "16px";
    card.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px;">
        <h3 style="font-size:1.05rem; margin:0;">Élève ${i + 1}</h3>
        <span style="font-size:0.75rem; font-weight:700; color:var(--navy); background:var(--surface-alt); padding:3px 10px; border-radius:999px; border:1px solid var(--border);">Enfant #${i + 1}</span>
      </div>
      <div class="grid-2">
        <div class="field">
          <label for="prenom-${child.id}">Prénom de l'enfant</label>
          <input type="text" id="prenom-${child.id}" value="${child.prenom}" placeholder="Ex. Léa" data-child="${child.id}" data-role="prenom">
        </div>
        <div class="field">
          <label id="niveau-label-${child.id}">Niveau scolaire</label>
          <div class="pill-group" role="radiogroup">
            <input type="radio" name="niveau-${child.id}" id="niv-pre-${child.id}" value="preelementaire" ${child.niveau === "preelementaire" ? "checked" : ""} data-child="${child.id}" data-role="niveau">
            <label for="niv-pre-${child.id}">Maternelle / Préélémentaire</label>
            <input type="radio" name="niveau-${child.id}" id="niv-ele-${child.id}" value="elementaire" ${child.niveau === "elementaire" ? "checked" : ""} data-child="${child.id}" data-role="niveau">
            <label for="niv-ele-${child.id}">Élémentaire (CP à CM2)</label>
          </div>
        </div>
      </div>
    `;
    container.appendChild(card);
  });

  container.querySelectorAll('[data-role="prenom"]').forEach((input) => {
    input.addEventListener("input", (e) => {
      const child = state.family.children.find(
        (c) => c.id === e.target.dataset.child,
      );
      child.prenom = e.target.value;
      syncChildNames();
      calculateOnServer();
    });
  });

  container.querySelectorAll('[data-role="niveau"]').forEach((sel) => {
    sel.addEventListener("change", (e) => {
      const child = state.family.children.find(
        (c) => c.id === e.target.dataset.child,
      );
      child.niveau = e.target.value;
      child.garderie.hebdo = {};
      child.garderie.hebdoB = {};
      renderGarderie();
      renderRestauration();
      calculateOnServer();
    });
  });
}

function syncChildNames() {
  activeChildren().forEach((child, i) => {
    const name = displayName(child, i);
    document.querySelectorAll(`[data-name-for="${child.id}"]`).forEach((el) => {
      el.textContent = name;
    });
    document
      .querySelectorAll(`[data-avatar-for="${child.id}"]`)
      .forEach((el) => {
        el.textContent = initials(name);
      });
  });
}

// Bloc de contrôle de routine réutilisable (Semaine A / Semaine B)
function buildRoutineControls(child, moduleState, nameNs) {
  const alt = !!moduleState.routineAlternance;
  const activeWeek = alt ? (moduleState.activeWeek === "B" ? "B" : "A") : "A";
  return `
    <div class="routine-mode-row" style="margin-top:12px; margin-bottom:12px; display:flex; align-items:center; gap:14px; flex-wrap:wrap;">
      <span class="field-label-inline" style="font-size:0.85rem; font-weight:700; color:var(--navy);">Votre programme alterne une semaine sur 2 ?</span>
      <div class="pill-group" role="radiogroup">
        <input type="radio" name="${nameNs}-${child.id}" id="${nameNs}-single-${child.id}" value="single" ${!alt ? "checked" : ""} data-child="${child.id}" data-module="${nameNs}">
        <label for="${nameNs}-single-${child.id}">Une seule routine</label>
        <input type="radio" name="${nameNs}-${child.id}" id="${nameNs}-alt-${child.id}" value="alternance" ${alt ? "checked" : ""} data-child="${child.id}" data-module="${nameNs}">
        <label for="${nameNs}-alt-${child.id}">Alternance Semaine A / Semaine B</label>
      </div>
    </div>
    ${
      alt
        ? `
    <div class="tabs week-tabs" role="tablist" style="margin-bottom:14px; display:flex; gap:6px; background:var(--surface-alt); padding:4px; border-radius:999px; border:1px solid var(--border); width:fit-content;">
      <button type="button" data-role="week-tab" data-child="${child.id}" data-module="${nameNs}" data-week="A" class="${activeWeek === "A" ? "active" : ""}" style="border:none; padding:6px 14px; border-radius:999px; font-weight:700; font-size:0.8rem; cursor:pointer;">Routine 1 · Semaine A</button>
      <button type="button" data-role="week-tab" data-child="${child.id}" data-module="${nameNs}" data-week="B" class="${activeWeek === "B" ? "active" : ""}" style="border:none; padding:6px 14px; border-radius:999px; font-weight:700; font-size:0.8rem; cursor:pointer;">Routine 2 · Semaine B</button>
    </div>`
        : ""
    }
  `;
}

// --- CALENDRIER SCOLAIRE ET PROJECTION DE ROUTINE (DEPUIS REDESIGN_1.HTML) ---
function getVacationDaysByWeekday(monthKey) {
  const periods = CONFIG_STATIC.schoolCalendar.periods;
  const vacances = [
    { start: periods.toussaint.endOfClasses, end: periods.toussaint.resume },
    { start: periods.noel.endOfClasses, end: periods.noel.resume },
    { start: periods.hiver.endOfClasses, end: periods.hiver.resume },
    { start: periods.printemps.endOfClasses, end: periods.printemps.resume },
    { start: periods.ete.endOfClasses, end: "2027-08-31" },
  ];

  const parts = monthKey.split("-");
  let year,
    months = [];
  if (parts.length === 2) {
    year = parseInt(parts[0]);
    months = [parseInt(parts[1]) - 1];
  } else if (parts.length === 3) {
    year = parseInt(parts[0]);
    months = [parseInt(parts[1]) - 1, parseInt(parts[2]) - 1];
  } else {
    return { lundi: 0, mardi: 0, mercredi: 0, jeudi: 0, vendredi: 0 };
  }

  const counts = { lundi: 0, mardi: 0, mercredi: 0, jeudi: 0, vendredi: 0 };
  months.forEach((m) => {
    const daysInMonth = new Date(year, m + 1, 0).getDate();
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(m + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      const d = new Date(dateStr + "T00:00:00");
      let inVacation = false;
      for (let v of vacances) {
        const start = new Date(v.start + "T00:00:00");
        const end = new Date(v.end + "T00:00:00");
        if (d > start && d < end) {
          inVacation = true;
          break;
        }
      }
      if (inVacation) {
        const weekday = d.getDay();
        const weekdays = [
          "dimanche",
          "lundi",
          "mardi",
          "mercredi",
          "jeudi",
          "vendredi",
          "samedi",
        ];
        const dayName = weekdays[weekday];
        if (dayName in counts) counts[dayName] += 1;
      }
    }
  });
  return counts;
}

function getHolidaysByWeekday(monthKey) {
  const holidayDates = [
    "2026-11-11",
    "2026-12-25",
    "2027-01-01",
    "2027-03-29",
    "2027-05-01",
    "2027-05-06",
    "2027-05-08",
    "2027-05-17",
  ];
  const parts = monthKey.split("-");
  let year,
    months = [];
  if (parts.length === 2) {
    year = parseInt(parts[0]);
    months = [parseInt(parts[1]) - 1];
  } else if (parts.length === 3) {
    year = parseInt(parts[0]);
    months = [parseInt(parts[1]) - 1, parseInt(parts[2]) - 1];
  } else {
    return { lundi: 0, mardi: 0, mercredi: 0, jeudi: 0, vendredi: 0 };
  }

  const counts = { lundi: 0, mardi: 0, mercredi: 0, jeudi: 0, vendredi: 0 };
  months.forEach((m) => {
    holidayDates.forEach((dateStr) => {
      const d = new Date(dateStr + "T00:00:00");
      if (d.getFullYear() === year && d.getMonth() === m) {
        const weekday = d.getDay();
        const weekdays = [
          "dimanche",
          "lundi",
          "mardi",
          "mercredi",
          "jeudi",
          "vendredi",
          "samedi",
        ];
        const dayName = weekdays[weekday];
        if (dayName in counts) counts[dayName] += 1;
      }
    });
  });
  return counts;
}

function getCorrectedOccurrences(monthKey) {
  const raw = CONFIG_STATIC.schoolCalendar.months[monthKey] || {
    lundi: 0,
    mardi: 0,
    mercredi: 0,
    jeudi: 0,
    vendredi: 0,
  };
  const vacation = getVacationDaysByWeekday(monthKey);
  const holidays = getHolidaysByWeekday(monthKey);
  const corrected = {};
  ["lundi", "mardi", "mercredi", "jeudi", "vendredi"].forEach((day) => {
    corrected[day] = Math.max(
      0,
      (raw[day] || 0) - (vacation[day] || 0) - (holidays[day] || 0),
    );
  });
  return corrected;
}

function garderieWeekCounts(child, which) {
  const slots = slotsForChild(child);
  const matinIds = slots.filter((s) => s.period === "matin").map((s) => s.id);
  const soirIds = slots.filter((s) => s.period === "soir").map((s) => s.id);
  const sel = weekSelection(child.garderie, which);
  const counts = {};
  CONFIG_STATIC.days.forEach((day) => {
    const daySel = sel[day.id] || {};
    counts[day.id] = {
      matin: matinIds.filter((id) => daySel[id]).length,
      soir: soirIds.filter((id) => daySel[id]).length,
    };
  });
  return counts;
}

function garderieRoutineMonthlyProjection(child) {
  const countsA = garderieWeekCounts(child, "A");
  const countsB = child.garderie.routineAlternance
    ? garderieWeekCounts(child, "B")
    : null;
  return CONFIG_STATIC.moisGarderie.map((m) => {
    const occ = getCorrectedOccurrences(m.key);
    let matins = 0,
      soirs = 0;
    CONFIG_STATIC.days.forEach((day) => {
      const n = occ[day.id] || 0;
      if (!n) return;
      if (countsB) {
        matins += (countsA[day.id].matin * n) / 2;
        matins += (countsB[day.id].matin * n) / 2;
        soirs += (countsA[day.id].soir * n) / 2;
        soirs += (countsB[day.id].soir * n) / 2;
      } else {
        matins += countsA[day.id].matin * n;
        soirs += countsA[day.id].soir * n;
      }
    });
    return {
      key: m.key,
      label: m.label,
      matins: Math.round(matins),
      soirs: Math.round(soirs),
      plafondMatin: m.matin,
      plafondSoir: m.soir,
    };
  });
}

function unitsForSlotUI(slot) {
  return Math.max(1, Math.ceil(slot.minutes / 30));
}

function garderieWeekBillableUnits(child, which) {
  const slots = slotsForChild(child);
  const sel = weekSelection(child.garderie, which);
  const unitsPerDay = {};
  CONFIG_STATIC.days.forEach((day) => {
    let units = 0;
    const daySel = sel[day.id] || {};
    slots.forEach((slot) => {
      if (!isSlotVisible(child, day.id, slot)) return;
      if (daySel[slot.id]) {
        const billable = isSlotFreeUI(
          child,
          day.id,
          slot.id,
          which,
          state.family,
        )
          ? 0
          : unitsForSlotUI(slot);
        units += billable;
      }
    });
    unitsPerDay[day.id] = units;
  });
  return unitsPerDay;
}

function garderieRoutineMonthlyBillableUnitsProjection(child) {
  const unitsA = garderieWeekBillableUnits(child, "A");
  const unitsB = child.garderie.routineAlternance
    ? garderieWeekBillableUnits(child, "B")
    : null;
  return CONFIG_STATIC.moisGarderie.map((m) => {
    const occ = getCorrectedOccurrences(m.key);
    let units = 0;
    CONFIG_STATIC.days.forEach((day) => {
      const n = occ[day.id] || 0;
      if (!n) return;
      if (unitsB) {
        units += (unitsA[day.id] * n) / 2;
        units += (unitsB[day.id] * n) / 2;
      } else {
        units += unitsA[day.id] * n;
      }
    });
    return { key: m.key, label: m.label, units: Math.round(units) };
  });
}

function restaurationRoutineMonthlyProjection(child) {
  const selA = weekSelection(child.restauration, "A");
  const selB = child.restauration.routineAlternance
    ? weekSelection(child.restauration, "B")
    : null;
  return CONFIG_STATIC.moisRestauration.map((m) => {
    const occ = getCorrectedOccurrences(m.key);
    let repas = 0;
    CONFIG_STATIC.days
      .filter((d) => d.id !== "mercredi")
      .forEach((day) => {
        const n = occ[day.id] || 0;
        if (!n) return;
        if (selB) {
          if (selA[day.id]) repas += n / 2;
          if (selB[day.id]) repas += n / 2;
        } else if (selA[day.id]) {
          repas += n;
        }
      });
    return {
      key: m.key,
      label: m.label,
      repas: Math.round(repas),
      plafondRepas: m.repas,
    };
  });
}

function getFallbackGarderieRate(child) {
  const g = child.garderie || {};
  if (state.family.resident === false || g.type === "exterieur") return 1.66;
  if (g.type === "occasionnel") return 2.1;
  const ratesNormal = [0.68, 0.88, 1.12, 1.36];
  const ratesReduit = [0.68, 0.68, 0.88, 1.12];
  const q = state.family.qf || 0;
  let idx = 0;
  if (q >= 851) idx = 3;
  else if (q >= 650) idx = 2;
  else if (q >= 421) idx = 1;
  const childIndex = activeChildren().findIndex((c) => c.id === child.id);
  const isReduit = childIndex >= 1;
  return isReduit ? ratesReduit[idx] : ratesNormal[idx];
}

function getFallbackRestaurationRate(child) {
  const r = child.restauration || {};
  if (state.family.resident === false) {
    const q = state.family.qf || 0;
    return q >= 650 ? 8.25 : 7.0;
  }
  if (r.type === "pai") return 3.97;
  if (r.type === "occasionnel") return 7.0;
  if (r.type === "ext649") return 7.0;
  if (r.type === "ext650") return 8.25;
  const ratesNormal = [1.17, 2.56, 4.43, 5.89];
  const ratesReduit = [1.17, 1.17, 2.56, 4.43];
  const q = state.family.qf || 0;
  let idx = 0;
  if (q >= 851) idx = 3;
  else if (q >= 650) idx = 2;
  else if (q >= 421) idx = 1;
  const childIndex = activeChildren().findIndex((c) => c.id === child.id);
  const isReduit = childIndex >= 1;
  return isReduit ? ratesReduit[idx] : ratesNormal[idx];
}

function buildGarderieRoutineProjectionUI(child) {
  const resChild =
    serverResultCache && serverResultCache.detailEnfants
      ? serverResultCache.detailEnfants.find((c) => c.id === child.id)
      : null;
  const rate =
    resChild && resChild.garderie
      ? resChild.garderie.tarifUnitaire
      : getFallbackGarderieRate(child);
  const quantities = garderieRoutineMonthlyProjection(child);
  const billableUnits = garderieRoutineMonthlyBillableUnitsProjection(child);

  const body = quantities
    .map((q, idx) => {
      const units = billableUnits[idx] ? billableUnits[idx].units : 0;
      const cost = units * rate;

      const matinOk = q.matins <= q.plafondMatin;
      const soirOk = q.soirs <= q.plafondSoir;
      const matinCls = matinOk ? "ok" : "over";
      const soirCls = soirOk ? "ok" : "over";

      return `
      <tr>
        <td>${q.label}</td>
        <td><span class="${matinCls}">${q.matins}</span> <span class="muted-inline">/ ${q.plafondMatin}</span></td>
        <td><span class="${soirCls}">${q.soirs}</span> <span class="muted-inline">/ ${q.plafondSoir}</span></td>
        <td class="cost-cell">${formatEuro(cost)}</td>
      </tr>`;
    })
    .join("");

  return `
    <details class="routine-projection" style="margin-top:14px;">
      <summary>Vos semaines sont programmées — voir la projection sur l'année scolaire 2026 – 2027</summary>
      <p class="desc" style="margin-top:10px;">Estimation indicative du nombre de garderies du matins / soirs générés par votre routine chaque mois, à partir du calendrier scolaire (zone B). Cette projection n'affecte pas le mode Mensuel et ne remplace pas son moteur de calcul.</p>
      <div class="table-wrap">
        <table class="plafond-table">
          <thead><tr><th scope="col">Mois</th><th scope="col">Matins</th><th scope="col">Soirs</th><th scope="col">Coût estimé</th></tr></thead>
          <tbody>${body}</tbody>
        </table>
      </div>
    </details>
  `;
}

function buildRestaurationRoutineProjectionUI(child) {
  const resChild =
    serverResultCache && serverResultCache.detailEnfants
      ? serverResultCache.detailEnfants.find((c) => c.id === child.id)
      : null;
  const rate =
    resChild && resChild.restauration
      ? resChild.restauration.tarifUnitaire
      : getFallbackRestaurationRate(child);
  const projection = restaurationRoutineMonthlyProjection(child);

  const body = projection
    .map((r) => {
      const cost = r.repas * rate;
      const ok = r.repas <= r.plafondRepas;
      const cls = ok ? "ok" : "over";

      return `
      <tr>
        <td>${r.label}</td>
        <td><span class="${cls}">${r.repas}</span> <span class="muted-inline">/ ${r.plafondRepas}</span></td>
        <td class="cost-cell">${formatEuro(cost)}</td>
      </tr>`;
    })
    .join("");

  return `
    <details class="routine-projection" style="margin-top:14px;">
      <summary>Vos semaines sont programmées — voir la projection sur l'année scolaire 2026 – 2027</summary>
      <p class="desc" style="margin-top:10px;">Estimation indicative du nombre de repas générés par votre routine chaque mois, à partir du calendrier scolaire (zone B). Cette projection n'affecte pas le mode Mensuel et ne remplace pas son moteur de calcul.</p>
      <div class="table-wrap">
        <table class="plafond-table">
          <thead><tr><th scope="col">Mois</th><th scope="col">Repas</th><th scope="col">Coût estimé</th></tr></thead>
          <tbody>${body}</tbody>
        </table>
      </div>
    </details>
  `;
}

function fratrieEligibleFamilyUI(family) {
  const kids = family.children
    ? family.children.filter((c) => c && c.niveau)
    : [];
  if (kids.length < 2) return false;
  const hasPre = kids.some(
    (c) =>
      c.niveau === "preelementaire" &&
      (!c.garderie || !c.garderie.type || c.garderie.type === "classique"),
  );
  const hasEle = kids.some(
    (c) =>
      c.niveau === "elementaire" &&
      (!c.garderie || !c.garderie.type || c.garderie.type === "classique"),
  );
  return hasPre && hasEle;
}

function fratrieSiblingCheckedUI(
  child,
  dayId,
  which,
  slotId,
  excludeSlotId,
  family,
) {
  if (!fratrieEligibleFamilyUI(family)) return false;
  const otherNiveau =
    child.niveau === "preelementaire" ? "elementaire" : "preelementaire";
  const kids = family.children || [];
  return kids.some((sib) => {
    if (sib.id === child.id) return false;
    if (sib.niveau !== otherNiveau) return false;
    if (sib.garderie && sib.garderie.type && sib.garderie.type !== "classique")
      return false;
    const sibSel = weekSelection(sib.garderie || {}, which);
    const sibDay = sibSel[dayId] || {};
    if (!sibDay[slotId]) return false;
    if (excludeSlotId && sibDay[excludeSlotId]) return false;
    return true;
  });
}

function fratrieEveningGroupPresentUI(dayId, which, family) {
  if (!fratrieEligibleFamilyUI(family)) return false;
  let hasPreOnS1 = false;
  let hasEleOnS1 = false;
  const kids = family.children || [];
  kids.forEach((c) => {
    if (c.garderie && c.garderie.type && c.garderie.type !== "classique")
      return;
    const sel = weekSelection(c.garderie || {}, which);
    const daySel = sel[dayId] || {};
    if (!daySel.s1) return;
    if (c.niveau === "preelementaire") hasPreOnS1 = true;
    if (c.niveau === "elementaire") hasEleOnS1 = true;
  });
  return hasPreOnS1 && hasEleOnS1;
}

function isSlotFreeUI(child, dayId, slotId, which, family) {
  if (
    child.garderie &&
    child.garderie.type &&
    child.garderie.type !== "classique"
  )
    return false;
  const sel = weekSelection(child.garderie || {}, which);
  const daySel = sel[dayId] || {};
  const weekLabel = which === "B" ? "B" : "A";
  if (
    slotId === "m2" &&
    daySel.m2 &&
    !daySel.m1 &&
    fratrieSiblingCheckedUI(child, dayId, weekLabel, "m2", "m1", family)
  )
    return true;
  if (
    slotId === "s1" &&
    daySel.s1 &&
    fratrieEveningGroupPresentUI(dayId, weekLabel, family)
  )
    return true;
  return false;
}

// Rendu des tableaux Garderie
function buildSlotsTable(child, which) {
  const slots = slotsForChild(child);
  const visibleDays =
    child.niveau === "preelementaire"
      ? CONFIG_STATIC.days.filter((d) => d.id !== "mercredi")
      : CONFIG_STATIC.days;
  const sel = weekSelection(child.garderie, which);
  const weekTag = which === "B" ? "B" : "A";
  const rows = slots
    .map((slot) => {
      const cells = visibleDays
        .map((day) => {
          if (!isSlotVisible(child, day.id, slot)) {
            return `<td><span class="slot-tag na">Pas de garderie</span></td>`;
          }
          const checked = !!(sel[day.id] && sel[day.id][slot.id]);
          const free =
            checked &&
            isSlotFreeUI(child, day.id, slot.id, which, state.family);
          return `<td>
        <div class="slot-check">
          <input type="checkbox" class="chk" ${checked ? "checked" : ""}
            data-child="${child.id}" data-day="${day.id}" data-slot="${slot.id}" data-week="${weekTag}" data-role="slot-check"
            aria-label="${slot.label} le ${day.label}${weekTag === "B" ? " (Semaine B)" : ""}">
          ${free ? `<span class="slot-tag free" style="margin-top:2px;">Gratuit</span>` : ""}
        </div>
      </td>`;
        })
        .join("");
      return `<tr><td>${slot.label}<br><span style="color:var(--muted-light); font-weight:500; font-size:.72rem;">${slot.period === "matin" ? "Matin" : "Soir"}</span></td>${cells}</tr>`;
    })
    .join("");

  return `
    <div class="table-wrap">
      <table class="slots-table">
        <thead><tr><th scope="col">Créneau</th>${visibleDays.map((d) => `<th scope="col">${d.label}</th>`).join("")}</tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  `;
}

function buildGarderieMonthlyPanel(child) {
  const rows = CONFIG_STATIC.moisGarderie
    .map((m) => {
      const entry = (child.garderie.mensuel &&
        child.garderie.mensuel.months &&
        child.garderie.mensuel.months[m.key]) || {
        selected: false,
        matin: m.matin,
        soir: m.soir,
      };
      return `
      <div class="mois-row ${entry.selected ? "" : "is-off"}" style="display:flex; align-items:center; justify-content:space-between; padding:10px 14px; border-bottom:1px solid var(--border); gap:12px;">
        <label class="mois-check" style="display:flex; align-items:center; gap:8px; font-weight:600; cursor:pointer;">
          <input type="checkbox" class="chk" data-role="mois-check-g" data-child="${child.id}" data-mois="${m.key}" ${entry.selected ? "checked" : ""} aria-label="Inclure ${m.label}">
          <span class="mois-label">${m.label}</span>
        </label>
        <div class="mois-fields" style="display:flex; gap:12px;">
          <div class="field" style="margin:0;">
            <label style="font-size:0.75rem;">Matins (max ${m.matin})</label>
            <input type="number" min="0" max="${m.matin}" value="${entry.matin}" data-role="matin-garderie" data-child="${child.id}" data-mois="${m.key}" ${entry.selected ? "" : "disabled"} style="width:70px; padding:4px 8px;">
          </div>
          <div class="field" style="margin:0;">
            <label style="font-size:0.75rem;">Soirs (max ${m.soir})</label>
            <input type="number" min="0" max="${m.soir}" value="${entry.soir}" data-role="soir-garderie" data-child="${child.id}" data-mois="${m.key}" ${entry.selected ? "" : "disabled"} style="width:70px; padding:4px 8px;">
          </div>
        </div>
      </div>`;
    })
    .join("");
  return `
    <div class="mois-select-actions" style="margin-bottom:10px; display:flex; gap:8px;">
      <button type="button" data-role="mois-g-all" data-child="${child.id}" style="padding:4px 10px; font-size:0.78rem; border-radius:6px; border:1px solid var(--border); background:var(--surface);">Tout sélectionner</button>
      <button type="button" data-role="mois-g-none" data-child="${child.id}" style="padding:4px 10px; font-size:0.78rem; border-radius:6px; border:1px solid var(--border); background:var(--surface);">Tout désélectionner</button>
    </div>
    ${rows}
  `;
}

function renderGarderieChildCard(child, index) {
  const card = document.createElement("div");
  card.className = "card child-card";
  card.dataset.headingFor = child.id;

  const resChild =
    serverResultCache && serverResultCache.detailEnfants
      ? serverResultCache.detailEnfants.find((c) => c.id === child.id)
      : null;
  const subtotal = resChild ? resChild.garderie.total : 0;
  const rateLabel = resChild
    ? `${resChild.garderie.tarifUnitaire.toFixed(2)} € / 30 min`
    : "Calcul serveur...";
  const activeWeek = child.garderie.routineAlternance
    ? child.garderie.activeWeek === "B"
      ? "B"
      : "A"
    : "A";

  card.innerHTML = `
    <div class="child-card-head">
      <div>
        <h3 data-name-for="${child.id}">${displayName(child, index)}</h3>
        <p class="card-sub" style="margin-bottom:0;">Garderie périscolaire</p>
      </div>
      <span class="level-chip">${child.niveau === "preelementaire" ? "Préélémentaire" : "Élémentaire"}</span>
    </div>

    ${
      state.family.resident !== false
        ? `
    <div class="field">
      <label id="type-label-${child.id}">Type de tarification garderie</label>
      <div class="pill-group" role="radiogroup">
        <input type="radio" name="gtype-${child.id}" id="gtype-classique-${child.id}" value="classique" ${child.garderie.type === "classique" ? "checked" : ""}>
        <label for="gtype-classique-${child.id}">Classique (QF)</label>
        <input type="radio" name="gtype-${child.id}" id="gtype-occasionnel-${child.id}" value="occasionnel" ${child.garderie.type === "occasionnel" ? "checked" : ""}>
        <label for="gtype-occasionnel-${child.id}">Occasionnelle</label>
      </div>
    </div>
    `
        : ""
    }

    <div class="badge-row">
      <span class="badge gold"><span class="dot"></span>Tarif calculé : ${rateLabel}</span>
    </div>

    <div class="tabs mode-tabs" role="tablist" style="margin-top:18px;">
      <button type="button" data-mode="hebdo" class="${child.garderie.mode === "hebdo" ? "active" : ""}">Routine</button>
      <button type="button" data-mode="mensuel" class="${child.garderie.mode === "mensuel" ? "active" : ""}">Mensuel</button>
    </div>

    <div data-panel="hebdo" ${child.garderie.mode !== "hebdo" ? "hidden" : ""}>
      ${buildRoutineControls(child, child.garderie, "groutine-g")}
      <div data-role="routine-table-g">${buildSlotsTable(child, activeWeek)}</div>
      ${buildGarderieRoutineProjectionUI(child)}
    </div>

    <div data-panel="mensuel" ${child.garderie.mode !== "mensuel" ? "hidden" : ""}>
      ${buildGarderieMonthlyPanel(child)}
    </div>

    <div class="subtotal-line">
      <span>Sous-total garderie — ${displayName(child, index)}</span>
      <span class="amount" data-role="garderie-subtotal">${formatEuro(subtotal)}</span>
    </div>
  `;

  // Attach events for garderie
  card.querySelectorAll(`input[name="gtype-${child.id}"]`).forEach((r) => {
    r.addEventListener("change", (e) => {
      child.garderie.type = e.target.value;
      calculateOnServer();
    });
  });

  card.querySelectorAll(".mode-tabs button").forEach((btn) => {
    btn.addEventListener("click", () => {
      child.garderie.mode = btn.dataset.mode;
      renderGarderie();
      calculateOnServer();
    });
  });

  card.querySelectorAll(`input[name="groutine-g-${child.id}"]`).forEach((r) => {
    r.addEventListener("change", (e) => {
      child.garderie.routineAlternance = e.target.value === "alternance";
      renderGarderie();
      calculateOnServer();
    });
  });

  card
    .querySelectorAll('[data-role="week-tab"][data-module="groutine-g"]')
    .forEach((btn) => {
      btn.addEventListener("click", () => {
        child.garderie.activeWeek = btn.dataset.week;
        renderGarderie();
      });
    });

  card.querySelectorAll('[data-role="slot-check"]').forEach((chk) => {
    chk.addEventListener("change", (e) => {
      const day = e.target.dataset.day;
      const slot = e.target.dataset.slot;
      const weekTag = e.target.dataset.week;
      const sel = weekSelection(child.garderie, weekTag);
      if (!sel[day]) sel[day] = {};
      sel[day][slot] = e.target.checked;
      renderGarderie();
      calculateOnServer();
    });
  });

  card.querySelectorAll('[data-role="mois-check-g"]').forEach((chk) => {
    chk.addEventListener("change", (e) => {
      const key = e.target.dataset.mois;
      if (!child.garderie.mensuel.months[key]) {
        const m = CONFIG_STATIC.moisGarderie.find((x) => x.key === key);
        child.garderie.mensuel.months[key] = {
          selected: false,
          matin: m.matin,
          soir: m.soir,
        };
      }
      child.garderie.mensuel.months[key].selected = e.target.checked;
      renderGarderie();
      calculateOnServer();
    });
  });

  card.querySelectorAll('[data-role="matin-garderie"]').forEach((inp) => {
    inp.addEventListener("input", (e) => {
      const key = e.target.dataset.mois;
      const m = CONFIG_STATIC.moisGarderie.find((x) => x.key === key);
      const v = Math.max(
        0,
        Math.min(parseInt(e.target.value || "0", 10), m.matin),
      );
      if (!child.garderie.mensuel.months[key])
        child.garderie.mensuel.months[key] = {
          selected: true,
          matin: m.matin,
          soir: m.soir,
        };
      child.garderie.mensuel.months[key].matin = v;
      calculateOnServer();
    });
  });

  card.querySelectorAll('[data-role="soir-garderie"]').forEach((inp) => {
    inp.addEventListener("input", (e) => {
      const key = e.target.dataset.mois;
      const m = CONFIG_STATIC.moisGarderie.find((x) => x.key === key);
      const v = Math.max(
        0,
        Math.min(parseInt(e.target.value || "0", 10), m.soir),
      );
      if (!child.garderie.mensuel.months[key])
        child.garderie.mensuel.months[key] = {
          selected: true,
          matin: m.matin,
          soir: m.soir,
        };
      child.garderie.mensuel.months[key].soir = v;
      calculateOnServer();
    });
  });

  const btnAllG = card.querySelector('[data-role="mois-g-all"]');
  if (btnAllG) {
    btnAllG.addEventListener("click", () => {
      CONFIG_STATIC.moisGarderie.forEach((m) => {
        if (!child.garderie.mensuel.months[m.key])
          child.garderie.mensuel.months[m.key] = {
            selected: true,
            matin: m.matin,
            soir: m.soir,
          };
        child.garderie.mensuel.months[m.key].selected = true;
      });
      renderGarderie();
      calculateOnServer();
    });
  }

  const btnNoneG = card.querySelector('[data-role="mois-g-none"]');
  if (btnNoneG) {
    btnNoneG.addEventListener("click", () => {
      CONFIG_STATIC.moisGarderie.forEach((m) => {
        if (!child.garderie.mensuel.months[m.key])
          child.garderie.mensuel.months[m.key] = {
            selected: false,
            matin: m.matin,
            soir: m.soir,
          };
        child.garderie.mensuel.months[m.key].selected = false;
      });
      renderGarderie();
      calculateOnServer();
    });
  }

  return card;
}

function renderGarderie() {
  const container = document.getElementById("garderieChildren");
  if (!container) return;
  container.innerHTML = "";
  if (!state.garderie.enabled) {
    container.innerHTML = `<div class="card" style="text-align:center; padding:32px; color:var(--muted);">Le module Garderie est désactivé.</div>`;
    return;
  }
  activeChildren().forEach((child, i) => {
    container.appendChild(renderGarderieChildCard(child, i));
  });
}

// RESTAURATION
function buildRestaurationWeekRow(child, which) {
  const sel = weekSelection(child.restauration, which);
  const weekTag = which === "B" ? "B" : "A";
  const cells = CONFIG_STATIC.days
    .map((day) => {
      const checked = !!sel[day.id];
      return `<td>
      <div class="slot-check">
        <input type="checkbox" class="chk" ${checked ? "checked" : ""}
          data-child="${child.id}" data-day="${day.id}" data-week="${weekTag}" data-role="restau-check"
          aria-label="Repas du ${day.label}${weekTag === "B" ? " (Semaine B)" : ""}">
      </div>
    </td>`;
    })
    .join("");

  return `
    <div class="table-wrap">
      <table class="slots-table">
        <thead><tr><th scope="col">Prestation</th>${CONFIG_STATIC.days.map((d) => `<th scope="col">${d.label}</th>`).join("")}</tr></thead>
        <tbody>
          <tr class="day-restau-row">
            <td>Repas midi (Cantine)</td>
            ${cells}
          </tr>
        </tbody>
      </table>
    </div>
  `;
}

function buildRestaurationMonthlyPanel(child) {
  const rows = CONFIG_STATIC.moisRestauration
    .map((m) => {
      const entry = (child.restauration.mensuel &&
        child.restauration.mensuel.months &&
        child.restauration.mensuel.months[m.key]) || {
        selected: false,
        repas: m.repas,
      };
      return `
      <div class="mois-row ${entry.selected ? "" : "is-off"}" style="display:flex; align-items:center; justify-content:space-between; padding:10px 14px; border-bottom:1px solid var(--border); gap:12px;">
        <label class="mois-check" style="display:flex; align-items:center; gap:8px; font-weight:600; cursor:pointer;">
          <input type="checkbox" class="chk" data-role="mois-check-r" data-child="${child.id}" data-mois="${m.key}" ${entry.selected ? "checked" : ""} aria-label="Inclure ${m.label}">
          <span class="mois-label">${m.label}</span>
        </label>
        <div class="mois-fields" style="display:flex; gap:12px;">
          <div class="field" style="margin:0;">
            <label style="font-size:0.75rem;">Repas (max ${m.repas})</label>
            <input type="number" min="0" max="${m.repas}" value="${entry.repas}" data-role="repas-mensuel" data-child="${child.id}" data-mois="${m.key}" ${entry.selected ? "" : "disabled"} style="width:70px; padding:4px 8px;">
          </div>
        </div>
      </div>`;
    })
    .join("");
  return `
    <div class="mois-select-actions" style="margin-bottom:10px; display:flex; gap:8px;">
      <button type="button" data-role="mois-r-all" data-child="${child.id}" style="padding:4px 10px; font-size:0.78rem; border-radius:6px; border:1px solid var(--border); background:var(--surface);">Tout sélectionner</button>
      <button type="button" data-role="mois-r-none" data-child="${child.id}" style="padding:4px 10px; font-size:0.78rem; border-radius:6px; border:1px solid var(--border); background:var(--surface);">Tout désélectionner</button>
    </div>
    ${rows}
  `;
}

function renderRestaurationChildCard(child, index) {
  const card = document.createElement("div");
  card.className = "card child-card";
  card.dataset.headingFor = child.id;

  const resChild =
    serverResultCache && serverResultCache.detailEnfants
      ? serverResultCache.detailEnfants.find((c) => c.id === child.id)
      : null;
  const subtotal = resChild ? resChild.restauration.total : 0;
  const rateLabel = resChild
    ? `${resChild.restauration.tarifUnitaire.toFixed(2)} € / repas`
    : "Calcul serveur...";
  const activeWeek = child.restauration.routineAlternance
    ? child.restauration.activeWeek === "B"
      ? "B"
      : "A"
    : "A";

  card.innerHTML = `
    <div class="child-card-head">
      <div>
        <h3 data-name-for="${child.id}">${displayName(child, index)}</h3>
        <p class="card-sub" style="margin-bottom:0;">Restauration scolaire</p>
      </div>
      <span class="level-chip">${child.niveau === "preelementaire" ? "Préélémentaire" : "Élémentaire"}</span>
    </div>

    ${
      state.family.resident !== false
        ? `
    <div class="field">
      <label id="rtype-label-${child.id}">Type de tarification restauration</label>
      <div class="pill-group" role="radiogroup">
        <input type="radio" name="rtype-${child.id}" id="rtype-classique-${child.id}" value="classique" ${child.restauration.type === "classique" ? "checked" : ""}>
        <label for="rtype-classique-${child.id}">Classique (QF)</label>
        <input type="radio" name="rtype-${child.id}" id="rtype-pai-${child.id}" value="pai" ${child.restauration.type === "pai" ? "checked" : ""}>
        <label for="rtype-pai-${child.id}">PAI (Protocole d'Accueil Individualisé)</label>
        <input type="radio" name="rtype-${child.id}" id="rtype-occasionnel-${child.id}" value="occasionnel" ${child.restauration.type === "occasionnel" ? "checked" : ""}>
        <label for="rtype-occasionnel-${child.id}">Occasionnel</label>
      </div>
    </div>
    `
        : ""
    }

    <div class="badge-row">
      <span class="badge gold"><span class="dot"></span>Tarif calculé : ${rateLabel}</span>
    </div>

    <div class="tabs mode-tabs" role="tablist" style="margin-top:18px;">
      <button type="button" data-mode="hebdo" class="${child.restauration.mode === "hebdo" ? "active" : ""}">Routine</button>
      <button type="button" data-mode="mensuel" class="${child.restauration.mode === "mensuel" ? "active" : ""}">Mensuel</button>
    </div>

    <div data-panel="hebdo-restau" ${child.restauration.mode !== "hebdo" ? "hidden" : ""}>
      ${buildRoutineControls(child, child.restauration, "groutine-r")}
      <div data-role="routine-table-r">${buildRestaurationWeekRow(child, activeWeek)}</div>
      ${buildRestaurationRoutineProjectionUI(child)}
    </div>

    <div data-panel="mensuel-restau" ${child.restauration.mode !== "mensuel" ? "hidden" : ""}>
      ${buildRestaurationMonthlyPanel(child)}
    </div>

    <div class="subtotal-line">
      <span>Sous-total restauration — ${displayName(child, index)}</span>
      <span class="amount" data-role="restauration-subtotal">${formatEuro(subtotal)}</span>
    </div>
  `;

  // Attach events
  card.querySelectorAll(`input[name="rtype-${child.id}"]`).forEach((r) => {
    r.addEventListener("change", (e) => {
      child.restauration.type = e.target.value;
      calculateOnServer();
    });
  });

  card.querySelectorAll(".mode-tabs button").forEach((btn) => {
    btn.addEventListener("click", () => {
      child.restauration.mode = btn.dataset.mode;
      renderRestauration();
      calculateOnServer();
    });
  });

  card.querySelectorAll(`input[name="groutine-r-${child.id}"]`).forEach((r) => {
    r.addEventListener("change", (e) => {
      child.restauration.routineAlternance = e.target.value === "alternance";
      renderRestauration();
      calculateOnServer();
    });
  });

  card
    .querySelectorAll('[data-role="week-tab"][data-module="groutine-r"]')
    .forEach((btn) => {
      btn.addEventListener("click", () => {
        child.restauration.activeWeek = btn.dataset.week;
        renderRestauration();
      });
    });

  card.querySelectorAll('[data-role="restau-check"]').forEach((chk) => {
    chk.addEventListener("change", (e) => {
      const day = e.target.dataset.day;
      const weekTag = e.target.dataset.week;
      const sel = weekSelection(child.restauration, weekTag);
      sel[day] = e.target.checked;
      calculateOnServer();
    });
  });

  card.querySelectorAll('[data-role="mois-check-r"]').forEach((chk) => {
    chk.addEventListener("change", (e) => {
      const key = e.target.dataset.mois;
      if (!child.restauration.mensuel.months[key]) {
        const m = CONFIG_STATIC.moisRestauration.find((x) => x.key === key);
        child.restauration.mensuel.months[key] = {
          selected: false,
          repas: m.repas,
        };
      }
      child.restauration.mensuel.months[key].selected = e.target.checked;
      renderRestauration();
      calculateOnServer();
    });
  });

  card.querySelectorAll('[data-role="repas-mensuel"]').forEach((inp) => {
    inp.addEventListener("input", (e) => {
      const key = e.target.dataset.mois;
      const m = CONFIG_STATIC.moisRestauration.find((x) => x.key === key);
      const v = Math.max(
        0,
        Math.min(parseInt(e.target.value || "0", 10), m.repas),
      );
      if (!child.restauration.mensuel.months[key])
        child.restauration.mensuel.months[key] = {
          selected: true,
          repas: m.repas,
        };
      child.restauration.mensuel.months[key].repas = v;
      calculateOnServer();
    });
  });

  const btnAllR = card.querySelector('[data-role="mois-r-all"]');
  if (btnAllR) {
    btnAllR.addEventListener("click", () => {
      CONFIG_STATIC.moisRestauration.forEach((m) => {
        if (!child.restauration.mensuel.months[m.key])
          child.restauration.mensuel.months[m.key] = {
            selected: true,
            repas: m.repas,
          };
        child.restauration.mensuel.months[m.key].selected = true;
      });
      renderRestauration();
      calculateOnServer();
    });
  }

  const btnNoneR = card.querySelector('[data-role="mois-r-none"]');
  if (btnNoneR) {
    btnNoneR.addEventListener("click", () => {
      CONFIG_STATIC.moisRestauration.forEach((m) => {
        if (!child.restauration.mensuel.months[m.key])
          child.restauration.mensuel.months[m.key] = {
            selected: false,
            repas: m.repas,
          };
        child.restauration.mensuel.months[m.key].selected = false;
      });
      renderRestauration();
      calculateOnServer();
    });
  }

  return card;
}

function renderRestauration() {
  const container = document.getElementById("restaurationChildren");
  if (!container) return;
  container.innerHTML = "";
  if (!state.restauration.enabled) {
    container.innerHTML = `<div class="card" style="text-align:center; padding:32px; color:var(--muted);">Le module Restauration est désactivé.</div>`;
    return;
  }
  activeChildren().forEach((child, i) => {
    container.appendChild(renderRestaurationChildCard(child, i));
  });
}

// Rendu du Graphique Mensuel Interactif
function buildMonthlyCostChartSVG(data) {
  const width = 800,
    height = 280;
  const padding = { top: 35, right: 15, bottom: 40 };
  const chartW = width - padding.right;
  const chartH = height - padding.top - padding.bottom;
  const n = data.length;
  const gap = 12;
  const barW = (chartW - gap * (n - 1)) / n;
  const maxTotal = Math.max(1, ...data.map((d) => d.garderie + d.restauration));
  const scaleY = (v) => (v / maxTotal) * chartH;

  const bars = data
    .map((d, i) => {
      const x = i * (barW + gap);
      const gH = scaleY(d.garderie);
      const rH = scaleY(d.restauration);
      const gY = padding.top + chartH - gH;
      const rY = gY - rH;
      const shortLabel = d.label
        .replace(" 2026", "")
        .replace(" 2027", "")
        .replace("Juin – Juillet", "Juin-Juil");
      const totCost = (d.garderie + d.restauration).toFixed(2);

      return `
      <g class="chart-bar-group" cursor="pointer" data-month="${d.label}" data-garderie="${d.garderie.toFixed(2)}" data-restauration="${d.restauration.toFixed(2)}" data-total="${totCost}">
        <!-- Bar Restauration (Orange/Gold) -->
        <rect class="bar-restauration" x="${x}" y="${rY}" width="${barW}" height="${Math.max(2, rH)}" rx="3">
          <title>${d.label} — Cantine: ${d.restauration.toFixed(2)} € | Total: ${totCost} €</title>
        </rect>
        <!-- Bar Garderie (Navy) -->
        <rect class="bar-garderie" x="${x}" y="${gY}" width="${barW}" height="${Math.max(2, gH)}" rx="3">
          <title>${d.label} — Garderie: ${d.garderie.toFixed(2)} € | Total: ${totCost} €</title>
        </rect>
        <!-- Text Label Total Month -->
        <text class="bar-cost-label" x="${x + barW / 2}" y="${rY - 6}" text-anchor="middle" font-size="10" font-weight="700" fill="var(--navy)">${totCost > 0 ? totCost + "€" : ""}</text>
        <!-- Month Name -->
        <text class="month-label" x="${x + barW / 2}" y="${height - 10}" text-anchor="middle" font-size="11" font-weight="600" fill="var(--muted)">${shortLabel}</text>
      </g>
    `;
    })
    .join("");

  return `<svg class="cost-chart-svg" viewBox="0 0 ${width} ${height}" role="img" aria-label="Répartition mensuelle du coût garderie et restauration">${bars}</svg>`;
}

// Mise à jour de la Synthèse d'après les données renvoyées par le serveur
function renderSyntheseWithServerData(data) {
  const { synthese, detailEnfants, repartitionMensuelle } = data;

  document.getElementById("synthGarderie").textContent = formatEuro(
    synthese.totalGarderie,
  );
  document.getElementById("synthRestauration").textContent = formatEuro(
    synthese.totalRestauration,
  );
  document.getElementById("synthTotal").textContent = formatEuro(
    synthese.totalGeneral,
  );
  document.getElementById("floatTotal").textContent = formatEuro(
    synthese.totalGeneral,
  );

  // Mettre à jour les sous-totaux dans les cartes enfants
  detailEnfants.forEach((cRes) => {
    const gCard = document.querySelector(
      `#garderieChildren .card[data-heading-for="${cRes.id}"] [data-role="garderie-subtotal"]`,
    );
    if (gCard) gCard.textContent = formatEuro(cRes.garderie.total);

    const rCard = document.querySelector(
      `#restaurationChildren .card[data-heading-for="${cRes.id}"] [data-role="restauration-subtotal"]`,
    );
    if (rCard) rCard.textContent = formatEuro(cRes.restauration.total);
  });

  // Render SVG Chart
  const chartEl = document.getElementById("monthlyCostChart");
  if (chartEl && repartitionMensuelle) {
    chartEl.innerHTML = buildMonthlyCostChartSVG(repartitionMensuelle);
  }

  // Render Details List
  const wrap = document.getElementById("synthDetails");
  if (wrap && detailEnfants) {
    wrap.innerHTML = detailEnfants
      .map((cRes) => {
        return `
        <div class="synth-child-card">
          <div class="who">
            <div class="avatar">${initials(cRes.prenom)}</div>
            <div>
              <div style="font-weight:700; color:var(--navy);">${cRes.prenom}</div>
              <div class="meta">${cRes.niveau === "preelementaire" ? "Préélémentaire" : "Élémentaire"} · Garderie (${cRes.garderie.tarifUnitaire.toFixed(2)}€) · Cantine (${cRes.restauration.tarifUnitaire.toFixed(2)}€)</div>
            </div>
          </div>
          <div class="amounts">
            <div class="item"><div class="n">${formatEuro(cRes.garderie.total)}</div><div class="l">Garderie</div></div>
            <div class="item"><div class="n">${formatEuro(cRes.restauration.total)}</div><div class="l">Restauration</div></div>
            <div class="item"><div class="n" style="color:var(--gold);">${formatEuro(cRes.totalEnfant)}</div><div class="l">Total enfant</div></div>
          </div>
        </div>
      `;
      })
      .join("");
  }
}

// Fonction de téléchargement de la simulation sous forme de fichier HTML autonome (Lecture Seule)
function downloadStandaloneHtml() {
  if (!serverResultCache) {
    alert("Veuillez d'abord effectuer une simulation.");
    return;
  }
  const { synthese, detailEnfants } = serverResultCache;
  const dateStr = new Date().toLocaleString("fr-FR", {
    dateStyle: "long",
    timeStyle: "short",
  });
  const prenoms = state.family.prenoms || "Famille";

  const childrenHtml = detailEnfants
    .map(
      (c) => `
    <div style="background:#fff; border:1px solid #E3DCC9; border-radius:12px; padding:16px; margin-bottom:14px;">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
        <h3 style="margin:0; color:#153A5B; font-family:Georgia, serif;">${c.prenom}</h3>
        <span style="background:#F6F3EC; color:#153A5B; padding:3px 10px; border-radius:999px; font-size:0.75rem; font-weight:700;">${c.niveau === "preelementaire" ? "Préélémentaire" : "Élémentaire"}</span>
      </div>
      <div style="font-size:0.85rem; color:#5B6773; margin-bottom:12px;">
        Garderie : <strong>${c.garderie.tarifUnitaire.toFixed(2)} € / 30 min</strong> · Cantine : <strong>${c.restauration.tarifUnitaire.toFixed(2)} € / repas</strong>
      </div>
      <div style="display:grid; grid-template-columns: repeat(3, 1fr); gap:10px; background:#FBF9F4; padding:10px; border-radius:8px; text-align:center;">
        <div><div style="font-weight:700; color:#153A5B;">${c.garderie.total.toFixed(2)} €</div><div style="font-size:0.7rem; color:#8A94A0;">Garderie</div></div>
        <div><div style="font-weight:700; color:#153A5B;">${c.restauration.total.toFixed(2)} €</div><div style="font-size:0.7rem; color:#8A94A0;">Cantine</div></div>
        <div><div style="font-weight:700; color:#C08A34;">${c.totalEnfant.toFixed(2)} €</div><div style="font-size:0.7rem; color:#8A94A0;">Total Enfant</div></div>
      </div>
    </div>
  `,
    )
    .join("");

  const fullContent = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<title>Simulation Périscolaire — Mairie de Laxou</title>
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #F6F3EC; color: #1E2A33; margin: 0; padding: 20px; }
  .container { max-width: 680px; margin: 0 auto; background: #fff; border-radius: 16px; padding: 24px; box-shadow: 0 10px 30px rgba(0,0,0,0.08); }
  .header { border-bottom: 2px solid #153A5B; padding-bottom: 14px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center; }
  .title { color: #153A5B; font-family: Georgia, serif; font-size: 1.3rem; margin: 0; }
  .meta { font-size: 0.8rem; color: #5B6773; }
  .hero-box { background: linear-gradient(135deg, #153A5B, #1B4A73); color: #fff; padding: 20px; border-radius: 12px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
  .total-val { font-size: 1.8rem; font-weight: 700; color: #E4B665; font-family: Georgia, serif; }
  .readonly-badge { display: inline-block; background: #E5F3EC; color: #2F7D5A; padding: 4px 12px; border-radius: 999px; font-size: 0.75rem; font-weight: 700; margin-bottom: 16px; }
</style>
</head>
<body>
<div class="container">
  <div class="header">
    <div>
      <h1 class="title">Mairie de Laxou · Service Périscolaire</h1>
      <div class="meta">Simulation indicative prévisionnelle pour l'année 2026 – 2027</div>
    </div>
    <div class="meta" style="text-align:right;">Éditée le :<br><strong>${dateStr}</strong></div>
  </div>

  <span class="readonly-badge">🔒 Document Récapitulatif Lecture Seule (Non modifiable)</span>

  <div style="background:#FBF9F4; border:1px solid #E3DCC9; border-radius:12px; padding:14px; margin-bottom:20px; font-size:0.9rem;">
    <strong>Informations foyer :</strong> ${prenoms} (${state.family.nbEnfants} enfant${state.family.nbEnfants > 1 ? "s" : ""})<br>
    <strong>Quotient Familial (QF) :</strong> ${state.family.qf}<br>
    <strong>Éligibilité tarif réduit :</strong> ${state.family.reduit ? "Oui" : "Non"}
  </div>

  <div class="hero-box">
    <div>
      <div style="font-size:0.85rem; text-transform:uppercase; letter-spacing:0.05em; opacity:0.9;">Total Général Estimé</div>
      <div class="total-val">${synthese.totalGeneral.toFixed(2)} €</div>
    </div>
    <div style="text-align:right; font-size:0.85rem;">
      Garderie : <strong>${synthese.totalGarderie.toFixed(2)} €</strong><br>
      Cantine : <strong>${synthese.totalRestauration.toFixed(2)} €</strong>
    </div>
  </div>

  <h2 style="font-family:Georgia, serif; color:#153A5B; font-size:1.1rem; margin-top:24px;">Détail des prestations par enfant</h2>
  ${childrenHtml}

  <footer style="margin-top:24px; padding-top:14px; border-top:1px solid #ECE7DA; font-size:0.75rem; color:#8A94A0; text-align:center;">
    Document récapitulatif généré par le Simulateur Officiel de la Ville de Laxou. Tout calcul reste sous réserve de validation par le service périscolaire.
  </footer>
</div>
</body>
</html>`;

  const blob = new Blob([fullContent], { type: "text/html;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `simulation-periscolaire-laxou-${prenoms.replace(/\s+/g, "_")}.html`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

// Initialisation globale au chargement
document.addEventListener("DOMContentLoaded", () => {
  const qfInput = document.getElementById("qfInput");
  if (qfInput) {
    qfInput.addEventListener("input", (e) => {
      state.family.qf = parseFloat(e.target.value) || 0;
      renderFamilyBadges();
      renderGarderie();
      renderRestauration();
      calculateOnServer();
    });
  }

  document.querySelectorAll('input[name="resident"]').forEach((r) => {
    r.addEventListener("change", (e) => {
      state.family.resident = e.target.value === "oui";
      renderFamilyBadges();
      renderGarderie();
      renderRestauration();
      calculateOnServer();
    });
  });

  // GESTION DU NOMBRE D'ENFANTS (+ / - et input)
  const nbInput = document.getElementById("nbEnfantsInput");
  const nbMinus = document.getElementById("nbMinus");
  const nbPlus = document.getElementById("nbPlus");

  function setChildCount(count) {
    const validCount = Math.max(1, Math.min(MAX_CHILDREN, count));
    state.family.nbEnfants = validCount;
    if (nbInput) nbInput.value = validCount;
    renderFamilyBadges();
    renderChildrenInputs();
    renderGarderie();
    renderRestauration();
    calculateOnServer();
  }

  if (nbInput) {
    nbInput.addEventListener("input", (e) => {
      setChildCount(parseInt(e.target.value, 10) || 1);
    });
  }
  if (nbMinus) {
    nbMinus.addEventListener("click", () => {
      setChildCount(state.family.nbEnfants - 1);
    });
  }
  if (nbPlus) {
    nbPlus.addEventListener("click", () => {
      setChildCount(state.family.nbEnfants + 1);
    });
  }

  // INTERRUPTEURS MODULES
  const gEnabled = document.getElementById("garderieEnabled");
  if (gEnabled) {
    gEnabled.addEventListener("change", (e) => {
      state.garderie.enabled = e.target.checked;
      renderGarderie();
      calculateOnServer();
    });
  }

  // BOUTON TÉLÉCHARGEMENT FICHE HTML AUTONOME (LECTURE SEULE)
  const downloadHtmlBtn = document.getElementById("downloadHtmlBtn");
  if (downloadHtmlBtn) {
    downloadHtmlBtn.addEventListener("click", downloadStandaloneHtml);
  }

  renderFamilyBadges();
  renderChildrenInputs();
  renderGarderie();
  renderRestauration();
  calculateOnServer();
});

// Détection d'intégration en iFrame & communication de la hauteur au site parent (Mairie)
if (window.self !== window.top) {
  document.body.classList.add("is-iframe");

  function notifyParentHeight() {
    const fullHeight =
      document.documentElement.scrollHeight || document.body.scrollHeight;
    window.parent.postMessage(
      { type: "PERISCOLAIRE_RESIZE", height: fullHeight },
      "*",
    );
  }

  window.addEventListener("load", notifyParentHeight);
  window.addEventListener("resize", notifyParentHeight);
  setTimeout(notifyParentHeight, 500);
  setTimeout(notifyParentHeight, 1500);
}
