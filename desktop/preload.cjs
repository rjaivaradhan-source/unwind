const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('unwindDesktop', {
  listScreens: () => ipcRenderer.invoke('unwind:list-screens'),
  captureScreen: (displayId) => ipcRenderer.invoke('unwind:capture-screen', displayId)
});
