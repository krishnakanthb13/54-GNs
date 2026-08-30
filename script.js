'use strict';

// ===== Configuration =====
const START_DATE = "2026-06-01"; // Adjusted so that 2026-07-13 aligns with Flat 7
// To change flat order, simply reorder the items in this array.
// To add a tenant, fill in the 'tenant' property (e.g. { name: "Flat 1", tenant: "John" }).
const FLATS = [
  { name: "Flat 1", tenant: "Sathyanarayana G" },
  { name: "Flat 2", tenant: "Bala Subramaniam" },
  { name: "Flat 3", tenant: "Balaji" },
  { name: "Flat 4", tenant: "Gopal" },
  { name: "Flat 5", tenant: "Kishore" },
  { name: "Flat 6", tenant: "Venkatesan" },
  { name: "Flat 7", tenant: "Krishna Kanth B" },
  { name: "Flat 8", tenant: "Sathyanarayana" }
];
const INSTRUCTIONS = [
  { title: "Morning", items: ["Turn ON and OFF motor", "Check overhead tank for overflowing"] },
  { title: "Evening", items: ["Turn ON and OFF motor", "Check overhead tank for overflowing"] },
  { title: "If Unavailable", items: ["Inform WhatsApp group", "Request another resident to help"] },
  { title: "Emergency", items: ["Report pump issues immediately"] }
];
const UPCOMING_WEEKS = 8;
const PREVIOUS_WEEKS = 8;

// ===== Date Helpers =====
const MONDAY = 1;

function getMonday(d) {
  const dt = new Date(d);
  const day = dt.getDay();
  const diff = day === 0 ? -6 : MONDAY - day;
  dt.setDate(dt.getDate() + diff);
  return new Date(dt.getFullYear(), dt.getMonth(), dt.getDate());
}

function addDays(d, n) {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

function fmt(d) {
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function fmtShort(d) {
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

function fmtWithYear(d) {
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function fmtFull(d) {
  return d.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
}

function getISOWeek(d) {
  const dt = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = dt.getUTCDay() || 7;
  dt.setUTCDate(dt.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(dt.getUTCFullYear(), 0, 1));
  return Math.ceil((((dt - yearStart) / 86400000) + 1) / 7);
}

function daysBetween(a, b) {
  return Math.round((b - a) / 86400000);
}

// ===== Core Calculation =====
function getWeekIndex(date) {
  const monday = getMonday(date);
  const start = new Date(START_DATE);
  const weeks = Math.floor(daysBetween(start, monday) / 7);
  return weeks;
}

function getResponsibleFlat(date) {
  const idx = getWeekIndex(date);
  const flatIdx = ((idx % FLATS.length) + FLATS.length) % FLATS.length;
  const flatData = FLATS[flatIdx];
  const flatDisplay = flatData.tenant ? `${flatData.name} (${flatData.tenant})` : flatData.name;
  return { flat: flatDisplay, index: flatIdx, weekIdx: idx, flatName: flatData.name, tenant: flatData.tenant };
}

function getWeekRange(date) {
  const monday = getMonday(date);
  const sunday = addDays(monday, 6);
  return { start: monday, end: sunday };
}

// ===== DOM =====
const $ = (s) => document.querySelector(s);
const $$ = (s) => document.querySelectorAll(s);

// ===== Render Functions =====
function renderStatus() {
  const now = new Date();
  const { start, end } = getWeekRange(now);
  const daysLeft = 7 - ((now.getDay() + 6) % 7);
  const { flat } = getResponsibleFlat(now);

  $('#todayDate').textContent = fmtFull(now);
  $('#weekNumber').textContent = `W${getISOWeek(now)}`;
  $('#weekPeriod').textContent = `${fmtShort(start)} – ${fmtShort(end)}`;
  $('#currentFlat').textContent = flat;

  const countdown = $('#countdown');
  countdown.textContent = daysLeft === 7 ? 'Today' : `${daysLeft} Day${daysLeft !== 1 ? 's' : ''} Remaining`;
  countdown.className = 'status-value countdown ' +
    (daysLeft > 4 ? 'green' : daysLeft >= 2 ? 'orange' : 'red');
}

function renderResponsible() {
  const now = new Date();
  const { flat, index } = getResponsibleFlat(now);
  const { start, end } = getWeekRange(now);

  $('#responsibleFlat').textContent = flat;
  $('#cycleProgress').textContent = `${index + 1} of ${FLATS.length}`;
  $('#dutyStart').textContent = fmt(start);
  $('#dutyEnd').textContent = fmt(end);
  $('#progressFill').style.width = `${((index + 1) / FLATS.length) * 100}%`;
}

function renderInstructions() {
  const html = INSTRUCTIONS.map(g =>
    `<div class="instruction-group"><h3>${g.title}</h3><ul>${g.items.map(i => `<li>${i}</li>`).join('')}</ul></div>`
  ).join('');
  $('#instructionsList').innerHTML = html;
}

function renderCalendar() {
  const now = new Date();
  const month = now.getMonth();
  const year = now.getFullYear();
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  $('#calMonth').textContent = `${monthNames[month]} ${year}`;

  const firstDay = new Date(year, month, 1);
  let startDow = firstDay.getDay();
  startDow = startDow === 0 ? 6 : startDow - 1;
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const { start: dutyStart, end: dutyEnd } = getWeekRange(now);
  const today = now.getDate();

  let html = '';
  for (let i = 0; i < startDow; i++) html += '<div class="cal-day empty"></div>';
  for (let d = 1; d <= daysInMonth; d++) {
    let cls = 'cal-day';
    if (d === today) cls += ' today';
    else if (month === dutyStart.getMonth() && year === dutyStart.getFullYear() && d >= dutyStart.getDate() && d <= dutyEnd.getDate()) cls += ' duty-week';
    html += `<div class="${cls}">${d}</div>`;
  }
  $('#calDays').innerHTML = html;
}

function renderTimeline() {
  const now = new Date();
  const items = [];

  for (let i = -1; i <= 1; i++) {
    const weekDate = addDays(now, i * 7);
    const { flat } = getResponsibleFlat(weekDate);
    const weekNum = getISOWeek(weekDate);
    const isCurrent = i === 0;
    items.push(`
      <div class="timeline-item${isCurrent ? ' current' : ''}">
        <div class="timeline-left">
          <div class="timeline-label">${i === 0 ? 'Current' : i < 0 ? 'Previous' : 'Next'}</div>
          <div class="timeline-flat">${flat}</div>
        </div>
        <div class="timeline-right">
          <div class="timeline-week">W${weekNum}</div>
        </div>
      </div>
    `);
  }
  $('#timeline').innerHTML = items.join('');
}

function renderSchedule(containerId, weeks, direction) {
  const now = new Date();
  const html = [];
  for (let i = 1; i <= weeks; i++) {
    const weekDate = addDays(now, direction * i * 7);
    const { flatName, tenant } = getResponsibleFlat(weekDate);
    const { start, end } = getWeekRange(weekDate);
    const weekNum = getISOWeek(start);
    html.push(`
      <div class="schedule-tr">
        <span class="schedule-td week">W${weekNum}</span>
        <span class="schedule-td flat">${flatName}</span>
        <span class="schedule-td tenant" title="${tenant || ''}">${tenant || '-'}</span>
        <span class="schedule-td from">${fmtWithYear(start)}</span>
        <span class="schedule-td to">${fmtWithYear(end)}</span>
      </div>
    `);
  }
  $(containerId).innerHTML = html.join('');
}

function renderSearch(query) {
  const result = $('#searchResult');
  if (!query.trim()) { result.classList.add('hidden'); return; }

  const q = query.toLowerCase();
  const flatObj = FLATS.find(f => f.name.toLowerCase().includes(q) || (f.tenant && f.tenant.toLowerCase().includes(q)));
  if (!flatObj) { result.textContent = 'No flat found.'; result.classList.remove('hidden'); return; }

  const flatDisplay = flatObj.tenant ? `${flatObj.name} (${flatObj.tenant})` : flatObj.name;

  const now = new Date();
  const flatIdx = FLATS.indexOf(flatObj);
  const currentWeek = getWeekIndex(now);
  const currentFlatIdx = ((currentWeek % FLATS.length) + FLATS.length) % FLATS.length;
  let weeksUntil = (flatIdx - currentFlatIdx + FLATS.length) % FLATS.length;
  if (weeksUntil === 0) weeksUntil = FLATS.length;

  const nextDate = addDays(now, weeksUntil * 7);
  const { start: nextStart, end: nextEnd } = getWeekRange(nextDate);

  const prevWeeks = FLATS.length - weeksUntil;
  const prevDate = addDays(now, -prevWeeks * 7);
  const { start: prevStart, end: prevEnd } = getWeekRange(prevDate);

  let upcoming = '';
  for (let i = 1; i <= 4; i++) {
    const w = weeksUntil + (i - 1) * FLATS.length;
    const d = addDays(now, w * 7);
    const { start: s, end: e } = getWeekRange(d);
    upcoming += `<div style="margin-top:6px;font-size:0.82rem;">• ${fmtWithYear(s)} – ${fmtWithYear(e)}</div>`;
  }

  result.innerHTML = `
    <strong>${flatDisplay}</strong>
    <div style="margin-top:8px;">
      <div>Next duty: <strong>${fmt(nextStart)} – ${fmt(nextEnd)}</strong> (${weeksUntil} week${weeksUntil > 1 ? 's' : ''} away)</div>
      <div>Previous: ${fmt(prevStart)} – ${fmt(prevEnd)}</div>
      <div style="margin-top:6px;font-weight:600;">Upcoming cycles:</div>
      ${upcoming}
    </div>
  `;
  result.classList.remove('hidden');
}

// ===== Toast System =====
function showToast(message, icon = '') {
  const container = $('#toastContainer');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerHTML = `${icon ? `<span>${icon}</span>` : ''}<span>${message}</span>`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.remove();
  }, 2500);
}

// ===== Theme System =====
const THEMES = [
  { id: 'dark-slate', name: 'Dark Slate', icon: '🌙', themeColor: '#0b1329', isDark: true },
  { id: 'dark-violet', name: 'Obsidian Violet', icon: '🔮', themeColor: '#0d0a1a', isDark: true },
  { id: 'dark-emerald', name: 'Forest Emerald', icon: '🌲', themeColor: '#061712', isDark: true },
  { id: 'light-clean', name: 'Pure Sky', icon: '☀️', themeColor: '#f8fafc', isDark: false },
  { id: 'light-warm', name: 'Warm Sand', icon: '☕', themeColor: '#faf6f0', isDark: false },
  { id: 'light-mint', name: 'Fresh Mint', icon: '🍃', themeColor: '#f0fdf4', isDark: false }
];

function applyTheme(themeId, showToastNotification = false) {
  let theme = THEMES.find(t => t.id === themeId);
  if (!theme) {
    if (themeId === 'dark') theme = THEMES[0];
    else if (themeId === 'light') theme = THEMES[3];
    else theme = THEMES[0];
  }
  document.documentElement.setAttribute('data-theme', theme.id);
  localStorage.setItem('theme', theme.id);

  const themeToggle = $('#themeToggle');
  if (themeToggle) {
    themeToggle.textContent = theme.icon;
    themeToggle.setAttribute('title', `Theme: ${theme.name} (Click to switch)`);
    themeToggle.setAttribute('aria-label', `Current theme: ${theme.name}. Click to switch.`);
  }

  const metaTheme = $('meta[name="theme-color"]');
  if (metaTheme) {
    metaTheme.setAttribute('content', theme.themeColor);
  }

  if (showToastNotification) {
    showToast(`Theme: ${theme.name} (${theme.isDark ? 'Dark' : 'Light'})`, theme.icon);
  }
}

function cycleTheme() {
  const currentId = document.documentElement.getAttribute('data-theme') || 'dark-slate';
  const currentIndex = THEMES.findIndex(t => t.id === currentId);
  const nextIndex = (currentIndex + 1) % THEMES.length;
  applyTheme(THEMES[nextIndex].id, true);
}

function loadTheme() {
  const saved = localStorage.getItem('theme') || 'dark-slate';
  applyTheme(saved, false);
}

// ===== Bill Modal & Maintenance Parser =====
let currentBillGroups = [];
let rawBillText = '';

const DEFAULT_MAINTENANCE_TEXT = `- September 2026

- August 2026
House Keeping: 3000
Electricity Bill: 906
Broom Stick: 200

- July 2026
House Keeping: 3000

- 29 July 2026
Drainage Cleaning: 2500

- June 2026
House Keeping: 3000
Electricity Bill: 823

- May 2026
House Keeping: 2000
Drainage Cleaning: 1200

- April 2026
House Keeping: 3000
Electricity Bill: 1729
Flowers: 250

- 12 April 2026
Sump & Tank Cleaning: 3500

- March 2026
House Keeping: 3000
Flowers: 110
EB Expenses: 100
Broom Stick: 200

- 26 March 2026
Main Gate Keys: 1550`;

function isSpecificDate(header) {
  // If header starts with a digit (e.g. "12 April 2026", "29 July 2026", "26 March 2026")
  return /^\d/.test(header.trim());
}

function formatINR(val) {
  const isFraction = val % 1 !== 0;
  return '₹' + val.toLocaleString('en-IN', {
    minimumFractionDigits: isFraction ? 2 : 0,
    maximumFractionDigits: 2
  });
}

function parseMaintenance(text) {
  const groups = [];
  let current = null;
  for (const raw of text.split('\n')) {
    const line = raw.trim();
    if (!line) continue;
    if (line.startsWith('-')) {
      if (current) groups.push(current);
      current = { header: line.replace(/^-+\s*/, '').trim(), items: [] };
    } else if (current && line.includes(':')) {
      const idx = line.indexOf(':');
      const name = line.slice(0, idx).trim();
      const valStr = line.slice(idx + 1).replace(/[^\d.]/g, '');
      const val = parseFloat(valStr);
      if (name && !isNaN(val)) {
        current.items.push({ name, amount: val });
      }
    }
  }
  if (current) groups.push(current);
  return groups;
}

function renderBillStats(groups) {
  const statsContainer = $('#billStatsGrid');
  if (!statsContainer) return;
  const activeGroups = groups.filter(g => g.items.length > 0);
  const totalAll = groups.reduce((acc, g) => acc + g.items.reduce((s, it) => s + it.amount, 0), 0);
  const perTenantAll = totalAll / 8;
  const monthlyCount = activeGroups.filter(g => !isSpecificDate(g.header)).length;
  const specialCount = activeGroups.filter(g => isSpecificDate(g.header)).length;

  statsContainer.innerHTML = `
    <div class="status-item">
      <span class="status-label">Total Expenses</span>
      <span class="status-value">${formatINR(totalAll)}</span>
    </div>
    <div class="status-item">
      <span class="status-label">Per Flat (÷8)</span>
      <span class="status-value" style="color:var(--accent); font-weight:700;">${formatINR(perTenantAll)}</span>
    </div>
    <div class="status-item">
      <span class="status-label">Recorded Cycles</span>
      <span class="status-value" style="font-size:0.86rem;">${monthlyCount} Monthly · ${specialCount} Special</span>
    </div>
  `;
}

function renderBillGroups(groups, filterQuery = '') {
  const container = $('#billContent');
  if (!groups.length) {
    container.innerHTML = '<div class="card bill-empty-state">No billing data found in maintenance.txt</div>';
    return;
  }

  const q = filterQuery.toLowerCase().trim();
  let displayedGroups = groups;
  if (q) {
    displayedGroups = groups.map(g => {
      const headerMatches = g.header.toLowerCase().includes(q);
      const filteredItems = g.items.filter(it => it.name.toLowerCase().includes(q));
      if (headerMatches) return g;
      if (filteredItems.length > 0) return { header: g.header, items: filteredItems };
      return null;
    }).filter(Boolean);
  }

  if (!displayedGroups.length) {
    container.innerHTML = `<div class="card bill-empty-state">No entries matching "${filterQuery}"</div>`;
    return;
  }

  container.innerHTML = displayedGroups.map(g => {
    const isSpecial = isSpecificDate(g.header);
    const total = g.items.reduce((s, it) => s + it.amount, 0);
    const perTenant = total / 8;

    // If no entries, do not show total or per flat share
    if (g.items.length === 0) {
      return `
        <section class="card bill-period-card ${isSpecial ? 'bill-special-card' : ''}">
          <div class="bill-period-header">
            <div class="bill-period-header-left">
              <h2 class="card-title bill-period-title" style="margin-bottom:0;">${isSpecial ? '🛠️' : '📅'} ${g.header}</h2>
              ${isSpecial ? '<span class="bill-special-badge">⚡ Special Expense</span>' : '<span class="bill-monthly-badge">📅 Monthly</span>'}
            </div>
            <span class="bill-period-empty-badge">No entries</span>
          </div>
          <div class="bill-empty-row">No expenses recorded for this period</div>
        </section>
      `;
    }

    const rowsHtml = g.items.map(it => `
      <div class="bill-table-row">
        <span class="bill-item-name"><span class="bill-item-bullet">•</span> ${it.name}</span>
        <span class="bill-item-amount">${formatINR(it.amount)}</span>
      </div>
    `).join('');

    return `
      <section class="card bill-period-card ${isSpecial ? 'bill-special-card' : ''}">
        <div class="bill-period-header">
          <div class="bill-period-header-left">
            <h2 class="card-title bill-period-title" style="margin-bottom:0;">${isSpecial ? '🛠️' : '📅'} ${g.header}</h2>
            ${isSpecial ? '<span class="bill-special-badge">⚡ Special Expense</span>' : '<span class="bill-monthly-badge">📅 Monthly</span>'}
          </div>
          <span class="bill-period-badge">${g.items.length} item${g.items.length !== 1 ? 's' : ''}</span>
        </div>
        <div class="bill-table">
          <div class="bill-table-head">
            <span>${isSpecial ? 'Special Particulars / Work Done' : 'Utility / Particulars'}</span>
            <span>Amount</span>
          </div>
          <div class="bill-table-body">
            ${rowsHtml}
          </div>
          <div class="bill-period-footer">
            <div class="bill-subtotal-row">
              <span>${isSpecial ? 'Special Total Expenses' : 'Monthly Total Expenses'}</span>
              <span class="bill-subtotal-val">${formatINR(total)}</span>
            </div>
            <div class="bill-tenant-row">
              <span>👤 Per Flat Share (÷8)</span>
              <span class="bill-tenant-val">${formatINR(perTenant)}</span>
            </div>
          </div>
        </div>
      </section>
    `;
  }).join('');
}

async function loadAndRenderBills() {
  const content = $('#billContent');
  let text = '';
  try {
    const res = await fetch(`./maintenance.txt?t=${Date.now()}`, { cache: 'no-store' });
    if (!res.ok) throw new Error('Fetch failed');
    text = await res.text();
  } catch (err) {
    text = DEFAULT_MAINTENANCE_TEXT;
  }

  if (text && text.trim()) {
    rawBillText = text;
    currentBillGroups = parseMaintenance(rawBillText);
    renderBillStats(currentBillGroups);
    const searchVal = $('#billSearchInput') ? $('#billSearchInput').value : '';
    renderBillGroups(currentBillGroups, searchVal);
  } else {
    content.innerHTML = '<div class="card bill-empty-state">No billing data available.</div>';
  }
}

// ===== Page Views Navigation =====
function showView(viewName, updateHistory = true) {
  const rotationView = $('#rotationView');
  const billsView = $('#billsView');
  const backBtn = $('#backBtn');
  const pageTitle = $('#pageTitle');

  if (viewName === 'bills') {
    rotationView.classList.add('hidden');
    billsView.classList.remove('hidden');
    backBtn.classList.remove('hidden');
    pageTitle.textContent = 'Maintenance Bills';
    if (updateHistory && window.location.hash !== '#bills') {
      history.pushState({ view: 'bills' }, '', '#bills');
    }
    loadAndRenderBills();
  } else {
    billsView.classList.add('hidden');
    rotationView.classList.remove('hidden');
    backBtn.classList.add('hidden');
    pageTitle.textContent = '54GNs Apartments Water Motor Rotation';
    if (updateHistory && window.location.hash === '#bills') {
      history.pushState('', document.title, window.location.pathname + window.location.search);
    }
  }
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function copyBillsSummary() {
  if (!currentBillGroups.length) return;
  let summary = `54GNs Apartments - Maintenance Bills Summary\n\n`;
  let grandTotal = 0;
  for (const g of currentBillGroups) {
    if (g.items.length === 0) continue;
    const tot = g.items.reduce((s, it) => s + it.amount, 0);
    const perTen = tot / 8;
    grandTotal += tot;
    const isSpecial = isSpecificDate(g.header);
    summary += `${isSpecial ? '⚡ [SPECIAL EXPENSE] ' : '📅 '}${g.header}\n`;
    for (const it of g.items) {
      summary += `  • ${it.name}: ${formatINR(it.amount)}\n`;
    }
    summary += `  Total: ${formatINR(tot)} | Per Flat (÷8): ${formatINR(perTen)}\n\n`;
  }
  summary += `💰 Grand Total: ${formatINR(grandTotal)} | Overall Per Flat: ${formatINR(grandTotal / 8)}`;

  navigator.clipboard.writeText(summary).then(() => {
    showToast('Copied bill summary to clipboard!', '📋');
  });
}

function printCurrentView() {
  window.print();
}

// ===== Actions =====
function copyWeekInfo() {
  const now = new Date();
  const { flat } = getResponsibleFlat(now);
  const { start, end } = getWeekRange(now);
  const weekNum = getISOWeek(start);
  const text = `This week's Water Motor Rotation\nWeek ${weekNum}\n${fmt(start)} – ${fmt(end)}\nResponsible: ${flat}`;
  navigator.clipboard.writeText(text).then(() => {
    const btn = $('#copyBtn');
    btn.textContent = '✅ Copied!';
    showToast('Copied rotation details!', '📋');
    setTimeout(() => { btn.textContent = '📋 Copy'; }, 1500);
  });
}

function shareWeekInfo() {
  const now = new Date();
  const { flat } = getResponsibleFlat(now);
  const { start, end } = getWeekRange(now);
  const weekNum = getISOWeek(start);
  const text = `This week's Water Motor Rotation\nWeek ${weekNum}\n${fmt(start)} – ${fmt(end)}\nResponsible: ${flat}`;
  if (navigator.share) {
    navigator.share({ title: 'Water Motor Rotation', text });
  } else {
    navigator.clipboard.writeText(text).then(() => {
      showToast('Copied to clipboard!', '📋');
    });
  }
}

function exportCSV() {
  const rows = [['Week', 'Start', 'End', 'Flat']];
  const now = new Date();
  for (let i = -PREVIOUS_WEEKS; i <= UPCOMING_WEEKS; i++) {
    const d = addDays(now, i * 7);
    const { flat } = getResponsibleFlat(d);
    const { start, end } = getWeekRange(d);
    rows.push([getISOWeek(start), fmt(start), fmt(end), flat]);
  }
  const csv = rows.map(r => r.join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'motor-rotation-schedule.csv';
  a.click();
}

// ===== Event Listeners & Init =====
function init() {
  loadTheme();
  renderStatus();
  renderResponsible();
  renderInstructions();
  renderCalendar();
  renderTimeline();
  renderSchedule('#upcomingBody', UPCOMING_WEEKS, 1);
  renderSchedule('#previousBody', PREVIOUS_WEEKS, -1);
  loadAndRenderBills();

  $('#lastUpdated').textContent = `Last Updated: ${fmtFull(new Date())}`;

  // Header events & Page views
  $('#themeToggle').addEventListener('click', cycleTheme);
  $('#printBtn').addEventListener('click', printCurrentView);
  $('#billBtn').addEventListener('click', () => showView('bills'));
  $('#backBtn').addEventListener('click', () => showView('rotation'));
  $('#billCopyBtn').addEventListener('click', copyBillsSummary);
  $('#billPrintBtn').addEventListener('click', printCurrentView);

  // Search filter for bills
  const billSearch = $('#billSearchInput');
  if (billSearch) {
    let billSearchTimer;
    billSearch.addEventListener('input', (e) => {
      clearTimeout(billSearchTimer);
      billSearchTimer = setTimeout(() => {
        renderBillGroups(currentBillGroups, e.target.value);
      }, 150);
    });
  }

  // Hash deep-linking
  if (window.location.hash === '#bills') {
    showView('bills', false);
  }
  window.addEventListener('popstate', () => {
    if (window.location.hash === '#bills') {
      showView('bills', false);
    } else {
      showView('rotation', false);
    }
  });

  // Schedule page actions
  $('#copyBtn').addEventListener('click', copyWeekInfo);
  $('#shareBtn').addEventListener('click', shareWeekInfo);
  $('#exportCsvBtn').addEventListener('click', exportCSV);
  $('#exportPdfBtn').addEventListener('click', printCurrentView);

  if (navigator.share) $('#shareBtn').classList.remove('hidden');

  let searchTimeout;
  $('#searchInput').addEventListener('input', (e) => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => renderSearch(e.target.value), 200);
  });

  // Daily refresh
  setInterval(renderStatus, 86400000);

  // Hide loading overlay
  requestAnimationFrame(() => {
    $('#loadingOverlay').classList.add('hide');
    setTimeout(() => $('#loadingOverlay').remove(), 400);
  });
}

document.addEventListener('DOMContentLoaded', init);

// Service Worker
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js').catch(() => { });
}
