// 初期ステータス（ロード処理で初期化されるまでの一時的な初期値）
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
    currentId = id;
    saveGame();
    currentEnemy = null; 

    const data = storyData[id];
    const textField = document.getElementById("story-text");
    const choicesField = document.getElementById("choices-container");
    const combatLog = document.getElementById("combat-log");

    window.scrollTo(0, 0);

    // データが存在しない場合のエラー処理
    if (!data) {
        textField.textContent = "エラー：ページが見つかりません (ID: " + id + ")";
        choicesField.innerHTML = "";
        if (combatLog) combatLog.innerHTML = "";
        return;
    }

    // データが存在する場合の処理
    textField.textContent = data.text;
    choicesField.innerHTML = "";
    if (combatLog) combatLog.innerHTML = ""; // ログ要素が存在する場合のみクリア

    if (data.choices && data.choices.length > 0) {
        data.choices.forEach(choice => {
            const btn = document.createElement("button");
            btn.className = "choice-btn";
            btn.textContent = choice.text;

            if (choice.action === "skillTest") {
                btn.onclick = () => performTest('skill', choice.targetSuccess, choice.targetFail);
            } else if (choice.action === "luckTest") {
                btn.onclick = () => performTest('luck', choice.targetSuccess, choice.targetFail);
            } else if (choice.action === "startCombat") {
                currentEnemy = { skill: choice.enemySkill, stamina: choice.enemyStamina, name: choice.enemyName };
                btn.textContent = `${choice.enemyName}と戦う (技術点: ${currentEnemy.skill}, 体力点: ${currentEnemy.stamina})`;
                btn.onclick = () => startCombat(choice.targetSuccess);
            } else {
                btn.onclick = () => showParagraph(choice.target);
            }
            
            choicesField.appendChild(btn);
        });
    } else {
        choicesField.innerHTML = "<p>（終わり）</p>";
    }
}

// ===================================
// 判定機能
// ===================================

function roll2D6() {
    const d1 = Math.floor(Math.random() * 6) + 1;
    const d2 = Math.floor(Math.random() * 6) + 1;
    return d1 + d2;
}

// 手動サイコロ機能（index.htmlに残っているボタン用）
function rollDice() {
    const total = roll2D6();
    document.getElementById("dice-result").textContent = 
        `結果: ${total}`;
}

function performTest(type, successId, failId) {
    const diceRoll = roll2D6();
    let resultMessage = `${type}テスト実施: サイコロの目 ${diceRoll}\nあなたの${type}点 (${heroStats[type]}) と比較します。\n\n`;

    if (diceRoll <= heroStats[type]) {
        resultMessage += `結果: **成功**！ (${diceRoll} <= ${heroStats[type]})\n\nパラグラフ ${successId} へ進みます。`;
        document.getElementById("story-text").textContent = resultMessage;
        
        setTimeout(() => showParagraph(successId), 1500); 
    } else {
        resultMessage += `結果: **失敗**... (${diceRoll} > ${heroStats[type]})\n\nパラグラフ ${failId} へ進みます。`;
        document.getElementById("story-text").textContent = resultMessage;
        
        setTimeout(() => showParagraph(failId), 1500); 
    }
}

// ===================================
// 自動戦闘機能
// ===================================

function startCombat(winId) {
    if (!currentEnemy) {
        document.getElementById("story-text").textContent = "エラー：敵データが見つかりません。";
        return;
    }
    
    document.getElementById("story-text").textContent = `${currentEnemy.name}との戦闘を開始します！`;
    document.getElementById("choices-container").innerHTML = "";
    
    // combat-log を choices-container の下に表示
    document.getElementById("combat-log").innerHTML = '';
    
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

    const heroRoll = roll2D6();
    const heroAttackScore = heroRoll + heroStats.skill;
    
    const enemyRoll = roll2D6();
    const enemyAttackScore = enemyRoll + currentEnemy.skill;

    log.textContent += `\n[ラウンド開始]\n`;
    log.textContent += `  あなた: ${heroRoll} + ${heroStats.skill} = ${heroAttackScore}\n`;
    log.textContent += `  敵: ${enemyRoll} + ${currentEnemy.skill} = ${enemyAttackScore}\n`;

    if (heroAttackScore > enemyAttackScore) {
        currentEnemy.stamina -= 2;
        log.textContent += `あなたは敵を打ち破った！ 敵の体力 -2。\n`;
    } else if (enemyAttackScore > heroAttackScore) {
        heroStats.stamina -= 2;
        log.textContent += `敵の攻撃が命中！ あなたの体力 -2。\n`;
        updateStatsDisplay();
    } else {
        log.textContent += `両者の攻撃は相殺した（引き分け）。\n`;
    }

    if (currentEnemy.stamina <= 0) {
        log.textContent += `\n--- 勝利！ ${currentEnemy.name}を倒しました。 ---\n`;
        attackBtn.textContent = "戦闘終了 (次へ進む)";
        attackBtn.onclick = () => showParagraph(winId);
        attackBtn.className = "choice-btn success";

    } else if (heroStats.stamina <= 0) {
        log.textContent += `\n--- 敗北... あなたは力尽きました。 ---\n`;
        attackBtn.textContent = "ゲームオーバー (リセットしてください)";
        attackBtn.onclick = null;
        attackBtn.className = "choice-btn fail";
    } else {
        log.textContent += `  現在の体力: あなた(${heroStats.stamina}) / 敵(${currentEnemy.stamina})\n`;
    }
    log.scrollTop = log.scrollHeight;
}

// ===================================
// 補助機能・セーブ/ロード
// ===================================

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
    try {
        localStorage.setItem("gameBookSave", JSON.stringify(saveData));
    } catch (e) {
        console.error("セーブに失敗しました:", e);
    }
}

// ロード機能 (リセット時に初期値に戻す処理を強化)
function loadGame() {
    const saved = localStorage.getItem("gameBookSave");
    const startPoint = (typeof gameConfig !== 'undefined' && gameConfig.startId) ? gameConfig.startId : "1";

    // 初期ステータスの定義 (リセット/セーブデータなしの場合に使用)
    const initialStats = { skill: 10, stamina: 20, luck: 10 };
    
    if (saved) {
        const data = JSON.parse(saved);
        currentId = data.id;
        // ロードしたステータスを適用
        heroStats = data.stats; 
    } else {
        // セーブがない場合は設定されたスタート地点と初期ステータスに戻す
        currentId = startPoint;
        // グローバル変数 heroStats を初期化する
        Object.assign(heroStats, initialStats);
    }
}

// リセット機能 (location.reload()前に確実に削除)
function resetGame() {
    if(confirm("最初からやり直しますか？\n（現在の進行状況はすべて失われます）")) {
        // 1. セーブデータを削除
        localStorage.removeItem("gameBookSave");
        
        // 2. 次のロードに備えてグローバル変数 heroStats と currentId を初期化
        Object.assign(heroStats, { skill: 10, stamina: 20, luck: 10 });
        currentId = (typeof gameConfig !== 'undefined' && gameConfig.startId) ? gameConfig.startId : "1";

        // 3. ページの再読み込みを実行
        location.reload(); 
    }
}