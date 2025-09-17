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
            console.log('✅ ギャラリーボタンを有効化しました');
        } else {
            console.warn('❌ ギャラリーボタンが見つかりません');
        }

        // 設定 ボタン
        const settingsBtn = document.getElementById('btn-settings');
        if (settingsBtn) {
            settingsBtn.addEventListener('click', () => {
                this.openSettings();
            });
        }

        // 秘めた想い... ボタン
        const secretFeelingsBtn = document.getElementById('btn-secret-feelings');
        if (secretFeelingsBtn) {
            secretFeelingsBtn.addEventListener('click', () => {
                this.startSecretGame();
            });
        }


        // ボタンホバー効果 (ClickSoundManagerと重複するため無効化)
        // this.menuButtonElements.forEach(button => {
        //     if (button) {
        //         button.addEventListener('mouseenter', () => {
        //             this.game.audioManager.playSE('se_click.mp3', 0.3);
        //         });
        //     }
        // });
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
        
        
        // BGMを即座に再生（環境に関係なく）
        console.log('🎵 タイトル画面: BGMを即座に再生開始');

        // 即座に再生を試行（エラーをキャッチ）
        try {
            await this.game.audioManager.playSceneBGM('title', 0.5);
        } catch (error) {
            console.log('⚠️ 初回BGM再生エラー（正常動作）:', error.message);
        }

        // 複数回の再試行で確実性を高める
        const retryDelays = [100, 300, 500, 1000, 2000];
        retryDelays.forEach(delay => {
            setTimeout(async () => {
                if (!this.game.audioManager.currentBgm ||
                    (this.game.audioManager.bgmAudio && this.game.audioManager.bgmAudio.paused)) {
                    console.log(`🎵 BGM再試行 (${delay}ms後)`);
                    try {
                        await this.game.audioManager.playSceneBGM('title', 0.3);
                    } catch (error) {
                        console.log(`⚠️ BGM再試行失敗 (${delay}ms):`, error.message);
                    }
                }
            }, delay);
        });

        // Electron環境の場合は追加の強制再生
        if (window.electronAPI && window.electronAPI.forcePlayBGM) {
            setTimeout(async () => {
                if (!this.game.audioManager.currentBgm) {
                    console.log('🎮 Electron: 強制BGM再生');
                    try {
                        const bgm = await window.electronAPI.forcePlayBGM('./assets/audio/bgm/bgm_title.mp3');
                        if (bgm) {
                            this.game.audioManager.bgmAudio = bgm;
                            this.game.audioManager.currentBgm = 'bgm_title.mp3';
                            console.log('✅ Electron強制再生成功');
                        }
                    } catch (error) {
                        console.log('⚠️ Electron強制再生失敗:', error.message);
                    }
                }
            }, 200);
        }

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
        // this.game.audioManager.playSE('se_click.mp3', 0.3); // ClickSoundManagerと重複するため無効化
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
     * 秘めた想いモードでゲームを開始
     */
    startSecretGame() {
        console.log('秘めた想いモードを開始');
        this.game.audioManager.playSE('se_click.mp3', 0.7);

        // 秘めた想いモード（パート2）として開始
        this.hide();
        this.game.startNewGame(true); // secretModeフラグをtrueに
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
                content: '「2人の秘密、野球拳。」は、幼馴染の美咲との野球拳バトルゲームです。<br>じゃんけんで勝負して、先に5勝した方の勝利となります。',
                icon: '📖',
                display_order: '1'
            },
            {
                section_id: 'rules',
                title: '野球拳のルール',
                content: '<ul><li><strong>グー（✊）：</strong> チョキに勝つ、パーに負ける</li><li><strong>チョキ（✂️）：</strong> パーに勝つ、グーに負ける</li><li><strong>パー（✋）：</strong> グーに勝つ、チョキに負ける</li><li><strong>あいこ：</strong> 同じ手の場合は引き分け（もう一度）</li></ul>',
                icon: '✊',
                display_order: '2'
            },
            {
                section_id: 'victory',
                title: '勝利条件',
                content: '<ul><li><strong>プレイヤー勝利：</strong> 5勝先取で勝利トークへ</li><li><strong>美咲勝利：</strong> 5敗するとBAD END</li><li><strong>最大9ラウンド：</strong> 勝負がつくまで続行</li></ul>',
                icon: '🏆',
                display_order: '3'
            },
            {
                section_id: 'features',
                title: 'ゲーム機能',
                content: '<ul><li><strong>ヒント機能：</strong> 困った時のヒントボタン</li><li><strong>降参機能：</strong> ゲームを途中で終了可能</li><li><strong>ハートUI：</strong> 残り勝利数をハートで表示</li><li><strong>ギャラリー：</strong> 獲得した立ち絵を鑑賞可能</li></ul>',
                icon: '🎮',
                display_order: '4'
            },
            {
                section_id: 'costume',
                title: '立ち絵システム',
                content: '<p>美咲の立ち絵は勝利数に応じて段階的に変化します。</p><p>勝利を重ねるほど、より特別な立ち絵が解放されます。</p>',
                icon: '👗',
                display_order: '5'
            },
            {
                section_id: 'footer',
                title: 'メッセージ',
                content: '🌸 美咲との野球拳バトルをお楽しみください 🌸',
                icon: '🌸',
                display_order: '6'
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
        console.log('🎨 ギャラリーを開く');
        this.game.audioManager.playSE('se_click.mp3', 0.7);
        
        // シンプルなモーダル方式でギャラリーを表示
        this.showGalleryModal();
    }

    /**
     * ギャラリーモーダルを表示
     */
    async showGalleryModal() {
        // 既存のギャラリーモーダルを削除
        const existingModal = document.getElementById('gallery-modal');
        if (existingModal) {
            existingModal.remove();
        }
        
        // JavaScriptデータの確認
        console.log('🔄 ギャラリー表示前にJavaScriptデータを確認');
        if (window.GalleryData) {
            console.log('✅ window.GalleryData利用可能:', window.GalleryData.length, '件');
        } else {
            console.warn('⚠️ window.GalleryDataが利用できません');
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

        // 実際のギャラリーデータを取得
        const galleryData = this.game.saveSystem.getGalleryData();
        console.log('📊 ギャラリーデータ取得:', galleryData);
        
        // CSVから立ち絵情報を取得
        const galleryItems = await this.loadGalleryItemsFromCode(galleryData);
        console.log('🎯 CSVから取得したギャラリーアイテム:', galleryItems);

        galleryItems.forEach(item => {
            const itemDiv = document.createElement('div');
            itemDiv.style.cssText = `
                background: ${item.unlocked ? '#3a3a3a' : '#2a2a2a'};
                border: 2px solid ${item.unlocked ? '#ff6b7d' : '#555'};
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
                    itemDiv.style.boxShadow = '0 5px 20px rgba(255, 107, 125, 0.4)';
                });
                itemDiv.addEventListener('mouseleave', () => {
                    itemDiv.style.transform = 'scale(1)';
                    itemDiv.style.boxShadow = 'none';
                });
                
                // クリックで拡大表示
                itemDiv.addEventListener('click', () => {
                    this.showImagePreview(item);
                });
            }

            // 画像表示エリア
            const imageArea = document.createElement('div');
            imageArea.style.cssText = `
                width: 150px;
                height: 200px;
                border-radius: 5px;
                margin: 0 auto 10px;
                display: flex;
                align-items: center;
                justify-content: center;
                background: ${item.unlocked ? '#444' : '#666'};
                overflow: hidden;
            `;
            
            if (item.unlocked) {
                // 実際の画像を表示
                const img = document.createElement('img');
                img.src = item.imagePath;
                img.alt = item.name;
                img.style.cssText = `
                    max-width: 100%;
                    max-height: 100%;
                    object-fit: contain;
                `;
                img.onerror = () => {
                    console.error(`❌ ギャラリー画像読み込みエラー Stage ${item.stage}: ${item.imagePath}`);
                    imageArea.innerHTML = '<div style="color: #ff6b7d; font-size: 2rem;">🎨</div>';
                };
                imageArea.appendChild(img);
            } else {
                // ロック状態
                imageArea.innerHTML = '<div style="color: #888; font-size: 2rem;">🔒</div>';
            }

            const nameLabel = document.createElement('div');
            nameLabel.textContent = item.name;
            nameLabel.style.cssText = `
                color: ${item.unlocked ? 'white' : '#888'};
                font-family: 'Noto Sans JP', sans-serif;
                font-size: 0.9rem;
                font-weight: ${item.unlocked ? '700' : '400'};
                margin-bottom: 5px;
            `;
            
            const descLabel = document.createElement('div');
            // 未獲得の場合は解放条件を表示、獲得済みの場合は説明を表示
            // ただし、解放条件が空の場合は何も表示しない
            const displayText = item.unlocked ? item.description : (item.unlockCondition || '');
            descLabel.textContent = displayText;
            descLabel.style.cssText = `
                color: ${item.unlocked ? '#ccc' : '#666'};
                font-family: 'Noto Sans JP', sans-serif;
                font-size: 0.7rem;
                line-height: 1.2;
            `;

            itemDiv.appendChild(imageArea);
            itemDiv.appendChild(nameLabel);
            itemDiv.appendChild(descLabel);
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
        const percentage = totalCount > 0 ? Math.round(unlockedCount/totalCount*100) : 0;
        
        // 現在の進行状況に応じたメッセージ
        let progressMessage = '';
        if (unlockedCount === 0) {
            progressMessage = '美咲との野球拳バトルで勝利して立ち絵を獲得しよう！';
        } else if (unlockedCount < 3) {
            progressMessage = '順調に獲得中！もっと勝利を重ねよう！';
        } else if (unlockedCount < 6) {
            progressMessage = 'もう少しで全ての立ち絵をコンプリート！';
        } else {
            progressMessage = '🎉 全ての立ち絵をコンプリートしました！';
        }
        
        stats.innerHTML = `
            <strong>収集状況:</strong> ${unlockedCount}/${totalCount} (${percentage}%)
            <br>
            <strong>総勝利数:</strong> ${galleryData.totalWins || 0}回
            <br><small>${progressMessage}</small>
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

        // デバッグ用ログ
        console.log('🔧 設定画面で読み込んだ設定:', settings);
        console.log('🔊 BGM音量値:', settings.bgmVolume);

        // BGM音量が未定義の場合はデフォルト値を使用
        const bgmVolume = settings.bgmVolume !== undefined ? settings.bgmVolume : 0.4;

        settingsPanel.innerHTML = `
            <h2 style="margin-bottom: 20px; color: #ffb6c1;">設定</h2>
            <div style="margin-bottom: 15px;">
                <label>BGM音量: <span id="bgm-value">${Math.round(bgmVolume * 100)}%</span></label>
                <input type="range" id="bgm-volume" min="0" max="100" value="${bgmVolume * 100}" style="width: 100%; margin-top: 5px;">
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
     * CSVから立ち絵データを読み込み
     * @param {Object} galleryData - 現在のギャラリーデータ
     * @returns {Array} 立ち絵アイテムの配列
     */
    async loadGalleryItemsFromCode(galleryData) {
        try {
            console.log('📋 gallery_data.jsから立ち絵データを読み込み開始...');
            
            // gallery_data.jsからデータを取得
            if (!window.GalleryData || !Array.isArray(window.GalleryData)) {
                console.warn('⚠️ window.GalleryDataが利用できません。フォールバックデータを使用します。');
                return this.getFallbackGalleryItems(galleryData);
            }

            const galleryDataSource = window.GalleryData;
            console.log('📋 gallery_data.js 読み込み完了:', galleryDataSource);

            // JavaScriptデータからギャラリーアイテムを作成
            const galleryItems = galleryDataSource.map(row => {
                const stage = parseInt(row.stage);
                const imageName = row.image_file;
                const imageId = `stage${stage}_${imageName}`;
                const isUnlocked = galleryData.unlockedImages.includes(imageId);
                
                console.log(`🔍 Stage ${stage} データ:`, {
                    displayName: row.display_name,
                    description: row.description,
                    unlockCondition: row.unlock_condition
                });
                
                return {
                    id: imageId,
                    name: row.display_name || `美咲 Stage ${stage}`,
                    imagePath: `./assets/images/characters/misaki/${imageName}`,
                    unlocked: isUnlocked,
                    stage: stage,
                    description: row.description || (stage === 1 ? '' : `${stage}勝で解放`),
                    unlockCondition: row.unlock_condition || (stage === 1 ? '' : `${stage}回勝利で解放`)
                };
            });

            // ステージ順でソート
            galleryItems.sort((a, b) => a.stage - b.stage);
            
            console.log('✅ JavaScriptファイルから立ち絵データを正常に読み込みました');
            console.log('✅ 最終的なギャラリーアイテム:', galleryItems);
            return galleryItems;
            
        } catch (error) {
            console.error('❌ JavaScript読み込みエラー:', error);
            console.warn('⚠️ フォールバックデータを使用します。');
            return this.getFallbackGalleryItems(galleryData);
        }
    }


    /**
     * フォールバック用の立ち絵データを取得
     * @param {Object} galleryData - 現在のギャラリーデータ
     * @returns {Array} 立ち絵アイテムの配列
     */
    getFallbackGalleryItems(galleryData) {
        const fallbackData = [
            { stage: 1, display_name: '美咲 - 初期状態', description: 'ゲーム開始時の美咲の姿' },
            { stage: 2, display_name: '美咲 - 1勝後', description: '少し動揺した美咲の表情' },
            { stage: 3, display_name: '美咲 - 2勝後', description: '上着を脱いだ美咲' },
            { stage: 4, display_name: '美咲 - 3勝後', description: 'さらに薄着になった美咲' },
            { stage: 5, display_name: '美咲 - 4勝後', description: '恥ずかしそうな美咲' },
            { stage: 6, display_name: '美咲 - 完全勝利', description: '完全に負けた美咲' }
        ];

        return fallbackData.map(item => {
            const imageName = `misaki_game_stage${item.stage}.png`;
            const imageId = `stage${item.stage}_${imageName}`;
            const isUnlocked = galleryData.unlockedImages.includes(imageId);
            
            return {
                id: imageId,
                name: item.display_name,
                imagePath: `./assets/images/characters/misaki/${imageName}`,
                unlocked: isUnlocked,
                stage: item.stage,
                description: item.description,
                unlockCondition: item.stage === 1 ? '' : `${item.stage}回勝利で解放`
            };
        });
    }

    /**
     * ステージの説明を取得（レガシー関数、CSVで管理するため非推奨）
     * @param {number} stage - ステージ番号
     * @returns {string} ステージの説明
     * @deprecated CSVから取得するため、この関数は使用されません
     */
    getStageDescription(stage) {
        const descriptions = {
            1: '初期衣装 - バトル開始時',
            2: '1勝後 - 少し乱れた様子',
            3: '2勝後 - 上着を脱いだ状態',
            4: '3勝後 - さらに薄着に',
            5: '4勝後 - 最終段階',
            6: '5勝後 - 完全勝利'
        };
        return descriptions[stage] || `${stage}勝で解放`;
    }
    
    /**
     * 画像プレビューを表示
     * @param {Object} item - ギャラリーアイテム
     */
    showImagePreview(item) {
        console.log('🖼️ 画像プレビューを表示:', item.name);
        
        // プレビューモーダルを作成
        const previewModal = document.createElement('div');
        previewModal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.95);
            z-index: 20000;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
        `;
        
        const imageContainer = document.createElement('div');
        imageContainer.style.cssText = `
            max-width: 90%;
            max-height: 90%;
            text-align: center;
        `;
        
        const previewImg = document.createElement('img');
        previewImg.src = item.imagePath;
        previewImg.alt = item.name;
        previewImg.style.cssText = `
            max-width: 100%;
            max-height: 80vh;
            object-fit: contain;
            border-radius: 10px;
            box-shadow: 0 10px 50px rgba(0, 0, 0, 0.8);
        `;
        
        // 画像読み込みエラーハンドリング
        previewImg.onerror = () => {
            console.error(`❌ 画像読み込みエラー: ${item.imagePath}`);
            console.log('🔍 画像情報:', {
                name: item.name,
                stage: item.stage,
                imagePath: item.imagePath,
                description: item.description
            });
            previewImg.src = './assets/images/placeholder.png'; // フォールバック画像
        };
        
        previewImg.onload = () => {
            console.log(`✅ 画像読み込み成功: ${item.imagePath}`);
        };
        
        const titleLabel = document.createElement('div');
        titleLabel.textContent = item.name;
        titleLabel.style.cssText = `
            color: white;
            font-family: 'Noto Sans JP', sans-serif;
            font-size: 1.5rem;
            font-weight: bold;
            margin-top: 20px;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.8);
        `;
        
        const closeHint = document.createElement('div');
        closeHint.textContent = 'クリックして閉じる';
        closeHint.style.cssText = `
            color: #ccc;
            font-family: 'Noto Sans JP', sans-serif;
            font-size: 1rem;
            margin-top: 10px;
        `;
        
        imageContainer.appendChild(previewImg);
        imageContainer.appendChild(titleLabel);
        imageContainer.appendChild(closeHint);
        previewModal.appendChild(imageContainer);
        
        // クリックで閉じる
        previewModal.addEventListener('click', () => {
            previewModal.remove();
        });
        
        // ESCキーで閉じる
        const handleKeydown = (e) => {
            if (e.key === 'Escape') {
                previewModal.remove();
                document.removeEventListener('keydown', handleKeydown);
            }
        };
        document.addEventListener('keydown', handleKeydown);
        
        document.body.appendChild(previewModal);
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