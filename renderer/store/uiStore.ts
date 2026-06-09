/**
 * 通用 UI Store
 * - 全屏、设置模态框、Toast 队列
 * - 专注完成弹窗事件
 */
import { create } from 'zustand';

export type ToastKind = 'info' | 'success' | 'error' | 'warning';
export interface ToastItem {
  id: string;
  message: string;
  kind: ToastKind;
}

export interface FocusCompleteDialog {
  // 完成的专注分钟数
  durationMinutes: number;
  // 完成后跳到哪个阶段
  nextPhase: 'shortBreak' | 'longBreak';
  // 弹窗的 key，用于强制刷新
  nonce: number;
}

interface UIStore {
  isFullscreen: boolean;
  setFullscreen: (v: boolean) => void;
  settingsOpen: boolean;
  openSettings: () => void;
  closeSettings: () => void;
  toasts: ToastItem[];
  toast: (message: string, kind?: ToastKind) => void;
  dismissToast: (id: string) => void;
  workModeLaunching: boolean;
  setWorkModeLaunching: (v: boolean) => void;
  statusMessage: string;
  setStatusMessage: (msg: string) => void;
  focusCompleteDialog: FocusCompleteDialog | null;
  showFocusComplete: (info: Omit<FocusCompleteDialog, 'nonce'>) => void;
  dismissFocusComplete: () => void;
}

const newToastId = () => `t-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

export const useUIStore = create<UIStore>((set, get) => ({
  isFullscreen: false,
  setFullscreen: (v) => set({ isFullscreen: v }),

  settingsOpen: false,
  openSettings: () => set({ settingsOpen: true }),
  closeSettings: () => set({ settingsOpen: false }),

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
  setStatusMessage: (msg) => set({ statusMessage: msg }),

  focusCompleteDialog: null,
  showFocusComplete: (info) => {
    set({
      focusCompleteDialog: { ...info, nonce: Date.now() }
    });
  },
  dismissFocusComplete: () => set({ focusCompleteDialog: null })
}));
