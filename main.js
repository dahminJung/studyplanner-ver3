class StudyPlanner extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.tasks = [
      { id: 1, title: '수학 공부', start: '09:00', end: '11:00', color: '#fef08a' },
      { id: 2, title: '영어 독해', start: '13:00', end: '14:30', color: '#bbf7d0' }
    ];
    this.startTimeBoundary = 6; // 오전 6시 시작
    this.endTimeBoundary = 26;  // 익일 오전 2시 종료 (24 + 2)
  }

  connectedCallback() {
    this.render();
  }

  addTask(e) {
    e.preventDefault();
    const form = this.shadowRoot.querySelector('form');
    const title = form.title.value;
    const start = form.start.value;
    const end = form.end.value;
    const color = form.color.value;

    if (title && start && end) {
      this.tasks.push({
        id: Date.now(),
        title,
        start,
        end,
        color
      });
      this.tasks.sort((a, b) => a.start.localeCompare(b.start));
      this.render();
    }
  }

  deleteTask(id) {
    this.tasks = this.tasks.filter(task => task.id !== id);
    this.render();
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: grid;
          grid-template-columns: 1fr 2fr;
          gap: 2rem;
          align-items: start;
        }

        @media (max-width: 768px) {
          :host {
            grid-template-columns: 1fr;
          }
        }

        .panel {
          background: #fff;
          padding: 1.5rem;
          border-radius: 1rem;
          box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
        }

        h2 {
          margin-top: 0;
          margin-bottom: 1.5rem;
          font-size: 1.25rem;
          color: #1f2937;
        }

        form {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        label {
          font-size: 0.875rem;
          font-weight: 600;
          color: #4b5563;
        }

        input {
          padding: 0.75rem;
          border: 1px solid #d1d5db;
          border-radius: 0.5rem;
          font-size: 1rem;
          transition: border-color 0.2s;
        }

        input:focus {
          outline: none;
          border-color: #4f46e5;
          box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
        }

        input[type="color"] {
          height: 48px;
          padding: 0.2rem;
          cursor: pointer;
        }

        button {
          background-color: #4f46e5;
          color: white;
          border: none;
          padding: 0.875rem;
          border-radius: 0.5rem;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: background-color 0.2s;
          margin-top: 0.5rem;
        }

        button:hover {
          background-color: #4338ca;
        }

        .timetable-container {
          position: relative;
          height: 600px;
          overflow-y: auto;
          border: 1px solid #e5e7eb;
          border-radius: 0.5rem;
          background: #fafafa;
        }

        .time-slots {
          position: relative;
          min-height: ${(this.endTimeBoundary - this.startTimeBoundary) * 60}px;
        }

        .hour-row {
          height: 60px;
          border-top: 1px dashed #e5e7eb;
          display: flex;
          align-items: flex-start;
          padding-left: 0.5rem;
          color: #9ca3af;
          font-size: 0.875rem;
          box-sizing: border-box;
        }
        
        .hour-row span {
          transform: translateY(-50%);
          background: #fafafa;
          padding: 0 4px;
        }

        .task-block {
          position: absolute;
          left: 60px;
          right: 15px;
          border-radius: 0.5rem;
          padding: 0.75rem;
          box-shadow: 0 2px 4px 0 rgb(0 0 0 / 0.1);
          overflow: hidden;
          font-size: 0.875rem;
          color: #1f2937;
          display: flex;
          justify-content: space-between;
          border-left: 5px solid rgba(0,0,0,0.15);
          transition: transform 0.2s;
        }

        .task-block:hover {
          transform: scale(1.01);
          z-index: 10;
        }

        .task-block strong {
          display: block;
          font-size: 1rem;
          margin-bottom: 0.25rem;
        }

        .task-block .delete-btn {
          background: transparent;
          color: rgba(0,0,0,0.4);
          border: none;
          padding: 0;
          cursor: pointer;
          font-size: 1.5rem;
          height: 24px;
          width: 24px;
          line-height: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          margin-top: -0.5rem;
        }
        
        .task-block .delete-btn:hover {
          color: #ef4444;
          background: rgba(255,255,255,0.5);
        }
      </style>
      
      <div class="panel">
        <h2>공부 일정 추가</h2>
        <form>
          <div class="form-group">
            <label for="title">과목 / 할 일</label>
            <input type="text" id="title" name="title" required placeholder="예: 수학 공부">
          </div>
          <div class="form-group">
            <label for="start">시작 시간</label>
            <input type="time" id="start" name="start" required>
          </div>
          <div class="form-group">
            <label for="end">종료 시간</label>
            <input type="time" id="end" name="end" required>
          </div>
          <div class="form-group">
            <label for="color">색상 라벨</label>
            <input type="color" id="color" name="color" value="#bae6fd">
          </div>
          <button type="submit">시간표에 추가</button>
        </form>
      </div>

      <div class="panel">
        <h2>오늘의 시간표</h2>
        <div class="timetable-container" id="scroll-container">
          <div class="time-slots">
            ${Array.from({length: (this.endTimeBoundary - this.startTimeBoundary) + 1}, (_, i) => {
              const hour = this.startTimeBoundary + i;
              const displayHour = hour % 24;
              return `
                <div class="hour-row" style="top: ${i * 60}px; position: absolute; width: 100%;">
                  <span>${displayHour.toString().padStart(2, '0')}:00</span>
                </div>
              `;
            }).join('')}
            
            ${this.tasks.map(task => {
              const startParts = task.start.split(':');
              const endParts = task.end.split(':');
              let startMinutes = parseInt(startParts[0]) * 60 + parseInt(startParts[1]);
              let endMinutes = parseInt(endParts[0]) * 60 + parseInt(endParts[1]);
              
              // 새벽 0시~2시는 24시~26시로 취급하여 계산
              if (parseInt(startParts[0]) < this.startTimeBoundary) startMinutes += 1440;
              if (parseInt(endParts[0]) < this.startTimeBoundary || (endMinutes < startMinutes)) endMinutes += 1440;

              const top = startMinutes - (this.startTimeBoundary * 60);
              const height = endMinutes - startMinutes;
              
              // 시간표 범위 밖의 일정은 표시하지 않음
              if (top < 0 || top >= (this.endTimeBoundary - this.startTimeBoundary) * 60) return '';
              
              return `
                <div class="task-block" style="top: ${top}px; height: ${height}px; background-color: ${task.color};">
                  <div>
                    <strong>${task.title}</strong>
                    <span>${task.start} - ${task.end}</span>
                  </div>
                  <button type="button" class="delete-btn" data-id="${task.id}">&times;</button>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      </div>
    `;

    this.shadowRoot.querySelector('form').addEventListener('submit', (e) => this.addTask(e));
    
    this.shadowRoot.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = parseInt(e.currentTarget.dataset.id);
        this.deleteTask(id);
      });
    });
  }
}

customElements.define('study-planner', StudyPlanner);
