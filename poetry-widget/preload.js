const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('poetry', {
  today: () => ipcRenderer.invoke('almanac:today'),
  bgPick: () => ipcRenderer.invoke('bg:pick'),
  close: () => ipcRenderer.send('app:close'),
});
