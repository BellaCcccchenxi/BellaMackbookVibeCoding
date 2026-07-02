// 农历历法读取 + 诗词匹配
const { Solar } = require('lunar-javascript');
const POEMS = require('./poems');

// 稳定哈希：让同一天固定选到同一首（用日干支+年份做种子，含"八字"意味）
function seededPick(list, seed) {
  if (!list || list.length === 0) return null;
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  const idx = Math.abs(h) % list.length;
  return list[idx];
}

function seasonOf(lunarMonth) {
  // 农历：1-3 春，4-6 夏，7-9 秋，10-12 冬
  if (lunarMonth >= 1 && lunarMonth <= 3) return '春';
  if (lunarMonth >= 4 && lunarMonth <= 6) return '夏';
  if (lunarMonth >= 7 && lunarMonth <= 9) return '秋';
  return '冬';
}

// 日天干 → 五行
const GAN_WUXING = {
  甲: '木', 乙: '木', 丙: '火', 丁: '火', 戊: '土',
  己: '土', 庚: '金', 辛: '金', 壬: '水', 癸: '水',
};
// 五行 → 幸运色（中式传统色）
const WUXING_COLORS = {
  木: [{ name: '竹青', hex: '#5a8f6b' }, { name: '松绿', hex: '#3f7a5a' }, { name: '碧色', hex: '#4c9a86' }],
  火: [{ name: '朱红', hex: '#c0392b' }, { name: '胭脂', hex: '#b23a48' }, { name: '绯红', hex: '#d1495b' }],
  土: [{ name: '秋香', hex: '#b08d4f' }, { name: '赭黄', hex: '#c99a3b' }, { name: '杏黄', hex: '#d9a441' }],
  金: [{ name: '月白', hex: '#d9d4c3' }, { name: '鎏金', hex: '#c9a24b' }, { name: '霜色', hex: '#c2c2b6' }],
  水: [{ name: '黛蓝', hex: '#37505c' }, { name: '靛青', hex: '#2e4a62' }, { name: '墨色', hex: '#33333d' }],
};
// 五行 → 河图幸运数字
const WUXING_NUMS = { 木: [3, 8], 火: [2, 7], 土: [5, 0], 金: [4, 9], 水: [1, 6] };


// 读取某一天的黄历信息并匹配诗词
function readDay(date) {
  const solar = Solar.fromDate(date);
  const lunar = solar.getLunar();

  const ec = lunar.getEightChar();
  const bazi = [ec.getYear(), ec.getMonth(), ec.getDay(), ec.getTime()].join(' ');
  const dayGZ = lunar.getDayInGanZhi();
  const shengXiao = lunar.getYearShengXiao();

  const cur = lunar.getCurrentJieQi();          // 当天恰逢节气则非空
  const jieqiToday = cur ? cur.getName() : '';
  const jieqiPeriod = lunar.getJieQi();          // 所处节气区间
  const lunarFes = lunar.getFestivals() || [];   // 阴历节日（春节/端午/中秋…）
  const solarFes = solar.getFestivals() || [];   // 阳历节日（元旦/劳动节…）

  const lunarText = '农历' + lunar.getYearInChinese() + '年' +
    lunar.getMonthInChinese() + '月' + lunar.getDayInChinese();
  const seed = date.getFullYear() + dayGZ; // 每日稳定种子

  // ==== 匹配优先级：节日 > 清明(节气型节日) > 节气 > 季节兜底 ====
  let poem = null;
  let matchTag = '';
  let matchType = '';

  // 1) 阴历传统节日
  for (const f of lunarFes) {
    if (POEMS.festival[f]) { poem = seededPick(POEMS.festival[f], seed); matchTag = f; matchType = '节日'; break; }
  }
  // 2) 清明（既是节气也是节日）
  if (!poem && (jieqiToday === '清明' || jieqiPeriod === '清明' && lunar.getDay() <= 3)) {
    poem = seededPick(POEMS.festival['清明'], seed); matchTag = '清明'; matchType = '节日';
  }
  // 3) 当天恰逢节气
  if (!poem && jieqiToday && POEMS.jieqi[jieqiToday]) {
    poem = seededPick(POEMS.jieqi[jieqiToday], seed); matchTag = jieqiToday; matchType = '节气';
  }
  // 4) 季节兜底
  if (!poem) {
    const season = seasonOf(lunar.getMonth());
    poem = seededPick(POEMS.season[season], seed); matchTag = season + '日'; matchType = '时令';
  }

  // 展示用节日/节气标签
  const festivalLabel = lunarFes.concat(solarFes).join('·') || jieqiToday || jieqiPeriod || '';

  // ==== 黄历宜忌 ====
  const yi = (lunar.getDayYi() || []).slice(0, 4);
  const ji = (lunar.getDayJi() || []).slice(0, 4);

  // ==== 幸运色 / 幸运数字（依日干五行 + 每日稳定种子）====
  const wuXing = GAN_WUXING[lunar.getDayGan()] || '土';
  const luckyColor = seededPick(WUXING_COLORS[wuXing], seed + '色');
  const numArr = WUXING_NUMS[wuXing];
  const luckyNumber = seededPick(numArr, seed + '数');

  return {
    solarText: solar.getYear() + '年' + solar.getMonth() + '月' + solar.getDay() + '日',
    lunarText,
    ganZhi: lunar.getYearInGanZhi() + '年 · ' + dayGZ + '日',
    bazi,
    shengXiao: shengXiao + '年',
    jieqi: jieqiToday || jieqiPeriod || '',
    festival: festivalLabel,
    matchTag,
    matchType,
    poem,
    yi,
    ji,
    wuXing,
    luckyColor,
    luckyNumber,
    naYin: lunar.getDayNaYin(),
  };
}

module.exports = { readDay, seededPick };
