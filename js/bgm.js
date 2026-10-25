const TRACKS = {
  village: new URL('../周遊エディフィス_はじまりの村フィールドワーク用.mp3', import.meta.url).href,
  forest: new URL('../contedefees_春は来る_深緑の森フィールドワーク用.mp3', import.meta.url).href,
  cave: new URL('../警告サイン_BGMer_洞窟フィールドワーク用.mp3', import.meta.url).href,
  sea: new URL('../荒波の海戦_BGMer_外洋フィールドワーク用.mp3', import.meta.url).href,
  volcano: new URL('../ドラゴンスレイヤー_BGMer_火山フィールドワーク用.mp3', import.meta.url).href,
  port: new URL('../周遊エディフィス_はじまりの村フィールドワーク用.mp3', import.meta.url).href,
  inlet: new URL('../ドラゴンスレイヤー_BGMer_火山フィールドワーク用.mp3', import.meta.url).href
};

let audio = null;
let currentTrack = '';

function getAudio(documentRef) {
  if (audio && audio.ownerDocument === documentRef) return audio;
  audio = documentRef.getElementById('voidMasterBgm');
  if (!audio) {
    audio = documentRef.createElement('audio');
    audio.id = 'voidMasterBgm';
    audio.loop = true;
    audio.preload = 'auto';
    audio.volume = 0.35;
    audio.setAttribute('aria-hidden', 'true');
    audio.style.display = 'none';
    documentRef.body.appendChild(audio);
  }
  audio.loop = true;
  return audio;
}

function tryPlay(element) {
  const promise = element.play();
  if (promise && typeof promise.catch === 'function') {
    promise.catch(() => {
      // Browsers may block autoplay until the player interacts with the page.
    });
  }
}

export function setBackgroundMusic(areaId, documentRef = document) {
  const element = getAudio(documentRef);
  const track = TRACKS[areaId] || TRACKS.village;
  if (element.src !== track) {
    element.src = track;
    currentTrack = track;
    element.load();
  }
  if (currentTrack !== track) currentTrack = track;
  tryPlay(element);

  if (!element.dataset.retryBound) {
    const retry = () => {
      if (element.paused) tryPlay(element);
    };
    documentRef.addEventListener('pointerdown', retry);
    documentRef.addEventListener('keydown', retry);
    element.dataset.retryBound = 'true';
  }
  return element;
}
