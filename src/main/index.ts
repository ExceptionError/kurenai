import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import * as fs from 'fs';
import * as path from 'path';
import { format as formatUrl } from 'url';
import windowStateKeeper from 'electron-window-state';

declare const __static: string;

const isDevelopment = process.env.NODE_ENV !== 'production';

let mainWindow: BrowserWindow | null;

function createMainWindow() {
  const mainWindowState = windowStateKeeper({});
  const window = new BrowserWindow({
    x: mainWindowState.x,
    y: mainWindowState.y,
    width: 300,
    height: 120,
    minWidth: 300,
    minHeight: 120,
    maxWidth: 300,
    maxHeight: 120,
    show: false,
    frame: false,
    resizable: false,
    maximizable: false,
    minimizable: false,
    useContentSize: true,
    webPreferences: {
      nodeIntegration: false,
      nodeIntegrationInWorker: false,
      nodeIntegrationInSubFrames: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(app.getAppPath(), 'preload.js'),
      devTools: isDevelopment,
    },
    icon: path.join(__static, 'KURENAI.ico'),
  });
  mainWindowState.manage(window);

  if (isDevelopment) {
    window.webContents.openDevTools();
  }

  if (isDevelopment) {
    window.loadURL(`http://localhost:${process.env.ELECTRON_WEBPACK_WDS_PORT}`);
  } else {
    window.loadURL(
      formatUrl({
        pathname: path.join(__dirname, 'index.html'),
        protocol: 'file',
        slashes: true,
      }),
    );
  }

  window.on('closed', () => {
    mainWindow = null;
  });

  window.webContents.on('devtools-opened', () => {
    window.focus();
    setImmediate(() => {
      window.focus();
    });
  });

  ipcMain.handle('show', () => {
    window.show();
  });

  ipcMain.handle('file', async () => {
    const result = await dialog.showOpenDialog(window, {
      properties: ['multiSelections'],
      title: 'ファイル選択',
      defaultPath: '.',
      filters: [{ name: 'メディアファイル', extensions: ['mp3', 'mp4'] }],
    });
    if (result.canceled) return;
    return normalizePaths(result.filePaths);
  });

  ipcMain.handle('folder', async () => {
    const result = await dialog.showOpenDialog(window, {
      properties: ['openDirectory', 'multiSelections'],
      title: 'フォルダ選択',
      defaultPath: '.',
    });
    if (result.canceled) return;
    const folderFileList = await extractDirs(result.filePaths);
    return normalizePaths(folderFileList);
  });

  ipcMain.handle('drop', async (event, filePaths: string[]) => {
    const fileList = filePaths.filter(file => fs.statSync(file).isFile() && /.*\.(mp3|mp4)$/.test(file));
    const folderList = filePaths.filter(file => fs.statSync(file).isDirectory());
    const folderFileList = await extractDirs(folderList);
    const resultList = [...fileList, ...folderFileList];
    return normalizePaths(resultList);
  });

  return window;
}

// quit application when all windows are closed
app.on('window-all-closed', () => {
  // on macOS it is common for applications to stay open until the user explicitly quits
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // on macOS it is common to re-create a window even after all windows have been closed
  if (mainWindow === null) {
    mainWindow = createMainWindow();
  }
});

// create main BrowserWindow when electron is ready
app.on('ready', () => {
  mainWindow = createMainWindow();
});

async function extractDirs(dirs: string[]) {
  return flatten(
    await Promise.all(
      dirs.map(async dir => {
        return (await fs.promises.readdir(dir))
          .map(file => path.resolve(path.join(dir, file)))
          .filter(file => fs.statSync(file).isFile() && /.*\.(mp3|mp4)$/.test(file));
      }),
    ),
  );
}

function flatten<T>(arr: T[][]): T[] {
  return arr.reduce(function (flat, toFlatten) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return flat.concat(Array.isArray(toFlatten) ? flatten(toFlatten as any) : toFlatten);
  }, []);
}

function normalizePaths(filePaths: string[]): string[] {
  return filePaths.map(filePath => path.normalize(filePath));
}
