/**
 * 通用 store 持久化辅助
 * - 从 electron-store 加载（通过 IPC）
 * - 防抖写入，避免频繁 IO
 */
import { store } from '../ipc';

const pendingTimers = new Map<string, ReturnType<typeof setTimeout>>();

export const loadFromStore = async <T>(key: string, fallback: T): Promise<T> => {
  try {
    const v = await store.get<T>(key);
    if (v === undefined || v === null) return fallback;
    return v;
  } catch (err) {
    console.warn(`[persist] load ${key} failed`, err);
    return fallback;
  }
};

export const saveToStore = (key: string, value: unknown, delay = 250): void => {
  // 清除上一次定时器
  const existing = pendingTimers.get(key);
  if (existing) clearTimeout(existing);
  const t = setTimeout(() => {
    store.set(key, value).catch((err) => {
      console.warn(`[persist] save ${key} failed`, err);
    });
    pendingTimers.delete(key);
  }, delay);
  pendingTimers.set(key, t);
};
