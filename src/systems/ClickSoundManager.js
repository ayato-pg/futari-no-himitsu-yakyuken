/**
 * ClickSoundManager.js
 * 全てのボタンクリック時の音響効果を統一管理するシステム
 */

class ClickSoundManager {
    constructor() {
        this.audioManager = null;
        this.csvLoader = null;
        
        // デフォルト設定
        this.settings = {
            sound_file: 'se_click.mp3',
            volume: 0.7,
            cooldown_ms: 100,
            max_per_second: 1,
            debounce_ms: 50,
            enabled: true
        };
        
        // レート制限用
        this.lastPlayTime = 0;
        this.playCount = 0;
        this.playCountResetTime = 0;
        this.pendingTimeout = null;
        
        // デバッグ用トラッキング
        this.debugMode = true;
        this.callCount = 0;
        this.setupCount = 0;
        this.eventListenerCount = 0;
        this.playAttempts = [];
        
        console.log('ClickSoundManager初期化 - 詳細デバッグ対応');
    }
    
    /**
     * AudioManagerとCSVLoaderを設定
     * @param {AudioManager} audioManager 
     * @param {CSVLoader} csvLoader 
     */
    setAudioManager(audioManager, csvLoader = null) {
        this.audioManager = audioManager;
        this.csvLoader = csvLoader;

        // CSVLoaderが設定されている場合、設定を読み込み
        if (csvLoader) {
            this.loadSettingsFromCSV();
        }

        console.log('✅ ClickSoundManager: AudioManager設定完了');
    }
    
    /**
     * CSVから設定を読み込み
     */
    loadSettingsFromCSV() {
        if (!this.csvLoader) return;
        
        try {
            const settingsData = this.csvLoader.getData('click_sound_settings');
            if (settingsData && Array.isArray(settingsData) && settingsData.length > 0) {
                // クリック音設定を取得（1つのみ）
                const clickSettings = settingsData.find(s => s.setting_id === 'click_sound') || settingsData[0];
                
                if (clickSettings) {
                    this.settings.sound_file = clickSettings.sound_file || this.settings.sound_file;
                    this.settings.volume = parseFloat(clickSettings.volume) || this.settings.volume;
                    this.settings.cooldown_ms = parseInt(clickSettings.cooldown_ms) || this.settings.cooldown_ms;
                    this.settings.max_per_second = parseInt(clickSettings.max_per_second) || this.settings.max_per_second;
                    this.settings.debounce_ms = parseInt(clickSettings.debounce_ms) || this.settings.debounce_ms;
                    // enabled設定（大文字小文字両対応）
                    const enabledValue = clickSettings.enabled;
                    this.settings.enabled = enabledValue === 'true' || enabledValue === 'TRUE' || enabledValue === true;
                    
                    console.log('📊 クリック音設定をCSVから読み込み:', this.settings);
                }
            }
        } catch (error) {
            console.warn('❌ クリック音設定CSV読み込みエラー:', error);
        }
    }
    
    /**
     * ボタンクリック音を再生（レート制限付き）
     * @param {string} source - 音を再生する理由（デバッグ用）
     */
    playClickSound(source = 'unknown') {
        this.callCount++;

        // AudioManagerの音声初期化を確認・トリガー
        if (this.audioManager && !this.audioManager.isInitialized) {
            console.log('🎵 ClickSoundManager: AudioManagerの音声初期化をトリガー');
            this.audioManager.enableAudio();
        }

        // 呼び出し履歴を記録（最新10件）
        const callInfo = {
            time: Date.now(),
            source: source,
            callNumber: this.callCount,
            stackTrace: new Error().stack.split('\n').slice(1, 5) // 上位4レベルのスタックトレース
        };
        this.playAttempts.push(callInfo);
        if (this.playAttempts.length > 10) {
            this.playAttempts.shift();
        }

        console.log(`🎵 再生試行 #${this.callCount}: ${source}`);
        console.log('📍 呼び出し元:', callInfo.stackTrace[0]);
        
        if (!this.settings.enabled || !this.audioManager) {
            console.log(`🔇 クリック音無効 (${source}) - enabled: ${this.settings.enabled}, audioManager: ${!!this.audioManager}`);
            return;
        }
        
        const now = Date.now();
        
        // デバウンス処理（短時間での重複を防ぐ）
        if (now - this.lastPlayTime < this.settings.debounce_ms) {
            console.log(`⏱️ デバウンス中: ${now - this.lastPlayTime}ms < ${this.settings.debounce_ms}ms (${source})`);
            return;
        }
        
        // 1秒間の再生回数制限
        if (now - this.playCountResetTime >= 1000) {
            // 1秒経過したのでカウントリセット
            this.playCount = 0;
            this.playCountResetTime = now;
        }
        
        if (this.playCount >= this.settings.max_per_second) {
            console.log(`🚫 1秒間の最大再生回数を超過: ${this.playCount}/${this.settings.max_per_second} (${source})`);
            return;
        }
        
        // クールダウン処理
        if (now - this.lastPlayTime < this.settings.cooldown_ms) {
            console.log(`❄️ クールダウン中: ${now - this.lastPlayTime}ms < ${this.settings.cooldown_ms}ms (${source})`);
            return;
        }
        
        // 音を再生
        this.actualPlaySound(source, now);
    }
    
    /**
     * 実際に音を再生する処理
     * @param {string} source 
     * @param {number} now 
     */
    actualPlaySound(source, now) {
        if (this.debugMode) {
            console.log(`🔊 クリック音再生: ${source} (count: ${this.playCount + 1}/${this.settings.max_per_second})`);
        }
        
        try {
            this.audioManager.playSE(this.settings.sound_file, this.settings.volume).catch(() => {
                // 音声再生エラーは無視（ゲーム進行に影響させない）
                if (this.debugMode) {
                    console.warn('音声ファイルが見つかりません:', this.settings.sound_file);
                }
            });
            
            // 再生時刻と回数を更新
            this.lastPlayTime = now;
            this.playCount++;
            
        } catch (error) {
            console.warn('クリック音再生エラー:', error);
        }
    }
    
    /**
     * 全てのボタンにクリック音を自動追加
     */
    setupGlobalClickSound() {
        this.setupCount++;
        console.log(`🔊 グローバルクリック音システムを開始 (${this.setupCount}回目)`);
        
        // 既存のクリック音イベントをクリア（重複防止）
        this.clearExistingClickSounds();
        
        // すべてのボタン要素に対してクリック音を追加
        this.addClickSoundToElements('button');
        this.addClickSoundToElements('.game-btn');
        this.addClickSoundToElements('.editor-btn');
        this.addClickSoundToElements('[role="button"]');
        
        // 動的に追加されるボタンにも対応（MutationObserver使用）
        this.setupDynamicButtonWatcher();
        
        console.log(`✅ グローバルクリック音システム設定完了 (登録済みリスナー数: ${this.eventListenerCount})`);
    }
    
    /**
     * 既存のクリック音イベントをクリア
     */
    clearExistingClickSounds() {
        const allElements = document.querySelectorAll('button, .game-btn, .editor-btn, [role="button"]');
        let removedCount = 0;
        
        allElements.forEach(element => {
            // 既存のクリック音ハンドラーを除去
            if (element._clickSoundHandler) {
                element.removeEventListener('click', element._clickSoundHandler);
                delete element._clickSoundHandler;
                removedCount++;
                this.eventListenerCount--;
            }
            
            // 誤って他のイベントが設定されている場合の保護
            ['mouseover', 'mouseenter', 'mousedown', 'touchstart'].forEach(eventType => {
                if (element[`_${eventType}Handler`]) {
                    element.removeEventListener(eventType, element[`_${eventType}Handler`]);
                    delete element[`_${eventType}Handler`];
                }
            });
            
            // マーキングをクリア
            element.hasClickSound = false;
            element.clickSoundAdded = false;
        });
        
        console.log(`🧹 既存のクリック音イベントをクリア: ${removedCount}個削除, 対象要素数: ${allElements.length}`);
        this.eventListenerCount = Math.max(0, this.eventListenerCount); // 負の値を防ぐ
    }
    
    /**
     * 指定されたセレクタの要素にクリック音を追加
     * @param {string} selector 
     */
    addClickSoundToElements(selector) {
        const elements = document.querySelectorAll(selector);
        elements.forEach(element => {
            this.addClickSoundToElement(element);
        });
        
        if (elements.length > 0) {
            console.log(`🎵 ${selector}: ${elements.length}個の要素にクリック音を追加`);
        }
    }
    
    /**
     * 動的に追加されるボタンを監視してクリック音を追加
     */
    setupDynamicButtonWatcher() {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        // 追加された要素自体がボタンの場合
                        if (this.isButton(node)) {
                            this.addClickSoundToElement(node);
                        }
                        
                        // 追加された要素内のボタンを検索
                        const buttons = node.querySelectorAll ? node.querySelectorAll('button, .game-btn, .editor-btn, [role="button"]') : [];
                        buttons.forEach(button => {
                            this.addClickSoundToElement(button);
                        });
                    }
                });
            });
        });
        
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
        
        console.log('👀 動的ボタン監視システム開始');
    }
    
    /**
     * 要素がボタンかどうかを判定
     * @param {Element} element 
     * @returns {boolean}
     */
    isButton(element) {
        return element.tagName === 'BUTTON' || 
               element.classList.contains('game-btn') ||
               element.classList.contains('editor-btn') ||
               element.getAttribute('role') === 'button';
    }
    
    /**
     * 単一の要素にクリック音を追加
     * @param {Element} element 
     */
    addClickSoundToElement(element) {
        // 既にクリック音が追加されている場合はスキップ
        if (element.hasClickSound || element.clickSoundAdded) {
            return;
        }
        
        // クリックイベントのみに厳密に反応するハンドラーを作成
        const clickHandler = (event) => {
            // イベントタイプを厳密にチェック
            if (event.type === 'click' && event.isTrusted) {
                const elementInfo = `${element.tagName}${element.id ? '#' + element.id : ''}${element.className ? '.' + element.className.replace(/\s+/g, '.') : ''}`;
                this.playClickSound(`click:${elementInfo}`);
            } else {
                // 意図しないイベントをデバッグ出力
                console.warn('⚠️ 非クリックイベント検出:', {
                    type: event.type,
                    trusted: event.isTrusted,
                    element: element.tagName,
                    className: element.className
                });
            }
        };
        
        // クリックイベントのみを追加（capture: false, passive: false）
        element.addEventListener('click', clickHandler, {
            capture: false,
            passive: false,
            once: false
        });
        
        // カウンターを増やす
        this.eventListenerCount++;
        
        // 重複防止のマーキング（2つの方法で確実に）
        element.hasClickSound = true;
        element.clickSoundAdded = true;
        element._clickSoundHandler = clickHandler; // 参照保持（将来の削除用）
        element._listenerAddedAt = Date.now(); // 追加時刻を記録
        
        // デバッグモードの場合、イベント監視を追加
        if (this.debugMode) {
            this.addEventDebugger(element);
        }
        
        const elementInfo = `${element.tagName}${element.id ? '#' + element.id : ''}${element.className ? '.' + element.className.replace(/\s+/g, '.') : ''}`;
        console.log(`✅ クリック音追加: ${elementInfo} (総リスナー数: ${this.eventListenerCount})`);
    }
    
    /**
     * クリック音の有効/無効を切り替え
     * @param {boolean} enabled 
     */
    setEnabled(enabled) {
        this.settings.enabled = enabled;
        console.log(`🔊 クリック音: ${enabled ? '有効' : '無効'}`);
    }
    
    /**
     * クリック音の音量を設定
     * @param {number} volume 0.0-1.0
     */
    setVolume(volume) {
        this.settings.volume = Math.max(0, Math.min(1, volume));
        console.log(`🔊 クリック音音量: ${this.settings.volume}`);
    }
    
    /**
     * CSV設定を再読み込み
     */
    reloadSettings() {
        if (this.csvLoader) {
            this.loadSettingsFromCSV();
            console.log('🔄 クリック音設定を再読み込みしました');
        }
    }
    
    /**
     * 現在の設定を取得
     * @returns {Object}
     */
    getSettings() {
        return { ...this.settings };
    }
    
    /**
     * デバッグモードの有効/無効を切り替え
     * @param {boolean} enabled 
     */
    setDebugMode(enabled) {
        this.debugMode = enabled;
        console.log(`🐛 デバッグモード: ${enabled ? '有効' : '無効'}`);
    }
    
    /**
     * 要素に全イベントの監視を追加（デバッグ用）
     * @param {Element} element 
     */
    addEventDebugger(element) {
        if (!this.debugMode) return;
        
        const events = ['click', 'mouseover', 'mouseenter', 'mouseleave', 'mousedown', 'mouseup', 'touchstart', 'touchend'];
        events.forEach(eventType => {
            element.addEventListener(eventType, (event) => {
                const elementInfo = `${element.tagName}${element.id ? '#' + element.id : ''}${element.className ? '.' + element.className.replace(/\s+/g, '.') : ''}`;
                console.log(`🐛 イベント検出: ${event.type} on ${elementInfo}`, {
                    trusted: event.isTrusted,
                    target: event.target.tagName,
                    currentTarget: event.currentTarget.tagName
                });
            }, { passive: true });
        });
    }
    
    /**
     * 6回鳴る問題のデバッグ情報を表示
     */
    diagnose6TimesProblem() {
        console.group('🔍 6回音が鳴る問題の診断結果');
        
        console.log(`📊 統計情報:`);
        console.log(`  - setupGlobalClickSound呼び出し回数: ${this.setupCount}`);
        console.log(`  - playClickSound呼び出し回数: ${this.callCount}`);
        console.log(`  - 現在のイベントリスナー数: ${this.eventListenerCount}`);
        
        console.log(`🎯 最近の再生試行 (最新5件):`);
        this.playAttempts.slice(-5).forEach((attempt, index) => {
            console.log(`  ${index + 1}. [${new Date(attempt.time).toLocaleTimeString()}] ${attempt.source}`);
            console.log(`     呼び出し元: ${attempt.stackTrace[0].trim()}`);
        });
        
        console.log(`🔧 要素チェック:`);
        const allButtons = document.querySelectorAll('button, .game-btn, .editor-btn, [role="button"]');
        let duplicateListeners = 0;
        let noListeners = 0;
        
        allButtons.forEach(element => {
            const hasHandler = !!element._clickSoundHandler;
            const hasMarking = element.hasClickSound || element.clickSoundAdded;
            
            if (hasHandler && hasMarking) {
                // 正常
            } else if (hasHandler && !hasMarking) {
                duplicateListeners++;
                const elementInfo = `${element.tagName}${element.id ? '#' + element.id : ''}`;
                console.warn(`  ⚠️ ハンドラーあり、マーキングなし: ${elementInfo}`);
            } else if (!hasHandler && hasMarking) {
                noListeners++;
                const elementInfo = `${element.tagName}${element.id ? '#' + element.id : ''}`;
                console.warn(`  ⚠️ マーキングあり、ハンドラーなし: ${elementInfo}`);
            }
        });
        
        console.log(`  - 総ボタン数: ${allButtons.length}`);
        console.log(`  - 重複リスナー疑い: ${duplicateListeners}`);
        console.log(`  - 孤立マーキング: ${noListeners}`);
        
        console.log(`💡 推定原因:`);
        if (this.setupCount > 1) {
            console.warn(`  - setupGlobalClickSoundが${this.setupCount}回呼ばれています（通常は1回）`);
        }
        if (this.eventListenerCount > allButtons.length) {
            console.warn(`  - イベントリスナー数(${this.eventListenerCount})がボタン数(${allButtons.length})を上回っています`);
        }
        if (duplicateListeners > 0) {
            console.warn(`  - 重複したイベントリスナーが検出されました`);
        }
        
        console.groupEnd();
    }
}

// グローバルインスタンス
window.clickSoundManager = new ClickSoundManager();