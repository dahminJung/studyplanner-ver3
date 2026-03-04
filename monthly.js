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
    const key = getMonthKey(y, m);
    return all[key] || { goal: '', notes: '', important: '', days: {} };
  }

  function saveMonthData(y, m, patch) {
    const all = loadData();
    const key = getMonthKey(y, m);
    all[key] = { ...getMonthData(y, m), ...patch };
    saveData(all);
  }

  function renderTitle() {
    const monthNames = ['1월', '2월', '3월', '4월', '5월', '6월',
                        '7월', '8월', '9월', '10월', '11월', '12월'];
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

    const data = getMonthData(viewYear, viewMonth);
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    // 월요일 시작: JS getDay() 0=Sun,1=Mon,...6=Sat → (getDay()+6)%7 = Mon-start index
    const firstDayOfWeek = (new Date(viewYear, viewMonth, 1).getDay() + 6) % 7;
    const totalCells = Math.ceil((firstDayOfWeek + daysInMonth) / 7) * 7;

    const isThisMonth = (viewYear === today.getFullYear() && viewMonth === today.getMonth());

    for (let i = 0; i < totalCells; i++) {
      const cell = document.createElement('div');
      const dayNum = i - firstDayOfWeek + 1;
      const isValid = dayNum >= 1 && dayNum <= daysInMonth;
      const colIndex = i % 7; // 0=Mon ... 5=Sat 6=Sun

      cell.className = 'monthly-cell';

      if (!isValid) {
        cell.classList.add('empty');
        grid.appendChild(cell);
        continue;
      }

      if (colIndex === 5) cell.classList.add('cell-sat');
      if (colIndex === 6) cell.classList.add('cell-sun');
      if (isThisMonth && dayNum === today.getDate()) cell.classList.add('today');

      const numEl = document.createElement('div');
      numEl.className = 'day-num';
      numEl.textContent = dayNum;

      const textarea = document.createElement('textarea');
      textarea.className = 'cell-note';
      textarea.placeholder = '';
      textarea.value = data.days[dayNum] || '';
      textarea.addEventListener('input', () => {
        const d = getMonthData(viewYear, viewMonth);
        d.days[dayNum] = textarea.value;
        saveMonthData(viewYear, viewMonth, { days: d.days });
      });

      cell.appendChild(numEl);
      cell.appendChild(textarea);
      grid.appendChild(cell);
    }
  }

  function render() {
    renderTitle();
    renderSidePanels();
    renderCalendar();
  }

  // 사이드 패널 자동 저장
  goalEl.addEventListener('input', () => {
    saveMonthData(viewYear, viewMonth, { goal: goalEl.value });
  });
  notesEl.addEventListener('input', () => {
    saveMonthData(viewYear, viewMonth, { notes: notesEl.value });
  });
  importantEl.addEventListener('input', () => {
    saveMonthData(viewYear, viewMonth, { important: importantEl.value });
  });

  // 월 이동
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
