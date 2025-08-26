const { app, BrowserWindow, Menu } = require('electron');
const path = require('path');

// メインウィンドウへの参照を保持
let mainWindow;

function createWindow() {
  // メインウィンドウを作成
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 720,
    minWidth: 1024,
    minHeight: 768,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      webSecurity: false // CSVファイル読み込みのため
    },
    icon: path.join(__dirname, 'assets/icon.png'),
    title: '2人の秘密、野球拳。',
    show: false, // 準備完了まで非表示
    backgroundColor: '#2e2c29'
  });

  // index.htmlを読み込み
  mainWindow.loadFile('index.html');

  // ウィンドウの準備ができたら表示
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // 開発者ツールを開く（開発時のみ）
  if (process.argv.includes('--dev')) {
    mainWindow.webContents.openDevTools();
  }

  // ウィンドウが閉じられる時の処理
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // メニューバーを非表示にする
  Menu.setApplicationMenu(null);
}

// Electronの初期化が完了したらウィンドウを作成
app.whenReady().then(() => {
  createWindow();

  // macOSでアプリが開かれた時の処理
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// すべてのウィンドウが閉じられた時の処理
app.on('window-all-closed', () => {
  // macOS以外では完全にアプリケーションを終了
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// セキュリティ: 新しいウィンドウの作成を防ぐ
app.on('web-contents-created', (event, contents) => {
  contents.on('new-window', (navigationEvent, navigationURL) => {
    event.preventDefault();
  });
});