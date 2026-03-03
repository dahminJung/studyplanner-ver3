document.addEventListener('DOMContentLoaded', () => {
  const gridBody = document.getElementById('daily-grid-body'); // Changed to daily grid
  const subjectPickerGroup = document.getElementById('subject-picker-group');
  const taskForm = document.getElementById('task-form');
  const taskList = document.getElementById('task-list');
  const countDisplay = document.querySelector('.task-count');
  const subjectSelect = document.getElementById('new-task-subject');
  const titleInput = document.getElementById('new-task-title');
  const dateDisplay = document.getElementById('current-date-display');
  
  // 날짜 표시 및 초기화
  const todayDate = new Date();
  const dateOptions = { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' };
  if (dateDisplay) {
    dateDisplay.textContent = todayDate.toLocaleDateString('ko-KR', dateOptions);
  }

  // 기본 설정된 과목 데이터 불러오기
  let subjects = JSON.parse(localStorage.getItem('studyPlannerSubjects')) || [
    { id: 1, name: '수학', color: '#fca5a5' },
    { id: 2, name: '영어', color: '#93c5fd' }
  ];

  // 할 일 데이터 불러오기
  let tasks = JSON.parse(localStorage.getItem('studyPlannerTasks')) || [];

  // 설정된 과목에 따라 색상 버튼(범례) 및 Select 렌더링
  function renderSubjectPickers() {
    if (subjectPickerGroup) {
      subjectPickerGroup.innerHTML = '';
      if (subjects.length === 0) {
        subjectPickerGroup.innerHTML = '<span style="font-size: 0.75rem; color: #64748b;">설정에서 과목을 추가하세요</span>';
      } else {
        subjects.forEach((subject) => {
          const btn = document.createElement('div'); // Changed to div so it's clearly a legend
          btn.className = `color-btn`;
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

  // 할 일 목록 렌더링
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

      tasks.push({
        id: Date.now(),
        title: title,
        subjectId: subjectId,
        completed: false
      });

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

  // 메인 화면용 일일 타임테이블 대시보드 (읽기 전용) 렌더링
  const weeklyData = JSON.parse(localStorage.getItem('studyPlannerWeekly')) || {};
  const startTime = 6;
  const hoursToRender = 21; 
  const dailyHeaderRow = document.getElementById('daily-header-row');
  const dayOfWeek = todayDate.getDay();
  const todayDayIdx = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // 0: Mon, 6: Sun
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
      const displayHour = hour.toString().padStart(2, '0');
      timeColHTML += `<div class="weekly-hour-label">${displayHour}</div>`;
    }
    timeColHTML += '</div>';

    let dayHTML = `<div class="weekly-day-col" data-day="${todayDayIdx}" style="border-right: none;">`;
    for (let i = 0; i < hoursToRender; i++) {
      const hour = (startTime + i) % 24;
      const displayHour = hour.toString().padStart(2, '0');
      const timeKey = `${todayDayIdx}-${displayHour}`;
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

  // 초기화
  renderSubjectPickers();
  renderTasks();
});