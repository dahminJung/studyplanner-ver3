document.addEventListener('DOMContentLoaded', () => {
  const gridBody = document.getElementById('daily-grid-body');
  const subjectPickerGroup = document.getElementById('subject-picker-group');
  const taskForm = document.getElementById('task-form');
  const taskList = document.getElementById('task-list');
  const countDisplay = document.querySelector('.task-count');
  const subjectSelect = document.getElementById('new-task-subject');
  const titleInput = document.getElementById('new-task-title');
  const dateDisplay = document.getElementById('current-date-display');
  const goalInput = document.querySelector('.goal-content input');
  const reflectionTextarea = document.querySelector('.reflection textarea');

  // ─── 날짜 유틸 ───────────────────────────────────────────
  function getDateStr(date) {
    const d = date || new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  }

  const todayStr = getDateStr();
  const todayDate = new Date();
  const dateOptions = { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' };
  if (dateDisplay) {
    dateDisplay.textContent = todayDate.toLocaleDateString('ko-KR', dateOptions);
  }

  // ─── 매일 리셋 & 기록 보관 ───────────────────────────────
  const lastDateStr = localStorage.getItem('studyPlannerLastDate');
  if (lastDateStr && lastDateStr !== todayStr) {
    // 이전 날 데이터 기록 보관
    const history = JSON.parse(localStorage.getItem('studyPlannerHistory')) || {};
    history[lastDateStr] = {
      goal: localStorage.getItem('studyPlannerDailyGoal') || '',
      tasks: JSON.parse(localStorage.getItem('studyPlannerTasks')) || [],
      reflection: localStorage.getItem('studyPlannerDailyReflection') || ''
    };
    localStorage.setItem('studyPlannerHistory', JSON.stringify(history));

    // 오늘 데이터 초기화
    localStorage.removeItem('studyPlannerTasks');
    localStorage.removeItem('studyPlannerDailyGoal');
    localStorage.removeItem('studyPlannerDailyReflection');
  }
  localStorage.setItem('studyPlannerLastDate', todayStr);

  // ─── 과목 데이터 ─────────────────────────────────────────
  let subjects = JSON.parse(localStorage.getItem('studyPlannerSubjects')) || [
    { id: 1, name: '수학', color: '#fca5a5' },
    { id: 2, name: '영어', color: '#93c5fd' }
  ];

  // ─── 할 일 데이터 ─────────────────────────────────────────
  let tasks = JSON.parse(localStorage.getItem('studyPlannerTasks')) || [];

  // ─── Goal 저장/불러오기 ───────────────────────────────────
  if (goalInput) {
    const savedGoal = localStorage.getItem('studyPlannerDailyGoal');
    goalInput.value = savedGoal !== null ? savedGoal : '오늘도 어제보다 나은 나를 위해!';
    goalInput.addEventListener('input', () => {
      localStorage.setItem('studyPlannerDailyGoal', goalInput.value);
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
        const item = document.createElement('div');
        item.className = `task-item ${task.completed ? 'completed' : ''}`;
        item.style.borderLeftColor = subject.color;
        item.innerHTML = `
          <input type="checkbox" class="task-checkbox" data-id="${task.id}" ${task.completed ? 'checked' : ''}>
          <span class="task-title-text">${task.title}</span>
          <span class="task-subject-badge" style="background-color: ${subject.color}">${subject.name}</span>
          <button type="button" class="task-delete-btn" data-id="${task.id}">&times;</button>
        `;
        taskList.appendChild(item);
      });
    }
    updateTaskCount();
  }

  function updateTaskCount() {
    if (!countDisplay) return;
    const completed = tasks.filter(t => t.completed).length;
    countDisplay.textContent = `${completed} / ${tasks.length}`;
  }

  function saveAndRenderTasks() {
    localStorage.setItem('studyPlannerTasks', JSON.stringify(tasks));
    renderTasks();
  }

  if (taskForm) {
    taskForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const title = titleInput.value.trim();
      const subjectId = parseInt(subjectSelect.value);
      if (!title || isNaN(subjectId)) {
        alert('할 일과 과목을 모두 입력/선택해주세요.');
        return;
      }
      tasks.push({ id: Date.now(), title, subjectId, completed: false });
      titleInput.value = '';
      subjectSelect.value = '';
      saveAndRenderTasks();
    });
  }

  if (taskList) {
    taskList.addEventListener('change', (e) => {
      if (e.target.classList.contains('task-checkbox')) {
        const id = parseInt(e.target.dataset.id);
        const task = tasks.find(t => t.id === id);
        if (task) {
          task.completed = e.target.checked;
          saveAndRenderTasks();
        }
      }
    });

    taskList.addEventListener('click', (e) => {
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
  const dayOfWeek = todayDate.getDay();
  const todayDayIdx = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
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

  // ─── 자주 사용하는 Task 칩 ────────────────────────────────
  function renderQuickTaskChips() {
    const row = document.getElementById('quick-tasks-row');
    if (!row) return;
    const quickTasks = JSON.parse(localStorage.getItem('studyPlannerQuickTasks')) || [];
    row.innerHTML = '';
    if (quickTasks.length === 0) { row.style.display = 'none'; return; }
    row.style.display = 'flex';
    quickTasks.forEach(qt => {
      const subject = subjects.find(s => s.id === qt.subjectId) || { name: '지정 안됨', color: '#cbd5e1' };
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'quick-task-chip';
      chip.innerHTML = `<span class="quick-task-chip-dot" style="background-color: ${subject.color}"></span>${qt.title}`;
      chip.title = `${qt.title} (${subject.name}) — 클릭하여 바로 추가`;
      chip.addEventListener('click', () => {
        tasks.push({ id: Date.now(), title: qt.title, subjectId: qt.subjectId, completed: false });
        saveAndRenderTasks();
      });
      row.appendChild(chip);
    });
  }

  // ─── 초기화 ───────────────────────────────────────────────
  renderSubjectPickers();
  renderTasks();
  renderQuickTaskChips();
});
