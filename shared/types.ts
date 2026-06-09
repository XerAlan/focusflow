// 共享 TypeScript 类型定义（主进程与渲染进程复用）

// 预设软件（主界面网格用）
export interface PresetApp {
  id: string;
  name: string;
  path: string; // 绝对路径或可执行文件名
}

// 工作模式中的启动项（可引用预设，也可独立）
export interface WorkModeAppItem {
  id: string;
  name: string;
  path: string;
  type: 'preset' | 'custom';
  presetRefId?: string;
}

export interface WorkModeUrlItem {
  id: string;
  name: string;
  url: string;
}

export interface WorkModeConfig {
  appItems: WorkModeAppItem[];
  urlItems: WorkModeUrlItem[];
  defaultAudioPath: string | null;
}

export interface TodoItem {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  createdAt: string;
  order: number;
}

// 完成的番茄记录
export interface PomodoroSession {
  id: string;
  timestamp: string; // ISO 字符串
  durationMinutes: number;
  type: 'focus' | 'shortBreak' | 'longBreak';
}

// 每日留言
export interface DailyNote {
  date: string; // yyyy-mm-dd（本地日期）
  content: string;
  updatedAt: string; // ISO 字符串
}

export type PomodoroPhase = 'focus' | 'shortBreak' | 'longBreak';
export type PomodoroStatus = 'idle' | 'running' | 'paused';

export interface PomodoroState {
  phase: PomodoroPhase;
  status: PomodoroStatus;
  // 剩余秒数
  remainingSeconds: number;
  // 当前阶段总秒数（用于进度条计算）
  totalSeconds: number;
  // 已完成专注计数（用于 4 个一轮切长休息）
  completedFocusCount: number;
  // 当前会话起始时间戳（用于崩溃恢复）
  sessionStartedAt: string | null;
}

export interface UserSettings {
  pomodoroDuration: number; // 分钟
  shortBreakDuration: number;
  longBreakDuration: number;
  defaultVolume: number; // 0-100
  autoStartup: boolean;
  presetApps: PresetApp[];
  workMode: WorkModeConfig;
  theme: 'dark' | 'light';
}

// IPC 通信契约
export interface LaunchResult {
  name: string;
  path: string;
  success: boolean;
  error?: string;
}

export interface OpenUrlResult {
  name: string;
  url: string;
  success: boolean;
  error?: string;
}

export interface SelectAudioFileResult {
  canceled: boolean;
  filePaths: string[];
}

// 暴露给渲染进程的 window.api
export interface ElectronAPI {
  launchApp: (path: string) => Promise<LaunchResult>;
  launchAppsBatch: (items: { name: string; path: string }[]) => Promise<LaunchResult[]>;
  openUrl: (url: string) => Promise<{ success: boolean; error?: string }>;
  openUrlsBatch: (items: { name: string; url: string }[]) => Promise<OpenUrlResult[]>;
  selectAudioFile: (options?: { multiple?: boolean }) => Promise<SelectAudioFileResult>;
  selectExeFile: () => Promise<{ canceled: boolean; filePath: string }>;
  toggleFullscreen: (isFull: boolean) => Promise<void>;
  getAppVersion: () => Promise<string>;
  setAutoStartup: (enabled: boolean) => Promise<{ success: boolean; error?: string }>;
  showNotification: (title: string, body: string) => Promise<void>;
  // electron-store 简易封装
  storeGet: (key: string) => Promise<unknown>;
  storeSet: (key: string, value: unknown) => Promise<void>;
  storeDelete: (key: string) => Promise<void>;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
