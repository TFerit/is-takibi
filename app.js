(() => {
  'use strict';
  const STORAGE_KEY = 'mesai-takip-data-v1';
  const $ = id => document.getElementById(id);
  const money = new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' });
  const monthFormatter = new Intl.DateTimeFormat('tr-TR', { month: 'long', year: 'numeric' });
  const shortMonthFormatter = new Intl.DateTimeFormat('tr-TR', { month: 'short' });
  const state = { viewDate: new Date(), selectedDate: null, data: loadData() };
  let deferredInstall;

  function loadData() {
    try { return { settings: { rate: '', defaultTarget: '' }, entries: {}, targets: {}, ...JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') }; }
    catch { return { settings: { rate: '', defaultTarget: '' }, entries: {}, targets: {} }; }
  }
  function save() { localStorage.setItem(STORAGE_KEY, JSON.stringify(state.data)); }
  function dateKey(year, month, day) { return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`; }
  function monthKey(date = state.viewDate) { return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`; }
  function parseNumber(value) { return Number(String(value).trim().replace(/\./g, '').replace(',', '.')) || 0; }
  function rate() { return parseNumber(state.data.settings.rate); }
  function formatHours(minutes) { const h = Math.floor(minutes / 60); const m = Math.round(minutes % 60); return `${h} sa. ${m} dk.`; }
  function entryMinutes(entry) {
    if (!entry || !entry.start || !entry.end) return 0;
    const [sh, sm] = entry.start.split(':').map(Number), [eh, em] = entry.end.split(':').map(Number);
    let minutes = (eh * 60 + em) - (sh * 60 + sm);
    if (minutes < 0) minutes += 24 * 60;
    if (entry.lunch) minutes -= 30;
    return Math.max(0, minutes);
  }
  function monthEntries(key = monthKey()) { return Object.entries(state.data.entries).filter(([date]) => date.startsWith(key)); }
  function monthMinutes(key = monthKey()) { return monthEntries(key).reduce((sum, [, entry]) => sum + entryMinutes(entry), 0); }
  function targetFor(key = monthKey()) { return parseNumber(state.data.targets[key] ?? state.data.settings.defaultTarget); }
  function updateSummary() {
    const key = monthKey(), minutes = monthMinutes(key), earned = minutes / 60 * rate();
    $('summaryMonth').textContent = monthFormatter.format(state.viewDate).toLocaleUpperCase('tr-TR');
    $('monthHours').textContent = formatHours(minutes);
    $('monthEarnings').textContent = money.format(earned);
    const target = targetFor(key);
    $('targetValue').textContent = money.format(target);
    const percent = target ? Math.min(100, earned / target * 100) : 0;
    $('targetProgress').style.width = `${percent}%`;
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const shownYear = state.viewDate.getFullYear(), shownMonth = state.viewDate.getMonth();
    const last = new Date(shownYear, shownMonth + 1, 0).getDate();
    let remaining = 0;
    for (let d = 1; d <= last; d++) { const candidate = new Date(shownYear, shownMonth, d); candidate.setHours(0,0,0,0); if (candidate >= today) remaining++; }
    if (!target) $('targetHint').textContent = 'Aylık hedefinizi ekleyerek planınızı görün.';
    else if (!rate()) $('targetHint').textContent = 'Gerekli çalışma süresini görmek için saatlik ücreti Ayarlar’dan ekleyin.';
    else if (earned >= target) $('targetHint').textContent = 'Harika! Bu ayki hedefinize ulaştınız.';
    else if (!remaining) $('targetHint').textContent = `Hedeften ${money.format(target - earned)} geridesiniz.`;
    else $('targetHint').textContent = `Hedefe ulaşmak için kalan ${remaining} takvim gününde günde ortalama ${formatHours((target - earned) / rate() * 60 / remaining)} çalışmanız gerekir.`;
  }
  function renderCalendar() {
    const y = state.viewDate.getFullYear(), m = state.viewDate.getMonth();
    $('calendarTitle').textContent = monthFormatter.format(state.viewDate);
    const firstWeekday = (new Date(y, m, 1).getDay() + 6) % 7, days = new Date(y, m + 1, 0).getDate();
    const todayKey = dateKey(new Date().getFullYear(), new Date().getMonth(), new Date().getDate());
    const cells = [];
    for (let i = 0; i < firstWeekday; i++) cells.push('<div class="day empty"></div>');
    for (let d = 1; d <= days; d++) {
      const key = dateKey(y, m, d), entry = state.data.entries[key], mins = entryMinutes(entry), earnings = mins / 60 * rate();
      cells.push(`<button class="day ${key === todayKey ? 'today' : ''} ${entry ? 'has-entry' : ''}" data-date="${key}" aria-label="${d}. gün${entry ? ', ' + formatHours(mins) : ''}"><span class="day-number">${d}</span>${entry ? `<span class="day-hours">${formatHours(mins)}</span><span class="day-earnings">${rate() ? money.format(earnings) : ''}</span>` : ''}</button>`);
    }
    $('calendar').innerHTML = cells.join('');
    $('calendar').querySelectorAll('[data-date]').forEach(button => button.addEventListener('click', () => openDay(button.dataset.date)));
  }
  function renderHistory() {
    const list = $('historyList'), now = new Date(); let html = '';
    for (let offset = 0; offset < 12; offset++) {
      const date = new Date(now.getFullYear(), now.getMonth() - offset, 1), key = monthKey(date), minutes = monthMinutes(key), earned = minutes / 60 * rate();
      html += `<button class="history-item" data-month="${key}"><span><strong>${monthFormatter.format(date)}</strong><small>${formatHours(minutes)} çalışma</small></span><span class="amount">${money.format(earned)} ›</span></button>`;
    }
    list.innerHTML = html;
    list.querySelectorAll('[data-month]').forEach(button => button.addEventListener('click', () => { const [y, m] = button.dataset.month.split('-').map(Number); state.viewDate = new Date(y, m - 1, 1); showView('trackerView'); render(); window.scrollTo({ top: 0, behavior: 'smooth' }); }));
  }
  function renderSettings() { $('hourlyRate').value = state.data.settings.rate || ''; $('defaultTarget').value = state.data.settings.defaultTarget || ''; }
  function render() { updateSummary(); renderCalendar(); renderHistory(); renderSettings(); }
  function showView(id) { document.querySelectorAll('.view').forEach(view => view.classList.toggle('active', view.id === id)); document.querySelectorAll('.nav-tab').forEach(tab => tab.classList.toggle('active', tab.dataset.view === id)); }
  function openDay(key) {
    state.selectedDate = key; const [year, month, day] = key.split('-').map(Number), entry = state.data.entries[key] || {};
    $('dayDialogTitle').textContent = new Intl.DateTimeFormat('tr-TR', { weekday:'long', day:'numeric', month:'long' }).format(new Date(year, month - 1, day));
    $('startTime').value = entry.start || ''; $('endTime').value = entry.end || ''; $('lunchBreak').checked = Boolean(entry.lunch); $('dayError').textContent = '';
    $('deleteDay').hidden = !state.data.entries[key]; updateNetPreview(); $('dayDialog').showModal();
  }
  function updateNetPreview() { const start = $('startTime').value, end = $('endTime').value; if (!start || !end) return $('netPreview').textContent = 'Net süre: —'; const mins = entryMinutes({ start, end, lunch: $('lunchBreak').checked }); $('netPreview').textContent = `Net süre: ${formatHours(mins)}${$('endTime').value < $('startTime').value ? ' (ertesi gün bitiş)' : ''}`; }
  function openTarget() { const key = monthKey(); $('targetDialogTitle').textContent = `${monthFormatter.format(state.viewDate)} hedefi`; $('targetInput').value = state.data.targets[key] ?? state.data.settings.defaultTarget ?? ''; $('targetError').textContent = ''; $('targetDialog').showModal(); }

  $('prevMonth').addEventListener('click', () => { state.viewDate = new Date(state.viewDate.getFullYear(), state.viewDate.getMonth() - 1, 1); render(); });
  $('nextMonth').addEventListener('click', () => { state.viewDate = new Date(state.viewDate.getFullYear(), state.viewDate.getMonth() + 1, 1); render(); });
  $('editTarget').addEventListener('click', openTarget);
  document.querySelectorAll('.nav-tab').forEach(tab => tab.addEventListener('click', () => showView(tab.dataset.view)));
  ['startTime','endTime','lunchBreak'].forEach(id => $(id).addEventListener('input', updateNetPreview));
  $('dayForm').addEventListener('submit', event => { event.preventDefault(); const start = $('startTime').value, end = $('endTime').value, lunch = $('lunchBreak').checked, minutes = entryMinutes({start,end,lunch}); if (!start || !end) return $('dayError').textContent = 'Lütfen başlangıç ve bitiş saatini girin.'; if (!minutes) return $('dayError').textContent = 'Net süre sıfırdan büyük olmalıdır.'; state.data.entries[state.selectedDate] = {start, end, lunch}; save(); $('dayDialog').close(); render(); });
  $('deleteDay').addEventListener('click', () => { delete state.data.entries[state.selectedDate]; save(); $('dayDialog').close(); render(); });
  $('targetForm').addEventListener('submit', event => { event.preventDefault(); const value = parseNumber($('targetInput').value); if (!$('targetInput').value.trim() || value < 0) return $('targetError').textContent = 'Geçerli bir hedef tutar girin.'; state.data.targets[monthKey()] = String(value); save(); $('targetDialog').close(); render(); });
  $('settingsForm').addEventListener('submit', event => { event.preventDefault(); const hourly = parseNumber($('hourlyRate').value), target = parseNumber($('defaultTarget').value); if ($('hourlyRate').value.trim() && hourly <= 0) return alert('Saatlik ücret sıfırdan büyük olmalıdır.'); if ($('defaultTarget').value.trim() && target < 0) return alert('Geçerli bir hedef tutar girin.'); state.data.settings.rate = $('hourlyRate').value.trim() ? String(hourly) : ''; state.data.settings.defaultTarget = $('defaultTarget').value.trim() ? String(target) : ''; save(); render(); alert('Ayarlar kaydedildi.'); });
  $('clearData').addEventListener('click', () => { if (!confirm('Tüm çalışma kayıtları ve ayarlar silinsin mi? Bu işlem geri alınamaz.')) return; localStorage.removeItem(STORAGE_KEY); state.data = loadData(); render(); });
  window.addEventListener('beforeinstallprompt', event => { event.preventDefault(); deferredInstall = event; $('installButton').hidden = false; });
  $('installButton').addEventListener('click', async () => { if (!deferredInstall) return; deferredInstall.prompt(); await deferredInstall.userChoice; deferredInstall = null; $('installButton').hidden = true; });
  if ('serviceWorker' in navigator) window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js'));
  render();
})();
