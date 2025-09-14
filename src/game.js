/**
 * game.js
 * メインゲームコントローラー
 * すべてのシーンとシステムを統合管理
 */

class GameController {
    constructor() {
        this.isInitialized = false;
        this.currentScene = null;
        
        // システム管理
        this.csvLoader = null;
        this.saveSystem = null;
        this.audioManager = null;
        this.costumeSystem = null;
        
        // シーン管理
        this.scenes = {
            title: null,
            dialogue: null,
            game: null,
            ending: null,
            badEndEditor: null,
            gallery: null
        };
        
        // ゲーム状態
        this.gameState = {
            currentPhase: 'title', // title, dialogue, game, ending
            isGameActive: false,
            isEndingMode: false, // エンディングトーク画面モード
            canReturnToGame: true, // ゲームに戻ることができるか
            gameData: {}
        };
        
        this.initialize();
    }

    /**
     * ゲームコントローラーを初期化
     */
    async initialize() {
        console.log('GameController初期化開始');
        
        try {
            // ローディング画面を表示
            this.showLoadingScreen();
            
            // システムを初期化
            await this.initializeSystems();
            
            // ローディング中のBGM再生は削除（タイトル画面で自動開始するため不要）
            // this.audioManager.playSceneBGM('loading', 1.0).catch(() => {
            //     console.log('ローディングBGMが見つかりません');
            // });
            
            // シーンを初期化
            this.initializeScenes();
            
            // 設定を読み込み
            this.loadSettings();
            
            // ローディング完了
            this.hideLoadingScreen();
            
            // タイトル画面を表示
            await this.showTitleScreen();
            
            // デバッグ用キーボードショートカットを設定
            this.setupDebugKeyboardShortcuts();
            
            this.isInitialized = true;
            console.log('✅ GameController初期化完了');
            
        } catch (error) {
            console.error('GameController初期化エラー:', error);
            this.showErrorMessage('ゲームの初期化中にエラーが発生しました。ページを再読み込みしてください。');
        }
    }

    /**
     * システムを初期化
     */
    async initializeSystems() {
        console.log('🔄 システム初期化を開始します...');
        
        // CSV読み込みシステム（強制リロード有効）
        this.csvLoader = new CSVLoader();
        console.log('📊 CSVファイルを強制リロードで読み込み中...');
        await this.csvLoader.loadAllCSV(true); // 強制リロードを有効化
        
        // 読み込み完了後にデバッグ情報を表示
        this.csvLoader.debugInfo();
        
        // dialoguesテーブルを特に確認
        const dialogues = this.csvLoader.getTableData('dialogues');
        console.log(`📢 dialoguesテーブル読み込み結果: ${dialogues.length} 件`);
        
        if (dialogues.length > 0) {
            console.log('🔍 最初の3件のデータ:');
            dialogues.slice(0, 3).forEach((row, index) => {
                console.log(`  ${index + 1}. ID:${row.dialogue_id} | Char:${row.character_id} | Text:"${row.text?.substring(0, 30)}..."`);
            });
        }
        
        // セーブシステム
        this.saveSystem = new SaveSystem();
        
        // オーディオマネージャー
        this.audioManager = new AudioManager();
        
        // 衣装システム
        this.costumeSystem = new CostumeSystem(this);
        
        // 隠しクリック領域システム
        
        // クリック音管理システム
        if (window.clickSoundManager) {
            window.clickSoundManager.setAudioManager(this.audioManager, this.csvLoader);
            // ページ読み込み完了後にグローバルクリック音を設定
            setTimeout(() => {
                window.clickSoundManager.setupGlobalClickSound();
            }, 100);
        }
        
        console.log('✅ システム初期化完了');
    }

    /**
     * デバッグ用キーボードショートカットを設定
     */
    setupDebugKeyboardShortcuts() {
        // より確実なイベントリスナー登録
        const handleKeyDown = async (event) => {
            console.log(`🔑 キー押下: ${event.ctrlKey ? 'Ctrl+' : ''}${event.key}`);
            
            // Ctrl + R で CSV強制リロード
            if (event.ctrlKey && event.key === 'r' && !event.shiftKey) {
                event.preventDefault();
                event.stopPropagation();
                console.log('🔄 デバッグ: CSV強制リロードを実行');
                
                try {
                    await this.forceReloadAllCSV();
                } catch (error) {
                    console.error('❌ CSV強制リロードに失敗:', error);
                    alert('❌ CSV更新に失敗しました: ' + error.message);
                }
            }
            
            // Ctrl + D で CSV デバッグ情報表示
            if (event.ctrlKey && event.key === 'd') {
                event.preventDefault();
                event.stopPropagation();
                console.log('🐛 デバッグ: CSV情報を表示');
                if (this.csvLoader) this.csvLoader.debugInfo();
            }
        };
        
        // 複数の方法でイベントリスナーを登録
        document.addEventListener('keydown', handleKeyDown, true);
        window.addEventListener('keydown', handleKeyDown, true);
        document.body.addEventListener('keydown', handleKeyDown, true);
        
        console.log('🎮 デバッグキーボードショートカットを設定:');
        console.log('  - Ctrl + R: CSV強制リロード');
        console.log('  - Ctrl + D: CSV情報表示');
    }

    /**
     * CSV強制リロードを実行（UI用）
     */
    async forceReloadAllCSV() {
        console.log('🔄 CSV強制リロード開始...');
        
        if (!this.csvLoader) {
            throw new Error('CSVLoaderが初期化されていません');
        }
        
        await this.csvLoader.loadAllCSV(true);
        console.log('✅ 全CSVファイルの強制リロードが完了しました');
        
        // 現在が会話シーンの場合、データを再読み込み
        if (this.currentScene === 'dialogue' && this.scenes.dialogue && this.scenes.dialogue.isActive) {
            console.log('🔄 会話シーンのデータを再読み込みします');
            this.scenes.dialogue.loadDialogueData('living');
        }
        
        // ユーザーに通知
        alert('✅ CSVファイルを更新しました！');
        
        return true;
    }

    /**
     * シーンを初期化
     */
    initializeScenes() {
        this.scenes.title = new TitleScene(this);
        this.scenes.dialogue = new DialogueScene(this);
        this.scenes.game = new GameScene(this);
        this.scenes.ending = new EndingScene(this);
        this.scenes.badEndEditor = new BadEndEditorScene(this);
        this.scenes.gallery = new GalleryScene(this);
        
        console.log('シーン初期化完了');
    }

    /**
     * 設定を読み込み
     */
    loadSettings() {
        const settings = this.saveSystem.loadSettings();
        
        // オーディオ設定を適用
        this.audioManager.setVolume('bgm', settings.bgmVolume);
        this.audioManager.setVolume('se', settings.seVolume);
        this.audioManager.setVolume('voice', settings.voiceVolume);
        
        console.log('設定読み込み完了');
    }

    /**
     * ローディング画面を表示
     */
    showLoadingScreen() {
        const loadingScreen = document.getElementById('loading-screen');
        if (loadingScreen) {
            loadingScreen.classList.add('active');
        }
    }

    /**
     * ローディング画面を非表示
     */
    hideLoadingScreen() {
        const loadingScreen = document.getElementById('loading-screen');
        if (loadingScreen) {
            loadingScreen.classList.remove('active');
        }
    }

    /**
     * エラーメッセージを表示
     * @param {string} message - エラーメッセージ
     */
    showErrorMessage(message) {
        const errorDiv = document.createElement('div');
        errorDiv.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(255, 0, 0, 0.9);
            color: white;
            padding: 30px;
            border-radius: 10px;
            font-size: 1.2rem;
            text-align: center;
            z-index: 1000;
            max-width: 80%;
        `;
        
        errorDiv.innerHTML = `
            <h2>エラー</h2>
            <p>${message}</p>
            <button onclick="location.reload()" style="
                margin-top: 15px;
                padding: 10px 20px;
                background: white;
                color: red;
                border: none;
                border-radius: 5px;
                cursor: pointer;
                font-size: 1rem;
            ">再読み込み</button>
        `;
        
        document.body.appendChild(errorDiv);
    }

    /**
     * タイトル画面を表示
     */
    async showTitleScreen() {
        console.log('タイトル画面に遷移');
        
        this.hideAllScenes();
        this.currentScene = 'title';
        this.gameState.currentPhase = 'title';
        
        // 隠しクリック領域を無効化
        
        await this.scenes.title.show();
        
        // タイトル画面の隠し領域を有効化
    }

    /**
     * BAD END編集画面を表示
     */
    async showBadEndEditor() {
        console.log('BAD END編集画面に遷移');
        console.log('badEndEditor scene:', this.scenes.badEndEditor);
        
        if (!this.scenes.badEndEditor) {
            console.error('❌ BadEndEditorSceneが初期化されていません');
            alert('BAD END編集機能が初期化されていません。');
            return;
        }
        
        this.hideAllScenes();
        this.currentScene = 'badEndEditor';
        
        // 隠しクリック領域を無効化
        
        console.log('badEndEditorシーンのshow()を呼び出し中...');
        try {
            await this.scenes.badEndEditor.show();
        } catch (error) {
            console.error('❌ BAD END編集画面の表示でエラー:', error);
            alert('BAD END編集画面の表示でエラーが発生しました: ' + error.message);
        }
    }

    /**
     * 新しいゲームを開始
     */
    async startNewGame() {
        console.log('新しいゲームを開始');
        
        // ゲーム状態をリセット
        this.resetGameState();
        
        // 会話シーンから開始（introシーン）
        this.hideAllScenes();
        this.currentScene = 'dialogue';
        this.gameState.currentPhase = 'dialogue';
        this.gameState.isGameActive = true;
        
        // 隠しクリック領域を更新
        
        // 「intro」シーンで開始（CSVのscene_idに対応）
        await this.scenes.dialogue.show('living');
        
        // 会話シーンの隠し領域を有効化
    }

    /**
     * セーブデータからゲームを読み込み
     * @param {Object} saveData - セーブデータ
     */
    async loadGameFromSave(saveData) {
        console.log('セーブデータからゲームを読み込み');
        
        try {
            // ゲーム状態を復元
            this.restoreGameState(saveData);
            
            // 現在のシーンに応じて表示
            this.hideAllScenes();
            
            switch (saveData.currentScene) {
                case 'dialogue':
                    this.currentScene = 'dialogue';
                    await this.scenes.dialogue.show(saveData.sceneId || 'living');
                    break;
                case 'game':
                    this.currentScene = 'game';
                    await this.scenes.game.show(saveData);
                    break;
                default:
                    // デフォルトは会話シーンから
                    this.currentScene = 'dialogue';
                    await this.scenes.dialogue.show('living');
                    break;
            }
            
        } catch (error) {
            console.error('セーブデータ読み込みエラー:', error);
            this.showErrorMessage('セーブデータの読み込みに失敗しました。');
        }
    }

    /**
     * バトルフェーズを開始
     */
    async startBattlePhase() {
        console.log('バトルフェーズ開始');
        
        this.hideAllScenes();
        this.currentScene = 'game';
        this.gameState.currentPhase = 'game';
        
        // 隠しクリック領域を更新
        
        await this.scenes.game.show();
        
        // ゲームシーンの隠し領域を有効化
    }

    /**
     * トーク画面を表示（ゲーム勝利後）
     * @param {string} sceneType - シーンタイプ (デフォルトは'victory')
     */
    async showDialogue(sceneType = 'victory') {
        console.log(`トーク画面に遷移: ${sceneType}`);
        
        // victoryシーンの場合はエンディングモードを設定
        if (sceneType === 'victory') {
            console.log('🎉 エンディングトーク画面モードを有効化');
            this.gameState.isEndingMode = true;
            this.gameState.canReturnToGame = false;
        }
        
        this.hideAllScenes();
        this.currentScene = 'dialogue';
        this.gameState.currentPhase = 'dialogue';
        this.gameState.isGameActive = false;
        
        // 隠しクリック領域を更新
        
        // トークシーンを表示（美咲の立ち絵は現状のstage6を維持）
        // livingシーンを使用してゲーム開始前と同じトーク画面に戻る
        await this.scenes.dialogue.show(sceneType);
        
        // 会話シーンの隠し領域を有効化
    }

    /**
     * エンディングを表示
     * @param {string} endingType - エンディングタイプ
     */
    async showEnding(endingType) {
        console.log(`エンディング表示: ${endingType}`);
        
        this.hideAllScenes();
        this.currentScene = 'ending';
        this.gameState.currentPhase = 'ending';
        this.gameState.isGameActive = false;
        
        await this.scenes.ending.show(endingType);
    }

    /**
     * 美咲の反応を表示
     * @param {Object} reactionData - 反応データ
     */
    showMisakiReaction(reactionData) {
        if (this.currentScene === 'dialogue') {
            this.scenes.dialogue.showTemporaryDialogue(reactionData);
        } else if (this.currentScene === 'game') {
            this.scenes.game.showMisakiMessage(reactionData.dialogue);
        }
    }

    /**
     * すべてのシーンを非表示
     */
    hideAllScenes() {
        Object.values(this.scenes).forEach(scene => {
            if (scene && typeof scene.hide === 'function') {
                scene.hide();
            }
        });
    }

    /**
     * ゲーム状態をリセット
     */
    resetGameState() {
        this.gameState = {
            currentPhase: 'dialogue',
            isGameActive: true,
            isEndingMode: false,
            canReturnToGame: true,
            gameData: {
                currentRound: 1,
                playerHP: 5,
                misakiHP: 5,
                playerWins: 0,
                misakiWins: 0,
                consecutiveWins: 0,
                specialMoveAvailable: false
            }
        };
        
        // システムもリセット
        this.costumeSystem.reset();
        
        console.log('ゲーム状態リセット完了');
    }

    /**
     * ゲーム状態を復元
     * @param {Object} saveData - セーブデータ
     */
    restoreGameState(saveData) {
        this.gameState.currentPhase = saveData.currentScene || 'dialogue';
        this.gameState.isGameActive = true;
        this.gameState.gameData = {
            currentRound: saveData.currentRound || 1,
            playerHP: saveData.playerHP || 5,
            misakiHP: saveData.misakiHP || 5,
            playerWins: saveData.playerWins || 0,
            misakiWins: saveData.misakiWins || 0,
            consecutiveWins: saveData.consecutiveWins || 0,
            specialMoveAvailable: saveData.specialMoveAvailable || false
        };
        
        console.log('ゲーム状態復元完了');
    }

    /**
     * 現在のゲーム状態を取得（セーブ用）
     * @returns {Object} セーブデータ
     */
    getCurrentGameState() {
        const baseData = {
            currentScene: this.currentScene,
            currentPhase: this.gameState.currentPhase,
            timestamp: new Date().toISOString(),
            ...this.gameState.gameData
        };
        
        // 現在のシーンから追加データを取得
        if (this.scenes[this.currentScene] && 
            typeof this.scenes[this.currentScene].getState === 'function') {
            const sceneState = this.scenes[this.currentScene].getState();
            Object.assign(baseData, sceneState);
        }
        
        return baseData;
    }

    /**
     * オートセーブを実行
     */
    autoSave() {
        if (this.gameState.isGameActive) {
            const saveData = this.getCurrentGameState();
            this.saveSystem.autoSave(saveData);
        }
    }

    /**
     * ゲームを終了
     */
    exitGame() {
        console.log('ゲーム終了');
        
        // すべてのシステムをクリーンアップ
        this.cleanup();
        
        // Electronの場合はウィンドウを閉じる
        if (window.require) {
            try {
                const { remote } = window.require('electron');
                remote.getCurrentWindow().close();
            } catch (error) {
                console.log('ブラウザモードで実行中');
            }
        }
    }

    /**
     * ゲームループ（必要に応じて）
     */
    update() {
        if (!this.isInitialized) return;
        
        // 現在のシーンを更新
        if (this.scenes[this.currentScene] && 
            typeof this.scenes[this.currentScene].update === 'function') {
            this.scenes[this.currentScene].update();
        }
        
        // 定期的にオートセーブ
        if (this.gameState.isGameActive && Math.random() < 0.01) {
            this.autoSave();
        }
    }

    /**
     * ウィンドウリサイズ処理
     */
    handleResize() {
        // レスポンシブ対応処理
        const gameContainer = document.getElementById('game-container');
        if (gameContainer) {
            const width = window.innerWidth;
            const height = window.innerHeight;
            
            // スケール調整
            let scale = 1;
            if (width < 1024 || height < 768) {
                scale = Math.min(width / 1024, height / 768);
            }
            
            gameContainer.style.transform = `scale(${scale})`;
            gameContainer.style.transformOrigin = 'center center';
        }
    }

    /**
     * キーボードショートカット処理
     * @param {KeyboardEvent} event - キーボードイベント
     */
    handleGlobalKeyInput(event) {
        // グローバルショートカット
        switch (event.code) {
            case 'F11':
                event.preventDefault();
                this.toggleFullscreen();
                break;
            case 'KeyM':
                if (event.ctrlKey) {
                    event.preventDefault();
                    this.toggleMute();
                }
                break;
            case 'F5':
                if (!event.ctrlKey) {
                    event.preventDefault();
                    location.reload();
                }
                break;
        }
    }

    /**
     * フルスクリーンの切り替え
     */
    toggleFullscreen() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(err => {
                console.log('フルスクリーンエラー:', err);
            });
        } else {
            document.exitFullscreen();
        }
    }

    /**
     * ミュートの切り替え
     */
    toggleMute() {
        const currentVolume = this.audioManager.getVolume('master');
        const newVolume = currentVolume > 0 ? 0 : 1;
        
        this.audioManager.setVolume('master', newVolume);
        
        // 設定に保存
        this.saveSystem.updateSetting('muted', newVolume === 0);
        
        console.log(`音声${newVolume === 0 ? 'ミュート' : 'ミュート解除'}`);
    }

    /**
     * デバッグ情報を表示
     */
    showDebugInfo() {
        console.log('=== Game Controller Debug Info ===');
        console.log('初期化済み:', this.isInitialized);
        console.log('現在のシーン:', this.currentScene);
        console.log('ゲーム状態:', this.gameState);
        
        // 各システムのデバッグ情報
        if (this.csvLoader) this.csvLoader.debugInfo();
        if (this.saveSystem) this.saveSystem.debugInfo();
        if (this.audioManager) this.audioManager.debugInfo();
        if (this.costumeSystem) this.costumeSystem.debugInfo();
        
        console.log('===================================');
    }

    /**
     * リソースをクリーンアップ
     */
    cleanup() {
        console.log('GameController クリーンアップ開始');
        
        // 各シーンをクリーンアップ
        Object.values(this.scenes).forEach(scene => {
            if (scene && typeof scene.cleanup === 'function') {
                scene.cleanup();
            }
        });
        
        // オーディオを停止
        if (this.audioManager) {
            this.audioManager.stopAll();
        }
        
        // イベントリスナーを削除
        document.removeEventListener('keydown', this.handleGlobalKeyInput);
        window.removeEventListener('resize', this.handleResize);
        
        console.log('GameController クリーンアップ完了');
    }
}

// ゲーム開始
let gameController = null;

// クラスが定義されているか確認する関数
function checkClassesLoaded() {
    return typeof CSVLoader !== 'undefined' && 
           typeof SaveSystem !== 'undefined' && 
           typeof AudioManager !== 'undefined' &&
           typeof TitleScene !== 'undefined' &&
           typeof DialogueScene !== 'undefined' &&
           typeof GameScene !== 'undefined' &&
           typeof EndingScene !== 'undefined' &&
           typeof CostumeSystem !== 'undefined' &&
           true; // ClickAreaSystem removed
}

// DOMContentLoadedイベントでゲームを初期化
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM読み込み完了 - ゲーム初期化開始');
    
    // クラスがすべて読み込まれているか確認
    if (!checkClassesLoaded()) {
        console.error('必要なクラスが読み込まれていません');
        console.log('利用可能なクラス:', {
            CSVLoader: typeof CSVLoader,
            SaveSystem: typeof SaveSystem,
            AudioManager: typeof AudioManager,
            TitleScene: typeof TitleScene,
            DialogueScene: typeof DialogueScene,
            GameScene: typeof GameScene,
            EndingScene: typeof EndingScene,
            CostumeSystem: typeof CostumeSystem
        });
        
        // 簡易エラー表示
        const errorDiv = document.createElement('div');
        errorDiv.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(255, 0, 0, 0.9);
            color: white;
            padding: 30px;
            border-radius: 10px;
            font-size: 1.2rem;
            text-align: center;
            z-index: 1000;
            max-width: 80%;
        `;
        errorDiv.innerHTML = `
            <h2>初期化エラー</h2>
            <p>JavaScriptファイルの読み込みに失敗しました。</p>
            <p>以下のいずれかの方法でお試しください：</p>
            <ul style="text-align: left; margin: 20px 0;">
                <li><a href="index-simple.html" style="color: #7ed6c4;">簡易版で起動</a></li>
                <li><a href="test.html" style="color: #7ed6c4;">テスト版で確認</a></li>
                <li>Electronで起動（npm start）</li>
            </ul>
            <button onclick="location.reload()" style="
                margin-top: 15px;
                padding: 10px 20px;
                background: white;
                color: red;
                border: none;
                border-radius: 5px;
                cursor: pointer;
                font-size: 1rem;
            ">再読み込み</button>
        `;
        document.body.appendChild(errorDiv);
        return;
    }
    
    try {
        gameController = new GameController();
        
        // グローバルイベントリスナー設定
        document.addEventListener('keydown', (event) => {
            if (gameController) {
                gameController.handleGlobalKeyInput(event);
            }
        });
        
        window.addEventListener('resize', () => {
            if (gameController) {
                gameController.handleResize();
            }
        });
        
        // 初回リサイズ処理
        if (gameController) {
            gameController.handleResize();
        }
        
        // ゲームループ開始（60FPS目標）
        setInterval(() => {
            if (gameController) {
                gameController.update();
            }
        }, 1000 / 60);
    } catch (error) {
        console.error('GameController作成エラー:', error);
        const errorDiv = document.createElement('div');
        errorDiv.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(255, 0, 0, 0.9);
            color: white;
            padding: 30px;
            border-radius: 10px;
            font-size: 1.2rem;
            text-align: center;
            z-index: 1000;
            max-width: 80%;
        `;
        errorDiv.innerHTML = `
            <h2>エラー</h2>
            <p>${error.message}</p>
            <p>詳細はコンソールを確認してください（F12キー）</p>
            <button onclick="location.reload()" style="
                margin-top: 15px;
                padding: 10px 20px;
                background: white;
                color: red;
                border: none;
                border-radius: 5px;
                cursor: pointer;
                font-size: 1rem;
            ">再読み込み</button>
        `;
        document.body.appendChild(errorDiv);
    }
});

// ウィンドウ閉じる前の処理
window.addEventListener('beforeunload', (event) => {
    if (gameController && gameController.gameState.isGameActive) {
        // ゲーム中の場合はオートセーブ
        gameController.autoSave();
    }
});

// エラーハンドリング
window.addEventListener('error', (event) => {
    console.error('グローバルエラー:', event.error);
    
    if (gameController) {
        gameController.showErrorMessage('予期しないエラーが発生しました。');
    }
});

// プロミス拒否のハンドリング
window.addEventListener('unhandledrejection', (event) => {
    console.error('未処理のPromise拒否:', event.reason);
    event.preventDefault();
});

// グローバルに公開（デバッグ用）
window.gameController = gameController;

console.log('game.js 読み込み完了');