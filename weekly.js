document.addEventListener('DOMContentLoaded', () => {
  const gridBody = document.getElementById('weekly-grid-body');
  const subjectPickerGroup = document.getElementById('weekly-subject-picker-group');
  const editBtn = document.getElementById('edit-weekly-btn');
  const saveBtn = document.getElementById('save-weekly-btn');
  const dateRangeDisplay = document.getElementById('weekly-date-range');
  const headerRow = document.getElementById('weekly-header-row');

  // 날짜 범위 계산 및 표시
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0: Sun, 1: Mon...
  const diffToMon = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(today);
  monday.setDate(today.getDate() + diffToMon);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  if (dateRangeDisplay) {
    const format = (d) => `${d.getMonth() + 1}월 ${d.getDate()}일`;
    dateRangeDisplay.textContent = `${format(monday)} ~ ${format(sunday)}`;
  }

  // 동적으로 요일 및 날짜 표시 헤더 렌더링
  if (headerRow) {
    let headerHTML = '<span>H</span>';
    const dayNames = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
    for(let d=0; d<7; d++) {
      const curDate = new Date(monday);
      curDate.setDate(monday.getDate() + d);
      headerHTML += `<span>${dayNames[d]}<br><small style="font-weight:normal; font-size:0.7rem;">${curDate.getMonth()+1}/${curDate.getDate()}</small></span>`;
    }
    headerRow.innerHTML = headerHTML;
  }

  let isEditMode = false;
  let weeklyData = JSON.parse(localStorage.getItem('studyPlannerWeekly')) || {};

  // 기본 설정된 과목 데이터 불러오기
  let subjects = JSON.parse(localStorage.getItem('studyPlannerSubjects')) || [
    { id: 1, name: '수학', color: '#fca5a5' },
    { id: 2, name: '영어', color: '#93c5fd' }
  ];

  let activeColor = subjects.length > 0 ? subjects[0].color : '#fca5a5';

  function renderSubjectPickers() {
    if (!subjectPickerGroup) return;
    subjectPickerGroup.innerHTML = '';

    if (subjects.length === 0) {
      subjectPickerGroup.innerHTML = '<span style="font-size: 0.75rem; color: #64748b;">설정에서 과목을 추가하세요</span>';
      return;
    }

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

  renderSubjectPickers();

  // Generate Weekly Timetable (06:00 to 02:00 next day -> 21 hours)
  const startTime = 6;
  const hoursToRender = 21; 

  // Create time column
  let timeColHTML = '<div class="weekly-time-col">';
  for (let i = 0; i < hoursToRender; i++) {
    const hour = (startTime + i) % 24;
    const displayHour = hour.toString().padStart(2, '0');
    timeColHTML += `<div class="weekly-hour-label">${displayHour}</div>`;
  }
  timeColHTML += '</div>';

  let daysHTML = '';
  // 7 days (MON to SUN)
  for(let d=0; d<7; d++) {
    let dayHTML = `<div class="weekly-day-col" data-day="${d}">`;
    for (let i = 0; i < hoursToRender; i++) {
      const hour = (startTime + i) % 24;
      const displayHour = hour.toString().padStart(2, '0');
      dayHTML += `
        <div class="weekly-hour-cell">
          <div class="weekly-min-block" data-time="${d}-${displayHour}" style="height: 100%;"></div>
        </div>
      `;
    }
    dayHTML += '</div>';
    daysHTML += dayHTML;
  }

  if(gridBody) {
    gridBody.innerHTML = timeColHTML + daysHTML;

    // Load saved data
    document.querySelectorAll('.weekly-min-block').forEach(block => {
      const timeKey = block.dataset.time;
      if (weeklyData[timeKey]) {
        block.style.backgroundColor = weeklyData[timeKey];
        block.dataset.paintedColor = weeklyData[timeKey];
      }
    });

    // Drag to select and color popup logic
    let isDragging = false;
    let selectedBlocks = new Set();

    gridBody.addEventListener('mousedown', (e) => {
      if (!isEditMode) return;
      if (e.target.classList.contains('weekly-min-block')) {
        isDragging = true;
        selectedBlocks.clear();
        document.querySelectorAll('.dragging-selected').forEach(b => b.classList.remove('dragging-selected'));
        e.target.classList.add('dragging-selected');
        selectedBlocks.add(e.target);
        
        const existingPopup = document.getElementById('color-popup');
        if (existingPopup) existingPopup.remove();
      }
    });

    gridBody.addEventListener('mouseover', (e) => {
      if (!isEditMode || !isDragging) return;
      if (e.target.classList.contains('weekly-min-block')) {
        e.target.classList.add('dragging-selected');
        selectedBlocks.add(e.target);
      }
    });

    document.addEventListener('mouseup', (e) => {
      if (!isEditMode || !isDragging) return;
      isDragging = false;
      
      if (selectedBlocks.size > 0) {
        showColorPopup(e.clientX, e.clientY);
      }
    });

    function showColorPopup(x, y) {
      const existingPopup = document.getElementById('color-popup');
      if (existingPopup) existingPopup.remove();

      const popup = document.createElement('div');
      popup.id = 'color-popup';
      popup.className = 'color-popup';
      popup.style.left = `${x}px`;
      popup.style.top = `${y}px`;

      subjects.forEach(subject => {
        const btn = document.createElement('button');
        btn.className = 'popup-color-btn';
        btn.style.backgroundColor = subject.color;
        btn.title = subject.name;
        btn.addEventListener('click', () => applyColorToSelection(subject.color));
        popup.appendChild(btn);
      });

      const clearBtn = document.createElement('button');
      clearBtn.className = 'popup-clear-btn';
      clearBtn.innerHTML = '&times;';
      clearBtn.title = '지우기';
      clearBtn.addEventListener('click', () => applyColorToSelection(''));
      popup.appendChild(clearBtn);

      document.body.appendChild(popup);
    }

    function applyColorToSelection(color) {
      selectedBlocks.forEach(block => {
        if (color) {
          block.style.backgroundColor = color;
          block.dataset.paintedColor = color;
        } else {
          block.style.backgroundColor = '';
          delete block.dataset.paintedColor;
        }
        block.classList.remove('dragging-selected');
      });
      selectedBlocks.clear();
      const popup = document.getElementById('color-popup');
      if (popup) popup.remove();
    }

    document.addEventListener('mousedown', (e) => {
      const popup = document.getElementById('color-popup');
      if (popup && !popup.contains(e.target) && !e.target.classList.contains('weekly-min-block')) {
        popup.remove();
        document.querySelectorAll('.dragging-selected').forEach(b => b.classList.remove('dragging-selected'));
        selectedBlocks.clear();
      }
    });
  }

  // Edit / Save logic
  if(editBtn && saveBtn) {
    editBtn.addEventListener('click', () => {
      isEditMode = true;
      editBtn.style.display = 'none';
      saveBtn.style.display = 'block';
      if(subjectPickerGroup) {
        subjectPickerGroup.style.opacity = '1';
        subjectPickerGroup.style.pointerEvents = 'auto';
      }
      gridBody.style.cursor = 'pointer';
    });

    saveBtn.addEventListener('click', () => {
      isEditMode = false;
      saveBtn.style.display = 'none';
      editBtn.style.display = 'block';
      if(subjectPickerGroup) {
        subjectPickerGroup.style.opacity = '0.5';
        subjectPickerGroup.style.pointerEvents = 'none';
      }
      gridBody.style.cursor = 'default';

      // Save to localStorage
      const newData = {};
      document.querySelectorAll('.weekly-min-block').forEach(block => {
        if (block.dataset.paintedColor) {
          newData[block.dataset.time] = block.dataset.paintedColor;
        }
      });
      localStorage.setItem('studyPlannerWeekly', JSON.stringify(newData));
      // Save timestamp to sync with daily
      localStorage.setItem('studyPlannerWeeklyLastUpdate', Date.now().toString());
      alert('위클리 타임테이블이 저장되었습니다!');
    });
  }

  // ─── 요일별 시간 설정 ────────────────────────────────────
  const timesGrid = document.getElementById('weekly-times-grid');
  const dayNames = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
  const dayLabels = ['월', '화', '수', '목', '금', '토', '일'];
  let weeklyTimes = JSON.parse(localStorage.getItem('studyPlannerWeeklyTimes') || '{}');

  function renderTimesGrid() {
    if (!timesGrid) return;
    timesGrid.innerHTML = '';
    for (let d = 0; d < 7; d++) {
      const t = weeklyTimes[d] || {};
      const col = document.createElement('div');
      col.className = 'wt-col';
      col.innerHTML = `
        <div class="wt-day-label ${d === 5 ? 'sat' : d === 6 ? 'sun' : ''}">${dayLabels[d]}</div>
        <div class="wt-row">
          <span class="wt-icon">🏠</span>
          <input type="time" class="wt-input" data-day="${d}" data-type="homeTime" value="${t.homeTime || ''}">
          <input type="time" class="wt-input" data-day="${d}" data-type="homeTime2" value="${t.homeTime2 || ''}">
        </div>
        <div class="wt-row">
          <span class="wt-icon">📚</span>
          <input type="time" class="wt-input" data-day="${d}" data-type="studyroomTime" value="${t.studyroomTime || ''}">
          <input type="time" class="wt-input" data-day="${d}" data-type="studyroomTime2" value="${t.studyroomTime2 || ''}">
        </div>
      `;
      timesGrid.appendChild(col);
    }

    timesGrid.querySelectorAll('.wt-input').forEach(input => {
      input.addEventListener('change', () => {
        const day = input.dataset.day;
        const type = input.dataset.type;
        if (!weeklyTimes[day]) weeklyTimes[day] = {};
        weeklyTimes[day][type] = input.value;
        localStorage.setItem('studyPlannerWeeklyTimes', JSON.stringify(weeklyTimes));
      });
    });
  }

  renderTimesGrid();
});