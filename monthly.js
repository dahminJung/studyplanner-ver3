document.addEventListener('DOMContentLoaded', () => {
  const grid = document.getElementById('monthly-grid');
  const titleEl = document.getElementById('monthly-title');
  const goalEl = document.getElementById('monthly-goal');
  const notesEl = document.getElementById('monthly-notes');
  const importantEl = document.getElementById('monthly-important');
  const prevBtn = document.getElementById('prev-month-btn');
  const nextBtn = document.getElementById('next-month-btn');
  const todayBtn = document.getElementById('today-btn');

  const today = new Date();
  let viewYear = today.getFullYear();
  let viewMonth = today.getMonth(); // 0-indexed

  const STORAGE_KEY = 'studyPlannerMonthly';
  const isDdayMode = new URLSearchParams(location.search).get('mode') === 'dday';

  // D-Day 선택 모드: 상단 배너 삽입
  if (isDdayMode) {
    const banner = document.createElement('div');
    banner.className = 'dday-banner';
    banner.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
      D-Day로 설정할 <strong>날짜를 클릭</strong>하세요
      <button class="dday-banner-cancel" onclick="window.location.href='index.html'">취소</button>
    `;
    document.querySelector('.monthly-layout').insertAdjacentElement('beforebegin', banner);
  }

  // ── Storage helpers ──────────────────────────────────────────────
  function loadData() {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
  }
  function saveData(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }
  function getMonthKey(y, m) {
    return `${y}-${String(m + 1).padStart(2, '0')}`;
  }
  function getMonthData(y, m) {
    const all = loadData();
    return all[getMonthKey(y, m)] || { goal: '', notes: '', important: '', days: {} };
  }
  function saveMonthData(y, m, patch) {
    const all = loadData();
    const key = getMonthKey(y, m);
    all[key] = { ...getMonthData(y, m), ...patch };
    saveData(all);
  }

  // ── D-Day modal ──────────────────────────────────────────────────
  function showDdayModal(dayNum, y, m) {
    document.getElementById('dday-modal-overlay')?.remove();

    const dateStr = `${y}-${String(m + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
    const monthNames = ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월'];
    const existing = JSON.parse(localStorage.getItem('studyPlannerDday')) || {};

    const overlay = document.createElement('div');
    overlay.id = 'dday-modal-overlay';
    overlay.className = 'dday-modal-overlay';
    overlay.innerHTML = `
      <div class="dday-modal">
        <div class="dday-modal-header">D-Day 설정</div>
        <div class="dday-modal-date">${y}년 ${monthNames[m]} ${dayNum}일</div>
        <input
          type="text"
          id="dday-modal-input"
          class="dday-modal-input"
          placeholder="D-Day 제목 입력 (예: 수능, 기말고사)"
          value="${existing.title || ''}"
          maxlength="20"
        >
        <div class="dday-modal-btns">
          <button class="dday-modal-cancel-btn">취소</button>
          <button class="dday-modal-confirm-btn">저장</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);

    const input = document.getElementById('dday-modal-input');
    input.focus();
    input.select();

    overlay.querySelector('.dday-modal-cancel-btn').addEventListener('click', () => overlay.remove());
    overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });

    function confirmSave() {
      const title = input.value.trim();
      if (!title) { input.focus(); return; }
      localStorage.setItem('studyPlannerDday', JSON.stringify({ title, date: dateStr }));
      window.location.href = 'index.html';
    }
    overlay.querySelector('.dday-modal-confirm-btn').addEventListener('click', confirmSave);
    input.addEventListener('keydown', (e) => { if (e.key === 'Enter') confirmSave(); });
  }

  // ── Render ───────────────────────────────────────────────────────
  function renderTitle() {
    const monthNames = ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월'];
    titleEl.textContent = `${viewYear}년 ${monthNames[viewMonth]}`;
  }

  function renderSidePanels() {
    const data = getMonthData(viewYear, viewMonth);
    goalEl.value = data.goal || '';
    notesEl.value = data.notes || '';
    importantEl.value = data.important || '';
  }

  function renderCalendar() {
    grid.innerHTML = '';
    if (isDdayMode) grid.classList.add('dday-mode');

    const data = getMonthData(viewYear, viewMonth);
    const ddayData = JSON.parse(localStorage.getItem('studyPlannerDday')) || {};
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const firstDayOfWeek = (new Date(viewYear, viewMonth, 1).getDay() + 6) % 7;
    const totalCells = Math.ceil((firstDayOfWeek + daysInMonth) / 7) * 7;
    const isThisMonth = (viewYear === today.getFullYear() && viewMonth === today.getMonth());

    for (let i = 0; i < totalCells; i++) {
      const dayNum = i - firstDayOfWeek + 1;
      const isValid = dayNum >= 1 && dayNum <= daysInMonth;
      const colIndex = i % 7;

      const cell = document.createElement('div');
      cell.className = 'monthly-cell';

      if (!isValid) {
        cell.classList.add('empty');
        grid.appendChild(cell);
        continue;
      }

      if (colIndex === 5) cell.classList.add('cell-sat');
      if (colIndex === 6) cell.classList.add('cell-sun');
      if (isThisMonth && dayNum === today.getDate()) cell.classList.add('today');

      // D-Day 날짜 표시
      const thisCellDate = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
      const isDdayCell = ddayData.date === thisCellDate;
      if (isDdayCell) cell.classList.add('is-dday');

      const numEl = document.createElement('div');
      numEl.className = 'day-num';
      numEl.textContent = dayNum;

      cell.appendChild(numEl);

      // D-Day 뱃지
      if (isDdayCell && ddayData.title) {
        const badge = document.createElement('div');
        badge.className = 'dday-cell-badge';
        badge.textContent = ddayData.title;
        cell.appendChild(badge);
      }

      const textarea = document.createElement('textarea');
      textarea.className = 'cell-note';
      textarea.value = data.days[dayNum] || '';
      textarea.addEventListener('input', () => {
        const d = getMonthData(viewYear, viewMonth);
        d.days[dayNum] = textarea.value;
        saveMonthData(viewYear, viewMonth, { days: d.days });
      });
      cell.appendChild(textarea);

      // D-Day 선택 모드: 날짜 클릭 이벤트
      if (isDdayMode) {
        cell.addEventListener('click', () => showDdayModal(dayNum, viewYear, viewMonth));
      }

      grid.appendChild(cell);
    }
  }

  function render() {
    renderTitle();
    renderSidePanels();
    renderCalendar();
  }

  // ── Side panel auto-save ─────────────────────────────────────────
  goalEl.addEventListener('input', () => saveMonthData(viewYear, viewMonth, { goal: goalEl.value }));
  notesEl.addEventListener('input', () => saveMonthData(viewYear, viewMonth, { notes: notesEl.value }));
  importantEl.addEventListener('input', () => saveMonthData(viewYear, viewMonth, { important: importantEl.value }));

  // ── Month navigation ─────────────────────────────────────────────
  prevBtn.addEventListener('click', () => {
    viewMonth--;
    if (viewMonth < 0) { viewMonth = 11; viewYear--; }
    render();
  });
  nextBtn.addEventListener('click', () => {
    viewMonth++;
    if (viewMonth > 11) { viewMonth = 0; viewYear++; }
    render();
  });
  todayBtn.addEventListener('click', () => {
    viewYear = today.getFullYear();
    viewMonth = today.getMonth();
    render();
  });

  render();
});
