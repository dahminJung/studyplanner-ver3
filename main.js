document.addEventListener('DOMContentLoaded', () => {
  const timelineGrid = document.getElementById('timeline-grid');
  const taskList = document.getElementById('task-list');

  // Generate 10-min Timetable (06:00 to 02:00 next day)
  const startTime = 6;
  const hoursToRender = 21; // 6 AM to 2 AM (6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,0,1,2)

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

  // Static Task List generation (if not already in HTML)
  // Let's replace the placeholder in index.html with actual elements if needed, 
  // but for now, the static HTML placeholder is enough for "style-only" request.

  // Interaction: Click to toggle 10-min block (Visual only)
  timelineGrid.addEventListener('click', (e) => {
    if (e.target.classList.contains('min-block')) {
      e.target.classList.toggle('filled');
    }
  });
});
