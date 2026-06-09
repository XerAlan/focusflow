/**
 * IPC 调用统一封装
 * - 所有主进程交互都通过 window.electronAPI 暴露
 * - 该模块在调用方进行二次封装，便于类型安全 + 集中修改
 */
import type {
  LaunchResult,
  OpenUrlResult,
  SelectAudioFileResult
} from '../../shared/types';

const api = (): NonNullable<typeof window.electronAPI> => {
  if (!window.electronAPI) {
    throw new Error('electronAPI 未注入（preload 未正确加载？）');
  }
  return window.electronAPI;
};

/** 启动单个应用 */
export const launchApp = (appPath: string): Promise<LaunchResult> =>
  api().launchApp(appPath);

/** 批量启动应用（工作模式） */
export const launchAppsBatch = (
  items: { name: string; path: string }[]
): Promise<LaunchResult[]> => api().launchAppsBatch(items);

/** 打开单个 URL */
export const openUrl = (
  url: string
): Promise<{ success: boolean; error?: string }> => api().openUrl(url);

/** 批量打开 URL（工作模式） */
export const openUrlsBatch = (
  items: { name: string; url: string }[]
): Promise<OpenUrlResult[]> => api().openUrlsBatch(items);

/** 选择音频文件 */
export const selectAudioFile = (
  options?: { multiple?: boolean }
): Promise<SelectAudioFileResult> => api().selectAudioFile(options);

/** 选择可执行文件 */
export const selectExeFile = (): Promise<{ canceled: boolean; filePath: string }> =>
  api().selectExeFile();

/** 切换全屏 */
export const toggleFullscreen = (isFull: boolean): Promise<void> =>
  api().toggleFullscreen(isFull);

/** 获取应用版本 */
export const getAppVersion = (): Promise<string> => api().getAppVersion();

/** 设置开机自启 */
export const setAutoStartup = (enabled: boolean): Promise<{ success: boolean; error?: string }> =>
  api().setAutoStartup(enabled);

/** 发送通知 */
export const showNotification = (title: string, body: string): Promise<void> =>
  api().showNotification(title, body);

/** electron-store 持久化（通过主进程间接访问，更安全） */
export const store = {
  get: <T = unknown>(key: string): Promise<T> => api().storeGet(key) as Promise<T>,
  set: (key: string, value: unknown): Promise<void> => api().storeSet(key, value),
  delete: (key: string): Promise<void> => api().storeDelete(key)
};
