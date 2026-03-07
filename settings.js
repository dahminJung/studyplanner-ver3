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
      li.className = 'subject-item';
      li.innerHTML = `
        <div class="subject-info">
          <span class="subject-color-dot" style="background-color: ${subject.color}"></span>
          <span class="subject-name">${qt.title}</span>
          <span style="font-size: 0.75rem; color: var(--text-muted);">${subject.name}</span>
        </div>
        <button class="delete-btn" data-qt-id="${qt.id}">&times;</button>
      `;
      quickTaskList.appendChild(li);
    });
    document.querySelectorAll('[data-qt-id]').forEach(btn => {
      btn.addEventListener('click', e => {
        const id = parseInt(e.target.dataset.qtId);
        quickTasks = quickTasks.filter(qt => qt.id !== id);
        localStorage.setItem('studyPlannerQuickTasks', JSON.stringify(quickTasks));
        renderQuickTasks();
      });
    });
  }

  addQuickTaskBtn.addEventListener('click', () => {
    const title = quickTaskTitleInput.value.trim();
    const subjectId = parseInt(quickTaskSubjectSelect.value);
    if (!title || isNaN(subjectId)) {
      alert('할 일 이름과 과목을 모두 입력/선택해주세요.');
      return;
    }
    quickTasks.push({ id: Date.now(), title, subjectId });
    quickTaskTitleInput.value = '';
    quickTaskSubjectSelect.value = '';
    localStorage.setItem('studyPlannerQuickTasks', JSON.stringify(quickTasks));
    renderQuickTasks();
  });

  renderQuickTaskSubjects();
  renderQuickTasks();
});
