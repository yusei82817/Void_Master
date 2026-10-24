const sounds = {
  attack: '../assets/SE/斬撃.mp3',
  shipLaunch: '../assets/SE/海に船を浮かべる音.mp3',
  mpRestore: '../assets/SE/MP回復.mp3',
  rippleFirstUse: '../assets/SE/戦闘の音/生命力から攻撃を作る...これが波紋だ.mp3'
};

const voiceSets = {
  normalAttack: [
    '../assets/SE/戦闘の音/ふん_クレイン.mp3',
    '../assets/SE/戦闘の音/消えろ_クレイン.mp3'
  ]
};

export function playSE(name) {
  const path = sounds[name];
  if (!path || typeof Audio === 'undefined') return;
  playPath(path);
}

export function playRandomVoice(name) {
  const paths = voiceSets[name];
  if (!Array.isArray(paths) || paths.length === 0 || typeof Audio === 'undefined') return;
  const path = paths[Math.floor(Math.random() * paths.length)];
  playPath(path);
}

function playPath(path) {
  const audio = new Audio(new URL(path, import.meta.url).href);
  audio.preload = 'auto';
  audio.volume = 0.75;
  audio.play().catch((error) => {
    // Browsers may block playback until the user has interacted with the page.
    console.debug('Audio playback was blocked:', error);
  });
}
