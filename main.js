const { app, BrowserWindow, Notification, ipcMain } = require('electron');
const path = require('path');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 420,
    height: 560,
    resizable: false,
    fullscreenable: false,
    title: '番茄钟',
    backgroundColor: '#fffdf3',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.loadFile('index.html');

  // 隐藏菜单栏（macOS 顶部菜单保留系统默认）
  mainWindow.setMenuBarVisibility(false);
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// 渲染进程请求发送系统通知
ipcMain.on('notify', (_event, { title, body }) => {
  if (Notification.isSupported()) {
    new Notification({ title, body, silent: false }).show();
  }
});
