// 初期ステータス
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
    if (typeof gameConfig !== 'undefined' && gameConfig.title) {
        document.title = gameConfig.title;
    }

    loadGame(); 
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

    if (!data) {
        textField.textContent = "エラー：ページが見つかりません (ID: " + id + ")";
        choicesField.innerHTML = "";
        if (combatLog) combatLog.innerHTML = "";
        return;
    }

    textField.textContent = data.text;
    choicesField.innerHTML = "";
    if (combatLog) combatLog.innerHTML = "";

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
// サイコロ・判定機能
// ===================================

// サイコロの目をグラフィックに変換する関数
function getDiceFace(num) {
    const faces = {
        1: '⚀', 2: '⚁', 3: '⚂', 4: '⚃', 5: '⚄', 6: '⚅'
    };
    return faces[num];
}

// サイコロのアニメーションと結果表示
function displayAnimatedDice(d1, d2, callback) {
    const dice1El = document.getElementById('dice-graphic-1');
    const dice2El = document.getElementById('dice-graphic-2');
    const resultEl = document.getElementById('dice-result');

    // アニメーションクラスを付与
    dice1El.classList.add('rolling');
    dice2El.classList.add('rolling');
    resultEl.textContent = '結果: 振る...';

    // 0.8秒後にアニメーションを停止し、結果を表示
    setTimeout(() => {
        dice1El.classList.remove('rolling');
        dice2El.classList.remove('rolling');
        
        dice1El.textContent = getDiceFace(d1);
        dice2El.textContent = getDiceFace(d2);
        resultEl.textContent = `結果: ${d1 + d2} (${d1} + ${d2})`;
        
        if (callback) callback();
    }, 800);
}

// サイコロを2つ振り、結果の配列を返すヘルパー関数 (アニメーションは呼ばない)
function roll2D6() {
    const d1 = Math.floor(Math.random() * 6) + 1;
    const d2 = Math.floor(Math.random() * 6) + 1;
    return [d1, d2, d1 + d2];
}

// 手動サイコロボタン用
function rollDice() {
    const [d1, d2, total] = roll2D6();
    displayAnimatedDice(d1, d2);
}

// 技術点テスト or 運点テスト
function performTest(type, successId, failId) {
    const [d1, d2, diceRoll] = roll2D6();

    // まずアニメーションを実行し、完了後に判定を行う
    displayAnimatedDice(d1, d2, () => {
        let resultMessage = `${type}テスト実施: サイコロの目 ${diceRoll}\nあなたの${type}点 (${heroStats[type]}) と比較します。\n\n`;

        if (diceRoll <= heroStats[type]) {
            // 成功
            resultMessage += `結果: **成功**！ (${diceRoll} <= ${heroStats[type]})\n\nパラグラフ ${successId} へ進みます。`;
            document.getElementById("story-text").textContent = resultMessage;
            
            setTimeout(() => showParagraph(successId), 1500); 
        } else {
            // 失敗
            resultMessage += `結果: **失敗**... (${diceRoll} > ${heroStats[type]})\n\nパラグラフ ${failId} へ進みます。`;
            document.getElementById("story-text").textContent = resultMessage;
            
            setTimeout(() => showParagraph(failId), 1500); 
        }
    });
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

    const [hero_d1, hero_d2, heroRoll] = roll2D6();
    const heroAttackScore = heroRoll + heroStats.skill;
    
    const [enemy_d1, enemy_d2, enemyRoll] = roll2D6();
    const enemyAttackScore = enemyRoll + currentEnemy.skill;
    
    // 戦闘ラウンドのアニメーションを表示
    displayAnimatedDice(heroRoll, enemyRoll, () => { // 簡易表示
        log.textContent += `\n[ラウンド開始]\n`;
        log.textContent += `  あなた: ${heroRoll} + ${heroStats.skill} = ${heroAttackScore}\n`;
        log.textContent += `  敵: ${enemyRoll} + ${currentEnemy.skill} = ${enemyAttackScore}\n`;

        if (heroAttackScore > enemyAttackScore) {
            currentEnemy.stamina -= 2;
            log.textContent += `あなたは敵を打ち破った！ 敵の体力 -2。\n`;
            navigator.vibrate(100); // プレイヤー勝利時に軽い振動
        } else if (enemyAttackScore > heroAttackScore) {
            heroStats.stamina -= 2;
            log.textContent += `敵の攻撃が命中！ あなたの体力 -2。\n`;
            updateStatsDisplay();
            navigator.vibrate(300); // プレイヤー被弾時に強い振動
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
    });
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

// ロード機能
function loadGame() {
    const saved = localStorage.getItem("gameBookSave");
    const startPoint = (typeof gameConfig !== 'undefined' && gameConfig.startId) ? gameConfig.startId : "1";
    const initialStats = { skill: 10, stamina: 20, luck: 10 };
    
    if (saved) {
        const data = JSON.parse(saved);
        currentId = data.id;
        heroStats = data.stats; 
    } else {
        currentId = startPoint;
        Object.assign(heroStats, initialStats);
    }
}

// リセット機能
function resetGame() {
    if(confirm("最初からやり直しますか？\n（現在の進行状況はすべて失われます）")) {
        localStorage.removeItem("gameBookSave");
        Object.assign(heroStats, { skill: 10, stamina: 20, luck: 10 });
        currentId = (typeof gameConfig !== 'undefined' && gameConfig.startId) ? gameConfig.startId : "1";
        location.reload(); 
    }
}