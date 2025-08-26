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
        
        // BGMファイルマッピング（playSceneBGMメソッド内で管理）
        
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
            
            console.log('AudioManager初期化完了');
        } catch (error) {
            console.error('AudioManager初期化エラー:', error);
        }
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
            // 同じBGMが再生中の場合は何もしない
            if (this.currentBgm === filename && this.bgmAudio && !this.bgmAudio.paused) {
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
     * シーン専用BGMを再生（自動クロスフェード）
     * @param {string} sceneId - シーンID
     * @param {number} fadeTime - フェード時間（秒）
     */
    async playSceneBGM(sceneId, fadeTime = 2.0) {
        const bgmMap = {
            'title': 'bgm_nostalgic_summer.mp3',
            'dialogue': 'bgm_reunion_memories.mp3', 
            'game': 'bgm_battle_tension.mp3',
            'ending_true': 'bgm_eternal_love.mp3',
            'ending_bad': 'bgm_melancholy_night.mp3',
            'loading': 'bgm_gentle_piano.mp3'
        };

        const bgmFile = bgmMap[sceneId];
        if (bgmFile) {
            console.log(`🎵 シーン「${sceneId}」のBGMを再生: ${bgmFile}`);
            await this.playBGM(bgmFile, true, fadeTime);
        } else {
            console.log(`シーン '${sceneId}' に対応するBGMが見つかりません`);
        }
    }

    /**
     * フォールバックBGMを再生
     */
    async playFallbackBGM() {
        const fallbackBgms = [
            'bgm_default.mp3',
            'bgm_ambient.mp3', 
            'bgm_peaceful.mp3'
        ];

        for (const bgm of fallbackBgms) {
            try {
                const audio = new Audio(this.bgmPath + bgm);
                await audio.play();
                audio.pause(); // テストのみ
                await this.playBGM(bgm, true, 1.0);
                break;
            } catch (error) {
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
            return;
        }

        try {
            let seAudio = this.seAudioPool.get(filename);
            
            if (!seAudio) {
                seAudio = new Audio(this.sePath + filename);
                this.seAudioPool.set(filename, seAudio);
            }

            // 音量設定
            seAudio.volume = this.volumes.se * this.volumes.master * volume;
            seAudio.currentTime = 0; // 再生位置をリセット

            await seAudio.play();
            console.log(`SE再生: ${filename}`);
            
        } catch (error) {
            console.error(`SE再生エラー (${filename}):`, error);
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