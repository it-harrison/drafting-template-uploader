import { app, BrowserWindow, dialog, ipcMain } from 'electron';
import fs from 'fs/promises';
import path from 'path';
import { handleUpload } from './upload'
import { encrypt } from './handleToken';
// This allows TypeScript to pick up the magic constants that's auto-generated by Forge's Webpack
// plugin that tells the Electron app where to look for the Webpack-bundled app code (depending on
// whether you're running in development or production).
declare const MAIN_WINDOW_WEBPACK_ENTRY: string;
declare const MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY: string;

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  app.quit();
}

const createWindow = (): void => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    height: 800,
    width: 800,
    show: false,
    resizable: false,
    webPreferences: {
      preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY,
    },
  });

  // and load the index.html of the app.
  mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    mainWindow.focus();
  });

  // Open the DevTools.
  // mainWindow.webContents.openDevTools();
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

ipcMain.on('app-loaded', async (event) => {
  let isToken = true;
  try {
    const filepath = path.join(app.getPath('userData'), 'token.txt');
    await fs.readFile(filepath, 'utf-8');
  } catch {
    isToken = false;
  }
  const browserWindow = BrowserWindow.fromWebContents(event.sender);
  browserWindow.webContents.send('token-check', { isToken });
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

ipcMain.on('store-token', async (event, token) => {
  const result = await encrypt(token);
  const browserWindow = BrowserWindow.fromWebContents(event.sender);
  browserWindow.webContents.send('token-updated', result);
});

ipcMain.on('show-open-file-dialog', (event, dst: boolean) => {
  const browserWindow = BrowserWindow.fromWebContents(event.sender);
  if (!browserWindow) return;
  showFileOpenDialog(browserWindow, dst);
});

const showFileOpenDialog = async (browserWindow: BrowserWindow, dst: boolean) => {
  const result = await dialog.showOpenDialog(browserWindow, {
    properties: ['openFile'],
    filters: [{ name: 'CSV file', extensions: ['csv', 'CSV']}]
  })

  if (result.canceled) {
    browserWindow.webContents.send('upload-canceled');
    return
  }

  const [filepath] = result.filePaths;

  const uploadResult = await handleUpload(filepath, dst, browserWindow);
  browserWindow.webContents.send('upload-done', uploadResult);
}

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
