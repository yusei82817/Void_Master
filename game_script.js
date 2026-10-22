import { GameEngine } from './js/engine.js';

const startGame = () => {
  const engine = new GameEngine(document);
  engine.start();
  // 開発中の確認用。ブラウザのコンソールから状態を調べられる。
  window.voidMasterGame = engine;
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', startGame, { once: true });
} else {
  startGame();
}
