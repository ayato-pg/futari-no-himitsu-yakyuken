@echo off
echo ========================================
echo  2人の秘密、野球拳。- Electronモード起動
echo  BGM自動再生有効化済み
echo ========================================
echo.

REM Electronがインストールされているか確認
if not exist "node_modules\electron" (
    echo Electronがインストールされていません。
    echo npm install を実行してください。
    pause
    exit /b 1
)

echo 🎮 ゲームを起動しています...
echo 🎵 BGMは即座に再生されます（自動再生ポリシー無効化済み）
echo.

REM Electronを自動再生有効化フラグ付きで起動
npm run start:autoplay

pause