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
            bgm: 0.7,
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
        
        // プリロード済みオーディオ
        this.preloadedAudio = new Map();
        
        // クロスフェード用
        this.fadingBgm = null;
        this.fadeInterval = null;
        
        // BGM設定（CSVから読み込み）
        this.bgmSettings = new Map();
        
        this.initialize();
    }

    /**
     * オーディオマネージャーを初期化
     */
    async initialize() {
        try {
            // ユーザー操作により音声再生を許可する処理
            document.addEventListener('click', this.enableAudio.bind(this), { once: true });
            document.addEventListener('keydown', this.enableAudio.bind(this), { once: true });
            
            // BGM設定をCSVから読み込み
            await this.loadBGMSettings();
            
            console.log('AudioManager初期化完了');
        } catch (error) {
            console.error('AudioManager初期化エラー:', error);
        }
    }

    /**
     * BGM設定をCSVから読み込み
     */
    async loadBGMSettings() {
        try {
            if (window.csvLoader && window.csvLoader.bgm_settings) {
                const bgmData = window.csvLoader.bgm_settings;
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
            console.error('BGM設定読み込みエラー:', error);
            this.loadFallbackBGMSettings();
        }
    }

    /**
     * フォールバック用のBGM設定をロード
     */
    loadFallbackBGMSettings() {
        const fallbackSettings = {
            'title': { bgm_file: 'bgm_title.mp3', volume: 0.7, loop: true, fade_in_time: 2.0, fade_out_time: 1.0 },
            'dialogue': { bgm_file: 'bgm_dialogue.mp3', volume: 0.6, loop: true, fade_in_time: 2.5, fade_out_time: 2.0 },
            'game': { bgm_file: 'bgm_battle_tension.mp3', volume: 0.8, loop: true, fade_in_time: 1.5, fade_out_time: 1.5 },
            'ending_true': { bgm_file: 'bgm_ending_true.mp3', volume: 0.7, loop: true, fade_in_time: 3.0, fade_out_time: 2.0 },
            'ending_bad': { bgm_file: 'bgm_ending_bad.mp3', volume: 0.5, loop: false, fade_in_time: 2.0, fade_out_time: 0 },
            'loading': { bgm_file: 'bgm_title.mp3', volume: 0.4, loop: true, fade_in_time: 1.0, fade_out_time: 1.0 }
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
            console.log('音声再生が有効になりました');
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
        if (!this.isInitialized) {
            console.warn('音声が初期化されていません');
            return;
        }

        try {
            // 同じBGMが再生中の場合は何もしない（より厳密なチェック）
            if (this.currentBgm === filename && this.bgmAudio && !this.bgmAudio.paused && !this.bgmAudio.ended) {
                console.log(`🎵 BGM重複チェック: ${filename} は既に再生中です`);
                console.log(`📊 現在の状態: paused=${this.bgmAudio.paused}, ended=${this.bgmAudio.ended}, readyState=${this.bgmAudio.readyState}`);
                return;
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

            // 新しいBGMを再生開始
            await newBgm.play();
            this.bgmAudio = newBgm;
            this.currentBgm = filename;

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
     * BGMを停止
     * @param {number} fadeTime - フェードアウト時間（秒）
     */
    stopBGM(fadeTime = 1.0) {
        if (this.bgmAudio) {
            this.fadeOut(this.bgmAudio, fadeTime, () => {
                this.bgmAudio = null;
                this.currentBgm = null;
            });
        }
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

        const startVolume = 0;
        const volumeStep = targetVolume / (duration * 60); // 60fps想定
        
        audio.volume = startVolume;
        
        const fadeInterval = setInterval(() => {
            if (audio.volume < targetVolume) {
                audio.volume = Math.min(audio.volume + volumeStep, targetVolume);
            } else {
                clearInterval(fadeInterval);
            }
        }, 1000 / 60);
    }

    /**
     * フェードアウト効果
     * @param {HTMLAudioElement} audio - オーディオ要素
     * @param {number} duration - フェード時間（秒）
     * @param {Function} callback - 完了後のコールバック
     */
    fadeOut(audio, duration, callback = null) {
        if (!audio) return;

        const startVolume = audio.volume;
        const volumeStep = startVolume / (duration * 60); // 60fps想定
        
        const fadeInterval = setInterval(() => {
            if (audio.volume > 0) {
                audio.volume = Math.max(audio.volume - volumeStep, 0);
            } else {
                clearInterval(fadeInterval);
                audio.pause();
                if (callback) callback();
            }
        }, 1000 / 60);
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
     * デバッグ情報を表示
     */
    debugInfo() {
        console.log('=== Audio Manager Debug Info ===');
        console.log('初期化済み:', this.isInitialized);
        console.log('現在のBGM:', this.currentBgm);
        console.log('音量設定:', this.volumes);
        console.log('プリロード済み:', this.preloadedAudio.size, 'ファイル');
        console.log('SE プール:', this.seAudioPool.size, 'ファイル');
        console.log('===============================');
    }
}

// グローバルに公開
window.AudioManager = AudioManager;