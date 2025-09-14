/**
 * GalleryScene.js
 * ギャラリー画面を管理するクラス
 * 解放された立ち絵を表示
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
        console.log('GalleryScene初期化完了');
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
                        <div id="gallery-unlock-count" style="font-size: 1.2em;">解放済み: 0 / 6</div>
                        <div id="gallery-total-wins" style="font-size: 0.9em; opacity: 0.8; margin-top: 5px;">総勝利数: 0</div>
                    </div>
                    
                    <div id="gallery-grid" style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-bottom: 30px;">
                        <!-- 立ち絵カードがここに生成される -->
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
            
            const testButton = document.createElement('button');
            testButton.textContent = '🧪 テスト用: Stage 1-3を解放';
            testButton.style.cssText = `
                background: #e74c3c;
                color: white;
                border: none;
                padding: 10px 20px;
                border-radius: 5px;
                cursor: pointer;
                margin: 10px;
                font-size: 14px;
            `;
            
            testButton.addEventListener('click', () => {
                console.log('🧪 テストボタンがクリックされました');
                
                // テスト用にstage 1-3を解放
                for (let stage = 1; stage <= 3; stage++) {
                    const imageName = `misaki_game_stage${stage}.png`;
                    const result = this.game.saveSystem.unlockGalleryImage(imageName, stage);
                    console.log(`Stage ${stage} 解放結果:`, result);
                }
                
                // ギャラリーデータを確認
                const galleryData = this.game.saveSystem.getGalleryData();
                console.log('解放後のギャラリーデータ:', galleryData);
                
                // 表示を更新
                this.updateGalleryDisplay();
                
                // GridのDOM状況を確認
                console.log('Gallery Grid:', this.galleryGrid);
                console.log('Gallery Grid children:', this.galleryGrid.children);
                console.log('Gallery Grid innerHTML:', this.galleryGrid.innerHTML);
                
                alert('Stage 1-3を解放しました！ コンソールを確認してください。');
            });
            
            galleryContent.insertBefore(visibilityTestButton, galleryContent.firstChild);
            galleryContent.insertBefore(testButton, galleryContent.firstChild);
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
        
        // 全6ステージの立ち絵を表示
        for (let stage = 1; stage <= 6; stage++) {
            const card = this.createImageCard(stage, galleryData);
            console.log(`🔗 Stage ${stage} カードをグリッドに追加:`, card);
            this.galleryGrid.appendChild(card);
        }
        
        console.log(`📊 グリッド最終状態: ${this.galleryGrid.children.length} 個のカード`);
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
     * 画像カードを作成
     * @param {number} stage - ステージ番号
     * @param {Object} galleryData - ギャラリーデータ
     * @returns {HTMLElement} カード要素
     */
    createImageCard(stage, galleryData) {
        console.log(`🃏 Stage ${stage} カード作成開始`);
        
        const card = document.createElement('div');
        card.className = 'gallery-card';
        
        const imageName = `misaki_game_stage${stage}.png`;
        const imageId = `stage${stage}_${imageName}`;
        const isUnlocked = galleryData.unlockedImages.includes(imageId);
        
        console.log(`📸 Stage ${stage}: imageName=${imageName}, imageId=${imageId}, isUnlocked=${isUnlocked}`);
        console.log(`🔍 解放済み画像一覧:`, galleryData.unlockedImages);
        
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
            label.textContent = `Stage ${stage}`;
            label.style.cssText = `
                margin-top: 10px;
                font-weight: bold;
                color: #333;
                font-size: 14px;
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
            lockIcon.innerHTML = '🔒';
            lockIcon.style.cssText = `
                font-size: 48px;
                opacity: 0.5;
            `;
            
            const label = document.createElement('div');
            label.textContent = `Stage ${stage}`;
            label.style.cssText = `
                margin-top: 10px;
                color: rgba(255,255,255,0.7);
                font-size: 14px;
            `;
            
            const hint = document.createElement('div');
            hint.textContent = `${stage}勝で解放`;
            hint.style.cssText = `
                margin-top: 5px;
                color: rgba(255,255,255,0.5);
                font-size: 12px;
            `;
            
            card.appendChild(lockIcon);
            card.appendChild(label);
            card.appendChild(hint);
        }
        
        return card;
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
     * 統計情報を更新
     * @param {Object} galleryData - ギャラリーデータ
     */
    updateStats(galleryData) {
        const unlockCount = document.getElementById('gallery-unlock-count');
        const totalWins = document.getElementById('gallery-total-wins');
        
        if (unlockCount) {
            const unlockedCount = galleryData.unlockedImages.length;
            unlockCount.textContent = `解放済み: ${unlockedCount} / 6`;
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