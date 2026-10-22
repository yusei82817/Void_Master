// 画面確認用の仮コマンド。各システム実装時に個別のJSモジュールへ移す。
    const messageName = document.getElementById("messageName");
    const messageText = document.getElementById("messageText");
    const systemStatus = document.getElementById("systemStatus");

    const commandMessages = {
      explore: ["EXPLORE", "探索システムはまだ実装されていない。マップとイベントを追加する場所。"],
      status: ["STATUS", "キャラクターの能力値は、ゲームシステムを設計してから設定する。"],
      items: ["ITEMS", "アイテム管理は未実装。アイテムデータと所持品管理を後から接続する。"],
      save: ["SAVE", "セーブ機能は未実装。保存データの形式を決めてから実装する。"],
      settings: ["OPTIONS", "設定画面は未実装。音量や表示設定などをここに接続する。"]
    };

    document.querySelectorAll("[data-command]").forEach((button) => {
      button.addEventListener("click", () => {
        const result = commandMessages[button.dataset.command];
        if (!result) return;
        messageName.textContent = result[0];
        messageText.textContent = result[1];
        systemStatus.textContent = "選択中: " + button.querySelector("span").textContent + " · 機能は未実装";
      });
    });
