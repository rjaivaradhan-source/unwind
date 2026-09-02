const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('unwindDesktop', {
  listScreens: () => ipcRenderer.invoke('unwind:list-screens'),
  captureScreen: (displayId) => ipcRenderer.invoke('unwind:capture-screen', displayId),
  toggleFullscreen: () => ipcRenderer.invoke('unwind:toggle-fullscreen'),
  onFullscreenChange: (callback) => ipcRenderer.on('unwind:fullscreen-changed', (_event, active) => callback(Boolean(active)))
});
