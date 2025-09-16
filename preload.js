/**
 * preload.js
 * Electronプリロードスクリプト
 * レンダラープロセスで自動再生を有効化するための設定
 */

const { contextBridge } = require('electron');

// Electron環境であることを示すフラグを設定
contextBridge.exposeInMainWorld('electronAPI', {
    isElectron: true,
    autoplayEnabled: true,

    // 音声再生ヘルパー関数
    playAudio: async (audioPath) => {
        try {
            const audio = new Audio(audioPath);
            audio.volume = 0.7;
            await audio.play();
            console.log('✅ Electron経由で音声再生成功:', audioPath);
            return true;
        } catch (error) {
            console.error('❌ Electron音声再生エラー:', error);
            return false;
        }
    },

    // BGM即座再生を強制
    forcePlayBGM: async (bgmPath) => {
        console.log('🎵 Electron: BGM強制再生試行:', bgmPath);

        try {
            // AudioContextを強制的に再開
            if (window.AudioContext || window.webkitAudioContext) {
                const AudioContextClass = window.AudioContext || window.webkitAudioContext;
                const context = new AudioContextClass();

                if (context.state === 'suspended') {
                    await context.resume();
                    console.log('✅ AudioContext再開成功');
                }
            }

            // BGMを再生
            const bgm = new Audio(bgmPath);
            bgm.loop = true;
            bgm.volume = 0.7;

            const playPromise = bgm.play();
            if (playPromise !== undefined) {
                await playPromise;
                console.log('✅ BGM再生成功（Electron強制）');
                return bgm;
            }

        } catch (error) {
            console.error('❌ BGM強制再生失敗:', error);
            return null;
        }
    }
});

// ページ読み込み完了時に自動再生を有効化
window.addEventListener('DOMContentLoaded', () => {
    console.log('🎮 Electronプリロード完了');
    console.log('🎵 自動再生ポリシー: 無効化済み');
    console.log('✅ BGMは即座に再生可能です');

    // グローバル変数として自動再生フラグを設定
    window.ELECTRON_AUTOPLAY_ENABLED = true;

    // 初期化時に音声コンテキストを作成して再生準備
    setTimeout(() => {
        if (window.AudioContext || window.webkitAudioContext) {
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            const initContext = new AudioContextClass();

            // サイレント音声で初期化
            const oscillator = initContext.createOscillator();
            const gainNode = initContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(initContext.destination);

            oscillator.frequency.setValueAtTime(0, initContext.currentTime);
            gainNode.gain.setValueAtTime(0, initContext.currentTime);

            oscillator.start();
            oscillator.stop(initContext.currentTime + 0.01);

            console.log('🔊 音声コンテキスト初期化完了');
        }
    }, 100);
});