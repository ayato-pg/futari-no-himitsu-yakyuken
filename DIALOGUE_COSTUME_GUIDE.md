# 🎨 トーク画面立ち絵システム ガイド

## 📋 概要

トーク画面では `dialogues.csv` で会話ごとに美咲の立ち絵（衣装と表情）を自由に変更できます。

## 🎯 使い方

### 1. CSVでの指定方法

`dialogues.csv` の `costume` と `emotion` カラムで指定：

```csv
dialogue_id,scene_id,character_id,text,emotion,costume,voice_file,next_id
d001,living,misaki,こんにちは♪,smile,normal,v_001.mp3,d002
d002,living,misaki,ちょっと着替えてくるね,embarrassed,casual,,d003
d003,living,misaki,これでどう？,confident,roomwear,,d004
```

### 2. 画像ファイルの命名規則

#### 基本形式
```
misaki_dialogue_[衣装]_[表情].png
```

#### 実例
- `misaki_dialogue_normal_smile.png` - 通常服で笑顔
- `misaki_dialogue_casual_embarrassed.png` - カジュアル服で恥ずかしがり
- `misaki_dialogue_roomwear_confident.png` - 部屋着で自信満々

## 👗 衣装タイプ一覧

| 衣装タイプ | 説明 | 使用例 |
|------------|------|--------|
| `normal` | 通常の服装 | 初対面、日常会話 |
| `casual` | カジュアル服 | リラックスしたシーン |
| `roomwear` | 部屋着 | プライベート空間 |
| `nightwear` | パジャマ | 夜のシーン |
| `uniform` | 制服 | 学校・職場 |

## 😊 表情タイプ一覧

| 表情タイプ | 説明 | 使用例 |
|------------|------|--------|
| `normal` | 通常表情 | 普通の会話 |
| `smile` | 笑顔 | 嬉しい時、挨拶 |
| `embarrassed` | 恥ずかしがり | 照れた時 |
| `teasing` | いじわる | からかう時 |
| `confident` | 自信満々 | 勝ち誇った時 |
| `surprised` | 驚き | びっくりした時 |
| `sad` | 悲しい | 切ない時 |

## 🔄 動的変更システム

### 衣装変更
```csv
d005,living,misaki,着替えてきたよ,smile,casual,,d006
```
→ `misaki_dialogue_casual_smile.png` を表示

### 表情のみ変更
```csv
d006,living,misaki,え？そんなこと言うの？,surprised,,,d007
```
→ 現在の衣装で `surprised` 表情に変更

## 🛡️ フォールバックシステム

画像が見つからない場合の自動フォールバック：

1. **1次フォールバック**: `misaki_dialogue_[衣装].png`（表情なし版）
2. **2次フォールバック**: `misaki_dialogue_normal.png`（基本画像）

## 📁 ファイル配置

```
assets/images/characters/misaki/
├── misaki_dialogue_normal_smile.png
├── misaki_dialogue_normal_embarrassed.png
├── misaki_dialogue_casual_normal.png
├── misaki_dialogue_casual_teasing.png
├── misaki_dialogue_roomwear_confident.png
└── ...
```

## 💡 実装例

### シナリオ1: 日常会話から親密な関係へ

```csv
d001,living,misaki,おかえり,smile,normal,,d002
d002,living,misaki,今日はどうだった？,normal,normal,,d003
d003,living,misaki,ちょっと部屋で話さない？,teasing,casual,,d004
d004,living,misaki,こっちの方がリラックスできるでしょ,confident,roomwear,,d005
```

### シナリオ2: 表情の細かい変化

```csv
d010,room,misaki,実は話があるの,normal,roomwear,,d011
d011,room,misaki,えっと...その...,embarrassed,,,d012
d012,room,misaki,好きな人がいるの,smile,,,d013
d013,room,misaki,それは...あなたよ,confident,,,d014
```

## 🎮 開発者向け情報

### JavaScript側の処理

- `changeMisakiCostume(costume, emotion)`: 衣装と表情を同時変更
- `changeMisakiEmotion(emotion)`: 表情のみ変更
- `currentCostume`: 現在の衣装を記録

### デバッグログ

コンソールで以下のログを確認可能：
```
👗 衣装変更: casual + smile
😊 表情変更: casual + embarrassed
✅ 衣装変更完了: misaki_dialogue_casual_smile.png
```

## 🚨 注意事項

1. **命名規則を厳守**: `misaki_dialogue_[衣装]_[表情].png`
2. **画像サイズ統一**: 1920x1080推奨
3. **PNG形式必須**: 透明度対応
4. **エンコーディング**: ファイル名は英数字のみ

## 🎊 活用アイデア

- **時間経過の表現**: normal → casual → roomwear
- **感情の変化**: normal → embarrassed → confident
- **特別なイベント**: 特定の dialogue_id で特別な衣装
- **季節感**: 夏服、冬服の切り替え

---

このシステムにより、豊かな表現力でプレイヤーを魅了する会話シーンを作成できます！ ✨