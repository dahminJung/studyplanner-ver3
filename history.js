document.addEventListener('DOMContentLoaded', () => {
  const historyList = document.getElementById('history-list');
  const historyEmpty = document.getElementById('history-empty');
  const filterBtns = document.querySelectorAll('.history-filter-btn');

  const subjects = JSON.parse(localStorage.getItem('studyPlannerSubjects')) || [];
  const history = JSON.parse(localStorage.getItem('studyPlannerHistory')) || {};

  // ─── 날짜 유틸 ───────────────────────────────────────────
  function getDateStr(date) {
    const d = date || new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  }

  function getMondayOfWeek(date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    d.setDate(d.getDate() + diff);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  function formatDisplayDate(dateStr) {
    const [y, m, d] = dateStr.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    const weekdays = ['일', '월', '화', '수', '목', '금', '토'];
    return `${y}년 ${m}월 ${d}일 (${weekdays[date.getDay()]})`;
  }

  function getDaysAgo(dateStr) {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const [y, m, d] = dateStr.split('-').map(Number);
    const target = new Date(y, m - 1, d);
    const diff = Math.round((today - target) / 86400000);
    if (diff === 1) return '어제';
    if (diff === 0) return '오늘';
    return `${diff}일 전`;
  }

  // ─── 필터 로직 ────────────────────────────────────────────
  function getFilteredDates(filter) {
    const allDates = Object.keys(history).sort().reverse();
    if (filter === 'all') return allDates;

    const today = new Date(); today.setHours(0, 0, 0, 0);

    if (filter === 'yesterday') {
      const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
      const yStr = getDateStr(yesterday);
      return allDates.filter(d => d === yStr);
    }

    if (filter === 'thisweek') {
      const monday = getMondayOfWeek(today);
      const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
      return allDates.filter(d => {
        const [y, m, day] = d.split('-').map(Number);
        const dt = new Date(y, m - 1, day);
        return dt >= monday && dt <= yesterday;
      });
    }

    if (filter === 'lastweek') {
      const thisMonday = getMondayOfWeek(today);
      const lastMonday = new Date(thisMonday); lastMonday.setDate(thisMonday.getDate() - 7);
      const lastSunday = new Date(thisMonday); lastSunday.setDate(thisMonday.getDate() - 1);
      return allDates.filter(d => {
        const [y, m, day] = d.split('-').map(Number);
        const dt = new Date(y, m - 1, day);
        return dt >= lastMonday && dt <= lastSunday;
      });
    }

    return allDates;
  }

  // ─── 카드 렌더링 ──────────────────────────────────────────
  function renderHistory(filter) {
    const dates = getFilteredDates(filter);
    historyList.innerHTML = '';

    if (dates.length === 0) {
      historyList.style.display = 'none';
      historyEmpty.style.display = 'flex';
      return;
    }

    historyList.style.display = 'grid';
    historyEmpty.style.display = 'none';

    dates.forEach(dateStr => {
      const entry = history[dateStr];
      const tasks = entry.tasks || [];
      const completed = tasks.filter(t => t.status === 'completed' || t.completed).length;
      const failed = tasks.filter(t => t.status === 'failed').length;
      const total = tasks.length;
      const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

      const card = document.createElement('div');
      card.className = 'history-card card';

      // Task 목록 HTML
      const taskListHTML = tasks.length > 0
        ? tasks.map(t => {
            const subj = subjects.find(s => s.id === t.subjectId) || { name: '지정 안됨', color: '#cbd5e1' };
            const status = t.status || (t.completed ? 'completed' : 'pending');
            const icon = status === 'completed' ? '✓' : status === 'failed' ? '✗' : '○';
            return `
              <div class="history-task-item status-${status}">
                <span class="history-task-status-icon">${icon}</span>
                <span class="history-task-dot" style="background-color: ${subj.color}"></span>
                <span class="history-task-title">${t.title}</span>
                <span class="history-task-badge" style="background-color: ${subj.color}">${subj.name}</span>
              </div>
            `;
          }).join('')
        : '<div class="history-task-empty">할 일 없음</div>';

      card.innerHTML = `
        <div class="history-card-header">
          <div>
            <div class="history-card-date">${formatDisplayDate(dateStr)}</div>
            <div class="history-card-ago">${getDaysAgo(dateStr)}</div>
          </div>
          <div class="history-task-stat">
            <span class="history-stat-num">${completed}<span class="history-stat-total"> / ${total}</span></span>
            <span class="history-stat-label">완료</span>
          </div>
        </div>

        ${(entry.homeTime || entry.studyroomTime || entry.todayNote) ? `
        <div class="history-section">
          <div class="history-section-label">DAILY PLAN</div>
          <div class="history-daily-plan">
            ${entry.homeTime ? `<div class="history-plan-row"><span class="history-plan-icon">🏠</span><span>집에 오는 시간</span><strong>${entry.homeTime}</strong></div>` : ''}
            ${entry.studyroomTime ? `<div class="history-plan-row"><span class="history-plan-icon">📚</span><span>독서실 가는 시간</span><strong>${entry.studyroomTime}</strong></div>` : ''}
            ${entry.todayNote ? `<div class="history-plan-note">${entry.todayNote}</div>` : ''}
          </div>
        </div>` : ''}

        <div class="history-section">
          <div class="history-section-label">TASKS</div>
          <div class="history-progress-bar">
            <div class="history-progress-fill" style="width: ${pct}%"></div>
          </div>
          <div class="history-task-list">${taskListHTML}</div>
        </div>

        ${entry.memo ? `
        <div class="history-section">
          <div class="history-section-label">MEMO</div>
          <div class="history-reflection-text">${entry.memo}</div>
        </div>` : ''}

        ${entry.reflection ? `
        <div class="history-section">
          <div class="history-section-label">REFLECTION</div>
          <div class="history-reflection-text">${entry.reflection}</div>
        </div>` : ''}
      `;

      historyList.appendChild(card);
    });
  }

  // ─── 필터 버튼 이벤트 ────────────────────────────────────
  let currentFilter = 'all';
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentFilter = btn.dataset.filter;
      renderHistory(currentFilter);
    });
  });

  // ─── 초기 렌더링 ──────────────────────────────────────────
  renderHistory('all');
});
