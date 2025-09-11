/**
 * EndingScene.js
 * エンディング画面を管理するクラス
 * TRUE END（5勝）とBAD END（5敗）の2種類のエンディングを処理
 */

class EndingScene {
    constructor(gameController) {
        this.game = gameController;
        this.isActive = false;
        this.currentEnding = null;
        
        // DOM要素への参照
        this.endingScreen = null;
        this.endingTitle = null;
        this.endingImage = null;
        this.endingText = null;
        this.endingCharacterSprite = null;
        this.controlButtons = {};
        
        this.initialize();
    }

    /**
     * エンディングシーンを初期化
     */
    initialize() {
        this.endingScreen = document.getElementById('ending-screen');
        this.endingTitle = document.getElementById('ending-title');
        this.endingImage = document.getElementById('ending-image');
        this.endingText = document.getElementById('ending-text');
        this.endingCharacterSprite = document.getElementById('ending-character-sprite');
        
        // 制御ボタン
        this.controlButtons = {
            titleReturn: document.getElementById('btn-title-return'),
            replay: document.getElementById('btn-replay')
        };
        
        this.setupEventListeners();
        console.log('EndingScene初期化完了');
    }

    /**
     * イベントリスナーを設定
     */
    setupEventListeners() {
        // タイトルに戻るボタン
        if (this.controlButtons.titleReturn) {
            this.controlButtons.titleReturn.addEventListener('click', () => {
                this.returnToTitle();
            });
        }

        // もう一度プレイボタン
        if (this.controlButtons.replay) {
            this.controlButtons.replay.addEventListener('click', () => {
                this.replayGame();
            });
        }

        // エンディング画像クリック
        if (this.endingImage) {
            this.endingImage.addEventListener('click', () => {
                this.onEndingImageClick();
            });
        }

        // タイトルへ戻るボタン（右上）
        const returnBtn = document.getElementById('ending-return-btn');
        if (returnBtn) {
            returnBtn.addEventListener('click', () => {
                this.game.audioManager.playSE('se_choice_select.mp3', 0.8);
                this.returnToTitle();
            });
        }

        // キーボード操作
        document.addEventListener('keydown', (event) => {
            if (this.isActive) {
                this.handleKeyInput(event);
            }
        });

        // ボタンホバー効果
        Object.values(this.controlButtons).forEach(button => {
            if (button) {
                button.addEventListener('mouseenter', () => {
                    this.game.audioManager.playSE('se_click.mp3', 0.2);
                });
            }
        });
    }

    /**
     * エンディング画面を表示
     * @param {string} endingType - エンディングタイプ (true_end, bad_end)
     */
    async show(endingType = 'true_end') {
        if (this.isActive) return;
        
        console.log(`エンディング表示: ${endingType}`);
        
        this.currentEnding = endingType;
        
        // エンディングデータを読み込み
        const endingData = this.loadEndingData(endingType);
        
        // エンディング専用BGMを再生
        if (endingType === 'true_end') {
            await this.game.audioManager.playSceneBGM('ending_true', 2.0);
        } else if (endingType === 'bad_end') {
            await this.game.audioManager.playSceneBGM('ending_bad', 2.0);
        }
        
        // CSVからの個別BGM設定があれば優先
        if (endingData && endingData.bgm_file) {
            await this.game.audioManager.playBGM(endingData.bgm_file, true, 2.0);
        }
        
        // 背景設定
        this.setupBackground(endingData);
        
        // エンディング内容を設定
        this.setupEndingContent(endingData);
        
        // 画面表示
        this.endingScreen.classList.add('active');
        this.isActive = true;
        
        // フェードイン演出
        this.playShowAnimation();
        
        // エンディングクリア記録
        this.recordEndingClear(endingType);
    }

    /**
     * エンディング画面を非表示
     */
    hide() {
        if (!this.isActive) return;
        
        console.log('エンディング画面を非表示');
        
        // BAD END立ち絵を確実に非表示
        if (this.endingCharacterSprite) {
            this.endingCharacterSprite.style.display = 'none';
            this.endingCharacterSprite.src = '';
            console.log('🎭 BAD END立ち絵を非表示にしました');
        }
        
        // エンディング画面の全要素を非表示
        this.endingScreen.classList.remove('active');
        this.isActive = false;
    }

    /**
     * エンディングデータを読み込み（CSV優先版）
     * @param {string} endingType - エンディングタイプ
     * @returns {Object} エンディングデータ
     */
    loadEndingData(endingType) {
        // bad_endの場合は専用CSVから読み込み
        if (endingType === 'bad_end') {
            console.log('🔄 BAD END: CSVを強制再読み込み中...');
            
            // キャッシュをクリアして強制再読み込み
            if (this.game.csvLoader && this.game.csvLoader.csvData) {
                delete this.game.csvLoader.csvData['bad_end'];
                console.log('🗑️ bad_endキャッシュをクリア');
            }
            
            // CSVから読み込みを試みる
            if (this.game.csvLoader) {
                const badEndData = this.game.csvLoader.getTableData('bad_end');
                if (badEndData && badEndData.length > 0) {
                    const data = badEndData[0]; // 最初のデータを使用
                    console.log(`✅ bad_end.csvデータを読み込み成功`);
                    console.log(`📝 ending_name: "${data.ending_name}"`);
                    console.log(`📝 title_text: "${data.title_text}"`);
                    console.log(`📝 opening_text: "${data.opening_text}"`);
                    console.log(`📝 defeat_reaction: "${data.defeat_reaction}"`);
                    
                    // CSVのデータをそのまま返す
                    return data;
                }
            }
            
            // フォールバック: CSVが読み込めない場合
            console.warn('⚠️ bad_end.csvが見つかりません。フォールバック使用');
            const fallbackData = {
                ending_id: 'bad_end',
                ending_name: 'GAME　OVER',  // CSVと同じ値（全角スペース→半角スペース）
                title_text: 'また今度ね♪',
                special_text: '',
                bg_image: 'bg_night.png',
                bgm_file: 'game_over.mp3',
                cg_image: 'cg_bad.png',
                description: '美咲に5敗した時のエンディング',
                opening_text: '今日はここまでだね♪',
                defeat_reaction: 'またじゃんけんしてあげてもいーよー？',
                childhood_reflection: '',
                future_invitation: '',
                final_impression: ''
            };
            
            return fallbackData;
        }
        
        // 他のエンディングは従来通り
        if (this.game.csvLoader) {
            const data = this.game.csvLoader.findData('endings', 'ending_id', endingType);
            if (data) {
                console.log(`✅ endings.csvから${endingType}データを読み込み`);
                return data;
            }
        }
        
        // フォールバックデータ（シンプル版）
        const fallbackData = {
            'true_end': {
                ending_id: 'true_end',
                ending_name: 'TRUE ENDING',
                title_text: '大人になった二人の約束',
                bg_image: 'bg_sunrise.png',
                bgm_file: 'eternal_summer.mp3',
                cg_image: 'cg_true_adult.png',
                special_text: 'これから二人の新しい関係が始まる...'
            },
            'bad_end': {
                ending_id: 'bad_end',
                ending_name: 'BAD ENDING',
                title_text: 'また今度ね♪',
                bg_image: 'bg_night.png',
                bgm_file: 'game_over.mp3',
                cg_image: 'cg_bad.png',
                special_text: '',
                opening_text: '今日はここまでだね♪',
                defeat_reaction: 'またじゃんけんしてあげてもいーよー？',
                childhood_reflection: '',
                future_invitation: '',
                final_impression: ''
            }
        };
        
        console.warn(`⚠️ CSV ${endingType}データが見つかりません。フォールバック使用`);
        return fallbackData[endingType] || fallbackData['bad_end'];
    }

    /**
     * 背景を設定
     * @param {Object} endingData - エンディングデータ
     */
    setupBackground(endingData) {
        const backgroundElement = document.getElementById('ending-bg');
        
        if (backgroundElement && endingData && endingData.bg_image) {
            const imagePath = `./assets/images/backgrounds/${endingData.bg_image}`;
            backgroundElement.style.backgroundImage = `url('${imagePath}')`;
        } else {
            // デフォルト背景
            if (backgroundElement) {
                const gradientColor = this.currentEnding === 'true_end' ? 
                    'linear-gradient(135deg, #ff9a9e 0%, #fad0c4 100%)' :
                    'linear-gradient(135deg, #434343 0%, #000000 100%)';
                backgroundElement.style.background = gradientColor;
            }
        }
    }

    /**
     * エンディング内容を設定
     * @param {Object} endingData - エンディングデータ
     */
    setupEndingContent(endingData) {
        // タイトル設定
        if (this.endingTitle && endingData) {
            this.endingTitle.textContent = endingData.ending_name || 'ENDING';
            this.endingTitle.className = `ending-title ${this.currentEnding}`;
            
            // タイトル色設定
            if (this.currentEnding === 'true_end') {
                this.endingTitle.style.color = '#ffd700';
                this.endingTitle.style.textShadow = '3px 3px 6px rgba(255, 215, 0, 0.3)';
            } else {
                this.endingTitle.style.color = '#ff6b7d';
                this.endingTitle.style.textShadow = '3px 3px 6px rgba(255, 107, 125, 0.3)';
            }
        }
        
        // CG画像設定
        this.setupEndingImage(endingData);
        
        // 立ち絵設定（BAD ENDの場合のみ）
        this.setupEndingCharacter(endingData);
        
        // エンディングテキスト設定
        this.setupEndingText(endingData);
    }

    /**
     * エンディング画像を設定
     * @param {Object} endingData - エンディングデータ
     */
    setupEndingImage(endingData) {
        if (!this.endingImage) return;
        
        // BAD ENDの場合は赤い枠を表示しない
        if (this.currentEnding === 'bad_end') {
            console.log('🚫 BAD END: 赤い枠を非表示');
            this.endingImage.style.display = 'none';
            if (this.endingImage.parentElement) {
                this.endingImage.parentElement.style.display = 'none';
            }
            return;
        }
        
        if (endingData && endingData.cg_image) {
            const imagePath = `./assets/images/cg/${endingData.cg_image}`;
            
            this.endingImage.src = imagePath;
            this.endingImage.alt = endingData.ending_name;
            
            // 画像が存在しない場合のフォールバック
            this.endingImage.onerror = () => {
                console.warn(`エンディング画像が見つかりません: ${endingData.cg_image}`);
                this.createEndingPlaceholder();
            };
        } else {
            this.createEndingPlaceholder();
        }
    }

    /**
     * エンディング立ち絵を設定（BAD END専用）
     * @param {Object} endingData - エンディングデータ
     */
    setupEndingCharacter(endingData) {
        if (!this.endingCharacterSprite) return;
        
        // BAD ENDの場合のみ立ち絵を表示
        if (this.currentEnding === 'bad_end') {
            console.log('🎭 BAD END立ち絵を表示: misaki_bad_end.png');
            
            const spritePath = './assets/images/characters/misaki/misaki_bad_end.png';
            this.endingCharacterSprite.src = spritePath;
            this.endingCharacterSprite.alt = '美咲（勝利）';
            this.endingCharacterSprite.style.display = 'block';
            
            // 画像読み込み成功時の処理
            this.endingCharacterSprite.onload = () => {
                console.log('✅ BAD END立ち絵の読み込み成功');
                this.endingCharacterSprite.style.display = 'block';
            };
            
            // 画像が存在しない場合の処理
            this.endingCharacterSprite.onerror = () => {
                console.error('❌ misaki_bad_end.png が見つかりません:', spritePath);
                this.endingCharacterSprite.style.display = 'none';
            };
            
            // フェードイン演出
            this.endingCharacterSprite.style.opacity = '0';
            setTimeout(() => {
                this.endingCharacterSprite.style.transition = 'opacity 1.5s ease';
                this.endingCharacterSprite.style.opacity = '1';
            }, 1500);
            
        } else {
            // TRUE ENDでは立ち絵を非表示
            this.endingCharacterSprite.style.display = 'none';
        }
    }

    /**
     * エンディング画像のプレースホルダーを作成
     */
    createEndingPlaceholder() {
        if (!this.endingImage) return;
        
        const isTrue = this.currentEnding === 'true_end';
        const bgColor = isTrue ? '%23ffd700' : '%23ff6b7d';
        const textColor = isTrue ? '%23fff' : '%23000';
        const endingText = isTrue ? 'TRUE ENDING' : 'BAD ENDING';
        const subText = isTrue ? '大人になった二人' : 'また今度ね♪';
        
        const placeholder = `data:image/svg+xml;charset=UTF-8,%3Csvg width='600' height='400' xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='100%25' height='100%25' fill='${bgColor}'/%3E%3Ctext x='50%25' y='40%25' font-family='Arial' font-size='32' fill='${textColor}' text-anchor='middle' font-weight='bold'%3E${endingText}%3C/text%3E%3Ctext x='50%25' y='60%25' font-family='Arial' font-size='20' fill='${textColor}' text-anchor='middle'%3E${subText}%3C/text%3E%3C/svg%3E`;
        
        this.endingImage.src = placeholder;
    }

    /**
     * エンディングテキストを設定
     * @param {Object} endingData - エンディングデータ
     */
    setupEndingText(endingData) {
        if (!this.endingText) return;
        
        let textContent = '';
        
        if (this.currentEnding === 'true_end') {
            textContent = this.getTrueEndText(endingData);
        } else {
            textContent = this.getBadEndText(endingData);
        }
        
        // テキストアニメーション開始
        this.animateEndingText(textContent);
    }

    /**
     * TRUE ENDのテキストを取得
     * @param {Object} endingData - エンディングデータ
     * @returns {string} エンディングテキスト
     */
    getTrueEndText(endingData) {
        const baseText = endingData && endingData.special_text ? 
            endingData.special_text : 
            'これから二人の新しい関係が始まる...';
        
        return `野球拳に勝利したあなた。
        
美咲お姉ちゃんは恥ずかしそうに微笑みながら言いました。

「あなたの勝ちよ...大人になったのね」

子供の頃から憧れていた美咲お姉ちゃん。
今夜、二人の関係は新しい段階へと進んだのです。

${baseText}`;
    }

    /**
     * BAD ENDのテキストを取得（完全シンプル版）
     * @param {Object} endingData - エンディングデータ
     * @returns {string} エンディングテキスト
     */
    getBadEndText(endingData) {
        console.log('📖 BAD ENDテキスト生成 - CSVデータから取得');
        
        // CSVデータから取得したテキストを使用
        let simpleText = '';
        
        if (endingData) {
            // opening_textとdefeat_reactionのみを使用
            if (endingData.opening_text) {
                simpleText = endingData.opening_text;
            }
            
            if (endingData.defeat_reaction) {
                simpleText += `<br><br>${endingData.defeat_reaction}`;
            }
            
            console.log('✅ CSVから読み込んだテキスト:', simpleText);
        }
        
        // データがない場合のフォールバック
        if (!simpleText) {
            simpleText = `今日はここまでだね♪<br><br>またじゃんけんしてあげてもいーよー？`;
            console.log('⚠️ フォールバックテキストを使用');
        }
        
        return simpleText;
    }

    /**
     * エンディングテキストアニメーション
     * @param {string} text - 表示するテキスト
     */
    animateEndingText(text) {
        if (!this.endingText) return;
        
        this.endingText.innerHTML = '';
        this.endingText.style.opacity = '0';
        
        // フェードイン後にテキストアニメーション開始
        setTimeout(() => {
            this.endingText.style.transition = 'opacity 1s ease';
            this.endingText.style.opacity = '1';
            
            this.typewriterEffect(text);
        }, 2000);
    }

    /**
     * タイプライター効果でテキスト表示
     * @param {string} text - 表示するテキスト
     */
    typewriterEffect(text) {
        if (!this.endingText) return;
        
        // HTMLタグを考慮したタイプライター効果
        const htmlContent = text.replace(/<br>/g, '\n'); // <br>を改行文字に変換
        const textArray = Array.from(htmlContent);
        let currentIndex = 0;
        let displayText = '';
        
        const typeInterval = setInterval(() => {
            if (currentIndex < textArray.length) {
                const char = textArray[currentIndex];
                
                // 改行文字を<br>タグに戻す
                if (char === '\n') {
                    displayText += '<br>';
                } else {
                    displayText += char;
                }
                
                this.endingText.innerHTML = displayText;
                currentIndex++;
                
                // 改行や句読点で少し停止
                if (char.match(/[。！？\n]/)) {
                    setTimeout(() => {}, 300);
                }
            } else {
                clearInterval(typeInterval);
                this.onTextAnimationComplete();
            }
        }, 80);
    }

    /**
     * テキストアニメーション完了時の処理
     */
    onTextAnimationComplete() {
        console.log('エンディングテキストアニメーション完了');
        
        // 完了効果音
        this.game.audioManager.playSE('se_text_complete.mp3', 0.5);
        
        // ボタンを有効化
        this.enableControlButtons();
    }

    /**
     * 制御ボタンを有効化
     */
    enableControlButtons() {
        Object.values(this.controlButtons).forEach(button => {
            if (button) {
                button.style.opacity = '1';
                button.disabled = false;
            }
        });
    }

    /**
     * 表示アニメーション
     */
    playShowAnimation() {
        // 画面全体のフェードイン
        this.endingScreen.style.opacity = '0';
        
        setTimeout(() => {
            this.endingScreen.style.transition = 'opacity 2s ease';
            this.endingScreen.style.opacity = '1';
        }, 100);
        
        // タイトルのアニメーション
        if (this.endingTitle) {
            this.endingTitle.style.transform = 'translateY(-50px)';
            this.endingTitle.style.opacity = '0';
            
            setTimeout(() => {
                this.endingTitle.style.transition = 'all 1s ease';
                this.endingTitle.style.transform = 'translateY(0)';
                this.endingTitle.style.opacity = '1';
            }, 500);
        }
        
        // 画像のアニメーション
        if (this.endingImage) {
            this.endingImage.style.transform = 'scale(0.8)';
            this.endingImage.style.opacity = '0';
            
            setTimeout(() => {
                this.endingImage.style.transition = 'all 1.5s ease';
                this.endingImage.style.transform = 'scale(1)';
                this.endingImage.style.opacity = '1';
            }, 1000);
        }
    }

    /**
     * エンディング画像クリック時の処理
     */
    onEndingImageClick() {
        // this.game.audioManager.playSE('se_click.mp3', 0.3); // ClickSoundManagerと重複するため無効化
        
        // 画像を拡大表示（簡易ギャラリー機能）
        this.showImageFullscreen();
    }

    /**
     * 画像をフルスクリーン表示
     */
    showImageFullscreen() {
        if (!this.endingImage) return;
        
        const fullscreenDiv = document.createElement('div');
        fullscreenDiv.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: rgba(0,0,0,0.9);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 200;
            cursor: pointer;
        `;
        
        const fullscreenImage = this.endingImage.cloneNode(true);
        fullscreenImage.style.cssText = `
            max-width: 90%;
            max-height: 90%;
            object-fit: contain;
            border-radius: 10px;
            box-shadow: 0 0 50px rgba(0,0,0,0.8);
        `;
        
        fullscreenDiv.appendChild(fullscreenImage);
        document.body.appendChild(fullscreenDiv);
        
        // クリックで閉じる
        fullscreenDiv.addEventListener('click', () => {
            fullscreenDiv.remove();
        });
        
        // ESCキーで閉じる
        const escapeHandler = (event) => {
            if (event.code === 'Escape') {
                fullscreenDiv.remove();
                document.removeEventListener('keydown', escapeHandler);
            }
        };
        document.addEventListener('keydown', escapeHandler);
    }

    /**
     * キーボード入力処理
     * @param {KeyboardEvent} event - キーボードイベント
     */
    handleKeyInput(event) {
        switch (event.code) {
            case 'Enter':
            case 'Space':
                // テキストアニメーションをスキップ
                this.skipTextAnimation();
                break;
            case 'KeyR':
                this.replayGame();
                break;
            case 'KeyT':
            case 'Escape':
                this.returnToTitle();
                break;
        }
    }

    /**
     * テキストアニメーションをスキップ
     */
    skipTextAnimation() {
        if (this.endingText) {
            // 現在のエンディングの完全テキストを表示
            const endingData = this.loadEndingData(this.currentEnding);
            const fullText = this.currentEnding === 'true_end' ? 
                this.getTrueEndText(endingData) : 
                this.getBadEndText(endingData);
            
            this.endingText.innerHTML = fullText;
            this.onTextAnimationComplete();
        }
    }

    /**
     * タイトルに戻る
     */
    returnToTitle() {
        console.log('タイトル画面に戻る');
        this.game.audioManager.playSE('se_click.mp3', 0.7);
        
        // エンディング画面を完全に非表示
        this.hide();
        
        // 少し遅延してからタイトル画面を表示（DOMの更新を確実にするため）
        setTimeout(() => {
            this.game.showTitleScreen();
        }, 100);
    }

    /**
     * ゲームをリプレイ
     */
    replayGame() {
        console.log('ゲームをリプレイ');
        this.game.audioManager.playSE('se_click.mp3', 0.7);
        
        this.hide();
        this.game.startNewGame();
    }

    /**
     * エンディングクリア記録
     * @param {string} endingType - エンディングタイプ
     */
    recordEndingClear(endingType) {
        // セーブシステムにエンディング記録を保存
        const settings = this.game.saveSystem.loadSettings();
        
        if (!settings.clearedEndings) {
            settings.clearedEndings = [];
        }
        
        if (!settings.clearedEndings.includes(endingType)) {
            settings.clearedEndings.push(endingType);
            this.game.saveSystem.saveSettings(settings);
            
            console.log(`エンディングクリア記録: ${endingType}`);
        }
        
        // 統計情報更新
        this.updateStatistics(endingType);
    }

    /**
     * 統計情報を更新
     * @param {string} endingType - エンディングタイプ
     */
    updateStatistics(endingType) {
        const settings = this.game.saveSystem.loadSettings();
        
        if (!settings.statistics) {
            settings.statistics = {
                totalPlays: 0,
                trueEndCount: 0,
                badEndCount: 0,
                playTime: 0
            };
        }
        
        settings.statistics.totalPlays++;
        
        if (endingType === 'true_end') {
            settings.statistics.trueEndCount++;
        } else {
            settings.statistics.badEndCount++;
        }
        
        this.game.saveSystem.saveSettings(settings);
        
        console.log('統計情報更新:', settings.statistics);
    }

    /**
     * 現在の状態を取得（セーブ用）
     * @returns {Object} 状態オブジェクト
     */
    getState() {
        return {
            currentEnding: this.currentEnding,
            isActive: this.isActive
        };
    }

    /**
     * 状態を復元（ロード用）
     * @param {Object} state - 状態オブジェクト
     */
    setState(state) {
        this.currentEnding = state.currentEnding || null;
        this.isActive = state.isActive || false;
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
        this.currentEnding = null;
        console.log('EndingScene cleanup');
    }
}

// グローバルに公開
window.EndingScene = EndingScene;