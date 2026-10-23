import { normalizeState } from './state.js';

const PREFIX = 'void-master-rpg';
const MANUAL_SLOTS = 3;
const STORAGE_KEYS = {
  auto: PREFIX + '-auto-v1',
  story: PREFIX + '-story-v1'
};

function cloneState(state) {
  return JSON.parse(JSON.stringify({ ...state, battle: null }));
}

function storageKey(type, slot = 1) {
  if (type === 'auto' || type === 'story') return STORAGE_KEYS[type];
  if (type === 'manual' && Number.isInteger(slot) && slot >= 1 && slot <= MANUAL_SLOTS) {
    return PREFIX + '-manual-' + slot + '-v1';
  }
  return null;
}

export class SaveSystem {
  get manualSlotCount() { return MANUAL_SLOTS; }

  save(state, type = 'manual', slot = 1, extra = {}) {
    const key = storageKey(type, slot);
    if (!key) return { ok: false, message: '保存先が正しくない。' };
    try {
      const record = {
        format: 1,
        type,
        slot: type === 'manual' ? slot : null,
        savedAt: new Date().toISOString(),
        areaId: state.areaId,
        playerName: state.player?.name || '旅人',
        level: state.player?.level || 1,
        state: cloneState(state),
        extra: type === 'story' ? extra : {}
      };
      localStorage.setItem(key, JSON.stringify(record));
      const label = type === 'auto' ? 'オートセーブ' : type === 'story' ? 'ストーリーセーブ' : 'セーブ枠 ' + slot;
      return { ok: true, message: label + 'を保存した。' };
    } catch (error) {
      console.error('Save failed:', error);
      return { ok: false, message: 'セーブできなかった。ブラウザの保存領域を確認してほしい。' };
    }
  }

  saveAuto(state) {
    return this.save(state, 'auto');
  }

  saveStory(state, eventId, eventData = {}) {
    return this.save(state, 'story', 1, { eventId, eventData });
  }

  saveManual(state, slot) {
    return this.save(state, 'manual', slot);
  }

  load(type = 'manual', slot = 1) {
    const key = storageKey(type, slot);
    if (!key) return { ok: false, message: '読み込み先が正しくない。' };
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return { ok: false, message: 'セーブデータが見つからない。' };
      const parsed = JSON.parse(raw);
      // Accept the previous single-slot save format for existing players.
      const savedState = parsed?.state || parsed;
      return {
        ok: true,
        state: normalizeState(savedState),
        record: parsed?.state ? parsed : null,
        message: 'セーブデータを読み込んだ。'
      };
    } catch (error) {
      console.error('Load failed:', error);
      return { ok: false, message: 'セーブデータを読み込めなかった。' };
    }
  }

  getInfo(type, slot = 1) {
    const key = storageKey(type, slot);
    if (!key) return null;
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      const state = parsed?.state || parsed;
      return {
        savedAt: parsed?.savedAt || null,
        areaId: parsed?.areaId || state?.areaId || 'village',
        playerName: parsed?.playerName || state?.player?.name || '旅人',
        level: parsed?.level || state?.player?.level || 1,
        extra: parsed?.extra || {}
      };
    } catch {
      return null;
    }
  }

  exists(type = 'manual', slot = 1) {
    return Boolean(this.getInfo(type, slot));
  }

  clear(type = 'manual', slot = 1) {
    const key = storageKey(type, slot);
    if (!key) return false;
    try { localStorage.removeItem(key); return true; }
    catch { return false; }
  }
}
