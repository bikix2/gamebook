// 初期ステータス（本来はダイスで決めることも可能）
let heroStats = {
    skill: 10,
    stamina: 20,
    luck: 10
};

// 現在のパラグラフ番号
let currentId = "1";
// 戦闘中の敵データ（戦闘時のみ使用）
let currentEnemy = null;

// 起動時に実行される処理
window.onload = function() {
    // タイトルをstory_data.jsの設定から反映
    if (typeof gameConfig !== 'undefined' && gameConfig.title) {
        document.title = gameConfig.title;
    }

    loadGame(); // セーブデータ読み込み
    updateStatsDisplay();
    showParagraph(currentId);
};

// ===================================
// ページ遷移・表示機能
// ===================================

function showParagraph(id) {
    // 現在のパラグラフを更新し、オートセーブ
    currentId = id;
    saveGame();
    // 戦闘状態をリセット
    currentEnemy = null; 

    const data = storyData[id];
    const textField = document.getElementById("story-text");
    const choicesField = document.getElementById("choices-container");
    const combatLog = document.getElementById("combat-log");

    // ページトップへ
    window.scrollTo(0, 0);

    if (data) {
        textField.textContent = data.text;
        choicesField.innerHTML = "";
        combatLog.innerHTML = ""; // 戦闘ログをクリア

        if (data.choices && data.choices.length > 0) {
            data.choices.forEach(choice => {
                const btn = document.createElement("button");
                btn.className = "choice-btn";
                btn.textContent = choice.text;

                // 選択肢に特殊な命令があるかチェック
                if (choice.action === "skillTest") {
                    // 技術点テストボタン
                    btn.onclick = () => performTest('skill', choice.targetSuccess, choice.targetFail);
                } else if (choice.action === "luckTest") {
                    // 運点テストボタン
                    btn.onclick = () => performTest('luck', choice.targetSuccess, choice.targetFail);
                } else if (choice.action === "startCombat") {
                    // 戦闘開始ボタン
                    currentEnemy = { skill: choice.enemySkill, stamina: choice.enemyStamina, name: choice.enemyName };
                    btn.textContent = `${choice.enemyName}と戦う (技術点: ${currentEnemy.skill}, 体力点: ${currentEnemy.stamina})`;
                    btn.onclick = () => startCombat(choice.targetSuccess);
                } else {
                    // 通常のページ遷移
                    btn.onclick = () => showParagraph(choice.target);
                }
                
                choicesField.appendChild(btn);
            });
        } else {
            choicesField.innerHTML = "<p>（終わり）</p>";
        }
    } else {
        textField.textContent = "エラー：ページが見つかりません (ID: " + id + ")";
    }
}

// ===================================
// 判定機能
// ===================================

// サイコロを2つ振るヘルパー関数
function roll2D6() {
    const d1 = Math.floor(Math.random() * 6) + 1;
    const d2 = Math.floor(Math.random() * 6) + 1;
    return d1 + d2;
}

// 技術点テスト or 運点テスト
function performTest(type, successId, failId) {
    const diceRoll = roll2D6();
    let resultMessage = `${type}テスト実施: サイコロの目 ${diceRoll}\nあなたの${type}点 (${heroStats[type]}) と比較します。\n\n`;

    if (diceRoll <= heroStats[type]) {
        // 成功
        resultMessage += `結果: **成功**！ (${diceRoll} <= ${heroStats[type]})\n\nパラグラフ ${successId} へ進みます。`;
        document.getElementById("story-text").textContent = resultMessage;
        
        // 1.5秒後に移動
        setTimeout(() => showParagraph(successId), 1500); 
    } else {
        // 失敗
        resultMessage += `結果: **失敗**... (${diceRoll} > ${heroStats[type]})\n\nパラグラフ ${failId} へ進みます。`;
        document.getElementById("story-text").textContent = resultMessage;
        
        // 1.5秒後に移動
        setTimeout(() => showParagraph(failId), 1500); 
    }
}

// ===================================
// 自動戦闘機能 (簡略版：技術点テストに勝ち続ける)
// ===================================

function startCombat(winId) {
    if (!currentEnemy) {
        document.getElementById("story-text").textContent = "エラー：敵データが見つかりません。";
        return;
    }
    
    document.getElementById("story-text").textContent = `${currentEnemy.name}との戦闘を開始します！`;
    document.getElementById("choices-container").innerHTML = ""; // 選択肢をクリア
    
    // 戦闘ログ表示エリアを確保
    document.getElementById("choices-container").innerHTML = '<div id="combat-log"></div>';
    
    // 戦闘開始ボタンを設置
    const attackBtn = document.createElement("button");
    attackBtn.className = "choice-btn";
    attackBtn.textContent = "🗡 攻撃ラウンドを開始する";
    attackBtn.onclick = () => performCombatRound(winId);
    document.getElementById("choices-container").appendChild(attackBtn);

    const log = document.getElementById("combat-log");
    log.textContent = `--- ${currentEnemy.name} (体力: ${currentEnemy.stamina}) との戦闘 ---\n`;
}

function performCombatRound(winId) {
    const log = document.getElementById("combat-log");
    const attackBtn = document.querySelector(".choice-btn");

    // 攻撃処理（自分）
    const heroRoll = roll2D6();
    const heroAttackScore = heroRoll + heroStats.skill;
    
    // 攻撃処理（敵）
    const enemyRoll = roll2D6();
    const enemyAttackScore = enemyRoll + currentEnemy.skill;

    log.textContent += `\n[ラウンド開始]\n`;
    log.textContent += `  あなた: ${heroRoll} + ${heroStats.skill} = ${heroAttackScore}\n`;
    log.textContent += `  敵: ${enemyRoll} + ${currentEnemy.skill} = ${enemyAttackScore}\n`;

    if (heroAttackScore > enemyAttackScore) {
        // プレイヤー勝利
        currentEnemy.stamina -= 2; // 敵にダメージ2
        log.textContent += `あなたは敵を打ち破った！ 敵の体力 -2。\n`;
    } else if (enemyAttackScore > heroAttackScore) {
        // 敵勝利
        heroStats.stamina -= 2; // プレイヤーにダメージ2
        log.textContent += `敵の攻撃が命中！ あなたの体力 -2。\n`;
        updateStatsDisplay(); // ステータスバーを更新
    } else {
        // 引き分け
        log.textContent += `両者の攻撃は相殺した（引き分け）。\n`;
    }

    // 勝敗判定
    if (currentEnemy.stamina <= 0) {
        log.textContent += `\n--- 勝利！ ${currentEnemy.name}を倒しました。 ---\n`;
        attackBtn.textContent = "戦闘終了 (次へ進む)";
        attackBtn.onclick = () => showParagraph(winId);
        attackBtn.className = "choice-btn success";

    } else if (heroStats.stamina <= 0) {
        log.textContent += `\n--- 敗北... あなたは力尽きました。 ---\n`;
        attackBtn.textContent = "ゲームオーバー (パラグラフ1へ)";
        attackBtn.onclick = () => { heroStats.stamina = 1; showParagraph('1'); }; // 体力を1に戻して開始地点へ
        attackBtn.className = "choice-btn fail";
    } else {
        // 戦闘継続
        log.textContent += `  現在の体力: あなた(${heroStats.stamina}) / 敵(${currentEnemy.stamina})\n`;
    }
    log.scrollTop = log.scrollHeight; // ログを最新にスクロール
}

// ===================================
// 補助機能
// ===================================

// ステータス表示を更新
function updateStatsDisplay() {
    document.getElementById("skill").textContent = heroStats.skill;
    document.getElementById("stamina").textContent = heroStats.stamina;
    document.getElementById("luck").textContent = heroStats.luck;
}

// セーブ機能
function saveGame() {
    const saveData = {
        id: currentId,
        stats: heroStats
    };
    localStorage.setItem("gameBookSave", JSON.stringify(saveData));
}

// ロード機能
function loadGame() {
    const saved = localStorage.getItem("gameBookSave");
    const startPoint = (typeof gameConfig !== 'undefined') ? gameConfig.startId : "1";

    if (saved) {
        const data = JSON.parse(saved);
        currentId = data.id;
        heroStats = data.stats;
    } else {
        currentId = startPoint;
    }
}

// リセット機能
function resetGame() {
    if(confirm("最初からやり直しますか？\n（現在の進行状況はすべて失われます）")) {
        // セーブデータのキーを削除
        localStorage.removeItem("gameBookSave");
        // ページ全体を再読み込み
        location.reload(); 
    }
}