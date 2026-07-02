const { app, BrowserWindow, ipcMain, screen } = require('electron');
const path = require('path');
const fs = require('fs');
const { readDay } = require('./almanac');

let win;

function createWindow() {
  const display = screen.getPrimaryDisplay();
  const wa = display.workArea; // 排除菜单栏/程序坞的可用区域
  const baseW = Math.round(wa.width / 3);         // 屏幕宽 1/6 的两倍
  const width = baseW + 57;                        // 再加约 1.5 厘米（≈57px）
  const height = Math.round(baseW * 0.68);         // 高度不变，仅加宽
  const margin = 18;

  win = new BrowserWindow({
    width,
    height,
    x: wa.x + margin,          // 左上角
    y: wa.y + margin,
    frame: false,              // 无边框，自绘关闭叉
    transparent: true,         // 圆角 + 透明背景
    resizable: false,
    fullscreenable: false,
    hasShadow: true,
    skipTaskbar: true,
    alwaysOnTop: true,
    title: '每日诗词',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  win.setAlwaysOnTop(true, 'floating');
  win.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  win.loadFile(path.join(__dirname, 'index.html'));
}

app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => app.quit());

// 渲染进程请求当日黄历+诗词
ipcMain.handle('almanac:today', () => {
  try {
    return readDay(new Date());
  } catch (e) {
    return { error: String(e) };
  }
});

ipcMain.on('app:close', () => {
  if (win) win.close();
});

// 可选：若用户自备 assets/backgrounds/ 里放了图片（如古风表情包），
// 则按天轮换叠加为背景；文件夹为空时使用纯生成国风背景。
ipcMain.handle('bg:pick', () => {
  try {
    const dir = path.join(__dirname, 'assets', 'backgrounds');
    if (!fs.existsSync(dir)) return null;
    const files = fs.readdirSync(dir)
      .filter((f) => /\.(png|jpe?g|gif|webp)$/i.test(f))
      .sort();
    if (files.length === 0) return null;
    const day = Math.floor(Date.now() / 86400000);
    const pick = files[day % files.length];
    return 'file://' + path.join(dir, pick);
  } catch (e) {
    return null;
  }
});
