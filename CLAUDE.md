# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an **Electron-based visual novel game** featuring a strip rock-paper-scissors (野球拳) minigame. The game is built with HTML5/CSS3/JavaScript and targets desktop platforms (Windows/Mac/Linux) through Electron. It features a story about childhood friends reuniting and playing their nostalgic game as adults.

### Key Technologies
- **Electron** - Desktop application framework
- **HTML5/CSS3/JavaScript** - Core game engine (vanilla ES6)
- **CSV Data Management** - BOM-encoded UTF-8 for external data
- **Audio Management** - Advanced BGM fade system with Web Audio API

### Current Features
- Multi-scene system (Title → Dialogue → Game → Ending)
- CSV-based external data management (17 CSV files)
- Advanced audio system with fade in/out effects
- Character costume progression system
- Save/Load functionality
- Browser and Electron compatibility

## Gemini CLI 連携

### トリガー
ユーザーが「Geminiと相談しながら進めて」（または類似表現）とリクエストした場合、Claude は Gemini CLI と協業します。

### 協業時の Claude の役割
- **批判的評価者**: Gemini の提案を鵜呑みにせず、必ず検証・評価する
- **統合責任者**: 複数の視点を統合し、最終判断を行う
- **品質管理者**: 実装の実現可能性、保守性、パフォーマンスを評価

### 協業ワークフロー
1. **PROMPT 準備**: 最新の要件と議論要約を `$PROMPT` に格納
2. **Gemini 呼び出し**:
   ```bash
   gemini <<EOF
   $PROMPT

   重要：以下の観点で複数の選択肢を提示してください：
   - 長所と短所を明確に
   - トレードオフを具体的に
   - 実装難易度の評価
   EOF
   ```
3. **出力形式**:
   ```md
   **Gemini ➜**
   <Gemini からの応答>

   **Claude ➜**
   <評価フレームワークに基づく分析>
   ```

### 📊 Claude の評価フレームワーク
**Claude ➜** セクションは必ず以下の構造に従う：

```
## Gemini提案の評価
✅ **採用可能な要素**: [具体的な良い点]
⚠️ **技術的懸念**: [実装上の問題点やリスク]
🔄 **Claude の代替案**: [独自の第3の選択肢]

## 最終判断
- **採用方針**: [Gemini案/Claude案/折衷案]
- **根拠**: [なぜその判断に至ったか]
- **実装計画**: [具体的な次のステップ]
```

### ⚡ 鵜呑み防止ルール
1. **Gemini の提案をそのまま採用することは禁止**
2. **必ず技術的検証を行う**
3. **独自案の検討を義務化**

## Game Structure

### Core Game Flow
```
TITLE → PROLOGUE → STRIP_JANKEN → END_A/B/C
```
- END_A: Player wins (5 wins first)
- END_B: Player loses (opponent gets 5 wins first)  
- END_C: Draw condition (4-4 tie, then 1 final round)

### Strip Janken (野球拳) Minigame
- Maximum 9 rounds
- First to 5 wins takes victory
- 5 stripping stages: TOWEL → JACKET → CARDIGAN → INNER → FINALE
- Heart-based UI: 5 hearts per character, lose 1 per round loss
- Hand animation: 0.3s loop with click to confirm selection

## Development Commands

### Running the Game
```bash
# Run in Electron (development)
npm start

# Run in browser (development)
# Open index.html directly in browser

# Run with enhanced audio support
npm run start:autoplay

# Build for production
npm run build
```

### Testing
```bash
# Manual testing checklist:
# - BGM fade in/out between scenes
# - CSV data loading (check console for fallback usage)
# - Character costume changes during game
# - Save/Load functionality
# - Browser vs Electron compatibility
```

## 重要な注意事項

- **ファイル作成制限**: ユーザーが明示的に要求しない限りファイルを作成しない
- **既存ファイル優先**: 新規ファイル作成より既存ファイルの編集を常に優先する
- **コード規約遵守**: コードベース内の既存のコードパターンと規約に従う
- **後方互換性**: 特に指定がない限り、すべてのコード変更は後方互換性を維持する
- **UTF-8 BOM**: CSVファイルは必ずBOM付きUTF-8で保存する（Excel互換性のため）

## Project Architecture

### Directory Structure
```
2人の秘密、野球拳。/
├── main.js                 # Electron main process
├── index.html              # Entry point
├── package.json            # Project configuration
├── src/
│   ├── game.js            # Main game controller
│   ├── scenes/            # Scene management classes
│   │   ├── TitleScene.js
│   │   ├── DialogueScene.js
│   │   ├── GameScene.js
│   │   └── EndingScene.js
│   └── systems/           # Game systems
│       ├── AudioManager.js    # BGM/SE with fade effects
│       ├── CSVLoader.js       # BOM UTF-8 CSV loader
│       ├── SaveSystem.js      # Save/Load functionality
│       └── CostumeSystem.js   # Character costume progression
├── assets/
│   ├── images/
│   │   ├── backgrounds/       # Scene backgrounds
│   │   ├── characters/        # Character sprites/costumes
│   │   └── ui/               # UI elements
│   ├── audio/
│   │   ├── bgm/              # Background music (OGG)
│   │   └── se/               # Sound effects (WAV)
│   └── data/
│       └── csv/              # External data (17 CSV files, BOM UTF-8)
└── README.md
```

### Key Implementation Details

#### Game State Management
```javascript
// GameScene.js - Main game state
this.currentRound = 1;
this.maxRounds = 9;
this.playerHP = 5;
this.misakiHP = 5;
this.playerWins = 0;
this.misakiWins = 0;
```

#### Audio System Architecture
```javascript
// AudioManager.js - Advanced BGM fade system
fadeIn(audio, targetVolume, duration) // requestAnimationFrame-based
fadeOut(audio, duration, callback)    // Smooth crossfade transitions
playSceneBGM(sceneId, fadeTime)      // CSV-configurable fade times
```

#### CSV Data Architecture
- **17 CSV Files**: scenes, characters, dialogues, costumes, etc.
- **BOM UTF-8 Encoding**: Excel-compatible, Japanese text support
- **Fallback System**: Embedded fallback data for browser CORS issues
- **Dynamic Loading**: Runtime CSV reloading with cache busting

#### UI Color Scheme
- Primary: #FF6B7D (Coral Pink)
- Accent: #7ED6C4 (Mint)
- Background: Gradient overlays for browser compatibility

#### Browser Compatibility Features
- **CORS Fallback**: Embedded data when CSV loading fails
- **Image Fallbacks**: Placeholder system for missing assets
- **Audio Context**: User interaction-based audio initialization

## Asset Specifications

### Images
- Characters: 1920x1080 PNG with transparency
- Backgrounds: 1920x1080 JPG
- CG: 1920x1080 PSD (layered for variations)

### Audio
- BGM: OGG Vorbis, looped
- SE: WAV, 44.1kHz

## Critical Requirements

### Performance
- Target 60 FPS on Steam Deck
- Smooth transitions between scenes
- Responsive touch/mouse/gamepad controls

### Localization
- All text must use translation system
- UI must not break when switching languages
- Font must support both Japanese and English characters

### Sound Implementation
- **BGM Fade System**: 3-4 second crossfade transitions between scenes
- **Click Sounds**: se_click.wav on ALL interactions via ClickSoundManager
- **Audio Context**: Browser autoplay policy handling with user interaction
- **Volume Controls**: Separate BGM/SE volume with master volume

## Common Development Tasks

### Adding New CSV Data
```javascript
// 1. Update CSV file with BOM UTF-8 encoding
// 2. Update CSVLoader.js fallback data
// 3. Test browser compatibility with CORS fallback
```

### Adding New Scene
```javascript
// 1. Create scene class in src/scenes/
class NewScene {
    constructor(gameController) {
        this.game = gameController;
    }

    async show() {
        // Setup background, BGM, UI
        await this.game.audioManager.playSceneBGM('scene_id');
    }
}

// 2. Register in GameController
this.scenes.newScene = new NewScene(this);
```

### BGM Transition Configuration
```javascript
// In CSV: bgm_settings.csv
scene_id,bgm_file,fade_in_time,fade_out_time
new_scene,bgm_new.mp3,3.0,2.5

// In AudioManager fallback:
'new_scene': {
    bgm_file: 'bgm_new.mp3',
    fade_in_time: 3.0,
    fade_out_time: 2.5
}
```

## Build Configuration Notes

### Electron Build
- **package.json**: Ensure name, version, and build configuration are correct
- **Electron Builder**: Configure for Windows (NSIS), Mac (DMG), Linux (AppImage)
- **Audio Flags**: Use autoplay-policy flags for enhanced BGM support
- **Asset Paths**: Verify relative paths work in both dev and production

### Testing Checklist
- [ ] BGM fade in/out transitions (3-4 second duration)
- [ ] CSV data loading vs fallback data usage
- [ ] Background images display (browser vs Electron)
- [ ] Character costume progression system
- [ ] Save/Load functionality across sessions
- [ ] Click sound system on all interactive elements
- [ ] Cross-platform compatibility (Windows/Mac/Linux)

### Deployment Commands
```bash
# Development
npm start              # Standard Electron launch
npm run start:autoplay # Enhanced audio support

# Production
npm run build         # Build for current platform
npm run dist         # Create distribution packages
```