/**
 * CSVLoader.js
 * BOM付きUTF-8形式のCSVファイルを読み込むシステム
 * 日本語文字化けを防ぎ、Excelで編集可能なCSVデータを管理
 */

class CSVLoader {
    constructor() {
        this.csvData = {};
        this.isSecretMode = false; // 秘めた想いモードフラグ
        this.csvFiles = [
            'scenes.csv',
            'characters.csv',
            'dialogues.csv',
            'prologue.csv',
            'victory_talk.csv',
            'bad_end.csv',
            'misaki_costumes.csv',
            'endings.csv',
            'ui_elements.csv',
            'ui_panels.csv',
            'ui_icons.csv',
            'ui_animations.csv',
            'ui_fonts.csv',
            'ui_responsive.csv',
            'game_balance.csv',
            'sound_effects.csv',
            'janken_patterns.csv',
            'misaki_reactions.csv',
            'save_data_structure.csv',
            'how_to_play.csv',
            'game_end_messages.csv',
            'click_sound_settings.csv',
            'bgm_settings.csv',
            'gallery_images.csv',
            'gallery_images_keys.csv'
        ];
    }

    /**
     * 日本語文字の妥当性を検証（文字化けチェック）
     * @param {string} text - 検証するテキスト
     * @returns {boolean} 日本語文字が正常かどうか
     */
    validateJapaneseText(text) {
        // ひらがな、カタカナ、漢字の範囲をチェック
        const japaneseRegex = /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/;
        
        if (!japaneseRegex.test(text)) {
            // 日本語文字が含まれていない場合は有効とみなす
            return true;
        }
        
        // 文字化けでよく出現する不正な文字をチェック
        const corruptedChars = /[��\uFFFD\u0000-\u001F\u007F-\u009F]/;
        if (corruptedChars.test(text)) {
            console.warn('⚠️ 文字化けの可能性のある文字を検出');
            return false;
        }
        
        // 「美咲」という文字が正しく読み込まれているかチェック（gallery_images.csvには必ず含まれる）
        if (text.includes('美咲')) {
            console.log('✅ 日本語文字「美咲」が正常に検出されました');
            return true;
        }
        
        // その他の一般的な日本語文字の存在確認
        const commonJapanese = /[あいうえおかきくけこさしすせそたちつてとなにぬねのはひふへほまみむめもやゆよらりるれろわをん]/;
        if (commonJapanese.test(text)) {
            return true;
        }
        
        console.warn('⚠️ 日本語文字の妥当性検証に失敗');
        return false;
    }

    /**
     * 秘めた想いモードを設定
     * @param {boolean} isSecret - 秘めた想いモードかどうか
     */
    setSecretMode(isSecret) {
        console.log(`CSVLoader: モード切り替え - ${isSecret ? '秘めた想いモード' : '通常モード'}`);
        this.isSecretMode = isSecret;

        // モード切り替え時にデータをリセットして再読み込み
        this.csvData = {};
        this.loadAllCSV(true);
    }

    /**
     * すべてのCSVファイルを非同期で読み込み
     * @param {boolean} forceReload - 強制リロード
     */
    async loadAllCSV(forceReload = false) {
        if (forceReload) {
            console.log('🔄 CSVファイルの強制リロードを開始します...');
            // 既存のキャッシュをクリア
            this.csvData = {};
            // ブラウザキャッシュを回避するためのタイムスタンプ追加
            this.cacheBreaker = Date.now();
        } else {
            console.log('📂 CSVファイルの読み込みを開始します...');
        }
        
        const loadPromises = this.csvFiles.map(filename => 
            this.loadCSV(filename)
        );

        try {
            await Promise.all(loadPromises);
            console.log('✅ すべてのCSVファイルの読み込みが完了しました');
            return true;
        } catch (error) {
            console.error('❌ CSVファイルの読み込み中にエラーが発生しました:', error);
            return false;
        }
    }

    /**
     * 指定されたCSVファイルを読み込み
     * @param {string} filenameOrTableName - CSVファイル名またはテーブル名
     * @param {string} customPath - カスタムパス（オプション）
     */
    async loadCSV(filenameOrTableName, customPath = null) {
        let filePath;
        let tableName;

        if (customPath) {
            // カスタムパスが指定された場合
            filePath = customPath;
            tableName = filenameOrTableName;
        } else {
            // 従来の方式：ファイル名のみ指定
            // 秘めた想いモードの場合、secret_プレフィックスを追加
            let filename = filenameOrTableName;
            if (this.isSecretMode && !filename.startsWith('secret_')) {
                filename = `secret_${filename}`;
                console.log(`🔒 秘めた想いモード: ${filenameOrTableName} → ${filename}`);
            }
            filePath = `./assets/data/csv/${filename}`;
            // テーブル名は元のファイル名を基準とする（secret_プレフィックスなし）
            tableName = filenameOrTableName.replace('.csv', '');
            console.log(`📊 CSVロード: ファイル=${filename}, テーブル名=${tableName}`);
        }
        
        try {
            // 超強力なキャッシュバスティング（複数のランダム値＋タイムスタンプ＋ミリ秒）
            const now = Date.now();
            const random1 = Math.random().toString(36).substring(2, 15);
            const random2 = Math.random().toString(36).substring(2, 15);
            const cacheBuster = `${now}_${random1}_${random2}_${performance.now()}`;
            const filePathWithCache = `${filePath}?v=${cacheBuster}&nocache=${now}&rand=${random1}`;
            
            console.log(`🔄 CSV読み込み試行: ${filePathWithCache}`);
            
            // 強制的なキャッシュ無効化ヘッダー（file://でも動作するように最適化）
            const fetchOptions = {
                method: 'GET',
                cache: 'no-store'
            };
            
            // http/httpsプロトコルの場合のみヘッダーを追加
            if (window.location.protocol === 'http:' || window.location.protocol === 'https:') {
                fetchOptions.headers = {
                    'Content-Type': 'text/csv',
                    'Cache-Control': 'no-cache, no-store, must-revalidate',
                    'Pragma': 'no-cache',
                    'Expires': '0'
                };
            }
            
            const response = await fetch(filePathWithCache, fetchOptions);
            
            if (!response.ok) {
                throw new Error(`CSVファイル '${filePath}' が見つかりません (${response.status})`);
            }
            
            // 強化された文字エンコーディング処理
            const arrayBuffer = await response.arrayBuffer();
            let csvText = '';
            
            // 複数のエンコーディングを試行（フォールバック機能）
            const encodings = ['utf-8', 'shift_jis', 'euc-jp', 'iso-2022-jp'];
            let decodingSuccess = false;
            
            for (const encoding of encodings) {
                try {
                    const decoder = new TextDecoder(encoding, { fatal: true });
                    csvText = decoder.decode(arrayBuffer);
                    
                    // 日本語文字の検証（文字化けチェック）
                    if (this.validateJapaneseText(csvText)) {
                        console.log(`✅ ${encoding} エンコーディングで正常に読み込み完了`);
                        decodingSuccess = true;
                        break;
                    }
                } catch (error) {
                    console.warn(`⚠️ ${encoding} での読み込みに失敗: ${error.message}`);
                    continue;
                }
            }
            
            if (!decodingSuccess) {
                console.warn('⚠️ 全てのエンコーディングでの読み込みに失敗、UTF-8 (非fatal) で再試行');
                const fallbackDecoder = new TextDecoder('utf-8', { fatal: false });
                csvText = fallbackDecoder.decode(arrayBuffer);
            }
            
            // BOMを除去（もし存在する場合）
            if (csvText.charCodeAt(0) === 0xFEFF) {
                csvText = csvText.slice(1);
                console.log('🔧 BOMを除去しました');
            }
            
            // CSVデータをパース
            const parsedData = this.parseCSV(csvText);

            this.csvData[tableName] = parsedData;
            console.log(`✓ ${tableName} を読み込みました (${parsedData.length} 行)`);
            console.log(`📂 現在のテーブル数: ${Object.keys(this.csvData).length}`);
            console.log(`🗂️ テーブルリスト: ${Object.keys(this.csvData).join(', ')}`);

            // scenesテーブルの詳細ログ
            if (tableName === 'scenes') {
                console.log(`🎬 scenes テーブルの詳細:`);
                console.log(`   秘密モード: ${this.isSecretMode}`);
                console.log(`   読み込んだファイル: ${filePath}`);
                console.log(`   データ件数: ${parsedData.length}`);
                if (parsedData.length > 0) {
                    console.log(`   最初のデータ:`, parsedData[0]);
                }
            }

            // デバッグ: 読み込んだデータの内容を表示（dialoguesとgallery_imagesの場合）
            if (tableName === 'dialogues') {
                console.log('📋 読み込んだdialoguesデータ:');
                parsedData.slice(0, 5).forEach((row, index) => {
                    console.log(`  ${index + 1}. ${row.dialogue_id}: ${row.character_id} - ${row.text?.substring(0, 30)}... - sprite_file: [${row.sprite_file}]`);
                });
                
                // d022のデータを特別に確認
                const d022Data = parsedData.find(row => row.dialogue_id === 'd022');
                if (d022Data) {
                    console.log('🔍 d022データの詳細確認:');
                    console.log('  dialogue_id:', d022Data.dialogue_id);
                    console.log('  character_id:', d022Data.character_id);
                    console.log('  sprite_file:', `[${d022Data.sprite_file}]`);
                    console.log('  sprite_file type:', typeof d022Data.sprite_file);
                    console.log('  sprite_file length:', d022Data.sprite_file ? d022Data.sprite_file.length : 'undefined');
                } else {
                    console.warn('⚠️ d022データが見つかりませんでした');
                }
            }
            
            // デバッグ: gallery_imagesの日本語文字確認
            if (tableName === 'gallery_images') {
                console.log('📋 読み込んだgallery_imagesデータ:');
                parsedData.forEach((row, index) => {
                    console.log(`  ${index + 1}. Stage ${row.stage}: ${row.display_name} - ${row.description?.substring(0, 30)}...`);
                    
                    // 各フィールドの文字コードをチェック
                    if (row.display_name) {
                        const nameBytes = Array.from(row.display_name).map(char => char.charCodeAt(0));
                        console.log(`    display_name 文字コード: ${nameBytes.slice(0, 10).join(', ')}...`);
                        console.log(`    display_name 検証結果: ${this.validateJapaneseText(row.display_name) ? '✅正常' : '❌文字化け'}`);
                    }
                    
                    if (row.description) {
                        console.log(`    description 検証結果: ${this.validateJapaneseText(row.description) ? '✅正常' : '❌文字化け'}`);
                    }
                });
            }
            
        } catch (error) {
            console.error(`❌ CSVファイル '${filePath}' の読み込みに失敗:`, error);
            console.log(`⚠️ フォールバックデータを使用します: ${tableName}`);
            
            // フォールバック: ダミーデータを生成
            this.csvData[tableName] = this.createFallbackData(tableName);
        }
    }

    /**
     * CSVテキストをパースしてオブジェクト配列に変換
     * @param {string} csvText - CSV文字列
     * @returns {Array} パースされたデータ配列
     */
    parseCSV(csvText) {
        const lines = csvText.split(/\r?\n/).filter(line => line.trim());
        
        if (lines.length === 0) {
            return [];
        }
        
        const headers = this.parseCSVLine(lines[0]);
        const data = [];
        
        for (let i = 1; i < lines.length; i++) {
            const values = this.parseCSVLine(lines[i]);
            
            if (values.length === headers.length) {
                const row = {};
                headers.forEach((header, index) => {
                    row[header] = values[index];
                });
                data.push(row);
            }
        }
        
        return data;
    }

    /**
     * CSVの1行をパース（カンマ区切り、クォート対応）
     * @param {string} line - CSV行
     * @returns {Array} 分割された値の配列
     */
    parseCSVLine(line) {
        const result = [];
        let current = '';
        let inQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            
            if (char === '"') {
                if (inQuotes && line[i + 1] === '"') {
                    // エスケープされたクォート
                    current += '"';
                    i++;
                } else {
                    // クォートの開始/終了
                    inQuotes = !inQuotes;
                }
            } else if (char === ',' && !inQuotes) {
                // フィールドの区切り
                result.push(current.trim());
                current = '';
            } else {
                current += char;
            }
        }
        
        result.push(current.trim());
        return result;
    }

    /**
     * フォールバックデータの生成（CSVが読み込めない場合）
     * @param {string} tableName - テーブル名
     * @returns {Array} ダミーデータ配列
     */
    createFallbackData(tableName) {
        console.log(`${tableName} のフォールバックデータを使用中（ゲームは正常に動作します）`);
        
        const fallbackData = {
            scenes: [
                { scene_id: 'title', scene_name: 'タイトル画面', background_image: 'bg_title_adult.png', bgm_file: 'bgm_title.mp3' },
                { scene_id: 'living', scene_name: 'リビング', background_image: 'bg_living_night.png', bgm_file: 'bgm_dialogue.mp3' },
                { scene_id: 'game', scene_name: 'じゃんけんバトル', background_image: 'bg_living_night.png', bgm_file: 'bgm_battle_tension.mp3' }
            ],
            characters: [
                { character_id: 'misaki', name: '美咲', default_image: 'misaki_adult_normal.png', age: '25' },
                { character_id: 'player', name: 'あなた', age: '22' }
            ],
            dialogues: [
                { dialogue_id: 'd001', scene_type: 'game_intro', trigger_condition: 'round_1', character: 'misaki', text: '久しぶりね。大学生活はどう？', priority: '1', emotion: 'smile' },
                { dialogue_id: 'd002', scene_type: 'game_start', trigger_condition: 'game_start', character: 'misaki', text: '昔みたいにお姉ちゃんって呼んでよ', priority: '1', emotion: 'teasing' },
                { dialogue_id: 'mr010', scene_type: 'reaction', trigger_condition: 'misaki_win_hp_high', character: 'misaki', text: 'やったぁ！勝った！', priority: '1', emotion: 'happy' },
                { dialogue_id: 'mr011', scene_type: 'reaction', trigger_condition: 'misaki_win_hp_high', character: 'misaki', text: 'ふふっ、いつも通り弱いなぁ♪', priority: '1', emotion: 'smug' },
                { dialogue_id: 'mr012', scene_type: 'reaction', trigger_condition: 'misaki_win_hp_high', character: 'misaki', text: 'えへへ…勝っちゃった♪', priority: '1', emotion: 'bashful' },
                { dialogue_id: 'mr019', scene_type: 'reaction', trigger_condition: 'draw', character: 'misaki', text: 'あ、あいこね…', priority: '1', emotion: 'neutral' },
                { dialogue_id: 'mr020', scene_type: 'reaction', trigger_condition: 'draw', character: 'misaki', text: 'も、もう一回！', priority: '1', emotion: 'determined' },
                { dialogue_id: 'vw001', scene_type: 'victory_sprite', trigger_condition: 'player_win_count_1', character: 'misaki', text: 'あ、あれ…、負けちゃった…。次は勝つからね！', priority: '1', emotion: 'surprised' },
                { dialogue_id: 'vw002', scene_type: 'victory_sprite', trigger_condition: 'player_win_count_2', character: 'misaki', text: 'うっ…いつもすぐ負けるくせにぃ…。まぐれだよね？', priority: '1', emotion: 'shocked' },
                { dialogue_id: 'vw003', scene_type: 'victory_sprite', trigger_condition: 'player_win_count_3', character: 'misaki', text: 'こ、こんなはずじゃ…恥ずかしい…。ここから先は…もうやめておかない？…', priority: '1', emotion: 'disbelief' },
                { dialogue_id: 'vw004', scene_type: 'victory_sprite', trigger_condition: 'player_win_count_4', character: 'misaki', text: 'や、やばい…。。。隠してもいいでしょ！！早く次はじめるよ！ジロジロ見ないの！', priority: '1', emotion: 'panic' },
                { dialogue_id: 'vw005', scene_type: 'victory_sprite', trigger_condition: 'player_win_count_5', character: 'misaki', text: 'あ、あぁ…負けちゃった…。そんなに見ないでよ…。野球拳だと強すぎない…？', priority: '1', emotion: 'defeated' }
            ],
            misaki_costumes: [
                { level: '1', costume_image: 'misaki_suit.png', costume_name: 'OLスーツ', hp_required: '5' },
                { level: '2', costume_image: 'misaki_casual.png', costume_name: 'カジュアル服', hp_required: '4' },
                { level: '3', costume_image: 'misaki_roomwear.png', costume_name: '大人の部屋着', hp_required: '3' },
                { level: '4', costume_image: 'misaki_camisole.png', costume_name: 'キャミソール', hp_required: '2' },
                { level: '5', costume_image: 'misaki_towel.png', costume_name: 'バスタオル', hp_required: '1' }
            ],
            endings: [
                { ending_id: 'true_end', ending_name: 'TRUE ENDING', condition: 'player_wins_5', bg_image: 'bg_sunrise.png' },
                { ending_id: 'bad_end', ending_name: 'BAD ENDING', condition: 'player_loses_5', bg_image: 'bg_night.png' }
            ],
            game_balance: [
                { parameter_id: 'initial_hp', value: '5' },
                { parameter_id: 'win_threshold', value: '5' },
                { parameter_id: 'lose_threshold', value: '5' }
            ],
            janken_patterns: [
                { pattern_id: 'round_1', round: '1', rock_weight: '34', scissors_weight: '33', paper_weight: '33' },
                { pattern_id: 'round_2', round: '2', rock_weight: '30', scissors_weight: '35', paper_weight: '35' }
            ],
            misaki_reactions: [
                { reaction_id: 'win_1', trigger: 'misaki_wins', dialogue: 'ふふっ、私の勝ちね', emotion: 'confident' },
                { reaction_id: 'lose_1', trigger: 'misaki_loses', dialogue: 'きゃっ！ちょっと待って...', emotion: 'surprised' }
            ],
            how_to_play: [
                { section_id: 'about', title: 'ゲームについて', content: '「2人の秘密、野球拳。」は、幼馴染の美咲お姉ちゃんとの野球拳ゲームです。<br>大人になった二人の秘密の時間を楽しみましょう。', icon: '📖', display_order: '1' },
                { section_id: 'rules', title: '野球拳のルール', content: '<ul><li><strong>グー：</strong> チョキに勝つ、パーに負ける</li><li><strong>チョキ：</strong> パーに勝つ、グーに負ける</li><li><strong>パー：</strong> グーに勝つ、チョキに負ける</li><li><strong>あいこ：</strong> 同じ手の場合は引き分け</li></ul>', icon: '✊', display_order: '2' },
                { section_id: 'victory', title: '勝利条件', content: '<ul><li>プレイヤーが<strong>5勝先取</strong>でクリア</li><li>美咲が5勝すると敗北</li><li>勝利するごとに美咲の衣装が変化</li><li>全9ラウンドで勝負が決まります</li></ul>', icon: '🎯', display_order: '3' },
                { section_id: 'costume', title: '衣装システム', content: '<p>美咲の衣装は勝利数に応じて段階的に変化します。</p><p>勝利を重ねるごとに、より特別な衣装が楽しめます。</p>', icon: '👗', display_order: '4' },
                { section_id: 'controls', title: '操作方法', content: '<ul><li><strong>マウス：</strong> ボタンをクリックして選択</li><li><strong>キーボード：</strong> 矢印キーでメニュー移動、Enterで決定</li><li><strong>美咲をクリック：</strong> 特別なメッセージが表示されます</li><li><strong>ヒント機能：</strong> 美咲の次の手を予測できます</li></ul>', icon: '🎮', display_order: '5' },
                { section_id: 'secrets', title: '隠し要素', content: '<ul><li>画面をクリックすると隠しCGが解放されることがあります</li><li>特定の条件で特別なエンディングが見られます</li><li>ギャラリーで収集したアイテムを確認できます</li><li>美咲の表情や反応にも注目してみてください</li></ul>', icon: '🔍', display_order: '6' },
                { section_id: 'footer', title: 'メッセージ', content: '🌸 大人になった二人の秘密の時間を楽しんでください 🌸', icon: '🌸', display_order: '7' }
            ],
            game_end_messages: [
                { message_id: 'ending_victory', scene_type: 'victory', title_text: 'ゲームクリア！', message_text: 'ここまで遊んでいただきありがとうございます！\n最終トークまで辿り着いたので、\nシークレットギャラリーを獲得しました！\nタイトル画面でご確認ください！', button1_text: 'もう一度プレイ', button2_text: 'タイトルに戻る', description: '勝利時のゲーム終了メッセージ' }
            ],
            gallery_images: [
                { stage: '1', image_file: 'misaki_game_stage1.png', display_name: '美咲', description: '', unlock_condition: 'ゲーム開始時から利用可能' },
                { stage: '2', image_file: 'misaki_game_stage2.png', display_name: '美咲', description: 'あ、あれ…、負けちゃった…。次は勝つからね！', unlock_condition: '1回勝利で解放' },
                { stage: '3', image_file: 'misaki_game_stage3.png', display_name: '美咲', description: 'うっ…いつもすぐ負けるくせにぃ…。まぐれだよね？', unlock_condition: '2回勝利で解放' },
                { stage: '4', image_file: 'misaki_game_stage4.png', display_name: '美咲', description: 'こ、こんなはずじゃ…恥ずかしい…。ここから先は…もうやめておかない？…', unlock_condition: '3回勝利で解放' },
                { stage: '5', image_file: 'misaki_game_stage5.png', display_name: '美咲', description: 'や、やばい…。。。隠してもいいでしょ！！早く次はじめるよ！ジロジロ見ないの！', unlock_condition: '4回勝利で解放' },
                { stage: '6', image_file: 'misaki_game_stage6.png', display_name: '美咲', description: 'あ、あぁ…負けちゃった…。そんなに見ないでよ…。野球拳だと強すぎない…？', unlock_condition: '5回勝利で解放' },
                { stage: '7', image_file: 'misaki_secret_victory.png', display_name: '美咲（シークレット）', description: 'おめでとう…ここまで来るなんて…♪ 君だけの特別な美咲よ', unlock_condition: 'ゲームクリアで解放' }
            ],
            bgm_settings: [
                { scene_id: 'title', bgm_file: 'bgm_title.mp3', volume: '0.7', loop: 'TRUE', fade_in_time: '2', fade_out_time: '1', description: 'タイトル画面BGM - ノスタルジックな夏の思い出' },
                { scene_id: 'dialogue', bgm_file: 'bgm_dialogue.mp3', volume: '0.6', loop: 'TRUE', fade_in_time: '2.5', fade_out_time: '2', description: 'バトル前トーク画面BGM - 穏やかな会話シーン' },
                { scene_id: 'game', bgm_file: 'bgm_battle_tension.mp3', volume: '0.8', loop: 'TRUE', fade_in_time: '1.5', fade_out_time: '1.5', description: 'バトル画面BGM - 緊張感のある野球拳バトル' },
                { scene_id: 'ending_true', bgm_file: 'bgm_ending_true.mp3', volume: '0.7', loop: 'TRUE', fade_in_time: '3', fade_out_time: '2', description: '真エンディングBGM - 感動的な勝利シーン' },
                { scene_id: 'ending_bad', bgm_file: 'bgm_ending_bad.mp3', volume: '0.5', loop: 'FALSE', fade_in_time: '2', fade_out_time: '0', description: 'BADエンディングBGM - 物悲しい敗北シーン' },
                { scene_id: 'loading', bgm_file: 'bgm_gentle_piano.mp3', volume: '0.4', loop: 'TRUE', fade_in_time: '1', fade_out_time: '1', description: 'ローディング画面BGM - 静かなピアノ' }
            ]
        };
        
        return fallbackData[tableName] || [];
    }

    /**
     * 指定されたテーブルのデータを取得
     * @param {string} tableName - テーブル名
     * @returns {Array} データ配列
     */
    getTableData(tableName) {
        console.log(`📊 getTableData('${tableName}')呼び出し`);
        const data = this.csvData[tableName] || [];
        console.log(`🔍 取得したデータ件数: ${data.length}`);
        console.log(`📂 利用可能なテーブル: ${Object.keys(this.csvData).join(', ')}`);
        
        if (tableName === 'victory_talk' && data.length > 0) {
            console.log('🎯 victory_talkデータの詳細（最新チェック）:');
            console.log(`📊 総件数: ${data.length} 件`);
            
            // 最初の3件と最後の3件を表示
            const showItems = Math.min(3, data.length);
            for (let i = 0; i < showItems; i++) {
                const item = data[i];
                console.log(`  [${i}] ${item.talk_id}: "${item.text?.substring(0, 30)}..." (sequence: ${item.sequence_order})`);
            }
            
            if (data.length > 6) {
                console.log('  ... （中略）');
            }
            
            const startIndex = Math.max(showItems, data.length - 3);
            for (let i = startIndex; i < data.length; i++) {
                const item = data[i];
                console.log(`  [${i}] ${item.talk_id}: "${item.text?.substring(0, 30)}..." (sequence: ${item.sequence_order})`);
            }
            
            // キーポイントチェック
            const hasPlayerThought = data.some(item => item.character === 'player_thought');
            const hasSoundEffect = data.some(item => item.character === 'sound_effect');
            console.log(`🔍 内容チェック: プレイヤー心の声=${hasPlayerThought}, 効果音=${hasSoundEffect}`);
        }
        
        return data;
    }

    /**
     * 指定されたテーブルのデータを取得（getTableDataのエイリアス）
     * @param {string} tableName - テーブル名
     * @returns {Array} データ配列
     */
    getData(tableName) {
        return this.getTableData(tableName);
    }

    /**
     * 指定された条件でデータを検索
     * @param {string} tableName - テーブル名
     * @param {string} key - 検索キー
     * @param {string} value - 検索値
     * @returns {Object|null} 見つかったデータまたはnull
     */
    findData(tableName, key, value) {
        const table = this.getTableData(tableName);
        return table.find(row => row[key] === value) || null;
    }

    /**
     * 指定された条件で複数のデータを検索
     * @param {string} tableName - テーブル名
     * @param {string} key - 検索キー
     * @param {string} value - 検索値
     * @returns {Array} 見つかったデータの配列
     */
    findAllData(tableName, key, value) {
        const table = this.getTableData(tableName);
        return table.filter(row => row[key] === value);
    }

    /**
     * 指定されたIDでデータを取得（汎用）
     * @param {string} tableName - テーブル名
     * @param {string} id - ID
     * @returns {Object|null} データまたはnull
     */
    getById(tableName, id) {
        const table = this.getTableData(tableName);
        const idKey = `${tableName.slice(0, -1)}_id`; // 単数形のIDキーを推測
        return table.find(row => row[idKey] === id || row.id === id) || null;
    }

    /**
     * 特定のCSVファイルを強制リロード
     * @param {string} filename - ファイル名
     */
    async forceReloadCSV(filename) {
        console.log(`🔄 ${filename} を強制リロードしています...`);
        const tableName = filename.replace('.csv', '');
        delete this.csvData[tableName];
        await this.loadCSV(filename);
        console.log(`✅ ${filename} のリロードが完了しました`);
    }

    /**
     * デバッグ用: すべてのテーブル情報を表示
     */
    debugInfo() {
        console.log('=== CSV Loader Debug Info ===');
        Object.keys(this.csvData).forEach(tableName => {
            const data = this.csvData[tableName];
            console.log(`${tableName}: ${data.length} rows`);
            if (data.length > 0) {
                console.log('  Columns:', Object.keys(data[0]));
                if (tableName === 'dialogues') {
                    console.log('  Sample dialogues:');
                    data.slice(0, 3).forEach((row, index) => {
                        console.log(`    ${index + 1}. ${row.dialogue_id}: ${row.character_id} - ${row.text?.substring(0, 30)}...`);
                    });
                }
            }
        });
        console.log('=============================');
    }
}

// グローバルに公開
window.CSVLoader = CSVLoader;