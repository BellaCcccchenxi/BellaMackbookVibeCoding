const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('pomodoro', {
  notify: (title, body) => ipcRenderer.send('notify', { title, body }),
});
