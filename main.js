document.addEventListener('DOMContentLoaded', () => {
  const timelineGrid = document.getElementById('timeline-grid');
  
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

  // Click to toggle 10-min block
  timelineGrid.addEventListener('click', (e) => {
    if (e.target.classList.contains('min-block')) {
      e.target.classList.toggle('filled');
    }
  });

  // Task list completion count logic
  const taskList = document.getElementById('task-list');
  const countDisplay = document.querySelector('.task-count');
  
  taskList.addEventListener('change', (e) => {
    if (e.target.classList.contains('task-checkbox')) {
      const allCheckboxes = taskList.querySelectorAll('.task-checkbox');
      const checked = Array.from(allCheckboxes).filter(cb => cb.checked).length;
      countDisplay.textContent = `${checked} / ${allCheckboxes.length}`;
    }
  });
});
