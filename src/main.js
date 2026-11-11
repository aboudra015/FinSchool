import "./style.css";

const STORAGE_KEY = "finschool-data-v1";
const today = new Date();
const currentMonth = today.toISOString().slice(0, 7);

const initialData = {
  school: "École Les Hirondelles",
  year: "Année scolaire 2026–2027",
  students: [
    { id: "EL-001", firstName: "Aïssata", lastName: "Traoré", className: "6e A", guardian: "Mamadou Traoré", phone: "+223 70 12 34 56", annualFee: 125000 },
    { id: "EL-002", firstName: "Boubacar", lastName: "Diallo", className: "5e B", guardian: "Fatoumata Diallo", phone: "+223 76 23 45 67", annualFee: 125000 },
    { id: "EL-003", firstName: "Mariam", lastName: "Konaté", className: "4e A", guardian: "Oumar Konaté", phone: "+223 65 34 56 78", annualFee: 150000 },
    { id: "EL-004", firstName: "Ibrahim", lastName: "Coulibaly", className: "3e A", guardian: "Aminata Coulibaly", phone: "+223 66 45 67 89", annualFee: 150000 },
    { id: "EL-005", firstName: "Fatou", lastName: "Sangaré", className: "6e B", guardian: "Seydou Sangaré", phone: "+223 70 56 78 90", annualFee: 125000 },
    { id: "EL-006", firstName: "Moussa", lastName: "Keïta", className: "5e A", guardian: "Awa Keïta", phone: "+223 77 67 89 01", annualFee: 125000 },
    { id: "EL-007", firstName: "Aminata", lastName: "Dembélé", className: "4e B", guardian: "Issa Dembélé", phone: "+223 64 78 90 12", annualFee: 150000 },
    { id: "EL-008", firstName: "Ousmane", lastName: "Cissé", className: "3e B", guardian: "Kadiatou Cissé", phone: "+223 75 89 01 23", annualFee: 150000 }
  ],
  payments: [
    { id: "REC-2026-001", studentId: "EL-001", amount: 75000, method: "Espèces", date: "2026-09-10", note: "" },
    { id: "REC-2026-002", studentId: "EL-002", amount: 50000, method: "Mobile money", date: "2026-09-12", note: "" },
    { id: "REC-2026-003", studentId: "EL-003", amount: 100000, method: "Espèces", date: "2026-09-15", note: "" },
    { id: "REC-2026-004", studentId: "EL-004", amount: 120000, method: "Mobile money", date: "2026-09-18", note: "" },
    { id: "REC-2026-005", studentId: "EL-005", amount: 65000, method: "Espèces", date: "2026-10-02", note: "" },
    { id: "REC-2026-006", studentId: "EL-006", amount: 105000, method: "Espèces", date: "2026-10-04", note: "" },
    { id: "REC-2026-007", studentId: "EL-007", amount: 90000, method: "Mobile money", date: "2026-10-07", note: "" },
    { id: "REC-2026-008", studentId: "EL-008", amount: 80000, method: "Espèces", date: "2026-10-09", note: "" },
    { id: "REC-2026-009", studentId: "EL-001", amount: 25000, method: "Mobile money", date: currentMonth + "-03", note: "" },
    { id: "REC-2026-010", studentId: "EL-003", amount: 25000, method: "Espèces", date: currentMonth + "-05", note: "" },
    { id: "REC-2026-011", studentId: "EL-004", amount: 30000, method: "Espèces", date: currentMonth + "-06", note: "" },
    { id: "REC-2026-012", studentId: "EL-006", amount: 20000, method: "Mobile money", date: currentMonth + "-08", note: "" }
  ],
  team: [
    { id: "USR-001", name: "Admin École", email: "admin@hirondelles.ml", role: "Administrateur", status: "Actif" },
    { id: "USR-002", name: "Awa Diarra", email: "awa.diarra@hirondelles.ml", role: "Comptabilité", status: "Actif" },
    { id: "USR-003", name: "Ousmane Touré", email: "ousmane.toure@hirondelles.ml", role: "Direction", status: "Actif" }
  ],
  invitations: [],
  sync: { lastSync: new Date().toISOString(), devices: 1 }
};

function loadData() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return structuredClone(initialData);
    const parsed = JSON.parse(saved);
    if (!Array.isArray(parsed.students) || !Array.isArray(parsed.payments)) throw new Error("Données invalides");
    return {
      ...initialData,
      ...parsed,
      team: Array.isArray(parsed.team) ? parsed.team : structuredClone(initialData.team),
      invitations: Array.isArray(parsed.invitations) ? parsed.invitations : [],
      sync: { ...initialData.sync, ...(parsed.sync || {}) }
    };
  } catch (error) {
    console.error("Impossible de charger les données FinSchool :", error);
    return structuredClone(initialData);
  }
}

let data = loadData();
let activePage = "dashboard";
let studentFilter = "all";
let searchQuery = "";
let toastTimer;

const escapeHtml = (value = "") => String(value).replace(/[&<>"']/g, (char) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
})[char]);
const money = (amount) => new Intl.NumberFormat("fr-FR").format(amount) + " F CFA";
const shortMoney = (amount) => new Intl.NumberFormat("fr-FR", { notation: "compact", maximumFractionDigits: 1 }).format(amount) + " F";
const fullName = (student) => `${student.firstName} ${student.lastName}`;
const studentPayments = (studentId) => data.payments.filter((payment) => payment.studentId === studentId);
const paidAmount = (studentId) => studentPayments(studentId).reduce((sum, payment) => sum + Number(payment.amount), 0);
const balance = (student) => Math.max(0, Number(student.annualFee) - paidAmount(student.id));
const initials = (student) => `${student.firstName.charAt(0)}${student.lastName.charAt(0)}`.toUpperCase();
const formattedDate = (date) => new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(`${date}T12:00:00`));

function saveData() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function avatar(student, extraClass = "") {
  return `<span class="avatar ${extraClass}">${escapeHtml(initials(student))}</span>`;
}

function statusBadge(student) {
  const due = balance(student);
  return due === 0
    ? '<span class="badge badge-paid"><span></span>À jour</span>'
    : '<span class="badge badge-due"><span></span>Impayé</span>';
}

function render() {
  const root = document.querySelector("#app");
  root.innerHTML = `
    <aside class="sidebar">
      <a class="brand" href="#" data-page="dashboard" aria-label="FinSchool, accueil">
        <span class="brand-mark">f<span>.</span></span>
        <span class="brand-name">fin<span>school</span></span>
      </a>
      <div class="school-switcher">
        <span class="school-icon">É</span>
        <span class="school-copy"><strong>${escapeHtml(data.school)}</strong><small>Établissement</small></span>
        <span class="switch-chevron">⌄</span>
      </div>
      <p class="nav-label">MENU PRINCIPAL</p>
      <nav class="main-nav" aria-label="Navigation principale">
        <button class="nav-item ${activePage === "dashboard" ? "active" : ""}" data-page="dashboard"><span class="nav-icon">◫</span>Vue d’ensemble</button>
        <button class="nav-item ${activePage === "students" ? "active" : ""}" data-page="students"><span class="nav-icon">♙</span>Élèves<span class="nav-count">${data.students.length}</span></button>
        <button class="nav-item ${activePage === "payments" ? "active" : ""}" data-page="payments"><span class="nav-icon">▤</span>Paiements</button>
        <button class="nav-item ${activePage === "team" ? "active" : ""}" data-page="team"><span class="nav-icon">♧</span>Équipe</button>
        <button class="nav-item ${activePage === "sync" ? "active" : ""}" data-page="sync"><span class="nav-icon">⟳</span>Synchronisation</button>
      </nav>
      <p class="nav-label nav-label-second">GESTION</p>
      <button class="nav-item" data-page="students" data-filter="due"><span class="nav-icon">◷</span>Impayés<span class="nav-count nav-count-alert">${data.students.filter((student) => balance(student) > 0).length}</span></button>
      <div class="sidebar-bottom">
        <div class="help-card"><span class="help-icon">?</span><strong>Besoin d’aide ?</strong><p>Votre suivi scolaire, simplement.</p><button data-action="help">En savoir plus <span>→</span></button></div>
        <div class="user-profile"><span class="user-avatar">AD</span><span><strong>Admin École</strong><small>Administrateur</small></span><span class="profile-menu">•••</span></div>
      </div>
    </aside>
    <main class="main-content">
      <header class="topbar">
        <div class="breadcrumbs">FinSchool <span>/</span> ${({ dashboard: "Vue d’ensemble", students: "Élèves", payments: "Paiements", team: "Équipe", sync: "Synchronisation" })[activePage]}</div>
        <div class="topbar-right"><span class="school-year">${escapeHtml(data.year)}</span><button class="sync-pill" data-page="sync"><i></i>Démo</button><button class="icon-button notification-button" aria-label="Notifications">♧<i></i></button><button class="account-trigger" data-action="account" aria-label="Ouvrir le compte de démonstration"><span class="top-avatar">AD</span><span class="top-account-name">Admin École</span></button></div>
      </header>
      <div class="demo-banner"><strong>MODE DÉMO</strong><span>Comptes, synchronisation, paiements et WhatsApp sont simulés. Aucune donnée n’est envoyée à un service externe.</span></div>
      <div class="page-container">${activePage === "dashboard" ? dashboardPage() : activePage === "students" ? studentsPage() : activePage === "payments" ? paymentsPage() : activePage === "team" ? teamPage() : syncPage()}</div>
    </main>
    <div id="modal-root"></div>
    <div id="toast-root" aria-live="polite"></div>
  `;
}

function showToast(message) {
  const root = document.querySelector("#toast-root");
  if (!root) return;
  root.innerHTML = `<div class="toast-message">${escapeHtml(message)}</div>`;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { root.innerHTML = ""; }, 4200);
}

function dashboardPage() {
  const totalCollected = data.payments.reduce((sum, payment) => sum + Number(payment.amount), 0);
  const monthPayments = data.payments.filter((payment) => payment.date.startsWith(currentMonth));
  const monthTotal = monthPayments.reduce((sum, payment) => sum + Number(payment.amount), 0);
  const outstanding = data.students.reduce((sum, student) => sum + balance(student), 0);
  const totalExpected = data.students.reduce((sum, student) => sum + Number(student.annualFee), 0);
  const collectionRate = totalExpected ? Math.round((totalCollected / totalExpected) * 100) : 0;
  const recent = [...data.payments].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);
  const dueStudents = [...data.students].filter((student) => balance(student) > 0).sort((a, b) => balance(b) - balance(a)).slice(0, 4);

  return `
    <section class="page-heading">
      <div><p class="eyebrow">${escapeHtml(data.year)}</p><h1>Bonjour, Admin <span class="wave">✦</span></h1><p class="heading-subtitle">Voici le résumé des frais scolaires de votre établissement.</p></div>
      <button class="button button-primary" data-action="new-payment"><span class="button-plus">＋</span>Enregistrer un paiement</button>
    </section>
    <section class="stat-grid" aria-label="Résumé financier">
      <article class="stat-card"><div class="stat-top"><span class="stat-label">Total encaissé</span><span class="stat-icon stat-icon-green">↗</span></div><strong class="stat-value">${shortMoney(totalCollected)}</strong><div class="stat-foot"><span class="stat-foot-dot green-dot"></span>${money(totalCollected)} depuis la rentrée</div><div class="stat-spark spark-green"><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div></article>
      <article class="stat-card"><div class="stat-top"><span class="stat-label">Encaissé ce mois</span><span class="stat-icon stat-icon-blue">▤</span></div><strong class="stat-value">${shortMoney(monthTotal)}</strong><div class="stat-foot"><span class="stat-foot-dot blue-dot"></span>${monthPayments.length} paiement${monthPayments.length === 1 ? "" : "s"} enregistré${monthPayments.length === 1 ? "" : "s"}</div><div class="stat-spark spark-blue"><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div></article>
      <article class="stat-card"><div class="stat-top"><span class="stat-label">Frais à recouvrer</span><span class="stat-icon stat-icon-orange">◷</span></div><strong class="stat-value">${shortMoney(outstanding)}</strong><div class="stat-foot"><span class="stat-foot-dot orange-dot"></span>${data.students.filter((student) => balance(student) > 0).length} élèves ont un solde</div><div class="stat-spark spark-orange"><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div></article>
      <article class="stat-card rate-card"><div class="stat-top"><span class="stat-label">Taux de recouvrement</span><span class="stat-icon stat-icon-purple">◎</span></div><strong class="stat-value">${collectionRate}<small>%</small></strong><div class="stat-foot"><span class="stat-foot-dot purple-dot"></span>Sur les frais annuels attendus</div><div class="progress-track"><span style="width:${Math.min(100, collectionRate)}%"></span></div></article>
    </section>
    <section class="dashboard-grid">
      <article class="panel recent-panel"><div class="panel-heading"><div><h2>Derniers paiements</h2><p>Les règlements récemment enregistrés</p></div><button class="text-button" data-page="payments">Tout voir <span>→</span></button></div>
        ${recent.length ? `<div class="table-wrap"><table><thead><tr><th>ÉLÈVE</th><th>DATE</th><th>MODE</th><th>MONTANT</th><th></th></tr></thead><tbody>${recent.map(paymentRow).join("")}</tbody></table></div>` : emptyState("Aucun paiement enregistré", "Les paiements apparaîtront ici.")}</article>
      <article class="panel due-panel"><div class="panel-heading"><div><h2>À suivre</h2><p>Élèves avec un solde à régler</p></div><button class="round-arrow" data-page="students" data-filter="due" aria-label="Voir les impayés">→</button></div>
        ${dueStudents.length ? `<div class="due-list">${dueStudents.map((student) => `<button class="due-item" data-action="student-details" data-id="${student.id}">${avatar(student)}<span class="due-person"><strong>${escapeHtml(fullName(student))}</strong><small>${escapeHtml(student.className)}</small></span><span class="due-amount">${money(balance(student))}<small>restant dû</small></span></button>`).join("")}</div><button class="view-all-due" data-page="students" data-filter="due">Voir tous les impayés <span>→</span></button>` : emptyState("Tout est à jour", "Aucun solde impayé pour le moment.")}</article>
    </section>
    <section class="bottom-note"><span class="note-icon">i</span><span>Vos données sont enregistrées sur cet appareil.</span><button data-action="help">Comment ça marche ?</button></section>
  `;
}

function paymentRow(payment) {
  const student = data.students.find((item) => item.id === payment.studentId);
  if (!student) return "";
  return `<tr><td><div class="person-cell">${avatar(student, "avatar-small")}<span><strong>${escapeHtml(fullName(student))}</strong><small>${escapeHtml(student.className)}</small></span></div></td><td class="muted-cell">${formattedDate(payment.date)}</td><td><span class="method-pill"><span class="${payment.method === "Espèces" ? "cash-symbol" : "mobile-symbol"}">${payment.method === "Espèces" ? "₣" : "◈"}</span>${escapeHtml(payment.method)}</span></td><td class="amount-cell">${money(Number(payment.amount))}</td><td><button class="row-menu" data-action="receipt" data-id="${payment.id}" aria-label="Afficher le reçu">↗</button></td></tr>`;
}

function studentsPage() {
  const filtered = data.students.filter((student) => {
    const matchesSearch = `${fullName(student)} ${student.className} ${student.id}`.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = studentFilter === "due" ? balance(student) > 0 : studentFilter === "paid" ? balance(student) === 0 : true;
    return matchesSearch && matchesFilter;
  });
  const dueCount = data.students.filter((student) => balance(student) > 0).length;
  return `
    <section class="page-heading page-heading-list"><div><p class="eyebrow">GESTION DES INSCRIPTIONS</p><h1>Élèves</h1><p class="heading-subtitle">Retrouvez les frais et paiements de chaque élève.</p></div><button class="button button-primary" data-action="add-student"><span class="button-plus">＋</span>Ajouter un élève</button></section>
    <section class="panel list-panel"><div class="list-toolbar"><div class="filter-tabs"><button class="filter-tab ${studentFilter === "all" ? "selected" : ""}" data-filter="all">Tous <span>${data.students.length}</span></button><button class="filter-tab ${studentFilter === "due" ? "selected" : ""}" data-filter="due">Impayés <span class="tab-alert">${dueCount}</span></button><button class="filter-tab ${studentFilter === "paid" ? "selected" : ""}" data-filter="paid">À jour</button></div><label class="search-box"><span>⌕</span><input id="student-search" value="${escapeHtml(searchQuery)}" placeholder="Rechercher un élève..." aria-label="Rechercher un élève" /><kbd>⌘ K</kbd></label></div>
      ${filtered.length ? `<div class="table-wrap"><table class="student-table"><thead><tr><th>ÉLÈVE</th><th>CLASSE</th><th>FRAIS ANNUELS</th><th>DÉJÀ PAYÉ</th><th>RESTE À PAYER</th><th>STATUT</th><th></th></tr></thead><tbody>${filtered.map((student) => `<tr><td><div class="person-cell">${avatar(student, "avatar-small")}<span><strong>${escapeHtml(fullName(student))}</strong><small>${escapeHtml(student.id)}</small></span></div></td><td class="muted-cell">${escapeHtml(student.className)}</td><td class="muted-cell">${money(Number(student.annualFee))}</td><td class="amount-cell">${money(paidAmount(student.id))}</td><td class="${balance(student) ? "due-cell" : "muted-cell"}">${money(balance(student))}</td><td>${statusBadge(student)}</td><td><button class="row-menu" data-action="student-details" data-id="${student.id}" aria-label="Voir ${escapeHtml(fullName(student))}">···</button></td></tr>`).join("")}</tbody></table></div><div class="table-footer">Affichage de <strong>${filtered.length}</strong> élève${filtered.length > 1 ? "s" : ""} sur ${data.students.length}</div>` : emptyState("Aucun élève trouvé", "Essayez une autre recherche ou un autre filtre.")}</section>
    <section class="bottom-note"><span class="note-icon">i</span><span>Les informations sont conservées dans le navigateur de cet appareil.</span></section>
  `;
}

function paymentsPage() {
  const payments = [...data.payments].sort((a, b) => b.date.localeCompare(a.date));
  const total = payments.reduce((sum, payment) => sum + Number(payment.amount), 0);
  return `
    <section class="page-heading page-heading-list"><div><p class="eyebrow">SUIVI DE TRÉSORERIE</p><h1>Paiements</h1><p class="heading-subtitle">Historique des règlements reçus par l’établissement.</p></div><button class="button button-primary" data-action="new-payment"><span class="button-plus">＋</span>Enregistrer un paiement</button></section>
    <section class="payment-summary"><div class="summary-icon">₣</div><div><span>Total des règlements enregistrés</span><strong>${money(total)}</strong></div><div class="summary-count">${payments.length} transaction${payments.length === 1 ? "" : "s"}</div></section>
    <section class="panel list-panel payment-list-panel"><div class="panel-heading"><div><h2>Historique des paiements</h2><p>Chaque règlement peut être réimprimé sous forme de reçu.</p></div></div>${payments.length ? `<div class="table-wrap"><table><thead><tr><th>ÉLÈVE</th><th>DATE</th><th>MODE DE PAIEMENT</th><th>RÉFÉRENCE</th><th>MONTANT</th><th></th></tr></thead><tbody>${payments.map((payment) => { const student = data.students.find((item) => item.id === payment.studentId); return student ? `<tr><td><div class="person-cell">${avatar(student, "avatar-small")}<span><strong>${escapeHtml(fullName(student))}</strong><small>${escapeHtml(student.className)}</small></span></div></td><td class="muted-cell">${formattedDate(payment.date)}</td><td><span class="method-pill"><span class="${payment.method === "Espèces" ? "cash-symbol" : "mobile-symbol"}">${payment.method === "Espèces" ? "₣" : "◈"}</span>${escapeHtml(payment.method)}</span></td><td class="muted-cell reference-cell">${escapeHtml(payment.id)}</td><td class="amount-cell">${money(Number(payment.amount))}</td><td><button class="receipt-button" data-action="receipt" data-id="${payment.id}">Reçu <span>↗</span></button></td></tr>` : ""; }).join("")}</tbody></table></div>` : emptyState("Aucun paiement enregistré", "Ajoutez un règlement pour le voir apparaître ici.")}</section>
    <section class="bottom-note"><span class="note-icon">i</span><span>Les paiements espèces et mobile money sont saisis manuellement.</span></section>
  `;
}

function teamPage() {
  const invitations = data.team.filter((member) => member.status !== "Actif").length;
  return `
    <section class="page-heading page-heading-list"><div><p class="eyebrow">COMPTES ET ACCÈS · DÉMO</p><h1>Équipe</h1><p class="heading-subtitle">Aperçu des comptes et des rôles de l’établissement.</p></div><button class="button button-primary" data-action="invite-user"><span class="button-plus">＋</span>Simuler une invitation</button></section>
    <section class="team-summary">
      <article class="team-summary-card"><span class="team-summary-icon">♧</span><div><small>Comptes de démonstration</small><strong>${data.team.length}</strong></div></article>
      <article class="team-summary-card"><span class="team-summary-icon team-icon-purple">▤</span><div><small>Rôles disponibles</small><strong>3 rôles</strong></div></article>
      <article class="team-summary-card"><span class="team-summary-icon team-icon-orange">✉</span><div><small>Invitations simulées</small><strong>${invitations}</strong></div></article>
    </section>
    <section class="panel team-panel"><div class="panel-heading"><div><h2>Membres de l’équipe</h2><p>Les rôles affichés sont indicatifs et ne protègent pas encore l’accès aux données.</p></div><span class="demo-tag">COMPTES FICTIFS</span></div>
      <div class="team-list">${data.team.map((member) => `<article class="team-member"><span class="team-avatar">${escapeHtml(member.name.split(" ").map((part) => part[0]).slice(0, 2).join("").toUpperCase())}</span><div class="team-member-identity"><strong>${escapeHtml(member.name)}</strong><small>${escapeHtml(member.email)}</small></div><span class="role-badge">${escapeHtml(member.role)}</span><span class="member-status ${member.status === "Actif" ? "member-active" : "member-invited"}"><i></i>${escapeHtml(member.status)}</span><button class="row-menu" data-action="account-details" data-id="${escapeHtml(member.id)}" aria-label="Détails du compte">···</button></article>`).join("")}</div>
    </section>
    <section class="notice-card"><span class="notice-card-icon">i</span><div><strong>Authentification en mode prototype</strong><p>Les comptes sont des exemples enregistrés dans ce navigateur. Aucun mot de passe, email d’invitation ni contrôle d’accès réel n’est configuré.</p></div></section>
  `;
}

function syncPage() {
  const syncedAt = data.sync.lastSync ? new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(data.sync.lastSync)) : "Jamais";
  return `
    <section class="page-heading page-heading-list"><div><p class="eyebrow">DONNÉES ET APPAREILS · DÉMO</p><h1>Synchronisation</h1><p class="heading-subtitle">Aperçu du statut de synchronisation des données de l’école.</p></div><button class="button button-primary" data-action="simulate-sync"><span class="button-plus">⟳</span>Simuler une synchro</button></section>
    <section class="sync-status-card"><span class="sync-status-icon">⟳</span><div class="sync-status-copy"><span class="demo-tag">SIMULATION LOCALE</span><h2>Les données sont sur cet appareil</h2><p>Cette action met à jour l’horodatage de démonstration uniquement. Aucun serveur distant n’est connecté.</p></div><span class="sync-connection"><i></i>Non connecté au cloud</span></section>
    <section class="sync-detail-grid"><article class="panel sync-detail-card"><span class="sync-detail-icon">⌂</span><div><small>Appareil actuel</small><strong>Navigateur de démonstration</strong><span>Stockage local activé</span></div></article><article class="panel sync-detail-card"><span class="sync-detail-icon sync-icon-purple">◷</span><div><small>Dernière synchro simulée</small><strong>${escapeHtml(syncedAt)}</strong><span>Horodatage local, non transmis</span></div></article><article class="panel sync-detail-card"><span class="sync-detail-icon sync-icon-orange">▣</span><div><small>Appareils synchronisés</small><strong>${Number(data.sync.devices) || 1} appareil</strong><span>Les autres appareils ne sont pas reliés</span></div></article></section>
    <section class="notice-card"><span class="notice-card-icon">i</span><div><strong>Pas encore de synchronisation multiappareils</strong><p>Pour partager des données entre plusieurs appareils, il faudra connecter un serveur et un compte sécurisé. La démo ne téléverse aucune information d’élève.</p></div></section>
  `;
}

function emptyState(title, message) {
  return `<div class="empty-state"><span class="empty-icon">⌕</span><strong>${title}</strong><p>${message}</p></div>`;
}

function studentPaymentModal(studentId = "") {
  const options = data.students.map((student) => `<option value="${student.id}" ${student.id === studentId ? "selected" : ""}>${escapeHtml(fullName(student))} — ${escapeHtml(student.className)} (${money(balance(student))} dû)</option>`).join("");
  document.querySelector("#modal-root").innerHTML = `
    <div class="modal-backdrop" data-modal-backdrop><section class="modal payment-modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <button class="modal-close" data-action="close-modal" aria-label="Fermer">×</button><div class="modal-icon">₣</div><p class="eyebrow">NOUVEAU RÈGLEMENT</p><h2 id="modal-title">Enregistrer un paiement</h2><p class="modal-subtitle">Saisissez les informations du règlement reçu.</p>
      <form id="payment-form"><label>Élève<select name="studentId" required><option value="">Choisir un élève</option>${options}</select></label><div class="form-grid"><label>Montant reçu (F CFA)<input name="amount" type="number" min="1" step="1" placeholder="Ex. 25 000" required /></label><label>Date du paiement<input name="date" type="date" value="${today.toISOString().slice(0, 10)}" required /></label></div><fieldset><legend>Mode de paiement</legend><label class="radio-card"><input type="radio" name="method" value="Espèces" checked /><span class="radio-symbol">₣</span><span><strong>Espèces</strong><small>Reçu saisi manuellement</small></span></label><label class="radio-card"><input type="radio" name="method" value="Mobile money" /><span class="radio-symbol mobile-symbol">◈</span><span><strong>Mobile money</strong><small>Simulation uniquement</small></span></label></fieldset><p class="payment-demo-note">Le paiement mobile est simulé : aucun débit ni appel à un opérateur ne sera effectué.</p><label>Note <span class="optional">(facultatif)</span><input name="note" type="text" maxlength="100" placeholder="Ex. Tranche 2" /></label><div class="form-error" id="form-error" role="alert"></div><div class="modal-actions"><button type="button" class="button button-secondary" data-action="close-modal">Annuler</button><button id="payment-submit" type="submit" class="button button-primary">Enregistrer le paiement</button></div></form>
    </section></div>`;
  document.querySelector("#payment-form [name=studentId]").focus();
}

function addStudentModal() {
  document.querySelector("#modal-root").innerHTML = `
    <div class="modal-backdrop" data-modal-backdrop><section class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <button class="modal-close" data-action="close-modal" aria-label="Fermer">×</button><div class="modal-icon">♙</div><p class="eyebrow">NOUVELLE INSCRIPTION</p><h2 id="modal-title">Ajouter un élève</h2><p class="modal-subtitle">Complétez les informations de l’élève et ses frais annuels.</p>
      <form id="student-form"><div class="form-grid"><label>Prénom<input name="firstName" required maxlength="40" placeholder="Prénom" /></label><label>Nom<input name="lastName" required maxlength="40" placeholder="Nom" /></label></div><div class="form-grid"><label>Classe<input name="className" required maxlength="30" placeholder="Ex. 6e A" /></label><label>Frais annuels (F CFA)<input name="annualFee" type="number" min="1" step="1" required placeholder="Ex. 125 000" /></label></div><label>Nom du parent / tuteur<input name="guardian" maxlength="80" placeholder="Nom du responsable" /></label><label>Téléphone du parent<input name="phone" type="tel" maxlength="30" placeholder="+223 ..." /></label><div class="form-error" id="form-error" role="alert"></div><div class="modal-actions"><button type="button" class="button button-secondary" data-action="close-modal">Annuler</button><button type="submit" class="button button-primary">Ajouter l’élève</button></div></form>
    </section></div>`;
  document.querySelector("#student-form [name=firstName]").focus();
}

function inviteUserModal() {
  document.querySelector("#modal-root").innerHTML = `
    <div class="modal-backdrop" data-modal-backdrop><section class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <button class="modal-close" data-action="close-modal" aria-label="Fermer">×</button><div class="modal-icon">✉</div><p class="eyebrow">INVITATION · MODE DÉMO</p><h2 id="modal-title">Simuler une invitation</h2><p class="modal-subtitle">Ajoutez un compte fictif à l’équipe. Aucun email ne sera envoyé.</p>
      <form id="invite-form"><label>Nom du membre<input name="name" required maxlength="80" placeholder="Ex. Mariam Coulibaly" /></label><label>Adresse email<input name="email" type="email" required maxlength="120" placeholder="nom@ecole.ml" /></label><label>Rôle<select name="role"><option>Comptabilité</option><option>Direction</option><option>Administrateur</option></select></label><div class="payment-demo-note">Cette invitation restera locale à cette démo.</div><div class="form-error" id="form-error" role="alert"></div><div class="modal-actions"><button type="button" class="button button-secondary" data-action="close-modal">Annuler</button><button type="submit" class="button button-primary">Créer l’invitation fictive</button></div></form>
    </section></div>`;
  document.querySelector("#invite-form [name=name]").focus();
}

function showAccountModal() {
  document.querySelector("#modal-root").innerHTML = `
    <div class="modal-backdrop" data-modal-backdrop><section class="modal account-modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <button class="modal-close" data-action="close-modal" aria-label="Fermer">×</button><span class="user-avatar account-avatar-large">AD</span><p class="eyebrow">SESSION DE DÉMONSTRATION</p><h2 id="modal-title">Admin École</h2><p class="modal-subtitle">admin@hirondelles.ml · Administrateur</p><div class="account-demo-note"><strong>Connexion fictive</strong><p>Aucun compte réel, mot de passe ni session sécurisée n’est utilisé dans cette version.</p></div><div class="modal-actions"><button class="button button-secondary" data-action="close-modal">Fermer</button><button class="button button-primary" data-page="team">Voir l’équipe</button></div>
    </section></div>`;
}

function showWhatsAppPreview(studentId) {
  const student = data.students.find((item) => item.id === studentId);
  if (!student) return;
  const guardian = student.guardian || "Madame, Monsieur";
  const message = `Bonjour ${guardian}, petit rappel : il reste ${money(balance(student))} à régler pour les frais scolaires de ${fullName(student)} à ${data.school}. Merci de contacter l’établissement.`;
  document.querySelector("#modal-root").innerHTML = `
    <div class="modal-backdrop" data-modal-backdrop><section class="modal whatsapp-modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <button class="modal-close" data-action="close-modal" aria-label="Fermer">×</button><div class="whatsapp-icon">◉</div><p class="eyebrow">RAPPEL WHATSAPP · DÉMO</p><h2 id="modal-title">Aperçu du rappel</h2><p class="modal-subtitle">Destinataire : ${escapeHtml(student.phone || "Téléphone non renseigné")}</p><div class="whatsapp-preview">${escapeHtml(message)}</div><p class="payment-demo-note">L’envoi est simulé. Aucun message ne sera transmis à WhatsApp.</p><div class="modal-actions"><button class="button button-secondary" data-action="close-modal">Annuler</button><button class="button button-primary" data-action="simulate-whatsapp" data-id="${student.id}">Simuler l’envoi</button></div>
    </section></div>`;
}

function showStudentDetails(studentId) {
  const student = data.students.find((item) => item.id === studentId);
  if (!student) return;
  const payments = studentPayments(student.id).sort((a, b) => b.date.localeCompare(a.date));
  document.querySelector("#modal-root").innerHTML = `
    <div class="modal-backdrop" data-modal-backdrop><section class="modal details-modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <button class="modal-close" data-action="close-modal" aria-label="Fermer">×</button><div class="student-profile-heading">${avatar(student, "avatar-large")}<div><p class="eyebrow">${escapeHtml(student.id)}</p><h2 id="modal-title">${escapeHtml(fullName(student))}</h2><span>${escapeHtml(student.className)} · ${statusBadge(student)}</span></div></div>
      <div class="detail-balance"><span>Reste à payer</span><strong>${money(balance(student))}</strong><div class="balance-progress"><i style="width:${Math.min(100, Math.round(paidAmount(student.id) / student.annualFee * 100))}%"></i></div><small>${money(paidAmount(student.id))} payé sur ${money(student.annualFee)}</small></div>
      <div class="guardian-info"><span>Parent / tuteur</span><strong>${escapeHtml(student.guardian || "Non renseigné")}</strong><span>Téléphone</span><strong>${escapeHtml(student.phone || "Non renseigné")}</strong></div>
      <div class="detail-history-heading"><h3>Historique des paiements</h3>${payments.length ? `<span>${payments.length}</span>` : ""}</div>${payments.length ? `<div class="detail-payments">${payments.map((payment) => `<div class="detail-payment"><span class="detail-payment-icon">${payment.method === "Espèces" ? "₣" : "◈"}</span><span><strong>${money(payment.amount)}</strong><small>${formattedDate(payment.date)} · ${escapeHtml(payment.method)}</small></span><button class="row-menu" data-action="receipt" data-id="${payment.id}" aria-label="Voir le reçu">↗</button></div>`).join("")}</div>` : `<p class="no-history">Aucun paiement enregistré pour cet élève.</p>`}
      <div class="modal-actions"><button class="button button-secondary" data-action="close-modal">Fermer</button>${balance(student) && student.phone ? `<button class="button button-secondary" data-action="whatsapp-preview" data-id="${student.id}">◉ Rappel WhatsApp</button>` : ""}${balance(student) ? `<button class="button button-primary" data-action="new-payment" data-student-id="${student.id}">＋ Enregistrer un paiement</button>` : ""}</div>
    </section></div>`;
}

function showReceipt(paymentId) {
  const payment = data.payments.find((item) => item.id === paymentId);
  const student = payment && data.students.find((item) => item.id === payment.studentId);
  if (!payment || !student) return;
  document.querySelector("#modal-root").innerHTML = `
    <div class="modal-backdrop" data-modal-backdrop><section class="modal receipt-modal" role="dialog" aria-modal="true" aria-labelledby="receipt-title">
      <button class="modal-close no-print" data-action="close-modal" aria-label="Fermer">×</button><div class="receipt-paper">${payment.simulated ? '<span class="receipt-simulation">PAIEMENT SIMULÉ · AUCUN DÉBIT EFFECTUÉ</span>' : ""}<div class="receipt-brand"><span class="brand-mark">f<span>.</span></span><div><strong>${escapeHtml(data.school)}</strong><small>${escapeHtml(data.year)}</small></div></div><div class="receipt-divider"></div><p class="receipt-label">REÇU DE PAIEMENT</p><h2 id="receipt-title">${escapeHtml(payment.id)}</h2><div class="receipt-amount"><small>Montant reçu</small><strong>${money(Number(payment.amount))}</strong></div><div class="receipt-lines"><div><span>Élève</span><strong>${escapeHtml(fullName(student))}</strong></div><div><span>Classe</span><strong>${escapeHtml(student.className)}</strong></div><div><span>Date</span><strong>${formattedDate(payment.date)}</strong></div><div><span>Mode de paiement</span><strong>${escapeHtml(payment.method)}${payment.simulated ? " · simulation" : ""}</strong></div>${payment.note ? `<div><span>Note</span><strong>${escapeHtml(payment.note)}</strong></div>` : ""}</div><div class="receipt-divider"></div><p class="receipt-thanks">Merci pour votre règlement.</p><p class="receipt-footnote">Reçu généré par FinSchool · Document à conserver</p></div><div class="modal-actions no-print"><button class="button button-secondary" data-action="close-modal">Fermer</button><button class="button button-primary" data-action="print-receipt">Imprimer le reçu <span>↗</span></button></div>
    </section></div>`;
}

document.addEventListener("click", (event) => {
  const target = event.target.closest("[data-page], [data-filter], [data-action], [data-modal-backdrop]");
  if (!target) return;
  if (target.dataset.page) {
    activePage = target.dataset.page;
    if (target.dataset.filter) studentFilter = target.dataset.filter;
    searchQuery = "";
    render();
  } else if (target.dataset.filter) {
    studentFilter = target.dataset.filter;
    render();
  } else {
    switch (target.dataset.action) {
      case "new-payment":
        studentPaymentModal(target.dataset.studentId || "");
        break;
      case "add-student":
        addStudentModal();
        break;
      case "student-details":
        showStudentDetails(target.dataset.id);
        break;
      case "invite-user":
        inviteUserModal();
        break;
      case "account":
        showAccountModal();
        break;
      case "account-details": {
        const member = data.team.find((item) => item.id === target.dataset.id);
        if (member) showToast(`${member.name} · ${member.role} · ${member.status} (compte fictif)`);
        break;
      }
      case "simulate-sync":
        data.sync.lastSync = new Date().toISOString();
        saveData();
        render();
        showToast("Synchronisation simulée. Les données restent sur cet appareil.");
        break;
      case "whatsapp-preview":
        showWhatsAppPreview(target.dataset.id);
        break;
      case "simulate-whatsapp": {
        const student = data.students.find((item) => item.id === target.dataset.id);
        document.querySelector("#modal-root").innerHTML = "";
        if (student) showToast(`Rappel WhatsApp simulé pour ${student.guardian || fullName(student)}. Aucun message envoyé.`);
        break;
      }
      case "receipt":
        showReceipt(target.dataset.id);
        break;
      case "close-modal":
        document.querySelector("#modal-root").innerHTML = "";
        break;
      case "print-receipt":
        window.print();
        break;
      case "help":
        alert("FinSchool vous aide à suivre les frais annuels, enregistrer les règlements reçus et imprimer des reçus. Les données de cette version sont conservées dans ce navigateur.");
        break;
    }
  }
  if (target.dataset.modalBackdrop !== undefined && event.target === target) document.querySelector("#modal-root").innerHTML = "";
});

document.addEventListener("input", (event) => {
  if (event.target.id === "student-search") {
    const cursor = event.target.selectionStart;
    searchQuery = event.target.value;
    document.querySelector(".page-container").innerHTML = studentsPage();
    const input = document.querySelector("#student-search");
    input.focus();
    input.setSelectionRange(cursor, cursor);
  }
});

document.addEventListener("change", (event) => {
  if (event.target.name === "method" && event.target.closest("#payment-form")) {
    const submit = document.querySelector("#payment-submit");
    if (submit) submit.textContent = event.target.value === "Mobile money" ? "Simuler le paiement" : "Enregistrer le paiement";
  }
});

document.addEventListener("submit", (event) => {
  if (event.target.id === "payment-form") {
    event.preventDefault();
    const form = new FormData(event.target);
    const student = data.students.find((item) => item.id === form.get("studentId"));
    const amount = Number(form.get("amount"));
    const error = document.querySelector("#form-error");
    if (!student) {
      error.textContent = "Veuillez sélectionner un élève.";
      return;
    }
    if (!Number.isSafeInteger(amount) || amount <= 0) {
      error.textContent = "Saisissez un montant valide supérieur à zéro.";
      return;
    }
    if (balance(student) === 0) {
      error.textContent = "Cet élève n’a plus de solde à régler.";
      return;
    }
    if (amount > balance(student)) {
      error.textContent = `Le montant ne peut pas dépasser le solde de ${money(balance(student))}.`;
      return;
    }
    const payment = {
      id: `REC-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`,
      studentId: student.id,
      amount,
      method: form.get("method"),
      simulated: form.get("method") === "Mobile money",
      date: form.get("date"),
      note: String(form.get("note") || "").trim()
    };
    data.payments.push(payment);
    saveData();
    document.querySelector("#modal-root").innerHTML = "";
    render();
    showReceipt(payment.id);
  } else if (event.target.id === "student-form") {
    event.preventDefault();
    const form = new FormData(event.target);
    const annualFee = Number(form.get("annualFee"));
    if (!Number.isSafeInteger(annualFee) || annualFee <= 0) {
      document.querySelector("#form-error").textContent = "Les frais annuels doivent être un montant valide supérieur à zéro.";
      return;
    }
    const student = {
      id: `EL-${String(Date.now()).slice(-6)}`,
      firstName: String(form.get("firstName")).trim(),
      lastName: String(form.get("lastName")).trim(),
      className: String(form.get("className")).trim(),
      guardian: String(form.get("guardian") || "").trim(),
      phone: String(form.get("phone") || "").trim(),
      annualFee
    };
    data.students.push(student);
    saveData();
    document.querySelector("#modal-root").innerHTML = "";
    activePage = "students";
    studentFilter = "all";
    render();
  } else if (event.target.id === "invite-form") {
    event.preventDefault();
    const form = new FormData(event.target);
    const email = String(form.get("email")).trim();
    if (data.team.some((member) => member.email.toLowerCase() === email.toLowerCase())) {
      document.querySelector("#form-error").textContent = "Cette adresse figure déjà dans l’équipe.";
      return;
    }
    data.team.push({
      id: `USR-${String(Date.now()).slice(-6)}`,
      name: String(form.get("name")).trim(),
      email,
      role: String(form.get("role")),
      status: "Invitation simulée"
    });
    saveData();
    document.querySelector("#modal-root").innerHTML = "";
    render();
    showToast(`Invitation fictive créée pour ${email}. Aucun email envoyé.`);
  }
});

document.addEventListener("keydown", (event) => {
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
    event.preventDefault();
    if (activePage !== "students") {
      activePage = "students";
      render();
    }
    document.querySelector("#student-search")?.focus();
  }
  if (event.key === "Escape") document.querySelector("#modal-root").innerHTML = "";
});

render();
