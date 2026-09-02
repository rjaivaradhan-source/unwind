const { app, BrowserWindow, Menu, ipcMain, desktopCapturer, screen } = require('electron');
const path = require('node:path');
const fs = require('node:fs');
const { autoUpdater } = require('electron-updater');
const smokeDir = process.env.UNWIND_SMOKE_DIR;
if (smokeDir) app.setPath('userData', path.resolve(smokeDir, 'profile'));
if (smokeDir) app.disableHardwareAcceleration();

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
  win.on('enter-full-screen',()=>win.webContents.send('unwind:fullscreen-changed',true));
  win.on('leave-full-screen',()=>win.webContents.send('unwind:fullscreen-changed',false));
  const allowedPages=new Set(['index.html','about.html'].map(file=>require('node:url').pathToFileURL(path.join(__dirname,'..',file)).href));
  win.webContents.on('will-navigate', (event, url) => {if(!allowedPages.has(url))event.preventDefault();});
  win.webContents.session.setPermissionRequestHandler((_webContents, _permission, callback) => callback(false));
  if (smokeDir) {
    const failures = [];
    win.webContents.on('console-message', (_event, details) => { if (details.level === 'error') failures.push(details.message); });
    win.webContents.on('did-fail-load', (_event, code, description) => { failures.push({ code, description }); });
    win.webContents.once('did-finish-load', async () => {
      await new Promise(resolve => setTimeout(resolve, 1200));
      let fullscreenWorked=false;
      try{await win.webContents.executeJavaScript('window.unwindDesktop.toggleFullscreen()');await new Promise(resolve=>setTimeout(resolve,350));fullscreenWorked=win.isFullScreen();if(fullscreenWorked){win.setFullScreen(false);await new Promise(resolve=>setTimeout(resolve,250));}}catch(error){failures.push(`Fullscreen smoke test: ${error.message}`);}
      if(!fullscreenWorked)failures.push('Fullscreen smoke test did not enter native fullscreen.');
      fs.mkdirSync(smokeDir, { recursive: true });
      const preview = await win.webContents.capturePage();
      fs.writeFileSync(path.join(smokeDir, 'desktop-preview.png'), preview.toPNG());
      fs.writeFileSync(path.join(smokeDir, 'startup.json'), JSON.stringify({ title: win.getTitle(), failures, fullscreenWorked, electron: process.versions.electron, platform: process.platform }, null, 2));
      app.exit(failures.length ? 1 : 0);
    });
  }
  win.loadFile(path.join(__dirname, '..', 'index.html'));
  return win;
}
let updateState={status:'idle',version:app.getVersion(),message:'Ready to check for updates.'},updaterConfigured=false,updateWindow=null;
function publishUpdate(win,patch){updateState={...updateState,...patch};if(win&&!win.isDestroyed())win.webContents.send('unwind:update-status',updateState);}
function configureUpdater(win){
  updateWindow=win;if(updaterConfigured||!app.isPackaged)return;updaterConfigured=true;autoUpdater.autoDownload=false;autoUpdater.autoInstallOnAppQuit=false;
  autoUpdater.on('checking-for-update',()=>publishUpdate(updateWindow,{status:'checking',message:'Checking GitHub Releases…'}));
  autoUpdater.on('update-available',info=>publishUpdate(updateWindow,{status:'available',version:info.version,message:`Unwind ${info.version} is ready when you are.`}));
  autoUpdater.on('update-not-available',info=>publishUpdate(updateWindow,{status:'current',version:info.version,message:'You already have the latest version.'}));
  autoUpdater.on('download-progress',p=>publishUpdate(updateWindow,{status:'downloading',progress:Math.round(p.percent),message:`Downloading update… ${Math.round(p.percent)}%`}));
  autoUpdater.on('update-downloaded',info=>publishUpdate(updateWindow,{status:'downloaded',version:info.version,progress:100,message:'Update downloaded. Restart when you are ready.'}));
  autoUpdater.on('error',error=>publishUpdate(updateWindow,{status:'error',message:`Update check failed: ${error.message}`}));
  setTimeout(()=>autoUpdater.checkForUpdates().catch(()=>{}),5000);
  setInterval(()=>autoUpdater.checkForUpdates().catch(()=>{}),4*60*60*1000);
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
  ipcMain.handle('unwind:toggle-fullscreen',event=>{
    const win=trustedWindow(event),next=!win.isFullScreen();
    win.setFullScreen(next);
    return next;
  });
  ipcMain.handle('unwind:update-state',event=>{trustedWindow(event);return updateState;});
  ipcMain.handle('unwind:check-update',async event=>{const win=trustedWindow(event);if(!app.isPackaged){publishUpdate(win,{status:'development',message:'Update checks run in the installed app.'});return updateState;}await autoUpdater.checkForUpdates();return updateState;});
  ipcMain.handle('unwind:download-update',async event=>{trustedWindow(event);await autoUpdater.downloadUpdate();return updateState;});
  ipcMain.handle('unwind:install-update',event=>{trustedWindow(event);if(updateState.status==='downloaded')setImmediate(()=>autoUpdater.quitAndInstall(false,true));return updateState;});
  Menu.setApplicationMenu(process.platform === 'darwin' ? Menu.buildFromTemplate([
    { label: 'Unwind', submenu: [{ role: 'about' }, { type: 'separator' }, { role: 'quit' }] },
    { label: 'View', submenu: [{ role: 'togglefullscreen' }] }
  ]) : null);
  const firstWindow=createWindow();configureUpdater(firstWindow);
  app.on('activate', () => { if (!BrowserWindow.getAllWindows().length){const win=createWindow();configureUpdater(win);} });
});
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
