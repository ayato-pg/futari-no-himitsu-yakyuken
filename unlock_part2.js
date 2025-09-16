/**
 * Part 2を強制的に解放するデバッグスクリプト
 * ブラウザのコンソールで実行してください
 */

// SaveSystemを使用してPart 1をクリア済みにし、Part 2を解放
function unlockPart2() {
    // 現在の設定を取得
    const settings = JSON.parse(localStorage.getItem('game_settings') || '{}');

    // Part 1をクリア済みに
    if (!settings.completedParts) {
        settings.completedParts = [];
    }
    if (!settings.completedParts.includes(1)) {
        settings.completedParts.push(1);
    }

    // Part 2を解放
    if (!settings.unlockedParts) {
        settings.unlockedParts = [1];
    }
    if (!settings.unlockedParts.includes(2)) {
        settings.unlockedParts.push(2);
    }

    // 保存
    localStorage.setItem('game_settings', JSON.stringify(settings));

    console.log('✅ Part 2が解放されました！');
    console.log('📊 現在の設定:', settings);
    console.log('🔄 ページをリロードしてください');
}

// 実行
unlockPart2();