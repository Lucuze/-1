/* ============================================================
   특수교육 배움터 – App Logic
   ============================================================ */

'use strict';

// ============================================================
// Utility helpers
// ============================================================
function $(id) { return document.getElementById(id); }

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// ============================================================
// Screen navigation
// ============================================================
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  const target = $(id);
  target.classList.add('active');

  // Initialise game when switching screens
  if (id === 'screen-color')  initColorGame();
  if (id === 'screen-number') initNumberGame();
  if (id === 'screen-word')   initWordGame();
  if (id === 'screen-ai')     initAI();

  // Scroll to top
  window.scrollTo(0, 0);
}

// ============================================================
// Celebration helper
// ============================================================
const CELEBRATION_COMBOS = [
  { emoji: '🎉', text: '정말 잘 했어요!' },
  { emoji: '⭐', text: '최고예요!' },
  { emoji: '🏆', text: '훌륭해요!' },
  { emoji: '🌟', text: '대단해요!' },
  { emoji: '🎊', text: '완벽해요!' },
];

function celebrate() {
  const combo = CELEBRATION_COMBOS[Math.floor(Math.random() * CELEBRATION_COMBOS.length)];
  $('celebration-emoji').textContent = combo.emoji;
  $('celebration-text').textContent  = combo.text;
  const el = $('celebration');
  el.classList.remove('hidden');
  el.removeAttribute('aria-hidden');
  setTimeout(() => {
    el.classList.add('hidden');
    el.setAttribute('aria-hidden', 'true');
  }, 1800);
}

// ============================================================
// ① COLOR MATCHING GAME
// ============================================================
const COLORS = [
  { name: '빨간색', hex: '#E74C3C' },
  { name: '파란색', hex: '#3498DB' },
  { name: '노란색', hex: '#F1C40F' },
  { name: '초록색', hex: '#2ECC71' },
  { name: '보라색', hex: '#9B59B6' },
  { name: '주황색', hex: '#E67E22' },
  { name: '분홍색', hex: '#FF8FAB' },
  { name: '하늘색', hex: '#5DADE2' },
];

let colorScore = 0;
let colorAnswer = null;
let colorLocked  = false;

function initColorGame() {
  colorScore = 0;
  $('color-score').textContent = 0;
  nextColorRound();
}

function nextColorRound() {
  colorLocked = false;
  hideFeedback('color-feedback');

  // Pick target: after shuffling, pool[0] becomes the answer; first 4 items are the choices
  const pool    = shuffle(COLORS);
  colorAnswer   = pool[0];
  const choices = pool.slice(0, 4);

  // Render target
  $('target-color-box').style.background = colorAnswer.hex;
  $('target-color-name').textContent     = colorAnswer.name;

  // Render choices
  const container = $('color-choices');
  container.innerHTML = '';
  shuffle(choices).forEach(c => {
    const btn = document.createElement('button');
    btn.className = 'color-choice-btn';
    btn.style.background = c.hex;
    btn.setAttribute('aria-label', c.name);
    btn.setAttribute('title', c.name);
    btn.addEventListener('click', () => checkColor(c, btn));
    container.appendChild(btn);
  });
}

function checkColor(chosen, btn) {
  if (colorLocked) return;
  colorLocked = true;

  const fb = $('color-feedback');
  if (chosen.hex === colorAnswer.hex) {
    colorScore += 10;
    $('color-score').textContent = colorScore;
    showFeedback(fb, '정답이에요! 👏 ' + colorAnswer.name + '이에요!', 'correct');
    celebrate();
    setTimeout(nextColorRound, 2000);
  } else {
    showFeedback(fb, '다시 해봐요! 💪 ' + colorAnswer.name + '을(를) 찾아봐요!', 'wrong');
    setTimeout(() => { colorLocked = false; hideFeedback('color-feedback'); }, 1800);
  }
}

// ============================================================
// ② NUMBER COUNTING ACTIVITY
// ============================================================
const COUNTING_EMOJIS = ['🐶','🐱','🐭','🐹','🐸','🐻','🦊','🐷',
                         '🍎','🍊','🍋','🍇','🍓','🌟','⚽','🎈'];

let numberScore  = 0;
let numberAnswer = 0;
let numberLocked = false;

function initNumberGame() {
  numberScore = 0;
  $('number-score').textContent = 0;
  nextNumberRound();
}

function nextNumberRound() {
  numberLocked = false;
  hideFeedback('number-feedback');

  const emoji  = COUNTING_EMOJIS[randomInt(0, COUNTING_EMOJIS.length - 1)];
  numberAnswer = randomInt(1, 9);

  // Display emoji row
  $('emoji-display').textContent = Array(numberAnswer).fill(emoji).join(' ');
  $('number-question').textContent = emoji + ' 이 몇 개인가요?';

  // Generate 4 unique choices including the answer
  const choiceSet = new Set([numberAnswer]);
  while (choiceSet.size < 4) {
    choiceSet.add(randomInt(1, 10));
  }
  const choices = shuffle([...choiceSet]);

  const container = $('number-choices');
  container.innerHTML = '';
  choices.forEach(n => {
    const btn = document.createElement('button');
    btn.className = 'number-choice-btn';
    btn.textContent = n;
    btn.setAttribute('aria-label', n + '개');
    btn.addEventListener('click', () => checkNumber(n));
    container.appendChild(btn);
  });
}

function checkNumber(chosen) {
  if (numberLocked) return;
  numberLocked = true;

  const fb = $('number-feedback');
  if (chosen === numberAnswer) {
    numberScore += 10;
    $('number-score').textContent = numberScore;
    showFeedback(fb, '맞아요! 👏 ' + numberAnswer + '개예요!', 'correct');
    celebrate();
    setTimeout(nextNumberRound, 2000);
  } else {
    showFeedback(fb, '틀렸어요! 다시 세어봐요 🔢 ' + numberAnswer + '개예요!', 'wrong');
    setTimeout(() => { numberLocked = false; hideFeedback('number-feedback'); }, 2000);
  }
}

// ============================================================
// ③ WORD LEARNING GAME
// ============================================================
const WORD_ITEMS = [
  { picture: '🐶', word: '강아지',  wrong: ['고양이', '토끼', '원숭이'] },
  { picture: '🐱', word: '고양이',  wrong: ['강아지', '여우', '새'] },
  { picture: '🍎', word: '사과',    wrong: ['배', '바나나', '포도'] },
  { picture: '🍌', word: '바나나',  wrong: ['사과', '귤', '딸기'] },
  { picture: '🚗', word: '자동차',  wrong: ['버스', '기차', '비행기'] },
  { picture: '✈️', word: '비행기',  wrong: ['기차', '배', '자동차'] },
  { picture: '🌸', word: '꽃',      wrong: ['나무', '잎', '뿌리'] },
  { picture: '🌈', word: '무지개',  wrong: ['구름', '번개', '비'] },
  { picture: '🍕', word: '피자',    wrong: ['햄버거', '라면', '빵'] },
  { picture: '🎂', word: '케이크',  wrong: ['쿠키', '사탕', '아이스크림'] },
  { picture: '⚽', word: '축구공',  wrong: ['농구공', '야구공', '배구공'] },
  { picture: '🎸', word: '기타',    wrong: ['피아노', '드럼', '바이올린'] },
  { picture: '🏠', word: '집',      wrong: ['학교', '병원', '마트'] },
  { picture: '📚', word: '책',      wrong: ['공책', '연필', '지우개'] },
  { picture: '🌙', word: '달',      wrong: ['별', '해', '구름'] },
  { picture: '⭐', word: '별',      wrong: ['달', '해', '비'] },
];

let wordScore  = 0;
let wordAnswer = null;
let wordLocked = false;

function initWordGame() {
  wordScore = 0;
  $('word-score').textContent = 0;
  nextWordRound();
}

function nextWordRound() {
  wordLocked = false;
  hideFeedback('word-feedback');

  const item    = WORD_ITEMS[randomInt(0, WORD_ITEMS.length - 1)];
  wordAnswer    = item.word;

  $('word-picture').textContent = item.picture;

  const choices = shuffle([item.word, ...item.wrong]);

  const container = $('word-choices');
  container.innerHTML = '';
  choices.forEach(w => {
    const btn = document.createElement('button');
    btn.className = 'word-choice-btn';
    btn.textContent = w;
    btn.addEventListener('click', () => checkWord(w, btn));
    container.appendChild(btn);
  });
}

function checkWord(chosen, btn) {
  if (wordLocked) return;
  wordLocked = true;

  const fb = $('word-feedback');
  if (chosen === wordAnswer) {
    wordScore += 10;
    $('word-score').textContent = wordScore;
    btn.style.background = '#d4edda';
    showFeedback(fb, '맞아요! 👏 이것은 "' + wordAnswer + '"이에요!', 'correct');
    celebrate();
    setTimeout(nextWordRound, 2000);
  } else {
    btn.style.background = '#f8d7da';
    showFeedback(fb, '틀렸어요! 💪 정답은 "' + wordAnswer + '"이에요!', 'wrong');
    setTimeout(() => { wordLocked = false; hideFeedback('word-feedback'); }, 2000);
  }
}

// ============================================================
// ④ AI ASSISTANT (Rule-based response engine)
// ============================================================
const AI_RULES = [
  // Colours
  { pattern: /색깔|색/i,      response: '🎨 색깔에는 빨간색, 파란색, 노란색, 초록색, 보라색, 주황색이 있어요!\n🔴 빨간색은 사과 색이에요!\n🔵 파란색은 하늘 색이에요!\n🟡 노란색은 바나나 색이에요!' },
  // Numbers
  { pattern: /숫자|세기|수/i,  response: '🔢 숫자를 세어볼까요?\n1️⃣ 하나, 2️⃣ 둘, 3️⃣ 셋, 4️⃣ 넷, 5️⃣ 다섯!\n손가락을 사용하면 더 쉽게 셀 수 있어요! ✋' },
  // Animals
  { pattern: /동물/i,          response: '🐶 강아지, 🐱 고양이, 🐭 쥐, 🐹 햄스터, 🐸 개구리, 🦊 여우, 🐷 돼지!\n어떤 동물을 좋아하나요? 😊' },
  // Fruits
  { pattern: /과일/i,          response: '🍎 사과, 🍊 귤, 🍋 레몬, 🍇 포도, 🍓 딸기, 🍌 바나나!\n과일은 건강에 좋아요! 😋' },
  // Praise
  { pattern: /칭찬|잘했|최고|대단/i, response: '⭐ 정말 잘 하고 있어요!\n🏆 너무 멋져요!\n💪 계속 열심히 해봐요!\n🌟 당신은 최고예요!' },
  // Hello / greeting
  { pattern: /안녕|hello|hi/i, response: '안녕! 반가워요! 😊 오늘도 즐겁게 공부해봐요! 📚' },
  // Name
  { pattern: /이름|너는 누구/i, response: '저는 AI 도우미예요! 🤖\n배움터 앱에서 여러분을 도와주기 위해 왔어요!\n무엇이든 물어보세요! 😊' },
  // School
  { pattern: /학교|공부|수업/i, response: '📚 학교 공부는 재미있어요!\n열심히 하면 무엇이든 할 수 있어요! 💪\n함께 배워봐요! 🌟' },
  // Food
  { pattern: /음식|먹|요리/i,  response: '😋 맛있는 음식이 많이 있어요!\n🍕 피자, 🍜 라면, 🍱 도시락, 🍰 케이크!\n어떤 음식을 좋아하나요?' },
  // Weather
  { pattern: /날씨|비|눈|바람/i, response: '🌤️ 맑은 날에는 나가서 놀아요!\n🌧️ 비가 올 때는 우산을 써요!\n❄️ 눈이 오면 눈사람을 만들어요!' },
  // Help / what can you do
  { pattern: /도와|도움|뭐|무엇/i, response: '저는 이런 것들을 알려줄 수 있어요! 😊\n🎨 색깔 이름\n🔢 숫자 세기\n🐶 동물 이름\n🍎 과일 이름\n무엇이 궁금한가요?' },
  // Default fallback
  { pattern: /.*/,              response: '재미있는 질문이에요! 😄\n저도 함께 배우고 싶어요!\n다른 것도 물어봐요! 💬' },
];

let aiInitialized = false;

function initAI() {
  if (aiInitialized) return;
  aiInitialized = true;
  // chat log is empty; greeting bubble is always shown
}

function getAIResponse(text) {
  for (const rule of AI_RULES) {
    if (rule.pattern.test(text)) return rule.response;
  }
  return '재미있는 질문이에요! 😄 다른 것도 물어봐요!';
}

function aiQuickAsk(text) {
  $('ai-input').value = text;
  aiSend();
}

function aiSend() {
  const input = $('ai-input');
  const text  = input.value.trim();
  if (!text) return;
  input.value = '';

  const log = $('ai-chat-log');

  // User message
  const userMsg = document.createElement('div');
  userMsg.className = 'chat-msg-user';
  userMsg.textContent = text;
  log.appendChild(userMsg);

  // AI response (with small delay for realism)
  setTimeout(() => {
    const aiMsg = document.createElement('div');
    aiMsg.className = 'chat-msg-ai';
    aiMsg.textContent = getAIResponse(text);
    log.appendChild(aiMsg);
    log.scrollTop = log.scrollHeight;
  }, 400);

  log.scrollTop = log.scrollHeight;
}

// ============================================================
// Feedback helpers
// ============================================================
function showFeedback(el, text, type) {
  el.textContent = text;
  el.className   = 'feedback-box ' + type;
}

function hideFeedback(id) {
  const el = $(id);
  el.textContent = '';
  el.className   = 'feedback-box hidden';
}
