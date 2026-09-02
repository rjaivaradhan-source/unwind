const { app, BrowserWindow, Menu, ipcMain, desktopCapturer, screen } = require('electron');
const path = require('node:path');
const fs = require('node:fs');
const smokeDir = process.env.UNWIND_SMOKE_DIR;
if (smokeDir) app.setPath('userData', path.resolve(smokeDir, 'profile'));

function createWindow() {
  const win = new BrowserWindow({
    width: 1440, height: 960, minWidth: 850, minHeight: 660,
    backgroundColor: '#f4f5ef', title: 'Unwind — a little room to let go',
    icon: path.join(__dirname, '..', 'assets', 'icon.png'),
    show: !smokeDir,
    autoHideMenuBar: true,
    webPreferences: { nodeIntegration: false, contextIsolation: true, sandbox: true, preload: path.join(__dirname, 'preload.cjs') }
  });
  win.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  win.webContents.on('will-navigate', (event) => event.preventDefault());
  win.webContents.session.setPermissionRequestHandler((_webContents, _permission, callback) => callback(false));
  if (smokeDir) {
    const failures = [];
    win.webContents.on('console-message', (_event, details) => { if (details.level === 'error') failures.push(details.message); });
    win.webContents.on('did-fail-load', (_event, code, description) => { failures.push({ code, description }); });
    win.webContents.once('did-finish-load', async () => {
      await new Promise(resolve => setTimeout(resolve, 1200));
      fs.mkdirSync(smokeDir, { recursive: true });
      const preview = await win.webContents.capturePage();
      fs.writeFileSync(path.join(smokeDir, 'desktop-preview.png'), preview.toPNG());
      fs.writeFileSync(path.join(smokeDir, 'startup.json'), JSON.stringify({ title: win.getTitle(), failures, electron: process.versions.electron, platform: process.platform }, null, 2));
      app.exit(failures.length ? 1 : 0);
    });
  }
  win.loadFile(path.join(__dirname, '..', 'index.html'));
}
app.whenReady().then(() => {
  const trustedWindow = event => {
    const win=BrowserWindow.fromWebContents(event.sender);
    const expected=require('node:url').pathToFileURL(path.join(__dirname,'..','index.html')).href;
    if(!win||event.senderFrame!==event.sender.mainFrame||event.senderFrame.url!==expected)throw new Error('Invalid capture request');
    return win;
  };
  ipcMain.handle('unwind:list-screens',event=>{
    trustedWindow(event);
    return screen.getAllDisplays().map((d,i)=>({id:String(d.id),name:`${d.label||'Screen '+(i+1)} · ${d.size.width} × ${d.size.height}`}));
  });
  let captureBusy=false;
  ipcMain.handle('unwind:capture-screen',async(event,id)=>{
    const win=trustedWindow(event);
    const target=screen.getAllDisplays().find(d=>String(d.id)===id);
    if(!target||captureBusy)return {ok:false,message:'Screen unavailable or capture already in progress.'};
    captureBusy=true;
    try {
      win.minimize();
      await new Promise(resolve=>setTimeout(resolve,600));
      const sources=await desktopCapturer.getSources({types:['screen'],thumbnailSize:{width:2560,height:2560}});
      const source=sources.find(s=>s.display_id===id);
      if(!source||source.thumbnail.isEmpty())throw new Error('Screen capture unavailable. Check screen-recording permission in system settings, or load a screenshot.');
      return {ok:true,image:source.thumbnail.toDataURL()};
    }catch(error){return {ok:false,message:error.message};}
    finally{captureBusy=false;if(!win.isDestroyed()){win.restore();win.show();win.focus();}}
  });
  Menu.setApplicationMenu(process.platform === 'darwin' ? Menu.buildFromTemplate([
    { label: 'Unwind', submenu: [{ role: 'about' }, { type: 'separator' }, { role: 'quit' }] },
    { label: 'View', submenu: [{ role: 'togglefullscreen' }] }
  ]) : null);
  createWindow();
  app.on('activate', () => { if (!BrowserWindow.getAllWindows().length) createWindow(); });
});
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
