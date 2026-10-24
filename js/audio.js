const sounds = {
  attack: '../assets/SE/斬撃.mp3',
  shipLaunch: '../assets/SE/海に船を浮かべる音.mp3',
  mpRestore: '../assets/SE/MP回復.mp3'
};

export function playSE(name) {
  const path = sounds[name];
  if (!path || typeof Audio === 'undefined') return;
  const audio = new Audio(new URL(path, import.meta.url).href);
  audio.preload = 'auto';
  audio.volume = 0.75;
  audio.play().catch((error) => {
    // Browsers may block playback until the user has interacted with the page.
    console.debug('SE playback was blocked:', error);
  });
}
