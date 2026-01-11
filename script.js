// ============================================
// 랜덤 조 편성기 - 3개 조 + 조장/부조장 + 제약조건
// ============================================

// ============================================
// 1. 설정
// ============================================
const TEAM_COUNT = 3;

// ============================================
// 2. 핵심 로직 (순수 함수)
// ============================================

/**
 * Fisher-Yates Shuffle 알고리즘
 */
function shuffle(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * 조장/부조장 + 제약조건 + 나머지 참가자 배분
 */
function assignTeams(leaders, subLeaders, participants, constraints, teamCount = TEAM_COUNT) {
  const teams = {};

  // 1. 조장/부조장 먼저 배치
  for (let i = 1; i <= teamCount; i++) {
    teams[i] = [];
    if (leaders[i]) {
      teams[i].push({ name: leaders[i], role: 'leader' });
    }
    if (subLeaders[i]) {
      teams[i].push({ name: subLeaders[i], role: 'subLeader' });
    }
  }

  // 2. 제약조건 멤버 배치
  constraints.forEach(({ name, team }) => {
    if (team >= 1 && team <= teamCount) {
      teams[team].push({ name, role: 'constrained' });
    }
  });

  // 3. 나머지 참가자에서 조장/부조장/제약조건 멤버 제외
  const excludeNames = new Set([
    ...Object.values(leaders),
    ...Object.values(subLeaders),
    ...constraints.map(c => c.name)
  ].filter(Boolean));

  const remainingParticipants = participants.filter(name => !excludeNames.has(name));

  // 4. 남은 참가자 셔플 후 균등 배분 (인원 적은 조에 먼저 배치)
  const shuffled = shuffle(remainingParticipants);
  shuffled.forEach((name) => {
    // 현재 인원이 가장 적은 조 찾기
    let minTeam = 1;
    let minCount = teams[1].length;
    for (let i = 2; i <= teamCount; i++) {
      if (teams[i].length < minCount) {
        minCount = teams[i].length;
        minTeam = i;
      }
    }
    teams[minTeam].push({ name, role: 'member' });
  });

  return teams;
}

/**
 * 신뢰도 테스트 - N회 시뮬레이션 (제약조건 제외 멤버만)
 */
function runDistributionTest(participants, constraints, teamCount, iterations) {
  // 제약조건 멤버 제외
  const constraintNames = new Set(constraints.map(c => c.name));
  const testParticipants = participants.filter(name => !constraintNames.has(name));

  const stats = {};
  testParticipants.forEach(name => {
    stats[name] = {};
    for (let i = 1; i <= teamCount; i++) {
      stats[name][i] = 0;
    }
  });

  for (let i = 0; i < iterations; i++) {
    const shuffled = shuffle(testParticipants);
    shuffled.forEach((name, index) => {
      const teamNum = (index % teamCount) + 1;
      stats[name][teamNum]++;
    });
  }

  return stats;
}

/**
 * 분포 균등성 검사
 */
function checkUniformity(stats, iterations, teamCount) {
  const expected = iterations / teamCount;
  let maxDeviation = 0;

  Object.values(stats).forEach(personStats => {
    Object.values(personStats).forEach(count => {
      const deviation = Math.abs((count - expected) / expected * 100);
      if (deviation > maxDeviation) {
        maxDeviation = deviation;
      }
    });
  });

  return {
    isUniform: maxDeviation < 5,
    maxDeviation: Math.round(maxDeviation * 100) / 100
  };
}

// ============================================
// 3. 테스트 프레임워크
// ============================================

const TestRunner = {
  tests: [],
  results: { passed: 0, failed: 0, errors: [] },

  test(name, fn) {
    this.tests.push({ name, fn });
  },

  assertEqual(actual, expected, message) {
    if (JSON.stringify(actual) !== JSON.stringify(expected)) {
      throw new Error(`${message}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
    }
  },

  assertTrue(condition, message) {
    if (!condition) {
      throw new Error(message);
    }
  },

  run() {
    this.results = { passed: 0, failed: 0, errors: [] };
    this.tests.forEach(({ name, fn }) => {
      try {
        fn();
        this.results.passed++;
        console.log(`✅ ${name}`);
      } catch (e) {
        this.results.failed++;
        this.results.errors.push({ name, error: e.message });
        console.error(`❌ ${name}: ${e.message}`);
      }
    });
    console.log(`\n테스트 결과: ${this.results.passed} passed, ${this.results.failed} failed`);
    return this.results;
  }
};

// ============================================
// 4. 단위 테스트
// ============================================

TestRunner.test('shuffle은 배열을 반환해야 한다', () => {
  const arr = [1, 2, 3, 4, 5];
  const result = shuffle(arr);
  TestRunner.assertTrue(Array.isArray(result), 'shuffle 결과가 배열이 아님');
});

TestRunner.test('shuffle은 원본 배열을 변경하지 않아야 한다', () => {
  const arr = [1, 2, 3, 4, 5];
  const original = [...arr];
  shuffle(arr);
  TestRunner.assertEqual(arr, original, '원본 배열이 변경됨');
});

TestRunner.test('assignTeams는 조장을 각 팀에 포함해야 한다', () => {
  const leaders = { 1: '김조장', 2: '이조장', 3: '박조장' };
  const subLeaders = { 1: '김부', 2: '이부', 3: '박부' };
  const result = assignTeams(leaders, subLeaders, [], [], 3);

  TestRunner.assertTrue(result[1][0].name === '김조장', '1조 조장 누락');
  TestRunner.assertTrue(result[2][0].name === '이조장', '2조 조장 누락');
  TestRunner.assertTrue(result[3][0].name === '박조장', '3조 조장 누락');
});

TestRunner.test('assignTeams는 제약조건 멤버를 지정된 조에 배치해야 한다', () => {
  const leaders = { 1: '김조장', 2: '이조장', 3: '박조장' };
  const subLeaders = { 1: '김부', 2: '이부', 3: '박부' };
  const constraints = [{ name: '홍길동', team: 2 }];
  const result = assignTeams(leaders, subLeaders, ['홍길동', 'A', 'B'], constraints, 3);

  const team2Names = result[2].map(m => m.name);
  TestRunner.assertTrue(team2Names.includes('홍길동'), '제약조건 멤버가 2조에 없음');
});

TestRunner.test('assignTeams는 모든 참가자를 배분해야 한다', () => {
  const leaders = { 1: 'L1', 2: 'L2', 3: 'L3' };
  const subLeaders = { 1: 'S1', 2: 'S2', 3: 'S3' };
  const participants = ['A', 'B', 'C', 'D', 'E', 'F'];
  const result = assignTeams(leaders, subLeaders, participants, [], 3);

  const total = result[1].length + result[2].length + result[3].length;
  // 조장3 + 부조장3 + 참가자6 = 12
  TestRunner.assertEqual(total, 12, '참가자 수가 맞지 않음');
});

console.log('=== 단위 테스트 실행 ===\n');
TestRunner.run();

// ============================================
// 5. 디폴트 데이터
// ============================================

// 전체 29명 명단
const ALL_MEMBERS = [
  '김가령', '강혜주', '구자민', '조보람', '이윤진',
  '김응찬', '권은영', '최민경', '이혜진', '권영진',
  '송선호', '최희준', '이동수', '신정헌', '이소영',
  '김지웅', '유지은', '권혁우', '신나리', '심명희',
  '김상균', '하은지(9기)', '우혜빈(9기)', '전정하', '장은지',
  '김혜인', '이동현', '이새예', '강낙훈'
];

// 조장/부조장 (배분 대상에서 제외됨)
const DEFAULT_LEADERS = {
  1: '김가령',
  2: '최희준',
  3: '송선호'
};

const DEFAULT_SUB_LEADERS = {
  1: '김지웅',
  2: '권혁우',
  3: '이윤진'
};

// 일반 참가자 (조장/부조장 제외)
const LEADER_NAMES = new Set([
  ...Object.values(DEFAULT_LEADERS),
  ...Object.values(DEFAULT_SUB_LEADERS)
]);

const DEFAULT_PARTICIPANTS = ALL_MEMBERS.filter(name => !LEADER_NAMES.has(name));

// 기본 제약조건
const DEFAULT_CONSTRAINTS = [
  { name: '김상균', team: 2 },
  { name: '이동수', team: 2 }
];

// ============================================
// 6. 앱 상태
// ============================================

const appState = {
  participants: [...DEFAULT_PARTICIPANTS],
  leaders: { ...DEFAULT_LEADERS },
  subLeaders: { ...DEFAULT_SUB_LEADERS },
  constraints: [...DEFAULT_CONSTRAINTS]
};

// ============================================
// 7. DOM 요소
// ============================================

const elements = {
  participantsList: document.getElementById('participantsList'),
  constraintsList: document.getElementById('constraintsList'),
  addParticipantBtn: document.getElementById('addParticipantBtn'),
  addConstraintBtn: document.getElementById('addConstraintBtn'),
  shuffleBtn: document.getElementById('shuffleBtn'),
  testBtn: document.getElementById('testBtn'),
  resultsSection: document.getElementById('resultsSection'),
  teamsGrid: document.getElementById('teamsGrid'),
  testModal: document.getElementById('testModal'),
  closeModalBtn: document.getElementById('closeModalBtn'),
  testResults: document.getElementById('testResults'),
  testSummary: document.getElementById('testSummary'),
  leaderInputs: {
    1: document.getElementById('leader1'),
    2: document.getElementById('leader2'),
    3: document.getElementById('leader3')
  },
  subLeaderInputs: {
    1: document.getElementById('subLeader1'),
    2: document.getElementById('subLeader2'),
    3: document.getElementById('subLeader3')
  }
};

// ============================================
// 8. 렌더링 함수
// ============================================

function renderParticipants() {
  elements.participantsList.innerHTML = '';

  appState.participants.forEach((name, index) => {
    const tag = document.createElement('div');
    tag.className = 'participant-tag';
    tag.innerHTML = `
      <input type="text" value="${name}" data-index="${index}">
      <button class="remove-btn" data-index="${index}">&times;</button>
    `;
    elements.participantsList.appendChild(tag);
  });

  // 이벤트 바인딩
  elements.participantsList.querySelectorAll('input').forEach(input => {
    input.addEventListener('change', (e) => {
      const index = parseInt(e.target.dataset.index);
      appState.participants[index] = e.target.value;
    });
  });

  elements.participantsList.querySelectorAll('.remove-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const index = parseInt(e.target.dataset.index);
      appState.participants.splice(index, 1);
      renderParticipants();
    });
  });
}

function renderConstraints() {
  elements.constraintsList.innerHTML = '';

  appState.constraints.forEach((constraint, index) => {
    const item = document.createElement('div');
    item.className = 'constraint-item';
    item.innerHTML = `
      <input type="text" value="${constraint.name}" data-index="${index}" placeholder="이름">
      <span>→</span>
      <select data-index="${index}">
        <option value="1" ${constraint.team === 1 ? 'selected' : ''}>1조</option>
        <option value="2" ${constraint.team === 2 ? 'selected' : ''}>2조</option>
        <option value="3" ${constraint.team === 3 ? 'selected' : ''}>3조</option>
      </select>
      <span>고정</span>
      <button class="remove-btn" data-index="${index}">&times;</button>
    `;
    elements.constraintsList.appendChild(item);
  });

  // 이벤트 바인딩
  elements.constraintsList.querySelectorAll('input').forEach(input => {
    input.addEventListener('change', (e) => {
      const index = parseInt(e.target.dataset.index);
      appState.constraints[index].name = e.target.value;
    });
  });

  elements.constraintsList.querySelectorAll('select').forEach(select => {
    select.addEventListener('change', (e) => {
      const index = parseInt(e.target.dataset.index);
      appState.constraints[index].team = parseInt(e.target.value);
    });
  });

  elements.constraintsList.querySelectorAll('.remove-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const index = parseInt(e.target.dataset.index);
      appState.constraints.splice(index, 1);
      renderConstraints();
    });
  });
}

function renderResults(teams) {
  elements.teamsGrid.innerHTML = '';

  for (let i = 1; i <= TEAM_COUNT; i++) {
    const card = document.createElement('div');
    card.className = 'team-card';

    const members = teams[i].map(member => {
      let className = '';
      if (member.role === 'leader') className = 'leader';
      else if (member.role === 'subLeader') className = 'sub-leader';
      else if (member.role === 'constrained') className = 'constrained';
      return `<li class="${className}">${member.name}</li>`;
    }).join('');

    card.innerHTML = `
      <h3>${i}조 (${teams[i].length}명)</h3>
      <ul>${members}</ul>
    `;
    elements.teamsGrid.appendChild(card);
  }

  elements.resultsSection.style.display = 'block';
}

function renderTestResults(stats, iterations, uniformity) {
  elements.testResults.innerHTML = '';

  Object.entries(stats).forEach(([name, teamStats]) => {
    const personDiv = document.createElement('div');
    personDiv.className = 'test-person';

    let barsHTML = `<h4>${name}</h4>`;

    for (let i = 1; i <= TEAM_COUNT; i++) {
      const count = teamStats[i];
      const percentage = (count / iterations * 100).toFixed(1);
      const width = (percentage / 100 * TEAM_COUNT * 100).toFixed(1); // 스케일 조정

      barsHTML += `
        <div class="bar-container">
          <span class="bar-label">${i}조</span>
          <div class="bar-track">
            <div class="bar-fill" style="width: ${Math.min(width, 100)}%"></div>
          </div>
          <span class="bar-value">${percentage}% (${count}회)</span>
        </div>
      `;
    }

    personDiv.innerHTML = barsHTML;
    elements.testResults.appendChild(personDiv);
  });

  const summaryClass = uniformity.isUniform ? 'success' : 'warning';
  const summaryText = uniformity.isUniform
    ? `✅ 균등 분포 확인됨 (최대 편차: ${uniformity.maxDeviation}%)`
    : `⚠️ 분포 편차 존재 (최대 편차: ${uniformity.maxDeviation}%)`;

  elements.testSummary.className = `test-summary ${summaryClass}`;
  elements.testSummary.textContent = summaryText;
}

// ============================================
// 9. 이벤트 핸들러
// ============================================

function getLeaders() {
  return {
    1: elements.leaderInputs[1].value,
    2: elements.leaderInputs[2].value,
    3: elements.leaderInputs[3].value
  };
}

function getSubLeaders() {
  return {
    1: elements.subLeaderInputs[1].value,
    2: elements.subLeaderInputs[2].value,
    3: elements.subLeaderInputs[3].value
  };
}

function addParticipant() {
  const newName = `참가자${appState.participants.length + 1}`;
  appState.participants.push(newName);
  renderParticipants();

  const inputs = elements.participantsList.querySelectorAll('input');
  const lastInput = inputs[inputs.length - 1];
  lastInput.focus();
  lastInput.select();
}

function addConstraint() {
  appState.constraints.push({ name: '', team: 1 });
  renderConstraints();

  const inputs = elements.constraintsList.querySelectorAll('input');
  const lastInput = inputs[inputs.length - 1];
  lastInput.focus();
}

function handleShuffle() {
  const leaders = getLeaders();
  const subLeaders = getSubLeaders();
  const teams = assignTeams(leaders, subLeaders, appState.participants, appState.constraints, TEAM_COUNT);
  renderResults(teams);
}

function handleTest() {
  const iterations = 2000;
  const leaders = getLeaders();
  const subLeaders = getSubLeaders();

  // 조장/부조장 제외
  const excludeNames = new Set([
    ...Object.values(leaders),
    ...Object.values(subLeaders)
  ].filter(Boolean));

  const testParticipants = appState.participants.filter(name => !excludeNames.has(name));
  const stats = runDistributionTest(testParticipants, appState.constraints, TEAM_COUNT, iterations);
  const uniformity = checkUniformity(stats, iterations, TEAM_COUNT);

  renderTestResults(stats, iterations, uniformity);
  elements.testModal.style.display = 'flex';
}

function closeModal() {
  elements.testModal.style.display = 'none';
}

// ============================================
// 10. 초기화
// ============================================

function initEventListeners() {
  elements.addParticipantBtn.addEventListener('click', addParticipant);
  elements.addConstraintBtn.addEventListener('click', addConstraint);
  elements.shuffleBtn.addEventListener('click', handleShuffle);
  elements.testBtn.addEventListener('click', handleTest);
  elements.closeModalBtn.addEventListener('click', closeModal);

  elements.testModal.addEventListener('click', (e) => {
    if (e.target === elements.testModal) {
      closeModal();
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeModal();
    }
  });
}

function initApp() {
  renderParticipants();
  renderConstraints();
  initEventListeners();
  console.log('\n앱이 초기화되었습니다.');
  console.log(`총 참가자: ${appState.participants.length}명`);
  console.log(`제약조건: ${appState.constraints.length}개`);
}

document.addEventListener('DOMContentLoaded', initApp);
