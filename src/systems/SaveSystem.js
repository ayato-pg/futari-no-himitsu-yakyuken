/**
 * SaveSystem.js
 * ゲームの進行状況を保存・読み込みするシステム
 * LocalStorageを使用してクロスプラットフォーム対応
 */

class SaveSystem {
    constructor() {
        this.savePrefix = 'yakyuken_save_';
        this.autoSaveKey = 'yakyuken_autosave';
        this.settingsKey = 'yakyuken_settings';
        this.galleryKey = 'yakyuken_gallery';
        this.maxSaveSlots = 12;
        
        // デフォルト設定
        this.defaultSettings = {
            bgmVolume: 0.7,
            seVolume: 0.8,
            voiceVolume: 0.9,
            textSpeed: 50,
            autoPlay: false,
            fullscreen: false,
            language: 'ja'
        };
        
        // ギャラリーデータの初期化
        this.galleryData = {
            unlockedImages: [], // バトル開始前は全て未開放
            viewedEndings: [],
            totalWins: 0,
            lastUnlock: null
        };
        
        this.initializeSettings();
        this.initializeGallery();
    }

    /**
     * 設定を初期化
     */
    initializeSettings() {
        const settings = this.loadSettings();
        if (!settings) {
            this.saveSettings(this.defaultSettings);
        }
    }

    /**
     * ギャラリーを初期化
     */
    initializeGallery() {
        const galleryData = this.loadGallery();
        if (!galleryData) {
            this.saveGallery(this.galleryData);
        } else {
            this.galleryData = galleryData;
        }
    }

    /**
     * ゲームデータを保存
     * @param {number} slot - セーブスロット番号 (1-12、0はオートセーブ)
     * @param {Object} gameData - 保存するゲームデータ
     */
    saveGame(slot, gameData) {
        try {
            const saveData = {
                timestamp: new Date().toISOString(),
                version: '1.0.0',
                ...gameData
            };

            const key = slot === 0 ? this.autoSaveKey : `${this.savePrefix}${slot}`;
            localStorage.setItem(key, JSON.stringify(saveData));
            
            console.log(`セーブ完了: スロット${slot}`);
            return true;
            
        } catch (error) {
            console.error(`セーブ失敗 (スロット${slot}):`, error);
            return false;
        }
    }

    /**
     * ゲームデータを読み込み
     * @param {number} slot - セーブスロット番号
     * @returns {Object|null} 読み込まれたゲームデータまたはnull
     */
    loadGame(slot) {
        try {
            const key = slot === 0 ? this.autoSaveKey : `${this.savePrefix}${slot}`;
            const saveDataString = localStorage.getItem(key);
            
            if (!saveDataString) {
                return null;
            }
            
            const saveData = JSON.parse(saveDataString);
            console.log(`ロード完了: スロット${slot}`);
            return saveData;
            
        } catch (error) {
            console.error(`ロード失敗 (スロット${slot}):`, error);
            return null;
        }
    }

    /**
     * セーブデータが存在するかチェック
     * @param {number} slot - セーブスロット番号
     * @returns {boolean} データが存在するかどうか
     */
    hasSaveData(slot) {
        const key = slot === 0 ? this.autoSaveKey : `${this.savePrefix}${slot}`;
        return localStorage.getItem(key) !== null;
    }

    /**
     * セーブデータを削除
     * @param {number} slot - セーブスロット番号
     */
    deleteSave(slot) {
        try {
            const key = slot === 0 ? this.autoSaveKey : `${this.savePrefix}${slot}`;
            localStorage.removeItem(key);
            console.log(`セーブデータ削除: スロット${slot}`);
            return true;
        } catch (error) {
            console.error(`削除失敗 (スロット${slot}):`, error);
            return false;
        }
    }

    /**
     * すべてのセーブスロットの情報を取得
     * @returns {Array} セーブスロット情報の配列
     */
    getAllSaveInfo() {
        const saveInfo = [];
        
        for (let i = 0; i <= this.maxSaveSlots; i++) {
            const data = this.loadGame(i);
            saveInfo.push({
                slot: i,
                exists: data !== null,
                timestamp: data ? data.timestamp : null,
                scene: data ? data.currentScene : null,
                progress: data ? this.calculateProgress(data) : 0
            });
        }
        
        return saveInfo;
    }

    /**
     * 進行度を計算
     * @param {Object} saveData - セーブデータ
     * @returns {number} 進行度 (0-100)
     */
    calculateProgress(saveData) {
        if (!saveData) return 0;
        
        const totalRounds = 9;
        const currentRound = saveData.currentRound || 1;
        const playerWins = saveData.playerWins || 0;
        const misakiWins = saveData.misakiWins || 0;
        
        // ラウンド進行度 + 勝利数による進行度
        const roundProgress = (currentRound / totalRounds) * 60;
        const winProgress = ((playerWins + misakiWins) / 10) * 40;
        
        return Math.min(Math.round(roundProgress + winProgress), 100);
    }

    /**
     * オートセーブを実行
     * @param {Object} gameData - ゲームデータ
     */
    autoSave(gameData) {
        return this.saveGame(0, gameData);
    }

    /**
     * 設定を保存
     * @param {Object} settings - 設定データ
     */
    saveSettings(settings) {
        try {
            localStorage.setItem(this.settingsKey, JSON.stringify(settings));
            console.log('設定保存完了');
            return true;
        } catch (error) {
            console.error('設定保存失敗:', error);
            return false;
        }
    }

    /**
     * 設定を読み込み
     * @returns {Object} 設定データ
     */
    loadSettings() {
        try {
            const settingsString = localStorage.getItem(this.settingsKey);
            if (!settingsString) {
                return this.defaultSettings;
            }
            
            const settings = JSON.parse(settingsString);
            
            // デフォルト設定とマージ（新しい設定項目対応）
            return { ...this.defaultSettings, ...settings };
            
        } catch (error) {
            console.error('設定読み込み失敗:', error);
            return this.defaultSettings;
        }
    }

    /**
     * 特定の設定値を取得
     * @param {string} key - 設定キー
     * @param {*} defaultValue - デフォルト値
     * @returns {*} 設定値
     */
    getSetting(key, defaultValue = null) {
        const settings = this.loadSettings();
        return settings[key] !== undefined ? settings[key] : defaultValue;
    }

    /**
     * 特定の設定値を更新
     * @param {string} key - 設定キー
     * @param {*} value - 設定値
     */
    updateSetting(key, value) {
        const settings = this.loadSettings();
        settings[key] = value;
        return this.saveSettings(settings);
    }

    /**
     * ギャラリーデータを保存
     * @param {Object} galleryData - ギャラリーデータ
     * @returns {boolean} 保存成功フラグ
     */
    saveGallery(galleryData) {
        try {
            localStorage.setItem(this.galleryKey, JSON.stringify(galleryData));
            this.galleryData = galleryData;
            return true;
        } catch (error) {
            console.error('ギャラリーデータ保存失敗:', error);
            return false;
        }
    }

    /**
     * ギャラリーデータを読み込み
     * @returns {Object|null} ギャラリーデータ
     */
    loadGallery() {
        try {
            const galleryString = localStorage.getItem(this.galleryKey);
            if (!galleryString) {
                return null;
            }
            return JSON.parse(galleryString);
        } catch (error) {
            console.error('ギャラリーデータ読み込み失敗:', error);
            return null;
        }
    }

    /**
     * 立ち絵をギャラリーに追加
     * @param {string} imageName - 画像ファイル名
     * @param {number} stage - ステージ番号
     * @returns {boolean} 新規追加かどうか
     */
    unlockGalleryImage(imageName, stage) {
        const galleryData = this.loadGallery() || this.galleryData;
        const imageId = `stage${stage}_${imageName}`;
        
        // 既に解放済みの場合
        if (galleryData.unlockedImages.includes(imageId)) {
            return false;
        }
        
        // 新規解放
        galleryData.unlockedImages.push(imageId);
        galleryData.lastUnlock = {
            imageId: imageId,
            imageName: imageName,
            stage: stage,
            timestamp: new Date().toISOString()
        };
        galleryData.totalWins = (galleryData.totalWins || 0) + 1;
        
        this.saveGallery(galleryData);
        console.log(`🎉 ギャラリー解放: ${imageName} (Stage ${stage})`);
        return true;
    }

    /**
     * ギャラリーの解放状況を取得
     * @returns {Object} ギャラリーデータ
     */
    getGalleryData() {
        return this.loadGallery() || this.galleryData;
    }

    /**
     * 特定の立ち絵が解放済みかチェック
     * @param {string} imageName - 画像ファイル名
     * @param {number} stage - ステージ番号
     * @returns {boolean} 解放済みかどうか
     */
    isImageUnlocked(imageName, stage) {
        const galleryData = this.getGalleryData();
        const imageId = `stage${stage}_${imageName}`;
        return galleryData.unlockedImages.includes(imageId);
    }

    /**
     * ギャラリーデータをリセット
     */
    resetGallery() {
        this.galleryData = {
            unlockedImages: [], // リセット時は全て未開放
            viewedEndings: [],
            totalWins: 0,
            lastUnlock: null
        };
        this.saveGallery(this.galleryData);
        console.log('ギャラリーデータをリセットしました（全て未開放）');
    }

    /**
     * エンディングを記録
     * @param {string} endingType - エンディングタイプ
     */
    recordEnding(endingType) {
        const galleryData = this.getGalleryData();
        if (!galleryData.viewedEndings.includes(endingType)) {
            galleryData.viewedEndings.push(endingType);
            this.saveGallery(galleryData);
            console.log(`🎊 エンディング記録: ${endingType}`);
        }
    }

    /**
     * ゲーム状態をエクスポート（バックアップ用）
     * @returns {string} エクスポートデータ（JSON文字列）
     */
    exportGameData() {
        try {
            const exportData = {
                version: '1.0.0',
                timestamp: new Date().toISOString(),
                saves: {},
                settings: this.loadSettings()
            };
            
            // すべてのセーブデータを収集
            for (let i = 0; i <= this.maxSaveSlots; i++) {
                const saveData = this.loadGame(i);
                if (saveData) {
                    exportData.saves[i] = saveData;
                }
            }
            
            return JSON.stringify(exportData);
            
        } catch (error) {
            console.error('エクスポート失敗:', error);
            return null;
        }
    }

    /**
     * ゲーム状態をインポート（復元用）
     * @param {string} importDataString - インポートデータ（JSON文字列）
     * @returns {boolean} 成功/失敗
     */
    importGameData(importDataString) {
        try {
            const importData = JSON.parse(importDataString);
            
            // バージョンチェック
            if (importData.version !== '1.0.0') {
                console.warn('異なるバージョンのデータです');
            }
            
            // セーブデータの復元
            if (importData.saves) {
                Object.keys(importData.saves).forEach(slot => {
                    this.saveGame(parseInt(slot), importData.saves[slot]);
                });
            }
            
            // 設定の復元
            if (importData.settings) {
                this.saveSettings(importData.settings);
            }
            
            console.log('インポート完了');
            return true;
            
        } catch (error) {
            console.error('インポート失敗:', error);
            return false;
        }
    }

    /**
     * すべてのセーブデータと設定を削除
     */
    clearAllData() {
        try {
            // セーブデータを削除
            for (let i = 0; i <= this.maxSaveSlots; i++) {
                this.deleteSave(i);
            }
            
            // 設定を初期化
            this.saveSettings(this.defaultSettings);
            
            console.log('すべてのデータを削除しました');
            return true;
            
        } catch (error) {
            console.error('データ削除失敗:', error);
            return false;
        }
    }

    /**
     * ストレージ使用量を取得
     * @returns {Object} 使用量情報
     */
    getStorageUsage() {
        let totalSize = 0;
        let itemCount = 0;
        
        for (let key in localStorage) {
            if (key.startsWith(this.savePrefix) || 
                key === this.autoSaveKey || 
                key === this.settingsKey) {
                totalSize += localStorage[key].length;
                itemCount++;
            }
        }
        
        return {
            totalSize: totalSize,
            itemCount: itemCount,
            formattedSize: `${(totalSize / 1024).toFixed(2)} KB`
        };
    }

    /**
     * デバッグ用: 全セーブ情報を表示
     */
    debugInfo() {
        console.log('=== Save System Debug Info ===');
        const saveInfo = this.getAllSaveInfo();
        saveInfo.forEach(info => {
            if (info.exists) {
                console.log(`スロット ${info.slot}: ${info.scene} (${info.progress}%)`);
            }
        });
        
        const usage = this.getStorageUsage();
        console.log(`ストレージ使用量: ${usage.formattedSize} (${usage.itemCount} items)`);
        console.log('==============================');
    }
}

// グローバルに公開
window.SaveSystem = SaveSystem;