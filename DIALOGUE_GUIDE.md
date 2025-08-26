# 会話データ編集ガイド

## 📝 概要
ゲーム内の会話はCSVファイルで管理されており、プログラムを変更せずに自由に編集できます。

## 📁 ファイル場所
- **メインファイル**: `assets/data/csv/dialogues.csv`
- **カスタムファイル**: `assets/data/csv/dialogue_custom.csv`

## 🎭 CSVファイル構造

### 基本カラム
| カラム名 | 説明 | 例 |
|---------|------|---|
| `dialogue_id` | 会話ID (d001, d002...) | d001 |
| `scene_id` | シーンID | living, intro, game |
| `character_id` | キャラクターID | misaki, player |
| `text` | セリフ内容 | 久しぶりね。大学生活はどう？ |
| `emotion` | 表情・感情 | smile, teasing, nostalgic |
| `voice_file` | ボイスファイル名 | v_001.mp3 |
| `next_id` | 次の会話ID | d002, game_start |

### オプションカラム
- `description`: 会話の説明（編集時の参考用）

## 🎬 シーンID一覧

### メインシーン
- **`living`**: リビングでの再会シーン
- **`intro`**: ゲーム導入会話
- **`game`**: バトル中の会話
- **`true_end`**: ハッピーエンド
- **`bad_end`**: バッドエンド

### カスタムシーン
- 独自のシーンIDを追加可能
- ゲームから呼び出す際に指定

## 😊 表情・感情一覧

### 美咲の表情
- `smile`: 微笑み
- `teasing`: からかい
- `nostalgic`: 懐かしむ
- `seductive`: 誘惑的
- `playful`: 遊び心
- `confident`: 自信満々
- `ready`: 準備完了
- `win_confident`: 勝利の自信
- `lose_surprised`: 敗北の驚き
- `lose_embarrassed`: 恥ずかしがり
- `very_embarrassed`: 非常に恥ずかしい
- `defeated_loving`: 愛情込めた敗北
- `victory_teasing`: 勝利のからかい
- `romantic`: ロマンチック
- `loving`: 愛情深い

## 🎵 ボイスファイル

### ファイル形式
- **推奨**: MP3形式
- **場所**: `assets/audio/voice/`
- **命名**: `v_001.mp3`, `v_002.mp3`...

### 設定方法
```csv
dialogue_id,character_id,text,voice_file
d001,misaki,久しぶりね,v_001.mp3
```

## 🔗 会話フロー制御

### next_id の使い方
- **通常**: 次の会話ID (`d002`)
- **ゲーム移行**: `game_start`
- **エンディング**: `true_end`, `bad_end`
- **会話終了**: 空文字 or `end`

### 分岐の作成
```csv
dialogue_id,scene_id,character_id,text,next_id
d005,intro,misaki,どうする？,choice_01
choice_01a,intro,player,やってみます,d006
choice_01b,intro,player,遠慮します,d010
```

## ✏️ 編集手順

### 1. ファイルを開く
- ExcelまたはテキストエディタでCSVを開く
- **重要**: BOM付きUTF-8で保存

### 2. 会話を編集
```csv
d001,living,misaki,こんにちは！元気だった？,smile,v_001.mp3,d002
```

### 3. 新しい会話を追加
```csv
d020,custom_scene,misaki,新しいセリフよ♪,happy,v_020.mp3,d021
```

### 4. ゲーム再起動
- ファイル保存後、ゲームを再起動
- 変更が自動的に反映される

## 🎯 実践例

### 基本的な会話
```csv
dialogue_id,scene_id,character_id,text,emotion,voice_file,next_id
d001,morning,misaki,おはよう♪,smile,v_morning_01.mp3,d002
d002,morning,player,おはようございます,,,d003
d003,morning,misaki,今日は何をしようか？,happy,v_morning_02.mp3,game_start
```

### 感情豊かな会話
```csv
dialogue_id,scene_id,character_id,text,emotion,voice_file,next_id
d010,confession,misaki,実は...ずっと好きだったの,shy,v_confession_01.mp3,d011
d011,confession,player,僕も同じ気持ちです,,,d012
d012,confession,misaki,本当？嬉しい♪,joy,v_confession_02.mp3,true_end
```

## 🔍 トラブルシューティング

### 会話が表示されない
- CSVファイルの文字エンコードを確認
- dialogue_idの重複をチェック
- scene_idが正しく設定されているか確認

### 表情が変わらない
- emotion列の値を確認
- 対応する画像ファイルが存在するか確認

### ボイスが再生されない
- voice_fileのパスを確認
- 音声ファイルが存在するか確認
- ファイル形式がサポートされているか確認

## 💡 上級テクニック

### 条件分岐の実装
ゲーム内の状態に応じて異なる会話を表示

### カスタムシーンの追加
独自のストーリー展開を作成

### 多言語対応
複数のCSVファイルで言語別の会話を管理

---

**📌 ヒント**: まずは既存の会話を少し変更してテストし、慣れてから大きな変更を加えることをお勧めします。