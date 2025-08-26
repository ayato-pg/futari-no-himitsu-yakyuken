/**
 * CSVLoader.js
 * BOM付きUTF-8形式のCSVファイルを読み込むシステム
 * 日本語文字化けを防ぎ、Excelで編集可能なCSVデータを管理
 */

class CSVLoader {
    constructor() {
        this.csvData = {};
        this.csvFiles = [
            'scenes.csv',
            'characters.csv',
            'dialogues.csv',
            'misaki_costumes.csv',
            'endings.csv',
            'ui_elements.csv',
            'ui_panels.csv',
            'ui_icons.csv',
            'click_areas.csv',
            'ui_animations.csv',
            'ui_fonts.csv',
            'ui_responsive.csv',
            'game_balance.csv',
            'sound_effects.csv',
            'janken_patterns.csv',
            'misaki_reactions.csv',
            'save_data_structure.csv',
            'how_to_play.csv'
        ];
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
            filePath = `./assets/data/csv/${filenameOrTableName}`;
            tableName = filenameOrTableName.replace('.csv', '');
        }
        
        try {
            // 強力なキャッシュバスティング（ランダム値＋タイムスタンプ）
            const cacheBuster = new Date().getTime() + '_' + Math.random().toString(36).substring(7);
            const filePathWithCache = `${filePath}?v=${cacheBuster}&_=${Date.now()}`;
            
            console.log(`🔄 CSV読み込み試行: ${filePathWithCache}`);
            
            // 強制的なキャッシュ無効化ヘッダー
            const response = await fetch(filePathWithCache, {
                method: 'GET',
                headers: {
                    'Content-Type': 'text/csv',
                    'Cache-Control': 'no-cache, no-store, must-revalidate',
                    'Pragma': 'no-cache',
                    'Expires': '0'
                },
                cache: 'no-store' // より強力なキャッシュ無効化
            });
            
            if (!response.ok) {
                throw new Error(`CSVファイル '${filePath}' が見つかりません (${response.status})`);
            }
            
            // BOM付きUTF-8として読み込み
            const arrayBuffer = await response.arrayBuffer();
            const decoder = new TextDecoder('utf-8');
            let csvText = decoder.decode(arrayBuffer);
            
            // BOMを除去（もし存在する場合）
            if (csvText.charCodeAt(0) === 0xFEFF) {
                csvText = csvText.slice(1);
            }
            
            // CSVデータをパース
            const parsedData = this.parseCSV(csvText);
            
            this.csvData[tableName] = parsedData;
            console.log(`✓ ${tableName} を読み込みました (${parsedData.length} 行)`);
            
            // デバッグ: 読み込んだデータの内容を表示（dialoguesの場合のみ）
            if (tableName === 'dialogues') {
                console.log('📋 読み込んだdialoguesデータ:');
                parsedData.slice(0, 5).forEach((row, index) => {
                    console.log(`  ${index + 1}. ${row.dialogue_id}: ${row.character_id} - ${row.text?.substring(0, 30)}...`);
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
                { scene_id: 'title', scene_name: 'タイトル画面', background_image: 'bg_title_adult.png', bgm_file: 'nostalgic_summer.mp3' },
                { scene_id: 'living', scene_name: 'リビング', background_image: 'bg_living_night.png', bgm_file: 'reunion.mp3' },
                { scene_id: 'game', scene_name: 'じゃんけんバトル', background_image: 'bg_game_room.png', bgm_file: 'battle_sexy.mp3' }
            ],
            characters: [
                { character_id: 'misaki', name: '美咲', default_image: 'misaki_adult_normal.png', age: '25' },
                { character_id: 'player', name: 'あなた', age: '22' }
            ],
            dialogues: [
                { dialogue_id: 'd001', character_id: 'misaki', text: '久しぶりね。大学生活はどう？', emotion: 'smile' },
                { dialogue_id: 'd002', character_id: 'misaki', text: '昔みたいにお姉ちゃんって呼んでよ', emotion: 'teasing' }
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
        return this.csvData[tableName] || [];
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