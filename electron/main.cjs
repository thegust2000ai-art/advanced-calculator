const { app, BrowserWindow, shell } = require('electron');
const path = require('path');
const fs = require('fs');

// ============================================================
// النسخة المحمولة (portable): البيانات (localStorage) تتحفظ
// داخل مجلد "data" بجانب الـ exe نفسه — انقل المجلد مع الـ exe
// = انقل برنامجك ببياناته كاملة.
// ============================================================
function resolvePortableUserDataDir() {
  const portableExeDir = process.env.PORTABLE_EXECUTABLE_DIR;
  if (portableExeDir && typeof portableExeDir === 'string' && portableExeDir.trim()) {
    return path.join(portableExeDir, 'data');
  }
  if (app.isPackaged) {
    const exeDir = path.dirname(process.execPath);
    const nonPortable = /[\\/](Program Files|Program Files \(x86\)|AppData[\\/]Local)[\\/]/i;
    if (!nonPortable.test(exeDir)) {
      return path.join(exeDir, 'data');
    }
  }
  return null;
}

try {
  const dataDir = resolvePortableUserDataDir();
  if (dataDir) {
    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
    app.setPath('userData', dataDir);
  }
} catch (e) {
  // تجاهل — localStorage هيروح للمسار الافتراضي
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1500,
    height: 940,
    minWidth: 1100,
    minHeight: 720,
    autoHideMenuBar: true,
    title: 'آلة حاسبة متقدمة',
    backgroundColor: '#070d1a',
    icon: path.join(__dirname, '..', 'dist', 'icon.png'),
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  const indexPath = path.join(app.getAppPath(), 'dist', 'index.html');
  win.loadFile(indexPath);

  // أي لينك خارجي يتفتح في المتصفح الافتراضي — مش جوا التطبيق
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http://') || url.startsWith('https://')) {
      shell.openExternal(url);
    }
    return { action: 'deny' };
  });

  return win;
}

// قفل نسخة واحدة — نفس مبدأ باقي تطبيقات الهيئة
const hasSingleInstanceLock = app.requestSingleInstanceLock();

if (!hasSingleInstanceLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    const win = BrowserWindow.getAllWindows()[0];
    if (win && !win.isDestroyed()) {
      if (win.isMinimized()) win.restore();
      win.focus();
    } else {
      createWindow();
    }
  });

  app.whenReady().then(() => {
    createWindow();
    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
  });

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
  });
}
