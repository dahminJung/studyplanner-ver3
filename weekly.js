document.addEventListener('DOMContentLoaded', () => {
  const gridBody = document.getElementById('weekly-grid-body');
  const subjectPickerGroup = document.getElementById('weekly-subject-picker-group');
  const editBtn = document.getElementById('edit-weekly-btn');
  const saveBtn = document.getElementById('save-weekly-btn');
  
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

    // Click to paint block with the active color
    gridBody.addEventListener('click', (e) => {
      if (!isEditMode) return; // Prevent editing if not in edit mode
      
      if (e.target.classList.contains('weekly-min-block')) {
        if (e.target.dataset.paintedColor === activeColor) {
          // 이미 같은 색이면 지우기 (Toggle off)
          e.target.style.backgroundColor = '';
          delete e.target.dataset.paintedColor;
        } else {
          // 다른 색이거나 칠해져있지 않으면 현재 액티브 색상으로 칠하기
          e.target.style.backgroundColor = activeColor;
          e.target.dataset.paintedColor = activeColor;
        }
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
      alert('위클리 타임테이블이 저장되었습니다!');
    });
  }
});
