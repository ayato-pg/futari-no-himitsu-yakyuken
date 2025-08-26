/**
 * ClickAreaSystem.js
 * 隠しクリック領域管理システム
 * 特定の場所をクリックすることで隠し要素やCGを解放
 */

class ClickAreaSystem {
    constructor(gameController) {
        this.game = gameController;
        this.clickAreas = {};
        this.discoveredAreas = new Set();
        
        this.initialize();
    }

    /**
     * システムを初期化
     */
    initialize() {
        // CSVから隠しクリック領域データを読み込み
        this.loadClickAreasFromCSV();
        
        // 発見済み領域を復元
        this.loadDiscoveredAreas();
        
        console.log('ClickAreaSystem初期化完了');
    }

    /**
     * CSVからクリック領域データを読み込み
     */
    loadClickAreasFromCSV() {
        try {
            const csvData = this.game.csvLoader.getCSVData('click_areas');
            
            if (csvData && csvData.length > 0) {
                csvData.forEach(row => {
                    this.clickAreas[row.area_id] = {
                        sceneId: row.scene_id,
                        x: parseInt(row.x),
                        y: parseInt(row.y),
                        width: parseInt(row.width),
                        height: parseInt(row.height),
                        actionType: row.action_type,
                        actionParam: row.action_param,
                        cursorType: row.cursor_type,
                        hoverEffect: row.hover_effect
                    };
                });
            } else {
                // フォールバックデータ
                this.createFallbackClickAreas();
            }
            
        } catch (error) {
            console.warn('Click Areas CSV読み込みエラー:', error);
            this.createFallbackClickAreas();
        }
        
        console.log('隠しクリック領域:', Object.keys(this.clickAreas).length + '個');
    }

    /**
     * フォールバック用の隠しクリック領域を作成
     */
    createFallbackClickAreas() {
        this.clickAreas = {
            'secret_misaki_room': {
                sceneId: 'dialogue',
                x: 750,
                y: 450,
                width: 50,
                height: 50,
                actionType: 'unlock_cg',
                actionParam: 'secret_adult_01',
                cursorType: 'help',
                hoverEffect: 'sparkle'
            },
            'secret_title_logo': {
                sceneId: 'title',
                x: 300,
                y: 100,
                width: 400,
                height: 100,
                actionType: 'special_message',
                actionParam: 'developer_secret',
                cursorType: 'pointer',
                hoverEffect: 'glow_gold'
            },
            'secret_game_corner': {
                sceneId: 'game',
                x: 50,
                y: 50,
                width: 80,
                height: 80,
                actionType: 'unlock_gallery',
                actionParam: 'bonus_content',
                cursorType: 'crosshair',
                hoverEffect: 'rainbow'
            }
        };
    }

    /**
     * 発見済み領域を読み込み
     */
    loadDiscoveredAreas() {
        const saved = localStorage.getItem('yakyuken_discovered_areas');
        if (saved) {
            try {
                const areas = JSON.parse(saved);
                this.discoveredAreas = new Set(areas);
            } catch (error) {
                console.warn('発見済み領域の読み込みエラー:', error);
            }
        }
    }

    /**
     * 発見済み領域を保存
     */
    saveDiscoveredAreas() {
        const areas = Array.from(this.discoveredAreas);
        localStorage.setItem('yakyuken_discovered_areas', JSON.stringify(areas));
    }

    /**
     * 指定シーンのクリック領域を有効化
     * @param {string} sceneId - シーンID
     */
    activateAreasForScene(sceneId) {
        console.log(`隠しクリック領域を有効化: ${sceneId}`);
        
        // そのシーンの全クリック領域を取得
        const sceneAreas = Object.entries(this.clickAreas)
            .filter(([areaId, area]) => area.sceneId === sceneId);
        
        // クリック領域を作成
        sceneAreas.forEach(([areaId, area]) => {
            this.createClickArea(areaId, area);
        });
    }

    /**
     * クリック領域を作成
     * @param {string} areaId - 領域ID
     * @param {Object} area - 領域データ
     */
    createClickArea(areaId, area) {
        // 既存の領域を削除
        this.removeClickArea(areaId);
        
        const element = document.createElement('div');
        element.id = `click-area-${areaId}`;
        element.className = 'hidden-click-area';
        
        // スタイル設定
        element.style.cssText = `
            position: absolute;
            left: ${area.x}px;
            top: ${area.y}px;
            width: ${area.width}px;
            height: ${area.height}px;
            cursor: ${area.cursorType};
            z-index: 999;
            background: transparent;
            border: 2px dashed transparent;
            transition: all 0.3s ease;
        `;
        
        // デバッグモード時は視覚化
        if (this.game.debugMode) {
            element.style.background = 'rgba(255, 255, 0, 0.3)';
            element.style.border = '2px dashed yellow';
        }
        
        // ホバーエフェクト
        element.addEventListener('mouseenter', () => {
            this.showHoverEffect(element, area.hoverEffect);
        });
        
        element.addEventListener('mouseleave', () => {
            this.hideHoverEffect(element);
        });
        
        // クリックイベント
        element.addEventListener('click', (event) => {
            event.preventDefault();
            event.stopPropagation();
            this.executeClickAction(areaId, area);
        });
        
        // ゲームコンテナに追加
        const gameContainer = document.getElementById('game-container');
        if (gameContainer) {
            gameContainer.appendChild(element);
        }
    }

    /**
     * ホバーエフェクトを表示
     * @param {HTMLElement} element - 対象要素
     * @param {string} effectType - エフェクトタイプ
     */
    showHoverEffect(element, effectType) {
        switch (effectType) {
            case 'sparkle':
                element.style.background = 'radial-gradient(circle, rgba(255, 215, 0, 0.3) 0%, transparent 70%)';
                element.style.boxShadow = '0 0 20px rgba(255, 215, 0, 0.6)';
                break;
            case 'glow_gold':
                element.style.background = 'radial-gradient(circle, rgba(255, 215, 0, 0.2) 0%, transparent 70%)';
                element.style.boxShadow = '0 0 30px rgba(255, 215, 0, 0.8)';
                break;
            case 'rainbow':
                element.style.background = 'linear-gradient(45deg, rgba(255,0,150,0.3), rgba(0,255,255,0.3))';
                element.style.boxShadow = '0 0 25px rgba(255, 0, 255, 0.7)';
                break;
            case 'glow_pink':
                element.style.background = 'radial-gradient(circle, rgba(255, 182, 193, 0.3) 0%, transparent 70%)';
                element.style.boxShadow = '0 0 15px rgba(255, 182, 193, 0.8)';
                break;
        }
    }

    /**
     * ホバーエフェクトを非表示
     * @param {HTMLElement} element - 対象要素
     */
    hideHoverEffect(element) {
        element.style.background = 'transparent';
        element.style.boxShadow = 'none';
    }

    /**
     * クリックアクションを実行
     * @param {string} areaId - 領域ID
     * @param {Object} area - 領域データ
     */
    executeClickAction(areaId, area) {
        console.log(`隠し領域クリック: ${areaId}`);
        
        // 効果音再生
        this.game.audioManager.playSE('se_secret_found.mp3', false, 0.8);
        
        // 発見済みに追加
        this.discoveredAreas.add(areaId);
        this.saveDiscoveredAreas();
        
        // アクションタイプに応じた処理
        switch (area.actionType) {
            case 'unlock_cg':
                this.unlockSecretCG(area.actionParam);
                break;
            case 'special_message':
                this.showSpecialMessage(area.actionParam);
                break;
            case 'unlock_gallery':
                this.unlockGalleryContent(area.actionParam);
                break;
            case 'view_costume':
                this.viewCostumeDetail(area.actionParam);
                break;
            default:
                this.showGenericSecretMessage();
                break;
        }
        
        // 領域を削除（一度だけ発見可能）
        this.removeClickArea(areaId);
    }

    /**
     * 秘密CGを解放
     * @param {string} cgId - CG ID
     */
    unlockSecretCG(cgId) {
        console.log(`秘密CG解放: ${cgId}`);
        
        // CGギャラリーに追加
        if (this.game.saveSystem) {
            this.game.saveSystem.unlockCG(cgId);
        }
        
        // 通知表示
        this.showNotification('🎨 隠しCGを発見しました！', 'ギャラリーで確認できます。');
    }

    /**
     * 特別メッセージを表示
     * @param {string} messageId - メッセージID
     */
    showSpecialMessage(messageId) {
        const messages = {
            'developer_secret': {
                title: '開発者からのメッセージ',
                text: 'ゲームを遊んでくれてありがとう！隠し要素を見つけるなんて、さすがですね！'
            }
        };
        
        const message = messages[messageId] || {
            title: '秘密発見！',
            text: '隠し要素を発見しました！'
        };
        
        this.showNotification(message.title, message.text);
    }

    /**
     * ギャラリーコンテンツを解放
     * @param {string} contentId - コンテンツID
     */
    unlockGalleryContent(contentId) {
        console.log(`ギャラリーコンテンツ解放: ${contentId}`);
        
        if (this.game.saveSystem) {
            this.game.saveSystem.unlockGalleryContent(contentId);
        }
        
        this.showNotification('🖼️ ボーナスコンテンツ解放！', 'ギャラリーに新しいアイテムが追加されました。');
    }

    /**
     * 衣装詳細を表示
     * @param {string} costumeLevel - 衣装レベル
     */
    viewCostumeDetail(costumeLevel) {
        if (this.game.costumeSystem) {
            const costumeData = this.game.costumeSystem.getCostumeData(costumeLevel);
            if (costumeData) {
                this.showNotification('👗 衣装詳細', costumeData.description);
            }
        }
    }

    /**
     * 一般的な秘密メッセージを表示
     */
    showGenericSecretMessage() {
        const messages = [
            '隠し要素を発見しました！',
            '秘密の場所を見つけました！',
            'お疲れ様です！探索の成果ですね。',
            '細かいところまで見てくれてありがとう！'
        ];
        
        const randomMessage = messages[Math.floor(Math.random() * messages.length)];
        this.showNotification('🔍 発見！', randomMessage);
    }

    /**
     * 通知を表示
     * @param {string} title - タイトル
     * @param {string} text - テキスト
     */
    showNotification(title, text) {
        const notification = document.createElement('div');
        notification.className = 'secret-notification';
        notification.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: linear-gradient(135deg, #ff6b7d 0%, #c44569 100%);
            color: white;
            padding: 20px 30px;
            border-radius: 15px;
            font-family: 'Noto Sans JP', sans-serif;
            text-align: center;
            z-index: 9999;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
            animation: secretNotificationShow 0.5s ease-out;
            max-width: 400px;
        `;
        
        notification.innerHTML = `
            <h3 style="margin: 0 0 10px 0; font-size: 1.3rem;">${title}</h3>
            <p style="margin: 0; font-size: 1rem; line-height: 1.5;">${text}</p>
        `;
        
        // アニメーション用CSSを追加
        if (!document.querySelector('#secret-notification-style')) {
            const style = document.createElement('style');
            style.id = 'secret-notification-style';
            style.textContent = `
                @keyframes secretNotificationShow {
                    0% { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
                    100% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
                }
            `;
            document.head.appendChild(style);
        }
        
        document.body.appendChild(notification);
        
        // 3秒後に自動削除
        setTimeout(() => {
            if (notification.parentNode) {
                notification.style.animation = 'secretNotificationShow 0.3s ease-in reverse';
                setTimeout(() => {
                    notification.remove();
                }, 300);
            }
        }, 3000);
        
        // クリックで即座に削除
        notification.addEventListener('click', () => {
            notification.remove();
        });
    }

    /**
     * クリック領域を削除
     * @param {string} areaId - 領域ID
     */
    removeClickArea(areaId) {
        const element = document.getElementById(`click-area-${areaId}`);
        if (element) {
            element.remove();
        }
    }

    /**
     * 指定シーンの全クリック領域を削除
     * @param {string} sceneId - シーンID
     */
    deactivateAreasForScene(sceneId) {
        const sceneAreas = Object.entries(this.clickAreas)
            .filter(([areaId, area]) => area.sceneId === sceneId);
        
        sceneAreas.forEach(([areaId]) => {
            this.removeClickArea(areaId);
        });
    }

    /**
     * 全クリック領域を削除
     */
    deactivateAllAreas() {
        Object.keys(this.clickAreas).forEach(areaId => {
            this.removeClickArea(areaId);
        });
    }

    /**
     * 発見済み領域数を取得
     * @returns {number} 発見済み数
     */
    getDiscoveredCount() {
        return this.discoveredAreas.size;
    }

    /**
     * 総領域数を取得
     * @returns {number} 総数
     */
    getTotalAreasCount() {
        return Object.keys(this.clickAreas).length;
    }

    /**
     * デバッグ情報を表示
     */
    debugInfo() {
        console.log('=== ClickAreaSystem Debug ===');
        console.log('登録済み領域数:', Object.keys(this.clickAreas).length);
        console.log('発見済み領域数:', this.discoveredAreas.size);
        console.log('発見済み領域:', Array.from(this.discoveredAreas));
        console.log('=============================');
    }

    /**
     * クリーンアップ
     */
    cleanup() {
        this.deactivateAllAreas();
        console.log('ClickAreaSystem クリーンアップ完了');
    }
}

console.log('ClickAreaSystem.js 読み込み完了');