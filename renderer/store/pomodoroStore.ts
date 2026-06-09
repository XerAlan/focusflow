/**
 * 番茄时钟 Store
 * - 计时器基于 setInterval（每秒扣减一次）
 * - 状态 + 历史持久化（崩溃恢复）
 * - 完成专注时记录一条 PomodoroSession
 */
import { create } from 'zustand';
import type {
  PomodoroPhase,
  PomodoroSession,
  PomodoroState
} from '../../shared/types';
import { loadFromStore, saveToStore } from './persist';
import { phaseDuration, nextPhase } from '../utils/timer';
import { useSettingsStore } from './settingsStore';
import { showNotification } from '../ipc';

const STATE_KEY = 'pomodoroState';
const HISTORY_KEY = 'pomodoroHistory';

interface PomodoroStore extends PomodoroState {
  history: PomodoroSession[];
  intervalId: ReturnType<typeof setInterval> | null;
  loaded: boolean;
  hydrate: () => Promise<void>;
  start: () => void;
  pause: () => void;
  reset: () => void;
  skipPhase: () => void;
  /** 钩子：阶段完成后调用，记录历史 + 切到下一阶段 */
  onPhaseComplete: () => void;
  setPhase: (phase: PomodoroPhase) => void;
  /** 崩溃恢复：若发现状态为 running，根据 sessionStartedAt + 设置时长推算剩余 */
  recover: () => void;
  /** 强制从设置同步计时长度（如修改了番茄时长） */
  syncFromSettings: () => void;
  getHistory: () => PomodoroSession[];
}

const persistState = (state: PomodoroState) =>
  saveToStore(STATE_KEY, state);

const persistHistory = (history: PomodoroSession[]) =>
  saveToStore(HISTORY_KEY, history);

export const usePomodoroStore = create<PomodoroStore>((set, get) => ({
  phase: 'focus',
  status: 'idle',
  remainingSeconds: 25 * 60,
  totalSeconds: 25 * 60,
  completedFocusCount: 0,
  sessionStartedAt: null,
  history: [],
  intervalId: null,
  loaded: false,

  hydrate: async () => {
    const [state, history] = await Promise.all([
      loadFromStore<PomodoroState | null>(STATE_KEY, null),
      loadFromStore<PomodoroSession[]>(HISTORY_KEY, [])
    ]);

    // 同步最新设置
    const settings = useSettingsStore.getState();
    const focusLen = settings.pomodoroDuration * 60;

    if (state) {
      set({
        phase: state.phase || 'focus',
        status: state.status === 'running' ? 'paused' : state.status, // 启动后默认暂停，避免用户疑惑
        remainingSeconds:
          state.remainingSeconds && state.remainingSeconds > 0
            ? state.remainingSeconds
            : phaseDuration(state.phase, settings),
        totalSeconds:
          state.totalSeconds || phaseDuration(state.phase, settings),
        completedFocusCount: state.completedFocusCount || 0,
        sessionStartedAt: null,
        history,
        loaded: true
      });
    } else {
      set({
        phase: 'focus',
        status: 'idle',
        remainingSeconds: focusLen,
        totalSeconds: focusLen,
        completedFocusCount: 0,
        sessionStartedAt: null,
        history,
        loaded: true
      });
    }
  },

  recover: () => {
    // 若启动时检测到上次 session 正在运行，根据 startedAt 推算
    const s = useSettingsStore.getState();
    const { sessionStartedAt, phase, status } = get();
    if (status === 'running' && sessionStartedAt) {
      const elapsed = Math.floor(
        (Date.now() - new Date(sessionStartedAt).getTime()) / 1000
      );
      const total = phaseDuration(phase, s);
      const remaining = Math.max(0, total - elapsed);
      if (remaining <= 0) {
        // 已经超时完成
        get().onPhaseComplete();
      } else {
        set({ remainingSeconds: remaining });
      }
    }
  },

  syncFromSettings: () => {
    // 仅在 idle 状态同步
    if (get().status !== 'idle') return;
    const s = useSettingsStore.getState();
    const total = phaseDuration(get().phase, s);
    set({ totalSeconds: total, remainingSeconds: total });
    persistState({
      phase: get().phase,
      status: get().status,
      remainingSeconds: total,
      totalSeconds: total,
      completedFocusCount: get().completedFocusCount,
      sessionStartedAt: null
    });
  },

  start: () => {
    if (get().status === 'running') return;
    if (get().remainingSeconds <= 0) {
      // 已归零 -> 重置当前阶段
      const s = useSettingsStore.getState();
      const total = phaseDuration(get().phase, s);
      set({ remainingSeconds: total, totalSeconds: total });
    }
    set({
      status: 'running',
      sessionStartedAt: new Date().toISOString()
    });

    // 清除旧 interval
    if (get().intervalId) clearInterval(get().intervalId);

    const id = setInterval(() => {
      const { remainingSeconds, status } = get();
      if (status !== 'running') return;
      const next = remainingSeconds - 1;
      if (next <= 0) {
        get().onPhaseComplete();
      } else {
        set({ remainingSeconds: next });
      }
    }, 1000);
    set({ intervalId: id });
  },

  pause: () => {
    if (get().intervalId) {
      clearInterval(get().intervalId);
      set({ intervalId: null });
    }
    set({ status: 'paused', sessionStartedAt: null });
  },

  reset: () => {
    if (get().intervalId) clearInterval(get().intervalId);
    set({ intervalId: null });
    const s = useSettingsStore.getState();
    const total = phaseDuration(get().phase, s);
    set({
      status: 'idle',
      remainingSeconds: total,
      totalSeconds: total,
      sessionStartedAt: null
    });
  },

  skipPhase: () => {
    if (get().intervalId) clearInterval(get().intervalId);
    set({ intervalId: null });
    get().onPhaseComplete();
  },

  onPhaseComplete: () => {
    // 1. 记录历史
    const { phase, completedFocusCount, history } = get();
    if (phase === 'focus') {
      const s = useSettingsStore.getState();
      const session: PomodoroSession = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        timestamp: new Date().toISOString(),
        durationMinutes: s.pomodoroDuration,
        type: 'focus'
      };
      const newHistory = [session, ...history];
      set({ history: newHistory });
      persistHistory(newHistory);
      showNotification('FocusFlow', `专注完成！休息一下吧。`);
    } else {
      showNotification('FocusFlow', '休息结束，准备下一轮专注');
    }

    // 2. 切换到下一阶段
    const { next, newCompletedFocusCount } = nextPhase(phase, completedFocusCount);
    const settings = useSettingsStore.getState();
    const newTotal = phaseDuration(next, settings);

    set({
      phase: next,
      completedFocusCount: newCompletedFocusCount,
      totalSeconds: newTotal,
      remainingSeconds: newTotal,
      status: 'idle',
      sessionStartedAt: null
    });
    // 持久化阶段状态
    persistState({
      phase: next,
      status: 'idle',
      remainingSeconds: newTotal,
      totalSeconds: newTotal,
      completedFocusCount: newCompletedFocusCount,
      sessionStartedAt: null
    });
  },

  setPhase: (phase) => {
    const s = useSettingsStore.getState();
    const total = phaseDuration(phase, s);
    set({
      phase,
      totalSeconds: total,
      remainingSeconds: total,
      status: 'idle',
      sessionStartedAt: null
    });
  },

  getHistory: () => get().history
}));

// 监听设置变化 -> idle 时同步计时长度
useSettingsStore.subscribe((s, prev) => {
  if (
    s.pomodoroDuration !== prev.pomodoroDuration ||
    s.shortBreakDuration !== prev.shortBreakDuration ||
    s.longBreakDuration !== prev.longBreakDuration
  ) {
    usePomodoroStore.getState().syncFromSettings();
  }
});
