'use strict';

// ===== Configuration =====
const START_DATE = "2026-06-08";
const FLATS = ["Flat 1", "Flat 2", "Flat 3", "Flat 4", "Flat 5", "Flat 6", "Flat 7", "Flat 8"];
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
  return { flat: FLATS[flatIdx], index: flatIdx, weekIdx: idx };
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
    const { flat } = getResponsibleFlat(weekDate);
    const { start, end } = getWeekRange(weekDate);
    const weekNum = getISOWeek(start);
    html.push(`
      <div class="schedule-tr">
        <span class="schedule-td week">W${weekNum}</span>
        <span class="schedule-td flat">${flat}</span>
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

  const flat = FLATS.find(f => f.toLowerCase().includes(query.toLowerCase()));
  if (!flat) { result.textContent = 'No flat found.'; result.classList.remove('hidden'); return; }

  const now = new Date();
  const flatIdx = FLATS.indexOf(flat);
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
    <strong>${flat}</strong>
    <div style="margin-top:8px;">
      <div>Next duty: <strong>${fmt(nextStart)} – ${fmt(nextEnd)}</strong> (${weeksUntil} week${weeksUntil > 1 ? 's' : ''} away)</div>
      <div>Previous: ${fmt(prevStart)} – ${fmt(prevEnd)}</div>
      <div style="margin-top:6px;font-weight:600;">Upcoming cycles:</div>
      ${upcoming}
    </div>
  `;
  result.classList.remove('hidden');
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
    navigator.clipboard.writeText(text);
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

function exportPDF() {
  window.print();
}

function toggleTheme() {
  const html = document.documentElement;
  const isDark = html.getAttribute('data-theme') === 'dark';
  html.setAttribute('data-theme', isDark ? 'light' : 'dark');
  localStorage.setItem('theme', isDark ? 'light' : 'dark');
  $('#themeToggle').textContent = isDark ? '☀️' : '🌙';
}

function loadTheme() {
  const saved = localStorage.getItem('theme');
  if (saved) {
    document.documentElement.setAttribute('data-theme', saved);
    $('#themeToggle').textContent = saved === 'dark' ? '🌙' : '☀️';
  }
}

// ===== Event Listeners =====
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

  $('#themeToggle').addEventListener('click', toggleTheme);
  $('#printBtn').addEventListener('click', exportPDF);
  $('#copyBtn').addEventListener('click', copyWeekInfo);
  $('#shareBtn').addEventListener('click', shareWeekInfo);
  $('#exportCsvBtn').addEventListener('click', exportCSV);
  $('#exportPdfBtn').addEventListener('click', exportPDF);

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
  navigator.serviceWorker.register('sw.js').catch(() => { });
}
