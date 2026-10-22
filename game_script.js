// game_script.js: RPGモジュールを組み立てる司令塔・エントリーポイント
import { GameEngine } from './js/engine.js';
import { createInitialState } from './js/state.js';
import { WorldSystem } from './js/world.js';
import { BattleSystem } from './js/battle.js';
import { SaveSystem } from './js/save.js';
import { GameUI } from './js/ui.js';

const startGame = () => {
  const documentRef = document;
  const systems = {
    state: createInitialState(),
    world: new WorldSystem(),
    battle: new BattleSystem(),
    save: new SaveSystem(),
    ui: new GameUI(documentRef)
  };

  const engine = new GameEngine(documentRef, systems);
  engine.start();
  // 開発中の確認用。ブラウザのコンソールから現在の状態を調べられる。
  window.voidMasterGame = engine;
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', startGame, { once: true });
} else {
  startGame();
}
