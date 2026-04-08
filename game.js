// ========================================================
// 한글 모험대 - game.js
// 지적장애 초등 저학년을 위한 한글 학습 게임
// ========================================================

'use strict';

// ── 전역 상태 ──────────────────────────────────────────
const state = {
  studentName: '',
  currentMode: null,
  currentQ: 0,
  totalQ: 0,
  correctCount: 0,
  questions: [],
  syllableSelected: [],
  audioCtx: null,
  resultData: null,
};

// ── Web Audio API 헬퍼 ────────────────────────────────
function getAudioCtx() {
  if (!state.audioCtx) {
    state.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  return state.audioCtx;
}

function playTone(frequency, duration, type = 'sine', volume = 0.4) {
  try {
    const ctx = getAudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = type;
    osc.frequency.setValueAtTime(frequency, ctx.currentTime);
    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration);
  } catch (err) {
    // Web Audio API may be unavailable in some Android browsers; audio is non-critical
    console.warn('Audio playback unavailable:', err.message);
  }
}

function playCorrectSound() {
  playTone(523, 0.15);
  setTimeout(() => playTone(659, 0.15), 130);
  setTimeout(() => playTone(784, 0.25), 260);
}

function playWrongSound() {
  playTone(250, 0.3, 'sawtooth', 0.3);
}

function playSuccessSound() {
  [523, 659, 784, 1047].forEach((f, i) => {
    setTimeout(() => playTone(f, 0.2), i * 120);
  });
}

// ── 데이터: 그림-단어 매칭 ────────────────────────────
const pictureWords = [
  { emoji: '🍎', word: '사과',   wrong: ['바나나', '포도', '딸기'] },
  { emoji: '🐶', word: '강아지', wrong: ['고양이', '토끼', '물고기'] },
  { emoji: '🚗', word: '자동차', wrong: ['버스', '자전거', '기차'] },
  { emoji: '📚', word: '책',     wrong: ['연필', '공책', '가방'] },
  { emoji: '🌸', word: '꽃',     wrong: ['나무', '풀', '열매'] },
  { emoji: '🐟', word: '물고기', wrong: ['거북이', '개구리', '새우'] },
  { emoji: '🏠', word: '집',     wrong: ['학교', '병원', '가게'] },
  { emoji: '✏️', word: '연필',   wrong: ['지우개', '자', '풀'] },
  { emoji: '🌙', word: '달',     wrong: ['별', '해', '구름'] },
  { emoji: '⭐', word: '별',     wrong: ['달', '해', '구름'] },
  { emoji: '🍌', word: '바나나', wrong: ['사과', '포도', '귤'] },
  { emoji: '🐱', word: '고양이', wrong: ['강아지', '토끼', '곰'] },
  { emoji: '🚌', word: '버스',   wrong: ['자동차', '기차', '택시'] },
  { emoji: '🎒', word: '가방',   wrong: ['모자', '신발', '옷'] },
  { emoji: '🌈', word: '무지개', wrong: ['구름', '비', '바람'] },
  { emoji: '🍕', word: '피자',   wrong: ['햄버거', '라면', '빵'] },
  { emoji: '🐸', word: '개구리', wrong: ['뱀', '달팽이', '거북이'] },
  { emoji: '🌺', word: '장미',   wrong: ['국화', '해바라기', '튤립'] },
  { emoji: '🎈', word: '풍선',   wrong: ['연', '공', '인형'] },
  { emoji: '🐦', word: '새',     wrong: ['나비', '잠자리', '벌'] },
  { emoji: '🍇', word: '포도',   wrong: ['딸기', '수박', '키위'] },
  { emoji: '⚽', word: '공',     wrong: ['인형', '블록', '그네'] },
  { emoji: '🌊', word: '바다',   wrong: ['강', '호수', '냇물'] },
  { emoji: '🎵', word: '노래',   wrong: ['춤', '그림', '글씨'] },
];

// ── 데이터: 글자 조각 맞추기 ──────────────────────────
const syllableWords = [
  { word: '사과', syllables: ['사', '과'], emoji: '🍎' },
  { word: '강아지', syllables: ['강', '아', '지'], emoji: '🐶' },
  { word: '자동차', syllables: ['자', '동', '차'], emoji: '🚗' },
  { word: '고양이', syllables: ['고', '양', '이'], emoji: '🐱' },
  { word: '무지개', syllables: ['무', '지', '개'], emoji: '🌈' },
  { word: '바나나', syllables: ['바', '나', '나'], emoji: '🍌' },
  { word: '피자', syllables: ['피', '자'], emoji: '🍕' },
  { word: '개구리', syllables: ['개', '구', '리'], emoji: '🐸' },
  { word: '풍선', syllables: ['풍', '선'], emoji: '🎈' },
  { word: '가방', syllables: ['가', '방'], emoji: '🎒' },
  { word: '연필', syllables: ['연', '필'], emoji: '✏️' },
  { word: '버스', syllables: ['버', '스'], emoji: '🚌' },
  { word: '물고기', syllables: ['물', '고', '기'], emoji: '🐟' },
  { word: '장미', syllables: ['장', '미'], emoji: '🌺' },
  { word: '달팽이', syllables: ['달', '팽', '이'], emoji: '🐌' },
  { word: '나비', syllables: ['나', '비'], emoji: '🦋' },
  { word: '하늘', syllables: ['하', '늘'], emoji: '🌤️' },
  { word: '토끼', syllables: ['토', '끼'], emoji: '🐰' },
];

// ── 데이터: 문장 완성하기 ──────────────────────────────
const sentenceQuestions = [
  {
    sentence: '나는 ___ 를 먹었어요.',
    answer: '사과',
    choices: ['사과', '하늘', '달리다'],
  },
  {
    sentence: '___ 이 멍멍 짖어요.',
    answer: '강아지',
    choices: ['강아지', '연필', '바나나'],
  },
  {
    sentence: '하늘에 예쁜 ___ 이 떴어요.',
    answer: '무지개',
    choices: ['무지개', '자동차', '가방'],
  },
  {
    sentence: '엄마가 ___ 을 사 주셨어요.',
    answer: '책',
    choices: ['책', '달', '짖다'],
  },
  {
    sentence: '연못에 ___ 가 살아요.',
    answer: '개구리',
    choices: ['개구리', '버스', '풍선'],
  },
  {
    sentence: '나는 ___ 를 타고 학교에 가요.',
    answer: '버스',
    choices: ['버스', '사과', '꽃'],
  },
  {
    sentence: '밤하늘에 ___ 이 반짝여요.',
    answer: '별',
    choices: ['별', '피자', '연필'],
  },
  {
    sentence: '바다에 ___ 가 헤엄쳐요.',
    answer: '물고기',
    choices: ['물고기', '자동차', '모자'],
  },
  {
    sentence: '나는 ___ 로 글씨를 써요.',
    answer: '연필',
    choices: ['연필', '고양이', '무지개'],
  },
  {
    sentence: '정원에 예쁜 ___ 이 피었어요.',
    answer: '장미',
    choices: ['장미', '버스', '공'],
  },
  {
    sentence: '생일 파티에서 ___ 을 불었어요.',
    answer: '풍선',
    choices: ['풍선', '달', '학교'],
  },
  {
    sentence: '나는 ___ 에서 책을 읽어요.',
    answer: '집',
    choices: ['집', '바나나', '달리기'],
  },
  {
    sentence: '아이가 ___ 을 들고 학교에 가요.',
    answer: '가방',
    choices: ['가방', '개구리', '별'],
  },
  {
    sentence: '나는 노란 ___ 를 좋아해요.',
    answer: '바나나',
    choices: ['바나나', '집', '타다'],
  },
  {
    sentence: '___ 가 야옹 울어요.',
    answer: '고양이',
    choices: ['고양이', '풍선', '피자'],
  },
];

// ── 유틸리티 ──────────────────────────────────────────
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function $(id) { return document.getElementById(id); }

function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  $(id).classList.add('active');
  window.scrollTo(0, 0);
}

// ── 피드백 애니메이션 ─────────────────────────────────
function showFeedback(isCorrect) {
  const overlay = $('feedback-overlay');
  const emoji   = overlay.querySelector('.feedback-emoji');
  const text    = overlay.querySelector('.feedback-text');

  if (isCorrect) {
    emoji.textContent = '✅';
    text.textContent  = ['잘했어요! 🎉', '훌륭해요! 👍', '맞아요! ⭐', '최고예요! 🌟'][Math.floor(Math.random() * 4)];
    text.style.color  = '#1A8040';
    overlay.style.background = 'rgba(234,250,241,0.85)';
  } else {
    emoji.textContent = '❌';
    text.textContent  = '다시 해봐요!';
    text.style.color  = '#A93226';
    overlay.style.background = 'rgba(253,237,236,0.85)';
  }

  overlay.classList.add('show');
  setTimeout(() => overlay.classList.remove('show'), 900);
}

function launchConfetti() {
  const container = $('confetti-container');
  container.innerHTML = '';
  const symbols = ['⭐', '🌟', '💛', '💚', '💙', '❤️', '🎉', '✨', '🎊', '🌸'];
  for (let i = 0; i < 30; i++) {
    const p = document.createElement('span');
    p.className = 'confetti-particle';
    p.textContent = symbols[Math.floor(Math.random() * symbols.length)];
    p.style.left     = Math.random() * 100 + 'vw';
    p.style.animationDuration = (1.5 + Math.random() * 2) + 's';
    p.style.animationDelay   = (Math.random() * 0.8) + 's';
    p.style.fontSize = (22 + Math.random() * 20) + 'px';
    container.appendChild(p);
  }
  setTimeout(() => { container.innerHTML = ''; }, 3500);
}

// ── localStorage 기록 저장 ────────────────────────────
const STORAGE_KEY = 'hangulAdventureRecords';

function saveRecord(name, mode, correct, total) {
  const records = getRecords();
  records.push({
    name,
    mode,
    correct,
    total,
    rate: Math.round((correct / total) * 100),
    date: new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
  });
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

function getRecords() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch (_) {
    return [];
  }
}

// ── 별점 계산 ────────────────────────────────────────
function getStars(rate) {
  if (rate >= 80) return '⭐⭐⭐';
  if (rate >= 60) return '⭐⭐';
  return '⭐';
}

// ── 결과 화면 표시 ────────────────────────────────────
function showResult(mode) {
  const { studentName, correctCount, totalQ } = state;
  const rate  = Math.round((correctCount / totalQ) * 100);
  const stars = getStars(rate);

  state.resultData = { studentName, mode, correctCount, totalQ, rate, stars };
  saveRecord(studentName, mode, correctCount, totalQ);

  $('result-name').textContent   = `${studentName} 학생`;
  $('result-correct').textContent = correctCount;
  $('result-total').textContent   = totalQ;
  $('result-rate').textContent    = rate + '%';
  $('result-stars').textContent   = stars;
  $('result-message').textContent =
    rate >= 80 ? '정말 잘했어요! 대단해요! 🎉' :
    rate >= 60 ? '잘했어요! 조금 더 연습해봐요! 😊' :
                 '괜찮아요! 다시 도전해봐요! 💪';

  showScreen('result-screen');
  if (rate >= 80) { playSuccessSound(); launchConfetti(); }
}

// ── 메인 화면 ────────────────────────────────────────
function initMain() {
  showScreen('main-screen');
  $('student-name-input').value = state.studentName;
}

$('student-name-input').addEventListener('input', function () {
  state.studentName = this.value.trim();
});

function startGame(mode) {
  const name = $('student-name-input').value.trim();
  if (!name) {
    $('student-name-input').focus();
    $('student-name-input').style.borderColor = '#E74C3C';
    setTimeout(() => { $('student-name-input').style.borderColor = ''; }, 1500);
    return;
  }
  state.studentName = name;
  state.currentMode = mode;
  state.currentQ    = 0;
  state.correctCount = 0;

  if (mode === 1) startMode1();
  else if (mode === 2) startMode2();
  else if (mode === 3) startMode3();
}

// ── 모드 1: 그림-단어 매칭 ────────────────────────────
function startMode1() {
  state.questions = shuffle(pictureWords).slice(0, 10);
  state.totalQ    = state.questions.length;
  showScreen('mode1-screen');
  renderMode1();
}

function renderMode1() {
  const q = state.questions[state.currentQ];
  if (!q) { showResult('그림-단어 매칭'); return; }

  updateGameHeader('mode1-header', state.currentQ, state.totalQ, state.correctCount);

  $('m1-picture').textContent = q.emoji;

  // 보기 4개 (정답 + 오답 3개), 섞기
  const choices = shuffle([q.word, ...q.wrong.slice(0, 3)]);

  const grid = $('m1-word-grid');
  grid.innerHTML = '';
  choices.forEach(choice => {
    const btn = document.createElement('button');
    btn.className  = 'word-btn';
    btn.textContent = choice;
    btn.addEventListener('click', () => handleMode1Answer(btn, choice === q.word, grid));
    grid.appendChild(btn);
  });
}

function handleMode1Answer(btn, isCorrect, grid) {
  // 모든 버튼 비활성화
  grid.querySelectorAll('.word-btn').forEach(b => b.style.pointerEvents = 'none');
  btn.classList.add(isCorrect ? 'correct' : 'wrong');

  if (isCorrect) {
    state.correctCount++;
    playCorrectSound();
    showFeedback(true);
  } else {
    playWrongSound();
    showFeedback(false);
    // 정답 강조
    grid.querySelectorAll('.word-btn').forEach(b => {
      if (b.textContent === state.questions[state.currentQ].word) {
        b.classList.add('correct');
      }
    });
  }

  setTimeout(() => {
    state.currentQ++;
    renderMode1();
  }, 1100);
}

// ── 모드 2: 글자 조각 맞추기 ─────────────────────────
function startMode2() {
  state.questions = shuffle(syllableWords).slice(0, 10);
  state.totalQ    = state.questions.length;
  showScreen('mode2-screen');
  renderMode2();
}

function renderMode2() {
  const q = state.questions[state.currentQ];
  if (!q) { showResult('글자 조각 맞추기'); return; }

  state.syllableSelected = [];

  updateGameHeader('mode2-header', state.currentQ, state.totalQ, state.correctCount);

  $('m2-emoji').textContent = q.emoji;
  $('m2-hint').textContent  = `"${q.word}" 을(를) 만들어봐요!`;

  renderSyllableTarget(q.syllables.length);
  renderSyllablePool(q);
}

function renderSyllableTarget(count) {
  const target = $('m2-target');
  target.innerHTML = '';
  for (let i = 0; i < count; i++) {
    const slot = document.createElement('div');
    slot.className = 'target-slot';
    slot.id = `slot-${i}`;
    target.appendChild(slot);
  }
}

function renderSyllablePool(q) {
  const pool = $('m2-pool');
  pool.innerHTML = '';
  const shuffled = shuffle([...q.syllables]);
  shuffled.forEach((syl, idx) => {
    const card = document.createElement('button');
    card.className    = 'syllable-card';
    card.textContent  = syl;
    card.dataset.syl  = syl;
    card.dataset.idx  = idx;
    card.addEventListener('click', () => handleSyllableClick(card, q));
    pool.appendChild(card);
  });
}

function handleSyllableClick(card, q) {
  if (card.classList.contains('used')) return;

  state.syllableSelected.push(card.dataset.syl);
  card.classList.add('used');

  // 슬롯에 채우기
  const slotIdx = state.syllableSelected.length - 1;
  const slot = $(`slot-${slotIdx}`);
  if (slot) slot.textContent = card.dataset.syl;

  // 완성됐는지 확인
  if (state.syllableSelected.length === q.syllables.length) {
    checkSyllableAnswer(q);
  }
}

function checkSyllableAnswer(q) {
  const assembled = state.syllableSelected.join('');
  const isCorrect = assembled === q.word;

  // 슬롯 색상 변경
  const target = $('m2-target');
  target.querySelectorAll('.target-slot').forEach(s => {
    s.style.borderColor = isCorrect ? '#2ECC71' : '#E74C3C';
    s.style.background  = isCorrect ? '#EAFAF1' : '#FDEDEC';
    s.style.color       = isCorrect ? '#1A8040' : '#A93226';
  });

  if (isCorrect) {
    state.correctCount++;
    playCorrectSound();
    showFeedback(true);
    launchConfetti();
  } else {
    playWrongSound();
    showFeedback(false);
  }

  // 카드 전체 비활성화
  $('m2-pool').querySelectorAll('.syllable-card').forEach(c => {
    c.style.pointerEvents = 'none';
  });

  setTimeout(() => {
    state.currentQ++;
    renderMode2();
  }, 1400);
}

$('m2-reset-btn').addEventListener('click', () => {
  const q = state.questions[state.currentQ];
  if (!q) return;
  renderSyllableTarget(q.syllables.length);
  renderSyllablePool(q);
  state.syllableSelected = [];
});

// ── 모드 3: 문장 완성하기 ────────────────────────────
function startMode3() {
  state.questions = shuffle(sentenceQuestions).slice(0, 10);
  state.totalQ    = state.questions.length;
  showScreen('mode3-screen');
  renderMode3();
}

function renderMode3() {
  const q = state.questions[state.currentQ];
  if (!q) { showResult('문장 완성하기'); return; }

  updateGameHeader('mode3-header', state.currentQ, state.totalQ, state.correctCount);

  // 빈칸 하이라이트
  const sentence = q.sentence.replace(
    '___',
    '<span class="blank">___</span>'
  );
  $('m3-sentence').innerHTML = sentence;

  const choiceWrap = $('m3-choices');
  choiceWrap.innerHTML = '';
  const shuffledChoices = shuffle([...q.choices]);
  shuffledChoices.forEach(choice => {
    const btn = document.createElement('button');
    btn.className   = 'choice-btn';
    btn.textContent = choice;
    btn.addEventListener('click', () => handleMode3Answer(btn, choice === q.answer, choiceWrap, q.answer));
    choiceWrap.appendChild(btn);
  });
}

function handleMode3Answer(btn, isCorrect, choiceWrap, answer) {
  choiceWrap.querySelectorAll('.choice-btn').forEach(b => b.style.pointerEvents = 'none');
  btn.classList.add(isCorrect ? 'correct' : 'wrong');

  if (isCorrect) {
    state.correctCount++;
    playCorrectSound();
    showFeedback(true);
    // 문장에 답 채우기
    $('m3-sentence').innerHTML =
      $('m3-sentence').innerHTML.replace(
        '<span class="blank">___</span>',
        `<span class="blank" style="border-color:#2ECC71;color:#1A8040;">${answer}</span>`
      );
  } else {
    playWrongSound();
    showFeedback(false);
    // 정답 표시
    choiceWrap.querySelectorAll('.choice-btn').forEach(b => {
      if (b.textContent === answer) b.classList.add('correct');
    });
  }

  setTimeout(() => {
    state.currentQ++;
    renderMode3();
  }, 1200);
}

// ── 게임 헤더 업데이트 ───────────────────────────────
function updateGameHeader(headerId, current, total, correct) {
  const header = $(headerId);
  header.querySelector('.progress-bar').style.width = (current / total * 100) + '%';
  header.querySelector('.score-badge').textContent   = `${correct}/${current} ✅`;
}

// ── 결과 화면 버튼 ───────────────────────────────────
$('btn-retry').addEventListener('click', () => {
  const m = state.currentMode;
  state.currentQ     = 0;
  state.correctCount = 0;
  if (m === 1) startMode1();
  else if (m === 2) startMode2();
  else startMode3();
});

$('btn-other-game').addEventListener('click', initMain);

$('btn-show-teacher').addEventListener('click', () => {
  const { studentName, correctCount, totalQ, rate, stars } = state.resultData;
  const view = $('teacher-result-view');
  view.querySelector('.tv-name').textContent  = `${studentName} 학생의 결과`;
  view.querySelector('.big-score').textContent = `${correctCount}/${totalQ} (${rate}%)`;
  view.querySelector('.big-stars').textContent = stars;
  view.style.display = 'flex';
});

$('close-teacher-view').addEventListener('click', () => {
  $('teacher-result-view').style.display = 'none';
});

// ── 뒤로가기 버튼 ────────────────────────────────────
['btn-back-m1', 'btn-back-m2', 'btn-back-m3', 'btn-back-result'].forEach(id => {
  $(id).addEventListener('click', initMain);
});

// ── 교사 모드 ────────────────────────────────────────
$('btn-teacher-mode').addEventListener('click', () => {
  $('pw-modal').style.display = 'flex';
  $('pw-input').value = '';
  $('pw-error').textContent = '';
  setTimeout(() => $('pw-input').focus(), 100);
});

$('pw-cancel').addEventListener('click', () => {
  $('pw-modal').style.display = 'none';
});

$('pw-confirm').addEventListener('click', checkTeacherPassword);
$('pw-input').addEventListener('keydown', e => {
  if (e.key === 'Enter') checkTeacherPassword();
});

function checkTeacherPassword() {
  // Simple client-side PIN for classroom convenience (by design, no sensitive data involved)
  if ($('pw-input').value === '1234') {
    $('pw-modal').style.display = 'none';
    showTeacherPanel();
  } else {
    $('pw-error').textContent = '비밀번호가 틀렸어요!';
    $('pw-input').value = '';
    $('pw-input').focus();
  }
}

function showTeacherPanel() {
  showScreen('teacher-screen');
  renderRecords();
}

function renderRecords() {
  const records = getRecords();
  const list    = $('record-list');
  list.innerHTML = '';

  if (records.length === 0) {
    list.innerHTML = '<p class="no-records">아직 기록이 없어요.</p>';
    return;
  }

  // 최신순 정렬
  [...records].reverse().forEach(r => {
    const item = document.createElement('div');
    item.className = 'record-item';
    const rateClass = r.rate >= 80 ? 'high' : r.rate >= 60 ? 'mid' : 'low';
    item.innerHTML = `
      <span class="rec-name">${r.name}</span>
      <span class="rec-mode">${r.mode}</span>
      <span class="rec-score ${rateClass}">${r.correct}/${r.total} (${r.rate}%)</span>
      <span class="rec-date">${r.date}</span>
    `;
    list.appendChild(item);
  });
}

$('btn-clear-records').addEventListener('click', () => {
  if (confirm('모든 기록을 삭제하시겠어요?')) {
    localStorage.removeItem(STORAGE_KEY);
    renderRecords();
  }
});

$('btn-back-teacher').addEventListener('click', initMain);

// ── PWA: 스플래시 화면 ────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initMain();

  // 1.5초 후 스플래시 화면 fadeOut (CSS --splash-fade: 0.5s 와 동기화)
  const splash = document.getElementById('splash-screen');
  if (splash) {
    const FADE_MS = 500;
    setTimeout(() => {
      splash.classList.add('hidden');
      setTimeout(() => { splash.style.display = 'none'; }, FADE_MS);
    }, 1500);
  }
});

// ── PWA: 설치 유도 배너 ────────────────────────────────
let deferredPrompt = null;

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  const btn = document.getElementById('install-btn');
  if (btn) btn.style.display = 'block';
});

document.getElementById('install-btn')?.addEventListener('click', async () => {
  if (!deferredPrompt) return;
  deferredPrompt.prompt();
  const result = await deferredPrompt.userChoice;
  if (result.outcome === 'accepted') {
    const btn = document.getElementById('install-btn');
    if (btn) btn.style.display = 'none';
  }
  deferredPrompt = null;
});

window.addEventListener('appinstalled', () => {
  const btn = document.getElementById('install-btn');
  if (btn) btn.style.display = 'none';
  deferredPrompt = null;
});
