/**
 * 通用 UI Store
 * - 全屏、设置模态框、Toast 队列
 */
import { create } from 'zustand';

export type ToastKind = 'info' | 'success' | 'error' | 'warning';
export interface ToastItem {
  id: string;
  message: string;
  kind: ToastKind;
}

interface UIStore {
  isFullscreen: boolean;
  setFullscreen: (v: boolean) => void;
  settingsOpen: boolean;
  openSettings: () => void;
  closeSettings: () => void;
  notesOpen: boolean;
  openNotes: () => void;
  closeNotes: () => void;
  toasts: ToastItem[];
  toast: (message: string, kind?: ToastKind) => void;
  dismissToast: (id: string) => void;
  workModeLaunching: boolean;
  setWorkModeLaunching: (v: boolean) => void;
  statusMessage: string;
  setStatusMessage: (msg: string) => void;
}

const newToastId = () => `t-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

export const useUIStore = create<UIStore>((set, get) => ({
  isFullscreen: false,
  setFullscreen: (v) => set({ isFullscreen: v }),

  settingsOpen: false,
  openSettings: () => set({ settingsOpen: true }),
  closeSettings: () => set({ settingsOpen: false }),

  notesOpen: false,
  openNotes: () => set({ notesOpen: true }),
  closeNotes: () => set({ notesOpen: false }),

  toasts: [],
  toast: (message, kind = 'info') => {
    const id = newToastId();
    set({ toasts: [...get().toasts, { id, message, kind }] });
    setTimeout(() => {
      set({ toasts: get().toasts.filter((t) => t.id !== id) });
    }, 4000);
  },
  dismissToast: (id) => set({ toasts: get().toasts.filter((t) => t.id !== id) }),

  workModeLaunching: false,
  setWorkModeLaunching: (v) => set({ workModeLaunching: v }),

  statusMessage: '',
  setStatusMessage: (msg) => set({ statusMessage: msg })
}));
