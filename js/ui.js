import { ITEMS, TILE_INFO } from './data.js';
import { getItem, countItem } from './inventory.js';
import { CameraSystem } from './camera.js';
import { SHOP_ITEMS } from './shop.js';

export class GameUI {
  constructor(documentRef = document) {
    this.document = documentRef;
    this.mapGrid = documentRef.getElementById('mapGrid');
    this.camera = new CameraSystem(15, 11);
    this.location = documentRef.getElementById('location');
    this.messageName = documentRef.getElementById('messageName');
    this.messageText = documentRef.getElementById('messageText');
    this.systemStatus = documentRef.getElementById('systemStatus');
    this.battlePanel = documentRef.getElementById('battlePanel');
    this.battleTitle = documentRef.getElementById('battleTitle');
    this.battleEnemyHp = documentRef.getElementById('battleEnemyHp');
    this.assistantMenuButton = documentRef.getElementById('assistantMenuButton');
    this.assistantActions = documentRef.getElementById('assistantActions');
    this.shopCommand = documentRef.getElementById('shopCommand');
    this.playerStats = {
      name: documentRef.getElementById('statName'),
      level: documentRef.getElementById('statLevel'),
      hp: documentRef.getElementById('statHp'),
      mp: documentRef.getElementById('statMp'),
      exp: documentRef.getElementById('statExp'),
      gold: documentRef.getElementById('statGold')
    };
    this.dialog = documentRef.getElementById('menuDialog');
    this.dialogTitle = documentRef.getElementById('dialogTitle');
    this.dialogBody = documentRef.getElementById('dialogBody');
    this.closeDialogButton = documentRef.getElementById('closeDialog');
    this.onBattleAction = null;
    this.onItemUse = null;
    this.onDialogAction = null;

    this.closeDialogButton?.addEventListener('click', () => this.closeDialog());
    this.dialog?.addEventListener('click', (event) => {
      if (event.target === this.dialog) this.closeDialog();
    });
    this.dialogBody?.addEventListener('click', (event) => {
      const button = event.target.closest('[data-item-use], [data-dialog-action]');
      if (!button) return;
      if (button.dataset.itemUse && this.onItemUse) this.onItemUse(button.dataset.itemUse);
      if (button.dataset.dialogAction && this.onDialogAction) this.onDialogAction(button.dataset.dialogAction);
    });
    this.battlePanel?.addEventListener('click', (event) => {
      const button = event.target.closest('[data-battle-action]');
      if (!button) return;
      if (button.dataset.battleAction === 'assistant-menu') {
        if (this.assistantActions) this.assistantActions.hidden = !this.assistantActions.hidden;
        return;
      }
      if (this.onBattleAction) this.onBattleAction(button.dataset.battleAction);
    });
  }

  render(state, worldSystem) {
    this.renderMap(state, worldSystem);
    this.renderStatus(state);
    this.messageName.textContent = state.message.name || 'SYSTEM';
    this.messageText.textContent = state.message.text || '';
    this.systemStatus.textContent = state.message.status || '探索中';
    this.location.textContent = worldSystem.getWorld(state).name;
    this.renderBattle(state);
    if (this.shopCommand) this.shopCommand.disabled = state.areaId !== 'village' || Boolean(state.battle);
  }

  renderMap(state, worldSystem) {
    if (!this.mapGrid) return;
    const area = worldSystem.getWorld(state);
    const rows = area.layout;
    this.mapGrid.dataset.area = area.theme || area.id;
    const viewport = this.camera.getViewport(state.player, rows);
    this.mapGrid.style.gridTemplateColumns = 'repeat(' + viewport.width + ', minmax(0, 1fr))';
    this.mapGrid.setAttribute('aria-label', 'フィールドマップ。表示範囲 ' +
      (viewport.x + 1) + '列目から' + (viewport.x + viewport.width) + '列目');
    const fragment = this.document.createDocumentFragment();

    for (let y = viewport.y; y < viewport.y + viewport.height; y += 1) {
      const row = rows[y] || '';
      for (let x = viewport.x; x < viewport.x + viewport.width; x += 1) {
        const rawCell = row[x] || '#';
        let cell = rawCell;
        const enemy = worldSystem.getEnemyAt(state, x, y);
        if (enemy) cell = 'E';
        else if (rawCell === 'E' || rawCell === 'O' || rawCell === 'P') cell = '.';
        if (rawCell === 'R' && state.relicCollected) cell = '.';
        const isPlayer = state.player.x === x && state.player.y === y;
        const info = isPlayer ? TILE_INFO.P : (TILE_INFO[cell] || TILE_INFO['.']);
        const tile = this.document.createElement('div');
        tile.className = 'map-tile ' + info.className + (isPlayer ? ' is-player' : '') + (enemy ? ' has-enemy' : '');
        // Keep terrain tiles texture-free; entities are overlays, not tile artwork.
        tile.textContent = isPlayer ? '♙' : '';
        tile.setAttribute('role', 'gridcell');
        tile.setAttribute('aria-label', isPlayer ? 'プレイヤー' : info.name);
        fragment.appendChild(tile);
      }
    }
    this.mapGrid.replaceChildren(fragment);
  }

  renderStatus(state) {
    const p = state.player;
    this.playerStats.name.textContent = p.name;
    this.playerStats.level.textContent = String(p.level);
    this.playerStats.hp.textContent = p.hp + ' / ' + p.maxHp;
    this.playerStats.mp.textContent = p.mp + ' / ' + p.maxMp;
    this.playerStats.exp.textContent = p.exp + ' / ' + p.nextExp;
    this.playerStats.gold.textContent = String(p.gold);
  }

  renderBattle(state) {
    if (!this.battlePanel) return;
    const assistantUnlocked = Boolean(state.assistantPhase1Unlocked || state.storyEventsCompleted?.includes('S3'));
    if (this.assistantMenuButton) this.assistantMenuButton.hidden = !assistantUnlocked;
    if (!state.battle) {
      this.battlePanel.hidden = true;
      if (this.assistantActions) this.assistantActions.hidden = true;
      return;
    }
    this.battlePanel.hidden = false;
    this.battleTitle.textContent = state.battle.enemy.name;
    this.battleEnemyHp.textContent = 'HP ' + state.battle.enemy.hp + ' / ' + state.battle.enemy.maxHp;
    const rippleButton = this.battlePanel.querySelector('[data-battle-action="ripple"]');
    if (rippleButton) rippleButton.disabled = state.player.mp < 3;
  }

  showInventory(state, inBattle = false) {
    this.openDialog('持ち物', '');
    const fragment = this.document.createDocumentFragment();
    state.inventory.forEach((entry) => {
      const item = getItem(entry.itemId);
      if (!item) return;
      const row = this.document.createElement('div');
      row.className = 'inventory-row';
      const info = this.document.createElement('div');
      const name = this.document.createElement('strong');
      name.textContent = item.name + ' × ' + entry.quantity;
      const description = this.document.createElement('p');
      description.textContent = item.description;
      info.append(name, description);
      row.appendChild(info);
      if (item.type === 'consumable') {
        const button = this.document.createElement('button');
        button.type = 'button';
        button.className = 'command';
        button.textContent = '使う';
        button.dataset.itemUse = item.id;
        button.disabled = false;
        row.appendChild(button);
      }
      fragment.appendChild(row);
    });
    if (!state.inventory.length) {
      const empty = this.document.createElement('p');
      empty.textContent = '持ち物は空だ。';
      fragment.appendChild(empty);
    }
    this.dialogBody.replaceChildren(fragment);
  }

  showShop(state) {
    this.openDialog('はじまりの村・雑貨屋', '');
    const fragment = this.document.createDocumentFragment();
    const balance = this.document.createElement('p');
    balance.textContent = '所持GOLD：' + state.player.gold + ' G';
    fragment.appendChild(balance);

    SHOP_ITEMS.forEach((item) => {
      const row = this.document.createElement('div');
      row.className = 'inventory-row';
      const info = this.document.createElement('div');
      const name = this.document.createElement('strong');
      name.textContent = item.name + '　' + item.price + ' G';
      const description = this.document.createElement('p');
      description.textContent = item.description;
      info.append(name, description);
      row.appendChild(info);

      const button = this.document.createElement('button');
      button.type = 'button';
      button.className = 'command';
      button.textContent = '購入';
      button.dataset.dialogAction = 'buy:' + item.id;
      button.disabled = state.player.gold < item.price;
      row.appendChild(button);
      fragment.appendChild(row);
    });
    this.dialogBody.replaceChildren(fragment);
  }

  showStatus(state) {
    const p = state.player;
    this.openDialog('ステータス', '');
    const list = this.document.createElement('dl');
    list.className = 'status-list';
    const values = [
      ['名前', p.name], ['レベル', p.level], ['経験値', p.exp + ' / ' + p.nextExp],
      ['HP', p.hp + ' / ' + p.maxHp], ['MP', p.mp + ' / ' + p.maxMp],
      ['攻撃', p.attack], ['防御', p.defense], ['所持金', p.gold + ' G'],
      ['歩数', state.steps], ['核の欠片', countItem(state, 'coreFragment') + ' 個']
    ];
    values.forEach(([label, value]) => {
      const term = this.document.createElement('dt');
      const detail = this.document.createElement('dd');
      term.textContent = label;
      detail.textContent = String(value);
      list.append(term, detail);
    });
    this.dialogBody.replaceChildren(list);
  }

  showSaveMenu(saveSystem, mode = 'save') {
    const isLoad = mode === 'load';
    this.openDialog(isLoad ? 'ロード' : 'セーブ', '');
    const fragment = this.document.createDocumentFragment();

    const addEntry = (type, slot, label, description) => {
      const info = saveSystem.getInfo(type, slot);
      const row = this.document.createElement('div');
      row.className = 'inventory-row';
      const details = this.document.createElement('div');
      const name = this.document.createElement('strong');
      name.textContent = label;
      const meta = this.document.createElement('p');
      if (info) {
        const date = info.savedAt ? new Date(info.savedAt).toLocaleString('ja-JP') : '日時不明';
        meta.textContent = (info.areaId || '場所不明') + ' / Lv.' + info.level + ' / ' + date;
      } else {
        meta.textContent = description || 'データなし';
      }
      details.append(name, meta);
      row.appendChild(details);

      const button = this.document.createElement('button');
      button.type = 'button';
      button.className = 'command';
      button.dataset.dialogAction = (isLoad ? 'load:' : 'save:') + type + (type === 'manual' ? ':' + slot : '');
      button.textContent = isLoad ? '読み込む' : '保存';
      button.disabled = isLoad && !info;
      if (!isLoad && info) button.textContent = '上書き';
      row.appendChild(button);
      fragment.appendChild(row);
    };

    if (isLoad) {
      addEntry('auto', 1, 'オートセーブ', '探索や戦闘の進行を自動保存');
      addEntry('story', 1, 'ストーリーセーブ', 'ストーリーイベントの開始地点');
      for (let slot = 1; slot <= saveSystem.manualSlotCount; slot += 1) {
        addEntry('manual', slot, '任意セーブ ' + slot, '空きスロット');
      }
    } else {
      const note = this.document.createElement('p');
      note.textContent = '任意セーブは3枠。オートセーブとストーリーセーブは別々に管理される。';
      fragment.appendChild(note);
      for (let slot = 1; slot <= saveSystem.manualSlotCount; slot += 1) {
        addEntry('manual', slot, '任意セーブ ' + slot, '空きスロット');
      }
    }
    this.dialogBody.replaceChildren(fragment);
  }

  showSettings() {
    this.openDialog('設定', '');
    const note = this.document.createElement('p');
    note.textContent = 'このプロトタイプでは移動に矢印キーまたはWASD、調べる操作にEキーを使う。';
    const reset = this.document.createElement('button');
    reset.type = 'button';
    reset.className = 'command danger-command';
    reset.textContent = '最初からやり直す';
    reset.dataset.dialogAction = 'reset';
    this.dialogBody.replaceChildren(note, reset);
  }

  openDialog(title, unused) {
    this.dialogTitle.textContent = title;
    this.dialogBody.replaceChildren();
    if (!this.dialog.open) this.dialog.showModal();
  }

  closeDialog() {
    if (this.dialog?.open) this.dialog.close();
  }
}
