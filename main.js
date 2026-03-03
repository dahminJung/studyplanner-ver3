document.addEventListener('DOMContentLoaded', () => {
  const timelineGrid = document.getElementById('timeline-grid');
  const subjectPickerGroup = document.getElementById('subject-picker-group');
  
  // 기본 설정된 과목 데이터 불러오기
  let subjects = JSON.parse(localStorage.getItem('studyPlannerSubjects')) || [
    { id: 1, name: '수학', color: '#fca5a5' },
    { id: 2, name: '영어', color: '#93c5fd' }
  ];

  let activeColor = subjects.length > 0 ? subjects[0].color : '#fca5a5';

  // 설정된 과목에 따라 색상 버튼 렌더링
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

  // Generate 10-min Timetable (06:00 to 02:00 next day)
  const startTime = 6;
  const hoursToRender = 21; 

  for (let i = 0; i < hoursToRender; i++) {
    const hour = (startTime + i) % 24;
    const hourRow = document.createElement('div');
    hourRow.className = 'hour-row';
    
    const displayHour = hour.toString().padStart(2, '0');
    
    hourRow.innerHTML = `
      <div class="hour-label">${displayHour}</div>
      <div class="minutes-blocks">
        <div class="min-block" data-time="${displayHour}:00"></div>
        <div class="min-block" data-time="${displayHour}:10"></div>
        <div class="min-block" data-time="${displayHour}:20"></div>
        <div class="min-block" data-time="${displayHour}:30"></div>
        <div class="min-block" data-time="${displayHour}:40"></div>
        <div class="min-block" data-time="${displayHour}:50"></div>
      </div>
    `;
    
    timelineGrid.appendChild(hourRow);
  }

  // Click to paint 10-min block with the active color
  timelineGrid.addEventListener('click', (e) => {
    if (e.target.classList.contains('min-block')) {
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

  // Task list completion count logic
  const taskList = document.getElementById('task-list');
  const countDisplay = document.querySelector('.task-count');
  
  if (taskList) {
    taskList.addEventListener('change', (e) => {
      if (e.target.classList.contains('task-checkbox')) {
        const allCheckboxes = taskList.querySelectorAll('.task-checkbox');
        const checked = Array.from(allCheckboxes).filter(cb => cb.checked).length;
        countDisplay.textContent = `${checked} / ${allCheckboxes.length}`;
      }
    });
  }
});
