document.addEventListener('DOMContentLoaded', () => {
  const gridBody = document.getElementById('daily-grid-body');
  const subjectPickerGroup = document.getElementById('subject-picker-group');
  const taskForm = document.getElementById('task-form');
  const taskList = document.getElementById('task-list');
  const countDisplay = document.querySelector('.task-count');
  const subjectSelect = document.getElementById('new-task-subject');
  const titleInput = document.getElementById('new-task-title');
  const dateDisplay = document.getElementById('current-date-display');
  const homeTimeDisplay = document.getElementById('daily-home-time');
  const homeTime2Display = document.getElementById('daily-home-time2');
  const homeTime3Display = document.getElementById('daily-home-time3');
  const homeTime4Display = document.getElementById('daily-home-time4');
  const studyroomTimeDisplay = document.getElementById('daily-studyroom-time');
  const studyroomTime2Display = document.getElementById('daily-studyroom-time2');
  const studyroomTime3Display = document.getElementById('daily-studyroom-time3');
  const studyroomTime4Display = document.getElementById('daily-studyroom-time4');
  const todayNoteInput = document.getElementById('daily-today-note');
  const reflectionTextarea = document.getElementById('daily-reflection');
  const memoTextarea = document.getElementById('daily-memo');

  // ─── 날짜 유틸 ───────────────────────────────────────────
  function getDateStr(date) {
    const d = date || new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  }

  const todayStr = getDateStr();
  const todayDate = new Date();
  const dayOfWeek = todayDate.getDay();
  const todayDayIdx = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // 0: Mon ~ 6: Sun
  const dateOptions = { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' };
  if (dateDisplay) {
    dateDisplay.textContent = todayDate.toLocaleDateString('ko-KR', dateOptions);
  }

  // ─── 매일 리셋 & 기록 보관 ───────────────────────────────
  const lastDateStr = localStorage.getItem('studyPlannerLastDate');
  if (lastDateStr && lastDateStr !== todayStr) {
    const history = JSON.parse(localStorage.getItem('studyPlannerHistory')) || {};
    const prevDate = new Date(lastDateStr);
    const prevDayIdx = prevDate.getDay() === 0 ? 6 : prevDate.getDay() - 1;
    const prevWeeklyTimes = JSON.parse(localStorage.getItem('studyPlannerWeeklyTimes') || '{}');
    const prevTimes = prevWeeklyTimes[prevDayIdx] || {};
    history[lastDateStr] = {
      homeTime: prevTimes.homeTime || '',
      studyroomTime: prevTimes.studyroomTime || '',
      todayNote: localStorage.getItem('studyPlannerTodayNote') || '',
      tasks: JSON.parse(localStorage.getItem('studyPlannerTasks')) || [],
      reflection: localStorage.getItem('studyPlannerDailyReflection') || '',
      memo: localStorage.getItem('studyPlannerDailyMemo') || ''
    };
    localStorage.setItem('studyPlannerHistory', JSON.stringify(history));
    localStorage.removeItem('studyPlannerTasks');
    localStorage.removeItem('studyPlannerHomeTime');
    localStorage.removeItem('studyPlannerStudyroomTime');
    localStorage.removeItem('studyPlannerTodayNote');
    localStorage.removeItem('studyPlannerDailyReflection');
    localStorage.removeItem('studyPlannerDailyMemo');
  }
  localStorage.setItem('studyPlannerLastDate', todayStr);

  // ─── 유틸 ────────────────────────────────────────────────
  function esc(str) {
    return String(str).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }

  // ─── 과목 / 할일 / 즐겨찾기 데이터 ──────────────────────
  let subjects = JSON.parse(localStorage.getItem('studyPlannerSubjects')) || [
    { id: 1, name: '수학', color: '#d4d4d4' },
    { id: 2, name: '영어', color: '#737373' }
  ];
  let tasks = JSON.parse(localStorage.getItem('studyPlannerTasks')) || [];
  let quickTasks = JSON.parse(localStorage.getItem('studyPlannerQuickTasks')) || [];

  function saveQuickTasks() {
    localStorage.setItem('studyPlannerQuickTasks', JSON.stringify(quickTasks));
  }

  // ─── 위클리 시간 설정에서 오늘 시간 표시 ────────────────
  const weeklyTimes = JSON.parse(localStorage.getItem('studyPlannerWeeklyTimes') || '{}');
  const todayTimes = weeklyTimes[todayDayIdx] || {};
  if (homeTimeDisplay) homeTimeDisplay.textContent = todayTimes.homeTime || '--:--';
  if (homeTime2Display) {
    if (todayTimes.homeTime2) { homeTime2Display.textContent = todayTimes.homeTime2; homeTime2Display.style.display = ''; }
    else homeTime2Display.style.display = 'none';
  }
  if (homeTime3Display) {
    if (todayTimes.homeTime3) { homeTime3Display.textContent = todayTimes.homeTime3; homeTime3Display.style.display = ''; }
    else homeTime3Display.style.display = 'none';
  }
  if (homeTime4Display) {
    if (todayTimes.homeTime4) { homeTime4Display.textContent = todayTimes.homeTime4; homeTime4Display.style.display = ''; }
    else homeTime4Display.style.display = 'none';
  }
  if (studyroomTimeDisplay) studyroomTimeDisplay.textContent = todayTimes.studyroomTime || '--:--';
  if (studyroomTime2Display) {
    if (todayTimes.studyroomTime2) { studyroomTime2Display.textContent = todayTimes.studyroomTime2; studyroomTime2Display.style.display = ''; }
    else studyroomTime2Display.style.display = 'none';
  }
  if (studyroomTime3Display) {
    if (todayTimes.studyroomTime3) { studyroomTime3Display.textContent = todayTimes.studyroomTime3; studyroomTime3Display.style.display = ''; }
    else studyroomTime3Display.style.display = 'none';
  }
  if (studyroomTime4Display) {
    if (todayTimes.studyroomTime4) { studyroomTime4Display.textContent = todayTimes.studyroomTime4; studyroomTime4Display.style.display = ''; }
    else studyroomTime4Display.style.display = 'none';
  }

  if (todayNoteInput) {
    todayNoteInput.value = localStorage.getItem('studyPlannerTodayNote') || '';
    todayNoteInput.addEventListener('input', () => {
      localStorage.setItem('studyPlannerTodayNote', todayNoteInput.value);
      syncPlanToWorker();
    });
  }

  // ─── Reflection 저장/불러오기 ─────────────────────────────
  if (reflectionTextarea) {
    const savedReflection = localStorage.getItem('studyPlannerDailyReflection');
    if (savedReflection) reflectionTextarea.value = savedReflection;
    reflectionTextarea.addEventListener('input', () => {
      localStorage.setItem('studyPlannerDailyReflection', reflectionTextarea.value);
    });
  }

  // ─── Memo 저장/불러오기 ───────────────────────────────────
  if (memoTextarea) {
    const savedMemo = localStorage.getItem('studyPlannerDailyMemo');
    if (savedMemo) memoTextarea.value = savedMemo;
    memoTextarea.addEventListener('input', () => {
      localStorage.setItem('studyPlannerDailyMemo', memoTextarea.value);
    });
  }

  // ─── 과목 렌더링 ──────────────────────────────────────────
  function renderSubjectPickers() {
    if (subjectPickerGroup) {
      subjectPickerGroup.innerHTML = '';
      if (subjects.length === 0) {
        subjectPickerGroup.innerHTML = '<span style="font-size: 0.75rem; color: #64748b;">설정에서 과목을 추가하세요</span>';
      } else {
        subjects.forEach((subject) => {
          const btn = document.createElement('div');
          btn.className = 'color-btn';
          btn.style.backgroundColor = subject.color;
          btn.style.cursor = 'default';
          btn.title = subject.name;
          subjectPickerGroup.appendChild(btn);
        });
      }
    }

    if (subjectSelect) {
      subjectSelect.innerHTML = '<option value="" disabled selected>과목 선택</option>';
      subjects.forEach(subject => {
        const option = document.createElement('option');
        option.value = subject.id;
        option.textContent = subject.name;
        subjectSelect.appendChild(option);
      });
    }
  }

  // ─── 할 일 렌더링 ─────────────────────────────────────────
  function renderTasks() {
    if (!taskList) return;
    taskList.innerHTML = '';

    if (tasks.length === 0) {
      taskList.innerHTML = '<div style="text-align:center; padding: 1rem; color: var(--text-muted); font-size: 0.9rem;">할 일을 추가해보세요!</div>';
    } else {
      tasks.forEach(task => {
        const subject = subjects.find(s => s.id === task.subjectId) || { name: '지정 안됨', color: '#cbd5e1' };
        const status = task.status || 'pending';

        const item = document.createElement('div');
        item.className = `task-item status-${status}`;
        item.style.borderLeftColor = subject.color;

        item.innerHTML = `
          <button type="button" class="task-status-btn task-done-btn ${status === 'completed' ? 'active' : ''}" data-id="${task.id}" data-action="complete" title="완료">✓</button>
          <button type="button" class="task-status-btn task-fail-btn ${status === 'failed' ? 'active' : ''}" data-id="${task.id}" data-action="fail" title="실패">✗</button>
          <div class="task-body">
            <span class="task-title-text">${esc(task.title)}</span>
            ${task.detail ? `<span class="task-detail-text">${esc(task.detail)}</span>` : ''}
          </div>
          <span class="task-subject-badge" style="background-color: ${subject.color}">${esc(subject.name)}</span>
          <button type="button" class="task-delete-btn" data-id="${task.id}">&times;</button>
        `;
        taskList.appendChild(item);
      });
    }
    updateTaskCount();
  }

  function updateTaskCount() {
    if (!countDisplay) return;
    const completed = tasks.filter(t => t.status === 'completed').length;
    countDisplay.textContent = `${completed} / ${tasks.length}`;
  }

  function saveAndRenderTasks() {
    localStorage.setItem('studyPlannerTasks', JSON.stringify(tasks));
    renderTasks();
    renderQuickTaskChips();
    syncPlanToWorker();
  }

  // ─── Worker로 플랜 동기화 ────────────────────────────────
  async function syncPlanToWorker() {
    const cfg = JSON.parse(localStorage.getItem('studyPlannerNotif') || '{}');
    if (!cfg.workerUrl || !cfg.apiKey || !cfg.active) return;

    const ddayRaw = JSON.parse(localStorage.getItem('studyPlannerDday') || 'null');
    const wTimes = JSON.parse(localStorage.getItem('studyPlannerWeeklyTimes') || '{}');
    const todayT = wTimes[todayDayIdx] || {};

    // 전날 데이터 (history에서 가져오기)
    const yesterday = new Date(todayDate);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = getDateStr(yesterday);
    const history = JSON.parse(localStorage.getItem('studyPlannerHistory') || '{}');
    const prevDayHistory = history[yesterdayStr] || null;

    const payload = {
      date: todayStr,
      homeTime: todayT.homeTime || '',
      homeTime2: todayT.homeTime2 || '',
      homeTime3: todayT.homeTime3 || '',
      homeTime4: todayT.homeTime4 || '',
      studyroomTime: todayT.studyroomTime || '',
      studyroomTime2: todayT.studyroomTime2 || '',
      studyroomTime3: todayT.studyroomTime3 || '',
      studyroomTime4: todayT.studyroomTime4 || '',
      todayNote: localStorage.getItem('studyPlannerTodayNote') || '',
      appUrl: cfg.appUrl || '',
      tasks: JSON.parse(localStorage.getItem('studyPlannerTasks') || '[]'),
      subjects: JSON.parse(localStorage.getItem('studyPlannerSubjects') || '[]'),
      dday: ddayRaw,
      weeklyTimetable: JSON.parse(localStorage.getItem('studyPlannerWeekly') || '{}'),
      prevDay: prevDayHistory ? { date: yesterdayStr, tasks: prevDayHistory.tasks || [] } : null
    };

    try {
      await fetch(`${cfg.workerUrl}/api/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-API-Key': cfg.apiKey },
        body: JSON.stringify(payload)
      });
    } catch {
      // 네트워크 오류 시 조용히 무시 (앱 사용에 영향 없도록)
    }
  }

  // ─── Task 폼 제출 ─────────────────────────────────────────
  if (taskForm) {
    taskForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const title = titleInput.value.trim();
      const subjectId = parseInt(subjectSelect.value);
      if (!title || isNaN(subjectId)) {
        alert('할 일과 과목을 모두 입력/선택해주세요.');
        return;
      }
      tasks.push({ id: Date.now(), title, subjectId, status: 'pending', detail: '' });
      titleInput.value = '';
      subjectSelect.value = '';
      saveAndRenderTasks();
    });
  }

  // ─── Task 목록 이벤트 ─────────────────────────────────────
  if (taskList) {
    taskList.addEventListener('click', (e) => {
      // 완료/실패 버튼
      if (e.target.classList.contains('task-status-btn')) {
        const id = parseInt(e.target.dataset.id);
        const action = e.target.dataset.action;
        const task = tasks.find(t => t.id === id);
        if (task) {
          const current = task.status || 'pending';
          if (action === 'complete') task.status = current === 'completed' ? 'pending' : 'completed';
          else if (action === 'fail') task.status = current === 'failed' ? 'pending' : 'failed';
          saveAndRenderTasks();
        }
      }

      // 삭제 버튼
      if (e.target.classList.contains('task-delete-btn')) {
        const id = parseInt(e.target.dataset.id);
        tasks = tasks.filter(t => t.id !== id);
        saveAndRenderTasks();
      }
    });
  }

  // ─── 일일 타임테이블 (읽기 전용) ──────────────────────────
  const weeklyData = JSON.parse(localStorage.getItem('studyPlannerWeekly')) || {};
  const startTime = 6;
  const hoursToRender = 21;
  const dailyHeaderRow = document.getElementById('daily-header-row');
  const dayNames = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

  if (dailyHeaderRow) {
    dailyHeaderRow.innerHTML = `
      <span>H</span>
      <span>${dayNames[todayDayIdx]}<br><small style="font-weight:normal; font-size:0.7rem;">${todayDate.getMonth()+1}/${todayDate.getDate()}</small></span>
    `;
  }

  if (gridBody) {
    let timeColHTML = '<div class="weekly-time-col">';
    for (let i = 0; i < hoursToRender; i++) {
      const hour = (startTime + i) % 24;
      timeColHTML += `<div class="weekly-hour-label">${hour.toString().padStart(2,'0')}</div>`;
    }
    timeColHTML += '</div>';

    let dayHTML = `<div class="weekly-day-col" data-day="${todayDayIdx}" style="border-right: none;">`;
    for (let i = 0; i < hoursToRender; i++) {
      const hour = (startTime + i) % 24;
      const timeKey = `${todayDayIdx}-${hour.toString().padStart(2,'0')}`;
      const color = weeklyData[timeKey] || '';
      dayHTML += `
        <div class="weekly-hour-cell">
          <div class="weekly-min-block" style="height: 100%; cursor: default; ${color ? `background-color: ${color};` : ''}"></div>
        </div>
      `;
    }
    dayHTML += '</div>';
    gridBody.innerHTML = timeColHTML + dayHTML;
  }

  // ─── D-Day 표시 ───────────────────────────────────────────
  const ddayData = JSON.parse(localStorage.getItem('studyPlannerDday'));
  const ddayCountEl = document.getElementById('dday-count');
  const ddayTitleEl = document.getElementById('dday-title');
  if (ddayData && ddayData.date) {
    const t = new Date(); t.setHours(0, 0, 0, 0);
    const target = new Date(ddayData.date); target.setHours(0, 0, 0, 0);
    const diff = Math.ceil((target - t) / 86400000);
    if (ddayCountEl) {
      ddayCountEl.textContent = diff === 0 ? 'D-DAY!' : diff > 0 ? `D-${diff}` : `D+${Math.abs(diff)}`;
    }
    if (ddayTitleEl) ddayTitleEl.textContent = ddayData.title;
  }

  // ─── Quick Task 팝업 ──────────────────────────────────────
  const qtOverlay = document.getElementById('qt-popup-overlay');
  const qtPopupName = document.getElementById('qt-popup-name');
  const qtPopupDot = document.getElementById('qt-popup-dot');
  const qtPopupSubjectLabel = document.getElementById('qt-popup-subject-label');
  const qtPopupDetail = document.getElementById('qt-popup-detail');
  const qtPopupConfirm = document.getElementById('qt-popup-confirm');
  const qtPopupCancel = document.getElementById('qt-popup-cancel');

  let pendingQuickTask = null;

  function openQtPopup(qt) {
    const subject = subjects.find(s => s.id === qt.subjectId) || { name: '지정 안됨', color: '#cbd5e1' };
    pendingQuickTask = qt;
    qtPopupName.textContent = qt.title;
    qtPopupDot.style.backgroundColor = subject.color;
    qtPopupSubjectLabel.textContent = subject.name;
    qtPopupDetail.value = qt.detail || '';
    qtOverlay.style.display = 'flex';
    qtPopupDetail.focus();
  }

  function closeQtPopup() {
    qtOverlay.style.display = 'none';
    pendingQuickTask = null;
  }

  if (qtPopupConfirm) {
    qtPopupConfirm.addEventListener('click', () => {
      if (!pendingQuickTask) return;
      tasks.push({
        id: Date.now(),
        title: pendingQuickTask.title,
        subjectId: pendingQuickTask.subjectId,
        status: 'pending',
        detail: qtPopupDetail.value.trim()
      });
      saveAndRenderTasks();
      closeQtPopup();
    });
  }

  if (qtPopupCancel) qtPopupCancel.addEventListener('click', closeQtPopup);
  if (qtOverlay) {
    qtOverlay.addEventListener('click', (e) => {
      if (e.target === qtOverlay) closeQtPopup();
    });
  }
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && qtOverlay && qtOverlay.style.display !== 'none') closeQtPopup();
  });

  // ─── Quick Task 칩 렌더링 ─────────────────────────────────
  function renderQuickTaskChips() {
    quickTasks = JSON.parse(localStorage.getItem('studyPlannerQuickTasks')) || [];
    const row = document.getElementById('quick-tasks-row');
    if (!row) return;
    row.innerHTML = '';
    if (quickTasks.length === 0) { row.style.display = 'none'; return; }
    row.style.display = 'flex';

    quickTasks.forEach(qt => {
      const subject = subjects.find(s => s.id === qt.subjectId) || { name: '지정 안됨', color: '#cbd5e1' };
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'quick-task-chip';
      chip.innerHTML = `<span class="quick-task-chip-dot" style="background-color: ${subject.color}"></span>${qt.title}`;
      chip.title = `${qt.title} (${subject.name}) — 클릭하여 추가`;
      chip.addEventListener('click', () => openQtPopup(qt));
      row.appendChild(chip);
    });
  }

  // ─── 초기화 ───────────────────────────────────────────────
  renderSubjectPickers();
  renderTasks();
  renderQuickTaskChips();
  syncPlanToWorker(); // 앱 열 때 최신 플랜 동기화
});
