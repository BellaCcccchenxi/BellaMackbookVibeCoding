const $ = (id) => document.getElementById(id);

function renderPoem(data) {
  if (!data || data.error || !data.poem) {
    $('lines').innerHTML = '<div class="line">诗词加载失败</div>';
    if (data && data.error) console.error(data.error);
    return;
  }

  // 左侧黄历信息
  $('festival').textContent = data.festival || data.matchTag || '';
  $('date-solar').textContent = data.solarText;
  $('date-lunar').textContent = data.lunarText.replace('农历', '');

  // 诗词正文
  const linesEl = $('lines');
  linesEl.innerHTML = '';
  data.poem.lines.forEach((ln) => {
    const div = document.createElement('div');
    div.className = 'line';
    div.textContent = ln;
    linesEl.appendChild(div);
  });

  // 长词（行数多或单行长）自动进入紧凑模式
  const longest = Math.max(...data.poem.lines.map((l) => l.length));
  if (data.poem.lines.length > 4 || longest > 14) {
    $('poem').classList.add('dense');
  } else {
    $('poem').classList.remove('dense');
  }

  $('title').textContent = '《' + data.poem.title + '》';
  $('author').textContent = data.poem.author + '〔' + data.poem.dynasty + '〕';
  $('note').textContent = data.poem.note || '';

  // 当日黄历：宜忌 / 幸运色 / 幸运数字
  $('yi').textContent = (data.yi && data.yi.length ? data.yi.join('·') : '诸事皆宜');
  $('ji').textContent = (data.ji && data.ji.length ? data.ji.join('·') : '百无禁忌');
  if (data.luckyColor) {
    $('swatch').style.background = data.luckyColor.hex;
    $('color-name').textContent = data.luckyColor.name;
  }
  $('num').textContent = (data.luckyNumber != null ? data.luckyNumber : '');
}

async function load() {
  const data = await window.poetry.today();
  renderPoem(data);

  // 可选：用户自备背景图（默认无 → 保持生成式国风背景）
  const bg = await window.poetry.bgPick();
  if (bg) {
    const photo = $('bg-photo');
    photo.style.backgroundImage = `url("${bg}")`;
    photo.style.opacity = '0.9';
  }
}

$('close').addEventListener('click', () => window.poetry.close());

// 跨日自动刷新：每分钟检查日期是否变化
let lastDay = new Date().getDate();
setInterval(() => {
  const d = new Date().getDate();
  if (d !== lastDay) {
    lastDay = d;
    load();
  }
}, 60 * 1000);

load();
