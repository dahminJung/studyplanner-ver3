document.addEventListener('DOMContentLoaded', () => {
  const subjectNameInput = document.getElementById('subject-name');
  const paletteBtns = document.querySelectorAll('.palette-btn');
  const addSubjectBtn = document.getElementById('add-subject-btn');
  const subjectList = document.getElementById('subject-list');
  
  // 기본 설정된 과목 및 색상 불러오기
  let subjects = JSON.parse(localStorage.getItem('studyPlannerSubjects')) || [
    { id: 1, name: '수학', color: '#fca5a5' },
    { id: 2, name: '영어', color: '#93c5fd' }
  ];

  let selectedColor = '#fca5a5';

  // 팔레트 색상 선택 기능
  paletteBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      // 기존 선택 해제
      paletteBtns.forEach(b => b.classList.remove('selected'));
      // 새로 선택
      e.target.classList.add('selected');
      selectedColor = e.target.dataset.color;
    });
  });

  // 과목 렌더링 함수
  function renderSubjects() {
    subjectList.innerHTML = '';
    
    if(subjects.length === 0) {
      subjectList.innerHTML = '<li class="empty-list">등록된 과목이 없습니다.</li>';
      return;
    }

    subjects.forEach(subject => {
      const li = document.createElement('li');
      li.className = 'subject-item';
      li.innerHTML = `
        <div class="subject-info">
          <span class="subject-color-dot" style="background-color: ${subject.color}"></span>
          <span class="subject-name">${subject.name}</span>
        </div>
        <button class="delete-btn" data-id="${subject.id}">&times;</button>
      `;
      subjectList.appendChild(li);
    });

    // 삭제 버튼 이벤트
    document.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = parseInt(e.target.dataset.id);
        subjects = subjects.filter(s => s.id !== id);
        saveAndRender();
      });
    });
  }

  // 저장 및 화면 갱신 함수
  function saveAndRender() {
    localStorage.setItem('studyPlannerSubjects', JSON.stringify(subjects));
    renderSubjects();
    renderQuickTaskSubjects();
  }

  // 과목 추가 이벤트
  addSubjectBtn.addEventListener('click', () => {
    const name = subjectNameInput.value.trim();
    if (!name) {
      alert('과목 이름을 입력해주세요.');
      return;
    }

    const newSubject = {
      id: Date.now(),
      name: name,
      color: selectedColor
    };

    subjects.push(newSubject);
    subjectNameInput.value = '';
    saveAndRender();
  });

  // 초기 렌더링
  renderSubjects();

  // ── 자주 사용하는 Task ──────────────────────────────────────
  const quickTaskTitleInput = document.getElementById('quick-task-title');
  const quickTaskDetailInput = document.getElementById('quick-task-detail');
  const quickTaskSubjectSelect = document.getElementById('quick-task-subject');
  const addQuickTaskBtn = document.getElementById('add-quick-task-btn');
  const quickTaskList = document.getElementById('quick-task-list');

  let quickTasks = JSON.parse(localStorage.getItem('studyPlannerQuickTasks')) || [];

  function renderQuickTaskSubjects() {
    if (!quickTaskSubjectSelect) return;
    const current = quickTaskSubjectSelect.value;
    quickTaskSubjectSelect.innerHTML = '<option value="" disabled selected>과목 선택</option>';
    subjects.forEach(s => {
      const option = document.createElement('option');
      option.value = s.id;
      option.textContent = s.name;
      quickTaskSubjectSelect.appendChild(option);
    });
    quickTaskSubjectSelect.value = current;
  }

  function renderQuickTasks() {
    if (!quickTaskList) return;
    quickTaskList.innerHTML = '';
    if (quickTasks.length === 0) {
      quickTaskList.innerHTML = '<li class="empty-list">등록된 빠른 Task가 없습니다.</li>';
      return;
    }
    quickTasks.forEach(qt => {
      const subject = subjects.find(s => s.id === qt.subjectId) || { name: '지정 안됨', color: '#cbd5e1' };
      const li = document.createElement('li');
      li.className = 'qt-list-item';
      li.dataset.qtId = qt.id;

      li.innerHTML = `
        <div class="qt-list-main">
          <span class="subject-color-dot" style="background-color: ${subject.color}; flex-shrink: 0;"></span>
          <div class="qt-list-body">
            <div class="qt-list-title-row">
              <span class="qt-title-display subject-name">${qt.title}</span>
              <input class="qt-title-input form-input" value="${qt.title}" style="display:none; padding: 0.25rem 0.5rem; font-size: 0.9rem;">
              <span class="qt-subject-label">${subject.name}</span>
            </div>
            ${qt.detail ? `<div class="qt-detail-display">${qt.detail}</div>` : ''}
            <textarea class="qt-detail-input form-input" style="display:none; padding: 0.25rem 0.5rem; font-size: 0.85rem; resize: vertical; font-family: inherit;" rows="2" placeholder="자세한 내용">${qt.detail || ''}</textarea>
          </div>
        </div>
        <div class="qt-actions">
          <button class="qt-edit-btn icon-btn" title="수정">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
          </button>
          <button class="qt-save-btn primary-btn" style="display:none; padding: 0.25rem 0.7rem; font-size: 0.82rem;">저장</button>
          <button class="delete-btn" title="삭제">&times;</button>
        </div>
      `;

      const titleDisplay = li.querySelector('.qt-title-display');
      const titleInput = li.querySelector('.qt-title-input');
      const detailDisplay = li.querySelector('.qt-detail-display');
      const detailInput = li.querySelector('.qt-detail-input');
      const editBtn = li.querySelector('.qt-edit-btn');
      const saveBtn = li.querySelector('.qt-save-btn');
      const deleteBtn = li.querySelector('.delete-btn');

      editBtn.addEventListener('click', () => {
        titleDisplay.style.display = 'none';
        titleInput.style.display = 'block';
        if (detailDisplay) detailDisplay.style.display = 'none';
        detailInput.style.display = 'block';
        editBtn.style.display = 'none';
        saveBtn.style.display = 'inline-block';
        titleInput.focus();
      });

      function saveEdit() {
        const newTitle = titleInput.value.trim();
        if (!newTitle) return;
        const idx = quickTasks.findIndex(q => q.id === qt.id);
        if (idx !== -1) {
          quickTasks[idx].title = newTitle;
          quickTasks[idx].detail = detailInput.value.trim();
          localStorage.setItem('studyPlannerQuickTasks', JSON.stringify(quickTasks));
        }
        renderQuickTasks();
      }

      saveBtn.addEventListener('click', saveEdit);
      titleInput.addEventListener('keydown', e => {
        if (e.key === 'Enter') saveEdit();
        if (e.key === 'Escape') renderQuickTasks();
      });

      deleteBtn.addEventListener('click', () => {
        quickTasks = quickTasks.filter(q => q.id !== qt.id);
        localStorage.setItem('studyPlannerQuickTasks', JSON.stringify(quickTasks));
        renderQuickTasks();
      });

      quickTaskList.appendChild(li);
    });
  }

  addQuickTaskBtn.addEventListener('click', () => {
    const title = quickTaskTitleInput.value.trim();
    const subjectId = parseInt(quickTaskSubjectSelect.value);
    const detail = quickTaskDetailInput ? quickTaskDetailInput.value.trim() : '';
    if (!title || isNaN(subjectId)) {
      alert('할 일 이름과 과목을 모두 입력/선택해주세요.');
      return;
    }
    quickTasks.push({ id: Date.now(), title, subjectId, detail });
    quickTaskTitleInput.value = '';
    if (quickTaskDetailInput) quickTaskDetailInput.value = '';
    quickTaskSubjectSelect.value = '';
    localStorage.setItem('studyPlannerQuickTasks', JSON.stringify(quickTasks));
    renderQuickTasks();
  });

  renderQuickTaskSubjects();
  renderQuickTasks();

  // ── 알림 설정 ────────────────────────────────────────────
  const workerUrlInput = document.getElementById('notif-worker-url');
  const apiKeyInput = document.getElementById('notif-api-key');
  const phoneInput = document.getElementById('notif-phone');
  const appUrlInput = document.getElementById('notif-app-url');
  const saveBtn = document.getElementById('notif-save-btn');
  const testBtn = document.getElementById('notif-test-btn');
  const notifMsg = document.getElementById('notif-msg');
  const statusBadge = document.getElementById('notif-status-badge');

  // 저장된 설정 불러오기
  const notifConfig = JSON.parse(localStorage.getItem('studyPlannerNotif') || '{}');
  if (workerUrlInput && notifConfig.workerUrl) workerUrlInput.value = notifConfig.workerUrl;
  if (apiKeyInput && notifConfig.apiKey) apiKeyInput.value = notifConfig.apiKey;
  if (phoneInput && notifConfig.phone) phoneInput.value = notifConfig.phone;
  if (appUrlInput && notifConfig.appUrl) appUrlInput.value = notifConfig.appUrl;
  updateStatusBadge();

  function updateStatusBadge() {
    if (!statusBadge) return;
    const cfg = JSON.parse(localStorage.getItem('studyPlannerNotif') || '{}');
    if (cfg.workerUrl && cfg.phone && cfg.active) {
      statusBadge.textContent = '활성';
      statusBadge.className = 'notif-status-badge active';
    } else {
      statusBadge.textContent = '미설정';
      statusBadge.className = 'notif-status-badge';
    }
  }

  function showMsg(text, isError = false) {
    if (!notifMsg) return;
    notifMsg.textContent = text;
    notifMsg.style.display = 'block';
    notifMsg.className = `notif-msg ${isError ? 'error' : 'success'}`;
    setTimeout(() => { notifMsg.style.display = 'none'; }, 4000);
  }

  if (testBtn) {
    testBtn.addEventListener('click', async () => {
      const url = workerUrlInput.value.trim();
      const key = apiKeyInput.value.trim();
      if (!url) { showMsg('Worker URL을 입력해주세요.', true); return; }
      testBtn.disabled = true;
      testBtn.textContent = '확인 중...';
      try {
        const res = await fetch(`${url}/api/status`);
        const data = await res.json();
        showMsg(data.message || '연결 성공!');
      } catch {
        showMsg('연결 실패: Worker URL을 확인해주세요.', true);
      } finally {
        testBtn.disabled = false;
        testBtn.textContent = '연결 테스트';
      }
    });
  }

  if (saveBtn) {
    saveBtn.addEventListener('click', async () => {
      const url = workerUrlInput.value.trim();
      const key = apiKeyInput.value.trim();
      const phone = phoneInput.value.trim().replace(/[-\s]/g, '');
      if (!url || !key || !phone) {
        showMsg('모든 항목을 입력해주세요.', true);
        return;
      }
      if (!/^0\d{9,10}$/.test(phone)) {
        showMsg('올바른 전화번호 형식이 아닙니다. (예: 01012345678)', true);
        return;
      }
      saveBtn.disabled = true;
      saveBtn.textContent = '저장 중...';
      try {
        const res = await fetch(`${url}/api/phone`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-API-Key': key },
          body: JSON.stringify({ phone })
        });
        if (!res.ok) throw new Error(`서버 오류 ${res.status}`);
        const appUrl = appUrlInput ? appUrlInput.value.trim() : '';
        localStorage.setItem('studyPlannerNotif', JSON.stringify({ workerUrl: url, apiKey: key, phone, appUrl, active: true }));
        updateStatusBadge();
        showMsg('저장 완료! 매일 오전 8시에 SMS를 받게 됩니다.');
      } catch (err) {
        showMsg(`저장 실패: ${err.message}`, true);
      } finally {
        saveBtn.disabled = false;
        saveBtn.textContent = '저장 & 활성화';
      }
    });
  }
});
