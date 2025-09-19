/**
 * AudioManager.js
 * BGM、効果音、ボイスの再生を管理するシステム
 * 音量制御とクロスフェード機能を提供
 */

class AudioManager {
    constructor() {
        this.bgmAudio = null;
        this.seAudioPool = new Map();
        this.voiceAudio = null;

        // デフォルト音量設定
        this.volumes = {
            bgm: 0.4,  // BGM音量を0.7から0.4に下げる
            se: 0.8,
            voice: 0.9,
            master: 1.0
        };

        // オーディオファイルのベースパス
        this.audioBasePath = './assets/audio/';
        this.bgmPath = this.audioBasePath + 'bgm/';
        this.sePath = this.audioBasePath + 'se/';
        this.voicePath = this.audioBasePath + 'voice/';

        // 現在再生中の情報
        this.currentBgm = null;
        this.isInitialized = false;
        this.currentScene = null; // 現在のシーンを追跡
        this.pendingSceneBgm = null; // 初期化待ちのBGM情報

        // プリロード済みオーディオ
        this.preloadedAudio = new Map();

        // クロスフェード用
        this.fadingBgm = null;
        this.fadeInterval = null;

        // BGM設定（CSVから読み込み）
        this.bgmSettings = new Map();

        // ⚡ ユーザーインタラクション待機フラグをデフォルト値で初期化
        // 🔧 環境の安全な検出（process変数エラー回避）
        let isElectron = false;
        try {
            // 明示的フラグをまずチェック
            isElectron = !!(window.ELECTRON_AUTOPLAY_ENABLED || window.AUTOPLAY_FORCE_ENABLED);

            // window.electronAPIやrequireをチェック
            if (!isElectron) {
                isElectron = !!(window.electronAPI || window.require);
            }

            // processオブジェクトを安全にチェック
            if (!isElectron && typeof process !== 'undefined' && process.versions && process.versions.electron) {
                isElectron = true;
            }
        } catch (error) {
            // ブラウザ環境ではprocessが未定義のため、エラーは無視
            isElectron = false;
        }

        const isBrowser = !isElectron;
        this.waitingForUserInteraction = isBrowser; // ブラウザは待機、Electronは待機不要

        console.log('🎵 AudioManager constructor: 安全な環境検出結果:', {
            isElectron,
            isBrowser,
            waitingForUserInteraction: this.waitingForUserInteraction,
            environment: isElectron ? 'Electron' : 'Browser',
            autoplayFlags: {
                electronEnabled: window.ELECTRON_AUTOPLAY_ENABLED,
                browserRestricted: window.BROWSER_AUTOPLAY_RESTRICTED
            }
        });

        this.initialize();
    }

    /**
     * オーディオマネージャーを初期化
     */
    async initialize() {
        try {
            console.log('🎵 AudioManager: 環境統一初期化開始');

            // 🔧 環境の安全な検出（process変数エラー回避）
            let isElectron = false;
            try {
                // 明示的フラグをまずチェック
                isElectron = !!(window.ELECTRON_AUTOPLAY_ENABLED || window.AUTOPLAY_FORCE_ENABLED);

                // window.electronAPIやrequireをチェック
                if (!isElectron) {
                    isElectron = !!(window.electronAPI || window.require);
                }

                // processオブジェクトを安全にチェック
                if (!isElectron && typeof process !== 'undefined' && process.versions && process.versions.electron) {
                    isElectron = true;
                }
            } catch (error) {
                // ブラウザ環境ではprocessが未定義のため、エラーは無視
                isElectron = false;
            }

            const isBrowser = !isElectron;
            this.isInitialized = true;

            if (isElectron) {
                console.log('🎮 Electron環境：最強自動再生モード有効化');
                this.waitingForUserInteraction = false;
                console.log('✅ Electron: 音声システム即座初期化完了 - インタラクション不要');
            } else {
                console.log('🌐 ブラウザ環境：制限付き自動再生モード（AudioManager統一）');
                this.waitingForUserInteraction = true;
                console.log('✅ ブラウザ: 音声システム即座初期化完了 - インタラクション待機');
            }

            // 🎵 ユーザーインタラクション検出システムを設定
            this.setupUserInteractionDetection();

            // AudioContextを準備（まだ作成しない）
            this.AudioContextClass = window.AudioContext || window.webkitAudioContext;

            // BGM設定をCSVから読み込み
            await this.loadBGMSettings();

            console.log('🎵 AudioManager初期化完了 - ユーザーインタラクション待機中');
        } catch (error) {
            console.error('❌ AudioManager初期化エラー:', error);
        }
    }

    /**
     * BGM設定をCSVから読み込み
     */
    async loadBGMSettings() {
        try {
            // CSVLoaderからBGM設定を取得を試行
            let bgmData = null;

            // 複数の方法でBGM設定を取得試行
            if (window.csvLoader) {
                // 方法1: 直接参照
                bgmData = window.csvLoader.bgm_settings;

                // 方法2: データテーブル経由
                if (!bgmData && window.csvLoader.csvData) {
                    bgmData = window.csvLoader.csvData.bgm_settings;
                }

                // 方法3: getDataメソッド経由
                if (!bgmData && typeof window.csvLoader.getData === 'function') {
                    bgmData = window.csvLoader.getData('bgm_settings');
                }
            }

            console.log('🎵 BGM設定取得試行結果:', {
                csvLoader: !!window.csvLoader,
                bgmData: bgmData ? bgmData.length : 'null',
                methods: {
                    direct: !!window.csvLoader?.bgm_settings,
                    csvData: !!window.csvLoader?.csvData?.bgm_settings,
                    getData: typeof window.csvLoader?.getData === 'function'
                }
            });

            if (bgmData && bgmData.length > 0) {
                console.log('🎵 BGM設定をCSVから読み込み開始');

                bgmData.forEach(row => {
                    this.bgmSettings.set(row.scene_id, {
                        bgm_file: row.bgm_file,
                        volume: parseFloat(row.volume) || 0.7,
                        loop: row.loop === 'TRUE',
                        fade_in_time: parseFloat(row.fade_in_time) || 2.0,
                        fade_out_time: parseFloat(row.fade_out_time) || 1.0,
                        description: row.description
                    });
                });

                console.log('🎵 BGM設定読み込み完了:', this.bgmSettings.size, 'シーン');
            } else {
                console.warn('⚠️ CSVLoaderまたはBGM設定が見つかりません。フォールバック設定を使用します。');
                this.loadFallbackBGMSettings();
            }
        } catch (error) {
            console.error('❌ BGM設定読み込みエラー:', error);
            this.loadFallbackBGMSettings();
        }
    }

    /**
     * フォールバック用のBGM設定をロード
     */
    loadFallbackBGMSettings() {
        const fallbackSettings = {
            'title': { bgm_file: 'bgm_title.mp3', volume: 0.4, loop: true, fade_in_time: 3.0, fade_out_time: 2.5 },
            'dialogue': { bgm_file: 'bgm_dialogue.mp3', volume: 0.3, loop: true, fade_in_time: 3.5, fade_out_time: 3.0 },
            'game': { bgm_file: 'bgm_battle_tension.mp3', volume: 0.45, loop: true, fade_in_time: 3.0, fade_out_time: 2.5 },
            'ending_true': { bgm_file: 'bgm_ending_true.mp3', volume: 0.4, loop: true, fade_in_time: 4.0, fade_out_time: 3.0 },
            'ending_bad': { bgm_file: 'bgm_ending_bad.mp3', volume: 0.3, loop: false, fade_in_time: 3.0, fade_out_time: 1.0 },
            'loading': { bgm_file: 'bgm_title.mp3', volume: 0.25, loop: true, fade_in_time: 2.0, fade_out_time: 1.5 }
        };

        for (const [sceneId, settings] of Object.entries(fallbackSettings)) {
            this.bgmSettings.set(sceneId, settings);
        }
        console.log('🎵 フォールバックBGM設定をロード完了（実際のファイル名に更新済み）');
    }

    /**
     * ユーザー操作後の音声再生許可処理
     */
    enableAudio() {
        if (!this.isInitialized) {
            // ダミー音声を再生して音声コンテキストを有効化
            const dummyAudio = new Audio();
            dummyAudio.volume = 0;
            dummyAudio.play().catch(() => {});

            this.isInitialized = true;
            console.log('🎵 音声再生が有効になりました');

            // 保留されているBGMがある場合は即座に再生開始
            if (this.pendingSceneBgm) {
                console.log('🎵 保留BGMを再生開始:', this.pendingSceneBgm);

                // 小さな遅延を入れて、DOM要素が確実に準備されるまで待つ
                setTimeout(async () => {
                    await this.playSceneBGM(this.pendingSceneBgm.sceneId, this.pendingSceneBgm.fadeTime);
                    this.pendingSceneBgm = null;
                    console.log('🎵 保留BGM再生完了');
                }, 100);
            }
        }
    }

    /**
     * 音量設定を更新
     * @param {string} type - 音量タイプ (bgm, se, voice, master)
     * @param {number} volume - 音量 (0.0-1.0)
     */
    setVolume(type, volume) {
        this.volumes[type] = Math.max(0, Math.min(1, volume));
        
        // 現在再生中の音声に即座に反映
        if (type === 'bgm' || type === 'master') {
            if (this.bgmAudio) {
                this.bgmAudio.volume = this.volumes.bgm * this.volumes.master;
            }
        }
        
        if (type === 'voice' || type === 'master') {
            if (this.voiceAudio) {
                this.voiceAudio.volume = this.volumes.voice * this.volumes.master;
            }
        }
    }

    /**
     * BGMを再生
     * @param {string} filename - BGMファイル名
     * @param {boolean} loop - ループ再生するか
     * @param {number} fadeTime - フェードイン時間（秒）
     */
    async playBGM(filename, loop = true, fadeTime = 1.0) {
        console.log(`🎵 BGM再生試行: ${filename} (初期化状態: ${this.isInitialized})`);

        try {
            // 停止中は新しいBGM再生をブロック
            if (this.isStopping) {
                console.log('⏳ BGM停止処理中のため再生をスキップ');
                return;
            }

            // 🚫 最強重複防止：まずグローバルスキャンで全BGM停止
            console.log('🚫 BGM最強重複防止：全音源スキャン＆強制停止');

            // 1. 全ての既存audio要素を強制停止
            const allAudio = document.querySelectorAll('audio');
            let stoppedCount = 0;
            allAudio.forEach((audio, index) => {
                if (!audio.paused) {
                    console.log(`🛑 音源[${index}]強制停止: ${audio.src}`);
                    audio.pause();
                    audio.currentTime = 0;
                    audio.volume = 0;
                    stoppedCount++;
                }
            });
            console.log(`📊 強制停止した音源数: ${stoppedCount}`);

            // 2. AudioManagerの状態もリセット
            if (this.bgmAudio) {
                this.bgmAudio.pause();
                this.bgmAudio.currentTime = 0;
                this.bgmAudio = null;
            }
            this.currentBgm = null;

            // 3. 少し待機して確実に停止を保証
            await new Promise(resolve => setTimeout(resolve, 100));

            // 4. 同じファイル名が既に再生要求されているかチェック
            if (this.currentBgm === filename) {
                console.log(`🚫 BGM重複検出: ${filename} は既に処理中です`);
                return;
            }

            // HTML側BGMも確実に停止
            const immediateBgm = document.getElementById('immediate-bgm');
            if (immediateBgm && !immediateBgm.paused) {
                console.log('🛑 HTML側BGMを停止してからAudioManager BGMを開始');
                immediateBgm.pause();
                immediateBgm.currentTime = 0;
            }

            // 新しいBGMをプリロードまたは作成
            let newBgm = this.preloadedAudio.get(filename);
            if (!newBgm) {
                newBgm = new Audio(this.bgmPath + filename);
                newBgm.preload = 'auto';
                
                // エラーハンドリング：ファイルが見つからない場合のフォールバック
                newBgm.addEventListener('error', () => {
                    console.warn(`BGMファイルが見つかりません: ${filename}, デフォルトBGMを試行`);
                    this.playFallbackBGM();
                });
            }

            newBgm.loop = loop;
            newBgm.volume = 0; // フェードインのため最初は無音

            // 前のBGMをフェードアウト
            if (this.bgmAudio) {
                this.fadeOutBGM(fadeTime);
            }

            // 停止処理完了を待ってから新しいBGMを再生開始（重複防止）
            await new Promise(resolve => setTimeout(resolve, 100)); // 100ms待機

            try {
                console.log(`🎵 ${filename} の再生を開始します`);
                await newBgm.play();
                this.bgmAudio = newBgm;
                this.currentBgm = filename;
                console.log(`✅ BGM再生成功: ${filename}`);
            } catch (playError) {
                console.warn(`⚠️ BGM再生エラー: ${filename}`, playError.message);

                // エラー時は再度試行
                setTimeout(async () => {
                    try {
                        await newBgm.play();
                        this.bgmAudio = newBgm;
                        this.currentBgm = filename;
                        console.log(`✅ BGM再生成功（リトライ）: ${filename}`);
                    } catch (retryError) {
                        console.error(`❌ BGM再生失敗: ${filename}`, retryError);
                    }
                }, 500);

                // エラーを上位に伝播させない
                return;
            }

            // フェードイン
            this.fadeIn(this.bgmAudio, this.volumes.bgm * this.volumes.master, fadeTime);

            console.log(`🎵 BGM再生開始: ${filename}`);
            
        } catch (error) {
            console.error(`BGM再生エラー (${filename}):`, error);
            // フォールバック：サイレント実行
            this.currentBgm = filename; // 状態は更新しておく
        }
    }

    /**
     * シーン専用BGMを再生（CSV設定ベース）
     * @param {string} sceneId - シーンID
     * @param {number} customFadeTime - カスタムフェード時間（秒）、指定しない場合はCSV設定を使用
     * @param {boolean} useSmootherTransition - より滑らかなクロスフェードを使用するか（デフォルト: true）
     */
    async playSceneBGM(sceneId, customFadeTime = null, useSmootherTransition = true) {
        // 現在のシーンを記録
        this.currentScene = sceneId;

        console.log(`🎵 シーンBGM再生要求: ${sceneId} (インタラクション待機: ${this.waitingForUserInteraction})`);

        // ユーザーインタラクション待機中は再生を保留
        if (this.waitingForUserInteraction) {
            console.log('⏳ ユーザーインタラクション待機中 - BGM再生を保留');
            this.pendingSceneBgm = { scene: sceneId, fadeTime: customFadeTime };
            return;
        }

        // BGM設定がまだ読み込まれていない場合は少し待つ
        if (!this.bgmSettings || this.bgmSettings.size === 0) {
            console.log('⚠️ BGM設定未読み込み、100ms後に再試行');
            setTimeout(() => this.playSceneBGM(sceneId, customFadeTime, useSmootherTransition), 100);
            return;
        }

        const bgmConfig = this.bgmSettings.get(sceneId);
        
        if (bgmConfig) {
            const fadeTime = customFadeTime || bgmConfig.fade_in_time;
            const volume = bgmConfig.volume;
            const loop = bgmConfig.loop;
            
            console.log(`🎵 シーン「${sceneId}」のBGMを再生: ${bgmConfig.bgm_file} (volume: ${volume}, loop: ${loop}, fade: ${fadeTime}s)`);
            console.log(`📝 説明: ${bgmConfig.description}`);
            
            // 同じBGMが既に再生中の場合はスキップ（より厳密なチェック）
            if (this.currentBgm === bgmConfig.bgm_file && this.bgmAudio && !this.bgmAudio.paused && !this.bgmAudio.ended) {
                console.log(`🎵 同じBGM（${bgmConfig.bgm_file}）が既に再生中のため、再生をスキップ`);
                console.log(`📊 BGM状態: paused=${this.bgmAudio.paused}, ended=${this.bgmAudio.ended}, currentTime=${this.bgmAudio.currentTime}`);
                return;
            }
            
            // BGMが既に再生中で、異なるBGMに切り替える場合は、より滑らかなクロスフェードを使用
            if (useSmootherTransition && this.bgmAudio && !this.bgmAudio.paused && this.currentBgm !== bgmConfig.bgm_file) {
                console.log(`🎵 クロスフェード切り替えモード使用: ${this.currentBgm} → ${bgmConfig.bgm_file}`);
                await this.crossfadeToScene(sceneId, customFadeTime);
                return;
            }
            
            // 音量を一時的に設定値に更新
            const originalBgmVolume = this.volumes.bgm;
            this.volumes.bgm = volume;
            
            await this.playBGM(bgmConfig.bgm_file, loop, fadeTime);
            
            // 音量設定を元に戻す（次回のために）
            this.volumes.bgm = originalBgmVolume;
        } else {
            console.warn(`⚠️ シーン '${sceneId}' に対応するBGM設定が見つかりません`);
            console.log('利用可能なシーン:', Array.from(this.bgmSettings.keys()));
        }
    }

    /**
     * フォールバックBGMを再生
     */
    async playFallbackBGM() {
        const fallbackBgms = [
            'bgm_title.mp3',
            'bgm_dialogue.mp3', 
            'bgm_battle_tension.mp3'
        ];

        console.log('🔄 フォールバックBGMを試行中...');
        for (const bgm of fallbackBgms) {
            try {
                console.log(`📝 フォールバック試行: ${bgm}`);
                const audio = new Audio(this.bgmPath + bgm);
                await new Promise((resolve, reject) => {
                    audio.addEventListener('canplaythrough', resolve, { once: true });
                    audio.addEventListener('error', reject, { once: true });
                    audio.load();
                });
                console.log(`✅ フォールバックBGM見つかりました: ${bgm}`);
                await this.playBGM(bgm, true, 1.0);
                break;
            } catch (error) {
                console.log(`❌ フォールバック失敗: ${bgm} - ${error.message}`);
                continue; // 次のフォールバックを試行
            }
        }
    }

    /**
     * BGMを停止（HTML側BGMも含めて完全停止）
     * @param {number} fadeTime - フェードアウト時間（秒）
     * @returns {Promise} 停止完了Promise
     */
    async stopBGM(fadeTime = 1.0) {
        console.log('🛑 BGM完全停止開始（重複防止強化）');

        // 停止中フラグを設定（新しいBGM再生を一時的にブロック）
        this.isStopping = true;

        const stopPromises = [];

        // AudioManagerのBGMを停止
        if (this.bgmAudio) {
            if (fadeTime > 0) {
                const fadePromise = new Promise(resolve => {
                    this.fadeOut(this.bgmAudio, fadeTime, () => {
                        if (this.bgmAudio) {
                            this.bgmAudio.pause();
                            this.bgmAudio.currentTime = 0;
                            this.bgmAudio = null;
                        }
                        this.currentBgm = null;
                        console.log('🛑 AudioManagerのBGMを停止しました');
                        resolve();
                    });
                });
                stopPromises.push(fadePromise);
            } else {
                this.bgmAudio.pause();
                this.bgmAudio.currentTime = 0;
                this.bgmAudio = null;
                this.currentBgm = null;
            }
        }

        // HTML側のimmediate-bgmも強制停止
        const immediateBgm = document.getElementById('immediate-bgm');
        if (immediateBgm && !immediateBgm.paused) {
            console.log('🛑 HTML側のimmediate-bgmを強制停止');
            immediateBgm.pause();
            immediateBgm.currentTime = 0;
        }

        // 全てのaudio要素を検索して停止（重複BGM対策）
        const allAudioElements = document.querySelectorAll('audio');
        allAudioElements.forEach((audio, index) => {
            if (!audio.paused && audio.src && audio.src.includes('bgm_')) {
                console.log(`🛑 検出されたBGM要素[${index}]を停止: ${audio.src}`);
                audio.pause();
                audio.currentTime = 0;
                audio.volume = 0;
            }
        });

        // 全ての停止処理の完了を待機
        if (stopPromises.length > 0) {
            await Promise.all(stopPromises);
        }

        // 少し待機して確実に停止
        await new Promise(resolve => setTimeout(resolve, 150));

        this.isStopping = false;
        console.log('✅ BGM完全停止完了（非同期）');
    }

    /**
     * 効果音を再生
     * @param {string} filename - SEファイル名
     * @param {number} volume - 音量倍率 (0.0-1.0)
     */
    async playSE(filename, volume = 1.0) {
        if (!this.isInitialized) {
            console.log('🔇 AudioManager未初期化のため効果音スキップ');
            return;
        }

        try {
            console.log(`🎵 AudioManager.playSE開始: ${filename} (volume: ${volume})`);
            console.time(`AudioManager.playSE-${filename}`);
            
            // 毎回新しいAudioインスタンスを作成（プール化を一時的に無効化）
            const seAudio = new Audio(this.sePath + filename);
            console.log(`🎵 新しいAudioインスタンス作成: ${this.sePath + filename}`);
            
            // 音量設定
            const finalVolume = this.volumes.se * this.volumes.master * volume;
            seAudio.volume = finalVolume;
            console.log(`🔊 音量設定: ${finalVolume} (se:${this.volumes.se} × master:${this.volumes.master} × volume:${volume})`);
            
            // オーディオ生成状況をログ
            console.log(`🎵 Audio準備完了 - duration: ${seAudio.duration}, readyState: ${seAudio.readyState}`);
            
            // クローン再生の防止
            seAudio.addEventListener('ended', () => {
                console.log(`🎵 Audio再生終了: ${filename}`);
                seAudio.remove();
            }, { once: true });

            await seAudio.play();
            console.log(`✅ SE再生開始成功: ${filename}`);
            console.timeEnd(`AudioManager.playSE-${filename}`);
            
        } catch (error) {
            console.warn(`⚠️ SE再生エラー: ${filename} -`, error);
            console.timeEnd(`AudioManager.playSE-${filename}`);
        }
    }

    /**
     * ボイスを再生
     * @param {string} filename - ボイスファイル名
     */
    async playVoice(filename) {
        if (!this.isInitialized) {
            return;
        }

        try {
            // 前のボイスを停止
            if (this.voiceAudio) {
                this.voiceAudio.pause();
            }

            this.voiceAudio = new Audio(this.voicePath + filename);
            this.voiceAudio.volume = this.volumes.voice * this.volumes.master;

            await this.voiceAudio.play();
            console.log(`ボイス再生: ${filename}`);
            
        } catch (error) {
            console.error(`ボイス再生エラー (${filename}):`, error);
        }
    }

    /**
     * ボイスを停止
     */
    stopVoice() {
        if (this.voiceAudio) {
            this.voiceAudio.pause();
            this.voiceAudio = null;
        }
    }

    /**
     * フェードイン効果
     * @param {HTMLAudioElement} audio - オーディオ要素
     * @param {number} targetVolume - 目標音量
     * @param {number} duration - フェード時間（秒）
     */
    fadeIn(audio, targetVolume, duration) {
        if (!audio) return;

        // 引数の検証（最小フェード時間を1秒に設定）
        const safeDuration = Math.max(parseFloat(duration) || 2.0, 1.0);
        const safeTargetVolume = Math.max(Math.min(parseFloat(targetVolume) || 0.5, 1.0), 0);

        console.log(`🔊 フェードイン開始: 0 → ${safeTargetVolume.toFixed(3)} (${safeDuration}秒)`);

        const startTime = Date.now();
        const startVolume = 0;
        audio.volume = startVolume;

        let logCount = 0;
        const maxLogs = 10; // フェード中のログ制限

        const fadeStep = () => {
            const elapsed = (Date.now() - startTime) / 1000;
            const progress = Math.min(elapsed / safeDuration, 1.0);

            // より線形に近いフェード（イージング削除）
            const currentVolume = startVolume + (safeTargetVolume - startVolume) * progress;

            // 音量を設定（安全な範囲内で）
            const clampedVolume = Math.max(Math.min(currentVolume, 1.0), 0);

            // 実際の音量設定
            const previousVolume = audio.volume;
            audio.volume = clampedVolume;

            // 進行状況を詳細ログ（制限付き）
            if (logCount < maxLogs && (logCount % 2 === 0 || progress >= 1.0)) {
                console.log(`📊 フェードイン進行: ${(progress * 100).toFixed(1)}% | 音量: ${previousVolume.toFixed(3)} → ${clampedVolume.toFixed(3)}`);
                logCount++;
            }

            if (progress < 1.0) {
                requestAnimationFrame(fadeStep);
            } else {
                audio.volume = safeTargetVolume;
                console.log(`✅ フェードイン完了: 最終音量 ${safeTargetVolume.toFixed(3)}`);
            }
        };

        requestAnimationFrame(fadeStep);
    }

    /**
     * フェードアウト効果
     * @param {HTMLAudioElement} audio - オーディオ要素
     * @param {number} duration - フェード時間（秒）
     * @param {Function} callback - 完了後のコールバック
     */
    fadeOut(audio, duration, callback = null) {
        if (!audio) {
            if (callback) callback();
            return;
        }

        // 引数の検証・修正（最小フェード時間を1秒に設定）
        const startVolume = Math.max(parseFloat(audio.volume) || 0, 0);
        const safeDuration = Math.max(parseFloat(duration) || 2.0, 1.0);

        // 開始音量が0以下の場合は即座に終了
        if (startVolume <= 0) {
            audio.pause();
            if (callback) callback();
            return;
        }

        console.log(`🔊 フェードアウト開始: ${startVolume.toFixed(3)} → 0 (${safeDuration}秒)`);

        const startTime = Date.now();
        let logCount = 0;
        const maxLogs = 10; // フェード中のログ制限

        const fadeStep = () => {
            const elapsed = (Date.now() - startTime) / 1000;
            const progress = Math.min(elapsed / safeDuration, 1.0);

            // より線形に近いフェード（イージング削除）
            const currentVolume = startVolume * (1.0 - progress);

            // 音量を設定（安全な範囲内で）
            const clampedVolume = Math.max(Math.min(currentVolume, 1.0), 0);

            // 実際の音量設定
            const previousVolume = audio.volume;
            audio.volume = clampedVolume;

            // 進行状況を詳細ログ（制限付き）
            if (logCount < maxLogs && (logCount % 2 === 0 || progress >= 1.0)) {
                console.log(`📊 フェードアウト進行: ${(progress * 100).toFixed(1)}% | 音量: ${previousVolume.toFixed(3)} → ${clampedVolume.toFixed(3)}`);
                logCount++;
            }

            if (progress < 1.0 && audio.volume > 0.001) {
                requestAnimationFrame(fadeStep);
            } else {
                audio.volume = 0;
                audio.pause();
                console.log(`✅ フェードアウト完了: 最終音量 0.000`);
                if (callback) callback();
            }
        };

        requestAnimationFrame(fadeStep);
    }

    /**
     * BGMをフェードアウト（内部用）
     * @param {number} fadeTime - フェード時間
     */
    fadeOutBGM(fadeTime) {
        if (this.bgmAudio) {
            this.fadeOut(this.bgmAudio, fadeTime, () => {
                // フェードアウト完了後は何もしない（新しいBGMに切り替わるため）
            });
        }
    }

    /**
     * オーディオファイルをプリロード
     * @param {Array} filenames - プリロードするファイル名の配列
     * @param {string} type - オーディオタイプ (bgm, se, voice)
     */
    async preloadAudio(filenames, type = 'se') {
        const basePath = {
            'bgm': this.bgmPath,
            'se': this.sePath,
            'voice': this.voicePath
        }[type];

        const loadPromises = filenames.map(filename => {
            return new Promise((resolve) => {
                const audio = new Audio(basePath + filename);
                audio.preload = 'auto';
                
                audio.addEventListener('canplaythrough', () => {
                    this.preloadedAudio.set(filename, audio);
                    console.log(`プリロード完了: ${filename}`);
                    resolve();
                });
                
                audio.addEventListener('error', () => {
                    console.warn(`プリロード失敗: ${filename}`);
                    resolve(); // エラーでも続行
                });
            });
        });

        await Promise.all(loadPromises);
        console.log(`${type}ファイルのプリロード完了`);
    }

    /**
     * すべての音声を停止
     */
    stopAll() {
        this.stopBGM(0.5);
        this.stopVoice();
        
        // 効果音プールをクリア
        this.seAudioPool.forEach(audio => {
            audio.pause();
        });
    }

    /**
     * 音量設定を取得
     * @param {string} type - 音量タイプ
     * @returns {number} 音量値
     */
    getVolume(type) {
        return this.volumes[type] || 0;
    }

    /**
     * 現在再生中のBGM名を取得
     * @returns {string|null} BGMファイル名またはnull
     */
    getCurrentBGM() {
        return this.currentBgm;
    }


    /**
     * クロスフェードでBGMを切り替え
     * @param {string} newBgm - 新しいBGMファイル名
     * @param {number} fadeTime - フェード時間（秒）
     */
    async crossfadeBGM(newBgm, fadeTime = 2.0) {
        if (this.currentBgm === newBgm) return;
        
        // 現在のBGMをフェードアウト開始
        if (this.bgmAudio) {
            this.fadeOutBGM(fadeTime);
            this.fadingBgm = this.bgmAudio;
        }
        
        // 少し遅らせて新しいBGMをフェードイン開始
        setTimeout(async () => {
            await this.playBGM(newBgm, true, fadeTime * 0.8);
        }, fadeTime * 200); // 20%地点でクロススタート
    }

    /**
     * シーンベースでのクロスフェードBGM切り替え
     * @param {string} newSceneId - 新しいシーンID
     * @param {number} customFadeTime - カスタムフェード時間（秒）、指定しない場合はCSV設定を使用
     */
    async crossfadeToScene(newSceneId, customFadeTime = null) {
        const bgmConfig = this.bgmSettings.get(newSceneId);
        
        if (!bgmConfig) {
            console.warn(`⚠️ シーン '${newSceneId}' のBGM設定が見つかりません（クロスフェード）`);
            return;
        }

        // 同じBGMが再生中の場合はスキップ
        if (this.currentBgm === bgmConfig.bgm_file) {
            console.log(`🎵 同じBGM（${bgmConfig.bgm_file}）が既に再生中のため、クロスフェードをスキップ`);
            return;
        }
        
        const fadeOutTime = customFadeTime || bgmConfig.fade_out_time;
        const fadeInTime = customFadeTime || bgmConfig.fade_in_time;
        
        console.log(`🎵 シーンクロスフェード開始: ${newSceneId} → ${bgmConfig.bgm_file}`);
        console.log(`📝 フェード設定: OUT=${fadeOutTime}s, IN=${fadeInTime}s`);
        
        // 現在のBGMをフェードアウト開始
        if (this.bgmAudio && !this.bgmAudio.paused) {
            this.fadeOut(this.bgmAudio, fadeOutTime, () => {
                console.log(`🔇 前のBGM（${this.currentBgm}）フェードアウト完了`);
            });
        }
        
        // 新しいBGMを準備して少し遅れてフェードイン開始
        setTimeout(async () => {
            try {
                // 音量を一時的に設定値に更新
                const originalBgmVolume = this.volumes.bgm;
                this.volumes.bgm = bgmConfig.volume;
                
                await this.playBGM(bgmConfig.bgm_file, bgmConfig.loop, fadeInTime);
                
                // 音量設定を元に戻す
                this.volumes.bgm = originalBgmVolume;
                
                console.log(`🎵 新しいBGM（${bgmConfig.bgm_file}）フェードイン完了`);
            } catch (error) {
                console.error(`❌ クロスフェード中のBGM再生エラー:`, error);
            }
        }, Math.min(fadeOutTime * 300, 1000)); // フェードアウトの30%地点でスタート（最大1秒遅延）
    }

    /**
     * 音声が再生可能かチェック
     * @returns {boolean} 再生可能かどうか
     */
    isAudioEnabled() {
        return this.isInitialized;
    }

    /**
     * ユーザーインタラクション検出システムを設定
     */
    setupUserInteractionDetection() {
        console.log('🖱️ ユーザーインタラクション検出システム設定開始');

        const enableAudioSystem = () => {
            if (this.waitingForUserInteraction) {
                console.log('👆 ユーザーインタラクション検出 - オーディオシステム有効化');
                this.waitingForUserInteraction = false;
                this.enableAudioContext();

                // BGMの遅延再生を試行
                if (this.pendingSceneBgm) {
                    console.log('🎵 保留中のBGMを再生:', this.pendingSceneBgm);
                    this.playSceneBGM(this.pendingSceneBgm.scene, this.pendingSceneBgm.fadeTime);
                    this.pendingSceneBgm = null;
                }
            }
        };

        // 複数のユーザーインタラクションを検出
        const events = ['click', 'tap', 'touchstart', 'keydown', 'mousedown'];
        events.forEach(eventType => {
            document.addEventListener(eventType, enableAudioSystem, { once: true, passive: true });
            console.log(`📱 ${eventType} イベントリスナー登録完了`);
        });

        // 5秒後にタイムアウト（自動有効化）
        setTimeout(() => {
            if (this.waitingForUserInteraction) {
                console.log('⏰ タイムアウト - オーディオシステム自動有効化');
                enableAudioSystem();
            }
        }, 5000);
    }

    /**
     * AudioContextを有効化
     */
    enableAudioContext() {
        if (this.AudioContextClass && !this.audioContext) {
            try {
                this.audioContext = new this.AudioContextClass();
                console.log('✅ AudioContext作成完了:', this.audioContext.state);

                if (this.audioContext.state === 'suspended') {
                    this.audioContext.resume().then(() => {
                        console.log('✅ AudioContext再開成功');
                    }).catch(e => {
                        console.warn('⚠️ AudioContext再開失敗:', e.message);
                    });
                }
            } catch (error) {
                console.error('❌ AudioContext作成エラー:', error);
            }
        }
    }

    /**
     * デバッグ情報を表示
     */
    debugInfo() {
        console.log('=== Audio Manager Debug Info ===');
        console.log('初期化済み:', this.isInitialized);
        console.log('ユーザーインタラクション待機中:', this.waitingForUserInteraction);
        console.log('AudioContext:', this.audioContext ? this.audioContext.state : '未作成');
        console.log('現在のBGM:', this.currentBgm);
        console.log('音量設定:', this.volumes);
        console.log('プリロード済み:', this.preloadedAudio.size, 'ファイル');
        console.log('SE プール:', this.seAudioPool.size, 'ファイル');
        console.log('===============================');
    }
}

// グローバルに公開
window.AudioManager = AudioManager;