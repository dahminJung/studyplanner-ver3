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
});
