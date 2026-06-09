/**
 * 音频 Store
 * - 基于 Howler.js 管理播放列表
 * - 暴露播放/暂停/下一首/音量/循环模式
 * - 不在 store 中保存音频文件（路径通过 IPC 选择），仅保存播放列表路径
 */
import { create } from 'zustand';
import { Howl } from 'howler';
import { showNotification, selectAudioFile } from '../ipc';
import { loadFromStore, saveToStore } from './persist';
import { useSettingsStore } from './settingsStore';

const PLAYLIST_KEY = 'audioPlaylist';
const CURRENT_INDEX_KEY = 'audioCurrentIndex';

interface AudioStore {
  playlist: string[]; // 绝对路径数组
  currentIndex: number;
  volume: number; // 0-100
  loop: 'none' | 'one' | 'all';
  isPlaying: boolean;
  howl: Howl | null;
  loaded: boolean;
  hydrate: () => Promise<void>;
  pickFiles: () => Promise<void>;
  addFiles: (paths: string[]) => void;
  removeAt: (index: number) => void;
  clear: () => void;
  play: () => void;
  pause: () => void;
  stop: () => void;
  next: () => void;
  prev: () => void;
  setVolume: (v: number) => void;
  setLoop: (loop: 'none' | 'one' | 'all') => void;
  playByPath: (path: string) => Promise<void>;
}

const persistPlaylist = (list: string[]) => saveToStore(PLAYLIST_KEY, list);
const persistIndex = (i: number) => saveToStore(CURRENT_INDEX_KEY, i);

const destroyHowl = (h: Howl | null) => {
  if (h) {
    try {
      h.stop();
      h.unload();
    } catch (e) {
      // ignore
    }
  }
};

export const useAudioStore = create<AudioStore>((set, get) => ({
  playlist: [],
  currentIndex: -1,
  volume: 60,
  loop: 'all',
  isPlaying: false,
  howl: null,
  loaded: false,

  hydrate: async () => {
    const [list, idx] = await Promise.all([
      loadFromStore<string[]>(PLAYLIST_KEY, []),
      loadFromStore<number>(CURRENT_INDEX_KEY, -1)
    ]);
    const settings = useSettingsStore.getState();
    set({
      playlist: list,
      currentIndex: idx,
      volume: settings.defaultVolume,
      loaded: true
    });
  },

  pickFiles: async () => {
    const res = await selectAudioFile({ multiple: true });
    if (res.canceled || res.filePaths.length === 0) return;
    get().addFiles(res.filePaths);
  },

  addFiles: (paths) => {
    if (!paths.length) return;
    const list = [...get().playlist, ...paths];
    set({ playlist: list });
    persistPlaylist(list);
    if (get().currentIndex === -1) {
      get().playByPath(paths[0]);
    }
  },

  removeAt: (index) => {
    const list = get().playlist.slice();
    if (index < 0 || index >= list.length) return;
    const isCurrent = index === get().currentIndex;
    list.splice(index, 1);
    let newIndex = get().currentIndex;
    if (isCurrent) {
      destroyHowl(get().howl);
      set({ howl: null, isPlaying: false });
      newIndex = list.length > 0 ? Math.min(index, list.length - 1) : -1;
      if (newIndex >= 0) {
        get().playByPath(list[newIndex]);
      }
    } else if (index < get().currentIndex) {
      newIndex = get().currentIndex - 1;
    }
    set({ playlist: list, currentIndex: newIndex });
    persistPlaylist(list);
    persistIndex(newIndex);
  },

  clear: () => {
    destroyHowl(get().howl);
    set({
      playlist: [],
      currentIndex: -1,
      isPlaying: false,
      howl: null
    });
    persistPlaylist([]);
    persistIndex(-1);
  },

  play: () => {
    const h = get().howl;
    if (h) {
      h.play();
      set({ isPlaying: true });
    } else if (get().playlist.length > 0) {
      const idx = get().currentIndex >= 0 ? get().currentIndex : 0;
      get().playByPath(get().playlist[idx]);
    }
  },

  pause: () => {
    const h = get().howl;
    if (h) {
      h.pause();
      set({ isPlaying: false });
    }
  },

  stop: () => {
    const h = get().howl;
    if (h) {
      h.stop();
    }
    set({ isPlaying: false });
  },

  next: () => {
    const { playlist, currentIndex, loop } = get();
    if (playlist.length === 0) return;
    let nextIdx = currentIndex + 1;
    if (nextIdx >= playlist.length) {
      if (loop === 'all') nextIdx = 0;
      else return;
    }
    get().playByPath(playlist[nextIdx]);
  },

  prev: () => {
    const { playlist, currentIndex, loop } = get();
    if (playlist.length === 0) return;
    let prevIdx = currentIndex - 1;
    if (prevIdx < 0) {
      if (loop === 'all') prevIdx = playlist.length - 1;
      else return;
    }
    get().playByPath(playlist[prevIdx]);
  },

  setVolume: (v) => {
    const value = Math.max(0, Math.min(100, v));
    set({ volume: value });
    const h = get().howl;
    if (h) h.volume(value / 100);
  },

  setLoop: (loop) => set({ loop }),

  playByPath: async (path) => {
    destroyHowl(get().howl);
    const idx = get().playlist.indexOf(path);
    const h = new Howl({
      src: [path],
      volume: get().volume / 100,
      loop: get().loop === 'one',
      onplay: () => set({ isPlaying: true }),
      onpause: () => set({ isPlaying: false }),
      onstop: () => set({ isPlaying: false }),
      onend: () => {
        if (get().loop === 'one') {
          // Howl 自带 loop=true 会自动重播
          return;
        }
        // 全部播完 -> 下一首或停止
        get().next();
      },
      onloaderror: () => {
        showNotification('FocusFlow', `音频加载失败: ${path}`);
        set({ isPlaying: false });
      },
      onplayerror: () => {
        showNotification('FocusFlow', `音频播放失败: ${path}`);
        set({ isPlaying: false });
      }
    });
    set({ howl: h, currentIndex: idx });
    persistIndex(idx);
    h.play();
  }
}));
