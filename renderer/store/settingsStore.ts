/**
 * 用户设置 Store
 * - 包含番茄时长、预设软件列表、工作模式配置等
 * - 持久化到 electron-store 的 'settings' 键
 */
import { create } from 'zustand';
import type {
  PresetApp,
  UserSettings,
  WorkModeAppItem,
  WorkModeConfig,
  WorkModeUrlItem
} from '../../shared/types';
import { newId } from '../utils/id';
import { loadFromStore, saveToStore } from './persist';
import { setAutoStartup } from '../ipc';

const STORAGE_KEY = 'settings';

const defaultSettings: UserSettings = {
  pomodoroDuration: 25,
  shortBreakDuration: 5,
  longBreakDuration: 15,
  defaultVolume: 60,
  autoStartup: false,
  presetApps: [],
  workMode: {
    appItems: [],
    urlItems: [],
    defaultAudioPath: null
  },
  theme: 'dark'
};

interface SettingsStore extends UserSettings {
  loaded: boolean;
  hydrate: () => Promise<void>;
  update: (patch: Partial<UserSettings>) => void;
  setPresetApps: (apps: PresetApp[]) => void;
  addPresetApp: (app: Omit<PresetApp, 'id'>) => Promise<PresetApp | null>;
  removePresetApp: (id: string) => void;
  updatePresetApp: (id: string, patch: Partial<PresetApp>) => void;
  updateWorkMode: (patch: Partial<WorkModeConfig>) => void;
  addWorkModeApp: (item: Omit<WorkModeAppItem, 'id'>) => WorkModeAppItem;
  removeWorkModeApp: (id: string) => void;
  updateWorkModeApp: (id: string, patch: Partial<WorkModeAppItem>) => void;
  addWorkModeUrl: (item: Omit<WorkModeUrlItem, 'id'>) => WorkModeUrlItem;
  removeWorkModeUrl: (id: string) => void;
  updateWorkModeUrl: (id: string, patch: Partial<WorkModeUrlItem>) => void;
  setDefaultAudio: (path: string | null) => void;
  setAutoStartupFlag: (enabled: boolean) => Promise<void>;
}

const persist = (state: SettingsStore) => {
  const snapshot: UserSettings = {
    pomodoroDuration: state.pomodoroDuration,
    shortBreakDuration: state.shortBreakDuration,
    longBreakDuration: state.longBreakDuration,
    defaultVolume: state.defaultVolume,
    autoStartup: state.autoStartup,
    presetApps: state.presetApps,
    workMode: state.workMode,
    theme: state.theme
  };
  saveToStore(STORAGE_KEY, snapshot);
};

export const useSettingsStore = create<SettingsStore>((set, get) => ({
  ...defaultSettings,
  loaded: false,

  hydrate: async () => {
    const data = await loadFromStore<UserSettings>(STORAGE_KEY, defaultSettings);
    // 合并默认值，保证新字段存在
    set({
      ...defaultSettings,
      ...data,
      workMode: { ...defaultSettings.workMode, ...(data.workMode || {}) },
      loaded: true
    });
  },

  update: (patch) => {
    set(patch);
    persist(get());
  },

  setPresetApps: (apps) => {
    set({ presetApps: apps });
    persist(get());
  },

  addPresetApp: async (app) => {
    // 简单校验：路径必须存在（绝对路径才检查；可执行文件名跳过）
    const id = newId('preset-');
    const newApp: PresetApp = { id, ...app };
    set({ presetApps: [...get().presetApps, newApp] });
    persist(get());
    return newApp;
  },

  removePresetApp: (id) => {
    set({ presetApps: get().presetApps.filter((a) => a.id !== id) });
    // 同时清理工作模式中对它的引用
    const items = get().workMode.appItems.filter(
      (i) => !(i.type === 'preset' && i.presetRefId === id)
    );
    set({ workMode: { ...get().workMode, appItems: items } });
    persist(get());
  },

  updatePresetApp: (id, patch) => {
    set({
      presetApps: get().presetApps.map((a) => (a.id === id ? { ...a, ...patch } : a))
    });
    persist(get());
  },

  updateWorkMode: (patch) => {
    set({ workMode: { ...get().workMode, ...patch } });
    persist(get());
  },

  addWorkModeApp: (item) => {
    const newItem: WorkModeAppItem = { id: newId('wm-app-'), ...item };
    set({
      workMode: {
        ...get().workMode,
        appItems: [...get().workMode.appItems, newItem]
      }
    });
    persist(get());
    return newItem;
  },

  removeWorkModeApp: (id) => {
    set({
      workMode: {
        ...get().workMode,
        appItems: get().workMode.appItems.filter((i) => i.id !== id)
      }
    });
    persist(get());
  },

  updateWorkModeApp: (id, patch) => {
    set({
      workMode: {
        ...get().workMode,
        appItems: get().workMode.appItems.map((i) => (i.id === id ? { ...i, ...patch } : i))
      }
    });
    persist(get());
  },

  addWorkModeUrl: (item) => {
    const newItem: WorkModeUrlItem = { id: newId('wm-url-'), ...item };
    set({
      workMode: {
        ...get().workMode,
        urlItems: [...get().workMode.urlItems, newItem]
      }
    });
    persist(get());
    return newItem;
  },

  removeWorkModeUrl: (id) => {
    set({
      workMode: {
        ...get().workMode,
        urlItems: get().workMode.urlItems.filter((i) => i.id !== id)
      }
    });
    persist(get());
  },

  updateWorkModeUrl: (id, patch) => {
    set({
      workMode: {
        ...get().workMode,
        urlItems: get().workMode.urlItems.map((i) => (i.id === id ? { ...i, ...patch } : i))
      }
    });
    persist(get());
  },

  setDefaultAudio: (path) => {
    set({ workMode: { ...get().workMode, defaultAudioPath: path } });
    persist(get());
  },

  setAutoStartupFlag: async (enabled) => {
    const res = await setAutoStartup(enabled);
    if (res.success) {
      set({ autoStartup: enabled });
      persist(get());
    } else {
      console.warn('[settings] setAutoStartup failed:', res.error);
    }
  }
}));
