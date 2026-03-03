document.addEventListener('DOMContentLoaded', () => {
  const timelineGrid = document.getElementById('timeline-grid');
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

  let activeColor = subjects.length > 0 ? subjects[0].color : '#fca5a5';

  // 설정된 과목에 따라 색상 버튼 및 Select 렌더링
  function renderSubjectPickers() {
    if (subjectPickerGroup) {
      subjectPickerGroup.innerHTML = '';
      if (subjects.length === 0) {
        subjectPickerGroup.innerHTML = '<span style="font-size: 0.75rem; color: #64748b;">설정에서 과목을 추가하세요</span>';
      } else {
        subjects.forEach((subject, index) => {
          const btn = document.createElement('button');
          btn.className = `color-btn ${index === 0 ? 'active' : ''}`;
          btn.style.backgroundColor = subject.color;
          btn.title = subject.name;
          btn.dataset.color = subject.color;
          
          btn.addEventListener('click', (e) => {
            document.querySelectorAll('.color-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            activeColor = e.target.dataset.color;
          });
          
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

  // 할 일 개수 업데이트
  function updateTaskCount() {
    if (!countDisplay) return;
    const completed = tasks.filter(t => t.completed).length;
    countDisplay.textContent = `${completed} / ${tasks.length}`;
  }

  // 데이터 저장 및 렌더링 헬퍼
  function saveAndRenderTasks() {
    localStorage.setItem('studyPlannerTasks', JSON.stringify(tasks));
    renderTasks();
  }

  // 할 일 폼 제출 이벤트
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

  // 할 일 체크박스 및 삭제 이벤트 (이벤트 위임)
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

  // 일일 타임테이블 초기화 및 렌더링
  const todayDayIdx = (todayDate.getDay() + 6) % 7; // 0: Mon ~ 6: Sun
  const todayStr = todayDate.toLocaleDateString('en-CA'); // YYYY-MM-DD
  
  const weeklyData = JSON.parse(localStorage.getItem('studyPlannerWeekly')) || {};
  let dailyData = JSON.parse(localStorage.getItem('studyPlannerDaily')) || { date: '', blocks: {} };
  const weeklyLastUpdate = parseInt(localStorage.getItem('studyPlannerWeeklyLastUpdate') || '0');
  const dailyLastSync = parseInt(localStorage.getItem('studyPlannerDailyLastSync') || '0');

  // 날짜가 바뀌었거나, 위클리 타임테이블이 방금 수정(저장)되었다면 동기화
  if (dailyData.date !== todayStr || weeklyLastUpdate > dailyLastSync) {
    dailyData = { date: todayStr, blocks: {} }; // 기존 일일 데이터 덮어쓰기
    for (let hour = 6; hour < 27; hour++) {
      const h = hour % 24;
      const displayHour = h.toString().padStart(2, '0');
      const timeKey = `${todayDayIdx}-${displayHour}`;
      if (weeklyData[timeKey]) {
        for(let m=0; m<60; m+=10) {
          const mStr = m.toString().padStart(2, '0');
          dailyData.blocks[`${displayHour}:${mStr}`] = weeklyData[timeKey];
        }
      }
    }
    localStorage.setItem('studyPlannerDaily', JSON.stringify(dailyData));
    localStorage.setItem('studyPlannerDailyLastSync', Date.now().toString());
  }

  const hoursToRender = 21; 
  if (timelineGrid) {
    timelineGrid.innerHTML = '';
    for (let i = 0; i < hoursToRender; i++) {
      const hour = (6 + i) % 24;
      const hourRow = document.createElement('div');
      hourRow.className = 'hour-row';
      const displayHour = hour.toString().padStart(2, '0');
      
      hourRow.innerHTML = `
        <div class="hour-label">${displayHour}</div>
        <div class="minutes-blocks">
          ${[0,10,20,30,40,50].map(m => {
            const mStr = m.toString().padStart(2, '0');
            const blockTime = `${displayHour}:${mStr}`;
            const color = dailyData.blocks[blockTime];
            return `<div class="min-block" data-time="${blockTime}" ${color ? `style="background-color: ${color};" data-painted-color="${color}"` : ''}></div>`;
          }).join('')}
        </div>
      `;
      timelineGrid.appendChild(hourRow);
    }

    timelineGrid.addEventListener('click', (e) => {
      if (e.target.classList.contains('min-block')) {
        const timeStr = e.target.dataset.time;
        if (e.target.dataset.paintedColor === activeColor) {
          e.target.style.backgroundColor = '';
          delete e.target.dataset.paintedColor;
          delete dailyData.blocks[timeStr];
        } else {
          e.target.style.backgroundColor = activeColor;
          e.target.dataset.paintedColor = activeColor;
          dailyData.blocks[timeStr] = activeColor;
        }
        localStorage.setItem('studyPlannerDaily', JSON.stringify(dailyData));
      }
    });
  }

  // 초기화
  renderSubjectPickers();
  renderTasks();
});
