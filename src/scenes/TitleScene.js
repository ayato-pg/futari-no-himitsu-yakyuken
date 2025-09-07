/**
 * TitleScene.js
 * タイトル画面の処理を管理するクラス
 * 美咲の大人の立ち絵を表示し、メニュー操作を処理
 */

class TitleScene {
    constructor(gameController) {
        this.game = gameController;
        this.isActive = false;
        this.currentMenuIndex = 0;
        this.menuButtons = [];
        
        // DOM要素への参照
        this.titleScreen = null;
        this.misakiImage = null;
        this.menuButtonElements = [];
        
        this.initialize();
    }

    /**
     * タイトルシーンを初期化
     */
    initialize() {
        this.titleScreen = document.getElementById('title-screen');
        this.misakiImage = document.getElementById('misaki-title');
        
        // 初期化時に立ち絵を確実に設定
        if (this.misakiImage) {
            this.misakiImage.src = './assets/images/characters/misaki/misaki_adult_normal.png';
            this.misakiImage.style.opacity = '1';
            this.misakiImage.style.display = 'block';
            console.log('🎭 初期化時に美咲立ち絵を設定');
        }
        
        // メニューボタンを取得
        this.menuButtonElements = [
            document.getElementById('btn-new-game'),
            document.getElementById('btn-howtoplay'),
            document.getElementById('btn-gallery'),
            document.getElementById('btn-settings')
        ];

        this.setupEventListeners();
        this.setupMenuButtons();
        
        console.log('TitleScene初期化完了');
    }

    /**
     * イベントリスナーを設定
     */
    setupEventListeners() {
        // 美咲の画像ホバー効果
        if (this.misakiImage) {
            this.misakiImage.addEventListener('mouseenter', () => {
                this.onMisakiHover();
            });
            
            this.misakiImage.addEventListener('mouseleave', () => {
                this.onMisakiLeave();
            });
            
            this.misakiImage.addEventListener('click', () => {
                this.onMisakiClick();
            });
        }

        // キーボード操作
        document.addEventListener('keydown', (event) => {
            if (this.isActive) {
                this.handleKeyInput(event);
            }
        });
    }

    /**
     * メニューボタンの設定
     */
    setupMenuButtons() {
        // はじめる ボタン
        const newGameBtn = document.getElementById('btn-new-game');
        if (newGameBtn) {
            newGameBtn.addEventListener('click', () => {
                this.startNewGame();
            });
        }

        // 遊び方 ボタン
        const howToPlayBtn = document.getElementById('btn-howtoplay');
        if (howToPlayBtn) {
            howToPlayBtn.addEventListener('click', () => {
                this.showHowToPlay();
            });
        }

        // ギャラリー ボタン
        const galleryBtn = document.getElementById('btn-gallery');
        if (galleryBtn) {
            galleryBtn.addEventListener('click', () => {
                this.openGallery();
            });
            // ギャラリーボタンを有効化
            galleryBtn.disabled = false;
        }

        // 設定 ボタン
        const settingsBtn = document.getElementById('btn-settings');
        if (settingsBtn) {
            settingsBtn.addEventListener('click', () => {
                this.openSettings();
            });
        }

        // CSV更新 ボタン（開発用）
        const csvReloadBtn = document.getElementById('btn-csv-reload');
        if (csvReloadBtn) {
            csvReloadBtn.style.display = 'block'; // 確実に表示
            csvReloadBtn.style.visibility = 'visible';
            csvReloadBtn.style.opacity = '1';
            console.log('CSV更新ボタンを強制表示:', csvReloadBtn);
            csvReloadBtn.addEventListener('click', async () => {
                console.log('🔄 CSV強制リロードボタンが押されました');
                try {
                    await this.game.forceReloadAllCSV();
                } catch (error) {
                    console.error('❌ CSV更新エラー:', error);
                    alert('❌ CSV更新に失敗しました: ' + error.message);
                }
            });
            console.log('✅ CSV更新ボタンが設定されました');
        } else {
            console.warn('❌ CSV更新ボタンが見つかりませんでした');
        }

        // BAD END編集ボタン（開発用）
        const badEndEditorBtn = document.getElementById('btn-bad-end-editor');
        console.log('BAD END編集ボタン要素を検索:', badEndEditorBtn);
        
        if (badEndEditorBtn) {
            // 強制的にスタイルを設定
            badEndEditorBtn.style.cssText = `
                background: #9B59B6 !important;
                color: white !important;
                font-size: 0.9em !important;
                display: block !important;
                visibility: visible !important;
                opacity: 1 !important;
                position: relative !important;
                z-index: 999 !important;
                margin: 10px 0 !important;
                padding: 15px 30px !important;
                border: none !important;
                border-radius: 25px !important;
                cursor: pointer !important;
                font-weight: bold !important;
                width: auto !important;
                height: auto !important;
            `;
            
            console.log('BAD END編集ボタンを強制表示:', badEndEditorBtn);
            
            // イベントリスナーを追加
            badEndEditorBtn.addEventListener('click', (event) => {
                event.preventDefault();
                event.stopPropagation();
                console.log('📝 BAD END編集ボタンがクリックされました');
                
                try {
                    this.game.audioManager.playSE('se_click.mp3', 0.7);
                } catch (error) {
                    console.warn('効果音エラー:', error);
                }
                
                // 正式なBAD END編集画面に遷移
                this.hide();
                this.game.showBadEndEditor();
            });
            
            console.log('✅ BAD END編集ボタンが設定されました');
        } else {
            console.warn('❌ BAD END編集ボタンが見つかりませんでした');
            // ボタンを動的に作成
            this.createBadEndEditorButton();
        }

        // BAD END表示ボタン（開発用）
        const showBadEndBtn = document.getElementById('btn-show-bad-end');
        console.log('BAD END表示ボタン要素を検索:', showBadEndBtn);
        
        if (showBadEndBtn) {
            showBadEndBtn.style.cssText = `
                background: #E74C3C !important;
                color: white !important;
                font-size: 0.9em !important;
                display: block !important;
                visibility: visible !important;
                opacity: 1 !important;
                position: relative !important;
                z-index: 999 !important;
                margin: 10px 0 !important;
                padding: 15px 30px !important;
                border: none !important;
                border-radius: 25px !important;
                cursor: pointer !important;
                font-weight: bold !important;
                width: auto !important;
                height: auto !important;
            `;
            
            console.log('BAD END表示ボタンを強制表示:', showBadEndBtn);
            
            showBadEndBtn.addEventListener('click', (event) => {
                event.preventDefault();
                event.stopPropagation();
                console.log('🔴 BAD END表示ボタンがクリックされました');
                
                try {
                    this.game.audioManager.playSE('se_click.mp3', 0.7);
                } catch (error) {
                    console.warn('効果音エラー:', error);
                }
                
                // 直接BAD ENDを表示
                this.showBadEndDirectly();
            });
            
            console.log('✅ BAD END表示ボタンが設定されました');
        } else {
            console.warn('❌ BAD END表示ボタンが見つかりませんでした');
        }

        // キャッシュクリアボタン（開発用）
        const clearCacheBtn = document.getElementById('btn-clear-cache');
        console.log('キャッシュクリアボタン要素を検索:', clearCacheBtn);
        
        if (clearCacheBtn) {
            clearCacheBtn.style.cssText = `
                background: #F39C12 !important;
                color: white !important;
                font-size: 0.9em !important;
                display: block !important;
                visibility: visible !important;
                opacity: 1 !important;
                position: relative !important;
                z-index: 999 !important;
                margin: 10px 0 !important;
                padding: 15px 30px !important;
                border: none !important;
                border-radius: 25px !important;
                cursor: pointer !important;
                font-weight: bold !important;
                width: auto !important;
                height: auto !important;
            `;
            
            clearCacheBtn.addEventListener('click', (event) => {
                event.preventDefault();
                event.stopPropagation();
                console.log('🧹 キャッシュクリアボタンがクリックされました');
                
                // 全てのキャッシュを強制クリア
                localStorage.clear();
                
                // CSVLoaderキャッシュもクリア
                if (this.game.csvLoader && this.game.csvLoader.csvData) {
                    this.game.csvLoader.csvData = {};
                }
                
                alert('全キャッシュをクリアしました！\nページを再読み込みして最新データを確認してください。');
                
                // ページリロード
                window.location.reload();
            });
            
            console.log('✅ キャッシュクリアボタンが設定されました');
        }

        // ボタンホバー効果
        this.menuButtonElements.forEach(button => {
            if (button) {
                button.addEventListener('mouseenter', () => {
                    this.game.audioManager.playSE('se_click.mp3', 0.3);
                });
            }
        });
    }


    /**
     * タイトルシーンを表示
     */
    async show() {
        if (this.isActive) return;
        
        console.log('タイトル画面を表示');
        
        // 他の画面の立ち絵を確実にクリア
        const endingSprite = document.getElementById('ending-character-sprite');
        if (endingSprite) {
            endingSprite.style.display = 'none';
            endingSprite.src = '';
            console.log('🗑️ エンディング画面の立ち絵をクリア');
        }
        
        // 開発用ボタンを強制表示
        const csvBtn = document.getElementById('btn-csv-reload');
        if (csvBtn) {
            csvBtn.style.cssText = 'background: #ff6b7d !important; font-size: 0.9em !important; display: block !important; visibility: visible !important; opacity: 1 !important;';
        }
        const badEndBtn = document.getElementById('btn-bad-end-editor');
        if (badEndBtn) {
            badEndBtn.style.cssText = 'background: #9B59B6 !important; font-size: 0.9em !important; display: block !important; visibility: visible !important; opacity: 1 !important;';
        }
        const showBadEndBtn = document.getElementById('btn-show-bad-end');
        if (showBadEndBtn) {
            showBadEndBtn.style.cssText = 'background: #E74C3C !important; font-size: 0.9em !important; display: block !important; visibility: visible !important; opacity: 1 !important;';
        }
        const clearCacheBtn = document.getElementById('btn-clear-cache');
        if (clearCacheBtn) {
            clearCacheBtn.style.cssText = 'background: #F39C12 !important; font-size: 0.9em !important; display: block !important; visibility: visible !important; opacity: 1 !important;';
        }
        
        // タイトル専用BGMを再生（自動クロスフェード）
        await this.game.audioManager.playSceneBGM('title', 2.0);
        
        // 夏の夕暮れアンビエント音を再生（セミの声・風鈴）
        this.game.audioManager.playSE('se_cicada_evening.mp3', 0.3).catch(() => {
            // ファイルがない場合は無視
            console.log('夏の夕暮れアンビエント音が見つかりません');
        });
        
        // 画面を表示
        this.titleScreen.classList.add('active');
        this.isActive = true;
        
        // フェードイン アニメーション
        this.titleScreen.style.opacity = '0';
        setTimeout(() => {
            this.titleScreen.style.transition = 'opacity 1s ease';
            this.titleScreen.style.opacity = '1';
            
            // フェードイン後に美咲の画像を設定（DOM更新後に確実に実行）
            setTimeout(() => {
                this.setupMisakiImage();
                
                // さらに遅延して再度確認
                setTimeout(() => {
                    const misakiCheck = document.getElementById('misaki-title');
                    if (misakiCheck) {
                        console.log('🔍 立ち絵チェック - 表示状態:', {
                            display: misakiCheck.style.display,
                            visibility: misakiCheck.style.visibility,
                            opacity: misakiCheck.style.opacity,
                            src: misakiCheck.src
                        });
                        
                        // 画像が設定されていない場合は強制設定
                        if (!misakiCheck.src || misakiCheck.src === '') {
                            misakiCheck.src = './assets/images/characters/misaki/misaki_adult_normal.png';
                            console.log('⚠️ 立ち絵が空だったため強制設定');
                        }
                    }
                }, 500);
            }, 200);
        }, 100);
    }

    /**
     * タイトルシーンを非表示
     */
    hide() {
        if (!this.isActive) return;
        
        console.log('タイトル画面を非表示');
        
        this.titleScreen.classList.remove('active');
        this.isActive = false;
    }

    /**
     * 美咲の画像を設定
     */
    setupMisakiImage() {
        console.log('🎭 タイトル画面の美咲立ち絵を設定中...');
        
        // 要素を再取得（確実に最新のDOM要素を取得）
        this.misakiImage = document.getElementById('misaki-title');
        
        if (!this.misakiImage) {
            console.error('❌ misaki-title要素が見つかりません！');
            return;
        }
        
        // 立ち絵を確実に表示状態にする（重要度の高いスタイルを強制）
        this.misakiImage.style.cssText = `
            display: block !important;
            visibility: visible !important;
            opacity: 1 !important;
            position: relative !important;
            z-index: 10 !important;
            max-height: 600px !important;
            transform: scale(1) !important;
        `;
        
        // デフォルト画像を直接設定（CSVに依存しない）
        const defaultImagePath = './assets/images/characters/misaki/misaki_adult_normal.png';
        
        console.log('✅ 美咲の立ち絵パス（強制設定）:', defaultImagePath);
        
        // 画像読み込み成功時
        this.misakiImage.onload = () => {
            console.log('✅ タイトル画面の美咲立ち絵読み込み成功');
            this.misakiImage.style.display = 'block !important';
            this.misakiImage.style.visibility = 'visible !important';
            this.misakiImage.style.opacity = '1 !important';
        };
        
        // 画像が存在しない場合のフォールバック
        this.misakiImage.onerror = () => {
            console.error('❌ 美咲の画像読み込みエラー:', defaultImagePath);
            // CSVから取得を試みる
            if (this.game.csvLoader) {
                const misakiData = this.game.csvLoader.findData('characters', 'character_id', 'misaki');
                if (misakiData && misakiData.default_image) {
                    const csvImagePath = `./assets/images/characters/misaki/${misakiData.default_image}`;
                    console.log('📋 CSVから画像パスを取得:', csvImagePath);
                    this.misakiImage.src = csvImagePath;
                } else {
                    this.createPlaceholderImage();
                }
            } else {
                this.createPlaceholderImage();
            }
        };
        
        // 画像を強制的に設定
        this.misakiImage.src = '';  // 一旦クリア
        setTimeout(() => {
            this.misakiImage.src = defaultImagePath;
        }, 10);
    }

    /**
     * プレースホルダー画像を作成
     */
    createPlaceholderImage() {
        if (this.misakiImage) {
            // SVGでプレースホルダーを作成
            const placeholder = `data:image/svg+xml;charset=UTF-8,%3Csvg width='300' height='500' xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='100%25' height='100%25' fill='%23ffb6c1'/%3E%3Ctext x='50%25' y='50%25' font-family='Arial' font-size='20' fill='%23fff' text-anchor='middle' dy='0.3em'%3E美咲お姉ちゃん%3C/text%3E%3C/svg%3E`;
            this.misakiImage.src = placeholder;
        }
    }

    /**
     * 美咲ホバー時の処理
     */
    onMisakiHover() {
        if (this.misakiImage) {
            this.misakiImage.style.transform = 'scale(1.02)';
            // 微笑みエフェクトを追加可能
        }
        
        // ホバー効果音
        this.game.audioManager.playSE('se_click.mp3', 0.2);
    }

    /**
     * 美咲ホバー終了時の処理
     */
    onMisakiLeave() {
        if (this.misakiImage) {
            this.misakiImage.style.transform = 'scale(1.0)';
        }
    }

    /**
     * 美咲クリック時の処理
     */
    onMisakiClick() {
        console.log('美咲がクリックされました');
        
        // 特別な反応を追加可能
        this.game.audioManager.playSE('se_click.mp3', 0.5);
        
        // 隠し要素のヒント表示など
        this.showMisakiMessage();
    }

    /**
     * 美咲からのメッセージ表示
     */
    showMisakiMessage() {
        // 簡単なメッセージ表示
        const messages = [
            'あら、私をクリックしたのね♪',
            '今夜は二人きり...どうする？',
            '昔みたいに野球拳、してみる？',
            'お姉ちゃんと呼んでくれる？'
        ];
        
        const randomMessage = messages[Math.floor(Math.random() * messages.length)];
        
        // 一時的にメッセージを表示
        this.showTemporaryMessage(randomMessage);
    }

    /**
     * 一時的なメッセージ表示
     * @param {string} message - 表示するメッセージ
     */
    showTemporaryMessage(message) {
        const messageDiv = document.createElement('div');
        messageDiv.style.cssText = `
            position: absolute;
            top: 60%;
            left: 60%;
            transform: translateX(-50%);
            background: rgba(0,0,0,0.8);
            color: #ffb6c1;
            padding: 10px 20px;
            border-radius: 10px;
            font-size: 1rem;
            font-weight: 600;
            z-index: 100;
            animation: fadeIn 0.3s ease;
        `;
        
        messageDiv.textContent = message;
        this.titleScreen.appendChild(messageDiv);
        
        // 3秒後に削除
        setTimeout(() => {
            if (messageDiv.parentNode) {
                messageDiv.style.animation = 'fadeOut 0.3s ease';
                setTimeout(() => {
                    messageDiv.remove();
                }, 300);
            }
        }, 3000);
    }

    /**
     * キーボード入力処理
     * @param {KeyboardEvent} event - キーボードイベント
     */
    handleKeyInput(event) {
        switch (event.code) {
            case 'ArrowUp':
                this.navigateMenu(-1);
                break;
            case 'ArrowDown':
                this.navigateMenu(1);
                break;
            case 'Enter':
            case 'Space':
                this.selectCurrentMenu();
                break;
            case 'Escape':
                // ESCでゲーム終了確認など
                this.showExitConfirm();
                break;
        }
    }

    /**
     * メニューナビゲーション
     * @param {number} direction - 移動方向 (-1: 上, 1: 下)
     */
    navigateMenu(direction) {
        // キーボードナビゲーションの実装
        const enabledButtons = this.menuButtonElements.filter(btn => btn && !btn.disabled);
        
        if (enabledButtons.length === 0) return;
        
        this.currentMenuIndex = (this.currentMenuIndex + direction) % enabledButtons.length;
        if (this.currentMenuIndex < 0) {
            this.currentMenuIndex = enabledButtons.length - 1;
        }
        
        // フォーカス設定
        enabledButtons[this.currentMenuIndex].focus();
        this.game.audioManager.playSE('se_click.mp3', 0.3);
    }

    /**
     * 現在選択中のメニューを実行
     */
    selectCurrentMenu() {
        const enabledButtons = this.menuButtonElements.filter(btn => btn && !btn.disabled);
        if (enabledButtons[this.currentMenuIndex]) {
            enabledButtons[this.currentMenuIndex].click();
        }
    }

    /**
     * 新しいゲームを開始
     */
    startNewGame() {
        console.log('新しいゲームを開始');
        this.game.audioManager.playSE('se_click.mp3', 0.7);
        
        // ゲーム開始処理
        this.hide();
        this.game.startNewGame();
    }

    /**
     * 遊び方を表示
     */
    showHowToPlay() {
        console.log('遊び方を表示');
        this.game.audioManager.playSE('se_click.mp3', 0.7);
        
        // 遊び方モーダルを表示
        this.showHowToPlayModal();
    }

    /**
     * 遊び方モーダルを表示
     */
    async showHowToPlayModal() {
        // 既存のモーダルを削除
        const existingModal = document.getElementById('howtoplay-modal');
        if (existingModal) {
            existingModal.remove();
        }

        // CSVデータから遊び方の内容を取得
        const howToPlayData = await this.loadHowToPlayData();

        // 遊び方モーダルを作成
        const modal = document.createElement('div');
        modal.id = 'howtoplay-modal';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.9);
            z-index: 10000;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            opacity: 0;
            transition: opacity 0.3s ease;
        `;

        const modalContent = document.createElement('div');
        modalContent.style.cssText = `
            background: linear-gradient(135deg, #2c2c2c 0%, #1a1a1a 100%);
            padding: 30px;
            border-radius: 20px;
            max-width: 80%;
            max-height: 80%;
            overflow-y: auto;
            border: 3px solid #ff6b7d;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
            color: white;
            font-family: 'Noto Sans JP', sans-serif;
        `;

        // ヘッダー
        const header = document.createElement('div');
        header.style.cssText = `
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
            border-bottom: 2px solid #ff6b7d;
            padding-bottom: 15px;
        `;

        const title = document.createElement('h2');
        title.textContent = '🎮 遊び方';
        title.style.cssText = `
            color: #ff6b7d;
            margin: 0;
            font-size: 1.8rem;
        `;

        const closeBtn = document.createElement('button');
        closeBtn.textContent = '✕';
        closeBtn.style.cssText = `
            background: #ff6b7d;
            color: white;
            border: none;
            border-radius: 50%;
            width: 40px;
            height: 40px;
            font-size: 1.2rem;
            cursor: pointer;
            transition: all 0.2s ease;
        `;
        closeBtn.addEventListener('click', () => {
            modal.style.opacity = '0';
            setTimeout(() => modal.remove(), 300);
        });

        header.appendChild(title);
        header.appendChild(closeBtn);

        // コンテンツをCSVデータから生成
        const content = document.createElement('div');
        content.innerHTML = this.generateHowToPlayContent(howToPlayData);

        modalContent.appendChild(header);
        modalContent.appendChild(content);
        modal.appendChild(modalContent);
        document.body.appendChild(modal);

        // アニメーションで表示
        setTimeout(() => {
            modal.style.opacity = '1';
        }, 10);

        // ESCキーで閉じる
        const handleKeydown = (e) => {
            if (e.key === 'Escape') {
                modal.style.opacity = '0';
                setTimeout(() => modal.remove(), 300);
                document.removeEventListener('keydown', handleKeydown);
            }
        };
        document.addEventListener('keydown', handleKeydown);
    }

    /**
     * CSVから遊び方データを読み込み
     * @returns {Array} 遊び方データの配列
     */
    async loadHowToPlayData() {
        try {
            if (!this.game.csvLoader) {
                console.warn('CSVLoaderが初期化されていません');
                return this.getFallbackHowToPlayData();
            }

            // CSVファイルを読み込み
            await this.game.csvLoader.loadCSV('how_to_play.csv');
            const data = this.game.csvLoader.getData('how_to_play');
            
            if (!data || data.length === 0) {
                console.warn('遊び方データが見つかりません、フォールバックデータを使用');
                return this.getFallbackHowToPlayData();
            }

            // 表示順序でソート
            return data.sort((a, b) => parseInt(a.display_order) - parseInt(b.display_order));
        } catch (error) {
            console.error('遊び方データの読み込みに失敗:', error);
            return this.getFallbackHowToPlayData();
        }
    }

    /**
     * フォールバックの遊び方データ
     * @returns {Array} デフォルトの遊び方データ
     */
    getFallbackHowToPlayData() {
        return [
            {
                section_id: 'about',
                title: 'ゲームについて',
                content: '「2人の秘密、野球拳。」は、幼馴染の美咲お姉ちゃんとの野球拳ゲームです。<br>大人になった二人の秘密の時間を楽しみましょう。',
                icon: '📖',
                display_order: '1'
            },
            {
                section_id: 'rules',
                title: '野球拳のルール',
                content: '<ul><li><strong>グー：</strong> チョキに勝つ、パーに負ける</li><li><strong>チョキ：</strong> パーに勝つ、グーに負ける</li><li><strong>パー：</strong> グーに勝つ、チョキに負ける</li><li><strong>あいこ：</strong> 同じ手の場合は引き分け</li></ul>',
                icon: '✊',
                display_order: '2'
            },
            {
                section_id: 'costume',
                title: '衣装システム',
                content: '<p>美咲の衣装は勝利数に応じて段階的に変化します。</p><p>勝利を重ねるごとに、より特別な衣装が楽しめます。</p>',
                icon: '👗',
                display_order: '4'
            },
            {
                section_id: 'footer',
                title: 'メッセージ',
                content: '🌸 大人になった二人の秘密の時間を楽しんでください 🌸',
                icon: '🌸',
                display_order: '7'
            }
        ];
    }

    /**
     * CSVデータから遊び方コンテンツのHTMLを生成
     * @param {Array} data - 遊び方データ
     * @returns {string} HTMLコンテンツ
     */
    generateHowToPlayContent(data) {
        let html = '';

        data.forEach(section => {
            // フッターセクションは特別な扱い
            if (section.section_id === 'footer') {
                html += `
                    <div style="text-align: center; margin-top: 30px;">
                        <p style="color: #ffb6c1; font-size: 1.1rem; font-weight: 600;">
                            ${section.content}
                        </p>
                    </div>
                `;
            } else {
                // 通常のセクション
                html += `
                    <div style="margin-bottom: 25px;">
                        <h3 style="color: #7ed6c4; margin-bottom: 10px; font-size: 1.3rem;">
                            ${section.icon} ${section.title}
                        </h3>
                        <div style="line-height: 1.6;">
                            ${section.content}
                        </div>
                    </div>
                `;
            }
        });

        return html;
    }

    /**
     * ギャラリーを開く
     */
    openGallery() {
        console.log('ギャラリーを開く');
        this.game.audioManager.playSE('se_click.mp3', 0.7);
        
        // ギャラリー画面を表示
        this.showGalleryModal();
    }

    /**
     * ギャラリーモーダルを表示
     */
    showGalleryModal() {
        // 既存のギャラリーモーダルを削除
        const existingModal = document.getElementById('gallery-modal');
        if (existingModal) {
            existingModal.remove();
        }

        // ギャラリーモーダルを作成
        const modal = document.createElement('div');
        modal.id = 'gallery-modal';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.9);
            z-index: 10000;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            opacity: 0;
            transition: opacity 0.3s ease;
        `;

        const galleryContent = document.createElement('div');
        galleryContent.style.cssText = `
            background: linear-gradient(135deg, #2c2c2c 0%, #1a1a1a 100%);
            padding: 30px;
            border-radius: 20px;
            max-width: 80%;
            max-height: 80%;
            overflow-y: auto;
            border: 3px solid #ff6b7d;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
        `;

        // ギャラリーヘッダー
        const header = document.createElement('div');
        header.style.cssText = `
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
            border-bottom: 2px solid #ff6b7d;
            padding-bottom: 15px;
        `;

        const title = document.createElement('h2');
        title.textContent = '🖼️ ギャラリー';
        title.style.cssText = `
            color: #ff6b7d;
            margin: 0;
            font-family: 'Noto Sans JP', sans-serif;
            font-size: 1.8rem;
        `;

        const closeBtn = document.createElement('button');
        closeBtn.textContent = '✕';
        closeBtn.style.cssText = `
            background: #ff6b7d;
            color: white;
            border: none;
            border-radius: 50%;
            width: 40px;
            height: 40px;
            font-size: 1.2rem;
            cursor: pointer;
            transition: all 0.2s ease;
        `;
        closeBtn.addEventListener('click', () => {
            modal.style.opacity = '0';
            setTimeout(() => modal.remove(), 300);
        });

        header.appendChild(title);
        header.appendChild(closeBtn);

        // ギャラリーグリッド
        const grid = document.createElement('div');
        grid.style.cssText = `
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-bottom: 20px;
        `;

        // ギャラリーアイテム（デモ用）
        const galleryItems = [
            { id: 'misaki_suit', name: '美咲 - OLスーツ', unlocked: true },
            { id: 'misaki_casual', name: '美咲 - カジュアル', unlocked: true },
            { id: 'misaki_room', name: '美咲 - 部屋着', unlocked: false },
            { id: 'misaki_camisole', name: '美咲 - キャミソール', unlocked: false },
            { id: 'misaki_towel', name: '美咲 - バスタオル', unlocked: false },
            { id: 'secret_cg_01', name: '隠しCG #1', unlocked: false }
        ];

        galleryItems.forEach(item => {
            const itemDiv = document.createElement('div');
            itemDiv.style.cssText = `
                background: ${item.unlocked ? '#3a3a3a' : '#2a2a2a'};
                border: 2px solid ${item.unlocked ? '#7ed6c4' : '#555'};
                border-radius: 10px;
                padding: 15px;
                text-align: center;
                cursor: ${item.unlocked ? 'pointer' : 'not-allowed'};
                transition: all 0.3s ease;
                position: relative;
                overflow: hidden;
            `;

            if (item.unlocked) {
                itemDiv.addEventListener('mouseenter', () => {
                    itemDiv.style.transform = 'scale(1.05)';
                    itemDiv.style.boxShadow = '0 5px 20px rgba(126, 214, 196, 0.4)';
                });
                itemDiv.addEventListener('mouseleave', () => {
                    itemDiv.style.transform = 'scale(1)';
                    itemDiv.style.boxShadow = 'none';
                });
            }

            const placeholder = document.createElement('div');
            placeholder.style.cssText = `
                width: 150px;
                height: 100px;
                background: ${item.unlocked ? 'linear-gradient(135deg, #7ed6c4, #48a999)' : '#666'};
                border-radius: 5px;
                margin: 0 auto 10px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 2rem;
            `;
            placeholder.textContent = item.unlocked ? '🎨' : '🔒';

            const nameLabel = document.createElement('div');
            nameLabel.textContent = item.name;
            nameLabel.style.cssText = `
                color: ${item.unlocked ? 'white' : '#888'};
                font-family: 'Noto Sans JP', sans-serif;
                font-size: 0.9rem;
                font-weight: ${item.unlocked ? '700' : '400'};
            `;

            itemDiv.appendChild(placeholder);
            itemDiv.appendChild(nameLabel);
            grid.appendChild(itemDiv);
        });

        // ギャラリー統計
        const stats = document.createElement('div');
        stats.style.cssText = `
            background: rgba(255, 107, 125, 0.1);
            border: 1px solid #ff6b7d;
            border-radius: 10px;
            padding: 15px;
            text-align: center;
            color: white;
            font-family: 'Noto Sans JP', sans-serif;
        `;
        
        const unlockedCount = galleryItems.filter(item => item.unlocked).length;
        const totalCount = galleryItems.length;
        stats.innerHTML = `
            <strong>収集状況:</strong> ${unlockedCount}/${totalCount} (${Math.round(unlockedCount/totalCount*100)}%)
            <br><small>隠し要素を見つけて新しいアイテムを解放しよう！</small>
        `;

        galleryContent.appendChild(header);
        galleryContent.appendChild(grid);
        galleryContent.appendChild(stats);
        modal.appendChild(galleryContent);
        document.body.appendChild(modal);

        // アニメーションで表示
        setTimeout(() => {
            modal.style.opacity = '1';
        }, 10);

        // ESCキーで閉じる
        const handleKeydown = (e) => {
            if (e.key === 'Escape') {
                modal.style.opacity = '0';
                setTimeout(() => modal.remove(), 300);
                document.removeEventListener('keydown', handleKeydown);
            }
        };
        document.addEventListener('keydown', handleKeydown);
    }

    /**
     * 設定画面を開く
     */
    openSettings() {
        console.log('設定画面を開く');
        this.game.audioManager.playSE('se_click.mp3', 0.7);
        
        // 設定画面（将来実装）
        this.showSettingsPanel();
    }

    /**
     * 設定パネルを表示
     */
    showSettingsPanel() {
        // 簡単な設定パネルを作成
        const settingsPanel = document.createElement('div');
        settingsPanel.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0,0,0,0.9);
            color: white;
            padding: 30px;
            border-radius: 15px;
            border: 2px solid #ff6b7d;
            z-index: 1000;
            min-width: 400px;
        `;
        
        const settings = this.game.saveSystem.loadSettings();
        
        settingsPanel.innerHTML = `
            <h2 style="margin-bottom: 20px; color: #ffb6c1;">設定</h2>
            <div style="margin-bottom: 15px;">
                <label>BGM音量: <span id="bgm-value">${Math.round(settings.bgmVolume * 100)}%</span></label>
                <input type="range" id="bgm-volume" min="0" max="100" value="${settings.bgmVolume * 100}" style="width: 100%; margin-top: 5px;">
            </div>
            <div style="margin-bottom: 15px;">
                <label>効果音音量: <span id="se-value">${Math.round(settings.seVolume * 100)}%</span></label>
                <input type="range" id="se-volume" min="0" max="100" value="${settings.seVolume * 100}" style="width: 100%; margin-top: 5px;">
            </div>
            <div style="text-align: center; margin-top: 25px;">
                <button id="settings-ok" style="margin-right: 10px; padding: 10px 20px; background: #ff6b7d; color: white; border: none; border-radius: 5px; cursor: pointer;">OK</button>
                <button id="settings-cancel" style="padding: 10px 20px; background: #666; color: white; border: none; border-radius: 5px; cursor: pointer;">キャンセル</button>
            </div>
        `;
        
        document.body.appendChild(settingsPanel);
        
        // 設定パネルのイベントリスナー
        this.setupSettingsPanelEvents(settingsPanel, settings);
    }

    /**
     * 設定パネルのイベント処理
     * @param {HTMLElement} panel - 設定パネル要素
     * @param {Object} currentSettings - 現在の設定
     */
    setupSettingsPanelEvents(panel, currentSettings) {
        const bgmSlider = panel.querySelector('#bgm-volume');
        const seSlider = panel.querySelector('#se-volume');
        const bgmValue = panel.querySelector('#bgm-value');
        const seValue = panel.querySelector('#se-value');
        
        // スライダー変更時の処理
        bgmSlider.addEventListener('input', (e) => {
            const volume = e.target.value / 100;
            bgmValue.textContent = `${e.target.value}%`;
            this.game.audioManager.setVolume('bgm', volume);
        });
        
        seSlider.addEventListener('input', (e) => {
            const volume = e.target.value / 100;
            seValue.textContent = `${e.target.value}%`;
            this.game.audioManager.setVolume('se', volume);
        });
        
        // OKボタン
        panel.querySelector('#settings-ok').addEventListener('click', () => {
            const newSettings = {
                ...currentSettings,
                bgmVolume: bgmSlider.value / 100,
                seVolume: seSlider.value / 100
            };
            
            this.game.saveSystem.saveSettings(newSettings);
            this.game.audioManager.setVolume('bgm', newSettings.bgmVolume);
            this.game.audioManager.setVolume('se', newSettings.seVolume);
            
            panel.remove();
        });
        
        // キャンセルボタン
        panel.querySelector('#settings-cancel').addEventListener('click', () => {
            // 元の設定に戻す
            this.game.audioManager.setVolume('bgm', currentSettings.bgmVolume);
            this.game.audioManager.setVolume('se', currentSettings.seVolume);
            panel.remove();
        });
    }

    /**
     * 終了確認ダイアログ
     */
    showExitConfirm() {
        const result = confirm('ゲームを終了しますか？');
        if (result && window.require) {
            // Electronの場合
            const { remote } = window.require('electron');
            remote.getCurrentWindow().close();
        }
    }

    /**
     * シーンの更新（アニメーションなど）
     */
    update() {
        if (!this.isActive) return;
        
        // 必要に応じてアニメーション更新処理を追加
    }

    /**
     * BAD END編集ボタンを動的作成
     */
    createBadEndEditorButton() {
        console.log('BAD END編集ボタンを動的作成中...');
        
        const menuButtons = document.querySelector('.menu-buttons');
        if (menuButtons) {
            const button = document.createElement('button');
            button.id = 'btn-bad-end-editor-dynamic';
            button.className = 'game-btn dev-btn';
            button.textContent = 'BAD END編集 (動的)';
            button.style.cssText = `
                background: #9B59B6 !important;
                color: white !important;
                font-size: 0.9em !important;
                display: block !important;
                visibility: visible !important;
                opacity: 1 !important;
                position: relative !important;
                z-index: 999 !important;
                margin: 10px 0 !important;
                padding: 15px 30px !important;
                border: none !important;
                border-radius: 25px !important;
                cursor: pointer !important;
                font-weight: bold !important;
            `;
            
            button.addEventListener('click', () => {
                alert('動的BAD END編集ボタンがクリックされました！');
                this.showSimpleBadEndEditor();
            });
            
            menuButtons.appendChild(button);
            console.log('✅ 動的BAD END編集ボタンを作成しました');
        }
    }

    /**
     * シンプルなBAD END編集画面を表示
     */
    showSimpleBadEndEditor() {
        console.log('シンプルなBAD END編集画面を表示');
        
        // 既存の編集画面があれば削除
        const existing = document.getElementById('simple-bad-end-editor');
        if (existing) {
            existing.remove();
        }
        
        // シンプルな編集画面を作成
        const editorDiv = document.createElement('div');
        editorDiv.id = 'simple-bad-end-editor';
        editorDiv.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            z-index: 10000;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-direction: column;
        `;
        
        editorDiv.innerHTML = `
            <div style="background: white; padding: 30px; border-radius: 10px; max-width: 600px; width: 90%;">
                <h2 style="text-align: center; color: #333; margin-bottom: 20px;">BAD END テキスト編集</h2>
                
                <div style="margin-bottom: 15px;">
                    <label style="display: block; font-weight: bold; margin-bottom: 5px;">タイトル:</label>
                    <input type="text" id="simple-title" value="また今度ね♪" style="width: 100%; padding: 10px; border: 1px solid #ccc; border-radius: 5px;">
                </div>
                
                <div style="margin-bottom: 15px;">
                    <label style="display: block; font-weight: bold; margin-bottom: 5px;">メッセージ:</label>
                    <textarea id="simple-message" style="width: 100%; padding: 10px; border: 1px solid #ccc; border-radius: 5px; height: 100px;">今日はここまでだね♪

またじゃんけんしてあげてもいーよー？</textarea>
                </div>
                
                <div style="text-align: center; margin-top: 20px;">
                    <button onclick="alert('保存しました！'); localStorage.setItem('bad_end_simple', JSON.stringify({title: document.getElementById('simple-title').value, message: document.getElementById('simple-message').value})); document.getElementById('simple-bad-end-editor').remove()" style="background: #27AE60; color: white; padding: 10px 20px; border: none; border-radius: 5px; margin-right: 10px; cursor: pointer;">保存</button>
                    <button onclick="document.getElementById('simple-bad-end-editor').remove()" style="background: #E74C3C; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer;">閉じる</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(editorDiv);
        console.log('✅ シンプルなBAD END編集画面を表示しました');
    }

    /**
     * 直接BAD ENDを表示
     */
    showBadEndDirectly() {
        console.log('🔴 直接BAD ENDを表示します');
        
        // 🚨 完全にキャッシュをクリア
        localStorage.clear();
        if (this.game.csvLoader && this.game.csvLoader.csvData) {
            this.game.csvLoader.csvData = {};
            console.log('🗑️ 全CSVキャッシュを削除');
        }
        
        // タイトル画面を非表示
        this.hide();
        
        // ゲーム状態をBAD END用にセット
        if (this.game.gameState) {
            this.game.gameState.isGameActive = false;
            this.game.gameState.currentPhase = 'ending';
        }
        
        // 直接BAD ENDを表示
        this.game.showEnding('bad_end');
        
        console.log('✅ BAD END表示完了');
    }

    /**
     * リソースをクリーンアップ
     */
    cleanup() {
        // イベントリスナーの削除など
        console.log('TitleScene cleanup');
    }
}

// グローバルに公開
window.TitleScene = TitleScene;