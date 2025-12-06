// 初期ステータス（本来はダイスで決めることも可能）
let heroStats = {
    skill: 10,
    stamina: 20,
    luck: 10
};

// 現在のパラグラフ番号
let currentId = "1";

// 起動時に実行される処理
window.onload = function() {
    loadGame(); // セーブデータがあれば読み込む
    updateStatsDisplay();
    showParagraph(currentId);
};

// パラグラフを表示する関数
function showParagraph(id) {
    currentId = id;
    saveGame(); // ページ移動するたびに自動セーブ

    const data = storyData[id];
    const textField = document.getElementById("story-text");
    const choicesField = document.getElementById("choices-container");

    // ページトップへスクロール
    window.scrollTo(0, 0);

    // テキストを表示
    if (data) {
        textField.textContent = data.text;
        
        // 選択肢ボタンを作成
        choicesField.innerHTML = ""; // 一旦クリア
        
        if (data.choices && data.choices.length > 0) {
            data.choices.forEach(choice => {
                const btn = document.createElement("button");
                btn.className = "choice-btn";
                btn.textContent = choice.text;
                btn.onclick = function() {
                    showParagraph(choice.target);
                };
                choicesField.appendChild(btn);
            });
        } else {
            // 選択肢がない場合（行き止まりなど）
            choicesField.innerHTML = "<p>（終わり）</p>";
        }
    } else {
        textField.textContent = "エラー：ページが見つかりません (ID: " + id + ")";
    }
}

// ステータス表示を更新
function updateStatsDisplay() {
    document.getElementById("skill").textContent = heroStats.skill;
    document.getElementById("stamina").textContent = heroStats.stamina;
    document.getElementById("luck").textContent = heroStats.luck;
}

// サイコロを振る機能 (2個振る)
function rollDice() {
    const d1 = Math.floor(Math.random() * 6) + 1;
    const d2 = Math.floor(Math.random() * 6) + 1;
    const total = d1 + d2;
    
    document.getElementById("dice-result").textContent = 
        `結果: ${total} (${d1} + ${d2})`;
}

// セーブ機能（ローカルストレージ）
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
    if (saved) {
        const data = JSON.parse(saved);
        currentId = data.id;
        heroStats = data.stats;
    } else {
        currentId = "1"; // データがなければ1から
    }
}

// リセット機能
function resetGame() {
    if(confirm("最初からやり直しますか？")) {
        localStorage.removeItem("gameBookSave");
        location.reload();
    }
}