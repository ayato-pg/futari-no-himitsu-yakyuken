/**
 * main.js
 * Electronアプリケーションのメインプロセス
 * 自動再生ポリシーを無効化してBGMの即座再生を可能にする
 */

const { app, BrowserWindow, Menu } = require('electron');
const path = require('path');

// 🎵 最強の自動再生ポリシー無効化設定
console.log('🚀 Electron: 自動再生ポリシー完全無効化開始');

// 基本的な自動再生設定
app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required');
app.commandLine.appendSwitch('disable-features', 'PreloadMediaEngagementData,MediaEngagementBypassAutoplayPolicies');

// 追加の強力な自動再生設定
app.commandLine.appendSwitch('disable-background-timer-throttling');
app.commandLine.appendSwitch('disable-renderer-backgrounding');
app.commandLine.appendSwitch('disable-backgrounding-occluded-windows');
app.commandLine.appendSwitch('disable-back-forward-cache');

// メディア関連の制限を完全無効化
app.commandLine.appendSwitch('disable-features', 'AudioServiceOutOfProcess,MediaEngagementBypassAutoplayPolicies');
app.commandLine.appendSwitch('enable-features', 'AutoplayIgnoreWebAudio');
app.commandLine.appendSwitch('force-fieldtrials', 'AutoplayPolicy/NoUserGestureRequired');

// ウェブセキュリティ関連の制限を緩和（自動再生のため）
app.commandLine.appendSwitch('disable-web-security');
app.commandLine.appendSwitch('disable-site-isolation-trials');
app.commandLine.appendSwitch('allow-running-insecure-content');

// 🔓 ファイルアクセス制限を完全解除（CSVファイル読み込みのため）
app.commandLine.appendSwitch('allow-file-access-from-files');
app.commandLine.appendSwitch('disable-features', 'VizDisplayCompositor');
app.commandLine.appendSwitch('disable-same-origin-policy');

// 音声関連の最適化
app.commandLine.appendSwitch('enable-exclusive-audio');
app.commandLine.appendSwitch('try-supported-channel-layouts');
app.commandLine.appendSwitch('audio-buffer-size', '1024');

// キャッシュとデータディレクトリ設定
app.commandLine.appendSwitch('user-data-dir', path.join(app.getPath('userData'), 'AutoplayEnabled'));
app.commandLine.appendSwitch('disable-gpu-sandbox');

console.log('✅ Electron: 自動再生ポリシー完全無効化完了');

let mainWindow = null;

/**
 * ウィンドウを作成
 */
function createWindow() {
    // メインウィンドウを作成（最強の自動再生設定）
    mainWindow = new BrowserWindow({
        width: 1920,
        height: 1080,
        minWidth: 1024,
        minHeight: 768,
        webPreferences: {
            // 🎵 自動再生を完全に許可
            autoplayPolicy: 'no-user-gesture-required',

            // セキュリティ設定（自動再生のため緩和）
            nodeIntegration: false,
            contextIsolation: true,
            webSecurity: false, // 自動再生のためWebセキュリティを無効化
            allowRunningInsecureContent: true,

            // 🔓 ファイルアクセス完全許可（CSVファイル読み込みのため）
            allowFileAccessFromFileURLs: true,

            // プリロード設定
            preload: path.join(__dirname, 'preload.js'),

            // メディア関連の設定（完全最適化）
            backgroundThrottling: false,
            offscreen: false,

            // 追加の自動再生設定
            additionalArguments: [
                '--autoplay-policy=no-user-gesture-required',
                '--disable-features=PreloadMediaEngagementData,MediaEngagementBypassAutoplayPolicies',
                '--enable-features=AutoplayIgnoreWebAudio',
                '--force-fieldtrials=AutoplayPolicy/NoUserGestureRequired',
                '--disable-background-timer-throttling',
                '--disable-renderer-backgrounding',
                '--enable-exclusive-audio'
            ],

            // 実験的機能を有効化
            experimentalFeatures: true,
            enableBlinkFeatures: 'AutoplayIgnoreWebAudio'
        },

        // ウィンドウ設定
        backgroundColor: '#1a1a1a',
        show: false,
        titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
        icon: path.join(__dirname, 'assets', 'icon.png'),

        // 追加のウィンドウ設定
        focusable: true,
        skipTaskbar: false,
        alwaysOnTop: false
    });

    // ウィンドウが準備できたら表示
    mainWindow.once('ready-to-show', () => {
        mainWindow.show();

        // デバッグのため開発者ツールを常に開く（一時的）
        console.log('🔧 [DEBUG] 開発者ツールを開いています...');
        mainWindow.webContents.openDevTools();

        // 開発環境の場合はDevToolsを開く（元の機能）
        if (process.argv.includes('--dev')) {
            console.log('🔧 [DEBUG] --devフラグ検出、追加設定なし');
        }

        // 自動再生ポリシーの状態をログ出力
        console.log('🎵 Electron: 自動再生ポリシーを無効化しました');
        console.log('🎵 BGMは即座に再生可能です');
    });

    // index.htmlを読み込み
    mainWindow.loadFile('index.html');

    // ウィンドウが閉じられたときの処理
    mainWindow.on('closed', () => {
        mainWindow = null;
    });

    // メニューバーを設定（開発環境以外では非表示）
    if (!process.argv.includes('--dev')) {
        Menu.setApplicationMenu(null);
    }

    // コンテンツが読み込まれたら追加の設定を注入
    mainWindow.webContents.on('did-finish-load', () => {
        // 自動再生を強制的に有効化するJavaScriptを注入
        mainWindow.webContents.executeJavaScript(`
            // 自動再生ポリシーを回避する設定
            console.log('🎮 Electron環境検出: 自動再生を強制有効化');

            // グローバルフラグを設定
            window.ELECTRON_AUTOPLAY_ENABLED = true;

            // AudioContextの自動再開
            if (window.AudioContext || window.webkitAudioContext) {
                const AudioContextClass = window.AudioContext || window.webkitAudioContext;
                const originalConstructor = AudioContextClass;

                window.AudioContext = window.webkitAudioContext = function(...args) {
                    const context = new originalConstructor(...args);

                    // コンテキストが一時停止されている場合は自動的に再開
                    if (context.state === 'suspended') {
                        context.resume();
                        console.log('🎵 AudioContextを自動再開しました');
                    }

                    return context;
                };
            }

            // HTMLAudioElementのplay()メソッドをオーバーライド
            const originalPlay = HTMLAudioElement.prototype.play;
            HTMLAudioElement.prototype.play = function() {
                console.log('🎵 音声再生試行:', this.src);

                return originalPlay.call(this).catch(error => {
                    console.log('⚠️ 音声再生エラー（Electronで回避試行）:', error.message);

                    // エラーが発生した場合、少し待ってから再試行
                    return new Promise((resolve) => {
                        setTimeout(() => {
                            originalPlay.call(this).then(resolve).catch(() => {
                                console.log('❌ 音声再生失敗（最終）');
                                resolve();
                            });
                        }, 100);
                    });
                });
            };

            console.log('✅ Electron自動再生設定完了');
        `);
    });

    // エラーハンドリング
    mainWindow.webContents.on('crashed', () => {
        console.error('レンダラープロセスがクラッシュしました');
    });

    mainWindow.webContents.on('unresponsive', () => {
        console.error('レンダラープロセスが応答しません');
    });
}

// Electronの準備ができたらウィンドウを作成
app.whenReady().then(() => {
    createWindow();

    // macOSの場合、すべてのウィンドウが閉じてもアプリを終了しない
    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

// すべてのウィンドウが閉じられたらアプリを終了（macOS以外）
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

// セキュリティ：HTTPSを強制しない（ローカル開発用）
app.on('certificate-error', (event, webContents, url, error, certificate, callback) => {
    event.preventDefault();
    callback(true);
});

// グローバルエラーハンドリング
process.on('uncaughtException', (error) => {
    console.error('未処理の例外:', error);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('未処理のPromise拒否:', reason);
});

console.log('🚀 Electronアプリケーション起動');
console.log('🎵 自動再生ポリシー: 無効化');
console.log('🎮 BGM即座再生: 有効');