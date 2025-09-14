/**
 * DialogueScene.js
 * 会話シーンを管理するクラス
 * 美咲の大きな立ち絵のみを表示し、テキスト表示と会話進行を処理
 */

class DialogueScene {
    constructor(gameController) {
        this.game = gameController;
        this.isActive = false;
        this.currentDialogueIndex = 0;
        this.dialogueQueue = [];
        
        // テキスト表示関連
        this.textSpeed = 50; // ミリ秒
        this.isTextAnimating = false;
        this.autoPlay = false;
        this.autoPlayDelay = 2000; // ミリ秒
        this.autoPlayTimer = null; // オートプレイタイマー
        
        // 美咲の現在の衣装を記録
        this.currentCostume = 'normal';
        
        // 前回表示した画像名を記録（同じ画像の再読み込みを防ぐ）
        this.lastDisplayedImage = '';
        
        // 前回指定されたsprite_file名を記録（継続使用のため）
        this.lastSpecifiedSprite = '';
        
        // DOM要素への参照
        this.dialogueScreen = null;
        this.misakiDisplay = null;
        this.dialogueBox = null;
        this.characterName = null;
        this.dialogueText = null;
        this.controlButtons = {};
        
        this.initialize();
    }

    /**
     * 会話シーンを初期化
     */
    initialize() {
        this.dialogueScreen = document.getElementById('dialogue-screen');
        this.misakiDisplay = document.getElementById('misaki-dialogue');
        this.dialogueBox = document.querySelector('.dialogue-box');
        this.characterName = document.querySelector('.character-name');
        this.dialogueText = document.getElementById('dialogue-text');
        
        // コントロールボタン
        this.controlButtons = {
            skip: document.getElementById('btn-skip'),
            auto: document.getElementById('btn-auto'),
            log: document.getElementById('btn-log'),
            save: document.getElementById('btn-save'),
            menu: document.getElementById('btn-menu')
        };
        
        this.setupEventListeners();
        console.log('DialogueScene初期化完了');
    }

    /**
     * イベントリスナーを設定
     */
    setupEventListeners() {
        // テキストクリックで次の会話へ
        if (this.dialogueBox) {
            this.dialogueBox.addEventListener('click', () => {
                this.onDialogueClick();
            });
        }

        // 美咲の画像クリック
        if (this.misakiDisplay) {
            this.misakiDisplay.addEventListener('click', () => {
                this.onMisakiClick();
            });
        }

        // コントロールボタン
        this.setupControlButtons();

        // キーボード操作
        document.addEventListener('keydown', (event) => {
            if (this.isActive) {
                this.handleKeyInput(event);
            }
        });
    }

    /**
     * コントロールボタンの設定
     */
    setupControlButtons() {
        // スキップボタン
        if (this.controlButtons.skip) {
            this.controlButtons.skip.addEventListener('click', () => {
                this.playDialogueSE('choice_select');
                this.skipDialogue();
            });
        }

        // オートボタン
        if (this.controlButtons.auto) {
            this.controlButtons.auto.addEventListener('click', () => {
                this.playDialogueSE('choice_select');
                this.toggleAutoPlay();
            });
        }

        // ログボタン
        if (this.controlButtons.log) {
            this.controlButtons.log.addEventListener('click', () => {
                this.playDialogueSE('page_turn');
                this.showLog();
            });
        }

        // セーブボタン
        if (this.controlButtons.save) {
            this.controlButtons.save.addEventListener('click', () => {
                this.playDialogueSE('choice_select');
                this.saveGame();
            });
        }

        // メニューボタン
        if (this.controlButtons.menu) {
            this.controlButtons.menu.addEventListener('click', () => {
                this.playDialogueSE('choice_select');
                this.showMenu();
            });
        }

        // タイトルへ戻るボタン
        const returnBtn = document.getElementById('dialogue-return-btn');
        if (returnBtn) {
            returnBtn.addEventListener('click', () => {
                this.playDialogueSE('choice_select');
                this.returnToTitle();
            });
        }

        // ボタンホバー効果
        // マウスホバー音（ClickSoundManagerと重複するため無効化）
        // Object.values(this.controlButtons).forEach(button => {
        //     if (button) {
        //         button.addEventListener('mouseenter', () => {
        //             this.game.audioManager.playSE('se_click.mp3', 0.2);
        //         });
        //     }
        // });
    }

    /**
     * 会話シーンを表示
     * @param {string} sceneId - シーンID
     * @param {Array} dialogues - 表示する会話データ
     */
    async show(sceneId = 'living', dialogues = null) {
        if (this.isActive) return;
        
        console.log(`会話シーン表示: ${sceneId}`);
        
        // victoryシーンの場合、特別な処理を行う
        if (sceneId === 'victory') {
            console.log('🏆 プレイヤー勝利後のトークシーン開始（美咲stage6を維持）');
            // 美咲の立ち絵をstage6に設定
            this.currentVictoryMode = true;
            this.victoryDressingMode = false;  // 着替えモードフラグ初期化
            
            // 専用CSVから勝利後トークを読み込み（エラー耐性版）
            try {
                await this.loadVictoryDialogueData();
            } catch (error) {
                console.error('🚨 loadVictoryDialogueData()でエラー発生:', error);
                console.log('🛡️ 緊急フォールバック実行');
                this.dialogueQueue = this.getFallbackVictoryData();
            }
            
            // 最終安全確認
            if (!this.dialogueQueue || this.dialogueQueue.length === 0) {
                console.error('🆘 【最終緊急処理】dialogueQueueが空のため強制設定');
                this.dialogueQueue = this.getFallbackVictoryData();
            }
            
            console.log(`🎯 【victory確定】dialogueQueue最終確認: ${this.dialogueQueue.length}件`);
        }
        
        // 会話データを設定（victoryの場合は既に設定済み）
        if (sceneId !== 'victory') {
            if (dialogues) {
                this.dialogueQueue = dialogues;
            } else {
                this.loadDialogueData(sceneId);
            }
        }
        
        // 会話シーン専用BGMを再生
        await this.game.audioManager.playSceneBGM('dialogue', 2.0);
        
        // CSVからの個別BGM設定があれば優先
        const sceneData = this.game.csvLoader.findData('scenes', 'scene_id', sceneId);
        if (sceneData && sceneData.bgm_file) {
            await this.game.audioManager.playBGM(sceneData.bgm_file, true, 1.5);
        }
        
        // 背景設定
        this.setupBackground(sceneId);
        
        // 画面表示（先に表示してからアニメーション）
        this.dialogueScreen.classList.add('active');
        this.isActive = true;
        this.currentDialogueIndex = 0;
        
        // 美咲の立ち絵設定（画面表示後に実行）
        requestAnimationFrame(() => {
            console.log('🖼️ 美咲の立ち絵を設定します');
            
            // 美咲の表示コンテナを確実に表示
            this.ensureMisakiDisplayVisible();
            
            // victoryモード（エンディングトーク）の場合は直接stage6立ち絵を表示
            if (sceneId === 'victory') {
                console.log('🏆 エンディングトーク: stage6立ち絵を直接設定');
                this.changeMisakiSpriteDirectly('misaki_game_stage6.png');
            } else {
                // 通常シーンの立ち絵設定
                this.setupMisakiDisplay();
            }
            
            // 最初の会話を表示（アニメーション完了待ち）
            setTimeout(() => {
                this.showNextDialogue();
            }, 500);
        });
    }

    /**
     * 会話シーンを非表示
     */
    hide() {
        if (!this.isActive) return;
        
        console.log('会話シーンを非表示');
        
        this.dialogueScreen.classList.remove('active');
        this.isActive = false;
        
        // オートプレイを停止
        this.stopAutoPlay();
        
        // テキストアニメーションを停止
        this.isTextAnimating = false;
        
        // victoryモードフラグをリセット
        this.currentVictoryMode = false;
        this.victoryDressingMode = false;
    }

    /**
     * 背景を設定
     * @param {string} sceneId - シーンID
     */
    setupBackground(sceneId) {
        const backgroundElement = document.getElementById('dialogue-bg');
        
        // victoryシーン（エンディングトーク）の場合は専用背景
        if (sceneId === 'victory') {
            console.log('🌙 エンディングトーク背景: bg_living_night.png');
            if (backgroundElement) {
                const imagePath = `./assets/images/backgrounds/bg_living_night.png`;
                backgroundElement.style.backgroundImage = `url('${imagePath}')`;
                backgroundElement.style.backgroundSize = 'cover';
                backgroundElement.style.backgroundPosition = 'center';
                backgroundElement.style.backgroundRepeat = 'no-repeat';
            }
            return;
        }
        
        // 通常シーンの背景処理
        const sceneData = this.game.csvLoader.findData('scenes', 'scene_id', sceneId);
        
        if (backgroundElement && sceneData && sceneData.background_image) {
            const imagePath = `./assets/images/backgrounds/${sceneData.background_image}`;
            backgroundElement.style.backgroundImage = `url('${imagePath}')`;
        } else {
            // デフォルト背景
            if (backgroundElement) {
                backgroundElement.style.background = 'linear-gradient(135deg, #2c2c2c 0%, #1a1a2e 100%)';
            }
        }
    }

    /**
     * 美咲の立ち絵を設定
     * @param {string} emotion - 表情 (オプション)
     * @param {number} costumeLevel - 衣装レベル (オプション)
     */
    setupMisakiDisplay(emotion = 'normal', costumeLevel = 1) {
        if (!this.misakiDisplay) return;
        
        // 🚨 victoryモードの場合は即座にstage6立ち絵を設定
        if (this.currentVictoryMode) {
            console.log('🏆 setupMisakiDisplay: victoryモード検出 - stage6を設定');
            this.changeMisakiSpriteDirectly('misaki_game_stage6.png');
            return;
        }
        
        // 初期衣装を normal に設定（重要：画像読み込み前に設定）
        this.currentCostume = 'normal';
        
        const imageName = 'misaki_dialogue_normal.png';
        const imagePath = `assets/images/characters/misaki/${imageName}`;
        const displayContainer = this.misakiDisplay.parentElement;
        
        const tempImage = new Image();
        tempImage.onload = () => {
            this.misakiDisplay.src = tempImage.src;
            this.misakiDisplay.style.display = 'block';
            this.misakiDisplay.style.visibility = 'visible';
            this.misakiDisplay.style.transition = '';
            this.misakiDisplay.style.opacity = '';
            this.misakiDisplay.classList.remove('misaki-costume-change');
            
            if (displayContainer && displayContainer.classList.contains('misaki-large-display')) {
                displayContainer.style.display = 'block';
                displayContainer.style.opacity = '1';
                displayContainer.style.visibility = 'visible';
            }
            
            requestAnimationFrame(() => {
                this.misakiDisplay.classList.add('misaki-costume-change');
                setTimeout(() => {
                    this.misakiDisplay.classList.remove('misaki-costume-change');
                }, 1200);
            });
        };
        
        tempImage.onerror = () => {
            this.createMisakiPlaceholder();
            this.misakiDisplay.style.display = 'block';
            this.misakiDisplay.style.opacity = '1';
            this.misakiDisplay.style.visibility = 'visible';
            
            if (displayContainer && displayContainer.classList.contains('misaki-large-display')) {
                displayContainer.style.display = 'block';
                displayContainer.style.opacity = '1';
                displayContainer.style.visibility = 'visible';
                displayContainer.classList.add('entrance');
            }
        };
        
        tempImage.src = imagePath;
    }

    /**
     * 美咲の表情変更（軽量版）- 現在は使用停止
     * 注意: changeMisakiCostume()のみを使用してください
     * @param {string} emotion - 表情
     */
    changeMisakiEmotion(emotion = 'normal') {
        console.warn(`⚠️ changeMisakiEmotion()は現在使用停止中です。changeMisakiCostume()を使用してください。`);
        console.log(`📋 要求された表情: ${emotion}`);
        console.log(`🔄 changeMisakiCostume(${this.currentCostume}, ${emotion})に変換します`);
        
        // 現在の衣装で表情変更を実行
        this.changeMisakiCostume(this.currentCostume || 'normal', emotion);
    }
    
    /**
     * 美咲の立ち絵を直接ファイル名で変更（CSVのsprite_file用）
     * @param {string} spriteName - 画像ファイル名（拡張子付き）
     */
    changeMisakiSpriteDirectly(spriteName) {
        if (!this.misakiDisplay) {
            console.error(`❌ misakiDisplay要素が見つかりません`);
            return;
        }
        
        if (this.lastDisplayedImage === spriteName) {
            return;
        }
        
        this.lastDisplayedImage = spriteName;
        const imagePath = `assets/images/characters/misaki/${spriteName}`;
        
        console.log(`📸 立ち絵変更: ${spriteName}`);
        
        const tempImage = new Image();
        tempImage.onload = () => {
            this.misakiDisplay.style.transition = '';
            this.misakiDisplay.style.opacity = '';
            this.misakiDisplay.classList.remove('misaki-costume-change');
            this.misakiDisplay.src = tempImage.src;
            
            requestAnimationFrame(() => {
                this.misakiDisplay.classList.add('misaki-costume-change');
                setTimeout(() => {
                    this.misakiDisplay.classList.remove('misaki-costume-change');
                }, 1200);
            });
        };
        
        tempImage.onerror = () => {
            console.error(`❌ 画像が見つかりません: ${spriteName}`);
        };
        
        tempImage.src = imagePath;
    }
    
    /**
     * 美咲の衣装変更
     * @param {string} costume - 衣装タイプ (normal, casual, roomwear等)
     * @param {string} emotion - 表情
     */
    changeMisakiCostume(costume = 'normal', emotion = 'normal') {
        if (!this.misakiDisplay) {
            console.error(`❌ misakiDisplay要素が見つかりません`);
            return;
        }
        
        // 衣装と表情を組み合わせた画像名
        let imageName;
        if (!emotion || emotion === 'normal' || emotion === null) {
            // emotionがない場合は衣装名のみ
            imageName = `misaki_dialogue_${costume}.png`;
        } else {
            // emotionがある場合は衣装名_表情
            imageName = `misaki_dialogue_${costume}_${emotion}.png`;
        }
        
        // 🔍 同じ画像の場合はスキップ（アニメーションも実行しない）
        if (this.lastDisplayedImage === imageName) {
            console.log(`🔒 【画像維持】同じ画像のため変更をスキップ: ${imageName}`);
            return;
        }
        
        // 現在の衣装を記録
        this.currentCostume = costume;
        this.lastDisplayedImage = imageName;
        
        // キャッシュバスター追加（画像更新を即反映）
        const cacheBuster = `?v=${Date.now()}_${Math.random().toString(36).substring(7)}`;
        const imagePath = `assets/images/characters/misaki/${imageName}${cacheBuster}`;
        
        console.log(`👗 【衣装変更開始】: ${costume} + ${emotion}`);
        console.log(`📁 【画像パス】: ${imagePath}`);
        console.log(`🖼️ 【現在のsrc】: ${this.misakiDisplay.src}`);
        console.log(`📂 【ファイル存在確認】画像名: ${imageName}`);
        
        // 画像のプリロード処理
        const tempImage = new Image();
        console.log(`🚀 【Image()オブジェクト作成】`);
        
        tempImage.onload = () => {
            console.log(`✅ 【画像読み込み成功】: ${imageName}`);
            console.log(`📸 【実際のURL】: ${tempImage.src}`);
            console.log(`📏 【画像サイズ】: ${tempImage.width}x${tempImage.height}`);
            
            // タイトル画面と同じアニメーション適用
            // 1. 古いスタイルをリセット
            this.misakiDisplay.style.transition = '';
            this.misakiDisplay.style.opacity = '';
            
            // 2. クラスを一旦削除（アニメーションリセット）
            this.misakiDisplay.classList.remove('misaki-costume-change');
            
            // 3. 画像を即座に変更（アニメーション前）
            this.misakiDisplay.src = tempImage.src;
            
            // 4. 次のフレームでアニメーションクラス追加
            requestAnimationFrame(() => {
                this.misakiDisplay.classList.add('misaki-costume-change');
                console.log(`🎊 衣装変更アニメーション開始: ${imageName}`);
                
                // アニメーション終了後にクラスを削除（1.2秒後）
                setTimeout(() => {
                    this.misakiDisplay.classList.remove('misaki-costume-change');
                    console.log(`✨ 衣装変更完了: ${imageName}`);
                }, 1200);
            });
        };
        
        tempImage.onerror = () => {
            console.error(`❌ 【画像読み込み失敗】: ${imagePath}`);
            
            // 段階的フォールバック戦略（キャッシュバスター付き）
            const fallbackOptions = [
                `assets/images/characters/misaki/misaki_dialogue_${costume}.png${cacheBuster}`, // 表情なし版
                `assets/images/characters/misaki/misaki_dialogue_normal.png${cacheBuster}`,     // 基本画像
                `assets/images/characters/misaki/misaki_adult_normal.png${cacheBuster}`         // 最終手段
            ];
            
            console.warn(`⚠️ 【フォールバック開始】元画像: ${imageName}`);
            
            this.tryFallbackImages(fallbackOptions, 0);
        };
        
        console.log(`🔄 【画像読み込み開始】: ${imagePath}`);
        console.log(`⏰ 【現在時刻】: ${new Date().toISOString()}`);
        
        // 画像読み込み開始
        tempImage.src = imagePath;
        console.log(`📤 【tempImage.src設定完了】画像読み込み処理を開始しました`);
    }
    
    /**
     * フォールバック画像を順次試行
     * @param {Array} fallbackOptions - フォールバック画像パスの配列
     * @param {number} index - 現在のインデックス
     */
    tryFallbackImages(fallbackOptions, index) {
        if (index >= fallbackOptions.length) {
            console.error(`🆘 【全フォールバック失敗】すべての代替画像が見つかりませんでした`);
            return;
        }
        
        const fallbackPath = fallbackOptions[index];
        console.log(`📁 【フォールバック${index + 1}】試行: ${fallbackPath}`);
        
        const fallbackImg = new Image();
        fallbackImg.onload = () => {
            console.log(`✅ 【フォールバック${index + 1}成功】: ${fallbackPath}`);
            
            // タイトル画面と同じアニメーション適用（フォールバック版）
            this.misakiDisplay.style.transition = '';
            this.misakiDisplay.style.opacity = '';
            this.misakiDisplay.classList.remove('misaki-costume-change');
            
            // 画像を変更（すでにキャッシュバスター付き）
            this.misakiDisplay.src = fallbackImg.src;
            
            // アニメーション適用
            requestAnimationFrame(() => {
                this.misakiDisplay.classList.add('misaki-costume-change');
                setTimeout(() => {
                    this.misakiDisplay.classList.remove('misaki-costume-change');
                }, 1200);
            });
        };
        fallbackImg.onerror = () => {
            console.error(`❌ 【フォールバック${index + 1}失敗】: ${fallbackPath}`);
            // 次のフォールバックを試行
            this.tryFallbackImages(fallbackOptions, index + 1);
        };
        fallbackImg.src = fallbackPath;
    }

    /**
     * 美咲の表示コンテナが確実に表示されるようにする
     */
    ensureMisakiDisplayVisible() {
        const misakiContainer = document.querySelector('.misaki-large-display');
        
        if (misakiContainer) {
            misakiContainer.style.display = 'block';
            misakiContainer.style.opacity = '1';
            misakiContainer.style.visibility = 'visible';
        }
        
        if (this.misakiDisplay) {
            this.misakiDisplay.style.display = 'block';
            this.misakiDisplay.style.opacity = '1';
        }
    }
    
    /**
     * 美咲のプレースホルダー画像を作成
     */
    createMisakiPlaceholder() {
        const placeholder = `data:image/svg+xml;charset=UTF-8,%3Csvg width='400' height='600' xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='100%25' height='100%25' fill='%23ffb6c1'/%3E%3Ctext x='50%25' y='45%25' font-family='Arial' font-size='24' fill='%23fff' text-anchor='middle'%3E美咲お姉ちゃん%3C/text%3E%3Ctext x='50%25' y='55%25' font-family='Arial' font-size='16' fill='%23fff' text-anchor='middle'%3E(25歳 OL)%3C/text%3E%3C/svg%3E`;
        this.misakiDisplay.src = placeholder;
        console.log('⚠️ 美咲のプレースホルダーを表示しました');
    }

    /**
     * 5回勝利後の専用トークデータを読み込み（堅牢版）
     */
    async loadVictoryDialogueData() {
        console.log('🏆 【緊急確実版】勝利後トークデータを読み込み中...');
        
        // 🚨 最優先：フォールバックデータを先に準備
        const fallbackData = this.getFallbackVictoryData();
        console.log(`🛡️ フォールバックデータ準備完了: ${fallbackData.length}件`);
        
        // CSVローダーが存在しない場合は即座にフォールバック
        if (!this.game.csvLoader) {
            console.warn('⚠️ CSVローダーがありません - フォールバック使用');
            this.dialogueQueue = fallbackData;
            console.log(`✅ フォールバックデータ設定完了: ${this.dialogueQueue.length}件`);
            return;
        }
        
        // CSV読み込みを試行（キャッシュクリア + 強制読み込み）
        let csvSuccess = false;
        try {
            console.log('🔄 victory_talk.csvを強制読み込み中（キャッシュクリア）...');
            
            // 🚨 既存のvictory_talkキャッシュを削除
            if (this.game.csvLoader.csvData['victory_talk']) {
                delete this.game.csvLoader.csvData['victory_talk'];
                console.log('🗑️ 古いvictory_talkキャッシュを削除');
            }
            
            // 強制読み込み実行
            await this.game.csvLoader.loadCSV('victory_talk.csv');
            console.log('✅ victory_talk.csv強制読み込み完了');
            
            // CSVデータ取得を試行
            const victoryTalks = this.game.csvLoader.getTableData('victory_talk');
            console.log('🔍 読み込み後のCSVデータ確認:', victoryTalks ? victoryTalks.length : 'null');
            
            if (victoryTalks && victoryTalks.length >= 22) {
                // CSV読み込み成功（更新版エンディング）
                console.log('✅ CSV読み込み成功！最新エンディングデータを使用');
                
                // sequence_order順にソート
                victoryTalks.sort((a, b) => parseInt(a.sequence_order) - parseInt(b.sequence_order));
                
                // DialogueSceneの形式に変換
                this.dialogueQueue = victoryTalks.map(talk => ({
                    dialogue_id: talk.talk_id,
                    scene_id: 'victory',
                    character_id: talk.character,
                    text: talk.text,
                    emotion: talk.emotion,
                    voice_file: talk.voice_file || '',
                    next_id: talk.next_id || ''
                }));
                
                csvSuccess = true;
                console.log(`✅ CSV最新エンディングデータ使用: ${this.dialogueQueue.length}件（完全更新版）`);
            }
        } catch (error) {
            console.error('❌ CSV読み込み失敗:', error);
        }
        
        // CSV失敗時は確実にフォールバックを使用
        if (!csvSuccess) {
            console.warn('🚨 CSV読み込み失敗 - 確実フォールバック実行');
            this.dialogueQueue = fallbackData;
        }
        
        // 最終確認：dialogueQueueが確実に設定されているか
        if (!this.dialogueQueue || this.dialogueQueue.length === 0) {
            console.error('🆘 dialogueQueueが空！緊急フォールバック実行');
            this.dialogueQueue = fallbackData;
        }
        
        console.log(`🎯 【最終確認】dialogueQueue設定完了: ${this.dialogueQueue.length}件`);
        this.dialogueQueue.forEach((d, i) => {
            console.log(`  [${i}] ${d.dialogue_id}: "${d.text.substring(0, 25)}..."`);
        });
    }

    /**
     * 勝利後トーク用の完全フォールバックデータ（最新CSV版22件）
     * @returns {Array} フォールバックダイアログデータ
     */
    getFallbackVictoryData() {
        console.log('🚨 【緊急フォールバック】victory_talk最新22件データを使用');
        return [
            {
                dialogue_id: 'vt001',
                scene_id: 'victory',
                character_id: 'misaki',
                text: 'や、野球拳になった途端、強すぎじゃない...?',
                emotion: 'surprised',
                voice_file: 'v_victory_01.mp3',
                next_id: 'vt002'
            },
            {
                dialogue_id: 'vt002',
                scene_id: 'victory',
                character_id: 'player_thought',
                text: '美咲の顔が真っ赤になっている。まさか本当に勝ってしまうなんて...',
                emotion: '',
                voice_file: '',
                next_id: 'vt003'
            },
            {
                dialogue_id: 'vt003',
                scene_id: 'victory',
                character_id: 'misaki',
                text: 'まさか本当に負けちゃうなんて思ってなかった...',
                emotion: 'embarrassed',
                voice_file: 'v_victory_02.mp3',
                next_id: 'vt004'
            },
            {
                dialogue_id: 'vt004',
                scene_id: 'victory',
                character_id: 'player_thought',
                text: '美咲の抜群のスタイルに言葉が出ない。',
                emotion: '',
                voice_file: '',
                next_id: 'vt005'
            },
            {
                dialogue_id: 'vt005',
                scene_id: 'victory',
                character_id: 'misaki',
                text: 'そんなにジロジロ見ないでよ…',
                emotion: 'resigned',
                voice_file: 'v_victory_03.mp3',
                next_id: 'vt006'
            },
            {
                dialogue_id: 'vt006',
                scene_id: 'victory',
                character_id: 'player_thought',
                text: '美咲がこんなに恥ずかしそうにしているのを見るのは初めてだ。',
                emotion: '',
                voice_file: '',
                next_id: 'vt007'
            },
            {
                dialogue_id: 'vt007',
                scene_id: 'victory',
                character_id: 'player',
                text: 'ご、ごめん…。',
                emotion: 'nervous',
                voice_file: 'v_victory_04.mp3',
                next_id: 'vt008'
            },
            {
                dialogue_id: 'vt008',
                scene_id: 'victory',
                character_id: 'player_thought',
                text: '急に照れ臭くなり目を背けてしまった。',
                emotion: '',
                voice_file: '',
                next_id: 'vt009'
            },
            {
                dialogue_id: 'vt009',
                scene_id: 'victory',
                character_id: 'misaki',
                text: 'も…もう服着るよ…?弟帰ってくるかもしれないから…',
                emotion: 'hopeful',
                sprite_stage: 'dressing',
                voice_file: 'v_victory_05.mp3',
                next_id: 'vt010'
            },
            {
                dialogue_id: 'vt010',
                scene_id: 'victory',
                character_id: 'player_thought',
                text: 'この時間をずっと目に焼き付けておきたいが、たしかにあいつが返ってくるかも…',
                emotion: '',
                voice_file: '',
                next_id: 'vt011'
            },
            {
                dialogue_id: 'vt011',
                scene_id: 'victory',
                character_id: 'player',
                text: 'もうちょっと見ておきたいけど…わかった。',
                emotion: 'impressed',
                voice_file: 'v_victory_06.mp3',
                next_id: 'vt012'
            },
            {
                dialogue_id: 'vt012',
                scene_id: 'victory',
                character_id: 'misaki',
                text: '見ておきたいとか言わないの！',
                emotion: '',
                voice_file: '',
                next_id: 'vt013'
            },
            {
                dialogue_id: 'vt013',
                scene_id: 'victory',
                character_id: 'player_thought',
                text: '美咲との距離が縮まった気がする。こんな時間がずっと続けばいいのに。',
                emotion: 'teasing',
                voice_file: 'v_victory_07.mp3',
                next_id: 'vt014'
            },
            {
                dialogue_id: 'vt014',
                scene_id: 'victory',
                character_id: 'sound_effect',
                text: '――ガチャ！（玄関のドアが開く音）...ただいまー！！',
                emotion: '',
                voice_file: '',
                next_id: 'vt015'
            },
            {
                dialogue_id: 'vt015',
                scene_id: 'victory',
                character_id: 'misaki',
                text: 'え？...ほんとに帰ってきちゃったよー！',
                emotion: 'accepting',
                voice_file: 'v_victory_08.mp3',
                next_id: 'vt016'
            },
            {
                dialogue_id: 'vt016',
                scene_id: 'victory',
                character_id: 'player',
                text: 'ど、どうしよう…',
                emotion: '',
                voice_file: '',
                next_id: 'vt017'
            },
            {
                dialogue_id: 'vt017',
                scene_id: 'victory',
                character_id: 'misaki',
                text: 'お風呂場に隠れるから変なこと言わないでね！！',
                emotion: 'curious',
                voice_file: 'v_victory_09.mp3',
                next_id: 'vt018'
            },
            {
                dialogue_id: 'vt018',
                scene_id: 'victory',
                character_id: 'misaki',
                text: 'ま、また勝負してあげてもいいよ…?',
                emotion: '',
                voice_file: '',
                next_id: 'vt019'
            },
            {
                dialogue_id: 'vt019',
                scene_id: 'victory',
                character_id: 'player_thought',
                text: '美咲の急な提案に戸惑いと嬉しさがこみ上げる。',
                emotion: 'warning',
                voice_file: 'v_victory_10.mp3',
                next_id: 'vt020'
            },
            {
                dialogue_id: 'vt020',
                scene_id: 'victory',
                character_id: 'player_thought',
                text: '美咲が慌ててお風呂場へ走っていく。',
                emotion: '',
                voice_file: '',
                next_id: 'vt021'
            },
            {
                dialogue_id: 'vt021',
                scene_id: 'victory',
                character_id: 'player_thought',
                text: '今回の勝負で美咲との距離が縮まった気がする。',
                emotion: '',
                voice_file: '',
                next_id: 'vt022'
            },
            {
                dialogue_id: 'vt022',
                scene_id: 'victory',
                character_id: 'player_thought',
                text: 'こんな時間がずっと続けばいいのに…',
                emotion: 'surprised',
                voice_file: '',
                next_id: ''
            }
        ];
    }

    /**
     * 会話データを読み込み（修正版：正しいデータを直接使用）
     * @param {string} sceneId - シーンID
     */
    loadDialogueData(sceneId) {
        console.log(`✅ 会話データを読み込み: ${sceneId}`);
        
        // 画像記録をリセット
        this.lastDisplayedImage = '';
        this.lastSpecifiedSprite = '';
        
        // CSVパース問題を回避：正しいデータを直接使用
        this.dialogueQueue = this.getCorrectDialogueData(sceneId);
        console.log(`🎉 正しい会話データを使用: ${this.dialogueQueue.length} 件`);
    }

    /**
     * 正しい会話データを取得（CSV問題の解決版）
     * @param {string} sceneId - シーンID
     * @returns {Array} 会話データ配列
     */
    getCorrectDialogueData(sceneId) {
        if (sceneId !== 'living') {
            return this.getFallbackDialogueData(sceneId);
        }
        
        // CSVから抽出した正しいデータを直接使用
        return [
            { dialogue_id: 'd001', scene_id: 'living', character_id: 'player', text: 'よっ、美咲! 今日もプリン作ったー？', emotion: '', costume: '', voice_file: 'v_001.mp3', next_id: 'd002', sprite_file: 'misaki_dialogue_normal.png' },
            { dialogue_id: 'd002', scene_id: 'living', character_id: 'misaki', text: '作ったけど、あげるかどうかは気分次第かな～♪', emotion: '', costume: '', voice_file: '', next_id: 'd003', sprite_file: '' },
            { dialogue_id: 'd003', scene_id: 'living', character_id: 'player_thought', text: '美咲は小学校の頃から家族ぐるみで付き合いのある"親友の姉"。', emotion: '', costume: '', voice_file: '', next_id: 'd004', sprite_file: '' },
            { dialogue_id: 'd004', scene_id: 'living', character_id: 'player_thought', text: '面倒見がよくて、ちょっとだけ意地悪だ。今は学校の先生をやっている。――親友はまだ帰って来てないようだ。', emotion: '', costume: '', voice_file: '', next_id: 'd005', sprite_file: '' },
            { dialogue_id: 'd005', scene_id: 'living', character_id: 'misaki', text: 'ねぇ、あ～んする？', emotion: 'teasing', costume: 'casual', voice_file: 'v_004.mp3', next_id: 'd006', sprite_file: 'misaki_dialogue_casual_teasing.png' },
            { dialogue_id: 'd006', scene_id: 'living', character_id: 'player_thought', text: '急に来た問いに戸惑ってしまう。', emotion: '', costume: '', voice_file: '', next_id: 'd007', sprite_file: '' },
            { dialogue_id: 'd007', scene_id: 'living', character_id: 'player_thought', text: '昔、1つのプリンを美咲と二人で食べていたころが懐かしい。鼻先をかすめた甘い匂いは、あの頃と同じだ。', emotion: '', costume: '', voice_file: '', next_id: 'd008', sprite_file: '' },
            { dialogue_id: 'd008', scene_id: 'living', character_id: 'player', text: '...何か勝負で勝てたら、ちゃんと"あ～ん"して。', emotion: '', costume: '', voice_file: '', next_id: 'd008a', sprite_file: '' },
            { dialogue_id: 'd008a', scene_id: 'living', character_id: 'misaki', text: 'じゃあ何で勝負するー？ 前にやった腕相撲とか？', emotion: 'playful', costume: 'casual', voice_file: '', next_id: 'd009', sprite_file: 'misaki_dialogue_casual_smile.png' },
            { dialogue_id: 'd009', scene_id: 'living', character_id: 'player_thought', text: '美咲は、笑いながら話してくる…。美咲の腕相撲には勝ったことがない…。', emotion: '', costume: '', voice_file: '', next_id: 'd009a', sprite_file: '' },
            { dialogue_id: 'd009a', scene_id: 'living', character_id: 'player', text: '腕相撲で秒殺されたのはトラウマだ…', emotion: '', costume: '', voice_file: '', next_id: 'd010', sprite_file: '' },
            { dialogue_id: 'd010', scene_id: 'living', character_id: 'misaki', text: '弱すぎるのよ♪', emotion: 'confident', costume: 'casual', voice_file: 'v_007.mp3', next_id: 'd011', sprite_file: '' },
            { dialogue_id: 'd011', scene_id: 'living', character_id: 'player', text: '弱かったんじゃなくて油断してただけなんだよ！', emotion: '', costume: '', voice_file: '', next_id: 'd012', sprite_file: '' },
            { dialogue_id: 'd012', scene_id: 'living', character_id: 'misaki', text: 'はいはい、負け惜しみ～♪腕相撲一回やってみようよ♪', emotion: 'teasing', costume: 'casual', voice_file: 'v_008.mp3', next_id: 'd013', sprite_file: 'misaki_dialogue_casual_seductive.png' },
            { dialogue_id: 'd013', scene_id: 'living', character_id: 'player_thought', text: '美咲が身を乗り出した拍子に、視線が襟元に向かってしまう。控えめに言っても大きい胸だ。', emotion: '', costume: '', voice_file: '', next_id: 'd014', sprite_file: '' },
            { dialogue_id: 'd014', scene_id: 'living', character_id: 'player', text: 'い…,一回だけな…。', emotion: '', costume: '', voice_file: '', next_id: 'd014a', sprite_file: '' },
            { dialogue_id: 'd014a', scene_id: 'living', character_id: 'sound_effect', text: '――ドンッ！', emotion: '', costume: '', voice_file: '', next_id: 'd015', sprite_file: '' },
            { dialogue_id: 'd015', scene_id: 'living', character_id: 'player', text: '、、、え？', emotion: '', costume: '', voice_file: '', next_id: 'd016', sprite_file: '' },
            { dialogue_id: 'd016', scene_id: 'living', character_id: 'player_thought', text: 'あっけなく終わった。言うまでもなく美咲の勝ちだ。', emotion: '', costume: '', voice_file: '', next_id: 'd017', sprite_file: '' },
            { dialogue_id: 'd017', scene_id: 'living', character_id: 'misaki', text: '胸ばっかり見てるからだよ♪相変わらず弱いね♪', emotion: '', costume: '', voice_file: '', next_id: 'd018', sprite_file: 'misaki_dialogue_casual_smile.png' },
            { dialogue_id: 'd018', scene_id: 'living', character_id: 'player', text: 'み…見てないし！', emotion: '', costume: '', voice_file: '', next_id: 'd019', sprite_file: '' },
            { dialogue_id: 'd019', scene_id: 'living', character_id: 'player_thought', text: '美咲はおなかを押さえて笑っている。', emotion: '', costume: '', voice_file: '', next_id: 'd020', sprite_file: '' },
            { dialogue_id: 'd020', scene_id: 'living', character_id: 'misaki', text: 'ん－、なんだったら勝てるかなぁー？シンプルにじゃんけん？', emotion: '', costume: '', voice_file: '', next_id: 'd021', sprite_file: '' },
            { dialogue_id: 'd021', scene_id: 'living', character_id: 'player', text: 'じゃんけんなら勝てる！！！！！', emotion: '', costume: '', voice_file: '', next_id: 'd022', sprite_file: '' },
            { dialogue_id: 'd022', scene_id: 'living', character_id: 'misaki', text: '普通のじゃんけんだとつまらないし…。野球拳でもやってみる…？', emotion: '', costume: '', voice_file: '', next_id: 'd023', sprite_file: 'misaki_dialogue_casual_shy.png' },
            { dialogue_id: 'd023', scene_id: 'living', character_id: 'player_thought', text: '少しずつ美咲の顔が赤くなっているように見える。', emotion: '', costume: '', voice_file: '', next_id: 'd024', sprite_file: '' },
            { dialogue_id: 'd024', scene_id: 'living', character_id: 'player', text: '、、、まじ？、、、じゃんけん負けたら脱ぐやつだよね!？', emotion: '', costume: '', voice_file: '', next_id: 'd025', sprite_file: '' },
            { dialogue_id: 'd025', scene_id: 'living', character_id: 'misaki', text: 'うん…初めてだけど…。', emotion: '', costume: '', voice_file: '', next_id: 'd026', sprite_file: '' },
            { dialogue_id: 'd026', scene_id: 'living', character_id: 'player_thought', text: 'なぜ普通のじゃんけんではなく野球拳なのか、いろいろな考えが俺の頭の中をグルグルしている。', emotion: '', costume: '', voice_file: '', next_id: 'd027', sprite_file: '' },
            { dialogue_id: 'd027', scene_id: 'living', character_id: 'player_thought', text: '美咲への隠していた想いと下心が交差する。', emotion: '', costume: '', voice_file: '', next_id: 'd028', sprite_file: '' },
            { dialogue_id: 'd028', scene_id: 'living', character_id: 'misaki', text: 'いやなら...やめるけど？', emotion: '', costume: '', voice_file: '', next_id: 'd029', sprite_file: '' },
            { dialogue_id: 'd029', scene_id: 'living', character_id: 'player', text: 'やる！やります！やらせていただきます！', emotion: '', costume: '', voice_file: 'game_start', next_id: '', sprite_file: '' }
        ];
    }

    /**
     * フォールバック会話データを取得
     * @param {string} sceneId - シーンID
     * @returns {Array} 会話データ配列
     */
    getFallbackDialogueData(sceneId) {
        console.log(`⚠️ フォールバックデータを使用: ${sceneId}`);
        const fallbackDialogues = {
            'living': [
                { dialogue_id: 'd001', scene_id: 'living', character_id: 'player', text: 'よっ、美咲。今日もプリン作ったー？', emotion: '', voice_file: 'v_001.mp3', next_id: 'd002' },
                { dialogue_id: 'd002', scene_id: 'living', character_id: 'misaki', text: '作ったけど、あげるかどうかは気分次第かな～♪', emotion: 'smile', voice_file: '', next_id: 'd003' },
                { dialogue_id: 'd003', scene_id: 'living', character_id: 'player_thought', text: '美咲は小学校の頃から家族ぐるみで付き合いのある"親友の姉"。', emotion: '', voice_file: '', next_id: 'd004' },
                { dialogue_id: 'd004', scene_id: 'living', character_id: 'player_thought', text: '面倒見がよくて、ちょっとだけ意地悪だ。今は学校の先生をやっている。――親友はまだ帰って来てないようだ。', emotion: '', voice_file: '', next_id: 'd005' },
                { dialogue_id: 'd005', scene_id: 'living', character_id: 'misaki', text: 'ねぇ、あ～んする？', emotion: 'teasing', voice_file: 'v_004.mp3', next_id: 'd006' },
                { dialogue_id: 'd006', scene_id: 'living', character_id: 'player_thought', text: '急に来た問いに戸惑ってしまう。', emotion: '', voice_file: '', next_id: 'd007' },
                { dialogue_id: 'd007', scene_id: 'living', character_id: 'player_thought', text: '昔、1つのプリンを美咲と二人で食べていたころが懐かしい。鼻先をかすめた甘い匂いは、あの頃と同じだ。', emotion: '', voice_file: '', next_id: 'd008' },
                { dialogue_id: 'd008', scene_id: 'living', character_id: 'player', text: '何か勝負で勝てたら、ちゃんと"あ～ん"して。', emotion: '', voice_file: '', next_id: 'd009' },
                { dialogue_id: 'd009', scene_id: 'living', character_id: 'misaki', text: 'じゃあ、野球拳で勝負する？', emotion: 'seductive', voice_file: 'v_009.mp3', next_id: 'game_start' }
            ],
            'game': [
                { dialogue_id: 'd010', scene_id: 'game', character_id: 'misaki', text: '準備はいい？じゃんけん...ぽん！', emotion: 'ready', voice_file: 'v_007.mp3', next_id: '' },
                { dialogue_id: 'd011', scene_id: 'game', character_id: 'misaki', text: 'あら、私の勝ちね。約束は約束よ', emotion: 'win_confident', voice_file: 'v_008.mp3', next_id: '' },
                { dialogue_id: 'd012', scene_id: 'game', character_id: 'misaki', text: 'きゃっ...まさか負けるなんて', emotion: 'lose_surprised', voice_file: 'v_009.mp3', next_id: '' }
            ],
            'victory': [
                { dialogue_id: 'victory_start', scene_id: 'victory', character_id: 'misaki', text: 'や、野球拳になった途端、強すぎじゃない...?', emotion: 'surprised', voice_file: '', next_id: '' }
            ],
            'true_end': [
                { dialogue_id: 'd015', scene_id: 'true_end', character_id: 'misaki', text: 'あなたの勝ちよ...大人になったのね', emotion: 'defeated_loving', voice_file: 'v_012.mp3', next_id: '' }
            ],
            'bad_end': [
                { dialogue_id: 'd016', scene_id: 'bad_end', character_id: 'misaki', text: 'あらあら、まだまだ子供ねぇ♪', emotion: 'victory_teasing', voice_file: 'v_013.mp3', next_id: '' }
            ]
        };
        
        const data = fallbackDialogues[sceneId] || [];
        console.log(`📋 フォールバックデータを返却: ${data.length} 件`);
        return data;
    }

    /**
     * 次の会話を表示（安全版）
     */
    showNextDialogue() {
        console.log(`🎯 showNextDialogue() 呼び出し - currentIndex:${this.currentDialogueIndex}, queueLength:${this.dialogueQueue.length}`);
        
        // 🚨 緊急安全確認：victoryモードでdialogueQueueが空の場合
        if (this.currentVictoryMode && (!this.dialogueQueue || this.dialogueQueue.length === 0)) {
            console.error('🆘 【緊急】victoryモードでdialogueQueueが空！フォールバック実行');
            this.dialogueQueue = this.getFallbackVictoryData();
            this.currentDialogueIndex = 0;
            console.log(`🛡️ 緊急フォールバック完了: ${this.dialogueQueue.length}件`);
        }
        
        if (this.currentDialogueIndex >= this.dialogueQueue.length) {
            // 会話終了
            console.log('🎬 会話終了 - onDialogueComplete()を呼び出し');
            this.playDialogueSE('dialogue_end');
            this.onDialogueComplete();
            return;
        }
        
        const dialogue = this.dialogueQueue[this.currentDialogueIndex];
        console.log(`📢 次の会話表示 - dialogue_id:${dialogue ? dialogue.dialogue_id : 'undefined'}`);
        console.log(`📝 テキスト内容: "${dialogue ? dialogue.text.substring(0, 30) : 'undefined'}..."`);
        
        // ダイアログデータが存在しない場合の緊急処理
        if (!dialogue) {
            console.error('🚨 dialogue データが null または undefined');
            if (this.currentVictoryMode) {
                console.log('🛡️ victoryモード用緊急フォールバック再実行');
                this.dialogueQueue = this.getFallbackVictoryData();
                this.currentDialogueIndex = 0;
                const emergencyDialogue = this.dialogueQueue[0];
                if (emergencyDialogue) {
                    this.displayDialogue(emergencyDialogue);
                    this.currentDialogueIndex++;
                }
            }
            return;
        }
        
        this.displayDialogue(dialogue);
        this.currentDialogueIndex++;
        console.log(`⬆️ インデックス更新完了 - 新しいIndex:${this.currentDialogueIndex}`);
    }

    /**
     * 会話を表示
     * @param {Object} dialogue - 会話データ
     */
    displayDialogue(dialogue) {
        if (!dialogue) {
            console.error('❌ dialogueデータが空です');
            return;
        }
        
        console.log(`💬 ${dialogue.dialogue_id}: ${dialogue.character_id} - "${dialogue.text.substring(0, 30)}..."`);
        if (dialogue.sprite_file) {
            console.log(`🎨 立ち絵: ${dialogue.sprite_file}`);
        }
        
        // キャラクター名を設定
        if (this.characterName) {
            if (dialogue.character_id === 'misaki') {
                this.characterName.textContent = '美咲';
                this.characterName.style.color = '#ffb6c1';
                this.characterName.style.fontStyle = 'normal';
            } else if (dialogue.character_id === 'player_thought') {
                this.characterName.textContent = '心の声';
                this.characterName.style.color = '#ffd700';
                this.characterName.style.fontStyle = 'italic';
            } else if (dialogue.character_id === 'misaki_thought') {
                this.characterName.textContent = '美咲の心の声';
                this.characterName.style.color = '#ff9999';
                this.characterName.style.fontStyle = 'italic';
            } else if (dialogue.character_id === 'sound_effect') {
                this.characterName.textContent = ''; // 効果音は名前表示なし
                this.characterName.style.color = '#ffffff';
                this.characterName.style.fontStyle = 'normal';
            } else {
                this.characterName.textContent = 'あなた';
                this.characterName.style.color = '#7ed6c4';
                this.characterName.style.fontStyle = 'normal';
            }
        }
        
        // 立ち絵制御
        if (this.currentVictoryMode) {
            // プレイヤー勝利後のsprite_stage対応
            if (dialogue.dialogue_id === 'vt009') {
                // vt009: misaki_dialogue_dressing.pngに切り替え
                console.log('👗 vt009: 着替え中立ち絵に切り替え');
                this.changeMisakiSpriteDirectly('misaki_dialogue_dressing.png');
                this.victoryDressingMode = true;  // 着替えモードフラグを設定
            } else if (this.victoryDressingMode) {
                // vt009以降: misaki_dialogue_dressing.png継続表示
                console.log('👗 着替え中立ち絵を継続表示');
                this.changeMisakiSpriteDirectly('misaki_dialogue_dressing.png');
            } else {
                // vt001-vt008: stage6（完全敗北状態）の立ち絵を使用
                const stage6Sprite = 'misaki_game_stage6.png';
                console.log('🏆 勝利モード: stage6立ち絵を表示');
                this.changeMisakiSpriteDirectly(stage6Sprite);
            }
        } else if (dialogue.sprite_file && dialogue.sprite_file.trim() !== '') {
            const spriteName = dialogue.sprite_file.trim();
            this.lastSpecifiedSprite = spriteName;
            this.changeMisakiSpriteDirectly(spriteName);
        }
        else if (this.lastSpecifiedSprite !== '') {
            this.changeMisakiSpriteDirectly(this.lastSpecifiedSprite);
        }
        

        // 効果音テキストの判定と特殊スタイル適用
        const isSoundEffect = this.isSoundEffectText(dialogue.text);
        if (isSoundEffect) {
            this.dialogueText.classList.add('sound-effect');
        } else {
            this.dialogueText.classList.remove('sound-effect');
        }

        // ゲーム開始トリガーの検出
        if (dialogue.voice_file === 'game_start') {
            console.log(`🎮 【ゲーム開始トリガー検出】${dialogue.dialogue_id}: game_start`);
            // テキストを表示してから少し待ってゲームを開始
            this.animateText(dialogue.text);
            setTimeout(() => {
                console.log('🎯 ゲーム画面に遷移します');
                this.hide();
                this.game.startBattlePhase();
            }, 1500); // 1.5秒後にゲーム開始
            return; // 以降の処理をスキップ
        }
        
        // ボイス再生（トーク表示時は不要なため無効化）
        // if (dialogue.voice_file && dialogue.voice_file !== '') {
        //     this.game.audioManager.playSE(dialogue.voice_file, 0.7);
        // }
        
        // テキストアニメーション表示
        this.animateText(dialogue.text);
        
        // オートプレイ処理
        if (this.autoPlay) {
            // 既存のタイマーをクリア
            if (this.autoPlayTimer) {
                clearTimeout(this.autoPlayTimer);
            }
            
            this.autoPlayTimer = setTimeout(() => {
                if (this.autoPlay && !this.isTextAnimating) {
                    this.showNextDialogue();
                }
            }, this.autoPlayDelay);
        }
    }

    /**
     * テキストアニメーション表示
     * @param {string} text - 表示するテキスト
     */
    animateText(text) {
        if (!this.dialogueText) return;
        
        this.isTextAnimating = true;
        this.dialogueText.textContent = '';
        
        let currentIndex = 0;
        const textArray = Array.from(text);
        
        const animateInterval = setInterval(() => {
            if (currentIndex < textArray.length && this.isTextAnimating) {
                this.dialogueText.textContent += textArray[currentIndex];
                currentIndex++;
                
                // 文字表示音（3文字ごと、音量控えめ）
                if (currentIndex % 3 === 0) {
                    this.playDialogueSE('text_type');
                }
            } else {
                clearInterval(animateInterval);
                this.isTextAnimating = false;
            }
        }, this.textSpeed);
    }

    /**
     * テキストアニメーションを完了
     */
    completeTextAnimation() {
        if (this.isTextAnimating) {
            this.isTextAnimating = false;
            
            // 現在の会話の完全テキストを表示
            const dialogue = this.dialogueQueue[this.currentDialogueIndex - 1];
            if (dialogue && this.dialogueText) {
                this.dialogueText.textContent = dialogue.text;
            }
        }
    }

    /**
     * 会話ボックスクリック時の処理
     */
    onDialogueClick() {
        console.log(`🖱️ 会話ボックスクリック - isTextAnimating:${this.isTextAnimating}, currentIndex:${this.currentDialogueIndex}`);
        
        if (this.isTextAnimating) {
            // テキストアニメーション中なら完了
            console.log('⚡ テキストアニメーション中 - 即座に完了');
            // テキスト完了時のクリック音のみ復活
            this.game.audioManager.playSE('se_click.mp3', 0.5);
            this.completeTextAnimation();
        } else {
            // 次の会話へ
            console.log('➡️ 次の会話に進む');
            // トーク進行時のクリック音のみ復活
            this.game.audioManager.playSE('se_click.mp3', 0.6);
            this.showNextDialogue();
        }
    }

    /**
     * 効果音テキストかどうかを判定
     * @param {string} text - テキスト
     * @returns {boolean} 効果音テキストかどうか
     */
    isSoundEffectText(text) {
        // 効果音機能は現在無効化（すべて通常テキストとして表示）
        return false;
        
        /*
        // 効果音パターンの判定（必要に応じて有効化）
        const soundPatterns = [
            /^[\(\（].+[\)\）]$/, // (カチャ) などの括弧内擬音のみ
            /^[♪♫♬♩].+/, // 音楽記号で始まる
        ];
        
        return soundPatterns.some(pattern => pattern.test(text.trim()));
        */
    }

    /**
     * 会話用効果音を再生（ClickSoundManagerと重複するため無効化）
     * @param {string} type - 効果音タイプ
     */
    playDialogueSE(type) {
        // ClickSoundManagerが統一的にクリック音を管理するため無効化
        // const soundEffects = {
        //     'text_advance': { file: 'se_click.mp3', volume: 0.6 },
        //     'text_complete': { file: 'se_click.mp3', volume: 0.5 },
        //     'dialogue_end': { file: 'se_click.mp3', volume: 0.7 },
        //     'choice_select': { file: 'se_click.mp3', volume: 0.8 },
        //     'misaki_click': { file: 'se_click.mp3', volume: 0.4 },
        //     'page_turn': { file: 'se_click.mp3', volume: 0.5 },
        //     'text_type': { file: 'se_click.mp3', volume: 0.3 }
        // };

        // const se = soundEffects[type];
        // if (se) {
        //     // 指定した効果音を再生、ファイルがない場合はフォールバック
        //     this.game.audioManager.playSE(se.file, se.volume).catch(() => {
        //         // フォールバック: 基本のクリック音
        //         // this.game.audioManager.playSE('se_click.mp3', 0.4); // ClickSoundManagerと重複するため無効化
        //     });
        // } else {
        //     // デフォルトのクリック音
        //     this.game.audioManager.playSE('se_click.mp3', 0.4);
        // }
    }

    /**
     * 美咲クリック時の処理
     */
    onMisakiClick() {
        this.playDialogueSE('misaki_click');
        
        // 美咲の特別反応
        this.showMisakiReaction();
    }

    /**
     * 美咲の特別反応
     */
    showMisakiReaction() {
        // 美咲がクリックされた時の特別会話
        const reactions = [
            { text: 'あら、私のことが気になるの？', emotion: 'teasing' },
            { text: '昔から、じっと見つめるのが好きよね', emotion: 'nostalgic' },
            { text: 'そんなに見つめられると...恥ずかしい', emotion: 'embarrassed' }
        ];
        
        const randomReaction = reactions[Math.floor(Math.random() * reactions.length)];
        
        // 一時的に反応を表示
        this.showTemporaryDialogue(randomReaction);
    }

    /**
     * 一時的な会話表示
     * @param {Object} dialogue - 会話データ
     */
    showTemporaryDialogue(dialogue) {
        const originalText = this.dialogueText.textContent;
        const originalName = this.characterName.textContent;
        
        // 反応を表示
        this.characterName.textContent = '美咲';
        this.characterName.style.color = '#ffb6c1';
        this.changeMisakiEmotion(dialogue.emotion, 1);
        this.animateText(dialogue.text);
        
        // 3秒後に元に戻す
        setTimeout(() => {
            this.dialogueText.textContent = originalText;
            this.characterName.textContent = originalName;
        }, 3000);
    }

    /**
     * キーボード入力処理
     * @param {KeyboardEvent} event - キーボードイベント
     */
    handleKeyInput(event) {
        switch (event.code) {
            case 'Enter':
            case 'Space':
                this.onDialogueClick();
                break;
            case 'KeyS':
                if (event.ctrlKey) {
                    this.saveGame();
                }
                break;
            case 'KeyA':
                this.toggleAutoPlay();
                break;
            case 'Escape':
                this.showMenu();
                break;
        }
    }

    /**
     * 会話スキップ
     */
    skipDialogue() {
        console.log('会話をスキップ');
        // this.game.audioManager.playSE('se_click.mp3', 0.5); // ClickSoundManagerと重複するため無効化
        
        // 確認ダイアログ
        const result = confirm('会話をスキップしますか？');
        if (result) {
            this.onDialogueComplete();
        }
    }

    /**
     * オートプレイの切り替え
     */
    toggleAutoPlay() {
        this.autoPlay = !this.autoPlay;
        
        if (this.controlButtons.auto) {
            this.controlButtons.auto.textContent = this.autoPlay ? 'Auto: ON' : 'Auto';
            this.controlButtons.auto.style.background = this.autoPlay ? 
                'rgba(255, 107, 125, 1)' : 'rgba(255, 107, 125, 0.7)';
        }
        
        console.log(`オートプレイ: ${this.autoPlay ? 'ON' : 'OFF'}`);
        // this.game.audioManager.playSE('se_click.mp3', 0.4); // ClickSoundManagerと重複するため無効化
    }

    /**
     * ログ表示
     */
    showLog() {
        console.log('ログを表示');
        // this.game.audioManager.playSE('se_click.mp3', 0.4); // ClickSoundManagerと重複するため無効化
        
        // ログ機能（将来実装）
        alert('ログ機能は開発中です');
    }

    /**
     * ゲーム保存
     */
    saveGame() {
        console.log('ゲームを保存');
        // this.game.audioManager.playSE('se_click.mp3', 0.5); // ClickSoundManagerと重複するため無効化
        
        const gameData = {
            currentScene: 'dialogue',
            dialogueIndex: this.currentDialogueIndex,
            sceneId: 'living' // 現在のシーンID
        };
        
        const success = this.game.saveSystem.autoSave(gameData);
        
        // 保存結果をメッセージで表示
        this.showSaveMessage(success ? '保存しました' : '保存に失敗しました');
    }

    /**
     * 保存メッセージ表示
     * @param {string} message - メッセージ
     */
    showSaveMessage(message) {
        const messageDiv = document.createElement('div');
        messageDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: rgba(0,0,0,0.8);
            color: #7ed6c4;
            padding: 10px 20px;
            border-radius: 5px;
            z-index: 200;
            font-weight: 600;
        `;
        
        messageDiv.textContent = message;
        document.body.appendChild(messageDiv);
        
        setTimeout(() => {
            messageDiv.remove();
        }, 2000);
    }

    /**
     * メニュー表示
     */
    showMenu() {
        console.log('メニューを表示');
        // this.game.audioManager.playSE('se_click.mp3', 0.4); // ClickSoundManagerと重複するため無効化
        
        // インゲームメニュー（将来実装）
        const result = confirm('タイトル画面に戻りますか？');
        if (result) {
            this.returnToTitle();
        }
    }

    /**
     * タイトル画面に戻る
     */
    returnToTitle() {
        console.log('タイトル画面に戻る');
        // this.game.audioManager.playSE('se_click.mp3', 0.5); // ClickSoundManagerと重複するため無効化
        
        const confirmReturn = confirm('タイトル画面に戻りますか？\n進行中のゲームは失われます。');
        if (confirmReturn) {
            // 自動再生を停止
            this.stopAutoPlay();
            
            // 隠しクリック領域を無効化
            if (this.game.clickAreaSystem) {
                this.game.clickAreaSystem.deactivateAllAreas();
            }
            
            this.hide();
            this.game.showTitleScreen();
        }
    }

    /**
     * オートプレイを停止
     */
    stopAutoPlay() {
        this.autoPlay = false;
        
        // オートプレイタイマーをクリア
        if (this.autoPlayTimer) {
            clearTimeout(this.autoPlayTimer);
            this.autoPlayTimer = null;
        }
        
        // ボタンの表示を更新
        if (this.controlButtons.auto) {
            this.controlButtons.auto.textContent = 'Auto';
            this.controlButtons.auto.style.background = 'rgba(255, 107, 125, 0.7)';
        }
        
        console.log('オートプレイを停止しました');
    }

    /**
     * 会話完了時の処理
     */
    onDialogueComplete() {
        console.log('会話が完了しました');
        
        // エンディングモードの場合はゲームに戻らない
        if (this.game.gameState.isEndingMode) {
            console.log('🎉 エンディングトーク完了：ゲーム終了');
            this.showEndingOptions();
            return;
        }
        
        // 通常モード：ゲーム画面へ遷移
        this.hide();
        this.game.startBattlePhase();
    }

    /**
     * エンディング選択肢を表示
     */
    showEndingOptions() {
        console.log('🎉 エンディング選択肢を表示');
        
        // エンディング用のボタンを表示
        const endingContainer = document.createElement('div');
        endingContainer.id = 'ending-options';
        endingContainer.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0, 0, 0, 0.8);
            padding: 30px;
            border-radius: 15px;
            text-align: center;
            color: white;
            font-family: 'Arial', sans-serif;
            z-index: 1000;
        `;
        
        // CSVからゲーム終了メッセージを取得
        let titleText = 'ゲーム終了';
        let messageText = 'お疲れさまでした！';
        let button1Text = 'もう一度プレイ';
        let button2Text = 'タイトルに戻る';
        
        // 勝利時のみCSVからゲーム終了メッセージを取得
        if (this.game.gameState && this.game.gameState.playerWins >= 5) {
            console.log('🎯 勝利状態を検出、CSVから勝利メッセージを適用');

            // CSVから勝利メッセージを取得
            const csvLoader = this.game.csvLoader;
            const endMessages = csvLoader.getData('game_end_messages');

            if (endMessages && Array.isArray(endMessages) && endMessages.length > 0) {
                const victoryMessage = endMessages.find(msg => msg.scene_type === 'victory');

                if (victoryMessage) {
                    titleText = victoryMessage.title_text || 'ゲームクリア！';
                    messageText = victoryMessage.message_text || 'ここまで遊んでいただきありがとうございます！\n最終トークまで辿り着いたので、\nシークレットギャラリーを獲得しました！\nタイトル画面でご確認ください！';
                    button1Text = victoryMessage.button1_text || 'もう一度プレイ';
                    button2Text = victoryMessage.button2_text || 'タイトルに戻る';

                    console.log(`✅ CSVから勝利メッセージを適用: ${titleText}`);
                } else {
                    console.warn('⚠️ 勝利メッセージがCSVに見つからないため、デフォルト値を使用');
                }
            } else {
                console.warn('⚠️ game_end_messages.csvが読み込まれていないため、デフォルト値を使用');
            }

            // デフォルト値を確実に設定（CSVが読み込まれていない場合のフォールバック）
            if (!titleText || titleText === 'ゲーム終了') {
                titleText = 'ゲームクリア！';
                messageText = 'ここまで遊んでいただきありがとうございます！\n最終トークまで辿り着いたので、\nシークレットギャラリーを獲得しました！\nタイトル画面でご確認ください！';
                button1Text = 'もう一度プレイ';
                button2Text = 'タイトルに戻る';
            }
        }
        // 敗北時はbad_end.csv、引き分けはデフォルト値を使用
        
        const title = document.createElement('h2');
        title.textContent = titleText;
        title.style.cssText = 'margin-bottom: 20px; color: #FF6B7D;';
        
        const message = document.createElement('p');
        message.innerHTML = messageText.replace(/\n/g, '<br>');  // 改行をHTMLのbrタグに変換
        message.style.cssText = 'margin-bottom: 30px; font-size: 18px; line-height: 1.6;';
        
        const restartButton = document.createElement('button');
        restartButton.textContent = button1Text;
        restartButton.style.cssText = `
            padding: 12px 24px;
            margin: 0 10px;
            background: #FF6B7D;
            color: white;
            border: none;
            border-radius: 8px;
            font-size: 16px;
            cursor: pointer;
            transition: background 0.3s;
        `;
        restartButton.onmouseover = () => restartButton.style.background = '#ff5a6d';
        restartButton.onmouseout = () => restartButton.style.background = '#FF6B7D';
        restartButton.onclick = () => this.restartGame();
        
        const titleButton = document.createElement('button');
        titleButton.textContent = button2Text;
        titleButton.style.cssText = `
            padding: 12px 24px;
            margin: 0 10px;
            background: #7ED6C4;
            color: white;
            border: none;
            border-radius: 8px;
            font-size: 16px;
            cursor: pointer;
            transition: background 0.3s;
        `;
        titleButton.onmouseover = () => titleButton.style.background = '#6ec4b4';
        titleButton.onmouseout = () => titleButton.style.background = '#7ED6C4';
        titleButton.onclick = () => this.returnToTitle();
        
        endingContainer.appendChild(title);
        endingContainer.appendChild(message);
        endingContainer.appendChild(restartButton);
        endingContainer.appendChild(titleButton);
        
        document.body.appendChild(endingContainer);
        
        // 作成後に再度CSVからメッセージを更新（確実に反映させるため）
        if (this.game.gameState && this.game.gameState.playerWins >= 5) {
            // CSVデータを確実に取得する処理
            this.updateEndingMessage(title, message, restartButton, titleButton);
        }
        
        // 音響効果
        this.playDialogueSE('dialogue_end');
    }

    /**
     * エンディングメッセージをCSVから確実に取得して更新
     */
    async updateEndingMessage(title, message, restartButton, titleButton) {
        console.log('🔄 エンディングメッセージの更新を開始...');

        try {
            const csvLoader = this.game.csvLoader;

            // まずは既存のデータをチェック
            let endMessages = csvLoader.getData('game_end_messages');

            // データが存在しないか空の場合は再読み込み
            if (!endMessages || !Array.isArray(endMessages) || endMessages.length === 0) {
                console.log('📥 game_end_messages.csvを再読み込み中...');

                // CSVファイルを非同期で読み込み
                await csvLoader.loadCSV('game_end_messages.csv');
                endMessages = csvLoader.getData('game_end_messages');

                console.log('📊 再読み込み後のデータ:', endMessages);
            }

            // データが正常に読み込まれた場合
            if (endMessages && Array.isArray(endMessages) && endMessages.length > 0) {
                console.log('📊 検索対象のendMessages:', endMessages);

                const victoryMessage = endMessages.find(msg => {
                    console.log('🔍 メッセージをチェック:', msg);
                    return msg && msg.scene_type === 'victory';
                });

                if (victoryMessage) {
                    console.log('🎯 勝利メッセージを発見:', victoryMessage);

                    title.textContent = victoryMessage.title_text || 'ゲームクリア！';
                    const messageText = victoryMessage.message_text || 'ここまで遊んでいただきありがとうございます！\n最終トークまで辿り着いたので、\nシークレットギャラリーを獲得しました！\nタイトル画面でご確認ください！';
                    message.innerHTML = messageText.replace(/\\n/g, '<br>').replace(/\n/g, '<br>');
                    restartButton.textContent = victoryMessage.button1_text || 'もう一度プレイ';
                    titleButton.textContent = victoryMessage.button2_text || 'タイトルに戻る';

                    console.log(`✅ CSVメッセージを適用完了: ${title.textContent}`);
                    console.log(`📝 メッセージ内容: ${messageText}`);

                    // シークレットギャラリー画像を解放
                    this.unlockSecretGallery();
                    return; // 🚨 確実にここで処理を終了
                } else {
                    console.warn('⚠️ victory タイプのメッセージが見つかりませんでした');
                }
            } else {
                console.warn('⚠️ endMessages が無効です:', endMessages);
            }

            console.warn('⚠️ CSV読み込みに失敗したため、デフォルトメッセージを使用');

        } catch (error) {
            console.error('❌ エンディングメッセージ更新中にエラー:', error);
            console.log('🔄 フォールバック処理でデフォルトメッセージを使用');
        }

        // フォールバック: デフォルトメッセージを設定（CSVが読み込めなかった場合のみ）
        console.log('📝 CSVが読み込めなかったため、デフォルトメッセージを適用');
        title.textContent = 'ゲームクリア！';
        message.innerHTML = 'お疲れさまでした！<br>ゲームをプレイしていただき、ありがとうございます！';
        restartButton.textContent = 'もう一度プレイ';
        titleButton.textContent = 'タイトルに戻る';

        // シークレットギャラリー画像を解放
        this.unlockSecretGallery();
    }

    /**
     * シークレットギャラリー画像を解放
     */
    unlockSecretGallery() {
        try {
            console.log('🎉 シークレットギャラリー解放処理を開始...');

            const saveSystem = this.game.saveSystem;
            if (!saveSystem) {
                console.error('❌ SaveSystemが見つかりません');
                return;
            }

            // シークレット立ち絵を解放（ステージ7として設定）
            const secretImageName = 'misaki_secret_victory.png';
            const secretStage = 7;

            // 既に解放済みかチェック
            if (saveSystem.isImageUnlocked(secretImageName, secretStage)) {
                console.log('✅ シークレット画像は既に解放済みです');
                return;
            }

            // 新規解放
            const isNewUnlock = saveSystem.unlockGalleryImage(secretImageName, secretStage);

            if (isNewUnlock) {
                console.log(`🎊 シークレットギャラリー解放成功: ${secretImageName}`);

                // 解放通知を表示（通常のギャラリー解放と同じスタイル）
                this.showGalleryUnlockNotification(7);
            } else {
                console.log('⚠️ シークレットギャラリーの解放に失敗しました');
            }

        } catch (error) {
            console.error('❌ シークレットギャラリー解放中にエラー:', error);
        }
    }

    /**
     * ギャラリー解放通知を表示（GameSceneと同じスタイル）
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

        // シークレット専用の表示内容
        if (stage === 7) {
            notification.innerHTML = `
                <div style="display: flex; align-items: center; gap: 10px;">
                    <span style="font-size: 24px;">🔮</span>
                    <div>
                        <div style="font-weight: bold; font-size: 14px;">シークレットギャラリー解放！</div>
                        <div style="font-size: 12px; opacity: 0.9;">特別な立ち絵が追加されました</div>
                    </div>
                </div>
            `;
        } else {
            notification.innerHTML = `
                <div style="display: flex; align-items: center; gap: 10px;">
                    <span style="font-size: 24px;">🎨</span>
                    <div>
                        <div style="font-weight: bold; font-size: 14px;">ギャラリー解放！</div>
                        <div style="font-size: 12px; opacity: 0.9;">Stage ${stage} の立ち絵が追加されました</div>
                    </div>
                </div>
            `;
        }

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
     * シークレットギャラリー解放通知を表示
     */
    showSecretGalleryNotification() {
        try {
            // 通知要素を作成
            const notification = document.createElement('div');
            notification.className = 'secret-gallery-notification';
            notification.innerHTML = `
                <div class="notification-content">
                    <h3>🎊 シークレットギャラリー解放！</h3>
                    <p>特別な美咲の立ち絵がギャラリーに追加されました！</p>
                    <p>タイトル画面のギャラリーからご確認ください</p>
                </div>
            `;

            // スタイルを設定
            notification.style.cssText = `
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: linear-gradient(135deg, #ff6b7d 0%, #ffa8b8 100%);
                color: white;
                padding: 30px;
                border-radius: 15px;
                border: 3px solid #ffd700;
                text-align: center;
                z-index: 2000;
                box-shadow: 0 10px 30px rgba(0,0,0,0.5);
                animation: secretUnlockAnimation 3s ease-in-out;
                font-family: 'Noto Sans JP', sans-serif;
                max-width: 400px;
                pointer-events: none;
            `;

            // CSSアニメーションを追加
            if (!document.getElementById('secret-gallery-animation-style')) {
                const style = document.createElement('style');
                style.id = 'secret-gallery-animation-style';
                style.textContent = `
                    @keyframes secretUnlockAnimation {
                        0% {
                            opacity: 0;
                            transform: translate(-50%, -50%) scale(0.5) rotate(-10deg);
                        }
                        20% {
                            opacity: 1;
                            transform: translate(-50%, -50%) scale(1.1) rotate(2deg);
                        }
                        40% {
                            transform: translate(-50%, -50%) scale(1) rotate(-1deg);
                        }
                        60% {
                            transform: translate(-50%, -50%) scale(1.05) rotate(0deg);
                        }
                        80% {
                            transform: translate(-50%, -50%) scale(1) rotate(0deg);
                        }
                        100% {
                            opacity: 0;
                            transform: translate(-50%, -50%) scale(0.8) rotate(0deg);
                        }
                    }
                    .notification-content h3 {
                        margin: 0 0 15px 0;
                        font-size: 24px;
                        text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
                    }
                    .notification-content p {
                        margin: 10px 0;
                        font-size: 16px;
                        line-height: 1.4;
                        text-shadow: 1px 1px 2px rgba(0,0,0,0.3);
                    }
                `;
                document.head.appendChild(style);
            }

            // 通知を表示
            document.body.appendChild(notification);

            // 3秒後に自動削除
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 3000);

            console.log('✨ シークレットギャラリー解放通知を表示しました');

        } catch (error) {
            console.error('❌ 通知表示中にエラー:', error);
        }
    }

    /**
     * ゲーム再スタート
     */
    restartGame() {
        console.log('🔄 ゲームを再スタート');
        
        // エンディング選択肢を削除
        const endingOptions = document.getElementById('ending-options');
        if (endingOptions) {
            endingOptions.remove();
        }
        
        // ゲーム状態をリセット
        this.game.gameState.isEndingMode = false;
        this.game.gameState.canReturnToGame = true;
        this.game.gameState.isGameActive = true;
        
        // ゲームシーンをリセットして再開
        this.hide();
        this.game.scenes.game.resetGame();
        this.game.showTitleScreen();
    }

    /**
     * タイトルに戻る
     */
    returnToTitle() {
        console.log('🏠 タイトルに戻る');
        
        // エンディング選択肢を削除
        const endingOptions = document.getElementById('ending-options');
        if (endingOptions) {
            endingOptions.remove();
        }
        
        // ゲーム状態をリセット
        this.game.gameState.isEndingMode = false;
        this.game.gameState.canReturnToGame = true;
        this.game.gameState.isGameActive = false;
        
        // タイトル画面に戻る
        this.hide();
        this.game.showTitleScreen();
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
        this.isTextAnimating = false;
        this.autoPlay = false;
        console.log('DialogueScene cleanup');
    }
}

// グローバルに公開
window.DialogueScene = DialogueScene;