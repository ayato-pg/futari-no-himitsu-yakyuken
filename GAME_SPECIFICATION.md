# 「2人の秘密、野球拳。」ゲーム開発仕様書（Claude Code実装用）

## プロジェクト概要
このドキュメントは、Claude Codeで「2人の秘密、野球拳。」を実装するための完全仕様書です。

## 1. ゲーム概要

### 1.1 基本情報
- **タイトル**: 2人の秘密、野球拳。
- **ジャンル**: ビジュアルノベル＋じゃんけんバトル
- **プラットフォーム**: Electron（Windows/Mac/Linux対応）
- **想定プレイ時間**: 15-20分（1周）
- **対象年齢**: 18歳以上（非アダルト）
- **開発保存先**: `C:\Users\PC-user\OneDrive\デスクトップ\2人の秘密、野球拳。`

### 1.2 コンセプト
社会人になった幼なじみのお姉ちゃん「美咲」と久しぶりに再会した大学生の主人公。夏休みに実家に帰省した二人が、子供の頃の思い出の野球拳を通じて、大人になった今だからこそ気づく特別な感情を確かめ合う、甘く切ない青春恋愛アドベンチャー。

### 1.3 ゲームの目標
- **メイン目標**: 野球拳で美咲お姉ちゃんに勝利する（5勝するとTRUE END）
- **ゲームオーバー条件**: 主人公が5敗するとBAD END
- **サブ目標**: 
  - 全ての衣装差分を見る
  - 隠し会話イベントを発見する

## 2. 必須4画面UI設計

### 2.1 タイトル画面
```
┌─────────────────────────────────────────────┐
│  ╔══════════════════════════════════════╗  │
│  ║     2人の秘密、野球拳。                ║  │
│  ╚══════════════════════════════════════╝  │
│                                             │
│     ┌─────────────────┐                   │
│     │                   │                   │
│     │   美咲お姉ちゃん   │                   │
│     │    (立ち絵)       │                   │
│     │   大人の色気ver    │                   │
│     └─────────────────┘                   │
│                                             │
│  ┌─────────────┐  ┌─────────────┐        │
│  │  はじめから  │  │  つづきから  │        │
│  └─────────────┘  └─────────────┘        │
│  ┌─────────────┐  ┌─────────────┐        │
│  │   ギャラリー │  │    設定     │        │
│  └─────────────┘  └─────────────┘        │
│                                             │
│  BGM: nostalgic_summer.mp3                 │
└─────────────────────────────────────────────┘
```

**インタラクティブ要素**:
- 美咲の立ち絵がマウスホバーで微笑む（大人の色気）
- ボタンホバー時にキラキラエフェクト
- 背景に夏の夕暮れアニメーション（セミの声・風鈴）

### 2.2 会話シーン（美咲の立ち絵のみ）
```
┌─────────────────────────────────────────────┐
│  背景: リビング/縁側/美咲の部屋              │
│                                             │
│          ┌──────────────┐                  │
│          │              │                  │
│          │   美咲       │                  │
│          │  (大きな立ち絵)│                  │
│          │  25歳OL      │                  │
│          │  感情:照れ    │                  │
│          └──────────────┘                  │
│                                             │
│ ┌──────────────────────────────────────┐  │
│ │ 美咲                                  │  │
│ │「久しぶりね。大学生活はどう？        │  │
│ │  ...ねぇ、覚えてる？昔よくやった      │  │
│ │  野球拳。今夜は二人きりだし...」▼     │  │
│ └──────────────────────────────────────┘  │
│                                             │
│ [Skip] [Auto] [Log] [Save] [Menu]          │
└─────────────────────────────────────────────┘
```

### 2.3 メインゲーム画面（美咲の立ち絵を大きく表示）
```
┌─────────────────────────────────────────────┐
│  ラウンド 3/9   勝利条件: 5勝先取           │
│                                             │
│  美咲 HP: ♥♥♥♡♡  敗北数: 2               │
│                                             │
│     ┌────────────────────────┐              │
│     │                      │              │
│     │      美咲            │              │
│     │   (大きな立ち絵)      │              │
│     │    衣装レベル2        │              │
│     │   カジュアル服        │              │
│     │                      │              │
│     └────────────────────────┘              │
│                                             │
│  前回: 美咲[パー] VS あなた[グー]           │
│         あなたの負け！                      │
│                                             │
│  あなた HP: ♥♥♥♥♡  勝利数: 2             │
│                                             │
│  ┌──────┐ ┌──────┐ ┌──────┐            │
│  │ グー │ │ チョキ│ │ パー │            │
│  └──────┘ └──────┘ └──────┘            │
│         選択してください                    │
│                                             │
│ [必殺技: 未使用] [ヒント] [降参]           │
└─────────────────────────────────────────────┘
```

### 2.4 エンディング画面（2種類のみ）

#### TRUE ENDING（主人公5勝）
- 美咲が完全に負けを認める
- 恥ずかしがりながらも主人公を認める
- 二人の新しい関係の始まりを示唆
- 専用CG表示

#### BAD ENDING（主人公5敗）
- 美咲の完全勝利
- 主人公をからかう美咲
- 「また今度ね」という約束
- 屈辱的な専用CG表示

## 3. ゲームシステム

### 3.1 じゃんけんバトルシステム
- **基本ルール**: 最大9ラウンド
- **勝利条件**: 主人公が5勝でTRUE END
- **敗北条件**: 主人公が5敗でBAD END（即ゲームオーバー）
- **HP制**: 各キャラ5HP、負けると1HP減少
- **衣装変化**: 美咲がラウンドに負けるごとに衣装レベルが変化（5段階）
- **必殺技**: 3連勝で発動可能な「読心術」（相手の手が見える）

### 3.2 難易度システム
- 美咲の手の選択にはAIパターンを実装
- 序盤は比較的勝ちやすく、後半になるにつれて難しくなる
- プレイヤーの選択履歴を分析して対抗手を出す確率が上昇

### 3.3 衣装レベルシステム（美咲のみ）
```
レベル1: OLスーツ（仕事帰りの姿）- HP5
レベル2: カジュアル服（リラックスした私服）- HP4
レベル3: 部屋着（大人のルームウェア）- HP3
レベル4: キャミソール（セクシーな下着姿）- HP2
レベル5: バスタオル（最も恥ずかしい姿）- HP1
```

## 4. キャラクター設定（2名のみ）

### 4.1 美咲お姉ちゃん
- **年齢**: 25歳（社会人3年目）
- **職業**: OL（都内の会社勤務）
- **性格**: 大人の余裕、でも主人公の前では甘えたがり
- **関係性**: 幼なじみ、5歳年上のお姉ちゃん的存在
- **好きなもの**: 主人公との思い出、お酒（少し）、夜更かし
- **表情差分**: 通常、微笑、照れ、驚き、悔しい、色っぽい、勝ち誇り

### 4.2 主人公（プレイヤー）
- **年齢**: 20-23歳（大学生）
- **性格**: 選択肢により変化
- **関係性**: 美咲を昔から慕っている
- **特技**: 野球拳（子供の頃から美咲に教わった）
- **立ち絵**: なし（一人称視点）

## 5. CSV完全外部管理システム（17個）

### 5.1 CSVエンコーディング仕様
**【超重要】全CSVファイル共通仕様**:
- **エンコーディング**: BOM付きUTF-8（ファイル先頭に`\uFEFF`を必ず付与）
- **改行コード**: CRLF（`\r\n`）
- **区切り文字**: カンマ（`,`）
- **エスケープ**: ダブルクォート（`"`）で囲む
- **Excel互換**: ダブルクリックで開いても文字化けしない

### 5.2 必須CSVファイル一覧

#### 1. scenes.csv
```csv
scene_id,scene_name,background_image,bgm_file,ambient_sound,transition_type
title,タイトル画面,bg_title_adult.png,nostalgic_summer.mp3,cicada_evening.mp3,fade
living,リビング,bg_living_night.png,reunion.mp3,,slide
misaki_room,美咲の部屋,bg_room_adult.png,intimate.mp3,night_breeze.mp3,fade
game,じゃんけんバトル,bg_game_room.png,battle_sexy.mp3,,fade
```

#### 2. characters.csv
```csv
character_id,name,default_image,voice_actor,personality,age
misaki,美咲,misaki_adult_normal.png,voice_001,大人のお姉さん,25
player,あなた,,,大学生,22
```

#### 3. dialogues.csv
```csv
dialogue_id,scene_id,character_id,text,emotion,voice_file,next_id
d001,living,misaki,久しぶりね。大学生活はどう？,smile,v_001.mp3,d002
d002,living,player,美咲さん...3年ぶりですね,,,d003
d003,living,misaki,さん付けなんて水臭いなぁ。昔みたいにお姉ちゃんって呼んでよ,teasing,v_002.mp3,d004
d004,living,misaki,ねぇ...覚えてる？昔よくやった野球拳,nostalgic,v_003.mp3,d005
d005,living,misaki,今夜は二人きりだし...大人のルールでやってみない？,seductive,v_004.mp3,d006
d006,living,player,大人のルールって...？,,,d007
d007,living,misaki,負けた方が一枚ずつ脱ぐの。どう？怖い？,playful,v_005.mp3,d008
```

#### 4. misaki_costumes.csv
```csv
level,costume_image,costume_name,hp_required,description,emotion_modifier
1,misaki_suit.png,OLスーツ,5,仕事帰りの美咲さん,confident
2,misaki_casual.png,カジュアル服,4,リラックスした私服姿,relaxed
3,misaki_roomwear.png,大人の部屋着,3,セクシーなルームウェア,flirty
4,misaki_camisole.png,キャミソール,2,恥ずかしがる美咲,embarrassed
5,misaki_towel.png,バスタオル,1,とても恥ずかしい姿,very_embarrassed
```

#### 5. endings.csv
```csv
ending_id,ending_name,title_text,condition,bg_image,bgm_file,cg_image,special_text
true_end,TRUE ENDING,大人になった二人の約束,player_wins_5,bg_sunrise.png,eternal_summer.mp3,cg_true_adult.png,これから二人の新しい関係が始まる...
bad_end,BAD ENDING,完敗...また今度ね,player_loses_5,bg_night.png,game_over.mp3,cg_bad.png,あらあら、まだまだ子供ね♪
```

#### 6. ui_elements.csv
```csv
element_id,element_type,image_normal,image_hover,image_pressed,width,height,tooltip
btn_start,button,btn_start_n.png,btn_start_h.png,btn_start_p.png,200,60,ゲームを始める
btn_continue,button,btn_continue_n.png,btn_continue_h.png,btn_continue_p.png,200,60,続きから
btn_rock,button,btn_rock_n.png,btn_rock_h.png,btn_rock_p.png,120,120,グーを出す
btn_scissors,button,btn_scissors_n.png,btn_scissors_h.png,btn_scissors_p.png,120,120,チョキを出す
btn_paper,button,btn_paper_n.png,btn_paper_h.png,btn_paper_p.png,120,120,パーを出す
```

#### 7. ui_panels.csv
```csv
panel_id,panel_image,x_position,y_position,width,height,opacity,z_index
dialogue_box,panel_dialogue_adult.png,50,500,700,150,0.9,100
status_panel_top,panel_status_misaki.png,10,10,780,120,0.8,90
status_panel_bottom,panel_status_player.png,10,620,80,80,0.8,90
misaki_display,panel_transparent.png,200,130,400,450,0,80
```

#### 8. ui_icons.csv
```csv
icon_id,icon_image,icon_size,tooltip_text,animation_type
heart_full,heart_full.png,32,HP満タン,pulse
heart_empty,heart_empty.png,32,HPなし,none
star,star.png,24,達成度,rotate
clothing,clothing.png,28,衣装レベル,none
victory,victory.png,32,勝利,bounce
```

#### 9. click_areas.csv
```csv
area_id,scene_id,x,y,width,height,action_type,action_param,cursor_type,hover_effect
area_misaki_body,game,200,130,400,450,view_costume,current,pointer,glow_pink
area_secret,misaki_room,750,450,50,50,unlock_cg,secret_adult_01,help,sparkle
```

#### 10. ui_animations.csv
```csv
animation_id,animation_type,duration_ms,easing,loop,trigger_event
btn_hover,scale,200,ease-out,false,mouseenter
text_appear,fade_in,500,ease-in,false,scene_start
costume_change,dissolve,800,ease-in-out,false,round_lose
victory_bounce,bounce,1000,ease-out,false,player_win
defeat_shake,shake,500,ease-out,false,player_lose
blush,fade_red,300,ease-in,false,embarrassed
```

#### 11. ui_fonts.csv
```csv
font_id,font_family,font_size,font_color,font_weight,text_shadow,line_height
dialogue_text,Noto Sans JP,18,#FFFFFF,normal,2px 2px 4px rgba(0,0,0,0.5),1.5
character_name,Noto Sans JP,22,#FFB6C1,bold,3px 3px 5px rgba(0,0,0,0.7),1.2
result_text,Noto Sans JP,32,#FFD700,bold,4px 4px 6px rgba(0,0,0,0.8),1
```

#### 12. ui_responsive.csv
```csv
screen_size,scene_id,scale_factor,layout_type,font_scale,button_scale,misaki_scale
1920x1080,all,1.0,default,1.0,1.0,1.0
1366x768,all,0.8,compact,0.9,0.85,0.85
1024x768,all,0.7,compact,0.85,0.8,0.75
mobile,all,0.5,vertical,0.8,1.2,0.6
```

#### 13. game_balance.csv
```csv
parameter_id,value,min_value,max_value,increment,description
initial_hp,5,1,10,1,開始時のHP
win_threshold,5,3,7,1,勝利に必要な勝ち数
lose_threshold,5,3,7,1,敗北となる負け数
special_cooldown,3,1,5,1,必殺技のクールダウン
ai_difficulty_increment,0.1,0,0.2,0.05,ラウンドごとの難易度上昇
```

#### 14. sound_effects.csv
```csv
sound_id,file_name,volume,category,loop,trigger_event
click,se_click.mp3,0.5,ui,false,button_click
janken_win,se_win.mp3,0.7,game,false,round_win
janken_lose,se_lose.mp3,0.6,game,false,round_lose
cloth_rustle,se_cloth.mp3,0.4,game,false,costume_change
heart_beat,se_heartbeat.mp3,0.8,game,true,final_round
embarrassed,se_embarrassed.mp3,0.5,voice,false,misaki_lose
victory_fanfare,se_victory.mp3,0.9,game,false,game_win
defeat_sound,se_defeat.mp3,0.7,game,false,game_lose
```

#### 15. janken_patterns.csv
```csv
pattern_id,round,rock_weight,scissors_weight,paper_weight,special_pattern
round_1,1,34,33,33,none
round_2,2,30,35,35,slight_counter
round_3,3,28,36,36,moderate_counter
round_4,4,25,38,37,strong_counter
round_5,5,22,40,38,ai_predict
round_6,6,20,42,38,advanced_ai
round_7,7,18,44,38,expert_ai
round_8,8,15,45,40,master_ai
round_9,9,10,50,40,final_boss
```

#### 16. misaki_reactions.csv
```csv
reaction_id,trigger,costume_level,dialogue,emotion,voice_file
win_1,misaki_wins,1,ふふっ、私の勝ちね,confident,v_win1.mp3
win_2,misaki_wins,2,あら、まだまだかな？,playful,v_win2.mp3
win_3,misaki_wins,3,強がってもダメよ,teasing,v_win3.mp3
lose_1,misaki_loses,1,きゃっ！ちょっと待って...,surprised,v_lose1.mp3
lose_2,misaki_loses,2,も、もう...恥ずかしい,embarrassed,v_lose2.mp3
lose_3,misaki_loses,3,こ、これ以上は...,very_embarrassed,v_lose3.mp3
lose_4,misaki_loses,4,見ないで...,shy,v_lose4.mp3
lose_5,misaki_loses,5,あなたの勝ちよ...,defeated,v_lose5.mp3
```

#### 17. save_data_structure.csv
```csv
save_slot,timestamp,scene_id,player_hp,misaki_hp,player_wins,misaki_wins,current_round,unlocked_cg,flags
slot_01,2024-01-20T20:30:00,game,4,3,2,3,5,cg_001;cg_002,first_game
slot_02,2024-01-20T21:45:00,game,2,1,4,4,8,cg_001;cg_002;cg_003,near_end
slot_03,2024-01-20T22:00:00,ending,0,0,5,4,9,all,true_ending
auto,2024-01-20T22:05:00,title,5,5,0,0,0,,new_game
```

## 6. 技術実装仕様

### 6.1 開発環境設定
```json
{
  "name": "futari-no-himitsu-yakyuken",
  "version": "1.0.0",
  "main": "main.js",
  "scripts": {
    "start": "electron .",
    "build": "electron-builder",
    "dev": "electron . --dev"
  },
  "dependencies": {
    "electron": "^27.0.0"
  },
  "build": {
    "appId": "com.claude.yakyuken",
    "productName": "2人の秘密、野球拳。",
    "directories": {
      "output": "dist"
    },
    "win": {
      "target": "nsis",
      "icon": "assets/icon.ico"
    }
  }
}
```

### 6.2 ディレクトリ構造
```
2人の秘密、野球拳。/
├── main.js                 # Electronメインプロセス
├── index.html              # エントリーポイント
├── package.json            # プロジェクト設定
├── src/
│   ├── game.js            # ゲームメインロジック
│   ├── scenes/            # シーン管理
│   │   ├── TitleScene.js
│   │   ├── DialogueScene.js
│   │   ├── GameScene.js
│   │   └── EndingScene.js
│   ├── systems/           # 各種システム
│   │   ├── CSVLoader.js
│   │   ├── SaveSystem.js
│   │   ├── InputManager.js
│   │   └── AudioManager.js
│   └── ui/                # UI関連
│       ├── DialogueBox.js
│       ├── MisakiDisplay.js
│       └── ButtonManager.js
├── assets/
│   ├── images/
│   │   ├── backgrounds/
│   │   ├── characters/
│   │   │   └── misaki/
│   │   ├── ui/
│   │   ├── cg/
│   │   └── effects/
│   ├── audio/
│   │   ├── bgm/
│   │   ├── se/
│   │   └── voice/
│   └── data/
│       └── csv/           # BOM付きUTF-8
└── README.md
```

## 7. 実装の優先順位

### Phase 1: 基本システム（必須）
1. Electronアプリケーションの基本構造
2. CSVローダー（BOM付きUTF-8対応）
3. タイトル画面
4. 会話シーンシステム

### Phase 2: コアゲームプレイ（必須）
1. じゃんけんバトルシステム
2. 美咲の大型立ち絵表示
3. 衣装変化システム
4. 勝敗判定

### Phase 3: エンディング（必須）
1. TRUE END実装
2. BAD END実装
3. セーブ/ロードシステム

### Phase 4: ポリッシュ（推奨）
1. アニメーション実装
2. 効果音・BGM実装
3. マルチデバイス対応
4. ギャラリー機能

## 8. 開発時の注意点

### 必ず守るべきポイント
1. **CSVは必ずBOM付きUTF-8で作成**
2. **美咲の立ち絵を大きく表示**
3. **主人公の立ち絵は表示しない**
4. **エンディングは2種類のみ**
5. **主人公が5敗したら即BAD END**

### 画像素材の準備
- 美咲の立ち絵: 各衣装レベル×各表情
- 背景画像: 最低4枚
- UI素材: ボタン、パネル、アイコン
- エンディングCG: 2枚

### テスト項目
- [ ] CSVファイルの文字化け確認
- [ ] じゃんけんの勝敗判定
- [ ] 衣装変化の動作確認
- [ ] セーブ/ロード機能
- [ ] エンディング分岐
- [ ] BGM/SE再生
- [ ] マルチデバイス対応

## 9. Claude Codeへの実装指示

以下の順番で実装してください：

1. **プロジェクト初期化**
   - Electronプロジェクトを作成
   - package.jsonを設定
   - ディレクトリ構造を作成

2. **CSVシステム実装**
   - BOM付きUTF-8対応のCSVローダー作成
   - 全17個のCSVファイルを生成

3. **基本画面実装**
   - タイトル画面
   - 会話シーン（美咲のみ表示）
   - メインゲーム画面（美咲大型表示）
   - エンディング画面（2種類）

4. **ゲームロジック実装**
   - じゃんけんシステム
   - HP管理
   - 衣装変化
   - 勝敗判定

5. **仕上げ**
   - アニメーション追加
   - 音声ファイル統合
   - セーブシステム
   - テストとデバッグ

## 最終確認事項
- [ ] 4画面すべて実装済み
- [ ] CSV17個すべて作成済み
- [ ] BOM付きUTF-8形式
- [ ] 美咲の衣装5段階変化
- [ ] TRUE END/BAD END実装
- [ ] 15-20分のプレイ時間
