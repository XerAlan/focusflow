/**
 * 番茄计时器工具函数
 * - 时间格式化
 * - 进度计算
 * - 阶段切换逻辑
 */
import type { PomodoroPhase } from '../../shared/types';

export const formatTime = (totalSeconds: number): { m: string; s: string } => {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const m = Math.floor(safe / 60);
  const s = safe % 60;
  return {
    m: String(m).padStart(2, '0'),
    s: String(s).padStart(2, '0')
  };
};

export const phaseLabel = (phase: PomodoroPhase): string => {
  switch (phase) {
    case 'focus':
      return '专注';
    case 'shortBreak':
      return '短休息';
    case 'longBreak':
      return '长休息';
  }
};

export const phaseDuration = (
  phase: PomodoroPhase,
  settings: { pomodoroDuration: number; shortBreakDuration: number; longBreakDuration: number }
): number => {
  switch (phase) {
    case 'focus':
      return settings.pomodoroDuration * 60;
    case 'shortBreak':
      return settings.shortBreakDuration * 60;
    case 'longBreak':
      return settings.longBreakDuration * 60;
  }
};

/**
 * 根据已完成专注数决定下一阶段
 * - 4 个 focus 一次循环：focus → shortBreak × 3 → longBreak
 * - 简化：focus 后第 1/2/3 次进入 shortBreak，第 4 次进入 longBreak
 */
export const nextPhase = (
  current: PomodoroPhase,
  completedFocusCount: number
): { next: PomodoroPhase; newCompletedFocusCount: number } => {
  if (current === 'focus') {
    const newCount = completedFocusCount + 1;
    if (newCount % 4 === 0) {
      return { next: 'longBreak', newCompletedFocusCount: newCount };
    }
    return { next: 'shortBreak', newCompletedFocusCount: newCount };
  }
  // 休息结束 -> 回到 focus
  return { next: 'focus', newCompletedFocusCount: completedFocusCount };
};
