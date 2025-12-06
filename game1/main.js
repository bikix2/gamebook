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
    // タイトルをstory_data.jsの設定から反映
    if (typeof gameConfig !== 'undefined' && gameConfig.title) {
        document.title = gameConfig.title;
    }

    loadGame(); // セーブデータ読み込み
    updateStatsDisplay();
    showParagraph(currentId);
};

// パラグラフを表示する関数
function showParagraph(id) {
    currentId = id;
    saveGame(); // 移動するたびにオートセーブ

    const data = storyData[id];
    const textField = document.getElementById("story-text");
    const choicesField = document.getElementById("choices-container");

    // ページトップへ
    window.scrollTo(0, 0);

    if (data) {
        textField.textContent = data.text;
        
        // 選択肢ボタンを作成
        choicesField.innerHTML = "";
        
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

// サイコロ機能
function rollDice() {
    const d1 = Math.floor(Math.random() * 6) + 1;
    const d2 = Math.floor(Math.random() * 6) + 1;
    const total = d1 + d2;
    
    document.getElementById("dice-result").textContent = 
        `結果: ${total} (${d1} + ${d2})`;
}

// セーブ機能
function saveGame() {
    const saveData = {
        id: currentId,
        stats: heroStats
    };
    // アプリごとにセーブを分けられるように、キー名にタイトルを含める工夫も可能ですが
    // 今回はシンプルに共通のキーを使います
    localStorage.setItem("gameBookSave", JSON.stringify(saveData));
}

// ロード機能
function loadGame() {
    const saved = localStorage.getItem("gameBookSave");
    
    // 設定されているスタート地点を取得（設定がなければ"1"）
    const startPoint = (typeof gameConfig !== 'undefined') ? gameConfig.startId : "1";

    if (saved) {
        const data = JSON.parse(saved);
        currentId = data.id;
        heroStats = data.stats;
    } else {
        // セーブがない場合は設定されたスタート地点から
        currentId = startPoint;
    }
}

// リセット機能
function resetGame() {
    if(confirm("最初からやり直しますか？")) {
        localStorage.removeItem("gameBookSave");
        location.reload();
    }
}