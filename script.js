// ============================================
// 랜덤 조 편성기 - TDD 기반 구현
// ============================================

// ============================================
// 1. 핵심 로직 (순수 함수)
// ============================================

/**
 * Fisher-Yates Shuffle 알고리즘
 * @param {Array} array - 셔플할 배열
 * @returns {Array} - 셔플된 새 배열
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
 * 참가자를 N개 조로 균등 배분
 * @param {Array} participants - 참가자 배열
 * @param {number} teamCount - 조 개수
 * @returns {Array<Array>} - 조별 배열
 */
function distributeToTeams(participants, teamCount) {
  const shuffled = shuffle(participants);
  const teams = Array.from({ length: teamCount }, () => []);

  shuffled.forEach((participant, index) => {
    teams[index % teamCount].push(participant);
  });

  return teams;
}

/**
 * 조장 고정 배치 후 나머지 참가자 배분
 * @param {Object} leaders - 조장 객체 {1: "이름", 2: "이름", ...}
 * @param {Array} participants - 일반 참가자 배열
 * @param {number} teamCount - 조 개수
 * @returns {Object} - 조별 결과 {1: [...], 2: [...], ...}
 */
function assignTeams(leaders, participants, teamCount = 4) {
  const teams = {};

  // 조장 먼저 배치
  for (let i = 1; i <= teamCount; i++) {
    teams[i] = leaders[i] ? [{ name: leaders[i], isLeader: true }] : [];
  }

  // 일반 참가자 셔플 후 배분
  const shuffled = shuffle(participants);
  shuffled.forEach((name, index) => {
    const teamNum = (index % teamCount) + 1;
    teams[teamNum].push({ name, isLeader: false });
  });

  return teams;
}

/**
 * 신뢰도 테스트 - N회 시뮬레이션
 * @param {Array} participants - 참가자 배열
 * @param {number} teamCount - 조 개수
 * @param {number} iterations - 시뮬레이션 횟수
 * @returns {Object} - 각 참가자별 조 배분 통계
 */
function runDistributionTest(participants, teamCount, iterations) {
  const stats = {};

  // 통계 초기화
  participants.forEach(name => {
    stats[name] = {};
    for (let i = 1; i <= teamCount; i++) {
      stats[name][i] = 0;
    }
  });

  // 시뮬레이션 실행
  for (let i = 0; i < iterations; i++) {
    const shuffled = shuffle(participants);
    shuffled.forEach((name, index) => {
      const teamNum = (index % teamCount) + 1;
      stats[name][teamNum]++;
    });
  }

  return stats;
}

/**
 * 분포 균등성 검사
 * @param {Object} stats - 통계 객체
 * @param {number} iterations - 총 시뮬레이션 횟수
 * @param {number} teamCount - 조 개수
 * @returns {Object} - {isUniform: boolean, maxDeviation: number}
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
    isUniform: maxDeviation < 5, // 5% 이내면 균등
    maxDeviation: Math.round(maxDeviation * 100) / 100
  };
}

// ============================================
// 2. 테스트 프레임워크 (간단한 구현)
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
// 3. 단위 테스트 (RED → GREEN)
// ============================================

// 테스트 1: shuffle 함수가 배열을 반환하는지
TestRunner.test('shuffle은 배열을 반환해야 한다', () => {
  const arr = [1, 2, 3, 4, 5];
  const result = shuffle(arr);
  TestRunner.assertTrue(Array.isArray(result), 'shuffle 결과가 배열이 아님');
});

// 테스트 2: shuffle 함수가 원본 배열을 변경하지 않는지
TestRunner.test('shuffle은 원본 배열을 변경하지 않아야 한다', () => {
  const arr = [1, 2, 3, 4, 5];
  const original = [...arr];
  shuffle(arr);
  TestRunner.assertEqual(arr, original, '원본 배열이 변경됨');
});

// 테스트 3: shuffle 결과가 같은 요소를 포함하는지
TestRunner.test('shuffle 결과는 원본과 같은 요소를 포함해야 한다', () => {
  const arr = [1, 2, 3, 4, 5];
  const result = shuffle(arr);
  TestRunner.assertEqual(result.sort(), arr.sort(), '요소가 다름');
});

// 테스트 4: distributeToTeams가 올바른 개수의 팀을 반환하는지
TestRunner.test('distributeToTeams는 지정된 개수의 팀을 반환해야 한다', () => {
  const participants = ['A', 'B', 'C', 'D', 'E', 'F'];
  const result = distributeToTeams(participants, 4);
  TestRunner.assertEqual(result.length, 4, '팀 개수가 다름');
});

// 테스트 5: distributeToTeams가 모든 참가자를 배분하는지
TestRunner.test('distributeToTeams는 모든 참가자를 배분해야 한다', () => {
  const participants = ['A', 'B', 'C', 'D', 'E', 'F'];
  const result = distributeToTeams(participants, 4);
  const total = result.reduce((sum, team) => sum + team.length, 0);
  TestRunner.assertEqual(total, participants.length, '참가자 수가 맞지 않음');
});

// 테스트 6: distributeToTeams가 균등 배분하는지
TestRunner.test('distributeToTeams는 균등하게 배분해야 한다 (최대 1명 차이)', () => {
  const participants = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];
  const result = distributeToTeams(participants, 4);
  const lengths = result.map(team => team.length);
  const max = Math.max(...lengths);
  const min = Math.min(...lengths);
  TestRunner.assertTrue(max - min <= 1, `불균등 배분: 최대 ${max}, 최소 ${min}`);
});

// 테스트 7: assignTeams가 조장을 포함하는지
TestRunner.test('assignTeams는 조장을 각 팀에 포함해야 한다', () => {
  const leaders = { 1: '김조장', 2: '이조장', 3: '박조장', 4: '최조장' };
  const participants = ['A', 'B', 'C', 'D'];
  const result = assignTeams(leaders, participants);

  TestRunner.assertTrue(result[1][0].name === '김조장', '1조 조장 누락');
  TestRunner.assertTrue(result[2][0].name === '이조장', '2조 조장 누락');
  TestRunner.assertTrue(result[3][0].name === '박조장', '3조 조장 누락');
  TestRunner.assertTrue(result[4][0].name === '최조장', '4조 조장 누락');
});

// 테스트 8: assignTeams의 조장이 isLeader 플래그를 가지는지
TestRunner.test('assignTeams의 조장은 isLeader가 true여야 한다', () => {
  const leaders = { 1: '김조장', 2: '이조장', 3: '박조장', 4: '최조장' };
  const result = assignTeams(leaders, []);

  TestRunner.assertTrue(result[1][0].isLeader === true, '조장 플래그 누락');
});

// 테스트 9: runDistributionTest가 올바른 구조를 반환하는지
TestRunner.test('runDistributionTest는 각 참가자별 조 통계를 반환해야 한다', () => {
  const participants = ['A', 'B'];
  const result = runDistributionTest(participants, 4, 100);

  TestRunner.assertTrue('A' in result, 'A 참가자 누락');
  TestRunner.assertTrue('B' in result, 'B 참가자 누락');
  TestRunner.assertTrue(1 in result['A'], '1조 통계 누락');
  TestRunner.assertTrue(4 in result['A'], '4조 통계 누락');
});

// 테스트 10: runDistributionTest 통계 합계가 iterations와 같은지
TestRunner.test('runDistributionTest 통계 합계는 iterations와 같아야 한다', () => {
  const participants = ['A', 'B', 'C'];
  const iterations = 100;
  const result = runDistributionTest(participants, 4, iterations);

  Object.keys(result).forEach(name => {
    const sum = Object.values(result[name]).reduce((a, b) => a + b, 0);
    TestRunner.assertEqual(sum, iterations, `${name}의 합계가 맞지 않음`);
  });
});

// 콘솔에 테스트 실행
console.log('=== 단위 테스트 실행 ===\n');
TestRunner.run();

// ============================================
// 4. DOM 조작 및 이벤트 핸들러
// ============================================

// 디폴트 참가자 데이터
const DEFAULT_PARTICIPANTS = [
  '홍길동', '김철수', '이영희', '박민수',
  '정수진', '강동원', '한지민', '송혜교',
  '유재석', '강호동', '이광수', '전소민'
];

// 앱 상태
const appState = {
  participants: [...DEFAULT_PARTICIPANTS],
  leaders: {
    1: '김조장',
    2: '이조장',
    3: '박조장',
    4: '최조장'
  }
};

// DOM 요소
const elements = {
  participantsList: document.getElementById('participantsList'),
  addParticipantBtn: document.getElementById('addParticipantBtn'),
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
    3: document.getElementById('leader3'),
    4: document.getElementById('leader4')
  }
};

// 참가자 목록 렌더링
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

  // 입력 이벤트 바인딩
  elements.participantsList.querySelectorAll('input').forEach(input => {
    input.addEventListener('change', (e) => {
      const index = parseInt(e.target.dataset.index);
      appState.participants[index] = e.target.value;
    });
  });

  // 삭제 이벤트 바인딩
  elements.participantsList.querySelectorAll('.remove-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const index = parseInt(e.target.dataset.index);
      appState.participants.splice(index, 1);
      renderParticipants();
    });
  });
}

// 참가자 추가
function addParticipant() {
  const newName = `참가자${appState.participants.length + 1}`;
  appState.participants.push(newName);
  renderParticipants();

  // 새로 추가된 입력 필드에 포커스
  const inputs = elements.participantsList.querySelectorAll('input');
  const lastInput = inputs[inputs.length - 1];
  lastInput.focus();
  lastInput.select();
}

// 조장 정보 가져오기
function getLeaders() {
  return {
    1: elements.leaderInputs[1].value,
    2: elements.leaderInputs[2].value,
    3: elements.leaderInputs[3].value,
    4: elements.leaderInputs[4].value
  };
}

// 조 편성 결과 렌더링
function renderResults(teams) {
  elements.teamsGrid.innerHTML = '';

  for (let i = 1; i <= 4; i++) {
    const card = document.createElement('div');
    card.className = 'team-card';

    const members = teams[i].map(member =>
      `<li class="${member.isLeader ? 'leader' : ''}">${member.name}</li>`
    ).join('');

    card.innerHTML = `
      <h3>${i}조</h3>
      <ul>${members}</ul>
    `;
    elements.teamsGrid.appendChild(card);
  }

  elements.resultsSection.style.display = 'block';
}

// 조 편성 실행
function handleShuffle() {
  const leaders = getLeaders();
  const teams = assignTeams(leaders, appState.participants);
  renderResults(teams);
}

// 신뢰도 테스트 실행
function handleTest() {
  const iterations = 2000;
  const stats = runDistributionTest(appState.participants, 4, iterations);
  const uniformity = checkUniformity(stats, iterations, 4);

  renderTestResults(stats, iterations, uniformity);
  elements.testModal.style.display = 'flex';
}

// 테스트 결과 렌더링
function renderTestResults(stats, iterations, uniformity) {
  elements.testResults.innerHTML = '';

  Object.entries(stats).forEach(([name, teamStats]) => {
    const personDiv = document.createElement('div');
    personDiv.className = 'test-person';

    let barsHTML = `<h4>${name}</h4>`;

    for (let i = 1; i <= 4; i++) {
      const count = teamStats[i];
      const percentage = (count / iterations * 100).toFixed(1);
      const width = percentage;

      barsHTML += `
        <div class="bar-container">
          <span class="bar-label">${i}조</span>
          <div class="bar-track">
            <div class="bar-fill" style="width: ${width}%"></div>
          </div>
          <span class="bar-value">${percentage}% (${count}회)</span>
        </div>
      `;
    }

    personDiv.innerHTML = barsHTML;
    elements.testResults.appendChild(personDiv);
  });

  // 요약
  const summaryClass = uniformity.isUniform ? 'success' : 'warning';
  const summaryText = uniformity.isUniform
    ? `✅ 균등 분포 확인됨 (최대 편차: ${uniformity.maxDeviation}%)`
    : `⚠️ 분포 편차 존재 (최대 편차: ${uniformity.maxDeviation}%)`;

  elements.testSummary.className = `test-summary ${summaryClass}`;
  elements.testSummary.textContent = summaryText;
}

// 모달 닫기
function closeModal() {
  elements.testModal.style.display = 'none';
}

// 이벤트 리스너 등록
function initEventListeners() {
  elements.addParticipantBtn.addEventListener('click', addParticipant);
  elements.shuffleBtn.addEventListener('click', handleShuffle);
  elements.testBtn.addEventListener('click', handleTest);
  elements.closeModalBtn.addEventListener('click', closeModal);

  // 모달 외부 클릭 시 닫기
  elements.testModal.addEventListener('click', (e) => {
    if (e.target === elements.testModal) {
      closeModal();
    }
  });

  // ESC 키로 모달 닫기
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeModal();
    }
  });
}

// 앱 초기화
function initApp() {
  renderParticipants();
  initEventListeners();
  console.log('\n앱이 초기화되었습니다.');
}

// DOM 로드 후 초기화
document.addEventListener('DOMContentLoaded', initApp);
