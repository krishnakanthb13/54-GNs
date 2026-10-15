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

// Escape untrusted text before inserting into HTML (search queries, file-derived values)
function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

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
  const dutyStartTime = new Date(dutyStart.getFullYear(), dutyStart.getMonth(), dutyStart.getDate()).getTime();
  const dutyEndTime = new Date(dutyEnd.getFullYear(), dutyEnd.getMonth(), dutyEnd.getDate()).getTime();

  let html = '';
  for (let i = 0; i < startDow; i++) html += '<div class="cal-day empty"></div>';
  for (let d = 1; d <= daysInMonth; d++) {
    let cls = 'cal-day';
    const cellTime = new Date(year, month, d).getTime();
    if (d === today) cls += ' today';
    else if (cellTime >= dutyStartTime && cellTime <= dutyEndTime) cls += ' duty-week';
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
        <span class="schedule-td flat">${escapeHtml(flatName)}</span>
        <span class="schedule-td tenant" title="${escapeHtml(tenant || '')}">${escapeHtml(tenant || '-')}</span>
        <span class="schedule-td from">${fmt(start)}</span>
        <span class="schedule-td to">${fmt(end)}</span>
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
  if (!flatObj) {
    result.textContent = 'No flat found.';
    result.classList.remove('hidden');
    if (query.trim().length >= 2) notifyNoMatch('flats', `No flat matching "${query}"`, query);
    return;
  }

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
    upcoming += `<div style="margin-top:6px;font-size:0.82rem;">• ${fmt(s)} – ${fmt(e)}</div>`;
  }

  result.innerHTML = `
    <strong>${escapeHtml(flatDisplay)}</strong>
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
  if (icon) {
    const iconSpan = document.createElement('span');
    iconSpan.textContent = icon;
    toast.appendChild(iconSpan);
  }
  const msgSpan = document.createElement('span');
  msgSpan.textContent = message;
  toast.appendChild(msgSpan);
  container.appendChild(toast);
  setTimeout(() => {
    toast.remove();
  }, 2500);
}

// Fire a "no match" toast only when the query actually changes (avoids per-keystroke spam)
const lastNoMatchQuery = {};
function notifyNoMatch(key, message, query) {
  const q = query.trim();
  if (q.length >= 2 && lastNoMatchQuery[key] !== q) {
    lastNoMatchQuery[key] = q;
    showToast(message, '🔍');
  }
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
let currentPaidEntries = [];
let currentIssues = [];
let rawBillText = '';
let activeBillsTab = 'expenses';
let currentIssueSortId = 'default';
let offlineBillsNotified = false;

const ISSUE_SORT_MODES = [
  { id: 'default', label: 'Default (File)', name: 'Default (File)' },
  { id: 'title-asc', label: 'Title (A–Z)', name: 'Title (A–Z)' },
  { id: 'title-desc', label: 'Title (Z–A)', name: 'Title (Z–A)' },
  { id: 'start-newest', label: 'Start Date (Newest)', name: 'Start Date (Newest)' },
  { id: 'start-oldest', label: 'Start Date (Oldest)', name: 'Start Date (Oldest)' },
  { id: 'end-newest', label: 'End Date (Newest)', name: 'End Date (Newest)' },
  { id: 'end-oldest', label: 'End Date (Oldest)', name: 'End Date (Oldest)' },
  { id: 'status', label: 'Status (Pending First)', name: 'Status (Pending First)' },
  { id: 'status-desc', label: 'Status (Completed First)', name: 'Status (Completed First)' }
];

// `maintenance.txt` is the single source of truth. It is fetched at runtime
// (network-first, with the Service Worker caching the last good copy for offline use).

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

function splitMaintenanceSections(text) {
  const lines = text.split('\n');
  let mode = 'expenses';
  let seenHeader = false;
  const paidLines = [];
  const expenseLines = [];
  const issueLines = [];
  for (const raw of lines) {
    const t = raw.trim();
    if (/^=\s*paid\s*=/i.test(t)) { mode = 'paid'; seenHeader = true; continue; }
    if (/^=\s*expenses?\s*=/i.test(t)) { mode = 'expenses'; seenHeader = true; continue; }
    if (/^=\s*issues?\s*=/i.test(t)) { mode = 'issues'; seenHeader = true; continue; }
    if (mode === 'paid') paidLines.push(raw);
    else if (mode === 'issues') issueLines.push(raw);
    else expenseLines.push(raw);
  }
  if (!seenHeader) return { paidText: '', expensesText: text, issuesText: '' };
  return {
    paidText: paidLines.join('\n'),
    expensesText: expenseLines.join('\n'),
    issuesText: issueLines.join('\n')
  };
}

function parsePaid(text) {
  const entries = [];
  for (const raw of (text || '').split('\n')) {
    const line = raw.trim();
    if (!line) continue;
    const additional = line.startsWith('+');
    const body = (additional || line.startsWith('-'))
      ? line.replace(/^[+\-]+\s*/, '').trim()
      : line;
    if (!body.includes(':')) continue;
    const parts = body.split(':').map(p => p.trim()).filter(p => p.length);
    if (parts.length < 2) continue;
    const amountStr = parts[parts.length - 1].replace(/[^\d.]/g, '');
    const amount = parseFloat(amountStr);
    if (isNaN(amount)) continue;
    let date = '';
    let type = '';
    if (parts.length >= 3) {
      type = parts[parts.length - 2];
      date = parts.slice(0, parts.length - 2).join(': ').trim();
    } else {
      date = parts[0];
      type = 'Paid';
    }
    if (!date) continue;
    entries.push({ date, type: type || 'Paid', amount, additional });
  }
  return entries;
}

function renderPaidStats(entries) {
  const el = $('#paidStatsGrid');
  if (!el) return;
  const total = entries.reduce((s, e) => s + e.amount, 0);
  const monthlyEntries = entries.filter(e => !e.additional);
  const addEntries = entries.filter(e => e.additional);
  const monthlyByType = {};
  for (const e of monthlyEntries) monthlyByType[e.type] = (monthlyByType[e.type] || 0) + e.amount;
  const addByType = {};
  for (const e of addEntries) addByType[e.type] = (addByType[e.type] || 0) + e.amount;
  const lines = [
    ...Object.entries(monthlyByType)
      .sort((a, b) => b[1] - a[1])
      .map(([k, v]) => `💰 ${k}: ${formatINR(v)}`),
    ...Object.entries(addByType)
      .sort((a, b) => b[1] - a[1])
      .map(([k, v]) => `⚡ ${k}: ${formatINR(v)}`)
  ];
  const tooltip = (lines.join('&#10;') || 'No collections yet').replace(/"/g, '&quot;');
  el.innerHTML = `
    <div class="status-item">
      <span class="status-label">Total Collected</span>
      <span class="status-value" style="color:var(--green); font-weight:700;">${formatINR(total)}</span>
    </div>
    <div class="status-item">
      <span class="status-label">Entries</span>
      <span class="status-value">${entries.length}</span>
    </div>
    <div class="status-item">
      <span class="status-label paid-label-inline">Records${entries.length ? ` <button id="paidInfoBtn" class="paid-info-btn" aria-label="Show full paid breakdown" title="${tooltip}">ⓘ</button>` : ''}</span>
      <span class="status-value" style="font-size:0.86rem;">
        ${monthlyEntries.length} Monthly · ${addEntries.length} Additional
      </span>
    </div>
  `;
  const infoBtn = $('#paidInfoBtn');
  if (infoBtn) {
    infoBtn.addEventListener('click', (ev) => {
      ev.stopPropagation();
      openPaidBreakdown(lines, total);
    });
  }
}

function openPaidBreakdown(lines, totalAmount) {
  const overlay = $('#paidBreakdownModal');
  const body = $('#paidBreakdownBody');
  if (!overlay || !body) return;
  body.innerHTML = lines.length
    ? lines.map(l => {
      const idx = l.indexOf(':');
      const k = l.slice(0, idx).trim();
      const v = l.slice(idx + 1).trim();
      return `<div class="breakdown-row"><span>${k}</span><strong>${v}</strong></div>`;
    }).join('') + `<div class="breakdown-row breakdown-total"><span>Total Collected</span><strong>${formatINR(totalAmount)}</strong></div>`
    : '<div class="bill-empty-row">No collections yet</div>';
  overlay.classList.remove('hidden');
}

function closePaidBreakdown() {
  const overlay = $('#paidBreakdownModal');
  if (overlay) overlay.classList.add('hidden');
}

function renderPaidEntries(entries, filterQuery = '') {
  const container = $('#paidContent');
  if (!container) return;
  if (!entries.length) {
    container.innerHTML = '<div class="card bill-empty-state">No paid collections recorded yet.</div>';
    return;
  }
  const q = filterQuery.toLowerCase().trim();
  const shown = q
    ? entries.filter(e => e.date.toLowerCase().includes(q) || e.type.toLowerCase().includes(q))
    : entries;
  if (!shown.length) {
    container.innerHTML = `<div class="card bill-empty-state">No paid entries matching "${escapeHtml(filterQuery)}"</div>`;
    if (filterQuery.trim().length >= 2) notifyNoMatch('collections', `No collections matching "${filterQuery}"`, filterQuery);
    return;
  }
  container.innerHTML = shown.map(e => `
    <section class="card paid-entry-card${e.additional ? ' paid-entry-card-add' : ''}">
      <div class="paid-entry-left">
        <span class="paid-entry-date">✅ ${escapeHtml(e.date)}</span>
        ${e.additional
          ? `<span class="bill-special-badge">⚡ ${escapeHtml(e.type)}</span>`
          : `<span class="bill-monthly-badge">💰 ${escapeHtml(e.type)}</span>`}
      </div>
      <div class="paid-entry-amount">${formatINR(e.amount)}</div>
    </section>
  `).join('');
}

function switchBillsTab(tab) {
  activeBillsTab = tab === 'paid' ? 'paid' : 'expenses';
  const isPaid = activeBillsTab === 'paid';
  $('#expensesTabBtn').classList.toggle('active', !isPaid);
  $('#paidTabBtn').classList.toggle('active', isPaid);
  $('#expensesPane').classList.toggle('hidden', isPaid);
  $('#paidPane').classList.toggle('hidden', !isPaid);
  $('#expensesSummaryCard').classList.toggle('hidden', isPaid);
  $('#paidSummaryCard').classList.toggle('hidden', !isPaid);
  const copyBtn = $('#billCopyBtn');
  if (copyBtn) copyBtn.textContent = isPaid ? '📋 Copy Paid Summary' : '📋 Copy Summary';
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
  const perTenantAll = totalAll / FLATS.length;
  const monthlyCount = activeGroups.filter(g => !isSpecificDate(g.header)).length;
  const specialCount = activeGroups.filter(g => isSpecificDate(g.header)).length;

  statsContainer.innerHTML = `
    <div class="status-item">
      <span class="status-label">Total Expenses</span>
      <span class="status-value">${formatINR(totalAll)}</span>
    </div>
    <div class="status-item">
      <span class="status-label">Per Flat (÷${FLATS.length})</span>
      <span class="status-value" style="color:var(--accent); font-weight:700;">${formatINR(perTenantAll)}</span>
    </div>
    <div class="status-item">
      <span class="status-label">Recorded Cycles</span>
      <span class="status-value" style="font-size:0.86rem;">${monthlyCount} Monthly · ${specialCount} Additional</span>
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
    container.innerHTML = `<div class="card bill-empty-state">No entries matching "${escapeHtml(filterQuery)}"</div>`;
    if (filterQuery.trim().length >= 2) notifyNoMatch('bills', `No bills matching "${filterQuery}"`, filterQuery);
    return;
  }

  container.innerHTML = displayedGroups.map(g => {
    const isSpecial = isSpecificDate(g.header);
    const total = g.items.reduce((s, it) => s + it.amount, 0);
    const perTenant = total / FLATS.length;

    // If no entries, do not show total or per flat share
    if (g.items.length === 0) {
      return `
        <section class="card bill-period-card ${isSpecial ? 'bill-special-card' : ''}">
          <div class="bill-period-header">
            <div class="bill-period-header-left">
              <h2 class="card-title bill-period-title" style="margin-bottom:0;">${isSpecial ? '🛠️' : '📅'} ${escapeHtml(g.header)}</h2>
              ${isSpecial ? '<span class="bill-special-badge">⚡ Additional Expense</span>' : '<span class="bill-monthly-badge">📅 Monthly</span>'}
            </div>
            <span class="bill-period-empty-badge">No entries</span>
          </div>
          <div class="bill-empty-row">No expenses recorded for this period</div>
        </section>
      `;
    }

    const rowsHtml = g.items.map(it => `
      <div class="bill-table-row">
        <span class="bill-item-name"><span class="bill-item-bullet">•</span> ${escapeHtml(it.name)}</span>
        <span class="bill-item-amount">${formatINR(it.amount)}</span>
      </div>
    `).join('');

    return `
      <section class="card bill-period-card ${isSpecial ? 'bill-special-card' : ''}">
        <div class="bill-period-header">
          <div class="bill-period-header-left">
            <h2 class="card-title bill-period-title" style="margin-bottom:0;">${isSpecial ? '🛠️' : '📅'} ${escapeHtml(g.header)}</h2>
            ${isSpecial ? '<span class="bill-special-badge">⚡ Additional Expense</span>' : '<span class="bill-monthly-badge">📅 Monthly</span>'}
          </div>
          <span class="bill-period-badge">${g.items.length} item${g.items.length !== 1 ? 's' : ''}</span>
        </div>
        <div class="bill-table">
          <div class="bill-table-head">
            <span>${isSpecial ? 'Additional Particulars / Work Done' : 'Utility / Particulars'}</span>
            <span>Amount</span>
          </div>
          <div class="bill-table-body">
            ${rowsHtml}
          </div>
          <div class="bill-period-footer">
            <div class="bill-subtotal-row">
              <span>${isSpecial ? 'Additional Total Expenses' : 'Monthly Total Expenses'}</span>
              <span class="bill-subtotal-val">${formatINR(total)}</span>
            </div>
            <div class="bill-tenant-row">
              <span>👤 Per Flat Share (÷${FLATS.length})</span>
              <span class="bill-tenant-val">${formatINR(perTenant)}</span>
            </div>
          </div>
        </div>
      </section>
    `;
  }).join('');
}

// ===== Issues Parser & Calculations =====
const MONTH_MAP = {
  january: 0, jan: 0,
  february: 1, feb: 1,
  march: 2, mar: 2,
  april: 3, apr: 3,
  may: 4,
  june: 5, jun: 5,
  july: 6, jul: 6,
  august: 7, aug: 7,
  september: 8, sep: 8, sept: 8,
  october: 9, oct: 9,
  november: 10, nov: 10,
  december: 11, dec: 11
};

function parseIssueDate(str) {
  if (!str) return null;
  const clean = str.trim().toLowerCase();
  if (['nill', 'nil', 'none', '-', 'pending', 'ongoing', ''].includes(clean)) {
    return null;
  }
  const match = str.trim().match(/^(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})$/);
  if (match) {
    const day = parseInt(match[1], 10);
    const monthKey = match[2].toLowerCase();
    const year = parseInt(match[3], 10);
    if (monthKey in MONTH_MAP) {
      return new Date(year, MONTH_MAP[monthKey], day);
    }
  }
  const d = new Date(str);
  return isNaN(d.getTime()) ? null : d;
}

function calculateIssueDuration(startDateStr, endDateStr) {
  const start = parseIssueDate(startDateStr);
  const end = parseIssueDate(endDateStr);
  if (!start) return { text: 'N/A', days: null, isOngoing: false };

  if (!end) {
    const now = new Date();
    const diffTime = now - start;
    const days = Math.max(0, Math.round(diffTime / 86400000));
    return {
      text: `${days} day${days !== 1 ? 's' : ''} (Ongoing)`,
      shortText: `${days}d (Ongoing)`,
      days,
      isOngoing: true
    };
  }

  const diffTime = Math.abs(end - start);
  const days = Math.round(diffTime / 86400000);
  const text = days === 0 ? 'Same day' : `${days} day${days !== 1 ? 's' : ''}`;
  return {
    text,
    shortText: days === 0 ? '0d' : `${days}d`,
    days,
    isOngoing: false
  };
}

function isValidIssue(issue) {
  if (!issue) return false;
  const title = (issue.title || '').trim();
  // The first empty one is for a template so ignore it, only pick the ones which has data or details in them.
  if (!title) return false;
  const hasStart = Boolean((issue.startDate || '').trim());
  const hasEnd = Boolean((issue.endDate || '').trim());
  const hasStatus = Boolean((issue.status || '').trim());
  const hasContext = Boolean(issue.context && issue.context.length > 0);
  return hasStart || hasEnd || hasStatus || hasContext;
}

function parseIssues(text) {
  const issues = [];
  const lines = (text || '').split('\n');
  let current = null;
  let inContext = false;

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;

    if (/^Issue\s*:/i.test(line)) {
      if (current && isValidIssue(current)) {
        current.fileIndex = issues.length;
        issues.push(current);
      }
      const title = line.replace(/^Issue\s*:\s*/i, '').trim();
      current = {
        title,
        startDate: '',
        endDate: '',
        status: '',
        context: []
      };
      inContext = false;
      continue;
    }

    if (!current) continue;

    if (/^StartDate\s*:/i.test(line)) {
      current.startDate = line.replace(/^StartDate\s*:\s*/i, '').trim();
      inContext = false;
    } else if (/^EndDate\s*:/i.test(line)) {
      current.endDate = line.replace(/^EndDate\s*:\s*/i, '').trim();
      inContext = false;
    } else if (/^Status\s*:/i.test(line)) {
      current.status = line.replace(/^Status\s*:\s*/i, '').trim();
      inContext = false;
    } else if (/^Context\s*:/i.test(line)) {
      inContext = true;
      const immediate = line.replace(/^Context\s*:\s*/i, '').trim();
      if (immediate) {
        current.context.push(immediate.replace(/^[+\-•*]\s*/, '').trim());
      }
    } else if (inContext) {
      if (line.startsWith('-') || line.startsWith('+') || line.startsWith('•') || line.startsWith('*')) {
        current.context.push(line.replace(/^[+\-•*]\s*/, '').trim());
      } else if (line) {
        current.context.push(line);
      }
    }
  }

  if (current && isValidIssue(current)) {
    current.fileIndex = issues.length;
    issues.push(current);
  }

  return issues;
}

function sortIssues(issues, modeId) {
  const list = [...issues];
  switch (modeId) {
    case 'default':
      return list.sort((a, b) => (a.fileIndex ?? 0) - (b.fileIndex ?? 0));

    case 'title-asc':
      return list.sort((a, b) => a.title.localeCompare(b.title, undefined, { sensitivity: 'base' }));

    case 'title-desc':
      return list.sort((a, b) => b.title.localeCompare(a.title, undefined, { sensitivity: 'base' }));

    case 'start-newest':
      return list.sort((a, b) => {
        const da = parseIssueDate(a.startDate);
        const db = parseIssueDate(b.startDate);
        return (db ? db.getTime() : 0) - (da ? da.getTime() : 0);
      });

    case 'start-oldest':
      return list.sort((a, b) => {
        const da = parseIssueDate(a.startDate);
        const db = parseIssueDate(b.startDate);
        const ta = da ? da.getTime() : Infinity;
        const tb = db ? db.getTime() : Infinity;
        return ta - tb;
      });

    case 'end-newest':
      return list.sort((a, b) => {
        const da = parseIssueDate(a.endDate);
        const db = parseIssueDate(b.endDate);
        const ta = da ? da.getTime() : (a.status?.toLowerCase().includes('pending') ? Number.MAX_SAFE_INTEGER : 0);
        const tb = db ? db.getTime() : (b.status?.toLowerCase().includes('pending') ? Number.MAX_SAFE_INTEGER : 0);
        return tb - ta;
      });

    case 'end-oldest':
      return list.sort((a, b) => {
        const da = parseIssueDate(a.endDate);
        const db = parseIssueDate(b.endDate);
        // Completed/resolved oldest dates first; pending/Nill issues without end dates at end
        const ta = da ? da.getTime() : Number.MAX_SAFE_INTEGER;
        const tb = db ? db.getTime() : Number.MAX_SAFE_INTEGER;
        return ta - tb;
      });

    case 'status':
      return list.sort((a, b) => {
        const sa = (a.status || '').toLowerCase();
        const sb = (b.status || '').toLowerCase();
        const aPending = sa.includes('pending') ? 1 : 0;
        const bPending = sb.includes('pending') ? 1 : 0;
        if (aPending !== bPending) return bPending - aPending;
        return (a.fileIndex ?? 0) - (b.fileIndex ?? 0);
      });

    case 'status-desc':
      return list.sort((a, b) => {
        const sa = (a.status || '').toLowerCase();
        const sb = (b.status || '').toLowerCase();
        const aPending = sa.includes('pending') ? 1 : 0;
        const bPending = sb.includes('pending') ? 1 : 0;
        if (aPending !== bPending) return aPending - bPending;
        return (a.fileIndex ?? 0) - (b.fileIndex ?? 0);
      });

    default:
      return list;
  }
}

function renderIssueStats(issues) {
  const statsContainer = $('#issueStatsGrid');
  if (!statsContainer) return;

  const total = issues.length;
  const completed = issues.filter(i => (i.status || '').toLowerCase().includes('completed')).length;
  const pending = issues.filter(i => (i.status || '').toLowerCase().includes('pending')).length;

  statsContainer.innerHTML = `
    <div class="status-item">
      <span class="status-label">Total Issues Logged</span>
      <span class="status-value">${total}</span>
    </div>
    <div class="status-item">
      <span class="status-label">Resolved</span>
      <span class="status-value" style="color:var(--green); font-weight:700;">✅ ${completed}</span>
    </div>
    <div class="status-item">
      <span class="status-label">Pending</span>
      <span class="status-value" style="color:var(--orange); font-weight:700;">⏳ ${pending}</span>
    </div>
  `;
}

function renderIssues(filterQuery = '') {
  const container = $('#issuesContent');
  if (!container) return;

  renderIssueStats(currentIssues);

  if (!currentIssues.length) {
    container.innerHTML = '<div class="card bill-empty-state">No issues logged in maintenance.txt</div>';
    return;
  }

  const q = filterQuery.toLowerCase().trim();
  let displayed = currentIssues;
  if (q) {
    displayed = currentIssues.filter(issue => {
      if (issue.title.toLowerCase().includes(q)) return true;
      if (issue.status.toLowerCase().includes(q)) return true;
      if (issue.startDate.toLowerCase().includes(q)) return true;
      if (issue.endDate.toLowerCase().includes(q)) return true;
      if (issue.context.some(c => c.toLowerCase().includes(q))) return true;
      return false;
    });
  }

  if (!displayed.length) {
    container.innerHTML = `<div class="card bill-empty-state">No issues matching "${escapeHtml(filterQuery)}"</div>`;
    if (filterQuery.trim().length >= 2) notifyNoMatch('issues', `No issues matching "${filterQuery}"`, filterQuery);
    return;
  }

  const sorted = sortIssues(displayed, currentIssueSortId);

  container.innerHTML = sorted.map(issue => {
    const isPending = (issue.status || '').toLowerCase().includes('pending');
    const duration = calculateIssueDuration(issue.startDate, issue.endDate);

    const contextHtml = issue.context.length
      ? `
        <div class="issue-context-box">
          <span class="issue-context-title">Context & Log Details</span>
          <ul class="issue-context-list">
            ${issue.context.map(c => `<li class="issue-context-item">${escapeHtml(c)}</li>`).join('')}
          </ul>
        </div>
      `
      : '';

    return `
      <section class="card issue-card ${isPending ? 'issue-card-pending' : 'issue-card-completed'}">
        <div class="issue-card-header">
          <div class="issue-card-title-group">
            <h2 class="issue-card-title">${isPending ? '⚠️' : '🛠️'} ${escapeHtml(issue.title)}</h2>
          </div>
          <div class="issue-badges-row">
            ${isPending
              ? '<span class="issue-badge issue-badge-pending">⏳ Pending</span>'
              : '<span class="issue-badge issue-badge-completed">✅ Completed</span>'}
            <span class="issue-duration-pill ${duration.isOngoing ? 'ongoing' : ''}" title="Duration calculated from start and end date">
              ⏱️ ${duration.text}
            </span>
          </div>
        </div>

        <div class="issue-dates-bar">
          <span class="issue-date-item">📅 <strong>Start:</strong> ${escapeHtml(issue.startDate || 'N/A')}</span>
          <span class="date-separator">→</span>
          <span class="issue-date-item">🏁 <strong>End:</strong> ${escapeHtml(issue.endDate || 'Nill')}</span>
        </div>

        ${contextHtml}
      </section>
    `;
  }).join('');
}

function initIssueSortControl() {
  const select = $('#issueSortSelect');
  if (!select) return;
  select.innerHTML = ISSUE_SORT_MODES
    .map(m => `<option value="${m.id}">🔀 ${m.label}</option>`)
    .join('');
  select.value = currentIssueSortId;
  select.addEventListener('change', (e) => {
    currentIssueSortId = e.target.value;
    const searchVal = $('#issueSearchInput') ? $('#issueSearchInput').value : '';
    renderIssues(searchVal);
    const mode = ISSUE_SORT_MODES.find(m => m.id === currentIssueSortId);
    if (mode) showToast(`Sorted by ${mode.name}`, '🔀');
  });
}

function copyIssuesSummary() {
  if (!currentIssues.length) {
    showToast('No issues to copy', '📋');
    return;
  }
  let summary = `54GNs Apartments - Flat 7 Issues Log\n\n`;
  for (const issue of currentIssues) {
    const duration = calculateIssueDuration(issue.startDate, issue.endDate);
    summary += `• ${issue.title} [${issue.status || 'Logged'}] (${duration.text})\n`;
    summary += `  Start: ${issue.startDate || '-'} → End: ${issue.endDate || 'Nill'}\n`;
    if (issue.context.length) {
      summary += `  Context:\n`;
      for (const c of issue.context) {
        summary += `    - ${c}\n`;
      }
    }
    summary += `\n`;
  }
  summary += `📌 Note: These are the issues and maintenance concerns faced and reported by Flat 7 (Krishna Kanth B).`;

  navigator.clipboard.writeText(summary).then(() => {
    showToast('Copied issues summary!', '📋');
  }).catch(() => showToast('Unable to copy to clipboard', '⚠️'));
}

async function loadAndRenderBills() {
  const content = $('#billContent');
  let text = '';
  try {
    const res = await fetch(`./maintenance.txt?t=${Date.now()}`, { cache: 'no-store' });
    if (!res.ok) throw new Error('Fetch failed');
    text = await res.text();
  } catch (err) {
    text = '';
    if (!offlineBillsNotified) {
      showToast('Offline: no cached records available yet', '📶');
      offlineBillsNotified = true;
    }
  }

  if (text && text.trim()) {
    rawBillText = text;
    const { paidText, expensesText, issuesText } = splitMaintenanceSections(rawBillText);
    currentBillGroups = parseMaintenance(expensesText);
    currentPaidEntries = parsePaid(paidText);
    currentIssues = parseIssues(issuesText);
    renderBillStats(currentBillGroups);
    renderPaidStats(currentPaidEntries);
    renderIssueStats(currentIssues);
    const searchVal = $('#billSearchInput') ? $('#billSearchInput').value : '';
    renderBillGroups(currentBillGroups, searchVal);
    const paidSearchVal = $('#paidSearchInput') ? $('#paidSearchInput').value : '';
    renderPaidEntries(currentPaidEntries, paidSearchVal);
    const issueSearchVal = $('#issueSearchInput') ? $('#issueSearchInput').value : '';
    renderIssues(issueSearchVal);
  } else {
    content.innerHTML = '<div class="card bill-empty-state">No billing data available.</div>';
    const paidPane = $('#paidContent');
    if (paidPane) paidPane.innerHTML = '<div class="card bill-empty-state">No paid collections recorded yet.</div>';
    const issuesPane = $('#issuesContent');
    if (issuesPane) issuesPane.innerHTML = '<div class="card bill-empty-state">No issues logged in maintenance.txt</div>';
  }
}

// ===== Page Views Navigation =====
function showView(viewName, updateHistory = true) {
  const rotationView = $('#rotationView');
  const billsView = $('#billsView');
  const issuesView = $('#issuesView');
  const backBtn = $('#backBtn');
  const pageTitle = $('#pageTitle');

  if (viewName === 'bills') {
    rotationView.classList.add('hidden');
    issuesView.classList.add('hidden');
    billsView.classList.remove('hidden');
    backBtn.classList.remove('hidden');
    pageTitle.textContent = 'Maintenance Bills';
    if (updateHistory && window.location.hash !== '#bills') {
      history.pushState({ view: 'bills' }, '', '#bills');
    }
    loadAndRenderBills();
  } else if (viewName === 'issues') {
    rotationView.classList.add('hidden');
    billsView.classList.add('hidden');
    issuesView.classList.remove('hidden');
    backBtn.classList.remove('hidden');
    pageTitle.textContent = 'Maintenance Issues';
    if (updateHistory && window.location.hash !== '#issues') {
      history.pushState({ view: 'issues' }, '', '#issues');
    }
    if (!currentIssues.length) {
      loadAndRenderBills();
    } else {
      const issueSearchVal = $('#issueSearchInput') ? $('#issueSearchInput').value : '';
      renderIssues(issueSearchVal);
    }
  } else {
    billsView.classList.add('hidden');
    issuesView.classList.add('hidden');
    rotationView.classList.remove('hidden');
    backBtn.classList.add('hidden');
    pageTitle.textContent = '54GNs Apartments Water Motor Rotation';
    if (updateHistory && (window.location.hash === '#bills' || window.location.hash === '#issues')) {
      history.pushState('', document.title, window.location.pathname + window.location.search);
    }
  }
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function copyBillsSummary() {
  if (activeBillsTab === 'paid') {
    if (!currentPaidEntries.length) {
      showToast('No paid collections to copy', '📋');
      return;
    }
    let summary = `54GNs Apartments - Paid Collections Summary\n\n`;
    let total = 0;
    let monthlyTotal = 0;
    let addTotal = 0;
    for (const e of currentPaidEntries) {
      total += e.amount;
      if (e.additional) addTotal += e.amount; else monthlyTotal += e.amount;
      summary += `✅ ${e.date} - ${e.type}: ${formatINR(e.amount)}${e.additional ? ' (Additional)' : ''}\n`;
    }
    summary += `\n💰 Total Collected: ${formatINR(total)}`;
    summary += `\n📅 Monthly: ${formatINR(monthlyTotal)}`;
    if (addTotal) summary += `\n⚡ Additional: ${formatINR(addTotal)}`;
    summary += `\n\n📌 Note: Payment dates mentioned are for Flat 7 (remaining flats fall around approximately the same dates).`;
    navigator.clipboard.writeText(summary).then(() => {
      showToast('Copied paid summary to clipboard!', '📋');
    }).catch(() => showToast('Unable to copy to clipboard', '⚠️'));
    return;
  }
  if (!currentBillGroups.length) {
    showToast('No bills to copy', '📋');
    return;
  }
  let summary = `54GNs Apartments - Maintenance Bills Summary\n\n`;
  let grandTotal = 0;
  for (const g of currentBillGroups) {
    if (g.items.length === 0) continue;
    const tot = g.items.reduce((s, it) => s + it.amount, 0);
    const perTen = tot / FLATS.length;
    grandTotal += tot;
    const isSpecial = isSpecificDate(g.header);
    summary += `${isSpecial ? '⚡ [ADDITIONAL EXPENSE] ' : '📅 '}${g.header}\n`;
    for (const it of g.items) {
      summary += `  • ${it.name}: ${formatINR(it.amount)}\n`;
    }
    summary += `  Total: ${formatINR(tot)} | Per Flat (÷${FLATS.length}): ${formatINR(perTen)}\n\n`;
  }
  summary += `💰 Grand Total: ${formatINR(grandTotal)} | Overall Per Flat: ${formatINR(grandTotal / FLATS.length)}`;

  navigator.clipboard.writeText(summary).then(() => {
    showToast('Copied bill summary to clipboard!', '📋');
  }).catch(() => showToast('Unable to copy to clipboard', '⚠️'));
}

function printCurrentView() {
  showToast('Preparing printable document...', '🖨️');
  setTimeout(() => window.print(), 250);
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
  }).catch(() => showToast('Unable to copy to clipboard', '⚠️'));
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
    }).catch(() => showToast('Unable to copy to clipboard', '⚠️'));
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
  showToast('Exported motor rotation schedule (CSV)!', '📊');
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

  $('#lastUpdated').textContent = `Last Updated: ${fmtFull(new Date())}`;

  // Header events & Page views
  $('#themeToggle').addEventListener('click', cycleTheme);
  $('#printBtn').addEventListener('click', printCurrentView);
  $('#billBtn').addEventListener('click', () => showView('bills'));
  $('#issuesBtn').addEventListener('click', () => showView('issues'));
  $('#backBtn').addEventListener('click', () => showView('rotation'));
  $('#billCopyBtn').addEventListener('click', copyBillsSummary);
  $('#billPrintBtn').addEventListener('click', printCurrentView);
  $('#expensesTabBtn').addEventListener('click', () => switchBillsTab('expenses'));
  $('#paidTabBtn').addEventListener('click', () => switchBillsTab('paid'));

  // Issues page actions
  initIssueSortControl();
  $('#issueCopyBtn').addEventListener('click', copyIssuesSummary);
  $('#issuePrintBtn').addEventListener('click', printCurrentView);

  // Paid breakdown modal
  const paidClose = $('#paidBreakdownClose');
  if (paidClose) paidClose.addEventListener('click', closePaidBreakdown);
  const paidOverlay = $('#paidBreakdownModal');
  if (paidOverlay) paidOverlay.addEventListener('click', (e) => {
    if (e.target === paidOverlay) closePaidBreakdown();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closePaidBreakdown();
  });

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

  // Search filter for paid collections
  const paidSearch = $('#paidSearchInput');
  if (paidSearch) {
    let paidSearchTimer;
    paidSearch.addEventListener('input', (e) => {
      clearTimeout(paidSearchTimer);
      paidSearchTimer = setTimeout(() => {
        renderPaidEntries(currentPaidEntries, e.target.value);
      }, 150);
    });
  }

  // Search filter for issues
  const issueSearch = $('#issueSearchInput');
  if (issueSearch) {
    let issueSearchTimer;
    issueSearch.addEventListener('input', (e) => {
      clearTimeout(issueSearchTimer);
      issueSearchTimer = setTimeout(() => {
        renderIssues(e.target.value);
      }, 150);
    });
  }

  // Hash deep-linking
  if (window.location.hash === '#bills') {
    showView('bills', false);
  } else if (window.location.hash === '#issues') {
    showView('issues', false);
  }
  window.addEventListener('popstate', () => {
    if (window.location.hash === '#bills') {
      showView('bills', false);
    } else if (window.location.hash === '#issues') {
      showView('issues', false);
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

  // Network status listeners
  window.addEventListener('offline', () => showToast('You are currently offline', '📶'));
  window.addEventListener('online', () => {
    showToast('Back online! Syncing records...', '🌐');
    loadAndRenderBills();
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
  navigator.serviceWorker.register('./sw.js').then(reg => {
    reg.addEventListener('updatefound', () => {
      const newWorker = reg.installing;
      if (newWorker) {
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            showToast('New version available! Reload to apply.', '🚀');
          }
        });
      }
    });
  }).catch(() => { });
}
