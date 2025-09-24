/**
 * GameScene.js
 * じゃんけんバトルのメインゲーム画面を管理するクラス
 * 美咲の大型立ち絵表示、HP管理、じゃんけん処理を統合
 */

class GameScene {
    constructor(gameController) {
        this.game = gameController;
        this.isActive = false;
        
        // ゲーム状態
        this.currentRound = 1;
        this.maxRounds = 9;
        this.playerHP = 5;
        this.misakiHP = 5;
        this.playerWins = 0;
        this.misakiWins = 0;
        
        // じゃんけん状態
        this.playerHand = null;
        this.misakiHand = null;
        this.isPlayingRound = false;
        this.lastRoundResult = null; // 前回のラウンド結果を保存
        this.canMakeChoice = false;
        
        // あいこ管理
        this.consecutiveDraws = 0;
        this.drawMessageIndex = 0; // あいこメッセージの順番管理（0-3の循環）
        this.misakiWinMessageIndex = 0; // 美咲勝利メッセージの順番管理
        
        // トーク進行管理
        this.isWaitingForJanken = false;
        this.pendingAction = null;
        
        // 必殺技機能を削除
        
        // DOM要素への参照
        this.gameScreen = null;
        this.misakiGameDisplay = null;
        this.battleResult = null;
        this.gameIntro = null;
        this.handButtons = {};
        this.statusElements = {};
        
        // 立ち絵管理
        this.currentMisakiSprite = '';
        this.lastDisplayedSprite = '';
        
        this.initialize();
    }

    /**
     * ゲームシーンを初期化
     */
    initialize() {
        this.gameScreen = document.getElementById('game-screen');
        this.misakiGameDisplay = document.getElementById('misaki-game');
        this.battleResult = document.getElementById('battle-result');
        this.gameIntro = document.getElementById('game-intro');
        
        // ステータス表示要素
        this.statusElements = {
            currentRound: document.getElementById('current-round'),
            misakiHPBar: document.getElementById('misaki-hp-bar'),
            misakiHPText: document.getElementById('misaki-hp-text'),
            misakiDefeats: document.getElementById('misaki-defeats'),
            playerHPBar: document.getElementById('player-hp-bar'),
            playerHPText: document.getElementById('player-hp-text'),
            playerVictories: document.getElementById('player-victories'),
            resultText: document.getElementById('result-text'),
            misakiHandDisplay: document.getElementById('misaki-hand'),
            playerHandDisplay: document.getElementById('player-hand'),
            misakiHeartsContainer: document.getElementById('misaki-hearts-container'),
            playerHeartsContainer: document.getElementById('player-hearts-container')
        };
        
        // じゃんけんボタン
        this.handButtons = {
            rock: document.getElementById('btn-rock'),
            scissors: document.getElementById('btn-scissors'),
            paper: document.getElementById('btn-paper'),
            hint: document.getElementById('btn-hint'),
            surrender: document.getElementById('btn-surrender')
        };
        
        this.setupEventListeners();
        // 初期立ち絵を設定
        this.initializeMisakiSprite();
        
        console.log('GameScene初期化完了');
    }

    /**
     * 美咲の初期立ち絵を設定
     */
    initializeMisakiSprite() {
        this.updateMisakiSprite(0); // 勝利数0の初期状態
    }

    /**
     * プレイヤーの勝利数に応じて美咲の立ち絵を更新
     * @param {number} playerWins - プレイヤーの勝利数 (0-5)
     */
    updateMisakiSprite(playerWins) {
        // 秘めた想いモードチェック
        const isSecretMode = this.game.gameState && this.game.gameState.isSecretMode;

        // 勝利数に応じた立ち絵マッピング（6段階）
        const spriteMapping = isSecretMode ? {
            // 秘めた想いモード用の立ち絵（6段階）
            0: 'assets/images/secret/characters/misaki/misaki_secret_stage1.png',
            1: 'assets/images/secret/characters/misaki/misaki_secret_stage2.png',
            2: 'assets/images/secret/characters/misaki/misaki_secret_stage3.png',
            3: 'assets/images/secret/characters/misaki/misaki_secret_stage4.png',
            4: 'assets/images/secret/characters/misaki/misaki_secret_stage5.png',
            5: 'assets/images/secret/characters/misaki/misaki_secret_stage6.png'
        } : {
            // 通常モードの立ち絵
            0: 'assets/images/characters/misaki/misaki_game_stage1.png',  // 初期状態：自信満々
            1: 'assets/images/characters/misaki/misaki_game_stage2.png',  // 1勝：少し焦り始める
            2: 'assets/images/characters/misaki/misaki_game_stage3.png',  // 2勝：明確に焦る
            3: 'assets/images/characters/misaki/misaki_game_stage4.png',  // 3勝：必死になる
            4: 'assets/images/characters/misaki/misaki_game_stage5.png',  // 4勝：かなり恥ずかしい
            5: 'assets/images/characters/misaki/misaki_game_stage6.png'   // 5勝：完全敗北（最終段階）
        };
        
        const spriteName = spriteMapping[playerWins] || spriteMapping[0];
        
        // 同じ画像の場合は変更しない
        if (this.lastDisplayedSprite === spriteName) {
            return;
        }
        
        this.currentMisakiSprite = spriteName;
        this.lastDisplayedSprite = spriteName;
        
        console.log(`📸 美咲の立ち絵更新: ${playerWins}勝 → ${spriteName}`);
        
        this.changeMisakiGameSprite(spriteName);
    }

    /**
     * ゲーム画面の美咲立ち絵を変更（アニメーション付き）
     * @param {string} spriteName - 画像ファイル名
     */
    changeMisakiGameSprite(spriteName) {
        if (!this.misakiGameDisplay) {
            console.error('❌ 美咲の表示要素が見つかりません');
            return;
        }

        // spriteNameにはすでにフルパスが含まれているため、そのまま使用
        const imagePath = spriteName;
        
        console.log(`🖼️ 美咲の立ち絵変更開始: ${imagePath}`);
        
        // 画像のプリロード処理
        const tempImage = new Image();
        tempImage.onload = () => {
            // アニメーション付きで画像を変更
            this.misakiGameDisplay.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
            this.misakiGameDisplay.style.opacity = '0';
            this.misakiGameDisplay.style.transform = 'scale(0.95)';
            
            setTimeout(() => {
                // 画像を変更
                this.misakiGameDisplay.src = tempImage.src;
                
                // フェードインアニメーション
                this.misakiGameDisplay.style.opacity = '1';
                this.misakiGameDisplay.style.transform = 'scale(1)';
                
                // 勝利時の特別エフェクト
                this.addSpriteChangeEffect();
                
                setTimeout(() => {
                    this.misakiGameDisplay.style.transition = '';
                }, 300);
                
            }, 300);
        };
        
        tempImage.onerror = () => {
            console.error(`❌ 立ち絵が見つかりません: ${imagePath}`);
            
            // フォールバック: デフォルト画像を試行
            const fallbackPath = 'assets/images/characters/misaki/misaki_game_stage1.png';
            if (imagePath !== fallbackPath) {
                console.log(`🔄 フォールバック画像を試行: ${fallbackPath}`);
                const fallbackImage = new Image();
                fallbackImage.onload = () => {
                    this.misakiGameDisplay.src = fallbackImage.src;
                    console.log(`✅ フォールバック画像読み込み成功`);
                };
                fallbackImage.onerror = () => {
                    console.error(`❌ フォールバック画像も読み込めません: ${fallbackPath}`);
                };
                fallbackImage.src = fallbackPath;
            }
        };
        
        tempImage.src = imagePath;
    }

    /**
     * 立ち絵変更時の特別エフェクト
     */
    addSpriteChangeEffect() {
        if (!this.misakiGameDisplay) return;
        
        // グロー効果を一時的に追加
        this.misakiGameDisplay.style.filter = 'drop-shadow(0 0 20px rgba(255, 107, 125, 0.8))';
        
        // 2秒後に通常に戻す
        setTimeout(() => {
            this.misakiGameDisplay.style.filter = 'drop-shadow(3px 3px 15px rgba(0,0,0,0.6))';
        }, 2000);
    }

    /**
     * イベントリスナーを設定
     */
    setupEventListeners() {
        // じゃんけんボタン
        if (this.handButtons.rock) {
            this.handButtons.rock.addEventListener('click', (event) => {
                this.makeChoice('rock', event);
            });
        }
        
        if (this.handButtons.scissors) {
            this.handButtons.scissors.addEventListener('click', (event) => {
                this.makeChoice('scissors', event);
            });
        }
        
        if (this.handButtons.paper) {
            this.handButtons.paper.addEventListener('click', (event) => {
                this.makeChoice('paper', event);
            });
        }
        
        // 制御ボタン
        if (this.handButtons.hint) {
            this.handButtons.hint.addEventListener('click', () => {
                this.showHint();
            });
        }
        
        if (this.handButtons.surrender) {
            this.handButtons.surrender.addEventListener('click', () => {
                this.surrenderGame();
            });
        }


        // じゃんけんボタンでトーク進行も可能にする（既存のmakeChoiceを拡張）

        // 🚨 進めるボタンの事前設定
        this.setupAdvanceButton();

        // タイトルへ戻るボタン
        const returnBtn = document.getElementById('game-return-btn');
        if (returnBtn) {
            returnBtn.addEventListener('click', () => {
                this.game.audioManager.playSE('se_choice_select.mp3', 0.8);
                this.returnToTitle();
            });
        }

        // ゲーム開始ボタン
        const startBtn = document.getElementById('start-game-btn');
        if (startBtn) {
            console.log('✅ ゲーム開始ボタンのイベントリスナーを設定');
            startBtn.addEventListener('click', () => {
                console.log('🔘 ゲーム開始ボタンがクリックされました');
                this.startGameFromIntro();
            });
            
            // デバッグ: ボタンの状態を確認
            console.log('🔍 ゲーム開始ボタン状態:', {
                display: startBtn.style.display,
                disabled: startBtn.disabled,
                className: startBtn.className,
                visible: startBtn.offsetParent !== null
            });
        } else {
            console.warn('⚠️ start-game-btn要素が見つかりません (初期化時)');
            
            // 遅延検索を試行
            setTimeout(() => {
                const delayedBtn = document.getElementById('start-game-btn');
                if (delayedBtn) {
                    console.log('✅ 遅延検索でゲーム開始ボタンを発見、イベントリスナーを設定');
                    delayedBtn.addEventListener('click', () => {
                        console.log('🔘 ゲーム開始ボタンがクリックされました (遅延設定)');
                        this.startGameFromIntro();
                    });
                } else {
                    console.error('❌ ゲーム開始ボタンが遅延検索でも見つかりません');
                }
            }, 1000);
        }

        // キーボード操作
        document.addEventListener('keydown', (event) => {
            if (this.isActive && this.canMakeChoice) {
                this.handleKeyInput(event);
            }
        });
    }

    /**
     * 進めるボタンの設定を行う
     */
    setupAdvanceButton() {
        console.log('🚨 setupAdvanceButton() 開始');
        
        const advanceButton = document.getElementById('btn-advance');
        if (!advanceButton) {
            console.error('❌ 進めるボタンが見つかりません');
            return;
        }
        
        // 既存のイベントリスナーを削除
        if (advanceButton.hasListener) {
            advanceButton.removeEventListener('click', advanceButton.clickHandler);
            advanceButton.hasListener = false;
            console.log('✅ 既存のイベントリスナーを削除');
        }
        
        // 新しいイベントリスナーを追加
        const clickHandler = () => {
            console.log('▶️ 🚨 進めるボタンがクリックされました (setupAdvanceButton版)');
            console.log('🔍 現在の状態:', {
                isWaitingForJanken: this.isWaitingForJanken,
                hasPendingAction: !!this.pendingAction,
                currentRound: this.currentRound,
                playerHP: this.playerHP,
                misakiHP: this.misakiHP
            });
            
            // SEを再生
            this.game.audioManager.playSE('se_click.mp3', 0.5);
            
            // 🚨 簡潔な処理：onJankenAdvance()を直接実行
            console.log('🚨 onJankenAdvance()を強制実行');
            const result = this.onJankenAdvance();
            console.log(`✅ onJankenAdvance()結果: ${result}`);
            
            // onJankenAdvance()が失敗した場合の代替処理
            if (!result) {
                console.log('⚠️ onJankenAdvance()が失敗したため、代替処理を実行');
                // 進めるボタンを非表示にして、じゃんけんボタンに戻す
                this.switchBackToJankenButtons();
                this.clearJankenWait();
                this.canMakeChoice = true;
                this.isPlayingRound = false;
            }
        };
        
        advanceButton.addEventListener('click', clickHandler);
        advanceButton.clickHandler = clickHandler; // 後で削除するために保存
        advanceButton.hasListener = true;
        
        console.log('✅ 進めるボタンのイベントリスナーを設定しました (setupAdvanceButton版)');
    }

    /**
     * ゲームシーンを表示
     * @param {Object} initialData - 初期ゲームデータ（ロード時など）
     */
    async show(initialData = null) {
        if (this.isActive) return;
        
        console.log('ゲーム画面を表示');
        
        // 🚨 強制的にCSVデータを再読み込み（秘めた想いモード対応）
        if (this.game.csvLoader) {
            console.log('🔄 CSVデータを強制再読み込み中...');

            // 現在のモード表示
            const isSecretMode = this.game.gameState && this.game.gameState.isSecretMode;
            console.log(`🔍 ゲーム状態モード: ${isSecretMode ? '秘めた想いモード' : '通常モード'}`);
            console.log(`🔍 CSVLoader現在モード: ${this.game.csvLoader.isSecretMode ? '秘めた想いモード' : '通常モード'}`);

            // 🔑 重要: CSVLoaderのモードを確実に設定し、完了を待つ
            console.log(`🔧 CSVLoaderのモードを非同期で設定します (isSecretMode: ${isSecretMode})...`);

            // setSecretModeがPromiseを返すため、awaitで完了を待つ
            const loadResult = await this.game.csvLoader.setSecretMode(isSecretMode);

            console.log(`[デバッグ] GameScene.show: await setSecretMode(${isSecretMode}) が完了しました。結果: ${loadResult}`);
            console.log(`[デバッグ] GameScene.show: CSVLoaderのフラグは現在 isSecretMode = ${this.game.csvLoader.isSecretMode} です。`);

            // 🔒 秘めた想いモードの場合、追加でsecret_dialogues.csvを強制読み込み
            if (isSecretMode) {
                console.log(`🔒 [FORCE] 秘めた想いモード：secret_dialogues.csvを強制読み込み中...`);
                try {
                    await this.game.csvLoader.loadCSV('secret_dialogues.csv');
                    console.log(`✅ [FORCE] secret_dialogues.csv強制読み込み完了`);

                    // 読み込み後の確認
                    const dialogues = this.game.csvLoader.getTableData('dialogues');
                    const gi001 = dialogues.find(d => d.dialogue_id === 'gi001');
                    console.log(`🔍 [FORCE] gi001確認 - text: "${gi001?.text}"`);
                } catch (error) {
                    console.error(`❌ [FORCE] secret_dialogues.csv強制読み込み失敗:`, error);
                }
            }

            console.log(`✅ CSVLoaderのデータ再読み込みが完了しました。`);

            // setSecretModeですべてのデータがリロードされるため、個別のloadTableは不要
            try {
                console.log('✅ CSVデータはsetSecretModeによりリロード済みです。');
                console.log('✅ CSVデータ再読み込み完了');

                // 読み込み後の確認
                const allData = this.game.csvLoader.getTableData('dialogues');
                console.log(`📋 再読み込み後のダイアログ総数: ${allData.length}`);

                // 秘めた想いモード用データの確認
                if (this.game.gameState.isSecretMode) {
                    const secretData = allData.filter(d => d.dialogue_id && d.dialogue_id.startsWith('secret_'));
                    console.log(`🔒 秘めた想いモード用データ数: ${secretData.length}`);
                }

                // intermediate_talk の確認
                const intermediateCount = allData.filter(d => d.scene_type === 'intermediate_talk').length;
                console.log(`🎭 intermediate_talk データ数: ${intermediateCount}`);

                // round_start の確認
                const roundStartCount = allData.filter(d => d.scene_type === 'round_start').length;
                console.log(`🎯 round_start データ数: ${roundStartCount}`);

            } catch (error) {
                console.error('❌ CSV再読み込みエラー:', error);
            }
        } else {
            console.error('❌ CSVローダーが存在しません');
        }
        
        // 初期データがあれば復元
        if (initialData) {
            this.restoreGameState(initialData);
        } else {
            this.resetGameState();
        }
        
        // 🎉 バトル開始時にStage 1を解放
        const stage1ImageName = 'misaki_game_stage1.png';
        const isNewUnlock = this.game.saveSystem.unlockGalleryImage(stage1ImageName, 1);
        if (isNewUnlock) {
            console.log('✨ バトル開始: Stage 1をギャラリーに解放しました');
        } else {
            console.log('📋 Stage 1は既に解放済みです');
        }
        
        // ゲームシーン専用BGMを再生（モードに応じて切り替え）
        const bgmScene = this.game.gameState.isSecretMode ? 'secret_game' : 'game';
        console.log(`🎵 BGMシーン選択: ${this.game.gameState.isSecretMode ? '秘めた想いモード' : '通常モード'} → ${bgmScene}`);
        await this.game.audioManager.playSceneBGM(bgmScene, 1.5);
        
        // 背景設定
        this.setupBackground();
        
        // 美咲の表示設定
        this.setupMisakiDisplay();
        
        // UI更新
        this.updateUI();
        
        // 画面表示
        this.gameScreen.classList.add('active');
        this.isActive = true;
        
        // ゲーム画面移行時にハートをアニメーション表示
        setTimeout(async () => {
            console.log('🎮 ゲーム画面移行時のハートアニメーション開始');
            await this.playHeartsStartAnimation();
            console.log('💕 ゲーム画面移行時のハート表示完了');
        }, 500); // 画面表示から少し遅らせて自然に
        
        // イントロダイアログを表示
        if (this.gameIntro) {
            this.gameIntro.classList.remove('hidden');

            // 🔒 秘めた想いモードの場合、古いデータを削除してsecret_dialogues.csvを再読み込み
            if (this.game.gameState.isSecretMode) {
                console.log(`🔒 [CRITICAL] setIntroDialogue直前：古いdialoguesデータを削除`);

                try {
                    // 古いdialoguesテーブルを削除
                    if (this.game.csvLoader && this.game.csvLoader.csvData) {
                        delete this.game.csvLoader.csvData['dialogues'];
                        console.log(`🗑️ [CRITICAL] 古いdialoguesテーブルを削除しました`);
                    }

                    // secret_dialogues.csvを強制読み込み
                    console.log(`🔒 [CRITICAL] secret_dialogues.csvを強制読み込み中...`);
                    await this.game.csvLoader.loadCSV('secret_dialogues.csv');
                    console.log(`✅ [CRITICAL] secret_dialogues.csv読み込み完了`);

                    // 再読み込み後の確認
                    const dialogues = this.game.csvLoader.getTableData('dialogues');
                    const gi001 = dialogues.find(d => d.dialogue_id === 'gi001');
                    console.log(`🔍 [CRITICAL] 新しいdialoguesテーブル件数: ${dialogues.length}`);
                    console.log(`🔍 [CRITICAL] gi001確認: "${gi001?.text}"`);
                } catch (error) {
                    console.error(`❌ [CRITICAL] データクリア・再読み込み失敗:`, error);
                }
            }

            // 導入セリフをタイプライター効果で表示
            await this.setIntroDialogue();
        }

        // ゲーム開始ボタンコンテナを表示
        const startButtonContainer = document.querySelector('.start-game-button-container');
        if (startButtonContainer) {
            startButtonContainer.style.display = 'flex';
            console.log('✅ ゲーム開始ボタンコンテナを表示しました');
        }

        // ゲーム開始ボタン表示中はじゃんけんボタンを非表示
        const handButtons = document.querySelector('.hand-buttons');
        if (handButtons) {
            handButtons.style.display = 'none';
            console.log('✅ じゃんけんボタンを非表示にしました（ゲーム開始前）');
        }
    }

    /**
     * ゲームシーンを非表示
     */
    hide() {
        if (!this.isActive) return;
        
        console.log('ゲーム画面を非表示');
        
        this.gameScreen.classList.remove('active');
        this.isActive = false;
        this.canMakeChoice = false;
    }

    /**
     * ゲーム状態をリセット
     */
    resetGameState() {
        this.currentRound = 1;
        this.playerHP = 5;
        this.misakiHP = 5;
        this.playerWins = 0;
        this.misakiWins = 0;
        this.playerHand = null;
        this.misakiHand = null;
        this.consecutiveDraws = 0;
        this.drawMessageIndex = 0;
        this.misakiWinMessageIndex = 0;
        
        // じゃんけん待機状態もリセット
        this.clearJankenWait();
        
        // 立ち絵を初期状態にリセット
        this.lastDisplayedSprite = '';
        this.updateMisakiSprite(0);
        
        console.log('ゲーム状態をリセット');
    }

    /**
     * ゲーム状態を復元
     * @param {Object} data - ゲームデータ
     */
    restoreGameState(data) {
        this.currentRound = data.currentRound || 1;
        this.playerHP = data.playerHP || 5;
        this.misakiHP = data.misakiHP || 5;
        this.playerWins = data.playerWins || 0;
        this.misakiWins = data.misakiWins || 0;
        this.consecutiveDraws = data.consecutiveDraws || 0;
        this.drawMessageIndex = data.drawMessageIndex || 0;
        this.misakiWinMessageIndex = data.misakiWinMessageIndex || 0;
        
        // 復元されたプレイヤー勝利数に応じて立ち絵を更新
        this.lastDisplayedSprite = '';
        this.updateMisakiSprite(this.playerWins);
        
        console.log('ゲーム状態を復元');
    }

    /**
     * 背景を設定
     */
    setupBackground() {
        const backgroundElement = document.getElementById('game-bg');

        // ブラウザ環境検出（CORS問題回避）
        const isElectron = !!(window.electronAPI || window.require) ||
                          (typeof process !== 'undefined' && process.versions && process.versions.electron);
        const isBrowser = !isElectron;

        if (isBrowser) {
            console.log('🌐 ブラウザ環境検出 - ゲーム画面背景画像を設定');
            if (backgroundElement) {
                // ブラウザ環境でも背景画像を表示
                if (this.game.gameState.isSecretMode) {
                    const secretBackgroundPath = './assets/images/secret/backgrounds/bg_secret_living.png';

                    // Gemini提案: backgroundショートハンドで一括設定（!important）
                    const backgroundStyle = `url('${secretBackgroundPath}') center / cover no-repeat fixed`;
                    backgroundElement.style.setProperty('background', backgroundStyle, 'important');

                    // 画像読み込み確認
                    const img = new Image();
                    img.onload = () => {
                        console.log('✅ 秘密ゲーム背景画像読み込み成功');
                        backgroundElement.style.setProperty('background', backgroundStyle, 'important');
                    };
                    img.onerror = () => {
                        console.error('❌ 秘密ゲーム背景画像読み込み失敗');
                        const fallbackStyle = 'linear-gradient(135deg, #2e1065 0%, #000 50%, #2e1065 100%)';
                        backgroundElement.style.setProperty('background', fallbackStyle, 'important');
                    };
                    img.src = secretBackgroundPath;

                    console.log('✅ ブラウザ版秘密モードゲーム背景画像をショートハンドで設定');
                } else {
                    // 通常モード（野球拳バトル）- bg_game_room.pngを設定
                    const sceneData = this.game.csvLoader.findData('scenes', 'scene_id', 'game');
                    let imagePath = './assets/images/backgrounds/bg_game_room.png'; // デフォルト

                    if (sceneData && sceneData.background_image) {
                        imagePath = `./assets/images/backgrounds/${sceneData.background_image}`;
                    }

                    const backgroundStyle = `url('${imagePath}') center / cover no-repeat fixed`;
                    backgroundElement.style.setProperty('background', backgroundStyle, 'important');
                    console.log(`✅ ブラウザ版通常モードゲーム背景画像をショートハンドで設定: ${imagePath}`);
                }
            } else {
                console.warn('❌ ゲーム画面の背景要素が見つかりません');
            }
            return;
        }

        // Electron環境での画像背景処理
        if (backgroundElement) {
            // 秘めた想いモードでは直接背景を指定
            if (this.game.gameState.isSecretMode) {
                const secretBackgroundPath = './assets/images/secret/backgrounds/bg_secret_living.png';

                // Gemini提案を適用: backgroundショートハンドで一括設定
                const backgroundStyle = `url('${secretBackgroundPath}') center / cover no-repeat fixed`;
                backgroundElement.style.setProperty('background', backgroundStyle, 'important');

                // 画像読み込み確認
                const img = new Image();
                img.onload = () => {
                    console.log('✅ 秘密ゲーム背景画像読み込み成功（Electron）');
                    backgroundElement.style.setProperty('background', backgroundStyle, 'important');
                };
                img.onerror = () => {
                    console.error('❌ 秘密ゲーム背景画像読み込み失敗（Electron）');
                    const fallbackStyle = 'linear-gradient(135deg, #2e1065 0%, #4b1a7d 50%, #2e1065 100%)';
                    backgroundElement.style.setProperty('background', fallbackStyle, 'important');
                };
                img.src = secretBackgroundPath;

                console.log(`✅ 秘密モードゲーム背景を強制設定: ${secretBackgroundPath}`);
            } else {
                // 通常モードの場合はCSVから読み込み
                const sceneData = this.game.csvLoader.findData('scenes', 'scene_id', 'game');

                console.log(`🎮 GameScene 通常モード背景設定:`);
                console.log(`   sceneData:`, sceneData);

                if (sceneData && sceneData.background_image) {
                    const imagePath = `./assets/images/backgrounds/${sceneData.background_image}`;
                    backgroundElement.style.backgroundImage = `url('${imagePath}')`;
                    backgroundElement.style.backgroundSize = 'cover';
                    backgroundElement.style.backgroundPosition = 'center';
                    backgroundElement.style.backgroundRepeat = 'no-repeat';
                    console.log(`✅ 通常モードゲーム背景を設定: ${imagePath}`);
                } else {
                    // フォールバック背景
                    backgroundElement.style.backgroundImage = "url('./assets/images/backgrounds/bg_living_night.png')";
                    backgroundElement.style.backgroundSize = 'cover';
                    backgroundElement.style.backgroundPosition = 'center';
                    backgroundElement.style.backgroundRepeat = 'no-repeat';
                    console.log('🎮 ゲーム画面の背景をフォールバックで設定');
                }
            }
        } else {
            console.warn('❌ ゲーム画面の背景要素が見つかりません');
        }
    }

    /**
     * 美咲の表示を設定
     */
    setupMisakiDisplay() {
        if (!this.misakiGameDisplay) return;

        // 秘めた想いモードの場合は専用の初期画像を設定
        if (this.game.gameState.isSecretMode) {
            this.updateMisakiSprite(this.playerWins || 0);
        } else {
            // 通常モード：現在のHPに基づいて衣装を設定
            const costumeLevel = this.game.costumeSystem.calculateCostumeLevel(this.misakiHP);
            const emotion = this.getEmotionByGameState();

            // 衣装システムを使用して表示を更新
            this.game.costumeSystem.updateCostumeByHP(this.misakiHP, this.misakiGameDisplay, emotion);
        }
    }

    /**
     * ゲーム状態に基づく美咲の表情を取得
     * @returns {string} 表情名
     */
    getEmotionByGameState() {
        const winRatio = this.misakiWins / Math.max(this.currentRound - 1, 1);
        
        if (this.misakiHP <= 1) return 'very_embarrassed';
        if (this.misakiHP <= 2) return 'embarrassed';
        if (winRatio > 0.7) return 'confident';
        if (winRatio > 0.4) return 'playful';
        return 'normal';
    }

    /**
     * UIを更新
     */
    updateUI() {
        // ラウンド表示
        if (this.statusElements.currentRound) {
            this.statusElements.currentRound.textContent = this.currentRound;
        }
        
        // HP表示（バー）
        this.updateHPBars();
        
        // ハート表示を更新（すでにハートが表示されている場合は表示を維持）
        const hasExistingHearts = this.statusElements.misakiHeartsContainer?.querySelector('.heart-animated.show') || 
                                 this.statusElements.playerHeartsContainer?.querySelector('.heart-animated.show');
        if (hasExistingHearts) {
            // すでにハートが表示されている場合は表示を維持
            this.updateAnimatedHearts(true); // keepVisible = true
        } else {
            // まだハートが表示されていない場合のみ通常更新
            this.updateAnimatedHearts();
        }
        
        // 勝利・敗北数表示
        if (this.statusElements.misakiDefeats) {
            this.statusElements.misakiDefeats.textContent = this.misakiWins;
        }
        if (this.statusElements.playerVictories) {
            this.statusElements.playerVictories.textContent = this.playerWins;
        }
        
        // 必殺技機能を削除
        
        // バトル結果を非表示
        if (this.battleResult) {
            this.battleResult.classList.remove('show');
        }
    }

    /**
     * HPバー表示を更新
     */
    updateHPBars() {
        // 美咲のHPバー
        if (this.statusElements.misakiHPBar && this.statusElements.misakiHPText) {
            const misakiHPPercent = (this.misakiHP / 5) * 100;
            this.statusElements.misakiHPBar.style.width = `${misakiHPPercent}%`;
            this.statusElements.misakiHPText.textContent = `${this.misakiHP}/5`;
            
            // HP低下時の色変化
            this.updateHPBarColor(this.statusElements.misakiHPBar, this.misakiHP, false);
        }
        
        // プレイヤーのHPバー
        if (this.statusElements.playerHPBar && this.statusElements.playerHPText) {
            const playerHPPercent = (this.playerHP / 5) * 100;
            this.statusElements.playerHPBar.style.width = `${playerHPPercent}%`;
            this.statusElements.playerHPText.textContent = `${this.playerHP}/5`;
            
            // HP低下時の色変化
            this.updateHPBarColor(this.statusElements.playerHPBar, this.playerHP, true);
        }
    }

    /**
     * HPバーの色を更新
     * @param {HTMLElement} hpBar - HPバー要素
     * @param {number} hp - 現在のHP
     * @param {boolean} isPlayer - プレイヤーかどうか
     */
    updateHPBarColor(hpBar, hp, isPlayer) {
        // アニメーションクラスをリセット
        hpBar.classList.remove('hp-critical');
        
        if (hp <= 2) {
            // HP危険域（赤色 + 点滅）
            if (isPlayer) {
                hpBar.style.background = 'linear-gradient(135deg, #ff4500 0%, #ff6347 100%)';
            } else {
                hpBar.style.background = 'linear-gradient(135deg, #ff4500 0%, #ff6347 100%)';
            }
            hpBar.classList.add('hp-critical');
        } else if (hp <= 3) {
            // HP注意域（オレンジ色）
            hpBar.style.background = 'linear-gradient(135deg, #ffa500 0%, #ffb347 100%)';
        } else {
            // HP正常域（元の色）
            if (isPlayer) {
                hpBar.style.background = 'linear-gradient(135deg, #7ed6c4 0%, #48a999 100%)';
            } else {
                hpBar.style.background = 'linear-gradient(135deg, #ff6b7d 0%, #ff8a9b 100%)';
            }
        }
    }

    /**
     * アニメーション付きハート表示を更新
     * @param {boolean} keepVisible - ハートを表示したままにするか
     */
    updateAnimatedHearts(keepVisible = false) {
        // 美咲のハート表示
        if (this.statusElements.misakiHeartsContainer) {
            this.updateHeartsContainer(this.statusElements.misakiHeartsContainer, this.misakiHP, false, keepVisible);
        }
        
        // プレイヤーのハート表示
        if (this.statusElements.playerHeartsContainer) {
            this.updateHeartsContainer(this.statusElements.playerHeartsContainer, this.playerHP, true, keepVisible);
        }
    }

    /**
     * ハートコンテナを更新
     * @param {HTMLElement} container - ハートコンテナ要素
     * @param {number} hp - 現在のHP
     * @param {boolean} isPlayer - プレイヤーかどうか
     * @param {boolean} keepVisible - ハートを表示したままにするか
     */
    updateHeartsContainer(container, hp, isPlayer, keepVisible = false) {
        // 既存のハートをチェック
        const existingHearts = container.querySelectorAll('.heart-animated');
        const hasVisibleHearts = container.querySelector('.heart-animated.show');
        
        // ハートが存在していて、かつkeepVisibleがtrueまたはすでに表示されている場合は更新のみ
        if (existingHearts.length === 5 && (keepVisible || hasVisibleHearts)) {
            // 既存のハートを更新（再作成せずにクラスのみ更新）
            existingHearts.forEach((heart, i) => {
                // emptyクラスの制御
                if (i >= hp) {
                    heart.classList.add('empty');
                } else {
                    heart.classList.remove('empty');
                }
                
                // pulseクラスの制御
                if (i < hp && hp <= 2) {
                    heart.classList.add('pulse');
                } else {
                    heart.classList.remove('pulse');
                }
                
                // keepVisibleの場合showクラスを確実に追加
                if (keepVisible && !heart.classList.contains('show')) {
                    heart.classList.add('show');
                }
            });
        } else {
            // ハートが存在しない場合は新規作成
            container.innerHTML = '';
            
            // 5つのハートを作成
            for (let i = 0; i < 5; i++) {
                const heart = document.createElement('div');
                heart.className = 'heart-animated';
                
                // keepVisibleがtrueの場合は最初からshowクラスを追加
                if (keepVisible) {
                    heart.classList.add('show');
                }
                
                if (isPlayer) {
                    heart.classList.add('player');
                }
                
                if (i >= hp) {
                    heart.classList.add('empty');
                }
                
                // HP低下時の特別エフェクト
                if (i < hp && hp <= 2) {
                    heart.classList.add('pulse');
                }
                
                container.appendChild(heart);
            }
        }
    }

    /**
     * ゲーム開始時のハートアニメーション
     * @returns {Promise} アニメーション完了のPromise
     */
    async playHeartsStartAnimation() {
        console.log('🎯 ハートアニメーション開始');
        
        // まず全てのハートを作成（アニメーション用）
        this.updateAnimatedHearts();
        
        // 美咲のハートアニメーション
        if (this.statusElements.misakiHeartsContainer) {
            await this.animateHeartsAppear(this.statusElements.misakiHeartsContainer, 0);
        }
        
        // 少し間を空けてプレイヤーのハートアニメーション
        await this.sleep(300);
        
        if (this.statusElements.playerHeartsContainer) {
            await this.animateHeartsAppear(this.statusElements.playerHeartsContainer, 0);
        }
        
        console.log('✨ ハートアニメーション完了');
        
        // アニメーション後もハートは表示されたままになる
    }

    /**
     * ハート出現アニメーション
     * @param {HTMLElement} container - ハートコンテナ
     * @param {number} delay - 開始遅延（ms）
     * @returns {Promise} アニメーション完了のPromise
     */
    animateHeartsAppear(container, delay = 0) {
        return new Promise((resolve) => {
            setTimeout(() => {
                const hearts = container.querySelectorAll('.heart-animated');
                let animationCount = 0;
                
                hearts.forEach((heart, index) => {
                    setTimeout(() => {
                        heart.classList.add('show');
                        
                        // 効果音（最初のハートのみ） - ClickSoundManagerと重複するため無効化
                        // if (index === 0) {
                        //     this.game.audioManager.playSE('se_click.mp3', 0.3);
                        // }
                        
                        animationCount++;
                        if (animationCount === hearts.length) {
                            resolve();
                        }
                    }, index * 100); // 100msずつずらして表示
                });
                
                // ハートが0個の場合は即座に解決
                if (hearts.length === 0) {
                    resolve();
                }
            }, delay);
        });
    }

    /**
     * HP減少時のハートアニメーション
     * @param {number} newHP - 新しいHP
     * @param {boolean} isPlayer - プレイヤーかどうか
     * @returns {Promise} アニメーション完了のPromise
     */
    async animateHeartLoss(newHP, isPlayer) {
        const container = isPlayer ? 
            this.statusElements.playerHeartsContainer : 
            this.statusElements.misakiHeartsContainer;
            
        if (!container) return;
        
        const hearts = container.querySelectorAll('.heart-animated:not(.empty)');
        
        if (hearts.length > newHP) {
            // 失うハートにブレイクアニメーション適用
            const heartToBreak = hearts[hearts.length - 1];
            if (heartToBreak) {
                heartToBreak.classList.add('broken');
                
                // 効果音
                this.game.audioManager.playSE('se_lose.mp3', 0.5);
                
                // アニメーション完了後に更新
                setTimeout(() => {
                    this.updateAnimatedHearts();
                }, 800);
            }
        }
    }

    /**
     * スリープ関数
     * @param {number} ms - 待機時間（ミリ秒）
     * @returns {Promise}
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * 導入セリフをタイプライター効果で表示（CSVから取得）
     */
    async setIntroDialogue() {
        // getDialogueText()内で自動的にモード判定されるため、常にgi001を使用
        console.log(`🔍 [DEBUG] setIntroDialogue: 秘めた想いモード=${this.game.gameState.isSecretMode}`);

        let targetText;

        // 🚀 統一ロジック：秘めた想いモードでも通常モードでもgetDialogueText()を使用
        // Nuclear optionにより秘めた想いモードでは自動的に適切なテキストが返される
        const dialogueText = this.getDialogueText('gi001');
        const fallbackText = this.game.gameState.isSecretMode
            ? 'さあ…いつもの遊びを始めようか…'
            : 'じゃ、じゃあ始めるよ？…';
        targetText = dialogueText || fallbackText;
        console.log(`🎯 [UNIFIED] モード統一処理: isSecretMode=${this.game.gameState.isSecretMode}, text="${targetText}"`);
        
        console.log('🎭 導入セリフをタイプライター効果で表示中...');
        
        // HTMLの初期テキストをクリア
        const dialogueElement = document.getElementById('game-dialogue-text');
        if (dialogueElement) {
            dialogueElement.textContent = '';
        }
        
        // タイプライター効果で表示
        await this.animateDialogueText(targetText, 60); // 少しゆっくりめに
        
        console.log('✅ 導入セリフのタイプライター効果完了:', targetText);
    }

    /**
     * ダイアログテキストを更新
     * @param {string} text - 表示するテキスト
     */

    /**
     * タイプライター効果でダイアログテキストを表示
     * @param {string} text - 表示するテキスト
     * @param {number} speed - 文字表示速度（ミリ秒）
     * @returns {Promise} - アニメーション完了のPromise
     */
    async animateDialogueText(text, speed = 50) {
        const dialogueElement = document.getElementById('game-dialogue-text');
        if (!dialogueElement) {
            console.error('❌ game-dialogue-text要素が見つかりません');
            return;
        }

        return new Promise((resolve) => {
            const fullText = `美咲：「${text}」`;
            dialogueElement.textContent = '';
            
            let currentIndex = 0;
            const textArray = Array.from(fullText);
            
            console.log(`💬 タイプライター効果開始: "${text}"`);
            
            const animateInterval = setInterval(() => {
                if (currentIndex < textArray.length) {
                    dialogueElement.textContent += textArray[currentIndex];
                    currentIndex++;
                    
                    // 文字表示音（3文字ごと、音量控えめ）
                    if (currentIndex % 3 === 0) {
                        this.game.audioManager.playSE('se_text_type.wav', 0.3);
                    }
                } else {
                    clearInterval(animateInterval);
                    console.log(`✅ タイプライター効果完了: "${text}"`);
                    resolve();
                }
            }, speed);
        });
    }

    /**
     * 従来のupdateDialogueTextを維持（互換性のため）
     * @param {string} text - 表示するテキスト
     */
    updateDialogueText(text) {
        // 新しいIDを使用
        const dialogueElement = document.getElementById('game-dialogue-text');
        if (dialogueElement) {
            const fullText = `美咲：「${text}」`;
            dialogueElement.textContent = fullText;
            dialogueElement.innerHTML = fullText; // 確実に設定
            console.log(`💬 ダイアログ更新成功: "${text}"`);
            console.log(`📝 実際のテキスト内容: "${dialogueElement.textContent}"`);
            
            // 視覚的フィードバック（テキスト変更時の軽いアニメーション）
            dialogueElement.style.opacity = '0.7';
            setTimeout(() => {
                dialogueElement.style.opacity = '1';
            }, 100);
        } else {
            console.error('❌ game-dialogue-text要素が見つかりません');
            
            // フォールバック: 古いIDも試す
            const oldDialogueElement = document.getElementById('dialogue-text');
            if (oldDialogueElement) {
                console.warn('⚠️ 古いIDで要素を発見、互換性のため更新');
                const fullText = `美咲：「${text}」`;
                oldDialogueElement.textContent = fullText;
                oldDialogueElement.innerHTML = fullText;
            }
        }
    }

    /**
     * ゲーム開始ボタンからのゲーム開始処理
     */
    async startGameFromIntro() {
        console.log('🎮 ゲーム開始ボタンが押されました');
        console.log('🔍 現在の状態チェック:', {
            isActive: this.isActive,
            canMakeChoice: this.canMakeChoice,
            isPlayingRound: this.isPlayingRound,
            currentRound: this.currentRound
        });
        
        // 重複実行防止
        if (this.isPlayingRound) {
            console.log('❌ 既にゲームが進行中です');
            return;
        }
        
        try {
            // 効果音
            this.game.audioManager.playSE('se_click.mp3', 0.8);
            
            // ゲーム開始ボタンコンテナを非表示にする
            const startButtonContainer = document.querySelector('.start-game-button-container');
            if (startButtonContainer) {
                startButtonContainer.style.display = 'none';
                console.log('✅ ゲーム開始ボタンコンテナを非表示にしました');
            } else {
                console.warn('⚠️ start-game-button-container要素が見つかりません');
            }

            // じゃんけんボタンを表示
            const handButtons = document.querySelector('.hand-buttons');
            if (handButtons) {
                handButtons.style.display = 'flex';
                console.log('✅ じゃんけんボタンを表示しました（ゲーム開始後）');
            }

            // 「最初はグー！じゃんけん...」をタイプライター効果で表示
            // getDialogueText()内で自動的にモード判定されるため、常にgs001を使用
            const startFallbackText = this.game.gameState.isSecretMode
                ? 'さあ…いつもの遊びを始めようか…'
                : '最初はグー！じゃんけん...';
            const gameStartText = this.getDialogueText('gs001') || startFallbackText;
            await this.animateDialogueText(gameStartText);
            console.log('💬 タイプライター効果で「最初はグー！じゃんけん...」を表示完了');
            
            // じゃんけんボタン待機でゲーム開始（トーク進行）
            this.waitForJanken(async () => {
                try {
                    console.log('🃏 ゲーム開始処理へ移行（ハートは既に表示済み）');
                    this.isPlayingRound = true;
                    this.canMakeChoice = false;
                    await this.startNewRound();
                } catch (error) {
                    console.error('❌ ゲーム開始処理エラー:', error);
                    this.startNewRound();
                }
            });
            
        } catch (error) {
            console.error('❌ ゲーム開始処理エラー:', error);
            // エラー時のフォールバック
            this.isPlayingRound = false;
            this.canMakeChoice = false;
            alert('ゲーム開始中にエラーが発生しました。ページを再読み込みしてください。');
        }
    }

    /**
     * 新しいラウンドを開始
     */
    async startNewRound() {
        console.log(`🎲 ラウンド ${this.currentRound} 開始`);
        console.log('🔍 ラウンド開始時の状態:', {
            isActive: this.isActive,
            canMakeChoice: this.canMakeChoice,
            isPlayingRound: this.isPlayingRound,
            playerHP: this.playerHP,
            misakiHP: this.misakiHP
        });
        
        try {
            this.isPlayingRound = true;
            this.canMakeChoice = false;
            this.playerHand = null;
            this.misakiHand = null;
            
            console.log('🎭 ラウンド開始演出を実行中...');
            
            // ラウンド開始演出
            await this.playRoundStartAnimation();
            
            console.log('✅ ラウンド開始演出完了');
            
            // ラウンド1は特別処理、ラウンド2以降は通常のラウンド開始メッセージ
            if (this.currentRound === 1) {
                // ラウンド1は何も表示しない（既にイントロで表示済み）
                console.log('🎯 ラウンド1：ラウンド開始メッセージをスキップ');
            } else {
                // ラウンド2以降のみラウンド開始メッセージを表示
                const roundMessage = this.getRoundStartMessage();
                await this.animateDialogueText(roundMessage, 50);
            }
            
            // UIを更新（ハートは表示を維持）
            this.updateUI();
            
            // ラウンド1は直接じゃんけん選択可能にする（ラウンド2以降はprepareSimpleNextRound()で処理）
            this.clearJankenWait();
            this.canMakeChoice = true;
            this.isPlayingRound = false; // 選択可能にする
            console.log(`✅ プレイヤーの選択が可能になりました（ラウンド${this.currentRound}）`);
            console.log(`🎯 最終状態: canMakeChoice=${this.canMakeChoice}, isPlayingRound=${this.isPlayingRound}, isWaitingForJanken=${this.isWaitingForJanken}`);
            
            // プレイヤーに視覚的なフィードバックを提供
            const buttons = document.querySelectorAll('.hand-btn');
            buttons.forEach(btn => {
                btn.style.opacity = '1';
                btn.style.pointerEvents = 'auto';
            });
            console.log(`🔘 じゃんけんボタンを有効化しました（ラウンド${this.currentRound}）`);
            
        } catch (error) {
            console.error('❌ ラウンド開始エラー:', error);
            // エラー時のフォールバック
            this.isPlayingRound = false;
            this.canMakeChoice = true;
            alert('ラウンド開始中にエラーが発生しました。続行を試します。');
        }
    }

    /**
     * ラウンド開始メッセージを取得
     * @returns {string} メッセージ
     */
    getRoundStartMessage() {
        // CSVからラウンドごとのトークを取得
        const roundKey = `round_${this.currentRound}`;

        console.log(`🔍 ラウンド開始トーク検索: scene_type=round_start, trigger_condition=${roundKey}`);

        // CSVローダーが存在することを確認
        if (!this.game.csvLoader) {
            console.error('❌ CSVローダーが存在しません');
            return 'CSVローダーエラー';
        }

        // dialoguesテーブルの現在状態をデバッグ
        const allDialogues = this.game.csvLoader.getTableData('dialogues');
        const firstDialogue = allDialogues.length > 0 ? allDialogues[0] : {dialogue_id: 'データなし'};
        console.log(`[デバッグ] getRoundStartMessage: 現在のdialoguesテーブルの最初のID: ${firstDialogue.dialogue_id}`);
        console.log(`[デバッグ] getRoundStartMessage: 現在のCSVLoaderのisSecretMode: ${this.game.csvLoader.isSecretMode}`);

        // round_start系のデータのみ抽出してデバッグ表示
        const allRoundStart = allDialogues.filter(d => d.scene_type === 'round_start');
        console.log(`🎭 round_start系データ数: ${allRoundStart.length}`);
        allRoundStart.forEach(d => {
            console.log(`  - ${d.dialogue_id}: ${d.trigger_condition} → "${d.text}"`);
        });
        
        const roundMessages = this.getDialoguesByType('round_start', roundKey);
        console.log(`🎯 取得されたラウンド開始トーク数: ${roundMessages.length}`);
        
        if (roundMessages.length > 0) {
            // CSVにラウンド用のトークがある場合はそれを使用
            const selectedMessage = roundMessages[0].text;
            console.log(`✅ CSVからラウンド開始トーク取得: "${selectedMessage}"`);
            return selectedMessage;
        }
        
        // フォールバック（CSVのnr001を使用）
        const nr001Text = this.getDialogueText('nr001');
        if (nr001Text) {
            console.log(`✅ CSV nr001をフォールバックで使用: "${nr001Text}"`);
            return nr001Text;
        }
        
        // それも失敗した場合の最終フォールバック
        const finalFallback = '最初はグー！じゃんけん...';
        console.log(`⚠️ 最終フォールバック使用: "${finalFallback}"`);
        return finalFallback;
    }

    /**
     * ラウンド前メッセージを取得（次ラウンド開始前のトーク）
     * @returns {string} メッセージ
     */
    getPreRoundMessage() {
        // CSVからラウンド前トークを取得
        const roundKey = `round_${this.currentRound}`;
        
        console.log(`🔍 ラウンド前トーク検索: scene_type=pre_round, trigger_condition=${roundKey}`);
        
        // CSVローダーが存在することを確認
        if (!this.game.csvLoader) {
            console.error('❌ CSVローダーが存在しません');
            return 'CSVローダーエラー';
        }
        
        const preRoundMessages = this.getDialoguesByType('pre_round', roundKey);
        console.log(`🎯 取得されたラウンド前トーク数: ${preRoundMessages.length}`);
        
        if (preRoundMessages.length > 0) {
            const selectedMessage = preRoundMessages[0].text;
            console.log(`✅ CSVからラウンド前トーク取得: "${selectedMessage}"`);
            return selectedMessage;
        }
        
        // フォールバック（CSVにない場合）
        const fallbackMessages = {
            2: 'さ、さあ次のラウンドよ！',
            3: 'まだまだ勝負はこれからよ！',
            4: 'よ、よーし次こそは…！',
            5: '半分まで来たわね…',
            6: 'そ、そろそろ本気出さなきゃ…',
            7: 'あと少しで決着ね…',
            8: 'も、もうすぐ終わりかも…',
            9: 'い、いよいよ最終ラウンド…！'
        };
        
        const fallbackMessage = fallbackMessages[this.currentRound] || 'さあ次のラウンドよ！';
        console.log(`⚠️ フォールバックラウンド前トーク使用: "${fallbackMessage}"`);
        return fallbackMessage;
    }

    /**
     * 中間メッセージを取得（ラウンド開始後のトーク）
     * @returns {string} メッセージ
     */
    getIntermediateMessage() {
        // CSVから中間トークを取得
        const roundKey = `round_${this.currentRound}`;
        
        console.log(`🔍 中間トーク検索: scene_type=intermediate_talk, trigger_condition=${roundKey}`);
        
        // CSVローダーが存在することを確認
        if (!this.game.csvLoader) {
            console.error('❌ CSVローダーが存在しません');
            return 'CSVローダーエラー';
        }
        
        // 全ダイアログデータをデバッグ表示
        const allDialogues = this.game.csvLoader.getTableData('dialogues');
        console.log(`📋 全ダイアログ数: ${allDialogues.length}`);
        
        // CSVの先頭データを確認
        console.log('📋 CSV先頭5件のデータ:');
        allDialogues.slice(0, 5).forEach((d, i) => {
            console.log(`  ${i}: ${d.dialogue_id} | ${d.scene_type} | ${d.trigger_condition} | "${d.text}"`);
        });
        
        // intermediate_talk系のデータのみ抽出してデバッグ表示
        const allIntermediate = allDialogues.filter(d => d.scene_type === 'intermediate_talk');
        console.log(`🎭 intermediate_talk系データ数: ${allIntermediate.length}`);
        allIntermediate.forEach(d => {
            console.log(`  - ${d.dialogue_id}: ${d.trigger_condition} → "${d.text}"`);
        });
        
        // CSVの最後の5件も確認
        console.log('📋 CSV最後5件のデータ:');
        const lastItems = allDialogues.slice(-5);
        lastItems.forEach((d, i) => {
            console.log(`  ${lastItems.length - 5 + i}: ${d.dialogue_id} | ${d.scene_type} | ${d.trigger_condition} | "${d.text}"`);
        });
        
        const intermediateMessages = this.getDialoguesByType('intermediate_talk', roundKey);
        console.log(`🎯 取得された中間トーク数: ${intermediateMessages.length}`);
        
        // getDialoguesByTypeの動作確認のため、手動でフィルタリングしてみる
        console.log('🔍 手動フィルタリングテスト:');
        const manualFiltered = allDialogues.filter(dialogue => {
            console.log(`  チェック中: ${dialogue.dialogue_id} | scene_type="${dialogue.scene_type}" | trigger="${dialogue.trigger_condition}"`);
            return dialogue.scene_type === 'intermediate_talk' && dialogue.trigger_condition === roundKey;
        });
        console.log(`🔍 手動フィルタリング結果: ${manualFiltered.length}件`);
        manualFiltered.forEach(d => {
            console.log(`  → ${d.dialogue_id}: "${d.text}"`);
        });
        
        if (intermediateMessages.length > 0) {
            const selectedMessage = intermediateMessages[0].text;
            console.log(`✅ CSVから中間トーク取得: "${selectedMessage}"`);
            return selectedMessage;
        }
        
        // 手動フィルタリングの結果を使用
        if (manualFiltered.length > 0) {
            const selectedMessage = manualFiltered[0].text;
            console.log(`✅ 手動フィルタリングから中間トーク取得: "${selectedMessage}"`);
            return selectedMessage;
        }
        
        // フォールバック：ラウンド別のデフォルトメッセージ
        const fallbackMessages = {
            'round_2': 'じゃあ次いくよ？',
            'round_3': '準備はいい？',
            'round_4': '本気でいくよー！',
            'round_5': 'い、いくよ…！',
            'round_6': 'え、えーと…始めるね…',
            'round_7': 'そ、そろそろ本気出さなきゃ…',
            'round_8': 'が、頑張らなきゃ…！',
            'round_9': '油断しちゃダメだよ？'
        };
        
        const fallbackMessage = fallbackMessages[roundKey];
        if (fallbackMessage) {
            console.log(`⚠️ フォールバックメッセージ使用: "${fallbackMessage}"`);
            return fallbackMessage;
        }
        
        // CSVに登録されていない場合は中間トークを表示しない
        console.log(`⚠️ CSVに中間トークが見つからないためスキップ: round_${this.currentRound}`);
        return '';
    }


    /**
     * 美咲のリアクションメッセージを取得（CSVから）
     * @param {string} result - ラウンド結果
     * @returns {string} リアクションメッセージ
     */
    getMisakiReaction(result) {
        if (result === 'draw') {
            // あいこの状況に応じた詳細なトークを選択
            let reactionType = '';
            if (this.consecutiveDraws >= 3) {
                reactionType = 'draw_consecutive';
            } else if (this.playerHP <= 2 || this.misakiHP <= 2) {
                reactionType = 'draw_tension'; // 緊迫状況でのあいこ
            } else {
                reactionType = 'draw_normal';
            }
            
            // 拡張あいこメッセージを取得
            const drawMessages = this.getDialoguesByType('draw_enhanced', reactionType);
            if (drawMessages.length > 0) {
                const randomMessage = drawMessages[Math.floor(Math.random() * drawMessages.length)];
                return randomMessage.text;
            }
        }
        
        // プレイヤー勝利時は空文字を返す（victory_spriteメッセージのみ表示）
        if (result === 'playerWin') {
            console.log('🏆 プレイヤー勝利時のreactionトーク: スキップ（victory_spriteメッセージのみ表示）');
            return '';
        } else if (result === 'misakiWin') {
            // 🚨 修正：美咲の勝利回数に応じて順番にメッセージを表示
            console.log(`🔍 美咲勝利回数: ${this.misakiWins}`);
            
            // CSVローダーの状況チェック
            if (!this.game.csvLoader) {
                console.error('❌ CSVローダーが存在しません - フォールバックメッセージを使用');
                const fallbackMessages = [
                    'やったぁ！勝った！',
                    'あれ、負けちゃった…次は頑張る！',
                    'うー、またやられた…',
                    'もう、負けないもん！',
                    'くっ…まだまだ！'
                ];
                const fallbackIndex = Math.max(0, Math.min(this.misakiWins - 1, fallbackMessages.length - 1));
                return fallbackMessages[fallbackIndex];
            }
            
            // CSVの美咲勝利メッセージから順番に取得
            const misakiWinMessages = this.getDialoguesByType('reaction', 'misaki_win_hp_high');
            console.log(`🔍 取得した美咲勝利メッセージ数: ${misakiWinMessages.length}`);
            
            if (misakiWinMessages && misakiWinMessages.length > 0) {
                // dialogue_id順にソート（mr010, mr011, mr012, mr013...の順番を保証）
                misakiWinMessages.sort((a, b) => a.dialogue_id.localeCompare(b.dialogue_id));
                
                console.log(`🔍 ソート後の美咲勝利メッセージ順序:`);
                misakiWinMessages.forEach((msg, index) => {
                    console.log(`  ${index}: ${msg.dialogue_id} = "${msg.text}"`);
                });
                
                // 美咲勝利メッセージを順番に表示（mr010 → mr011 → mr012 → mr013...の循環）
                const messageIndex = this.misakiWinMessageIndex % misakiWinMessages.length;
                const selectedMessage = misakiWinMessages[messageIndex];
                
                console.log(`🏆 美咲勝利メッセージ順番表示: インデックス${this.misakiWinMessageIndex} → ${selectedMessage.dialogue_id} = "${selectedMessage.text}"`);
                
                // 次回用にインデックスを更新
                this.misakiWinMessageIndex = (this.misakiWinMessageIndex + 1) % misakiWinMessages.length;
                
                return selectedMessage.text;
            }
            
            console.warn(`⚠️ 美咲勝利メッセージが見つからない - フォールバック使用`);
            
            // 最終フォールバック：勝利回数に応じたメッセージ
            const finalFallbackMessages = [
                'やったぁ！勝った！',
                'えへへ、また勝っちゃった♪',
                'うふふ、調子がいいみたい！',
                'あ、あんまり勝っちゃダメかな…？',
                'ご、ごめんね…でも嬉しい！'
            ];
            const finalIndex = this.misakiWinMessageIndex % finalFallbackMessages.length;
            const finalMessage = finalFallbackMessages[finalIndex];
            console.log(`🔄 最終フォールバック美咲勝利メッセージ: インデックス${this.misakiWinMessageIndex} → "${finalMessage}"`);
            
            // インデックス更新
            this.misakiWinMessageIndex = (this.misakiWinMessageIndex + 1) % finalFallbackMessages.length;
            
            return finalMessage;
        } else {
            // CSVのdrawメッセージから順番に取得
            const drawMessages = this.getDialoguesByType('reaction', 'draw');
            console.log(`🔍 取得したdrawメッセージ数: ${drawMessages.length}`);
            
            if (drawMessages.length > 0) {
                // dialogue_id順にソート（mr019, mr020, mr021, mr022の順番を保証）
                drawMessages.sort((a, b) => a.dialogue_id.localeCompare(b.dialogue_id));
                
                console.log(`🔍 ソート後のdrawメッセージ順序:`);
                drawMessages.forEach((msg, index) => {
                    console.log(`  ${index}: ${msg.dialogue_id} = "${msg.text}"`);
                });
                
                // あいこメッセージを順番に表示（mr019 → mr020 → mr021 → mr022 → mr019...の循環）
                const messageIndex = this.drawMessageIndex % drawMessages.length;
                const selectedMessage = drawMessages[messageIndex];
                
                console.log(`🔄 あいこメッセージ順番表示: インデックス${this.drawMessageIndex} → ${selectedMessage.dialogue_id} = "${selectedMessage.text}"`);
                
                // 次回用にインデックスを更新
                this.drawMessageIndex = (this.drawMessageIndex + 1) % drawMessages.length;
                
                return selectedMessage.text;
            }
            // 最終フォールバック
            return 'あ、あいこね…';
        }
    }


    /**
     * 勝利時の立ち絵変更後メッセージを取得
     * @param {number} winCount - 勝利回数
     * @returns {string|null} メッセージ
     */
    getVictorySpriteMessage(winCount) {
        if (!this.game.csvLoader) {
            console.warn('⚠️ CSVローダーがありません');
            return null;
        }
        
        const conditionKey = `player_win_count_${winCount}`;
        console.log(`🔍 勝利メッセージ検索: scene_type=victory_sprite, trigger_condition=${conditionKey}`);
        
        // デバッグ用：全dialoguesデータを確認
        const allDialogues = this.game.csvLoader.getTableData('dialogues');
        console.log(`📋 全ダイアログ数: ${allDialogues.length}`);
        
        // victory_sprite系のデータを抽出してデバッグ表示
        const allVictorySprite = allDialogues.filter(d => d.scene_type === 'victory_sprite');
        console.log(`🏆 victory_sprite系データ数: ${allVictorySprite.length}`);
        allVictorySprite.forEach(d => {
            console.log(`  - ${d.dialogue_id}: ${d.trigger_condition} → "${d.text}"`);
        });
        
        const victoryMessages = this.getDialoguesByType('victory_sprite', conditionKey);
        console.log(`🔍 見つかった勝利メッセージ数: ${victoryMessages.length}`);
        
        // デバッグ：検索結果の詳細表示
        if (victoryMessages.length === 0) {
            console.log(`🔍 検索条件の詳細確認:`);
            console.log(`  - scene_type: "victory_sprite"`);
            console.log(`  - trigger_condition: "${conditionKey}"`);
            
            // 類似データを検索して表示
            const similarData = allDialogues.filter(d => 
                d.scene_type && d.scene_type.includes('victory') ||
                d.trigger_condition && d.trigger_condition.includes('player_win')
            );
            console.log(`🔍 類似データ (${similarData.length}件):`);
            similarData.forEach(d => {
                console.log(`  - ${d.dialogue_id}: scene="${d.scene_type}", trigger="${d.trigger_condition}"`);
            });
        }
        
        if (victoryMessages.length > 0) {
            const randomMessage = victoryMessages[Math.floor(Math.random() * victoryMessages.length)];
            console.log(`✅ 勝利メッセージ選択: ${randomMessage.dialogue_id} = "${randomMessage.text}"`);
            return randomMessage.text;
        }
        
        console.warn(`⚠️ 勝利メッセージが見つかりません: ${conditionKey}`);
        return null;
    }
    
    /**
     * フォールバック勝利メッセージを取得
     * @param {number} winCount - 勝利回数
     * @returns {string} フォールバックメッセージ
     */
    getFallbackVictoryMessage(winCount) {
        const fallbackMessages = {
            1: 'あ、負けちゃった…でも、まだまだ！',
            2: 'う、うー…次は絶対勝つもん！',
            3: 'も、もう…こんなの想定外だよ…',
            4: 'や、やばい…本気でまずいかも…',
            5: 'そ、そんな…完全に負けちゃった…'
        };
        
        const message = fallbackMessages[winCount] || fallbackMessages[1];
        console.log(`🔄 フォールバック勝利メッセージ使用: ${winCount}勝 → "${message}"`);
        return message;
    }

    /**
     * 立ち絵変更後メッセージ表示後の自動進行処理
     */
    waitForJankenVictoryMessage() {
        console.log('🏆 waitForJankenVictoryMessage() 開始：進めるボタン待機');
        
        // 🚨 強制修正：進めるボタンクリック待機に変更
        this.waitForJanken(async () => {
            console.log('🏆 victory_spriteメッセージ後の進めるボタンクリック');
            
            // intermediate_talkを表示（ラウンド2以降のみ）
            if (this.currentRound >= 2) {
                console.log('🔄 victory_sprite後にintermediate_talkを表示');
                const intermediateMessage = this.getIntermediateMessage();
                
                if (intermediateMessage && intermediateMessage.trim() !== '') {
                    await this.animateDialogueText(intermediateMessage, 50);
                    
                    // intermediate_talk表示後も進めるボタンで待機
                    this.waitForJanken(async () => {
                        console.log('🔄 intermediate_talk後の進めるボタンクリック');
                        await this.handleNextRoundDialogue();
                    });
                } else {
                    console.log('🔄 intermediate_talkが空のため直接次のラウンドへ');
                    await this.handleNextRoundDialogue();
                }
            } else {
                // ラウンド1の場合は直接次のラウンドへ
                await this.handleNextRoundDialogue();
            }
        });
    }

    /**
     * ラウンド開始アニメーション
     * @returns {Promise} アニメーション完了のPromise
     */
    playRoundStartAnimation() {
        return new Promise((resolve) => {
            if (this.misakiGameDisplay) {
                this.misakiGameDisplay.classList.add('bounce');
                setTimeout(() => {
                    this.misakiGameDisplay.classList.remove('bounce');
                    resolve();
                }, 1000);
            } else {
                resolve();
            }
        });
    }

    /**
     * プレイヤーの選択処理
     * @param {string} hand - 選択した手 (rock, scissors, paper)
     * @param {Event} event - クリックイベント
     */
    async makeChoice(hand, event = null) {
        console.log(`🎯 プレイヤーが${hand}を選択しようとしています`);
        console.log(`🔍 現在の状態: canMakeChoice=${this.canMakeChoice}, isPlayingRound=${this.isPlayingRound}, isWaitingForJanken=${this.isWaitingForJanken}`);
        
        // 🚨 緊急修正: ゲームが進行中なら強制的にじゃんけん処理を実行
        if (this.currentRound >= 1 && this.currentRound <= this.maxRounds && 
            this.playerHP > 0 && this.misakiHP > 0 && !this.isPlayingRound) {
            
            console.log('🚨 【強制実行】ゲーム進行中につき、じゃんけん処理を強制実行します');
            console.log(`🎯 ラウンド${this.currentRound}、HP - プレイヤー:${this.playerHP}, 美咲:${this.misakiHP}`);
            
            // 状態を強制的に修正
            this.canMakeChoice = true;
            this.isPlayingRound = false;
            this.clearJankenWait();
            
            console.log('✅ 状態を強制修正しました - じゃんけん実行開始');
            await this.executeJankenChoice(hand);
            return;
        }
        
        // 通常のじゃんけん選択処理
        if (this.canMakeChoice && !this.isPlayingRound) {
            console.log('🎲 【通常】じゃんけん選択を実行します');
            this.clearJankenWait();
            await this.executeJankenChoice(hand);
            return;
        }
        
        console.log(`🔍 じゃんけん選択条件チェック失敗: canMakeChoice=${this.canMakeChoice}, isPlayingRound=${this.isPlayingRound}`);
        
        // 進めるボタンモードの処理
        const clickedButton = event ? event.target.closest('.hand-btn') : null;
        if (clickedButton && clickedButton.classList.contains('advance-btn')) {
            console.log('▶️ 🔴 進めるボタンが押されました！');
            console.log('🔍 現在の状態:', {
                isWaitingForJanken: this.isWaitingForJanken,
                canMakeChoice: this.canMakeChoice,
                isPlayingRound: this.isPlayingRound,
                currentRound: this.currentRound
            });
            if (this.onJankenAdvance()) {
                console.log('✅ 🚀 トーク進行処理完了');
                return;
            } else {
                console.warn('⚠️ onJankenAdvance()がfalseを返しました');
            }
        }
        
        // トーク進行処理（じゃんけん不可能時のみ）
        if (this.isWaitingForJanken && (!this.canMakeChoice || this.isPlayingRound)) {
            console.log('🎭 トーク進行処理を実行します');
            if (this.onJankenAdvance()) {
                console.log('✅ トーク進行処理完了');
                return;
            }
        }
        
        console.log('❌ どの処理も実行されませんでした - デバッグ情報:');
        console.log(`❌ currentRound=${this.currentRound}, playerHP=${this.playerHP}, misakiHP=${this.misakiHP}`);
        console.log(`❌ canMakeChoice=${this.canMakeChoice}, isPlayingRound=${this.isPlayingRound}, isWaitingForJanken=${this.isWaitingForJanken}`);
    }

    /**
     * じゃんけん選択の実際の処理を実行
     * @param {string} hand - 選択した手
     */
    async executeJankenChoice(hand) {
        console.log(`✅ プレイヤーの選択を受理: ${hand}`);
        
        this.playerHand = hand;
        this.canMakeChoice = false;
        this.isPlayingRound = true; // 処理中にする
        
        // じゃんけんボタンを無効化（アニメーション中は操作不可）
        this.disableJankenButtons();
        
        // 効果音
        this.game.audioManager.playSE('se_click.mp3', 0.8);
        
        // 美咲が「ぽん！」と言う
        const ponText = this.getDialogueText('jp001') || 'ぽん！';
        await this.animateDialogueText(ponText, 100); // 短めに設定
        
        // 美咲の手を決定
        this.misakiHand = this.decideMisakiHand();
        console.log(`🤖 美咲の手: ${this.misakiHand}`);
        
        // 少し待ってからじゃんけんアニメーション（自動進行に戻す）
        setTimeout(async () => {
            console.log('🎲 結果処理を開始');
            await this.processRoundResult();
        }, 800);
    }

    /**
     * 美咲の手を決定（AI処理）
     * @returns {string} 美咲の手
     */
    decideMisakiHand() {
        // プレイヤーの手が選択されていることを前提
        if (!this.playerHand) {
            // プレイヤーの手がない場合はランダム
            const hands = ['rock', 'scissors', 'paper'];
            return hands[Math.floor(Math.random() * hands.length)];
        }
        
        // 勝率制御: 美咲勝ち20%、あいこ20%、プレイヤー勝ち60%
        const random = Math.random();
        
        if (random < 0.2) {
            // 美咲勝ち (20%) - プレイヤーに勝つ手を出す
            const winningHands = {
                'rock': 'paper',
                'scissors': 'rock', 
                'paper': 'scissors'
            };
            console.log(`🎲 美咲勝ち制御 (${(random * 100).toFixed(1)}%): ${this.playerHand} → ${winningHands[this.playerHand]}`);
            return winningHands[this.playerHand];
        } else if (random < 0.4) {
            // あいこ (20%) - プレイヤーと同じ手を出す
            console.log(`🎲 あいこ制御 (${(random * 100).toFixed(1)}%): ${this.playerHand} → ${this.playerHand}`);
            return this.playerHand;
        } else {
            // プレイヤー勝ち (60%) - プレイヤーに負ける手を出す
            const losingHands = {
                'rock': 'scissors',
                'scissors': 'paper',
                'paper': 'rock'
            };
            console.log(`🎲 プレイヤー勝ち制御 (${(random * 100).toFixed(1)}%): ${this.playerHand} → ${losingHands[this.playerHand]}`);
            return losingHands[this.playerHand];
        }
    }

    /**
     * ラウンド結果を処理
     */
    async processRoundResult() {
        // 勝敗判定
        const result = this.determineWinner(this.playerHand, this.misakiHand);
        
        // 前回のラウンド結果をクリア（新しい結果で上書きする前に）
        console.log(`🧹 前回のラウンド結果をクリア: "${this.lastRoundResult}" → 新しい結果: "${result}"`);
        
        // 現在のラウンド結果を保存（次のラウンドで使用）
        this.lastRoundResult = String(result).trim();
        console.log(`💾 ✅ 現在のラウンド結果を保存: "${this.lastRoundResult}" (タイプ: ${typeof this.lastRoundResult}, 長さ: ${this.lastRoundResult.length})`);
        console.log(`🔍 詳細チェック: result=${result}, あいこ判定=${this.lastRoundResult === 'draw'}`);
        
        // 結果アニメーション
        await this.playResultAnimation(result);
        
        // HP更新
        this.updateHPByResult(result);
        
        // UI更新
        this.updateUI();
        
        // 衣装変更
        if (result === 'misakiLose') {
            await this.game.costumeSystem.updateCostumeByHP(this.misakiHP, this.misakiGameDisplay);
        }
        
        // ゲーム終了判定（5勝した場合はここで処理終了）
        if (this.playerWins >= 5 || this.misakiWins >= 5) {
            console.log('🏆 5勝達成によりゲーム終了処理へ');
            this.checkGameEnd();
            return;
        }
        
        // 次のラウンドは既にplayResultAnimationでクリック待機が設定されているため、ここでは何もしない
    }

    /**
     * 勝敗判定
     * @param {string} playerHand - プレイヤーの手
     * @param {string} misakiHand - 美咲の手
     * @returns {string} 結果 (playerWin, misakiWin, draw)
     */
    determineWinner(playerHand, misakiHand) {
        if (playerHand === misakiHand) {
            return 'draw';
        }
        
        const winConditions = {
            'rock': 'scissors',
            'scissors': 'paper',
            'paper': 'rock'
        };
        
        if (winConditions[playerHand] === misakiHand) {
            return 'playerWin';
        } else {
            return 'misakiWin';
        }
    }

    /**
     * 結果に基づいてHPを更新
     * @param {string} result - 勝敗結果
     */
    updateHPByResult(result) {
        if (result === 'playerWin') {
            const oldMisakiHP = this.misakiHP;
            this.misakiHP = Math.max(0, this.misakiHP - 1);
            this.playerWins++;
            this.consecutiveDraws = 0; // あいこカウントリセット
            
            // 🎨 プレイヤー勝利時に美咲の立ち絵を更新
            this.updateMisakiSprite(this.playerWins);
            
            // 🎉 ギャラリーに立ち絵を追加
            // Stage1はバトル開始時に解放済み、Stage2～6は1～5勝で解放
            const currentStage = this.playerWins + 1; // 1勝でStage2、2勝でStage3...
            const imageName = `misaki_game_stage${currentStage}.png`;
            
            // Stage 1は既にバトル開始時に解放済みなので、Stage 2～6のみ処理
            if (currentStage >= 2 && currentStage <= 6) {
                const isNewUnlock = this.game.saveSystem.unlockGalleryImage(imageName, currentStage);
                
                if (isNewUnlock) {
                    console.log(`✨ ギャラリーに新しい立ち絵が追加されました: Stage ${currentStage}`);
                    // オプション: 解放通知を表示
                    this.showGalleryUnlockNotification(currentStage);
                }
            }
            
            // ハート減少アニメーション
            if (oldMisakiHP > this.misakiHP) {
                this.animateHeartLoss(this.misakiHP, false);
            }
            
            // 🚨 修正：立ち絵変更後の処理を無効化（playResultAnimationで統一処理）
            console.log('🏆 立ち絵変更後の処理をスキップ：playResultAnimationで統一処理');
            
        } else if (result === 'misakiWin') {
            const oldPlayerHP = this.playerHP;
            this.playerHP = Math.max(0, this.playerHP - 1);
            this.misakiWins++;
            this.consecutiveDraws = 0; // あいこカウントリセット
            
            // ハート減少アニメーション
            if (oldPlayerHP > this.playerHP) {
                this.animateHeartLoss(this.playerHP, true);
            }
        } else if (result === 'draw') {
            this.consecutiveDraws++; // あいこカウント増加
        }
    }

    /**
     * 結果アニメーション
     * @param {string} result - 勝敗結果
     * @returns {Promise} アニメーション完了のPromise
     */
    async playResultAnimation(result) {
        // 新しいじゃんけんアニメーションを表示
        await this.playJankenHandAnimation(result);
        
        // 従来の結果表示も併用（バックアップ）
        this.showBattleResult(result);
        
        // 5勝チェックはprocessRoundResultで実行済みのため、ここでは削除
        // checkGameEnd()で既に処理されているはず
        
        // 🚨 修正：playerWinの場合はvictory_sprite処理で統一、それ以外はreactionトーク処理
        if (result !== 'playerWin') {
            // 美咲のリアクションセリフをタイプライター効果で表示（進めるボタン待機）
            setTimeout(async () => {
                const reactionMessage = this.getMisakiReaction(result);
                await this.animateDialogueText(reactionMessage, 45);
                
                // リアクション表示完了後、進めるボタンで待機
                console.log('🎯 reactionトーク表示完了：進めるボタン待機開始');
                
                // 新しいフロー：まず即座にラウンド準備処理を実行
                console.log('🎯 ラウンド準備処理を開始');
                this.prepareNextRoundImmediate();
                
                // その後、進めるボタン待機を設定（misakiWinとdrawの場合）
                this.waitForJanken(async () => {
                    console.log('🎯 reactionトーク後の進めるボタンクリック');
                    
                    // 🚨 修正：あいこの場合はintermediate_talkをスキップ
                    if (result === 'draw') {
                        console.log('🔄 あいこのためintermediate_talkをスキップして直接次ラウンド処理');
                        await this.handleNextRoundDialogue();
                    } else {
                        // misakiWinの場合は従来通りintermediate_talkを表示（ラウンド2以降）
                        if (this.currentRound >= 2) {
                            console.log('🔄 reactionトーク後にintermediate_talkを表示');
                            const intermediateMessage = this.getIntermediateMessage();

                            if (intermediateMessage && intermediateMessage.trim() !== '') {
                                await this.animateDialogueText(intermediateMessage, 50);

                                // intermediate_talk表示後も進めるボタンで待機
                                this.waitForJanken(async () => {
                                    console.log('🔄 intermediate_talk後の進めるボタンクリック');
                                    await this.handleNextRoundDialogue();
                                });
                            } else {
                                console.log('🔄 intermediate_talkが空のため直接次のラウンドへ');
                                await this.handleNextRoundDialogue();
                            }
                        } else {
                            // ラウンド1の場合は直接次のラウンドへ
                            await this.handleNextRoundDialogue();
                        }
                    }
                });
            }, 3000); // じゃんけんアニメーション完了3秒後
        } else {
            // playerWinの場合は、victory_sprite処理に任せる（二重処理防止）
            console.log('🏆 playerWinのためreactionトーク処理をスキップ：victory_sprite処理で統一');
            
            // ラウンド準備は実行する
            this.prepareNextRoundImmediate();
            
            // 🚨 修正：5勝達成時は通常のvictory_sprite処理を行う（ゆっくり表示）
            
            // 🚨 修正：playerWinの場合もreactionトークを表示してから進めるボタン待機
            setTimeout(async () => {
                // victory_spriteメッセージが表示される前にreactionトークを表示
                const reactionMessage = this.getMisakiReaction(result);
                
                // reactionメッセージが空の場合はスキップして直接victory_spriteを表示
                if (reactionMessage && reactionMessage.trim() !== '') {
                    await this.animateDialogueText(reactionMessage, 45);
                    console.log('🏆 playerWin時のreactionトーク表示完了');
                    
                    // reactionトーク後、進めるボタン待機を設定
                    this.waitForJanken(async () => {
                        console.log('🏆 playerWin reactionトーク後の進めるボタンクリック');
                        await this.showVictorySpriteMessage();
                    });
                } else {
                    console.log('🏆 reactionトークが空のため、直接victory_spriteメッセージを表示');
                    // reactionトークがない場合は直接victory_spriteメッセージを表示
                    await this.showVictorySpriteMessage();
                }
            }, 3000); // じゃんけんアニメーション完了3秒後
        }
    }

    /**
     * victory_spriteメッセージを表示
     */
    async showVictorySpriteMessage() {
        
        // victory_spriteメッセージを表示（プレイヤーが勝った場合のみ、勝利回数に関係なく）
        if (this.playerWins >= 1) {
            const victoryMessage = this.getVictorySpriteMessage(this.playerWins);
            if (victoryMessage && victoryMessage.trim() !== '') {
                console.log(`🏆 victory_spriteメッセージ表示: "${victoryMessage}"`);
                // 5勝時はよりゆっくり表示
                const animationSpeed = this.playerWins >= 5 ? 50 : 30;
                await this.animateDialogueText(victoryMessage, animationSpeed);
                
                // 🚨 修正：5勝達成時は進むボタンでエンディングトークに遷移
                if (this.playerWins >= 5) {
                    console.log('🏆 5勝達成：進むボタンでエンディングトークへ遷移');
                    this.waitForJanken(async () => {
                        console.log('🏆 5勝達成後の進むボタンクリック - エンディングトークへ遷移');
                        
                        // ゲーム状態をクリア
                        this.isPlayingRound = false;
                        this.canMakeChoice = false;
                        
                        // ゲームシーンを隠す
                        this.hide();
                        
                        // エンディングトークに遷移
                        this.game.showDialogue('victory');
                    });
                    return; // 通常の次ラウンド処理をスキップ
                }
                
                // victory_sprite後も進めるボタンで待機
                this.waitForJanken(async () => {
                    console.log('🏆 victory_sprite後の進めるボタンクリック');
                    
                    // intermediate_talkを表示（ラウンド2以降のみ）
                    if (this.currentRound >= 2) {
                        const intermediateMessage = this.getIntermediateMessage();
                        
                        if (intermediateMessage && intermediateMessage.trim() !== '') {
                            await this.animateDialogueText(intermediateMessage, 50);
                            
                            // intermediate_talk表示後も進めるボタンで待機
                            this.waitForJanken(async () => {
                                console.log('🔄 intermediate_talk後の進めるボタンクリック');
                                await this.handleNextRoundDialogue();
                            });
                        } else {
                            console.log('🔄 intermediate_talkが空のため直接次のラウンドへ');
                            await this.handleNextRoundDialogue();
                        }
                    } else {
                        // ラウンド1の場合は直接次のラウンドへ
                        await this.handleNextRoundDialogue();
                    }
                });
            } else {
                console.log('⚠️ victory_spriteメッセージが見つからない - 直接intermediate_talkに進行');
                
                // victory_spriteメッセージがない場合でもintermediate_talkを処理
                if (this.currentRound >= 2) {
                    const intermediateMessage = this.getIntermediateMessage();
                    
                    if (intermediateMessage && intermediateMessage.trim() !== '') {
                        await this.animateDialogueText(intermediateMessage, 50);
                        
                        this.waitForJanken(async () => {
                            console.log('🔄 intermediate_talk後の進めるボタンクリック');
                            await this.handleNextRoundDialogue();
                        });
                    } else {
                        console.log('🔄 intermediate_talkが空のため直接次のラウンドへ');
                        await this.handleNextRoundDialogue();
                    }
                } else {
                    // ラウンド1の場合は直接次のラウンドへ
                    console.log('🔄 ラウンド1のため直接次のラウンドへ');
                    await this.handleNextRoundDialogue();
                }
            }
        } else {
            // プレイヤーの勝利がない場合は直接次のラウンドへ
            console.log('🔄 プレイヤー勝利なし、直接次ラウンドへ');
            await this.handleNextRoundDialogue();
        }
    }

    /**
     * じゃんけんハンドアニメーションを再生
     * @param {string} result - 勝敗結果 (playerWin, misakiWin, draw)
     * @returns {Promise} アニメーション完了のPromise
     */
    async playJankenHandAnimation(result) {
        console.log(`🎭 じゃんけんアニメーション開始: ${result}`);
        
        return new Promise((resolve) => {
            const animationContainer = document.getElementById('janken-animation');
            const playerHandImg = document.getElementById('player-hand-img');
            const misakiHandImg = document.getElementById('misaki-hand-img');
            const playerHandImage = document.getElementById('player-hand-image');
            const misakiHandImage = document.getElementById('misaki-hand-image');
            const resultTextAnimated = document.getElementById('result-text-animated');
            const resultSubtitle = document.getElementById('result-subtitle');
            const resultDisplay = document.getElementById('animated-result');
            const battleSparks = document.querySelector('.battle-sparks');
            const impactBurst = document.getElementById('impact-burst');
            const vsText = document.getElementById('vs-text');
            
            if (!animationContainer) {
                console.error('❌ アニメーションコンテナが見つかりません');
                resolve();
                return;
            }
            
            // アニメーション表示
            animationContainer.classList.add('show');
            
            // じゃんけんの手画像を設定
            const handImages = {
                rock: 'assets/images/ui/rock.png',
                scissors: 'assets/images/ui/scissors.png', 
                paper: 'assets/images/ui/paper.png'
            };
            
            // 画像設定
            playerHandImg.src = handImages[this.playerHand];
            playerHandImg.alt = this.getHandDisplayName(this.playerHand);
            misakiHandImg.src = handImages[this.misakiHand];
            misakiHandImg.alt = this.getHandDisplayName(this.misakiHand);
            
            // Step 1: 手の出現アニメーション (0.6秒)
            setTimeout(() => {
                playerHandImage.classList.add('appear-left');
                misakiHandImage.classList.add('appear-right');
                
                // スパークエフェクトは削除（軽量化）
            }, 300);
            
            // Step 2: 勝負判定 (1.2秒後)
            setTimeout(() => {
                // 手のエフェクトをリセット
                playerHandImage.classList.remove('appear-left');
                misakiHandImage.classList.remove('appear-right');
                
                let resultText = '';
                let resultClass = '';
                let subtitle = '';
                
                // 結果に応じて初期エフェクト適用
                switch (result) {
                    case 'playerWin':
                        playerHandImage.classList.add('winner', 'impact-effect');
                        misakiHandImage.classList.add('loser');
                        resultText = 'あなたの勝ち！';
                        resultClass = 'player-win';
                        subtitle = '美咲のライフが1減った！';
                        break;
                        
                    case 'misakiWin':
                        misakiHandImage.classList.add('winner', 'impact-effect');
                        playerHandImage.classList.add('loser');
                        resultText = '美咲の勝ち！';
                        resultClass = 'misaki-win';
                        subtitle = 'あなたのライフが1減った！';
                        break;
                        
                    case 'draw':
                        playerHandImage.classList.add('draw');
                        misakiHandImage.classList.add('draw');
                        resultText = 'あいこ';
                        resultClass = 'draw';
                        subtitle = 'もう一度！';
                        break;
                }
                
                // 結果テキスト設定
                resultTextAnimated.textContent = resultText;
                resultTextAnimated.className = `result-text-animated ${resultClass}`;
                resultSubtitle.textContent = subtitle;
                
                // 結果表示アニメーション
                resultDisplay.classList.add('show');
                
            }, 1200);
            
            // Step 3: 押し出し開始 (1.6秒後) - あいこ以外のみ
            if (result !== 'draw') {
                setTimeout(() => {
                    console.log('🥊 押し出しアニメーション開始');
                    switch (result) {
                        case 'playerWin':
                            playerHandImage.classList.add('push-right');
                            break;
                        case 'misakiWin':
                            misakiHandImage.classList.add('push-left');
                            break;
                    }
                }, 1600);
                
                // Step 4: 衝突エフェクト (1.8秒後) - 軽量化
                setTimeout(() => {
                    console.log('💥 衝突エフェクト発動');
                    // 衝突バーストのみ（他のエフェクトは削除）
                    if (impactBurst) {
                        impactBurst.classList.add('show');
                    }
                }, 1800);
                
                // Step 5: はねのけ開始 (1.9秒後)
                setTimeout(() => {
                    console.log('🚀 はねのけアニメーション開始');
                    switch (result) {
                        case 'playerWin':
                            misakiHandImage.classList.add('knockback-right');
                            break;
                        case 'misakiWin':
                            playerHandImage.classList.add('knockback-left');
                            break;
                    }
                }, 1900);
            }
            
            // Step 6: アニメーション終了 (3秒後)
            setTimeout(() => {
                // クリーンアップ - 軽量化版
                animationContainer.classList.remove('show');
                playerHandImage.className = 'hand-image'; // 全クラスリセット
                misakiHandImage.className = 'hand-image'; // 全クラスリセット
                resultDisplay.classList.remove('show');
                
                if (impactBurst) {
                    impactBurst.classList.remove('show');
                }
                
                console.log('✨ じゃんけんアニメーション完了（軽量化版）');
                
                // アニメーション完了後にじゃんけんボタンを「進める」アイコンに切り替え
                // 遅延させて、waitForJanken()が確実に設定された後にボタンを表示
                setTimeout(() => {
                    this.switchToAdvanceButtons();
                }, 1000); // 1秒遅延（3.5秒後のwaitForJanken設定を待つ）
                
                resolve();
            }, 3000);
        });
    }

    /**
     * じゃんけんボタンを無効化
     */
    disableJankenButtons() {
        const buttons = document.querySelectorAll('.hand-btn');
        buttons.forEach(btn => {
            btn.style.opacity = '0.5';
            btn.style.pointerEvents = 'none';
            btn.disabled = true;
        });
        console.log('🔘 じゃんけんボタンを無効化しました');
    }

    /**
     * じゃんけんボタンを「進める」アイコンに切り替え
     */
    switchToAdvanceButtons() {
        console.log('🚨 switchToAdvanceButtons() 開始');
        
        // じゃんけんボタンを非表示
        const handButtons = document.querySelector('.hand-buttons');
        const advanceButtonContainer = document.querySelector('.advance-button-container');
        const advanceButton = document.getElementById('btn-advance');
        
        console.log('🔍 要素の存在チェック:', {
            handButtons: !!handButtons,
            advanceButtonContainer: !!advanceButtonContainer,
            advanceButton: !!advanceButton
        });
        
        if (handButtons) {
            handButtons.style.display = 'none';
            console.log('✅ じゃんけんボタンを非表示にしました');
        }
        
        // 進めるボタンを表示
        if (advanceButtonContainer) {
            advanceButtonContainer.style.display = 'flex';
            advanceButtonContainer.style.justifyContent = 'center';
            console.log('✅ 進めるボタンコンテナを表示しました');
        }
        
        // 進めるボタンを確実に有効化
        if (advanceButton) {
            advanceButton.style.opacity = '1';
            advanceButton.style.pointerEvents = 'auto';
            advanceButton.disabled = false;
            console.log('✅ 進めるボタンを有効化しました');
        }
        
        // 進めるボタンのイベントリスナー設定は setupAdvanceButton() で既に行われているため、
        // 重複設定を避けるためここでは何もしない
        console.log('🔍 進めるボタンはsetupAdvanceButton()で既に設定済み');
        
        console.log('🔘 じゃんけんボタンを非表示にして「進める」ボタンを表示しました');
    }

    /**
     * ボタンをじゃんけんモードに戻す
     */
    switchBackToJankenButtons() {
        console.log('🔄 switchBackToJankenButtons() 実行開始');
        
        // 進めるボタンを非表示
        const advanceButtonContainer = document.querySelector('.advance-button-container');
        if (advanceButtonContainer) {
            advanceButtonContainer.style.display = 'none';
        }
        
        // じゃんけんボタンを表示
        const handButtons = document.querySelector('.hand-buttons');
        if (handButtons) {
            handButtons.style.display = 'flex';
        }
        
        // じゃんけんボタンを有効化
        const buttons = document.querySelectorAll('.hand-buttons .hand-btn');
        buttons.forEach(btn => {
            btn.style.opacity = '1';
            btn.style.pointerEvents = 'auto';
            btn.disabled = false;
        });
        
        console.log('✅ switchBackToJankenButtons() 完了：進めるボタンを非表示にしてじゃんけんボタンを表示しました');
    }

    /**
     * バトル結果を表示
     * @param {string} result - 勝敗結果
     */
    showBattleResult(result) {
        if (!this.battleResult) return;
        
        let resultText = '';
        let resultClass = '';
        
        switch (result) {
            case 'playerWin':
                resultText = 'あなたの勝ち！';
                resultClass = 'player-win';
                break;
            case 'misakiWin':
                resultText = '美咲の勝ち！';
                resultClass = 'misaki-win';
                break;
            case 'draw':
                resultText = 'あいこ';
                resultClass = 'draw';
                break;
        }
        
        // 結果テキスト設定
        if (this.statusElements.resultText) {
            this.statusElements.resultText.textContent = resultText;
            this.statusElements.resultText.className = `result-text ${resultClass}`;
        }
        
        // 手の表示
        if (this.statusElements.misakiHandDisplay) {
            this.statusElements.misakiHandDisplay.textContent = this.getHandDisplayName(this.misakiHand);
        }
        if (this.statusElements.playerHandDisplay) {
            this.statusElements.playerHandDisplay.textContent = this.getHandDisplayName(this.playerHand);
        }
        
        // 新しいアニメーションシステムを使用するため、旧パネルは表示しない
        // this.battleResult.classList.add('show');
    }

    /**
     * 手の表示名を取得
     * @param {string} hand - 手
     * @returns {string} 表示名
     */
    getHandDisplayName(hand) {
        const names = {
            'rock': 'グー',
            'scissors': 'チョキ',
            'paper': 'パー'
        };
        return names[hand] || hand;
    }

    /**
     * ギャラリー解放通知を表示
     * @param {number} stage - 解放されたステージ番号
     */
    showGalleryUnlockNotification(stage) {
        // 通知要素を作成
        const notification = document.createElement('div');
        notification.className = 'gallery-unlock-notification';
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 15px 25px;
            border-radius: 10px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.3);
            z-index: 10000;
            animation: slideInRight 0.5s ease-out;
            font-family: 'Noto Sans JP', sans-serif;
        `;
        
        notification.innerHTML = `
            <div style="display: flex; align-items: center; gap: 10px;">
                <span style="font-size: 24px;">🎨</span>
                <div>
                    <div style="font-weight: bold; font-size: 14px;">ギャラリー解放！</div>
                    <div style="font-size: 12px; opacity: 0.9;">Stage ${stage} の立ち絵が追加されました</div>
                </div>
            </div>
        `;
        
        // アニメーション用CSS追加
        if (!document.querySelector('#gallery-notification-styles')) {
            const style = document.createElement('style');
            style.id = 'gallery-notification-styles';
            style.textContent = `
                @keyframes slideInRight {
                    from {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }
                @keyframes fadeOut {
                    from {
                        opacity: 1;
                    }
                    to {
                        opacity: 0;
                    }
                }
            `;
            document.head.appendChild(style);
        }
        
        document.body.appendChild(notification);
        
        // 3秒後にフェードアウトして削除
        setTimeout(() => {
            notification.style.animation = 'fadeOut 0.5s ease-out';
            setTimeout(() => {
                notification.remove();
            }, 500);
        }, 3000);
    }

    /**
     * ゲーム終了判定
     * @returns {boolean} ゲーム終了かどうか
     */
    checkGameEnd() {
        // 5勝先取でトーク画面に遷移
        if (this.playerWins >= 5) {
            this.handlePlayerVictory();
            return true;
        }
        
        // 5敗でBAD END
        if (this.misakiWins >= 5) {
            this.endGame('bad_end');
            return true;
        }
        
        return false;
    }

    /**
     * プレイヤー最終勝利時の処理
     */
    async handlePlayerVictory() {
        console.log('🏆 プレイヤー最終勝利！進むボタンでエンディングトークへ');
        
        this.canMakeChoice = false;
        this.isPlayingRound = false;
        
        // 既存のwaitForJankenをクリア
        this.pendingJankenAction = null;
        this.isWaitingForJanken = false;
        
        // 自動遷移は削除：victory_spriteメッセージ表示後に進むボタンでエンディングトークへ
        console.log('🏆 5勝達成：victory_spriteメッセージ後、進むボタンでエンディングトークに遷移');
    }

    /**
     * 次のラウンドを即座に準備（ボタン待機なし）
     */
    prepareNextRoundImmediate() {
        this.currentRound++;
        this.isPlayingRound = false;
        
        // 結果パネルを非表示
        if (this.battleResult) {
            this.battleResult.classList.remove('show');
        }
        
        console.log(`🎯 即座ラウンド準備: ラウンド${this.currentRound}`);
        
        // CSVローダー状態をチェック
        console.log('🔍 CSVローダー状態チェック中...');
        if (this.game.csvLoader && this.game.csvLoader.data) {
            console.log('✅ CSVローダーが存在します');
        } else {
            console.warn('⚠️ CSVローダーが異常です');
        }
        
        if (this.currentRound <= this.maxRounds) {
            // 🚨 完全修正：すべての結果でintermediate_talkの自動表示を削除
            console.log('🚨 すべての結果でintermediate_talk自動表示を削除：進めるボタン待機のみ');
            
            if (this.currentRound === 1) {
                // ラウンド1のみそのまま開始
                this.startNewRound();
            }
            // ラウンド2以降は何もしない（reactionトーク後の進めるボタンクリック待機のみ）
        } else {
            console.log('最大ラウンドに到達');
        }
    }

    /**
     * 進めるボタンクリック時の次ラウンドダイアログ処理
     */
    async handleNextRoundDialogue() {
        console.log(`🔍 🚨 handleNextRoundDialogue() 開始`);
        console.log(`🔍 🚨 前回の結果をチェック: lastRoundResult = "${this.lastRoundResult}"`);
        console.log(`🔍 🚨 lastRoundResultのタイプ: ${typeof this.lastRoundResult}`);
        console.log(`🔍 🚨 nullチェック: ${this.lastRoundResult === null}`);
        console.log(`🔍 🚨 drawチェック: ${this.lastRoundResult === 'draw'}`);
        console.log(`🔍 🚨 playerWinチェック: ${this.lastRoundResult === 'playerWin'}`);
        console.log(`🔍 🚨 misakiWinチェック: ${this.lastRoundResult === 'misakiWin'}`);
        
        if (this.lastRoundResult === 'draw') {
            // あいこの場合: ak001を表示
            console.log('🌲 ✅ 前回はあいこでした - ak001を表示します');
            await this.showDrawAfterDialogue();
        } else if (this.lastRoundResult === 'playerWin' || this.lastRoundResult === 'misakiWin') {
            // 勝敗がついている場合: nr001を表示
            console.log(`🎆 ✅ 前回は勝敗がつきました(${this.lastRoundResult}) - nr001を表示します`);
            await this.showNextRoundDialogue();
        } else {
            // 予期しない状態の場合のフォールバック
            console.warn(`⚠️ 予期しない状態: lastRoundResult="${this.lastRoundResult}" - nr001をフォールバック表示`);
            await this.showNextRoundDialogue();
        }
    }

    /**
     * 次のラウンドを準備（シンプル版）- 廃止予定
     * 前回の結果があいこの場合は「あいこで…」を表示
     */
    async prepareSimpleNextRound() {
        console.warn('⚠️ prepareSimpleNextRound() は廃止予定です。prepareNextRoundImmediate() を使用してください。');
        this.prepareNextRoundImmediate();
    }

    /**
     * あいこ後のダイアログを表示（ak001）
     */
    async showDrawAfterDialogue() {
        console.log('🚨 showDrawAfterDialogue() 開始 - ak001を確実に表示します');

        // ak001 「あいこで…」を確実に表示
        console.log('🚨 ak001をCSVから取得中...');
        let drawAfterText = this.getDialogueText('ak001');

        // フォールバックで確実に表示
        if (!drawAfterText) {
            drawAfterText = 'あいこで…';
            console.log('🚨 CSVから取得できないためフォールバックで表示');
        }

        console.log(`🚨 確実にak001を表示: "${drawAfterText}"`);
        await this.animateDialogueText(drawAfterText, 50);
        
        // あいこダイアログ後にじゃんけんボタンに切り替え
        console.log('🔄 ak001表示後：じゃんけんボタンに切り替え');
        this.switchBackToJankenButtons();
        
        // あいこの場合は直接じゃんけん選択可能に
        this.clearJankenWait();
        this.canMakeChoice = true;
        this.isPlayingRound = false;
        
        console.log('✅ da001フロー完了：じゃんけん選択可能');
        
        // 状態をリセット（次回のじゃんけん実行直前まで維持）
        // this.lastRoundResult = null; // 削除：早すぎるリセットが問題の原因
    }

    /**
     * 次ラウンド開始のダイアログを表示（nr001）
     */
    async showNextRoundDialogue() {
        console.log('🚨 showNextRoundDialogue() 開始 - nr001を確実に表示します');
        
        // ボタンをじゃんけんモードに切り替え
        console.log('🔄 nr001表示前：じゃんけんボタンに切り替え');
        this.switchBackToJankenButtons();
        
        // nr001 「最初はグー！じゃんけん...」を確実に表示
        console.log('🚨 nr001をCSVから取得中...');
        let nextRoundText = this.getDialogueText('nr001');
        
        // フォールバックで確実に表示
        if (!nextRoundText) {
            nextRoundText = '最初はグー！じゃんけん...';
            console.log('🚨 CSVから取得できないためフォールバックで表示');
        }
        
        console.log(`🚨 確実にnr001を表示: "${nextRoundText}"`);
        await this.animateDialogueText(nextRoundText, 50);
        
        // 次ラウンド開始後にじゃんけん選択可能に
        this.clearJankenWait();
        this.canMakeChoice = true;
        this.isPlayingRound = false;
        
        console.log('✅ nr001フロー完了：じゃんけん選択可能');
        
        // 状態をリセット（次回のじゃんけん実行直前まで維持）
        // this.lastRoundResult = null; // 削除：早すぎるリセットが問題の原因
    }

    /**
     * 次のラウンドを準備（従来版）
     */
    async prepareNextRound() {
        this.currentRound++;
        this.isPlayingRound = false;
        
        // 結果パネルを非表示
        if (this.battleResult) {
            this.battleResult.classList.remove('show');
        }
        
        // 次のラウンド開始前に「最初はグー！じゃんけん...」をタイプライター効果で表示
        const nextRoundText = this.getDialogueText('nr001') || '最初はグー！じゃんけん...';
        await this.animateDialogueText(nextRoundText);
        
        // 次ラウンド開始をじゃんけんボタン待機（ラウンド前トーク追加）
        if (this.currentRound <= this.maxRounds) {
            this.waitForJanken(async () => {
                // ラウンド2以降は開始前トークを表示
                if (this.currentRound >= 2) {
                    const preRoundMessage = this.getPreRoundMessage();
                    await this.animateDialogueText(preRoundMessage, 50);
                    
                    // トーク表示後、じゃんけんボタン待機で次ラウンド開始
                    this.waitForJanken(async () => {
                        await this.startNewRound();
                    });
                } else {
                    // ラウンド1はそのまま開始
                    await this.startNewRound();
                }
            });
        } else {
            // 最大ラウンド到達（通常はここには来ない）
            console.log('最大ラウンドに到達');
        }
    }

    /**
     * ゲーム終了処理
     * @param {string} endingType - エンディングタイプ
     */
    endGame(endingType) {
        console.log(`ゲーム終了: ${endingType}`);
        
        this.canMakeChoice = false;
        this.isPlayingRound = false;
        
        // 終了演出
        this.playGameEndAnimation(endingType);
        
        // エンディングシーンへ遷移
        setTimeout(() => {
            this.hide();
            this.game.showEnding(endingType);
        }, 3000);
    }

    /**
     * ゲーム終了アニメーション
     * @param {string} endingType - エンディングタイプ
     */
    playGameEndAnimation(endingType) {
        if (endingType === 'true_end') {
            this.game.audioManager.playSE('se_victory.mp3', 1.0);
        } else {
            this.game.audioManager.playSE('se_defeat.mp3', 1.0);
        }
        
        // 画面エフェクト
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: ${endingType === 'true_end' ? 'rgba(255, 215, 0, 0.2)' : 'rgba(0, 0, 0, 0.3)'};
            pointer-events: none;
            z-index: 100;
            animation: fadeIn 2s ease;
        `;
        
        document.body.appendChild(overlay);
        
        setTimeout(() => {
            overlay.remove();
        }, 3000);
    }

    // 必殺技機能を削除

    /**
     * 必殺技エフェクト表示
     * @param {string} message - メッセージ
     */
    showSpecialMoveEffect(message) {
        const effectDiv = document.createElement('div');
        effectDiv.style.cssText = `
            position: fixed;
            top: 30%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: linear-gradient(135deg, #ffd700 0%, #ffb347 100%);
            color: #8b0000;
            padding: 20px 30px;
            border-radius: 15px;
            border: 3px solid #ffd700;
            font-size: 1.5rem;
            font-weight: 700;
            text-align: center;
            z-index: 150;
            box-shadow: 0 0 30px rgba(255, 215, 0, 0.5);
            animation: bounce 0.5s ease;
        `;
        
        effectDiv.textContent = message;
        document.body.appendChild(effectDiv);
        
        setTimeout(() => {
            effectDiv.remove();
        }, 4000);
    }

    /**
     * ヒント表示
     */
    showHint() {
        console.log('ヒントを表示');
        this.game.audioManager.playSE('se_click.mp3', 0.5);
        
        const hints = [
            'じゃんけんは運だけじゃない。相手のパターンを読もう',
            '3連勝すると必殺技「読心術」が使える',
            '美咲の表情や仕草にもヒントが隠されている',
            '勝負は5勝先取。集中して挑もう'
        ];
        
        const randomHint = hints[Math.floor(Math.random() * hints.length)];
        this.showTemporaryMessage(randomHint);
    }

    /**
     * ゲーム降参
     */
    surrenderGame() {
        const result = confirm('本当に降参しますか？');
        if (result) {
            console.log('ゲームを降参');
            this.game.audioManager.playSE('se_defeat.mp3', 0.8);
            this.endGame('bad_end');
        }
    }

    /**
     * タイトル画面に戻る
     */
    returnToTitle() {
        console.log('タイトル画面に戻る');
        this.game.audioManager.playSE('se_click.mp3', 0.5);
        
        const confirmReturn = confirm('タイトル画面に戻りますか？\n進行中のゲームは失われます。');
        if (confirmReturn) {
            
            this.hide();
            this.game.showTitleScreen();
        }
    }

    /**
     * じゃんけんボタンでのトーク進行処理
     */
    onJankenAdvance() {
        console.log('▶️ onJankenAdvance() 呼び出し', {
            isWaitingForJanken: this.isWaitingForJanken,
            hasPendingAction: !!this.pendingAction
        });
        
        this.game.audioManager.playSE('se_click.mp3', 0.5);
        
        // 🚨 修正：pendingActionがあれば実行（isWaitingForJankenは不要）
        if (this.pendingAction && typeof this.pendingAction === 'function') {
            console.log('🎯 pendingActionを実行します');
            const action = this.pendingAction;
            this.clearJankenWait(); // 状態をクリア
            try {
                action();
                console.log('✅ pendingAction実行完了');
                return true; // 進行処理を実行したことを示す
            } catch (error) {
                console.error('❌ pendingAction実行エラー:', error);
                return false;
            }
        }
        
        // pendingActionが設定されていない場合の処理を改善
        console.log('🔍 pendingActionが設定されていません - デフォルト処理を実行');
        
        // デフォルト処理：じゃんけんモードに戻す
        if (this.isWaitingForJanken) {
            this.clearJankenWait();
            this.switchBackToJankenButtons();
            this.canMakeChoice = true;
            this.isPlayingRound = false;
            console.log('✅ デフォルト処理：じゃんけんモードに復帰');
            return true;
        }
        
        console.log('ℹ️ 処理すべき待機状態がありません');
        return true; // エラーではないのでtrueを返す
    }


    /**
     * キーボード入力処理
     * @param {KeyboardEvent} event - キーボードイベント
     */
    handleKeyInput(event) {
        switch (event.code) {
            case 'KeyR':
            case 'Digit1':
                this.makeChoice('rock');
                break;
            case 'KeyS':
            case 'Digit2':
                this.makeChoice('scissors');
                break;
            case 'KeyP':
            case 'Digit3':
                this.makeChoice('paper');
                break;
            // 必殺技機能を削除
            case 'KeyH':
                this.showHint();
                break;
        }
    }

    /**
     * 美咲のメッセージ表示
     * @param {string} message - メッセージ
     */
    showMisakiMessage(message) {
        this.showTemporaryMessage(message, '#ffb6c1');
    }

    /**
     * 指示メッセージ表示
     * @param {string} message - メッセージ
     */
    showInstructionMessage(message) {
        this.showTemporaryMessage(message, '#7ed6c4');
    }

    /**
     * 一時的なメッセージ表示
     * @param {string} message - メッセージ
     * @param {string} color - 文字色
     */
    showTemporaryMessage(message, color = '#ffffff') {
        const messageDiv = document.createElement('div');
        messageDiv.style.cssText = `
            position: fixed;
            top: 20%;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0,0,0,0.8);
            color: ${color};
            padding: 15px 25px;
            border-radius: 10px;
            border: 2px solid ${color};
            font-size: 1.1rem;
            font-weight: 600;
            text-align: center;
            z-index: 120;
            max-width: 80%;
            animation: fadeIn 0.3s ease;
        `;
        
        messageDiv.textContent = message;
        document.body.appendChild(messageDiv);
        
        setTimeout(() => {
            messageDiv.style.animation = 'fadeOut 0.3s ease';
            setTimeout(() => {
                messageDiv.remove();
            }, 300);
        }, 3000);
    }

    /**
     * 現在の状態を取得（セーブ用）
     * @returns {Object} 状態オブジェクト
     */
    getState() {
        return {
            currentRound: this.currentRound,
            playerHP: this.playerHP,
            misakiHP: this.misakiHP,
            playerWins: this.playerWins,
            misakiWins: this.misakiWins,
            consecutiveDraws: this.consecutiveDraws,
            drawMessageIndex: this.drawMessageIndex,
            misakiWinMessageIndex: this.misakiWinMessageIndex,
            currentMisakiSprite: this.currentMisakiSprite
        };
    }

    /**
     * 状態を復元（ロード用）
     * @param {Object} state - 状態オブジェクト
     */
    setState(state) {
        this.currentRound = state.currentRound || 1;
        this.playerHP = state.playerHP || 5;
        this.misakiHP = state.misakiHP || 5;
        this.playerWins = state.playerWins || 0;
        this.misakiWins = state.misakiWins || 0;
        this.consecutiveDraws = state.consecutiveDraws || 0;
        this.drawMessageIndex = state.drawMessageIndex || 0;
        this.misakiWinMessageIndex = state.misakiWinMessageIndex || 0;
        
        // 立ち絵状態も復元
        this.currentMisakiSprite = state.currentMisakiSprite || '';
        this.lastDisplayedSprite = '';
        this.updateMisakiSprite(this.playerWins);
    }

    /**
     * シーンの更新
     */
    update() {
        if (!this.isActive) return;
        
        // 必要に応じてアニメーション更新処理を追加
    }

    /**
     * CSVからダイアログテキストを取得（デバッグ強化版）
     * @param {string} dialogueId - ダイアログID
     * @returns {string|null} ダイアログテキスト
     */
    getDialogueText(dialogueId) {
        console.log(`🔍 getDialogueText() 呼び出し: dialogueId = "${dialogueId}"`);

        // 🔒 NUCLEAR OPTION: 秘めた想いモードで全ダイアログIDを強制返却
        if (this.game.gameState.isSecretMode) {
            const secretDialogues = {
                'gi001': '今日は私が勝つからねー！！…じゃあいくよ？',
                'gs001': '…最初はグー！じゃんけん…',
                'jp001': 'ぽん！',
                'mr010': 'やったぁ！…途中でやめるのはなしだよ？',
                'mr011': 'えへへ…私の勝ち♪途中でやめるのはだめだよ？',
                'mr012': '勝った～！このペースでいけば…',
                'mr013': 'か、勝てた…。ドキドキしちゃう…',
                'mr014': 'また勝っちゃった♪…まだ続けてよね？',
                'mr015': 'やったぁ！…やっぱり弱いなぁ♪',
                'mr019': 'あれ…あいこだ…',
                'mr020': 'わざと、あいこにしてる…？',
                'mr021': 'またあいこ…もう一回！',
                'mr022': 'も、もう一回やるよ！',
                'pl010': 'あっ…負けちゃった…でも、あなたなら…',
                'pl011': 'また負けた…恥ずかしいけど、嫌じゃないの',
                'pl012': 'こんなに負けるなんて…でも、ドキドキする',
                'pl013': 'もうこんなに…見られてる…恥ずかしい',
                'nr001': '最初はグー！じゃんけん...',
                'vw001': 'あれ…負けちゃった…でも、まだ始まったばかりだからね！',
                'vw002': 'ほ…本気じゃん…私も負けてられない…',
                'vw003': 'こんなはずじゃ…でも、約束は約束だよね…',
                'vw004': 'や、やばい…。ちょっと…見すぎだよ…',
                'vw005': 'あ、あぁ…負けちゃった…。ほんとに野球拳だと無敵なんじゃない…？',
                'it001': '…いくよ？…準備はいい？',
                'it002': '緊張する…始めるよ？',
                'it003': '二人きりだとドキドキするね…いくよ？',
                'it004': '本気でいくからね！',
                'it005': 'え、えーと…始めるね…',
                'it006': 'そ、そろそろ本気出さなきゃ…',
                'it007': '油断したら私が勝っちゃうからねー！！',
                'it008': 'い、いくよ…！'
            };

            if (secretDialogues[dialogueId]) {
                console.log(`🚨 [NUCLEAR] 秘めた想いモード ${dialogueId} 強制返却: "${secretDialogues[dialogueId]}"`);
                return secretDialogues[dialogueId];
            }
        }

        if (!this.game.csvLoader) {
            console.error(`⚠️ CSVローダーが存在しません (dialogueId: ${dialogueId})`);
            return null;
        }

        console.log(`🔍 CSVローダーが存在、データを検索中... (dialogueId: ${dialogueId})`);

        try {
            let dialogue = null;

            // 秘めた想いモードでは、secret_dialogues.csvのデータが
            // すでにdialoguesテーブルに読み込まれているので、
            // そのままdialogueIdで検索する（secret_プレフィックスは不要）
            if (this.game.gameState.isSecretMode) {
                console.log(`🔒 秘めた想いモード: ${dialogueId} を直接検索`);
            }

            // 通常検索（秘めた想いモードでも通常モードでも同じ）
            dialogue = this.game.csvLoader.findData('dialogues', 'dialogue_id', dialogueId);
            
            if (dialogue) {
                console.log(`✅ CSVからデータを取得成功: ${dialogueId} = "${dialogue.text}"`);
                return dialogue.text;
            } else {
                console.warn(`⚠️ CSVに ${dialogueId} が見つかりません`);
                
                // デバッグ用：全データをリスト表示
                const allDialogues = this.game.csvLoader.getTableData('dialogues');
                console.log('🔍 現在のCSVダイアログ一覧:');
                if (allDialogues) {
                    allDialogues.forEach(d => {
                        if (d.dialogue_id && d.dialogue_id.includes(dialogueId.substring(0, 2))) {
                            console.log(`  - ${d.dialogue_id}: "${d.text}"`);
                        }
                    });
                }
                
                return null;
            }
        } catch (error) {
            console.error(`⚠️ CSVデータ取得エラー (dialogueId: ${dialogueId}):`, error);
            return null;
        }
    }

    /**
     * 指定されたタイプのダイアログ一覧を取得
     * @param {string} sceneType - シーンタイプ
     * @param {string} triggerCondition - トリガー条件
     * @returns {Array} ダイアログ配列
     */
    getDialoguesByType(sceneType, triggerCondition) {
        if (!this.game.csvLoader) return [];

        const dialogues = this.game.csvLoader.getTableData('dialogues');
        
        // デバッグログ追加
        console.log(`🔍 getDialoguesByType 検索開始:`);
        console.log(`  - sceneType: "${sceneType}"`);
        console.log(`  - triggerCondition: "${triggerCondition}"`);
        console.log(`  - 総データ数: ${dialogues.length}`);
        
        let results = [];

        // 秘めた想いモードの場合は secret_ プレフィックス付きを優先検索
        if (this.game.gameState.isSecretMode && !sceneType.startsWith('secret_')) {
            const secretSceneType = 'secret_' + sceneType;
            console.log(`🔒 秘めた想いモード優先検索: ${sceneType} → ${secretSceneType}`);

            results = dialogues.filter(dialogue => {
                const sceneMatch = dialogue.scene_type === secretSceneType;
                const triggerMatch = dialogue.trigger_condition === triggerCondition;
                return sceneMatch && triggerMatch;
            });

            if (results.length > 0) {
                console.log(`✅ 秘めた想いモード専用データを取得: ${results.length}件`);
            } else {
                console.log(`🔍 秘めた想いモード専用データなし: ${secretSceneType} → 通常データで再検索`);
            }
        }

        // 通常検索または秘めた想いモード専用データが見つからない場合のフォールバック
        if (results.length === 0) {
            results = dialogues.filter(dialogue => {
                const sceneMatch = dialogue.scene_type === sceneType;
                const triggerMatch = dialogue.trigger_condition === triggerCondition;
                return sceneMatch && triggerMatch;
            });
        }

        // デバッグ用：マッチしたデータをログに出力
        results.forEach(dialogue => {
            console.log(`  ✅ マッチ: ${dialogue.dialogue_id} - "${dialogue.text}"`);
        });
        
        console.log(`🔍 検索結果: ${results.length}件`);
        return results;
    }

    /**
     * 特定のdialogue_idでメッセージを取得
     * @param {string} dialogueId - 取得するdialogue_id
     * @returns {object|null} 該当するダイアログオブジェクト
     */
    getDialogueById(dialogueId) {
        if (!this.game.csvLoader) return null;
        
        const dialogues = this.game.csvLoader.getTableData('dialogues');
        return dialogues.find(dialogue => dialogue.dialogue_id === dialogueId) || null;
    }

    /**
     * じゃんけん待機を設定
     * @param {Function} action - じゃんけんボタン押下時に実行する処理
     */
    waitForJanken(action) {
        this.isWaitingForJanken = true;
        this.pendingAction = action;
        
        // じゃんけんボタンに待機中の視覚的フィードバックを追加
        const buttons = document.querySelectorAll('.hand-btn');
        buttons.forEach(btn => {
            btn.style.opacity = '1';
            btn.style.pointerEvents = 'auto';
            btn.style.boxShadow = '0 0 10px rgba(255, 215, 0, 0.7)'; // ゴールド輝き
        });
        
        console.log('🔄 じゃんけん待機状態に設定しました');
    }

    /**
     * じゃんけん待機を解除
     */
    clearJankenWait() {
        this.isWaitingForJanken = false;
        this.pendingAction = null;
        
        // じゃんけんボタンの視覚的フィードバックを削除
        const buttons = document.querySelectorAll('.hand-btn');
        buttons.forEach(btn => {
            btn.style.boxShadow = '';
        });
    }

    /**
     * リソースをクリーンアップ
     */
    cleanup() {
        this.canMakeChoice = false;
        this.isPlayingRound = false;
        this.clearJankenWait();
        console.log('GameScene cleanup');
    }
}

// グローバルに公開
window.GameScene = GameScene;