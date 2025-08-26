/**
 * CostumeSystem.js
 * 美咲の衣装変化システムを管理するクラス
 * 5段階の衣装レベルとHPに基づく衣装変化を処理
 */

class CostumeSystem {
    constructor(gameController) {
        this.game = gameController;
        this.currentLevel = 1; // 初期衣装レベル
        this.maxLevel = 5;
        this.costumeData = [];
        
        // 衣装変化エフェクト
        this.isChanging = false;
        this.changeAnimationDuration = 800; // ミリ秒
        
        this.initialize();
    }

    /**
     * 衣装システムを初期化
     */
    initialize() {
        this.loadCostumeData();
        console.log('CostumeSystem初期化完了');
    }

    /**
     * 衣装データをCSVから読み込み
     */
    loadCostumeData() {
        if (this.game.csvLoader) {
            this.costumeData = this.game.csvLoader.getTableData('misaki_costumes');
            this.costumeData.sort((a, b) => parseInt(a.level) - parseInt(b.level));
            
            console.log(`衣装データ読み込み: ${this.costumeData.length} レベル`);
        } else {
            // フォールバック データ
            this.costumeData = [
                { level: 1, costume_image: 'misaki_suit.png', costume_name: 'OLスーツ', hp_required: 5, emotion_modifier: 'confident' },
                { level: 2, costume_image: 'misaki_casual.png', costume_name: 'カジュアル服', hp_required: 4, emotion_modifier: 'relaxed' },
                { level: 3, costume_image: 'misaki_roomwear.png', costume_name: '大人の部屋着', hp_required: 3, emotion_modifier: 'flirty' },
                { level: 4, costume_image: 'misaki_camisole.png', costume_name: 'キャミソール', hp_required: 2, emotion_modifier: 'embarrassed' },
                { level: 5, costume_image: 'misaki_towel.png', costume_name: 'バスタオル', hp_required: 1, emotion_modifier: 'very_embarrassed' }
            ];
        }
    }

    /**
     * HPに基づいて衣装レベルを計算
     * @param {number} hp - 現在のHP
     * @returns {number} 衣装レベル (1-5)
     */
    calculateCostumeLevel(hp) {
        const maxHP = 5;
        
        // HPに基づく衣装レベルの決定
        if (hp >= 5) return 1;      // OLスーツ
        if (hp >= 4) return 2;      // カジュアル服
        if (hp >= 3) return 3;      // 部屋着
        if (hp >= 2) return 4;      // キャミソール
        return 5;                   // バスタオル
    }

    /**
     * 衣装を変更
     * @param {number} newLevel - 新しい衣装レベル
     * @param {HTMLImageElement} imageElement - 変更対象の画像要素
     * @param {string} emotion - 表情 (オプション)
     * @returns {Promise} 変更完了のPromise
     */
    async changeCostume(newLevel, imageElement, emotion = 'normal') {
        if (this.isChanging || newLevel === this.currentLevel) {
            return;
        }
        
        console.log(`衣装変更: レベル${this.currentLevel} → レベル${newLevel}`);
        
        this.isChanging = true;
        const oldLevel = this.currentLevel;
        this.currentLevel = newLevel;
        
        try {
            // 衣装データを取得
            const costumeData = this.getCostumeData(newLevel);
            if (!costumeData) {
                console.error('衣装データが見つかりません:', newLevel);
                this.isChanging = false;
                return;
            }
            
            // 変更アニメーション開始
            await this.playChangeAnimation(imageElement, costumeData, emotion, oldLevel < newLevel);
            
            // 効果音再生
            this.game.audioManager.playSE('se_cloth.mp3', 0.6);
            
            // 美咲の反応
            this.triggerMisakiReaction(newLevel, oldLevel);
            
        } catch (error) {
            console.error('衣装変更エラー:', error);
        } finally {
            this.isChanging = false;
        }
    }

    /**
     * 衣装変更アニメーション
     * @param {HTMLImageElement} imageElement - 画像要素
     * @param {Object} costumeData - 衣装データ
     * @param {string} emotion - 表情
     * @param {boolean} isProgressing - 進行方向か（true: 脱衣方向、false: 着衣方向）
     * @returns {Promise} アニメーション完了のPromise
     */
    playChangeAnimation(imageElement, costumeData, emotion, isProgressing) {
        return new Promise((resolve) => {
            if (!imageElement) {
                resolve();
                return;
            }
            
            // アニメーション段階
            const stages = [
                () => this.fadeOut(imageElement),
                () => this.changeCostumeImage(imageElement, costumeData, emotion),
                () => this.fadeIn(imageElement),
                () => this.addGlowEffect(imageElement, isProgressing)
            ];
            
            let currentStage = 0;
            
            const executeStage = () => {
                if (currentStage < stages.length) {
                    stages[currentStage]();
                    currentStage++;
                    setTimeout(executeStage, this.changeAnimationDuration / stages.length);
                } else {
                    resolve();
                }
            };
            
            executeStage();
        });
    }

    /**
     * フェードアウト効果
     * @param {HTMLImageElement} imageElement - 画像要素
     */
    fadeOut(imageElement) {
        imageElement.style.transition = 'opacity 0.2s ease';
        imageElement.style.opacity = '0';
    }

    /**
     * 衣装画像を変更
     * @param {HTMLImageElement} imageElement - 画像要素
     * @param {Object} costumeData - 衣装データ
     * @param {string} emotion - 表情
     */
    changeCostumeImage(imageElement, costumeData, emotion) {
        // 画像ファイル名を生成（表情付き）
        const baseName = costumeData.costume_image.replace('.png', '');
        const imageName = `${baseName}_${emotion}.png`;
        const imagePath = `./assets/images/characters/misaki/${imageName}`;
        
        // 画像を変更
        imageElement.src = imagePath;
        
        // 画像が存在しない場合のフォールバック
        imageElement.onerror = () => {
            console.warn(`衣装画像が見つかりません: ${imageName}`);
            this.createCostumePlaceholder(imageElement, costumeData);
        };
    }

    /**
     * フェードイン効果
     * @param {HTMLImageElement} imageElement - 画像要素
     */
    fadeIn(imageElement) {
        imageElement.style.transition = 'opacity 0.3s ease';
        imageElement.style.opacity = '1';
    }

    /**
     * グロー効果を追加
     * @param {HTMLImageElement} imageElement - 画像要素
     * @param {boolean} isProgressing - 進行方向か
     */
    addGlowEffect(imageElement, isProgressing) {
        const glowColor = isProgressing ? '#ff6b7d' : '#7ed6c4';
        
        imageElement.style.filter = `drop-shadow(0 0 20px ${glowColor})`;
        
        // 3秒後にグロー効果を削除
        setTimeout(() => {
            imageElement.style.filter = 'drop-shadow(3px 3px 15px rgba(0,0,0,0.6))';
        }, 3000);
    }

    /**
     * 衣装プレースホルダー画像を作成
     * @param {HTMLImageElement} imageElement - 画像要素
     * @param {Object} costumeData - 衣装データ
     */
    createCostumePlaceholder(imageElement, costumeData) {
        const colors = ['%23ffb6c1', '%23ffa0b4', '%23ff8a95', '%23ff7875', '%23ff6b7d'];
        const color = colors[costumeData.level - 1] || '%23ffb6c1';
        
        const placeholder = `data:image/svg+xml;charset=UTF-8,%3Csvg width='400' height='600' xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='100%25' height='100%25' fill='${color}'/%3E%3Ctext x='50%25' y='40%25' font-family='Arial' font-size='20' fill='%23fff' text-anchor='middle'%3E美咲お姉ちゃん%3C/text%3E%3Ctext x='50%25' y='50%25' font-family='Arial' font-size='16' fill='%23fff' text-anchor='middle'%3E${costumeData.costume_name}%3C/text%3E%3Ctext x='50%25' y='60%25' font-family='Arial' font-size='14' fill='%23fff' text-anchor='middle'%3ELevel ${costumeData.level}%3C/text%3E%3C/svg%3E`;
        
        imageElement.src = placeholder;
    }

    /**
     * 美咲の反応をトリガー
     * @param {number} newLevel - 新しいレベル
     * @param {number} oldLevel - 前のレベル
     */
    triggerMisakiReaction(newLevel, oldLevel) {
        // 衣装変更時の美咲の反応データを取得
        const reactionData = this.game.csvLoader.findData('misaki_reactions', 'costume_level', newLevel.toString());
        
        if (reactionData) {
            console.log(`美咲の反応: ${reactionData.dialogue}`);
            
            // 反応を表示（DialogueSceneで処理される）
            this.game.showMisakiReaction(reactionData);
        }
        
        // 進行度に応じた特別な反応
        if (newLevel > oldLevel) {
            this.onCostumeProgression(newLevel);
        }
    }

    /**
     * 衣装進行時の特別処理
     * @param {number} level - 現在のレベル
     */
    onCostumeProgression(level) {
        switch (level) {
            case 3: // 部屋着になった時
                this.game.audioManager.playSE('se_embarrassed.mp3', 0.5);
                break;
            case 4: // キャミソールになった時
                this.game.audioManager.playSE('se_heartbeat.mp3', 0.7);
                break;
            case 5: // バスタオルになった時
                this.game.audioManager.playSE('se_heartbeat.mp3', 0.9);
                // 特別なエフェクトを追加可能
                this.addSpecialEffect();
                break;
        }
    }

    /**
     * 特別エフェクト（最終段階用）
     */
    addSpecialEffect() {
        // 画面にピンクのオーバーレイ効果
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: rgba(255, 107, 125, 0.1);
            pointer-events: none;
            z-index: 50;
            animation: pulse 2s ease-in-out;
        `;
        
        document.body.appendChild(overlay);
        
        setTimeout(() => {
            overlay.remove();
        }, 2000);
    }

    /**
     * 指定レベルの衣装データを取得
     * @param {number} level - 衣装レベル
     * @returns {Object|null} 衣装データ
     */
    getCostumeData(level) {
        return this.costumeData.find(costume => parseInt(costume.level) === level) || null;
    }

    /**
     * 現在の衣装名を取得
     * @returns {string} 衣装名
     */
    getCurrentCostumeName() {
        const costumeData = this.getCostumeData(this.currentLevel);
        return costumeData ? costumeData.costume_name : '不明';
    }

    /**
     * 現在の衣装の感情修飾子を取得
     * @returns {string} 感情修飾子
     */
    getCurrentEmotionModifier() {
        const costumeData = this.getCostumeData(this.currentLevel);
        return costumeData ? costumeData.emotion_modifier : 'normal';
    }

    /**
     * 衣装レベルの説明を取得
     * @param {number} level - 衣装レベル
     * @returns {string} 説明文
     */
    getCostumeDescription(level) {
        const costumeData = this.getCostumeData(level);
        return costumeData ? costumeData.description : '';
    }

    /**
     * 全衣装データを取得
     * @returns {Array} 衣装データ配列
     */
    getAllCostumes() {
        return [...this.costumeData];
    }

    /**
     * HPから適切な衣装に自動変更
     * @param {number} hp - 現在のHP
     * @param {HTMLImageElement} imageElement - 画像要素
     * @param {string} emotion - 表情
     * @returns {Promise} 変更完了のPromise
     */
    async updateCostumeByHP(hp, imageElement, emotion = 'normal') {
        const newLevel = this.calculateCostumeLevel(hp);
        
        if (newLevel !== this.currentLevel) {
            await this.changeCostume(newLevel, imageElement, emotion);
        }
    }

    /**
     * 衣装システムをリセット
     */
    reset() {
        this.currentLevel = 1;
        this.isChanging = false;
        console.log('CostumeSystem リセット完了');
    }

    /**
     * 現在の状態を取得（セーブ用）
     * @returns {Object} 状態オブジェクト
     */
    getState() {
        return {
            currentLevel: this.currentLevel,
            isChanging: this.isChanging
        };
    }

    /**
     * 状態を復元（ロード用）
     * @param {Object} state - 状態オブジェクト
     */
    setState(state) {
        this.currentLevel = state.currentLevel || 1;
        this.isChanging = state.isChanging || false;
        
        console.log(`CostumeSystem 状態復元: レベル${this.currentLevel}`);
    }

    /**
     * デバッグ情報を表示
     */
    debugInfo() {
        console.log('=== Costume System Debug Info ===');
        console.log('現在のレベル:', this.currentLevel);
        console.log('現在の衣装:', this.getCurrentCostumeName());
        console.log('変更中:', this.isChanging);
        console.log('衣装データ数:', this.costumeData.length);
        console.log('=================================');
    }
}

// グローバルに公開
window.CostumeSystem = CostumeSystem;