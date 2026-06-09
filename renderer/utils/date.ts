/**
 * 日期工具函数
 * - 自然日聚合
 * - 格式化
 */
import type { PomodoroSession } from '../../shared/types';

/** 获取 yyyy-mm-dd 形式的本地日期 */
export const localDateKey = (d: Date = new Date()): string => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

/** 同一天判断 */
export const isSameLocalDay = (a: Date, b: Date): boolean =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

/**
 * 按自然日聚合专注分钟数
 * @param sessions 番茄历史
 * @param days 返回最近 days 天的数据（含 0 分钟日期）
 */
export const aggregateByDay = (
  sessions: PomodoroSession[],
  days: number = 7
): { date: string; label: string; minutes: number }[] => {
  const map = new Map<string, number>();
  for (const s of sessions) {
    if (s.type !== 'focus') continue;
    const d = new Date(s.timestamp);
    const key = localDateKey(d);
    map.set(key, (map.get(key) || 0) + s.durationMinutes);
  }

  const out: { date: string; label: string; minutes: number }[] = [];
  const now = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    const key = localDateKey(d);
    out.push({
      date: key,
      label: `${d.getMonth() + 1}/${d.getDate()}`,
      minutes: map.get(key) || 0
    });
  }
  return out;
};

/** 今日专注总分钟 */
export const todayMinutes = (sessions: PomodoroSession[]): number => {
  const today = localDateKey();
  return sessions
    .filter((s) => s.type === 'focus' && localDateKey(new Date(s.timestamp)) === today)
    .reduce((sum, s) => sum + s.durationMinutes, 0);
};

/** 本周专注总分钟（自然周：周日起） */
export const thisWeekMinutes = (sessions: PomodoroSession[]): number => {
  const now = new Date();
  const day = now.getDay(); // 0=Sun
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  start.setDate(now.getDate() - day);
  return sessions
    .filter((s) => s.type === 'focus' && new Date(s.timestamp) >= start)
    .reduce((sum, s) => sum + s.durationMinutes, 0);
};
