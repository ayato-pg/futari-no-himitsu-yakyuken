/**
 * GameOverEditorScene.js
 * ゲーム終了画面とエンディングトーク用CSV編集システム
 */

class GameOverEditorScene {
    constructor(gameController) {
        this.game = gameController;
        this.isActive = false;
        
        // 編集対象データ
        this.gameOverScreens = [];
        this.endingDialogues = [];
        this.selectedScreenId = null;
        this.selectedDialogueId = null;
        
        console.log('GameOverEditorScene初期化完了');
    }
    
    /**
     * エディター画面を表示
     */
    async show() {
        if (this.isActive) return;
        
        console.log('🛠️ ゲーム終了画面エディターを表示');
        
        // CSVデータを読み込み
        await this.loadCSVData();
        
        // エディター画面を作成
        this.createEditorInterface();
        
        this.isActive = true;
    }
    
    /**
     * CSVデータを読み込み
     */
    async loadCSVData() {
        try {
            // ゲーム終了画面データを読み込み
            const gameOverData = this.game.csvLoader.getData('game_over_screens');
            if (gameOverData && Array.isArray(gameOverData)) {
                this.gameOverScreens = gameOverData;
                console.log(`📊 ゲーム終了画面データ読み込み: ${this.gameOverScreens.length}件`);
            }
            
            // エンディングダイアログデータを読み込み
            const dialogueData = this.game.csvLoader.getData('ending_dialogues');
            if (dialogueData && Array.isArray(dialogueData)) {
                this.endingDialogues = dialogueData;
                console.log(`💬 エンディングダイアログデータ読み込み: ${this.endingDialogues.length}件`);
            }
            
        } catch (error) {
            console.error('❌ CSVデータ読み込みエラー:', error);
        }
    }
    
    /**
     * エディター画面のインターフェースを作成
     */
    createEditorInterface() {
        // 既存のエディター画面があれば削除
        const existingEditor = document.getElementById('game-over-editor');
        if (existingEditor) {
            existingEditor.remove();
        }
        
        // エディター画面のHTML構造を作成
        const editorHTML = `
            <div id="game-over-editor" style="
                position: fixed;
                top: 0;
                left: 0;
                width: 100vw;
                height: 100vh;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                z-index: 10000;
                overflow-y: auto;
                padding: 20px;
                box-sizing: border-box;
            ">
                <div style="max-width: 1200px; margin: 0 auto; background: rgba(255,255,255,0.95); border-radius: 15px; padding: 30px;">
                    
                    <!-- ヘッダー -->
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 3px solid #ff6b7d;">
                        <h1 style="color: #2c3e50; margin: 0; font-size: 2rem; font-weight: bold;">
                            🛠️ ゲーム終了画面エディター
                        </h1>
                        <button onclick="document.getElementById('game-over-editor').remove()" 
                                style="background: #e74c3c; color: white; border: none; border-radius: 50%; width: 40px; height: 40px; font-size: 1.2rem; cursor: pointer; transition: all 0.3s;">
                            ✕
                        </button>
                    </div>
                    
                    <!-- タブメニュー -->
                    <div id="editor-tabs" style="margin-bottom: 30px;">
                        <button class="editor-tab active" onclick="showEditorTab('game-over-tab')" 
                                style="background: #3498db; color: white; border: none; padding: 12px 24px; margin-right: 10px; border-radius: 8px; cursor: pointer; font-weight: bold;">
                            ゲーム終了画面
                        </button>
                        <button class="editor-tab" onclick="showEditorTab('ending-dialogue-tab')" 
                                style="background: #95a5a6; color: white; border: none; padding: 12px 24px; margin-right: 10px; border-radius: 8px; cursor: pointer; font-weight: bold;">
                            エンディングトーク
                        </button>
                        <button class="editor-tab" onclick="showEditorTab('preview-tab')" 
                                style="background: #e67e22; color: white; border: none; padding: 12px 24px; border-radius: 8px; cursor: pointer; font-weight: bold;">
                            プレビュー
                        </button>
                    </div>
                    
                    <!-- ゲーム終了画面編集タブ -->
                    <div id="game-over-tab" class="editor-content" style="display: block;">
                        <h2 style="color: #2c3e50; margin-bottom: 20px;">📺 ゲーム終了画面編集</h2>
                        <div id="game-over-list" style="margin-bottom: 20px;">
                            ${this.generateGameOverList()}
                        </div>
                        <div id="game-over-form" style="display: none;">
                            ${this.generateGameOverForm()}
                        </div>
                    </div>
                    
                    <!-- エンディングトーク編集タブ -->
                    <div id="ending-dialogue-tab" class="editor-content" style="display: none;">
                        <h2 style="color: #2c3e50; margin-bottom: 20px;">💬 エンディングトーク編集</h2>
                        <div id="ending-dialogue-list" style="margin-bottom: 20px;">
                            ${this.generateEndingDialogueList()}
                        </div>
                        <div id="ending-dialogue-form" style="display: none;">
                            ${this.generateEndingDialogueForm()}
                        </div>
                    </div>
                    
                    <!-- プレビュータブ -->
                    <div id="preview-tab" class="editor-content" style="display: none;">
                        <h2 style="color: #2c3e50; margin-bottom: 20px;">👁️ プレビュー</h2>
                        <div id="preview-content" style="background: #34495e; color: white; padding: 20px; border-radius: 10px; min-height: 300px;">
                            プレビュー内容がここに表示されます
                        </div>
                    </div>
                    
                    <!-- アクションボタン -->
                    <div style="margin-top: 30px; text-align: center;">
                        <button onclick="saveAllCSVData()" 
                                style="background: #27ae60; color: white; border: none; padding: 15px 30px; border-radius: 8px; font-size: 1.1rem; margin-right: 15px; cursor: pointer; font-weight: bold;">
                            💾 すべて保存
                        </button>
                        <button onclick="exportCSVData()" 
                                style="background: #f39c12; color: white; border: none; padding: 15px 30px; border-radius: 8px; font-size: 1.1rem; margin-right: 15px; cursor: pointer; font-weight: bold;">
                            📤 CSV出力
                        </button>
                        <button onclick="document.getElementById('game-over-editor').remove()" 
                                style="background: #95a5a6; color: white; border: none; padding: 15px 30px; border-radius: 8px; font-size: 1.1rem; cursor: pointer; font-weight: bold;">
                            ❌ 閉じる
                        </button>
                    </div>
                    
                </div>
            </div>
        `;
        
        // エディター画面をDOMに追加
        document.body.insertAdjacentHTML('beforeend', editorHTML);
        
        // グローバル関数を定義
        this.setupGlobalFunctions();
        
        console.log('✅ ゲーム終了画面エディターUI作成完了');
    }
    
    /**
     * ゲーム終了画面リストを生成
     */
    generateGameOverList() {
        if (!this.gameOverScreens || this.gameOverScreens.length === 0) {
            return '<p style="color: #e74c3c; font-weight: bold;">📭 ゲーム終了画面データがありません</p>';
        }
        
        let listHTML = '<div style="display: grid; gap: 15px;">';
        
        this.gameOverScreens.forEach((screen, index) => {
            listHTML += `
                <div style="background: #ecf0f1; padding: 20px; border-radius: 10px; border-left: 5px solid #3498db;">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <h3 style="margin: 0; color: #2c3e50;">${screen.title_text || 'タイトル未設定'}</h3>
                            <p style="margin: 5px 0; color: #7f8c8d;">${screen.message_text || 'メッセージ未設定'}</p>
                            <small style="color: #95a5a6;">ID: ${screen.screen_id} | タイプ: ${screen.screen_type}</small>
                        </div>
                        <div>
                            <button onclick="editGameOverScreen('${screen.screen_id}')" 
                                    style="background: #3498db; color: white; border: none; padding: 8px 16px; border-radius: 5px; margin-right: 10px; cursor: pointer;">
                                ✏️ 編集
                            </button>
                            <button onclick="deleteGameOverScreen('${screen.screen_id}')" 
                                    style="background: #e74c3c; color: white; border: none; padding: 8px 16px; border-radius: 5px; cursor: pointer;">
                                🗑️ 削除
                            </button>
                        </div>
                    </div>
                </div>
            `;
        });
        
        listHTML += '</div>';
        listHTML += `
            <div style="margin-top: 20px; text-align: center;">
                <button onclick="addNewGameOverScreen()" 
                        style="background: #27ae60; color: white; border: none; padding: 12px 24px; border-radius: 8px; cursor: pointer; font-weight: bold;">
                    ➕ 新しいゲーム終了画面を追加
                </button>
            </div>
        `;
        
        return listHTML;
    }
    
    /**
     * ゲーム終了画面編集フォームを生成
     */
    generateGameOverForm() {
        return `
            <div style="background: #ecf0f1; padding: 25px; border-radius: 10px;">
                <h3 style="color: #2c3e50; margin-bottom: 20px;">📝 ゲーム終了画面編集フォーム</h3>
                
                <div style="display: grid; gap: 15px;">
                    <div>
                        <label style="display: block; font-weight: bold; color: #2c3e50; margin-bottom: 5px;">画面ID:</label>
                        <input type="text" id="screen_id" style="width: 100%; padding: 10px; border: 1px solid #bdc3c7; border-radius: 5px;">
                    </div>
                    
                    <div>
                        <label style="display: block; font-weight: bold; color: #2c3e50; margin-bottom: 5px;">画面タイプ:</label>
                        <select id="screen_type" style="width: 100%; padding: 10px; border: 1px solid #bdc3c7; border-radius: 5px;">
                            <option value="victory">勝利</option>
                            <option value="defeat">敗北</option>
                            <option value="draw">引き分け</option>
                        </select>
                    </div>
                    
                    <div>
                        <label style="display: block; font-weight: bold; color: #2c3e50; margin-bottom: 5px;">タイトルテキスト:</label>
                        <input type="text" id="title_text" style="width: 100%; padding: 10px; border: 1px solid #bdc3c7; border-radius: 5px;">
                    </div>
                    
                    <div>
                        <label style="display: block; font-weight: bold; color: #2c3e50; margin-bottom: 5px;">メッセージテキスト:</label>
                        <textarea id="message_text" rows="3" style="width: 100%; padding: 10px; border: 1px solid #bdc3c7; border-radius: 5px; resize: vertical;"></textarea>
                    </div>
                    
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                        <div>
                            <label style="display: block; font-weight: bold; color: #2c3e50; margin-bottom: 5px;">ボタン1テキスト:</label>
                            <input type="text" id="button_1_text" style="width: 100%; padding: 10px; border: 1px solid #bdc3c7; border-radius: 5px;">
                        </div>
                        <div>
                            <label style="display: block; font-weight: bold; color: #2c3e50; margin-bottom: 5px;">ボタン1アクション:</label>
                            <input type="text" id="button_1_action" style="width: 100%; padding: 10px; border: 1px solid #bdc3c7; border-radius: 5px;">
                        </div>
                    </div>
                    
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                        <div>
                            <label style="display: block; font-weight: bold; color: #2c3e50; margin-bottom: 5px;">ボタン2テキスト:</label>
                            <input type="text" id="button_2_text" style="width: 100%; padding: 10px; border: 1px solid #bdc3c7; border-radius: 5px;">
                        </div>
                        <div>
                            <label style="display: block; font-weight: bold; color: #2c3e50; margin-bottom: 5px;">ボタン2アクション:</label>
                            <input type="text" id="button_2_action" style="width: 100%; padding: 10px; border: 1px solid #bdc3c7; border-radius: 5px;">
                        </div>
                    </div>
                    
                    <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px;">
                        <div>
                            <label style="display: block; font-weight: bold; color: #2c3e50; margin-bottom: 5px;">背景画像:</label>
                            <input type="text" id="bg_image" style="width: 100%; padding: 10px; border: 1px solid #bdc3c7; border-radius: 5px;">
                        </div>
                        <div>
                            <label style="display: block; font-weight: bold; color: #2c3e50; margin-bottom: 5px;">BGMファイル:</label>
                            <input type="text" id="bgm_file" style="width: 100%; padding: 10px; border: 1px solid #bdc3c7; border-radius: 5px;">
                        </div>
                        <div>
                            <label style="display: block; font-weight: bold; color: #2c3e50; margin-bottom: 5px;">キャラクター画像:</label>
                            <input type="text" id="character_sprite" style="width: 100%; padding: 10px; border: 1px solid #bdc3c7; border-radius: 5px;">
                        </div>
                    </div>
                </div>
                
                <div style="margin-top: 25px; text-align: center;">
                    <button onclick="saveGameOverScreen()" 
                            style="background: #27ae60; color: white; border: none; padding: 12px 24px; border-radius: 8px; margin-right: 15px; cursor: pointer; font-weight: bold;">
                        💾 保存
                    </button>
                    <button onclick="cancelGameOverEdit()" 
                            style="background: #95a5a6; color: white; border: none; padding: 12px 24px; border-radius: 8px; cursor: pointer; font-weight: bold;">
                        ❌ キャンセル
                    </button>
                </div>
            </div>
        `;
    }
    
    /**
     * エンディングダイアログリストを生成
     */
    generateEndingDialogueList() {
        if (!this.endingDialogues || this.endingDialogues.length === 0) {
            return '<p style="color: #e74c3c; font-weight: bold;">📭 エンディングダイアログデータがありません</p>';
        }
        
        let listHTML = '<div style="display: grid; gap: 15px;">';
        
        this.endingDialogues.forEach((dialogue, index) => {
            listHTML += `
                <div style="background: #e8f5e8; padding: 20px; border-radius: 10px; border-left: 5px solid #27ae60;">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <h3 style="margin: 0; color: #2c3e50;">${dialogue.speaker || '話者未設定'}</h3>
                            <p style="margin: 5px 0; color: #7f8c8d;">${(dialogue.dialogue_text || 'テキスト未設定').substring(0, 50)}...</p>
                            <small style="color: #95a5a6;">ID: ${dialogue.dialogue_id} | タイプ: ${dialogue.ending_type}</small>
                        </div>
                        <div>
                            <button onclick="editEndingDialogue('${dialogue.dialogue_id}')" 
                                    style="background: #27ae60; color: white; border: none; padding: 8px 16px; border-radius: 5px; margin-right: 10px; cursor: pointer;">
                                ✏️ 編集
                            </button>
                            <button onclick="deleteEndingDialogue('${dialogue.dialogue_id}')" 
                                    style="background: #e74c3c; color: white; border: none; padding: 8px 16px; border-radius: 5px; cursor: pointer;">
                                🗑️ 削除
                            </button>
                        </div>
                    </div>
                </div>
            `;
        });
        
        listHTML += '</div>';
        listHTML += `
            <div style="margin-top: 20px; text-align: center;">
                <button onclick="addNewEndingDialogue()" 
                        style="background: #e67e22; color: white; border: none; padding: 12px 24px; border-radius: 8px; cursor: pointer; font-weight: bold;">
                    ➕ 新しいエンディングトークを追加
                </button>
            </div>
        `;
        
        return listHTML;
    }
    
    /**
     * エンディングダイアログ編集フォームを生成
     */
    generateEndingDialogueForm() {
        return `
            <div style="background: #e8f5e8; padding: 25px; border-radius: 10px;">
                <h3 style="color: #2c3e50; margin-bottom: 20px;">💬 エンディングトーク編集フォーム</h3>
                
                <div style="display: grid; gap: 15px;">
                    <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px;">
                        <div>
                            <label style="display: block; font-weight: bold; color: #2c3e50; margin-bottom: 5px;">ダイアログID:</label>
                            <input type="text" id="dialogue_id" style="width: 100%; padding: 10px; border: 1px solid #bdc3c7; border-radius: 5px;">
                        </div>
                        <div>
                            <label style="display: block; font-weight: bold; color: #2c3e50; margin-bottom: 5px;">エンディングタイプ:</label>
                            <select id="ending_type" style="width: 100%; padding: 10px; border: 1px solid #bdc3c7; border-radius: 5px;">
                                <option value="victory">勝利</option>
                                <option value="defeat">敗北</option>
                                <option value="draw">引き分け</option>
                            </select>
                        </div>
                        <div>
                            <label style="display: block; font-weight: bold; color: #2c3e50; margin-bottom: 5px;">話者:</label>
                            <input type="text" id="speaker" style="width: 100%; padding: 10px; border: 1px solid #bdc3c7; border-radius: 5px;">
                        </div>
                    </div>
                    
                    <div>
                        <label style="display: block; font-weight: bold; color: #2c3e50; margin-bottom: 5px;">ダイアログテキスト:</label>
                        <textarea id="dialogue_text" rows="4" style="width: 100%; padding: 10px; border: 1px solid #bdc3c7; border-radius: 5px; resize: vertical;"></textarea>
                    </div>
                    
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                        <div>
                            <label style="display: block; font-weight: bold; color: #2c3e50; margin-bottom: 5px;">キャラクター感情:</label>
                            <select id="character_emotion" style="width: 100%; padding: 10px; border: 1px solid #bdc3c7; border-radius: 5px;">
                                <option value="neutral">通常</option>
                                <option value="happy">嬉しい</option>
                                <option value="sad">悲しい</option>
                                <option value="shy">恥ずかしい</option>
                                <option value="surprised">驚き</option>
                                <option value="angry">怒り</option>
                                <option value="teasing">からかい</option>
                                <option value="gentle">優しい</option>
                                <option value="hopeful">希望</option>
                            </select>
                        </div>
                        <div>
                            <label style="display: block; font-weight: bold; color: #2c3e50; margin-bottom: 5px;">スプライトファイル:</label>
                            <input type="text" id="sprite_file" style="width: 100%; padding: 10px; border: 1px solid #bdc3c7; border-radius: 5px;">
                        </div>
                    </div>
                    
                    <div>
                        <label style="display: block; font-weight: bold; color: #2c3e50; margin-bottom: 5px;">背景画像:</label>
                        <input type="text" id="background_image" style="width: 100%; padding: 10px; border: 1px solid #bdc3c7; border-radius: 5px;">
                    </div>
                    
                    <!-- 選択肢 -->
                    <h4 style="color: #2c3e50; margin: 20px 0 10px 0; border-bottom: 2px solid #27ae60; padding-bottom: 5px;">選択肢設定</h4>
                    
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                        <div>
                            <label style="display: block; font-weight: bold; color: #2c3e50; margin-bottom: 5px;">選択肢1テキスト:</label>
                            <input type="text" id="choice_1_text" style="width: 100%; padding: 10px; border: 1px solid #bdc3c7; border-radius: 5px;">
                        </div>
                        <div>
                            <label style="display: block; font-weight: bold; color: #2c3e50; margin-bottom: 5px;">選択肢1アクション:</label>
                            <input type="text" id="choice_1_action" style="width: 100%; padding: 10px; border: 1px solid #bdc3c7; border-radius: 5px;">
                        </div>
                    </div>
                    
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                        <div>
                            <label style="display: block; font-weight: bold; color: #2c3e50; margin-bottom: 5px;">選択肢2テキスト:</label>
                            <input type="text" id="choice_2_text" style="width: 100%; padding: 10px; border: 1px solid #bdc3c7; border-radius: 5px;">
                        </div>
                        <div>
                            <label style="display: block; font-weight: bold; color: #2c3e50; margin-bottom: 5px;">選択肢2アクション:</label>
                            <input type="text" id="choice_2_action" style="width: 100%; padding: 10px; border: 1px solid #bdc3c7; border-radius: 5px;">
                        </div>
                    </div>
                    
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                        <div>
                            <label style="display: block; font-weight: bold; color: #2c3e50; margin-bottom: 5px;">選択肢3テキスト:</label>
                            <input type="text" id="choice_3_text" style="width: 100%; padding: 10px; border: 1px solid #bdc3c7; border-radius: 5px;">
                        </div>
                        <div>
                            <label style="display: block; font-weight: bold; color: #2c3e50; margin-bottom: 5px;">選択肢3アクション:</label>
                            <input type="text" id="choice_3_action" style="width: 100%; padding: 10px; border: 1px solid #bdc3c7; border-radius: 5px;">
                        </div>
                    </div>
                </div>
                
                <div style="margin-top: 25px; text-align: center;">
                    <button onclick="saveEndingDialogue()" 
                            style="background: #27ae60; color: white; border: none; padding: 12px 24px; border-radius: 8px; margin-right: 15px; cursor: pointer; font-weight: bold;">
                        💾 保存
                    </button>
                    <button onclick="cancelEndingDialogueEdit()" 
                            style="background: #95a5a6; color: white; border: none; padding: 12px 24px; border-radius: 8px; cursor: pointer; font-weight: bold;">
                        ❌ キャンセル
                    </button>
                </div>
            </div>
        `;
    }
    
    /**
     * グローバル関数を設定
     */
    setupGlobalFunctions() {
        // タブ切り替え
        window.showEditorTab = (tabId) => {
            // すべてのタブコンテンツを隠す
            const contents = document.querySelectorAll('.editor-content');
            contents.forEach(content => content.style.display = 'none');
            
            // すべてのタブボタンを非アクティブに
            const tabs = document.querySelectorAll('.editor-tab');
            tabs.forEach(tab => {
                tab.style.background = '#95a5a6';
                tab.classList.remove('active');
            });
            
            // 選択されたタブを表示
            document.getElementById(tabId).style.display = 'block';
            
            // アクティブタブのスタイルを適用
            const activeTab = event.target;
            activeTab.style.background = '#3498db';
            activeTab.classList.add('active');
        };
        
        // ゲーム終了画面編集関数
        window.editGameOverScreen = (screenId) => {
            this.selectedScreenId = screenId;
            const screen = this.gameOverScreens.find(s => s.screen_id === screenId);
            
            if (screen) {
                // フォームに既存データを入力
                document.getElementById('screen_id').value = screen.screen_id || '';
                document.getElementById('screen_type').value = screen.screen_type || 'victory';
                document.getElementById('title_text').value = screen.title_text || '';
                document.getElementById('message_text').value = screen.message_text || '';
                document.getElementById('button_1_text').value = screen.button_1_text || '';
                document.getElementById('button_1_action').value = screen.button_1_action || '';
                document.getElementById('button_2_text').value = screen.button_2_text || '';
                document.getElementById('button_2_action').value = screen.button_2_action || '';
                document.getElementById('bg_image').value = screen.bg_image || '';
                document.getElementById('bgm_file').value = screen.bgm_file || '';
                document.getElementById('character_sprite').value = screen.character_sprite || '';
                
                // リストを隠してフォームを表示
                document.getElementById('game-over-list').style.display = 'none';
                document.getElementById('game-over-form').style.display = 'block';
                
                console.log(`✏️ ゲーム終了画面編集開始: ${screenId}`);
            }
        };
        
        window.addNewGameOverScreen = () => {
            this.selectedScreenId = null;
            
            // フォームをクリア
            document.getElementById('screen_id').value = '';
            document.getElementById('screen_type').value = 'victory';
            document.getElementById('title_text').value = '';
            document.getElementById('message_text').value = '';
            document.getElementById('button_1_text').value = '';
            document.getElementById('button_1_action').value = '';
            document.getElementById('button_2_text').value = '';
            document.getElementById('button_2_action').value = '';
            document.getElementById('bg_image').value = '';
            document.getElementById('bgm_file').value = '';
            document.getElementById('character_sprite').value = '';
            
            // リストを隠してフォームを表示
            document.getElementById('game-over-list').style.display = 'none';
            document.getElementById('game-over-form').style.display = 'block';
            
            console.log('➕ 新しいゲーム終了画面追加開始');
        };
        
        window.saveGameOverScreen = () => {
            const screenData = {
                screen_id: document.getElementById('screen_id').value,
                screen_type: document.getElementById('screen_type').value,
                title_text: document.getElementById('title_text').value,
                message_text: document.getElementById('message_text').value,
                button_1_text: document.getElementById('button_1_text').value,
                button_1_action: document.getElementById('button_1_action').value,
                button_2_text: document.getElementById('button_2_text').value,
                button_2_action: document.getElementById('button_2_action').value,
                bg_image: document.getElementById('bg_image').value,
                bgm_file: document.getElementById('bgm_file').value,
                character_sprite: document.getElementById('character_sprite').value
            };
            
            if (!screenData.screen_id) {
                alert('画面IDを入力してください。');
                return;
            }
            
            if (this.selectedScreenId) {
                // 既存データを更新
                const index = this.gameOverScreens.findIndex(s => s.screen_id === this.selectedScreenId);
                if (index !== -1) {
                    this.gameOverScreens[index] = screenData;
                    console.log(`✅ ゲーム終了画面更新: ${screenData.screen_id}`);
                }
            } else {
                // 新規追加
                this.gameOverScreens.push(screenData);
                console.log(`➕ ゲーム終了画面追加: ${screenData.screen_id}`);
            }
            
            // リストを更新
            this.refreshGameOverList();
            
            // フォームを隠してリストを表示
            document.getElementById('game-over-form').style.display = 'none';
            document.getElementById('game-over-list').style.display = 'block';
            
            alert('保存しました！');
        };
        
        window.cancelGameOverEdit = () => {
            document.getElementById('game-over-form').style.display = 'none';
            document.getElementById('game-over-list').style.display = 'block';
        };
        
        window.deleteGameOverScreen = (screenId) => {
            if (confirm(`ゲーム終了画面「${screenId}」を削除しますか？`)) {
                this.gameOverScreens = this.gameOverScreens.filter(s => s.screen_id !== screenId);
                this.refreshGameOverList();
                console.log(`🗑️ ゲーム終了画面削除: ${screenId}`);
            }
        };
        
        // エンディングダイアログ編集関数（類似の構造）
        window.editEndingDialogue = (dialogueId) => {
            this.selectedDialogueId = dialogueId;
            const dialogue = this.endingDialogues.find(d => d.dialogue_id === dialogueId);
            
            if (dialogue) {
                // フォームに既存データを入力
                document.getElementById('dialogue_id').value = dialogue.dialogue_id || '';
                document.getElementById('ending_type').value = dialogue.ending_type || 'victory';
                document.getElementById('speaker').value = dialogue.speaker || '';
                document.getElementById('dialogue_text').value = dialogue.dialogue_text || '';
                document.getElementById('character_emotion').value = dialogue.character_emotion || 'neutral';
                document.getElementById('choice_1_text').value = dialogue.choice_1_text || '';
                document.getElementById('choice_1_action').value = dialogue.choice_1_action || '';
                document.getElementById('choice_2_text').value = dialogue.choice_2_text || '';
                document.getElementById('choice_2_action').value = dialogue.choice_2_action || '';
                document.getElementById('choice_3_text').value = dialogue.choice_3_text || '';
                document.getElementById('choice_3_action').value = dialogue.choice_3_action || '';
                document.getElementById('sprite_file').value = dialogue.sprite_file || '';
                document.getElementById('background_image').value = dialogue.background_image || '';
                
                // リストを隠してフォームを表示
                document.getElementById('ending-dialogue-list').style.display = 'none';
                document.getElementById('ending-dialogue-form').style.display = 'block';
                
                console.log(`✏️ エンディングダイアログ編集開始: ${dialogueId}`);
            }
        };
        
        window.addNewEndingDialogue = () => {
            this.selectedDialogueId = null;
            
            // フォームをクリア
            document.getElementById('dialogue_id').value = '';
            document.getElementById('ending_type').value = 'victory';
            document.getElementById('speaker').value = '';
            document.getElementById('dialogue_text').value = '';
            document.getElementById('character_emotion').value = 'neutral';
            document.getElementById('choice_1_text').value = '';
            document.getElementById('choice_1_action').value = '';
            document.getElementById('choice_2_text').value = '';
            document.getElementById('choice_2_action').value = '';
            document.getElementById('choice_3_text').value = '';
            document.getElementById('choice_3_action').value = '';
            document.getElementById('sprite_file').value = '';
            document.getElementById('background_image').value = '';
            
            // リストを隠してフォームを表示
            document.getElementById('ending-dialogue-list').style.display = 'none';
            document.getElementById('ending-dialogue-form').style.display = 'block';
            
            console.log('➕ 新しいエンディングダイアログ追加開始');
        };
        
        window.saveEndingDialogue = () => {
            const dialogueData = {
                dialogue_id: document.getElementById('dialogue_id').value,
                ending_type: document.getElementById('ending_type').value,
                speaker: document.getElementById('speaker').value,
                dialogue_text: document.getElementById('dialogue_text').value,
                character_emotion: document.getElementById('character_emotion').value,
                choice_1_text: document.getElementById('choice_1_text').value,
                choice_1_action: document.getElementById('choice_1_action').value,
                choice_2_text: document.getElementById('choice_2_text').value,
                choice_2_action: document.getElementById('choice_2_action').value,
                choice_3_text: document.getElementById('choice_3_text').value,
                choice_3_action: document.getElementById('choice_3_action').value,
                sprite_file: document.getElementById('sprite_file').value,
                background_image: document.getElementById('background_image').value
            };
            
            if (!dialogueData.dialogue_id) {
                alert('ダイアログIDを入力してください。');
                return;
            }
            
            if (this.selectedDialogueId) {
                // 既存データを更新
                const index = this.endingDialogues.findIndex(d => d.dialogue_id === this.selectedDialogueId);
                if (index !== -1) {
                    this.endingDialogues[index] = dialogueData;
                    console.log(`✅ エンディングダイアログ更新: ${dialogueData.dialogue_id}`);
                }
            } else {
                // 新規追加
                this.endingDialogues.push(dialogueData);
                console.log(`➕ エンディングダイアログ追加: ${dialogueData.dialogue_id}`);
            }
            
            // リストを更新
            this.refreshEndingDialogueList();
            
            // フォームを隠してリストを表示
            document.getElementById('ending-dialogue-form').style.display = 'none';
            document.getElementById('ending-dialogue-list').style.display = 'block';
            
            alert('保存しました！');
        };
        
        window.cancelEndingDialogueEdit = () => {
            document.getElementById('ending-dialogue-form').style.display = 'none';
            document.getElementById('ending-dialogue-list').style.display = 'block';
        };
        
        window.deleteEndingDialogue = (dialogueId) => {
            if (confirm(`エンディングダイアログ「${dialogueId}」を削除しますか？`)) {
                this.endingDialogues = this.endingDialogues.filter(d => d.dialogue_id !== dialogueId);
                this.refreshEndingDialogueList();
                console.log(`🗑️ エンディングダイアログ削除: ${dialogueId}`);
            }
        };
        
        // 保存・出力関数
        window.saveAllCSVData = () => {
            // LocalStorageに保存（実際の実装ではサーバーに送信）
            localStorage.setItem('gameOverScreens', JSON.stringify(this.gameOverScreens));
            localStorage.setItem('endingDialogues', JSON.stringify(this.endingDialogues));
            
            console.log('💾 すべてのデータを保存しました');
            alert('すべてのデータを保存しました！\n（実際の運用では、サーバーにCSVファイルとして保存されます）');
        };
        
        window.exportCSVData = () => {
            // CSV形式でエクスポート
            const gameOverCSV = this.convertToCSV(this.gameOverScreens, [
                'screen_id', 'screen_type', 'title_text', 'message_text', 'button_1_text', 'button_1_action', 
                'button_2_text', 'button_2_action', 'bg_image', 'bgm_file', 'character_sprite'
            ]);
            
            const endingDialogueCSV = this.convertToCSV(this.endingDialogues, [
                'dialogue_id', 'ending_type', 'speaker', 'dialogue_text', 'character_emotion',
                'choice_1_text', 'choice_1_action', 'choice_2_text', 'choice_2_action',
                'choice_3_text', 'choice_3_action', 'sprite_file', 'background_image'
            ]);
            
            // ダウンロード可能なリンクを作成
            this.downloadCSV('game_over_screens.csv', gameOverCSV);
            this.downloadCSV('ending_dialogues.csv', endingDialogueCSV);
            
            console.log('📤 CSVファイルをエクスポートしました');
        };
    }
    
    /**
     * ゲーム終了画面リストを更新
     */
    refreshGameOverList() {
        const listContainer = document.getElementById('game-over-list');
        if (listContainer) {
            listContainer.innerHTML = this.generateGameOverList();
        }
    }
    
    /**
     * エンディングダイアログリストを更新
     */
    refreshEndingDialogueList() {
        const listContainer = document.getElementById('ending-dialogue-list');
        if (listContainer) {
            listContainer.innerHTML = this.generateEndingDialogueList();
        }
    }
    
    /**
     * オブジェクト配列をCSV形式に変換
     */
    convertToCSV(data, headers) {
        const csvHeaders = headers.join(',');
        const csvRows = data.map(row => {
            return headers.map(header => {
                const value = row[header] || '';
                // CSV形式でエスケープ
                return `"${value.toString().replace(/"/g, '""')}"`;
            }).join(',');
        });
        
        return [csvHeaders, ...csvRows].join('\n');
    }
    
    /**
     * CSVファイルをダウンロード
     */
    downloadCSV(filename, csvContent) {
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
    
    /**
     * エディター画面を非表示
     */
    hide() {
        if (!this.isActive) return;
        
        const editor = document.getElementById('game-over-editor');
        if (editor) {
            editor.remove();
        }
        
        this.isActive = false;
        console.log('ゲーム終了画面エディターを非表示');
    }
    
    /**
     * リソースをクリーンアップ
     */
    cleanup() {
        this.hide();
        console.log('GameOverEditorScene cleanup');
    }
}

// グローバルに公開
window.GameOverEditorScene = GameOverEditorScene;