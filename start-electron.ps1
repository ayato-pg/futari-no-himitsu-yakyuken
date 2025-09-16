# PowerShell起動スクリプト
# 2人の秘密、野球拳。- Electronモード（BGM自動再生有効）

Write-Host "========================================" -ForegroundColor Cyan
Write-Host " 2人の秘密、野球拳。- Electronモード起動" -ForegroundColor Yellow
Write-Host " BGM自動再生有効化済み" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Electronがインストールされているか確認
if (!(Test-Path "node_modules\electron")) {
    Write-Host "❌ Electronがインストールされていません。" -ForegroundColor Red
    Write-Host "npm install を実行してください。" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host "🎮 ゲームを起動しています..." -ForegroundColor Green
Write-Host "🎵 BGMは即座に再生されます（自動再生ポリシー無効化済み）" -ForegroundColor Magenta
Write-Host ""

# Electronを自動再生有効化フラグ付きで起動
npm run start:autoplay

# エラーがあった場合は表示
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ エラーが発生しました。終了コード: $LASTEXITCODE" -ForegroundColor Red
}

Read-Host "Press Enter to exit"