# Electron BGM自動再生設定

## 概要
このゲームをElectronで実行する際、ブラウザの自動再生ポリシーを無効化してBGMを即座に再生できるように設定しています。

## 設定内容

### 1. 最強Chromiumフラグ設定
以下のフラグでブラウザの自動再生制限を完全無効化：

**基本設定：**
- `--autoplay-policy=no-user-gesture-required` - ユーザー操作なしで自動再生を許可
- `--disable-features=PreloadMediaEngagementData,MediaEngagementBypassAutoplayPolicies` - メディアエンゲージメント機能を無効化

**強力な制限無効化：**
- `--disable-background-timer-throttling` - バックグラウンドタイマーの制限を無効化
- `--disable-renderer-backgrounding` - レンダラーのバックグラウンド化を無効化
- `--disable-web-security` - Webセキュリティを無効化（自動再生のため）
- `--enable-features=AutoplayIgnoreWebAudio` - WebAudio自動再生を強制有効化
- `--force-fieldtrials=AutoplayPolicy/NoUserGestureRequired` - 実験的自動再生ポリシー

**音声最適化：**
- `--enable-exclusive-audio` - 排他的音声アクセス
- `--audio-buffer-size=1024` - 音声バッファサイズ最適化
- `--disable-features=AudioServiceOutOfProcess` - 音声サービス分離を無効化

### 2. BrowserWindow設定
```javascript
webPreferences: {
    autoplayPolicy: 'no-user-gesture-required', // 自動再生ポリシーを無効化
    backgroundThrottling: false,                 // バックグラウンド制限を無効化
}
```

### 3. AudioContext自動再開
Electron環境では、AudioContextが自動的に再開されるように設定。

## 起動方法

### 方法1: npmスクリプト
```bash
# 通常起動（基本自動再生有効）
npm start

# 開発モード（DevTools付き、自動再生有効）
npm run dev

# 強力な自動再生設定
npm run start:autoplay

# BGMテストモード
npm run test:bgm

# 🎵 最強BGM自動再生モード（推奨）
npm run ultimate:bgm
```

### 方法2: バッチファイル（Windows）
```cmd
# ダブルクリックで起動
start-electron.bat
```

### 方法3: PowerShell（Windows）
```powershell
# PowerShellで実行
.\start-electron.ps1
```

## トラブルシューティング

### BGMが再生されない場合

1. **Electronがインストールされているか確認**
   ```bash
   npm install
   ```

2. **管理者権限で実行**
   - 一部の環境では管理者権限が必要な場合があります

3. **ファイアウォール/セキュリティソフトの確認**
   - 音声ファイルへのアクセスがブロックされていないか確認

4. **コンソールログの確認**
   - F12でDevToolsを開き、コンソールでエラーを確認
   - `🎵` マークのログでBGM再生状態を追跡

### ブラウザで実行する場合

通常のブラウザで実行する場合は、自動再生ポリシーの制限により、初回クリック後にBGMが再生されます。これは仕様です。

## 技術詳細

### main.js
- Electronのメインプロセス
- Chromiumフラグの設定
- BrowserWindowの作成と設定

### preload.js
- レンダラープロセスとメインプロセスの橋渡し
- 音声再生APIの提供
- AudioContext初期化

### AudioManager.js
- Electron環境を自動検出
- Electron環境では即座に音声を初期化
- 通常ブラウザでは従来通りユーザー操作待ち

### TitleScene.js
- Electron環境では即座にBGM再生
- 複数のフォールバック機構
- 再生確認と自動リトライ

## 注意事項

- この設定はElectron環境でのみ有効です
- 通常のWebブラウザでは自動再生ポリシーが適用されます
- 音声ファイルのパスは `./assets/audio/bgm/` 配下に配置してください