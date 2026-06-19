// ===== 配置 =====
const COLORS = { work: '#ff7a7a', short: '#a7b408', long: '#96c1dd' };
const LABELS = { work: '专注', short: '短休息', long: '长休息' };
const RING_LEN = 2 * Math.PI * 110; // 与 svg r=110 一致

const durations = { work: 25, short: 5, long: 15 }; // 分钟

let mode = 'work';
let remaining = durations.work * 60; // 秒
let total = remaining;
let running = false;
let ticker = null;
let pomodoroCount = 0;
let workSessions = 0; // 用于决定何时进入长休息

// ===== DOM =====
const timeEl = document.getElementById('time');
const startBtn = document.getElementById('startBtn');
const resetBtn = document.getElementById('resetBtn');
const countEl = document.getElementById('count');
const ringFg = document.querySelector('.ring-fg');
const modeBtns = document.querySelectorAll('.mode-btn');
const inputs = {
  work: document.getElementById('workMin'),
  short: document.getElementById('shortMin'),
  long: document.getElementById('longMin'),
};

ringFg.style.strokeDasharray = RING_LEN;

// ===== 渲染 =====
function fmt(sec) {
  const m = String(Math.floor(sec / 60)).padStart(2, '0');
  const s = String(sec % 60).padStart(2, '0');
  return `${m}:${s}`;
}

function render() {
  timeEl.textContent = fmt(remaining);
  const progress = total > 0 ? remaining / total : 0;
  ringFg.style.strokeDashoffset = RING_LEN * (1 - progress);
  document.title = `${fmt(remaining)} · ${LABELS[mode]}`;
}

function applyMode(newMode) {
  mode = newMode;
  document.documentElement.style.setProperty('--accent', COLORS[mode]);
  modeBtns.forEach((b) => b.classList.toggle('active', b.dataset.mode === mode));
  remaining = durations[mode] * 60;
  total = remaining;
  render();
}

// ===== 计时 =====
function tick() {
  if (remaining > 0) {
    remaining -= 1;
    render();
  }
  if (remaining <= 0) {
    finish();
  }
}

function start() {
  if (running) {
    pause();
    return;
  }
  running = true;
  startBtn.textContent = '暂停';
  ticker = setInterval(tick, 1000);
}

function pause() {
  running = false;
  startBtn.textContent = '继续';
  clearInterval(ticker);
}

function stopTimer() {
  running = false;
  clearInterval(ticker);
  startBtn.textContent = '开始';
}

function reset() {
  stopTimer();
  remaining = durations[mode] * 60;
  total = remaining;
  render();
}

function finish() {
  stopTimer();
  playBeep();

  let nextMode;
  if (mode === 'work') {
    pomodoroCount += 1;
    workSessions += 1;
    countEl.textContent = pomodoroCount;
    // 每完成 4 个专注进入长休息
    nextMode = workSessions % 4 === 0 ? 'long' : 'short';
    notify('专注完成 🍅', `休息一下吧！接下来是${LABELS[nextMode]}。`);
  } else {
    nextMode = 'work';
    notify('休息结束', '准备好开始下一个专注了吗？');
  }
  applyMode(nextMode);
}

// ===== 通知 & 提示音 =====
function notify(title, body) {
  if (window.pomodoro) {
    window.pomodoro.notify(title, body);
  }
}

function playBeep() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const now = ctx.currentTime;
    // 连续三声短促提示音
    [0, 0.25, 0.5].forEach((offset) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = 880;
      gain.gain.setValueAtTime(0.0001, now + offset);
      gain.gain.exponentialRampToValueAtTime(0.3, now + offset + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + offset + 0.18);
      osc.connect(gain).connect(ctx.destination);
      osc.start(now + offset);
      osc.stop(now + offset + 0.2);
    });
    setTimeout(() => ctx.close(), 1500);
  } catch (e) {
    console.error('提示音播放失败', e);
  }
}

// ===== 事件 =====
startBtn.addEventListener('click', start);
resetBtn.addEventListener('click', reset);

modeBtns.forEach((btn) => {
  btn.addEventListener('click', () => {
    stopTimer();
    applyMode(btn.dataset.mode);
  });
});

Object.entries(inputs).forEach(([key, input]) => {
  input.addEventListener('change', () => {
    let v = parseInt(input.value, 10);
    if (isNaN(v) || v < 1) v = 1;
    if (v > 120) v = 120;
    input.value = v;
    durations[key] = v;
    if (key === mode && !running) {
      remaining = v * 60;
      total = remaining;
      render();
    }
  });
});

// 初始化
applyMode('work');
