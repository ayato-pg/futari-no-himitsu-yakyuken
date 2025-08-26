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
        Object.values(this.controlButtons).forEach(button => {
            if (button) {
                button.addEventListener('mouseenter', () => {
                    this.game.audioManager.playSE('se_click.mp3', 0.2);
                });
            }
        });
    }

    /**
     * 会話シーンを表示
     * @param {string} sceneId - シーンID
     * @param {Array} dialogues - 表示する会話データ
     */
    async show(sceneId = 'living', dialogues = null) {
        if (this.isActive) return;
        
        console.log(`会話シーン表示: ${sceneId}`);
        
        // 会話データを設定
        if (dialogues) {
            this.dialogueQueue = dialogues;
        } else {
            this.loadDialogueData(sceneId);
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
            console.log('🇺�️ 美咲の立ち絵を設定します');
            
            // 美咲の表示コンテナを確実に表示
            this.ensureMisakiDisplayVisible();
            
            // 美咲の立ち絵を設定
            this.setupMisakiDisplay();
            
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
    }

    /**
     * 背景を設定
     * @param {string} sceneId - シーンID
     */
    setupBackground(sceneId) {
        const backgroundElement = document.getElementById('dialogue-bg');
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
        
        // 初期衣装を normal に設定（重要：画像読み込み前に設定）
        this.currentCostume = 'normal';
        
        // トーク画面の初期画像は必ず misaki_dialogue_normal.png
        const imageName = 'misaki_dialogue_normal.png';
        
        console.log(`🎨 【初期化】美咲の画像を設定 - ${imageName}`);
        
        // 相対パスを修正（./を削除）
        const imagePath = `assets/images/characters/misaki/${imageName}`;
        const displayContainer = this.misakiDisplay.parentElement;
        
        console.log(`📁 画像パス: ${imagePath}`);
        
        // 画像のプリロード処理
        const tempImage = new Image();
        tempImage.onload = () => {
            console.log(`✅ 美咲の画像が読み込まれました: ${imageName}`);
            console.log(`📸 実際のパス: ${tempImage.src}`);
            
            // 画像の読み込みが完了してから表示
            this.misakiDisplay.src = tempImage.src;
            console.log(`🖼️ IMG要素のsrcを更新: ${this.misakiDisplay.src}`);
            
            // 表示を確実にする
            this.misakiDisplay.style.display = 'block';
            this.misakiDisplay.style.visibility = 'visible';
            
            // タイトル画面と同じアニメーションを適用
            this.misakiDisplay.style.transition = '';
            this.misakiDisplay.style.opacity = '';
            this.misakiDisplay.classList.remove('misaki-costume-change');
            
            // コンテナも表示状態にする
            if (displayContainer && displayContainer.classList.contains('misaki-large-display')) {
                displayContainer.style.display = 'block';
                displayContainer.style.opacity = '1';
                displayContainer.style.visibility = 'visible';
            }
            
            // アニメーション開始
            requestAnimationFrame(() => {
                this.misakiDisplay.classList.add('misaki-costume-change');
                console.log(`🎬 初期表示アニメーション開始`);
                
                setTimeout(() => {
                    this.misakiDisplay.classList.remove('misaki-costume-change');
                }, 1200);
            });
        };
        
        tempImage.onerror = () => {
            console.warn(`❌ 美咲の画像が見つかりません: ${imageName}`);
            console.log(`⚠️ プレースホルダーを表示します`);
            
            this.createMisakiPlaceholder();
            
            // プレースホルダーでも表示を確実にする
            this.misakiDisplay.style.display = 'block';
            this.misakiDisplay.style.opacity = '1';
            this.misakiDisplay.style.visibility = 'visible';
            
            // プレースホルダーでもアニメーションを実行
            if (displayContainer && displayContainer.classList.contains('misaki-large-display')) {
                displayContainer.style.display = 'block';
                displayContainer.style.opacity = '1';
                displayContainer.style.visibility = 'visible';
                displayContainer.classList.add('entrance');
            }
        };
        
        // 画像の読み込みを開始
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
     * 美咲の衣装変更
     * @param {string} costume - 衣装タイプ (normal, casual, roomwear等)
     * @param {string} emotion - 表情
     */
    changeMisakiCostume(costume = 'normal', emotion = 'normal') {
        if (!this.misakiDisplay) {
            console.error(`❌ misakiDisplay要素が見つかりません`);
            return;
        }
        
        // 現在の衣装を記録
        this.currentCostume = costume;
        
        // 衣装と表情を組み合わせた画像名
        let imageName = `misaki_dialogue_${costume}_${emotion}.png`;
        const imagePath = `assets/images/characters/misaki/${imageName}`;
        
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
            
            // 段階的フォールバック戦略
            const fallbackOptions = [
                `assets/images/characters/misaki/misaki_dialogue_${costume}.png`, // 表情なし版
                `assets/images/characters/misaki/misaki_dialogue_normal.png`,     // 基本画像
                `assets/images/characters/misaki/misaki_adult_normal.png`         // 最終手段
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
            
            // 画像を変更
            this.misakiDisplay.src = fallbackPath;
            
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
            // コンテナを表示状態にする
            misakiContainer.style.display = 'block';
            misakiContainer.style.opacity = '1';
            misakiContainer.style.visibility = 'visible';
            
            console.log('✅ 美咲の表示コンテナを有効化しました');
        } else {
            console.error('❌ .misaki-large-display コンテナが見つかりません');
        }
        
        // 美咲の画像要素を確認
        if (this.misakiDisplay) {
            this.misakiDisplay.style.display = 'block';
            this.misakiDisplay.style.opacity = '1';
            console.log('✅ 美咲の画像要素を有効化しました');
        } else {
            console.error('❌ 美咲の画像要素が見つかりません');
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
     * 会話データを読み込み
     * @param {string} sceneId - シーンID
     */
    loadDialogueData(sceneId) {
        console.log(`🔄 会話データを読み込み開始: ${sceneId}`);
        
        if (!this.game.csvLoader) {
            console.warn('❌ CSVLoaderが初期化されていません。フォールバックデータを使用します。');
            this.dialogueQueue = this.getFallbackDialogueData(sceneId);
            return;
        }

        try {
            // CSVLoaderの全データを確認
            console.log('📋 利用可能なCSVテーブル:', Object.keys(this.game.csvLoader.csvData));
            
            const allDialogues = this.game.csvLoader.getTableData('dialogues');
            console.log(`📊 dialoguesテーブル全体: ${allDialogues.length} 件`);
            
            // 最初の数件を表示してデータ構造を確認
            if (allDialogues.length > 0) {
                console.log('🔍 dialoguesテーブルの内容サンプル:');
                allDialogues.slice(0, 3).forEach((row, index) => {
                    console.log(`  ${index + 1}. ID:${row.dialogue_id}, Scene:${row.scene_id}, Char:${row.character_id}, Text:${row.text?.substring(0, 20)}...`);
                });
            }
            
            const dialogueData = this.game.csvLoader.findAllData('dialogues', 'scene_id', sceneId);
            console.log(`🎯 ${sceneId} にマッチするデータ: ${dialogueData ? dialogueData.length : 0} 件`);
            
            if (!dialogueData || dialogueData.length === 0) {
                console.log(`⚠️ ${sceneId} の会話データが見つかりません。フォールバックデータを使用します。`);
                this.dialogueQueue = this.getFallbackDialogueData(sceneId);
            } else {
                // dialogue_id順でソート
                this.dialogueQueue = dialogueData.sort((a, b) => {
                    const aNum = parseInt(a.dialogue_id.replace('d', ''));
                    const bNum = parseInt(b.dialogue_id.replace('d', ''));
                    return aNum - bNum;
                });
                console.log(`✅ CSVから会話データを読み込み成功: ${this.dialogueQueue.length} 件`);
                
                // 読み込んだデータの詳細を表示
                console.log('📝 読み込まれた会話データ:');
                this.dialogueQueue.forEach((dialogue, index) => {
                    console.log(`  ${index + 1}. ${dialogue.dialogue_id}: ${dialogue.character_id} - "${dialogue.text?.substring(0, 30)}..."`);
                });
            }
        } catch (error) {
            console.error('❌ 会話データの読み込みに失敗:', error);
            this.dialogueQueue = this.getFallbackDialogueData(sceneId);
        }
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
     * 次の会話を表示
     */
    showNextDialogue() {
        if (this.currentDialogueIndex >= this.dialogueQueue.length) {
            // 会話終了
            this.playDialogueSE('dialogue_end');
            this.onDialogueComplete();
            return;
        }
        
        const dialogue = this.dialogueQueue[this.currentDialogueIndex];
        this.displayDialogue(dialogue);
        this.currentDialogueIndex++;
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
        
        // デバッグ: 表示される会話データをログ出力
        console.log(`💬 会話表示: ${dialogue.dialogue_id} | ${dialogue.character_id} | "${dialogue.text}"`);
        console.log(`🎨 Emotion: ${dialogue.emotion || 'なし'} | 👗 Costume: ${dialogue.costume || 'なし'}`);
        
        // 🔍 CSVデータの詳細デバッグ
        console.log(`🔍 【CSVデータ詳細】dialogue_id: ${dialogue.dialogue_id}`);
        console.log(`    - emotion: "${dialogue.emotion}" (type: ${typeof dialogue.emotion})`);
        console.log(`    - costume: "${dialogue.costume}" (type: ${typeof dialogue.costume})`);
        console.log(`    - 生データ:`, dialogue);
        
        // 特にd005をチェック
        if (dialogue.dialogue_id === 'd005') {
            console.log(`🚨 【d005特別チェック】costume値詳細確認:`);
            console.log(`    - costume: [${dialogue.costume}]`);
            console.log(`    - costume length: ${dialogue.costume ? dialogue.costume.length : 'undefined'}`);
            console.log(`    - costume trim: [${dialogue.costume ? dialogue.costume.trim() : 'undefined'}]`);
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
            } else {
                this.characterName.textContent = 'あなた';
                this.characterName.style.color = '#7ed6c4';
                this.characterName.style.fontStyle = 'normal';
            }
        }
        
        // 美咲の立ち絵変更（衣装と表情）- 美咲の台詞の時のみ
        if (dialogue.character_id === 'misaki') {
            console.log(`🔍 【美咲台詞】処理開始 - currentCostume: ${this.currentCostume}`);
            
            // 🚨 緊急修正：特定のdialogue_idで強制的に衣装変更
            const forceCostumeMap = {
                'd005': { costume: 'casual', emotion: 'teasing' },
                'd008a': { costume: 'casual', emotion: 'playful' },
                'd010': { costume: 'casual', emotion: 'confident' },
                'd012': { costume: 'casual', emotion: 'teasing' },
                'd013': { costume: 'casual', emotion: 'seductive' }
            };
            
            // 強制衣装変更チェック
            if (forceCostumeMap[dialogue.dialogue_id]) {
                const forceData = forceCostumeMap[dialogue.dialogue_id];
                console.log(`🔧 【強制修正】${dialogue.dialogue_id}: ${forceData.costume} + ${forceData.emotion}`);
                this.changeMisakiCostume(forceData.costume, forceData.emotion);
            }
            // 通常のCSVデータ処理
            else if (dialogue.costume && dialogue.costume.trim() !== '') {
                console.log(`👗 【衣装変更】実行: ${dialogue.costume} + ${dialogue.emotion || 'normal'}`);
                this.changeMisakiCostume(dialogue.costume, dialogue.emotion || 'normal');
            }
            // それ以外は一切画像変更しない
            else {
                console.log(`🔒 【画像維持】costume指定なし - 現在の画像を維持`);
                console.log(`    - emotion: ${dialogue.emotion || 'なし'}`);
                console.log(`    - costume: ${dialogue.costume || 'なし'}`);
            }
        }
        // プレイヤーや心の声の時は立ち絵を維持（何もしない）
        else {
            console.log(`🎭 【${dialogue.character_id}】- 美咲の立ち絵は維持`);
        }

        // ボイス再生
        if (dialogue.voice_file && dialogue.voice_file !== '') {
            this.game.audioManager.playSE(dialogue.voice_file, 0.7);
        }
        
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
        if (this.isTextAnimating) {
            // テキストアニメーション中なら完了
            this.playDialogueSE('text_complete');
            this.completeTextAnimation();
        } else {
            // 次の会話へ
            this.playDialogueSE('text_advance');
            this.showNextDialogue();
        }
    }

    /**
     * 会話用効果音を再生
     * @param {string} type - 効果音タイプ
     */
    playDialogueSE(type) {
        const soundEffects = {
            'text_advance': { file: 'se_text_advance.mp3', volume: 0.6 },
            'text_complete': { file: 'se_text_complete.mp3', volume: 0.5 },
            'dialogue_end': { file: 'se_dialogue_end.mp3', volume: 0.7 },
            'choice_select': { file: 'se_choice_select.mp3', volume: 0.8 },
            'misaki_click': { file: 'se_misaki_voice.mp3', volume: 0.4 },
            'page_turn': { file: 'se_page_turn.mp3', volume: 0.5 },
            'text_type': { file: 'se_text_type.mp3', volume: 0.3 }
        };

        const se = soundEffects[type];
        if (se) {
            // 指定した効果音を再生、ファイルがない場合はフォールバック
            this.game.audioManager.playSE(se.file, se.volume).catch(() => {
                // フォールバック: 基本のクリック音
                this.game.audioManager.playSE('se_click.mp3', 0.4);
            });
        } else {
            // デフォルトのクリック音
            this.game.audioManager.playSE('se_click.mp3', 0.4);
        }
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
        this.game.audioManager.playSE('se_click.mp3', 0.5);
        
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
        this.game.audioManager.playSE('se_click.mp3', 0.4);
    }

    /**
     * ログ表示
     */
    showLog() {
        console.log('ログを表示');
        this.game.audioManager.playSE('se_click.mp3', 0.4);
        
        // ログ機能（将来実装）
        alert('ログ機能は開発中です');
    }

    /**
     * ゲーム保存
     */
    saveGame() {
        console.log('ゲームを保存');
        this.game.audioManager.playSE('se_click.mp3', 0.5);
        
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
        this.game.audioManager.playSE('se_click.mp3', 0.4);
        
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
        this.game.audioManager.playSE('se_click.mp3', 0.5);
        
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
        
        // ゲーム画面へ遷移
        this.hide();
        this.game.startBattlePhase();
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