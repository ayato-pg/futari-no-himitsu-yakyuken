/**
 * BadEndEditorScene.js
 * BAD ENDテキスト編集画面を管理するクラス
 */

console.log('BadEndEditorScene.jsが読み込まれました');

class BadEndEditorScene {
    constructor(gameController) {
        this.game = gameController;
        this.isActive = false;
        
        // DOM要素への参照
        this.editorScreen = null;
        this.formElements = {};
        this.currentData = null;
        
        this.initialize();
    }

    /**
     * 編集画面を初期化
     */
    initialize() {
        console.log('BadEndEditorScene初期化開始');
        
        this.editorScreen = document.getElementById('bad-end-editor-screen');
        console.log('editorScreen found:', this.editorScreen);
        
        if (!this.editorScreen) {
            console.error('❌ bad-end-editor-screen要素が見つかりません');
            return;
        }
        
        // フォーム要素を取得
        this.formElements = {
            title: document.getElementById('bad-end-title'),
            opening: document.getElementById('bad-end-opening'),
            reaction: document.getElementById('bad-end-reaction'),
            special: document.getElementById('bad-end-special'),
            childhood: document.getElementById('bad-end-childhood'),
            invitation: document.getElementById('bad-end-invitation'),
            impression: document.getElementById('bad-end-impression')
        };
        
        console.log('Form elements found:', this.formElements);
        
        // プレビューエリア
        this.previewArea = document.getElementById('preview-area');
        this.previewContent = document.getElementById('preview-content');
        
        this.setupEventListeners();
        console.log('✅ BadEndEditorScene初期化完了');
    }

    /**
     * イベントリスナーを設定
     */
    setupEventListeners() {
        // タイトルへ戻るボタン
        const returnBtn = document.getElementById('editor-return-btn');
        if (returnBtn) {
            returnBtn.addEventListener('click', () => {
                this.game.audioManager.playSE('se_click.mp3', 0.7);
                this.hide();
                this.game.showTitleScreen();
            });
        }
        
        // 保存ボタン
        const saveBtn = document.getElementById('btn-save-bad-end');
        if (saveBtn) {
            saveBtn.addEventListener('click', () => {
                this.saveBadEndData();
            });
        }
        
        // リセットボタン
        const resetBtn = document.getElementById('btn-reset-bad-end');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                this.resetToDefault();
            });
        }
        
        // プレビューボタン
        const previewBtn = document.getElementById('btn-preview-bad-end');
        if (previewBtn) {
            previewBtn.addEventListener('click', () => {
                this.togglePreview();
            });
        }
        
        // CSV読み込みボタン
        const loadCsvBtn = document.getElementById('btn-load-csv-bad-end');
        if (loadCsvBtn) {
            loadCsvBtn.addEventListener('click', () => {
                this.reloadCSVData();
            });
        }
    }

    /**
     * 編集画面を表示
     */
    async show() {
        if (this.isActive) return;
        
        console.log('🚨 緊急：BAD END編集画面を強制表示');
        
        // 既存の画面要素を確認
        console.log('editorScreen element:', this.editorScreen);
        
        // 動的に画面を作成して確実に表示
        this.createDynamicEditor();
        
        this.isActive = true;
        console.log('✅ 動的BAD END編集画面を作成・表示しました');
    }

    /**
     * 動的にBAD END編集画面を作成
     */
    createDynamicEditor() {
        // 既存の編集画面があれば削除
        const existing = document.getElementById('dynamic-bad-end-editor');
        if (existing) {
            existing.remove();
        }
        
        // 完全に新しい編集画面を動的作成
        const editorDiv = document.createElement('div');
        editorDiv.id = 'dynamic-bad-end-editor';
        editorDiv.style.cssText = `
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            width: 100vw !important;
            height: 100vh !important;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
            z-index: 999999 !important;
            display: flex !important;
            flex-direction: column !important;
            overflow-y: auto !important;
            padding: 20px !important;
            box-sizing: border-box !important;
        `;
        
        // 現在のCSVデータを取得
        const currentData = this.getCurrentDataSync();
        
        editorDiv.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <h1 style="color: white; margin: 0; font-size: 2.5em;">BAD END テキスト編集</h1>
                <button onclick="document.getElementById('dynamic-bad-end-editor').remove(); window.game.showTitleScreen();" 
                        style="background: #E74C3C; color: white; padding: 10px 20px; border: none; border-radius: 5px; font-size: 16px; cursor: pointer;">
                    ✖ 閉じる
                </button>
            </div>
            
            <div style="background: rgba(255,255,255,0.95); padding: 30px; border-radius: 15px; margin-bottom: 20px;">
                <div style="display: grid; gap: 20px;">
                    <div>
                        <label style="display: block; font-weight: bold; margin-bottom: 8px; font-size: 16px;">タイトルテキスト:</label>
                        <input type="text" id="dyn-title" value="${currentData.title_text || 'また今度ね♪'}" 
                               style="width: 100%; padding: 12px; font-size: 16px; border: 2px solid #ddd; border-radius: 6px; box-sizing: border-box;">
                    </div>
                    
                    <div>
                        <label style="display: block; font-weight: bold; margin-bottom: 8px; font-size: 16px;">冒頭テキスト:</label>
                        <textarea id="dyn-opening" style="width: 100%; padding: 12px; font-size: 16px; border: 2px solid #ddd; border-radius: 6px; min-height: 80px; box-sizing: border-box;">${currentData.opening_text || '今日はここまでだね♪'}</textarea>
                    </div>
                    
                    <div>
                        <label style="display: block; font-weight: bold; margin-bottom: 8px; font-size: 16px;">美咲のリアクション:</label>
                        <textarea id="dyn-reaction" style="width: 100%; padding: 12px; font-size: 16px; border: 2px solid #ddd; border-radius: 6px; min-height: 80px; box-sizing: border-box;">${currentData.defeat_reaction || 'またじゃんけんしてあげてもいーよー？'}</textarea>
                    </div>
                    
                    <div>
                        <label style="display: block; font-weight: bold; margin-bottom: 8px; font-size: 16px;">美咲のセリフ (特別テキスト):</label>
                        <input type="text" id="dyn-special" value="${currentData.special_text || ''}" 
                               style="width: 100%; padding: 12px; font-size: 16px; border: 2px solid #ddd; border-radius: 6px; box-sizing: border-box;">
                    </div>
                    
                    <div>
                        <label style="display: block; font-weight: bold; margin-bottom: 8px; font-size: 16px;">子供時代の振り返り:</label>
                        <textarea id="dyn-childhood" style="width: 100%; padding: 12px; font-size: 16px; border: 2px solid #ddd; border-radius: 6px; min-height: 80px; box-sizing: border-box;">${currentData.childhood_reflection || ''}</textarea>
                    </div>
                    
                    <div>
                        <label style="display: block; font-weight: bold; margin-bottom: 8px; font-size: 16px;">次回への誘い:</label>
                        <input type="text" id="dyn-invitation" value="${currentData.future_invitation || ''}" 
                               style="width: 100%; padding: 12px; font-size: 16px; border: 2px solid #ddd; border-radius: 6px; box-sizing: border-box;">
                    </div>
                    
                    <div>
                        <label style="display: block; font-weight: bold; margin-bottom: 8px; font-size: 16px;">締めの印象:</label>
                        <textarea id="dyn-impression" style="width: 100%; padding: 12px; font-size: 16px; border: 2px solid #ddd; border-radius: 6px; min-height: 80px; box-sizing: border-box;">${currentData.final_impression || ''}</textarea>
                    </div>
                </div>
                
                <div style="display: flex; gap: 15px; justify-content: center; margin-top: 30px; flex-wrap: wrap;">
                    <button onclick="window.badEndEditor.saveDynamicData()" 
                            style="background: #27AE60; color: white; padding: 15px 25px; border: none; border-radius: 8px; font-size: 16px; cursor: pointer; font-weight: bold;">
                        💾 保存
                    </button>
                    <button onclick="window.badEndEditor.resetDynamicForm()" 
                            style="background: #E74C3C; color: white; padding: 15px 25px; border: none; border-radius: 8px; font-size: 16px; cursor: pointer; font-weight: bold;">
                        🔄 リセット
                    </button>
                    <button onclick="window.badEndEditor.showDynamicPreview()" 
                            style="background: #3498DB; color: white; padding: 15px 25px; border: none; border-radius: 8px; font-size: 16px; cursor: pointer; font-weight: bold;">
                        👁️ プレビュー
                    </button>
                </div>
            </div>
            
            <div id="dynamic-preview" style="display: none; background: rgba(0,0,0,0.8); color: white; padding: 30px; border-radius: 10px; margin-top: 20px;">
                <h3 style="color: #ff6b7d; margin-bottom: 20px; font-size: 1.5em;">プレビュー</h3>
                <div id="dynamic-preview-content" style="white-space: pre-wrap; line-height: 1.8; font-size: 16px;"></div>
            </div>
        `;
        
        // body に追加して確実に表示
        document.body.appendChild(editorDiv);
        
        // グローバルに公開してボタンから呼べるようにする
        window.badEndEditor = this;
        
        console.log('✅ 動的BAD END編集画面を作成しました');
    }

    /**
     * 現在のデータを同期的に取得
     */
    getCurrentDataSync() {
        // ローカルストレージから取得を試行
        const localData = localStorage.getItem('bad_end_csv_data');
        if (localData) {
            try {
                return JSON.parse(localData);
            } catch (error) {
                console.warn('ローカルストレージデータ解析エラー:', error);
            }
        }
        
        // デフォルトデータを返す（不要なテキストを削除）
        return {
            ending_id: 'bad_end',
            ending_name: 'BAD ENDING',
            title_text: 'また今度ね♪',
            special_text: '',
            opening_text: '今日はここまでだね♪',
            defeat_reaction: 'またじゃんけんしてあげてもいーよー？',
            childhood_reflection: '',
            future_invitation: '',
            final_impression: ''
        };
    }

    /**
     * 動的フォームのデータを保存
     */
    saveDynamicData() {
        console.log('💾 動的フォームのデータを保存中...');
        
        const newData = {
            ending_id: 'bad_end',
            ending_name: 'BAD ENDING',
            title_text: document.getElementById('dyn-title').value || 'また今度ね♪',
            special_text: document.getElementById('dyn-special').value || '',
            bg_image: 'bg_night.png',
            bgm_file: 'game_over.mp3',
            cg_image: 'cg_bad.png',
            description: '美咲に5敗した時のエンディング',
            opening_text: document.getElementById('dyn-opening').value || '今日はここまでだね♪',
            defeat_reaction: document.getElementById('dyn-reaction').value || 'またじゃんけんしてあげてもいーよー？',
            childhood_reflection: document.getElementById('dyn-childhood').value || '',
            future_invitation: document.getElementById('dyn-invitation').value || '',
            final_impression: document.getElementById('dyn-impression').value || ''
        };
        
        // ローカルストレージに保存
        localStorage.setItem('bad_end_csv_data', JSON.stringify(newData));
        
        // CSVファイルをダウンロード
        const csvContent = this.createCSVContent(newData);
        this.downloadCSV(csvContent, 'bad_end.csv');
        
        // 成功メッセージ
        alert('保存しました！CSVファイルもダウンロードされます。');
        
        console.log('✅ 動的フォームのデータ保存完了');
    }

    /**
     * 動的フォームをリセット
     */
    resetDynamicForm() {
        document.getElementById('dyn-title').value = 'また今度ね♪';
        document.getElementById('dyn-opening').value = '今日はここまでだね♪';
        document.getElementById('dyn-reaction').value = 'またじゃんけんしてあげてもいーよー？';
        document.getElementById('dyn-special').value = '';
        document.getElementById('dyn-childhood').value = '';
        document.getElementById('dyn-invitation').value = '';
        document.getElementById('dyn-impression').value = '';
        
        alert('シンプルなデフォルト値にリセットしました');
    }

    /**
     * 動的プレビューを表示
     */
    showDynamicPreview() {
        const previewDiv = document.getElementById('dynamic-preview');
        const previewContent = document.getElementById('dynamic-preview-content');
        
        if (previewDiv.style.display === 'none') {
            // プレビューテキストを構築
            const openingText = document.getElementById('dyn-opening').value || '今日はここまでだね♪';
            const defeatReaction = document.getElementById('dyn-reaction').value || 'またじゃんけんしてあげてもいーよー？';
            const specialText = document.getElementById('dyn-special').value || '';
            const childhoodReflection = document.getElementById('dyn-childhood').value || '';
            const futureInvitation = document.getElementById('dyn-invitation').value || '';
            const finalImpression = document.getElementById('dyn-impression').value || '';
            
            let previewText = openingText;
            
            if (defeatReaction) {
                previewText += '\n\n' + defeatReaction;
            }
            
            if (specialText) {
                previewText += '\n\n「' + specialText + '」';
            }
            
            if (childhoodReflection) {
                previewText += '\n\n' + childhoodReflection;
            }
            
            // この固定文言は削除
            // previewText += '\nでも、きっとまたチャンスはあるはず...';
            
            if (futureInvitation) {
                previewText += '\n\n「' + futureInvitation + '」';
            }
            
            if (finalImpression) {
                previewText += '\n\n' + finalImpression;
            }
            
            previewContent.textContent = previewText;
            previewDiv.style.display = 'block';
        } else {
            previewDiv.style.display = 'none';
        }
    }

    /**
     * 編集画面を非表示
     */
    hide() {
        if (!this.isActive) return;
        
        console.log('BAD END編集画面を非表示');
        
        this.editorScreen.classList.remove('active');
        this.isActive = false;
        
        // プレビューを非表示
        this.previewArea.style.display = 'none';
    }

    /**
     * 現在のCSVデータを読み込み
     */
    async loadCurrentData() {
        console.log('📋 bad_end.csvデータを読み込み中...');
        
        // まずローカルストレージから確認
        const localData = localStorage.getItem('bad_end_csv_data');
        if (localData) {
            try {
                this.currentData = JSON.parse(localData);
                console.log('✅ ローカルストレージからデータ読み込み成功:', this.currentData);
                return;
            } catch (error) {
                console.warn('⚠️ ローカルストレージデータの解析に失敗:', error);
            }
        }
        
        // CSVLoaderからデータを取得
        if (this.game.csvLoader) {
            const badEndData = this.game.csvLoader.getTableData('bad_end');
            if (badEndData && badEndData.length > 0) {
                this.currentData = badEndData[0];
                console.log('✅ CSVデータ読み込み成功:', this.currentData);
                return;
            }
        }
        
        // 現在のCSVファイルからの読み込み（直接読み込み）
        try {
            const csvData = await this.loadBadEndCSVDirect();
            if (csvData) {
                this.currentData = csvData;
                console.log('✅ 直接CSVファイルから読み込み成功:', this.currentData);
                return;
            }
        } catch (error) {
            console.warn('⚠️ 直接CSVファイル読み込みに失敗:', error);
        }
        
        // フォールバックデータ（現在のCSVに合わせて更新）
        console.warn('⚠️ CSVデータが見つかりません。現在のCSV構造に合わせたデフォルト値を使用');
        this.currentData = {
            ending_id: 'bad_end',
            ending_name: 'BAD ENDING',
            title_text: 'また今度ね♪',
            special_text: '',
            bg_image: 'bg_night.png',
            bgm_file: 'game_over.mp3',
            cg_image: 'cg_bad.png',
            description: '美咲に5敗した時のエンディング',
            opening_text: '今日はここまでだね♪',
            defeat_reaction: 'またじゃんけんしてあげてもいーよー？',
            childhood_reflection: '',
            future_invitation: '',
            final_impression: ''
        };
    }
    
    /**
     * bad_end.csvを直接読み込み
     */
    async loadBadEndCSVDirect() {
        try {
            const response = await fetch('./assets/data/csv/bad_end.csv');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const csvText = await response.text();
            const lines = csvText.split('\n').filter(line => line.trim());
            
            if (lines.length < 2) {
                throw new Error('CSV file is empty or has insufficient data');
            }
            
            // ヘッダー行を解析
            const headers = lines[0].replace(/^\ufeff/, '').split(',');
            console.log('CSV headers:', headers);
            
            // データ行を解析
            const dataLine = lines[1];
            const values = this.parseCSVLine(dataLine);
            
            // オブジェクトを構築
            const data = {};
            headers.forEach((header, index) => {
                data[header.trim()] = values[index] ? values[index].trim() : '';
            });
            
            console.log('Parsed CSV data:', data);
            return data;
        } catch (error) {
            console.error('CSV直接読み込みエラー:', error);
            return null;
        }
    }
    
    /**
     * CSV行を解析（カンマ区切り、クォート対応）
     */
    parseCSVLine(line) {
        const result = [];
        let current = '';
        let inQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                result.push(current);
                current = '';
            } else {
                current += char;
            }
        }
        
        result.push(current);
        return result;
    }

    /**
     * フォームに現在のデータを反映
     */
    populateForm() {
        if (!this.currentData) return;
        
        this.formElements.title.value = this.currentData.title_text || '';
        this.formElements.opening.value = this.currentData.opening_text || '';
        this.formElements.reaction.value = this.currentData.defeat_reaction || '';
        this.formElements.special.value = this.currentData.special_text || '';
        this.formElements.childhood.value = this.currentData.childhood_reflection || '';
        this.formElements.invitation.value = this.currentData.future_invitation || '';
        this.formElements.impression.value = this.currentData.final_impression || '';
    }

    /**
     * BAD ENDデータを保存
     */
    async saveBadEndData() {
        console.log('💾 BAD ENDデータを保存中...');
        
        // フォームからデータを取得
        const newData = {
            ending_id: 'bad_end',
            ending_name: 'BAD ENDING',
            title_text: this.formElements.title.value || 'また今度ね♪',
            special_text: this.formElements.special.value || '',
            bg_image: 'bg_night.png',
            bgm_file: 'game_over.mp3',
            cg_image: 'cg_bad.png',
            description: '美咲に5敗した時のエンディング',
            opening_text: this.formElements.opening.value || '今日はここまでだね♪',
            defeat_reaction: this.formElements.reaction.value || 'またじゃんけんしてあげてもいーよー？',
            childhood_reflection: this.formElements.childhood.value || '',
            future_invitation: this.formElements.invitation.value || '',
            final_impression: this.formElements.impression.value || ''
        };
        
        // CSVファイルを更新
        const csvContent = this.createCSVContent(newData);
        
        try {
            // ローカルストレージに保存（ブラウザ環境での代替保存）
            localStorage.setItem('bad_end_csv_data', JSON.stringify(newData));
            console.log('💾 ローカルストレージに保存しました');
            
            // CSVLoaderのメモリ上のデータを直接更新
            if (this.game.csvLoader) {
                if (!this.game.csvLoader.csvData['bad_end']) {
                    this.game.csvLoader.csvData['bad_end'] = [];
                }
                this.game.csvLoader.csvData['bad_end'] = [newData];
                console.log('📝 CSVLoaderのメモリデータを更新');
            }
            
            // ダウンロード可能なCSVファイルを生成
            this.downloadCSV(csvContent, 'bad_end.csv');
            
            // 成功メッセージを表示
            this.showSaveMessage('保存しました！CSVファイルをダウンロードしてください');
            
            // 現在のデータを更新
            this.currentData = newData;
            
            // 効果音
            this.game.audioManager.playSE('se_click.mp3', 0.8);
            
        } catch (error) {
            console.error('保存エラー:', error);
            this.showSaveMessage('保存に失敗しました', true);
        }
    }

    /**
     * CSVファイルをダウンロード
     */
    downloadCSV(content, filename) {
        const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        console.log(`📥 ${filename}をダウンロード`);
    }

    /**
     * CSVコンテンツを作成
     */
    createCSVContent(data) {
        const headers = [
            'ending_id', 'ending_name', 'title_text', 'special_text',
            'bg_image', 'bgm_file', 'cg_image', 'description',
            'opening_text', 'defeat_reaction', 'childhood_reflection',
            'future_invitation', 'final_impression'
        ];
        
        const values = headers.map(key => {
            const value = data[key] || '';
            // カンマや改行を含む場合はクォートで囲む
            if (value.includes(',') || value.includes('\n') || value.includes('"')) {
                return `"${value.replace(/"/g, '""')}"`;
            }
            return value;
        });
        
        return `\ufeff${headers.join(',')}\n${values.join(',')}`;
    }

    /**
     * デフォルト値にリセット
     */
    resetToDefault() {
        console.log('🔄 デフォルト値にリセット');
        
        const defaultData = {
            title_text: '完敗...また今度ね',
            opening_text: '今日はここまでだね♪',
            defeat_reaction: 'またじゃんけんしてあげてもいーよー？',
            special_text: '',
            childhood_reflection: '',
            future_invitation: '',
            final_impression: ''
        };
        
        // フォームに反映
        this.formElements.title.value = defaultData.title_text;
        this.formElements.opening.value = defaultData.opening_text;
        this.formElements.reaction.value = defaultData.defeat_reaction;
        this.formElements.special.value = defaultData.special_text;
        this.formElements.childhood.value = defaultData.childhood_reflection;
        this.formElements.invitation.value = defaultData.future_invitation;
        this.formElements.impression.value = defaultData.final_impression;
        
        // 効果音
        this.game.audioManager.playSE('se_click.mp3', 0.6);
        
        this.showSaveMessage('デフォルト値にリセットしました');
    }

    /**
     * プレビューの表示/非表示を切り替え
     */
    togglePreview() {
        if (this.previewArea.style.display === 'none' || !this.previewArea.style.display) {
            this.showPreview();
        } else {
            this.hidePreview();
        }
    }

    /**
     * プレビューを表示
     */
    showPreview() {
        console.log('👁️ プレビュー表示');
        
        // フォームからデータを取得
        const openingText = this.formElements.opening.value || '今日はここまでだね♪';
        const defeatReaction = this.formElements.reaction.value || 'またじゃんけんしてあげてもいーよー？';
        const specialText = this.formElements.special.value || '';
        const childhoodReflection = this.formElements.childhood.value || '';
        const futureInvitation = this.formElements.invitation.value || '';
        const finalImpression = this.formElements.impression.value || '';
        
        // プレビューテキストを構築
        let previewText = openingText;
        
        if (defeatReaction) {
            previewText += '\n\n' + defeatReaction;
        }
        
        if (specialText) {
            previewText += '\n\n「' + specialText + '」';
        }
        
        if (childhoodReflection) {
            previewText += '\n\n' + childhoodReflection;
        }
        
        previewText += '\nでも、きっとまたチャンスはあるはず...';
        
        if (futureInvitation) {
            previewText += '\n\n「' + futureInvitation + '」';
        }
        
        if (finalImpression) {
            previewText += '\n\n' + finalImpression;
        }
        
        // プレビューエリアに表示
        this.previewContent.textContent = previewText;
        this.previewArea.style.display = 'block';
        
        // 効果音
        this.game.audioManager.playSE('se_click.mp3', 0.5);
    }

    /**
     * プレビューを非表示
     */
    hidePreview() {
        this.previewArea.style.display = 'none';
    }

    /**
     * 保存メッセージを表示
     */
    showSaveMessage(message, isError = false) {
        const messageDiv = document.createElement('div');
        messageDiv.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: ${isError ? '#E74C3C' : '#27AE60'};
            color: white;
            padding: 20px 40px;
            border-radius: 10px;
            font-size: 18px;
            font-weight: bold;
            z-index: 1000;
            animation: fadeInOut 2s ease;
        `;
        messageDiv.textContent = message;
        
        // アニメーションスタイルを追加
        const style = document.createElement('style');
        style.textContent = `
            @keyframes fadeInOut {
                0% { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
                20% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
                80% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
                100% { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
            }
        `;
        document.head.appendChild(style);
        
        document.body.appendChild(messageDiv);
        
        // 2秒後に削除
        setTimeout(() => {
            messageDiv.remove();
            style.remove();
        }, 2000);
    }
    
    /**
     * CSVデータを再読み込み
     */
    async reloadCSVData() {
        console.log('🔄 CSVデータを再読み込み中...');
        
        try {
            // ローカルストレージをクリア
            localStorage.removeItem('bad_end_csv_data');
            
            // CSVLoaderのキャッシュをクリア
            if (this.game.csvLoader && this.game.csvLoader.csvData['bad_end']) {
                delete this.game.csvLoader.csvData['bad_end'];
            }
            
            // データを再読み込み
            await this.loadCurrentData();
            
            // フォームに反映
            this.populateForm();
            
            // プレビューを非表示
            this.hidePreview();
            
            this.showSaveMessage('CSVデータを再読み込みしました！');
            
        } catch (error) {
            console.error('CSV再読み込みエラー:', error);
            this.showSaveMessage('CSV再読み込みに失敗しました', true);
        }
    }

    /**
     * 現在の状態を取得（セーブ用）
     * @returns {Object} 状態オブジェクト
     */
    getState() {
        return {
            isActive: this.isActive,
            currentData: this.currentData
        };
    }

    /**
     * 状態を復元（ロード用）
     * @param {Object} state - 状態オブジェクト
     */
    setState(state) {
        this.isActive = state.isActive || false;
        this.currentData = state.currentData || null;
    }

    /**
     * シーンの更新
     */
    update() {
        if (!this.isActive) return;
    }

    /**
     * リソースをクリーンアップ
     */
    cleanup() {
        console.log('BadEndEditorScene cleanup');
    }
}

// グローバルに公開
window.BadEndEditorScene = BadEndEditorScene;