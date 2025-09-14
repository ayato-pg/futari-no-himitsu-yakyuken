/**
 * GalleryScene.js - ULTIMATE FIX 2025-09-14 23:50:00
 * ギャラリー画面を管理するクラス
 * 解放された立ち絵を表示（7枚対応版 - シークレット含む）
 *
 * === 最終確認用バージョン ===
 * - ループは確実に1-7（547行目で確認）
 * - アラートで実行確認と枚数表示
 * - Stage 7はシークレットカードとして特別処理
 *
 * もしアラートが表示されない場合：
 * 1. Ctrl+Shift+R でハードリロード
 * 2. キャッシュをクリア
 * 3. ファイルが保存されているか確認
 */

class GalleryScene {
    constructor(gameController) {
        this.game = gameController;
        this.isActive = false;
        this.currentPage = 0;
        this.imagesPerPage = 6;
        
        // DOM要素への参照
        this.galleryScreen = null;
        this.galleryGrid = null;
        this.pageInfo = null;
        this.prevBtn = null;
        this.nextBtn = null;
        
        this.initialize();
    }

    /**
     * ギャラリー画面を初期化
     */
    initialize() {
        console.log('GalleryScene初期化開始');
        
        // ギャラリー画面のHTMLを作成
        this.createGalleryHTML();
        
        // DOM要素を取得
        this.galleryScreen = document.getElementById('gallery-screen');
        this.galleryGrid = document.getElementById('gallery-grid');
        this.pageInfo = document.getElementById('gallery-page-info');
        this.prevBtn = document.getElementById('gallery-prev');
        this.nextBtn = document.getElementById('gallery-next');
        
        console.log('DOM要素取得結果:', {
            galleryScreen: this.galleryScreen,
            galleryGrid: this.galleryGrid,
            pageInfo: this.pageInfo,
            prevBtn: this.prevBtn,
            nextBtn: this.nextBtn
        });
        
        this.setupEventListeners();

        // 最終バックアップ: 定期的にシークレット枠をチェック
        this.startSecretSlotChecker();

        console.log('GalleryScene初期化完了');
    }

    /**
     * シークレット枠チェッカーを開始
     */
    startSecretSlotChecker() {
        console.log('🔮 シークレット枠チェッカーを開始');

        // 2秒ごとにチェック（最大10回まで）
        let checkCount = 0;
        const checker = setInterval(() => {
            checkCount++;

            if (this.galleryGrid && this.galleryGrid.children.length < 7) {
                console.log(`🚨 チェック${checkCount}: 現在${this.galleryGrid.children.length}枚。7枚目を追加`);
                const missingCard = document.createElement('div');
                missingCard.className = 'gallery-card secret-card';
                missingCard.style.cssText = `
                    background: linear-gradient(135deg, #ff00ff 0%, #ffd700 100%);
                    border: 3px solid #ffd700;
                    border-radius: 15px;
                    padding: 20px;
                    text-align: center;
                    color: white;
                    cursor: default;
                    position: relative;
                    aspect-ratio: 3/4;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    box-shadow: 0 0 20px rgba(255, 215, 0, 0.4);
                `;
                missingCard.innerHTML = `
                    <div style="font-size: 48px;">🔮</div>
                    <div style="font-size: 16px; font-weight: bold;">シークレット</div>
                    <div style="font-size: 12px;">ゲームクリアで解放</div>
                `;
                this.galleryGrid.appendChild(missingCard);
                console.log(`✅ チェック${checkCount}: 7枚目追加完了`);
                clearInterval(checker);
            } else if (this.galleryGrid && this.galleryGrid.children.length >= 7) {
                console.log(`✅ チェック${checkCount}: ${this.galleryGrid.children.length}枚確認済み`);
                clearInterval(checker);
            } else if (checkCount >= 10) {
                console.log(`⏰ チェック${checkCount}: 最大試行回数に達したためチェッカーを停止`);
                clearInterval(checker);
            } else {
                console.log(`🔍 チェック${checkCount}: ギャラリーグリッド待機中...`);
            }
        }, 2000);
    }

    /**
     * ギャラリー画面のHTMLを作成
     */
    createGalleryHTML() {
        console.log('🎨 ギャラリーHTML作成開始');
        
        // 既存の要素があれば削除
        const existingGallery = document.getElementById('gallery-screen');
        if (existingGallery) {
            console.log('🗑️ 既存のギャラリー要素を削除');
            existingGallery.remove();
        }
        
        const galleryHTML = `
            <div id="gallery-screen" class="screen">
                <div class="background" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);"></div>
                <button class="return-to-title-btn" id="gallery-return-btn">タイトルへ戻る</button>
                
                <div class="gallery-content" style="padding: 20px; max-width: 1200px; margin: 0 auto;">
                    <h1 style="color: white; text-align: center; margin-bottom: 30px; font-size: 2.5em; text-shadow: 2px 2px 4px rgba(0,0,0,0.3);">
                        🎨 ギャラリー
                    </h1>
                    
                    <div class="gallery-stats" style="background: rgba(255,255,255,0.1); padding: 15px; border-radius: 10px; margin-bottom: 30px; color: white; text-align: center;">
                        <div id="gallery-unlock-count" style="font-size: 1.2em;">解放済み: 0 / 7</div>
                        <div id="gallery-total-wins" style="font-size: 0.9em; opacity: 0.8; margin-top: 5px;">総勝利数: 0</div>
                    </div>
                    
                    <div id="gallery-grid" style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-bottom: 30px; min-height: 600px;">
                        <!-- 立ち絵カードがここに生成される -->
                        <!-- プリセット7番目シークレット枠 -->
                        <div id="preset-secret-card" class="gallery-card secret-card" style="
                            background: linear-gradient(135deg, #2a2a2a 0%, #1a1a1a 100%);
                            border: 3px solid #ffd700;
                            border-radius: 15px;
                            padding: 20px;
                            text-align: center;
                            color: white;
                            cursor: default;
                            transition: all 0.3s ease;
                            position: relative;
                            aspect-ratio: 3/4;
                            display: flex;
                            flex-direction: column;
                            align-items: center;
                            justify-content: center;
                            box-shadow: 0 0 20px rgba(255, 215, 0, 0.4);
                            display: none;
                        ">
                            <div style="font-size: 48px; margin-bottom: 15px; opacity: 0.8;">🔮</div>
                            <div style="font-size: 16px; font-weight: bold; color: #ffd700; text-shadow: 1px 1px 2px rgba(0,0,0,0.5);">シークレット</div>
                            <div style="font-size: 12px; margin-top: 8px; color: rgba(255,255,255,0.7); line-height: 1.3;">ゲームクリアで解放</div>
                            <div style="position: absolute; top: 10px; right: 10px; font-size: 20px; opacity: 0.4;">✨</div>
                        </div>
                    </div>
                    
                    <div class="gallery-navigation" style="display: flex; justify-content: center; align-items: center; gap: 20px;">
                        <button id="gallery-prev" class="gallery-nav-btn" style="background: #FF6B7D; color: white; border: none; padding: 10px 20px; border-radius: 25px; cursor: pointer; font-size: 16px;">
                            ← 前へ
                        </button>
                        <span id="gallery-page-info" style="color: white; font-size: 16px;">1 / 1</span>
                        <button id="gallery-next" class="gallery-nav-btn" style="background: #FF6B7D; color: white; border: none; padding: 10px 20px; border-radius: 25px; cursor: pointer; font-size: 16px;">
                            次へ →
                        </button>
                    </div>
                </div>
                
                <!-- 立ち絵プレビューモーダル -->
                <div id="gallery-modal" style="display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.9); z-index: 10000; cursor: pointer;">
                    <div style="display: flex; justify-content: center; align-items: center; height: 100%;">
                        <img id="gallery-modal-image" src="" alt="" style="max-width: 90%; max-height: 90%; object-fit: contain;">
                    </div>

                <!-- シークレット用スパークルアニメーション -->
                <style>
                    @keyframes sparkleAnimation {
                        0% { opacity: 0.3; transform: scale(1); }
                        50% { opacity: 0.8; transform: scale(1.2); }
                        100% { opacity: 0.3; transform: scale(1); }
                    }

                    .secret-card {
                        position: relative;
                        overflow: hidden;
                    }

                    .secret-card::before {
                        content: '';
                        position: absolute;
                        top: -50%;
                        left: -50%;
                        width: 200%;
                        height: 200%;
                        background: radial-gradient(circle, rgba(255,215,0,0.1) 0%, transparent 70%);
                        animation: secretGlow 3s ease-in-out infinite;
                        pointer-events: none;
                    }

                    @keyframes secretGlow {
                        0%, 100% { opacity: 0; transform: scale(0.8) rotate(0deg); }
                        50% { opacity: 1; transform: scale(1.2) rotate(180deg); }
                    }

                    .secret-card.unlocked::before {
                        background: radial-gradient(circle, rgba(255,215,0,0.2) 0%, transparent 70%);
                    }
                </style>
                    <div style="position: absolute; top: 20px; right: 20px; color: white; font-size: 30px; cursor: pointer;">✕</div>
                </div>
            </div>
        `;
        
        // HTMLを追加
        const gameContainer = document.getElementById('game-container');
        if (gameContainer) {
            gameContainer.insertAdjacentHTML('beforeend', galleryHTML);
            console.log('✅ ギャラリーHTMLをDOMに追加しました');
            
            // DOMが確実に追加されるまで少し待つ
            setTimeout(() => {
                const addedElement = document.getElementById('gallery-screen');
                console.log('🔍 追加確認結果:', {
                    found: !!addedElement,
                    id: addedElement?.id,
                    parent: addedElement?.parentElement?.id,
                    children: addedElement?.children.length
                });
                
                if (addedElement) {
                    // テスト用ボタンを追加
                    this.addTestButton();
                    
                    // イベントリスナーを再設定
                    this.setupEventListeners();
                } else {
                    console.error('❌ ギャラリー要素の追加に失敗しました');
                }
            }, 10);
        } else {
            console.error('❌ game-containerが見つかりません');
        }
    }

    /**
     * テスト用ボタンを追加（デバッグ用）
     */
    addTestButton() {
        const galleryContent = document.querySelector('.gallery-content');
        if (galleryContent) {
            // 表示確認テストボタン
            const visibilityTestButton = document.createElement('button');
            visibilityTestButton.textContent = '👁️ 表示テスト';
            visibilityTestButton.style.cssText = `
                background: #3498db;
                color: white;
                border: none;
                padding: 10px 20px;
                border-radius: 5px;
                cursor: pointer;
                margin: 10px;
                font-size: 14px;
            `;
            
            visibilityTestButton.addEventListener('click', () => {
                alert('ギャラリー画面が表示されています！このボタンが見えているなら表示は正常です。');
                console.log('✅ ギャラリー画面表示確認');
                console.log('現在のDOMツリー:', document.getElementById('gallery-screen'));
            });
            
            const ultimateUnlockButton = document.createElement('button');
            ultimateUnlockButton.id = 'ultimate-unlock-all-stages';
            ultimateUnlockButton.innerHTML = '🎉 全7ステージ一括解放（シークレット含む）';
            ultimateUnlockButton.setAttribute('style', `
                background: linear-gradient(135deg, #ff1744, #ffd700) !important;
                color: white !important;
                border: none !important;
                padding: 18px 25px !important;
                border-radius: 12px !important;
                cursor: pointer !important;
                margin: 15px auto !important;
                font-size: 16px !important;
                font-weight: bold !important;
                display: block !important;
                width: 90% !important;
                max-width: 350px !important;
                text-align: center !important;
                box-shadow: 0 4px 12px rgba(255, 23, 68, 0.4) !important;
                transition: all 0.3s ease !important;
                z-index: 1000 !important;
            `);

            // ホバー効果
            ultimateUnlockButton.addEventListener('mouseenter', function() {
                this.style.transform = 'scale(1.05)';
                this.style.boxShadow = '0 6px 16px rgba(255, 23, 68, 0.6)';
            });

            ultimateUnlockButton.addEventListener('mouseleave', function() {
                this.style.transform = 'scale(1)';
                this.style.boxShadow = '0 4px 12px rgba(255, 23, 68, 0.4)';
            });

            ultimateUnlockButton.addEventListener('click', () => {
                console.log('🎉 究極全ステージ解放ボタンがクリックされました');

                if (!this.game || !this.game.saveSystem) {
                    alert('❌ ゲームシステムエラー');
                    return;
                }

                let newUnlockCount = 0;
                let totalUnlocked = 0;

                // Stage 1-7を完全に解放
                for (let stageNum = 1; stageNum <= 7; stageNum++) {
                    let imageFileName;
                    if (stageNum === 7) {
                        imageFileName = 'misaki_secret_victory.png';
                    } else {
                        imageFileName = `misaki_game_stage${stageNum}.png`;
                    }

                    const wasNew = this.game.saveSystem.unlockGalleryImage(imageFileName, stageNum);
                    if (wasNew) newUnlockCount++;
                    totalUnlocked++;

                    console.log(`🎯 Stage ${stageNum} (${imageFileName}): ${wasNew ? '新規解放！' : '既に解放済み'}`);
                }

                // ギャラリーデータを取得して確認
                const currentGalleryData = this.game.saveSystem.getGalleryData();
                console.log('📊 最新ギャラリーデータ:', currentGalleryData);
                console.log('📋 解放済み画像一覧:', currentGalleryData.unlockedImages);

                // ギャラリー表示を強制更新
                console.log('🔄 ギャラリー表示を強制更新中...');
                this.updateGalleryDisplay();

                // 統計表示を更新
                const unlockCountDisplay = document.getElementById('gallery-unlock-count');
                if (unlockCountDisplay) {
                    unlockCountDisplay.textContent = `解放済み: ${currentGalleryData.unlockedImages.length} / 7`;
                    unlockCountDisplay.style.color = '#ffd700';
                    unlockCountDisplay.style.fontWeight = 'bold';
                    unlockCountDisplay.style.fontSize = '1.3em';
                }

                // 成功メッセージ
                alert(`🎉 全7ステージ解放完了！\n\n✨ 新規解放: ${newUnlockCount}枚\n📊 総解放数: ${currentGalleryData.unlockedImages.length} / 7\n🔮 シークレット立ち絵も含めて完全解放！\n\nギャラリーで確認してください！`);

                // ボタンの見た目を変更（完了状態）
                this.style.background = 'linear-gradient(135deg, #4caf50, #8bc34a)';
                this.innerHTML = '✅ 全7ステージ解放完了';
                this.style.cursor = 'default';

                console.log('✅ 全7ステージ解放処理完了');
            });
            
            galleryContent.insertBefore(visibilityTestButton, galleryContent.firstChild);
            galleryContent.insertBefore(ultimateUnlockButton, galleryContent.firstChild);
        }
    }

    /**
     * イベントリスナーを設定
     */
    setupEventListeners() {
        // タイトルへ戻るボタン
        const returnBtn = document.getElementById('gallery-return-btn');
        if (returnBtn) {
            returnBtn.addEventListener('click', () => {
                this.hide();
                this.game.titleScene.show();
            });
        }
        
        // ページネーション
        if (this.prevBtn) {
            this.prevBtn.addEventListener('click', () => {
                if (this.currentPage > 0) {
                    this.currentPage--;
                    this.updateGalleryDisplay();
                }
            });
        }
        
        if (this.nextBtn) {
            this.nextBtn.addEventListener('click', () => {
                const totalPages = this.getTotalPages();
                if (this.currentPage < totalPages - 1) {
                    this.currentPage++;
                    this.updateGalleryDisplay();
                }
            });
        }
        
        // モーダル閉じる
        const modal = document.getElementById('gallery-modal');
        if (modal) {
            modal.addEventListener('click', () => {
                modal.style.display = 'none';
            });
        }
    }

    /**
     * ギャラリー画面を表示
     */
    show() {
        console.log('ギャラリー画面show()開始');
        
        // まずギャラリー画面が存在するかチェックし、なければ再作成
        let galleryElement = document.getElementById('gallery-screen');
        if (!galleryElement) {
            console.log('🔧 ギャラリー要素が存在しないため、強制再作成します');
            this.createGalleryHTML();
            galleryElement = document.getElementById('gallery-screen');
        }
        
        // すべての画面を非表示にする
        this.hideAllScreens();
        
        // DOM要素を再取得して確実に最新の要素を使用
        this.galleryScreen = document.getElementById('gallery-screen');
        this.galleryGrid = document.getElementById('gallery-grid');
        this.pageInfo = document.getElementById('gallery-page-info');
        this.prevBtn = document.getElementById('gallery-prev');
        this.nextBtn = document.getElementById('gallery-next');
        
        console.log('🔍 DOM要素再取得結果:', {
            galleryScreen: !!this.galleryScreen,
            galleryGrid: !!this.galleryGrid,
            galleryScreenId: this.galleryScreen?.id,
            galleryScreenParent: this.galleryScreen?.parentElement?.id
        });
        
        this.isActive = true;
        this.currentPage = 0;
        
        if (this.galleryScreen) {
            // main.cssの.screenルールをオーバーライドするために、非常に高い優先度で強制表示
            this.galleryScreen.setAttribute('style', `
                display: block !important;
                opacity: 1 !important;
                visibility: visible !important;
                z-index: 9999 !important;
                position: absolute !important;
                top: 0 !important;
                left: 0 !important;
                width: 100% !important;
                height: 100% !important;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
            `);
            
            // activeクラスも追加（CSSアニメーション用）
            this.galleryScreen.classList.add('active');
            
            console.log('✅ 強制スタイル適用完了');
            console.log('📋 現在の要素状況:', {
                tagName: this.galleryScreen.tagName,
                className: this.galleryScreen.className,
                style: this.galleryScreen.getAttribute('style'),
                computedDisplay: getComputedStyle(this.galleryScreen).display,
                computedOpacity: getComputedStyle(this.galleryScreen).opacity,
                computedZIndex: getComputedStyle(this.galleryScreen).zIndex
            });
        } else {
            console.error('❌ ギャラリー画面要素の作成に失敗しました');
            alert('ギャラリー画面の表示に失敗しました。ページを再読み込みしてください。');
            return;
        }
        
        // ギャラリーデータを更新（少し遅延させて確実にDOM準備完了後に実行）
        setTimeout(() => {
            this.updateGalleryDisplay();
        }, 10);

        // 最終バックアップ: 500ms後にシークレット枠の存在をチェック
        setTimeout(() => {
            console.log('🚨 最終バックアップチェック開始');

            if (this.galleryGrid) {
                console.log(`📊 現在のカード数: ${this.galleryGrid.children.length}`);

                // 7つ目の枠がない場合は強制追加
                if (this.galleryGrid.children.length < 7) {
                    console.log('🔥 シークレット枠を絶対確実に追加');

                    const ultimateSecretCard = document.createElement('div');
                    ultimateSecretCard.id = 'ultimate-secret-card';
                    ultimateSecretCard.style.cssText = `
                        background: linear-gradient(135deg, #ff1744 0%, #ffd700 100%) !important;
                        border: 4px solid #ffd700 !important;
                        border-radius: 15px !important;
                        padding: 20px !important;
                        text-align: center !important;
                        color: white !important;
                        cursor: default !important;
                        position: relative !important;
                        width: 150px !important;
                        height: 200px !important;
                        display: flex !important;
                        flex-direction: column !important;
                        align-items: center !important;
                        justify-content: center !important;
                        box-shadow: 0 0 30px rgba(255, 215, 0, 0.8) !important;
                        z-index: 9999 !important;
                        animation: ultimateGlow 1s infinite alternate !important;
                    `;
                    ultimateSecretCard.innerHTML = `
                        <div style="font-size: 48px; margin-bottom: 10px;">🔮</div>
                        <div style="font-size: 16px; font-weight: bold; color: #ffd700;">シークレット</div>
                        <div style="font-size: 12px; margin-top: 5px; color: white;">ゲームクリアで解放</div>
                        <div style="position: absolute; top: 5px; right: 5px; font-size: 20px;">✨</div>
                    `;

                    // アニメーション追加
                    if (!document.getElementById('ultimate-glow-style')) {
                        const style = document.createElement('style');
                        style.id = 'ultimate-glow-style';
                        style.textContent = `
                            @keyframes ultimateGlow {
                                0% { box-shadow: 0 0 30px rgba(255, 215, 0, 0.8) !important; }
                                100% { box-shadow: 0 0 50px rgba(255, 215, 0, 1) !important; }
                            }
                        `;
                        document.head.appendChild(style);
                    }

                    this.galleryGrid.appendChild(ultimateSecretCard);
                    console.log('🎉 ULTIMATE SECRET CARD 追加完了！');
                }
            } else {
                console.error('❌ galleryGridが見つかりません');
            }
        }, 500);

        console.log('✅ ギャラリー画面表示処理完了');
    }

    /**
     * すべての画面を非表示にする
     */
    hideAllScreens() {
        console.log('🔄 すべての画面を非表示にします');
        
        const screens = document.querySelectorAll('.screen');
        screens.forEach(screen => {
            if (screen.id !== 'gallery-screen') {
                screen.classList.remove('active');
                screen.style.display = 'none';
                console.log(`📴 画面を非表示: ${screen.id}`);
            }
        });
    }

    /**
     * ギャラリー画面を非表示
     */
    hide() {
        this.isActive = false;
        if (this.galleryScreen) {
            this.galleryScreen.classList.remove('active');
        }
        console.log('ギャラリー画面非表示');
    }

    /**
     * ギャラリー表示を更新
     */
    updateGalleryDisplay() {
        const galleryData = this.game.saveSystem.getGalleryData();
        
        console.log('ギャラリーデータ:', galleryData);
        console.log('解放済み画像:', galleryData.unlockedImages);
        
        // 統計情報を更新
        this.updateStats(galleryData);
        
        // グリッドをクリア
        this.galleryGrid.innerHTML = '';
        
        // 全7ステージ立ち絵を表示（シークレット含む）
        console.log('🎨 ギャラリーカード生成開始 - 全7ステージ（シークレット含む）');
        alert('ギャラリー更新: これから7枚のカードを表示します。\n\nこのアラートが表示されたら、OKを押してください。');

        for (let stage = 1; stage <= 7; stage++) {
            console.log(`📍 Stage ${stage} 処理開始`);

            if (stage === 7) {
                // ステージ7はシークレットカードとして特別処理
                console.log('🔮 シークレット枠（Stage 7）を作成');
                const secretCard = document.createElement('div');
                secretCard.className = 'gallery-card secret-card';
                secretCard.style.cssText = `
                    background: linear-gradient(135deg, #2a2a2a 0%, #1a1a1a 100%);
                    border: 3px solid #ffd700;
                    border-radius: 15px;
                    padding: 20px;
                    text-align: center;
                    color: white;
                    cursor: default;
                    transition: all 0.3s ease;
                    position: relative;
                    aspect-ratio: 3/4;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    box-shadow: 0 0 20px rgba(255, 215, 0, 0.4);
                `;
                secretCard.innerHTML = `
                    <div style="font-size: 48px; margin-bottom: 15px; opacity: 0.8;">🔮</div>
                    <div style="font-size: 16px; font-weight: bold; color: #ffd700; text-shadow: 1px 1px 2px rgba(0,0,0,0.5);">シークレット</div>
                    <div style="font-size: 12px; margin-top: 8px; color: rgba(255,255,255,0.7); line-height: 1.3;">ゲームクリアで解放</div>
                    <div style="position: absolute; top: 10px; right: 10px; font-size: 20px; opacity: 0.4;">✨</div>
                `;
                this.galleryGrid.appendChild(secretCard);
                console.log('✅ シークレットカード（Stage 7）追加完了');
            } else {
                // 通常のステージ1-6
                try {
                    const card = this.createImageCard(stage, galleryData);
                    console.log(`🔗 Stage ${stage} カードをグリッドに追加:`, card);
                    this.galleryGrid.appendChild(card);
                    console.log(`✅ Stage ${stage} カード追加完了`);
                } catch (error) {
                    console.error(`❌ Stage ${stage} カード作成エラー:`, error);
                }
            }
        }
        
        console.log(`📊 グリッド最終状態: ${this.galleryGrid.children.length} 個のカード`);
        console.log('🎯 確認: ギャラリーに7枚のカードが表示されているはずです');

        // アラートで最終確認
        alert(`ギャラリー更新完了！\n\n現在のカード数: ${this.galleryGrid.children.length}枚\n\n7枚表示されているはずです。`);

        // 全カードの内容を確認
        const cards = this.galleryGrid.children;
        for (let i = 0; i < cards.length; i++) {
            console.log(`  カード${i + 1}: ${cards[i].className} - ${cards[i].textContent.substring(0, 20)}`);
        }

        // 7枚未満の場合は警告
        if (cards.length < 7) {
            console.error('⚠️ 警告: カードが7枚未満です！追加処理を実行します。');
            const emergencySecret = document.createElement('div');
            emergencySecret.className = 'gallery-card secret-card-emergency';
            emergencySecret.style.cssText = `
                background: linear-gradient(135deg, #ff0000 0%, #ffd700 100%) !important;
                border: 5px solid #ffd700 !important;
                border-radius: 15px !important;
                padding: 20px !important;
                text-align: center !important;
                color: white !important;
                aspect-ratio: 3/4 !important;
                display: flex !important;
                flex-direction: column !important;
                align-items: center !important;
                justify-content: center !important;
            `;
            emergencySecret.innerHTML = `
                <div style="font-size: 60px;">🔮</div>
                <div style="font-size: 18px; font-weight: bold;">緊急シークレット</div>
                <div style="font-size: 14px;">7枚目の枠</div>
            `;
            this.galleryGrid.appendChild(emergencySecret);
            console.log('🚨 緊急シークレットカードを追加しました！');
            console.log(`📊 最新状態: ${this.galleryGrid.children.length} 個のカード`);
        }

        // プリセットシークレットカードを表示
        const presetSecretCard = document.getElementById('preset-secret-card');
        if (presetSecretCard) {
            presetSecretCard.style.display = 'flex';
            console.log('✅ プリセットシークレットカードを表示しました');
        }

        // 強制的にシークレット枠を追加（最終手段）
        if (this.galleryGrid.children.length === 6 || (this.galleryGrid.children.length === 7 && !presetSecretCard)) {
            console.log('🚨 強制シークレット枠追加を実行');
            this.forceAddSecretSlot();
        }

        console.log('📊 グリッドスタイル:', this.galleryGrid.style.cssText);
        console.log('📊 グリッドの表示状況:', {
            display: getComputedStyle(this.galleryGrid).display,
            visibility: getComputedStyle(this.galleryGrid).visibility,
            opacity: getComputedStyle(this.galleryGrid).opacity
        });

        // ページ情報更新（今回は1ページのみ）
        this.updatePageInfo();
    }

    /**
     * シークレット枠を強制追加（最終手段）
     */
    forceAddSecretSlot() {
        console.log('🔮 シークレット枠を強制追加します');

        // 既にシークレットカードがある場合は追加しない
        const existingSecret = this.galleryGrid.querySelector('.secret-card');
        if (existingSecret) {
            console.log('⚠️ シークレットカードは既に存在するため、追加をスキップします');
            return;
        }

        const secretCard = document.createElement('div');
        secretCard.className = 'gallery-card secret-card';
        secretCard.style.cssText = `
            background: linear-gradient(135deg, #2a2a2a 0%, #1a1a1a 100%);
            border: 3px solid #ffd700;
            border-radius: 15px;
            padding: 20px;
            text-align: center;
            color: white;
            cursor: default;
            transition: all 0.3s ease;
            position: relative;
            aspect-ratio: 3/4;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            box-shadow: 0 0 20px rgba(255, 215, 0, 0.4);
            animation: secretGlow 3s ease-in-out infinite;
        `;

        // シークレットカードの内容
        secretCard.innerHTML = `
            <div style="font-size: 48px; margin-bottom: 15px; opacity: 0.8;">🔮</div>
            <div style="font-size: 16px; font-weight: bold; color: #ffd700; text-shadow: 1px 1px 2px rgba(0,0,0,0.5);">シークレット</div>
            <div style="font-size: 12px; margin-top: 8px; color: rgba(255,255,255,0.7); line-height: 1.3;">ゲームクリアで解放</div>
            <div style="position: absolute; top: 10px; right: 10px; font-size: 20px; opacity: 0.4; animation: sparkleAnimation 2s infinite alternate;">✨</div>
        `;

        // アニメーションスタイルを追加
        if (!document.getElementById('secret-card-styles')) {
            const style = document.createElement('style');
            style.id = 'secret-card-styles';
            style.textContent = `
                @keyframes secretGlow {
                    0%, 100% {
                        box-shadow: 0 0 20px rgba(255, 215, 0, 0.4);
                        transform: scale(1);
                    }
                    50% {
                        box-shadow: 0 0 30px rgba(255, 215, 0, 0.6);
                        transform: scale(1.02);
                    }
                }
                @keyframes sparkleAnimation {
                    0% { opacity: 0.4; transform: scale(1) rotate(0deg); }
                    100% { opacity: 0.8; transform: scale(1.2) rotate(180deg); }
                }
            `;
            document.head.appendChild(style);
        }

        // グリッドに追加
        this.galleryGrid.appendChild(secretCard);
        console.log('✅ シークレット枠が強制追加されました');
        console.log(`📊 追加後のカード数: ${this.galleryGrid.children.length}`);
    }

    /**
     * 画像カードを作成
     * @param {number} stage - ステージ番号
     * @param {Object} galleryData - ギャラリーデータ
     * @returns {HTMLElement} カード要素
     */
    createImageCard(stage, galleryData) {
        console.log(`🃏 Stage ${stage} カード作成開始`);

        const card = document.createElement('div');
        card.className = 'gallery-card';

        // ステージ7はシークレット画像として処理
        let imageName, displayName, description;
        if (stage === 7) {
            imageName = 'misaki_secret_victory.png';
            displayName = '美咲（シークレット）';
            description = 'ゲームクリア記念♪';
            card.classList.add('secret-card');
        } else {
            imageName = `misaki_game_stage${stage}.png`;
            displayName = '美咲';
            description = `Stage ${stage}`;
        }

        const imageId = `stage${stage}_${imageName}`;
        const isUnlocked = galleryData.unlockedImages.includes(imageId);
        
        console.log(`📸 Stage ${stage}: imageName=${imageName}, imageId=${imageId}, isUnlocked=${isUnlocked}`);
        console.log(`🔍 解放済み画像一覧:`, galleryData.unlockedImages);

        // シークレットカードの特別スタイル
        if (stage === 7) {
            card.style.cssText = `
                background: ${isUnlocked ? 'linear-gradient(135deg, #ff6b7d 0%, #ffd700 100%)' : 'linear-gradient(135deg, #2a2a2a 0%, #1a1a1a 100%)'};
                border: ${isUnlocked ? '3px solid #ffd700' : '3px solid #444'};
                border-radius: 15px;
                padding: 10px;
                cursor: ${isUnlocked ? 'pointer' : 'default'};
                transition: transform 0.3s, box-shadow 0.3s;
                position: relative;
                aspect-ratio: 3/4;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                color: white;
                box-shadow: ${isUnlocked ? '0 0 20px rgba(255, 215, 0, 0.4)' : '0 4px 8px rgba(0,0,0,0.3)'};
            `;
        } else {
            // 通常カードのスタイル
            card.style.cssText = `
                background: ${isUnlocked ? 'white' : 'rgba(255,255,255,0.1)'};
                border-radius: 10px;
                padding: 10px;
                cursor: ${isUnlocked ? 'pointer' : 'default'};
                transition: transform 0.3s, box-shadow 0.3s;
                position: relative;
                aspect-ratio: 3/4;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
            `;
        }
        
        if (isUnlocked) {
            // 解放済み: 画像を表示
            const img = document.createElement('img');
            img.src = `./assets/images/characters/misaki/${imageName}`;
            img.alt = `Stage ${stage}`;
            img.style.cssText = `
                width: 100%;
                height: 85%;
                object-fit: contain;
                border-radius: 5px;
            `;
            
            // 画像読み込みエラーのデバッグ
            img.onerror = () => {
                console.error(`❌ 画像読み込み失敗: ${img.src}`);
                img.style.display = 'none';
                
                // エラー表示
                const errorDiv = document.createElement('div');
                errorDiv.textContent = '画像エラー';
                errorDiv.style.cssText = `
                    color: red;
                    font-size: 12px;
                    text-align: center;
                `;
                card.appendChild(errorDiv);
            };
            
            img.onload = () => {
                console.log(`✅ 画像読み込み成功: ${img.src}`);
            };
            
            const label = document.createElement('div');
            label.textContent = displayName;
            label.style.cssText = `
                margin-top: 10px;
                font-weight: bold;
                color: ${stage === 7 ? '#ffd700' : '#333'};
                font-size: 14px;
                text-shadow: ${stage === 7 ? '1px 1px 2px rgba(0,0,0,0.5)' : 'none'};
            `;
            
            card.appendChild(img);
            card.appendChild(label);
            
            // ホバー効果
            card.addEventListener('mouseenter', () => {
                card.style.transform = 'scale(1.05)';
                card.style.boxShadow = '0 4px 15px rgba(0,0,0,0.3)';
            });
            
            card.addEventListener('mouseleave', () => {
                card.style.transform = 'scale(1)';
                card.style.boxShadow = 'none';
            });
            
            // クリックでプレビュー
            card.addEventListener('click', () => {
                this.showImagePreview(imageName, stage);
            });
        } else {
            // 未解放: ロック表示
            const lockIcon = document.createElement('div');
            const label = document.createElement('div');
            const hint = document.createElement('div');

            if (stage === 7) {
                // シークレットの未解放表示
                lockIcon.innerHTML = '🔮';
                lockIcon.style.cssText = `
                    font-size: 48px;
                    opacity: 0.6;
                    filter: grayscale(1);
                `;

                label.textContent = 'シークレット';
                label.style.cssText = `
                    margin-top: 10px;
                    color: rgba(255,255,255,0.7);
                    font-size: 14px;
                    font-weight: bold;
                `;

                hint.textContent = 'ゲームクリアで解放';
                hint.style.cssText = `
                    margin-top: 5px;
                    color: rgba(255,255,255,0.5);
                    font-size: 12px;
                `;

                // スパークルエフェクト
                const sparkle = document.createElement('div');
                sparkle.innerHTML = '✨';
                sparkle.style.cssText = `
                    position: absolute;
                    top: 10px;
                    right: 10px;
                    font-size: 20px;
                    opacity: 0.3;
                    animation: sparkleAnimation 2s infinite alternate;
                `;
                card.appendChild(sparkle);

            } else {
                // 通常の未解放表示
                lockIcon.innerHTML = '🔒';
                lockIcon.style.cssText = `
                    font-size: 48px;
                    opacity: 0.5;
                `;

                label.textContent = `Stage ${stage}`;
                label.style.cssText = `
                    margin-top: 10px;
                    color: rgba(255,255,255,0.7);
                    font-size: 14px;
                `;

                hint.textContent = `${stage}勝で解放`;
                hint.style.cssText = `
                    margin-top: 5px;
                    color: rgba(255,255,255,0.5);
                    font-size: 12px;
                `;
            }

            card.appendChild(lockIcon);
            card.appendChild(label);
            card.appendChild(hint);
        }
        
        return card;
    }

    /**
     * シークレット画像カードを作成
     * @param {Object} galleryData - ギャラリーデータ
     * @returns {HTMLElement} シークレットカード要素
     */
    createSecretImageCard(galleryData) {
        console.log('🔮 シークレットカード作成開始');
        console.log('🔍 受信したギャラリーデータ:', galleryData);

        try {
            const card = document.createElement('div');
            card.className = 'gallery-card secret-card';
            console.log('📄 カード要素作成完了:', card);

        const imageName = 'misaki_secret_victory.png';
        const imageId = `stage7_${imageName}`;
        const isUnlocked = galleryData.unlockedImages.includes(imageId);

        console.log(`🔮 シークレット: imageName=${imageName}, imageId=${imageId}, isUnlocked=${isUnlocked}`);

        // カードの基本スタイル（シークレット特別仕様）
        card.style.cssText = `
            background: ${isUnlocked ? 'linear-gradient(135deg, #ff6b7d 0%, #ffd700 100%)' : 'linear-gradient(135deg, #2a2a2a 0%, #1a1a1a 100%)'};
            border: ${isUnlocked ? '3px solid #ffd700' : '3px solid #444'};
            border-radius: 15px;
            padding: 20px;
            text-align: center;
            color: white;
            cursor: ${isUnlocked ? 'pointer' : 'default'};
            transition: all 0.3s ease;
            position: relative;
            min-height: 200px;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            box-shadow: ${isUnlocked ? '0 0 20px rgba(255, 215, 0, 0.4)' : '0 4px 8px rgba(0,0,0,0.3)'};
        `;

        // 解放状態に応じてクラスを追加
        if (isUnlocked) {
            card.classList.add('unlocked');
            // 解放済み: 実際の画像を表示
            const img = document.createElement('img');
            img.src = `./assets/images/characters/misaki/${imageName}`;
            img.style.cssText = `
                width: 100%;
                height: 120px;
                object-fit: cover;
                border-radius: 10px;
                margin-bottom: 10px;
            `;

            // 画像読み込みエラー時のフォールバック
            img.onerror = () => {
                img.style.display = 'none';
                const placeholder = document.createElement('div');
                placeholder.innerHTML = '✨';
                placeholder.style.cssText = `
                    font-size: 48px;
                    margin-bottom: 10px;
                    color: #ffd700;
                `;
                card.insertBefore(placeholder, card.firstChild);
            };

            const label = document.createElement('div');
            label.textContent = '美咲（シークレット）';
            label.style.cssText = `
                font-weight: bold;
                font-size: 14px;
                margin-bottom: 5px;
                color: #ffd700;
                text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
            `;

            const description = document.createElement('div');
            description.textContent = 'ゲームクリア記念♪';
            description.style.cssText = `
                font-size: 12px;
                color: rgba(255,255,255,0.9);
                line-height: 1.3;
                text-shadow: 1px 1px 2px rgba(0,0,0,0.5);
            `;

            card.appendChild(img);
            card.appendChild(label);
            card.appendChild(description);

            // ホバー効果
            card.addEventListener('mouseenter', () => {
                card.style.transform = 'scale(1.05)';
                card.style.boxShadow = '0 0 30px rgba(255, 215, 0, 0.6)';
            });

            card.addEventListener('mouseleave', () => {
                card.style.transform = 'scale(1)';
                card.style.boxShadow = '0 0 20px rgba(255, 215, 0, 0.4)';
            });

            // クリックでプレビュー
            card.addEventListener('click', () => {
                this.showSecretImagePreview(imageName);
            });

        } else {
            // 未解放: 特別なロック表示
            const lockIcon = document.createElement('div');
            lockIcon.innerHTML = '🔮';
            lockIcon.style.cssText = `
                font-size: 48px;
                opacity: 0.6;
                margin-bottom: 10px;
                filter: grayscale(1);
            `;

            const label = document.createElement('div');
            label.textContent = 'シークレット';
            label.style.cssText = `
                margin-bottom: 10px;
                color: rgba(255,255,255,0.7);
                font-size: 14px;
                font-weight: bold;
            `;

            const hint = document.createElement('div');
            hint.textContent = 'ゲームクリアで解放';
            hint.style.cssText = `
                color: rgba(255,255,255,0.5);
                font-size: 12px;
                line-height: 1.3;
            `;

            // 神秘的な効果
            const sparkle = document.createElement('div');
            sparkle.innerHTML = '✨';
            sparkle.style.cssText = `
                position: absolute;
                top: 10px;
                right: 10px;
                font-size: 20px;
                opacity: 0.3;
                animation: sparkleAnimation 2s infinite alternate;
            `;

            card.appendChild(lockIcon);
            card.appendChild(label);
            card.appendChild(hint);
            card.appendChild(sparkle);
        }

            console.log(`✅ シークレットカード作成完了 (解放状態: ${isUnlocked})`);
            console.log('📊 最終カード状態:', {
                className: card.className,
                style: card.style.cssText,
                childElementCount: card.childElementCount
            });
            return card;

        } catch (error) {
            console.error('❌ シークレットカード作成中にエラー:', error);

            // フォールバック: 簡単なカードを作成
            const fallbackCard = document.createElement('div');
            fallbackCard.className = 'gallery-card secret-card';
            fallbackCard.style.cssText = `
                background: linear-gradient(135deg, #2a2a2a 0%, #1a1a1a 100%);
                border: 3px solid #444;
                border-radius: 15px;
                padding: 20px;
                text-align: center;
                color: white;
                min-height: 200px;
                display: flex;
                flex-direction: column;
                justify-content: center;
                align-items: center;
            `;
            fallbackCard.innerHTML = `
                <div style="font-size: 48px; margin-bottom: 10px;">🔮</div>
                <div style="font-size: 14px; font-weight: bold;">シークレット</div>
                <div style="font-size: 12px; margin-top: 5px; color: rgba(255,255,255,0.7);">ゲームクリアで解放</div>
            `;
            console.log('🔧 フォールバックカードを作成しました:', fallbackCard);
            return fallbackCard;
        }
    }

    /**
     * 画像プレビューを表示
     * @param {string} imageName - 画像ファイル名
     * @param {number} stage - ステージ番号
     */
    showImagePreview(imageName, stage) {
        const modal = document.getElementById('gallery-modal');
        const modalImage = document.getElementById('gallery-modal-image');

        if (modal && modalImage) {
            modalImage.src = `./assets/images/characters/misaki/${imageName}`;
            modalImage.alt = `Stage ${stage}`;
            modal.style.display = 'block';
        }
    }

    /**
     * シークレット画像プレビューを表示
     * @param {string} imageName - 画像ファイル名
     */
    showSecretImagePreview(imageName) {
        const modal = document.getElementById('gallery-modal');
        const modalImage = document.getElementById('gallery-modal-image');

        if (modal && modalImage) {
            modalImage.src = `./assets/images/characters/misaki/${imageName}`;
            modalImage.alt = 'シークレット立ち絵';
            modal.style.display = 'block';

            // シークレット画像用の特別エフェクト
            modalImage.style.filter = 'drop-shadow(0 0 20px rgba(255, 215, 0, 0.6))';

            // エフェクトを一定時間後にリセット
            setTimeout(() => {
                modalImage.style.filter = '';
            }, 3000);
        }
    }

    /**
     * 統計情報を更新
     * @param {Object} galleryData - ギャラリーデータ
     */
    updateStats(galleryData) {
        const unlockCount = document.getElementById('gallery-unlock-count');
        const totalWins = document.getElementById('gallery-total-wins');
        
        if (unlockCount) {
            const unlockedCount = galleryData.unlockedImages.length;
            unlockCount.textContent = `解放済み: ${unlockedCount} / 7`;
        }
        
        if (totalWins) {
            totalWins.textContent = `総勝利数: ${galleryData.totalWins || 0}`;
        }
    }

    /**
     * ページ情報を更新
     */
    updatePageInfo() {
        const totalPages = this.getTotalPages();
        
        if (this.pageInfo) {
            this.pageInfo.textContent = `${this.currentPage + 1} / ${totalPages}`;
        }
        
        // ナビゲーションボタンの有効/無効
        if (this.prevBtn) {
            this.prevBtn.disabled = this.currentPage === 0;
            this.prevBtn.style.opacity = this.currentPage === 0 ? '0.5' : '1';
        }
        
        if (this.nextBtn) {
            this.nextBtn.disabled = this.currentPage === totalPages - 1;
            this.nextBtn.style.opacity = this.currentPage === totalPages - 1 ? '0.5' : '1';
        }
    }

    /**
     * 総ページ数を取得
     * @returns {number} 総ページ数
     */
    getTotalPages() {
        return 1; // 現在は6枚なので1ページ固定
    }
}