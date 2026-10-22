import { ITEMS, TILE_INFO } from './data.js';
import { getItem, countItem } from './inventory.js';
import { CameraSystem } from './camera.js';

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
      if (button && this.onBattleAction) this.onBattleAction(button.dataset.battleAction);
    });
  }

  render(state, worldSystem) {
    this.renderMap(state, worldSystem);
    this.renderStatus(state);
    this.messageName.textContent = state.message.name || 'SYSTEM';
    this.messageText.textContent = state.message.text || '';
    this.systemStatus.textContent = state.message.status || '探索中';
    this.location.textContent = worldSystem.world.name;
    this.renderBattle(state);
  }

  renderMap(state, worldSystem) {
    if (!this.mapGrid) return;
    const rows = worldSystem.world.layout;
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
        tile.className = 'map-tile ' + info.className + (isPlayer ? ' is-player' : '');
        tile.textContent = isPlayer ? '♙' : (cell === 'E' ? '!' : info.glyph);
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
    if (!state.battle) {
      this.battlePanel.hidden = true;
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
        button.disabled = inBattle;
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
