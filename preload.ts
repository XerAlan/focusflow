/**
 * Electron 预加载脚本
 *
 * 安全模型：
 *  - contextIsolation = true：渲染进程与主进程环境隔离
 *  - 仅通过 contextBridge 暴露最小且必要的 API
 *  - 所有 IPC 调用都通过 ipcRenderer.invoke 走异步通道
 */
import { contextBridge, ipcRenderer } from 'electron';
import type {
  ElectronAPI,
  LaunchResult,
  OpenUrlResult,
  SelectAudioFileResult
} from './shared/types';

const api: ElectronAPI = {
  launchApp: (appPath: string) =>
    ipcRenderer.invoke('launch-app', { path: appPath }) as Promise<LaunchResult>,

  launchAppsBatch: (items) =>
    ipcRenderer.invoke('launch-apps-batch', { items }) as Promise<LaunchResult[]>,

  openUrl: (url: string) =>
    ipcRenderer.invoke('open-url', { url }) as Promise<{ success: boolean; error?: string }>,

  openUrlsBatch: (items) =>
    ipcRenderer.invoke('open-urls-batch', { urls: items }) as Promise<OpenUrlResult[]>,

  selectAudioFile: (options) =>
    ipcRenderer.invoke('select-audio-file', options) as Promise<SelectAudioFileResult>,

  selectExeFile: () =>
    ipcRenderer.invoke('select-exe-file') as Promise<{ canceled: boolean; filePath: string }>,

  saveTextFile: (options) =>
    ipcRenderer.invoke('save-text-file', options) as Promise<{
      canceled: boolean;
      filePath?: string;
      error?: string;
    }>,

  toggleFullscreen: (isFull: boolean) =>
    ipcRenderer.invoke('toggle-fullscreen', { isFull }),

  getAppVersion: () => ipcRenderer.invoke('get-app-version') as Promise<string>,

  setAutoStartup: (enabled: boolean) =>
    ipcRenderer.invoke('set-auto-startup', { enabled }) as Promise<{ success: boolean; error?: string }>,

  showNotification: (title: string, body: string) =>
    ipcRenderer.invoke('show-notification', title, body),

  // electron-store 简易封装
  storeGet: (key: string) => ipcRenderer.invoke('store-get', key),
  storeSet: (key: string, value: unknown) =>
    ipcRenderer.invoke('store-set', key, value),
  storeDelete: (key: string) => ipcRenderer.invoke('store-delete', key)
};

contextBridge.exposeInMainWorld('electronAPI', api);
