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
        this.canMakeChoice = false;
        
        // 必殺技
        this.specialMoveAvailable = false;
        this.consecutiveWins = 0;
        
        // DOM要素への参照
        this.gameScreen = null;
        this.misakiGameDisplay = null;
        this.battleResult = null;
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
        
        // ステータス表示要素
        this.statusElements = {
            currentRound: document.getElementById('current-round'),
            misakiHearts: document.getElementById('misaki-hearts'),
            misakiDefeats: document.getElementById('misaki-defeats'),
            playerHearts: document.getElementById('player-hearts'),
            playerVictories: document.getElementById('player-victories'),
            resultText: document.getElementById('result-text'),
            misakiHandDisplay: document.getElementById('misaki-hand'),
            playerHandDisplay: document.getElementById('player-hand')
        };
        
        // じゃんけんボタン
        this.handButtons = {
            rock: document.getElementById('btn-rock'),
            scissors: document.getElementById('btn-scissors'),
            paper: document.getElementById('btn-paper'),
            special: document.getElementById('btn-special'),
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
        // 勝利数に応じた立ち絵マッピング（6段階）
        const spriteMapping = {
            0: 'misaki_game_stage1.png',  // 初期状態：自信満々
            1: 'misaki_game_stage2.png',  // 1勝：少し焦り始める
            2: 'misaki_game_stage3.png',  // 2勝：明確に焦る
            3: 'misaki_game_stage4.png',  // 3勝：必死になる
            4: 'misaki_game_stage5.png',  // 4勝：かなり恥ずかしい
            5: 'misaki_game_stage6.png'   // 5勝：完全敗北（最終段階）
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

        const imagePath = `assets/images/characters/misaki/${spriteName}`;
        
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
            console.error(`❌ 立ち絵が見つかりません: ${spriteName}`);
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
            this.handButtons.rock.addEventListener('click', () => {
                this.makeChoice('rock');
            });
        }
        
        if (this.handButtons.scissors) {
            this.handButtons.scissors.addEventListener('click', () => {
                this.makeChoice('scissors');
            });
        }
        
        if (this.handButtons.paper) {
            this.handButtons.paper.addEventListener('click', () => {
                this.makeChoice('paper');
            });
        }
        
        // 制御ボタン
        if (this.handButtons.special) {
            this.handButtons.special.addEventListener('click', () => {
                this.useSpecialMove();
            });
        }
        
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

        // 美咲の画像クリック（衣装確認）
        if (this.misakiGameDisplay) {
            this.misakiGameDisplay.addEventListener('click', () => {
                this.onMisakiClick();
            });
        }

        // タイトルへ戻るボタン
        const returnBtn = document.getElementById('game-return-btn');
        if (returnBtn) {
            returnBtn.addEventListener('click', () => {
                this.game.audioManager.playSE('se_choice_select.mp3', 0.8);
                this.returnToTitle();
            });
        }

        // キーボード操作
        document.addEventListener('keydown', (event) => {
            if (this.isActive && this.canMakeChoice) {
                this.handleKeyInput(event);
            }
        });
    }

    /**
     * ゲームシーンを表示
     * @param {Object} initialData - 初期ゲームデータ（ロード時など）
     */
    async show(initialData = null) {
        if (this.isActive) return;
        
        console.log('ゲーム画面を表示');
        
        // 初期データがあれば復元
        if (initialData) {
            this.restoreGameState(initialData);
        } else {
            this.resetGameState();
        }
        
        // ゲームシーン専用BGMを再生
        await this.game.audioManager.playSceneBGM('game', 1.5);
        
        // 背景設定
        this.setupBackground();
        
        // 美咲の表示設定
        this.setupMisakiDisplay();
        
        // UI更新
        this.updateUI();
        
        // 画面表示
        this.gameScreen.classList.add('active');
        this.isActive = true;
        
        // ゲーム開始メッセージ
        setTimeout(() => {
            this.startNewRound();
        }, 1000);
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
        this.consecutiveWins = 0;
        this.specialMoveAvailable = false;
        this.playerHand = null;
        this.misakiHand = null;
        
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
        this.consecutiveWins = data.consecutiveWins || 0;
        this.specialMoveAvailable = data.specialMoveAvailable || false;
        
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
        if (backgroundElement) {
            backgroundElement.style.backgroundImage = "url('./assets/images/backgrounds/bg_game_room.png')";
        }
    }

    /**
     * 美咲の表示を設定
     */
    setupMisakiDisplay() {
        if (!this.misakiGameDisplay) return;
        
        // 現在のHPに基づいて衣装を設定
        const costumeLevel = this.game.costumeSystem.calculateCostumeLevel(this.misakiHP);
        const emotion = this.getEmotionByGameState();
        
        // 衣装システムを使用して表示を更新
        this.game.costumeSystem.updateCostumeByHP(this.misakiHP, this.misakiGameDisplay, emotion);
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
        
        // HP表示（ハート）
        this.updateHearts();
        
        // 勝利・敗北数表示
        if (this.statusElements.misakiDefeats) {
            this.statusElements.misakiDefeats.textContent = this.misakiWins;
        }
        if (this.statusElements.playerVictories) {
            this.statusElements.playerVictories.textContent = this.playerWins;
        }
        
        // 必殺技ボタンの状態
        this.updateSpecialButton();
        
        // バトル結果を非表示
        if (this.battleResult) {
            this.battleResult.classList.remove('show');
        }
    }

    /**
     * ハート表示を更新
     */
    updateHearts() {
        // 美咲のハート
        if (this.statusElements.misakiHearts) {
            this.statusElements.misakiHearts.innerHTML = '';
            for (let i = 0; i < 5; i++) {
                const heart = document.createElement('div');
                heart.className = i < this.misakiHP ? 'heart' : 'heart empty';
                this.statusElements.misakiHearts.appendChild(heart);
            }
        }
        
        // プレイヤーのハート
        if (this.statusElements.playerHearts) {
            this.statusElements.playerHearts.innerHTML = '';
            for (let i = 0; i < 5; i++) {
                const heart = document.createElement('div');
                heart.className = i < this.playerHP ? 'heart' : 'heart empty';
                this.statusElements.playerHearts.appendChild(heart);
            }
        }
    }

    /**
     * 必殺技ボタンの状態を更新
     */
    updateSpecialButton() {
        if (this.handButtons.special) {
            if (this.specialMoveAvailable) {
                this.handButtons.special.disabled = false;
                this.handButtons.special.textContent = '必殺技: 読心術';
                this.handButtons.special.style.background = 'linear-gradient(135deg, #ffd700 0%, #ffb347 100%)';
            } else {
                this.handButtons.special.disabled = true;
                this.handButtons.special.textContent = `必殺技: ${3 - this.consecutiveWins}連勝で発動`;
                this.handButtons.special.style.background = '';
            }
        }
    }

    /**
     * 新しいラウンドを開始
     */
    async startNewRound() {
        console.log(`ラウンド ${this.currentRound} 開始`);
        
        this.isPlayingRound = true;
        this.canMakeChoice = false;
        this.playerHand = null;
        this.misakiHand = null;
        
        // ラウンド開始演出
        await this.playRoundStartAnimation();
        
        // 美咲の開始セリフ
        this.showMisakiMessage(this.getRoundStartMessage());
        
        // プレイヤーの選択を待機
        setTimeout(() => {
            this.canMakeChoice = true;
            this.showInstructionMessage('じゃんけんの手を選んでください');
        }, 2000);
    }

    /**
     * ラウンド開始メッセージを取得
     * @returns {string} メッセージ
     */
    getRoundStartMessage() {
        const messages = [
            '準備はいい？じゃんけん...ぽん！',
            'さあ、勝負よ！',
            'どんな手を出すのかしら？',
            '私に勝てるかしら？'
        ];
        
        if (this.currentRound === 1) {
            return 'それじゃあ始めましょうか。じゃんけん...';
        }
        
        return messages[Math.floor(Math.random() * messages.length)];
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
     */
    async makeChoice(hand) {
        if (!this.canMakeChoice || this.isPlayingRound) {
            return;
        }
        
        console.log(`プレイヤーの選択: ${hand}`);
        
        this.playerHand = hand;
        this.canMakeChoice = false;
        
        // 効果音
        this.game.audioManager.playSE('se_click.mp3', 0.8);
        
        // 美咲の手を決定
        this.misakiHand = this.decideMisakiHand();
        
        // じゃんけん結果を処理
        await this.processRoundResult();
    }

    /**
     * 美咲の手を決定（AI処理）
     * @returns {string} 美咲の手
     */
    decideMisakiHand() {
        // じゃんけんパターンデータを取得
        const patternData = this.game.csvLoader.findData('janken_patterns', 'round', this.currentRound.toString());
        
        let weights = { rock: 33, scissors: 33, paper: 34 }; // デフォルト
        
        if (patternData) {
            weights = {
                rock: parseInt(patternData.rock_weight),
                scissors: parseInt(patternData.scissors_weight),
                paper: parseInt(patternData.paper_weight)
            };
        }
        
        // 重み付き抽選
        const totalWeight = weights.rock + weights.scissors + weights.paper;
        const random = Math.random() * totalWeight;
        
        if (random < weights.rock) {
            return 'rock';
        } else if (random < weights.rock + weights.scissors) {
            return 'scissors';
        } else {
            return 'paper';
        }
    }

    /**
     * ラウンド結果を処理
     */
    async processRoundResult() {
        // 勝敗判定
        const result = this.determineWinner(this.playerHand, this.misakiHand);
        
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
        
        // ゲーム終了判定
        if (this.checkGameEnd()) {
            return;
        }
        
        // 次のラウンドへ
        setTimeout(() => {
            this.prepareNextRound();
        }, 3000);
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
            this.misakiHP = Math.max(0, this.misakiHP - 1);
            this.playerWins++;
            this.consecutiveWins++;
            
            // 🎨 プレイヤー勝利時に美咲の立ち絵を更新
            this.updateMisakiSprite(this.playerWins);
            
            // 3連勝で必殺技解放
            if (this.consecutiveWins >= 3) {
                this.specialMoveAvailable = true;
            }
            
        } else if (result === 'misakiWin') {
            this.playerHP = Math.max(0, this.playerHP - 1);
            this.misakiWins++;
            this.consecutiveWins = 0; // 連勝リセット
        }
        // drawの場合はHP変化なし
    }

    /**
     * 結果アニメーション
     * @param {string} result - 勝敗結果
     * @returns {Promise} アニメーション完了のPromise
     */
    async playResultAnimation(result) {
        // 結果表示
        this.showBattleResult(result);
        
        // 効果音
        if (result === 'playerWin') {
            this.game.audioManager.playSE('se_win.mp3', 0.8);
        } else if (result === 'misakiWin') {
            this.game.audioManager.playSE('se_lose.mp3', 0.8);
        }
        
        // 美咲の反応アニメーション
        if (this.misakiGameDisplay) {
            if (result === 'playerWin') {
                this.misakiGameDisplay.classList.add('shake');
            } else if (result === 'misakiWin') {
                this.misakiGameDisplay.classList.add('bounce');
            }
            
            setTimeout(() => {
                this.misakiGameDisplay.classList.remove('shake', 'bounce');
            }, 1000);
        }
        
        return new Promise((resolve) => {
            setTimeout(resolve, 2000);
        });
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
        
        // 結果パネルを表示
        this.battleResult.classList.add('show');
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
     * ゲーム終了判定
     * @returns {boolean} ゲーム終了かどうか
     */
    checkGameEnd() {
        // 5勝先取でTRUE END
        if (this.playerWins >= 5) {
            this.endGame('true_end');
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
     * 次のラウンドを準備
     */
    prepareNextRound() {
        this.currentRound++;
        this.isPlayingRound = false;
        
        if (this.currentRound <= this.maxRounds) {
            this.startNewRound();
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

    /**
     * 必殺技使用
     */
    useSpecialMove() {
        if (!this.specialMoveAvailable || !this.canMakeChoice) {
            return;
        }
        
        console.log('必殺技「読心術」を使用');
        
        this.specialMoveAvailable = false;
        this.consecutiveWins = 0;
        
        // 美咲の次の手を予告
        const nextHand = this.decideMisakiHand();
        const handName = this.getHandDisplayName(nextHand);
        
        this.showSpecialMoveEffect(`美咲の次の手は「${handName}」です！`);
        
        // 効果音
        this.game.audioManager.playSE('se_special.mp3', 1.0);
        
        this.updateSpecialButton();
    }

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
            // 隠しクリック領域を無効化
            if (this.game.clickAreaSystem) {
                this.game.clickAreaSystem.deactivateAllAreas();
            }
            
            this.hide();
            this.game.showTitleScreen();
        }
    }

    /**
     * 美咲クリック時の処理
     */
    onMisakiClick() {
        this.game.audioManager.playSE('se_click.mp3', 0.3);
        
        // 現在の衣装情報を表示
        const costumeName = this.game.costumeSystem.getCurrentCostumeName();
        const message = `現在の美咲: ${costumeName} (HP: ${this.misakiHP})`;
        
        this.showTemporaryMessage(message);
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
            case 'KeyQ':
                if (this.specialMoveAvailable) {
                    this.useSpecialMove();
                }
                break;
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
            consecutiveWins: this.consecutiveWins,
            specialMoveAvailable: this.specialMoveAvailable,
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
        this.consecutiveWins = state.consecutiveWins || 0;
        this.specialMoveAvailable = state.specialMoveAvailable || false;
        
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
     * リソースをクリーンアップ
     */
    cleanup() {
        this.canMakeChoice = false;
        this.isPlayingRound = false;
        console.log('GameScene cleanup');
    }
}

// グローバルに公開
window.GameScene = GameScene;