import { normalizeState } from './state.js';

const SAVE_KEY = 'void-master-rpg-save-v2';

export class SaveSystem {
  save(state) {
    try {
      const snapshot = JSON.parse(JSON.stringify({ ...state, battle: null }));
      localStorage.setItem(SAVE_KEY, JSON.stringify(snapshot));
      return { ok: true, message: 'セーブした。次回もこのブラウザで続きから遊べる。' };
    } catch (error) {
      console.error('Save failed:', error);
      return { ok: false, message: 'セーブできなかった。ブラウザの保存領域を確認してほしい。' };
    }
  }

  load() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return { ok: false, message: 'セーブデータが見つからない。' };
      const parsed = JSON.parse(raw);
      return { ok: true, state: normalizeState(parsed), message: 'セーブデータを読み込んだ。' };
    } catch (error) {
      console.error('Load failed:', error);
      return { ok: false, message: 'セーブデータを読み込めなかった。' };
    }
  }

  exists() {
    try { return Boolean(localStorage.getItem(SAVE_KEY)); }
    catch { return false; }
  }

  clear() {
    try { localStorage.removeItem(SAVE_KEY); return true; }
    catch { return false; }
  }
}
