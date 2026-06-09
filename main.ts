/**
 * Electron 主进程入口
 *
 * 职责：
 *  1. 创建并管理 BrowserWindow（主窗口）
 *  2. 注册 IPC 处理器（启动应用、打开网址、文件对话框、全屏切换、开机自启、通知）
 *  3. 通过 preload 暴露受限 API 给渲染进程（安全模型）
 *  4. 监听应用生命周期
 *
 * 性能/可靠性要点：
 *  - 启动应用时使用 detached: true，避免被父进程生命周期影响
 *  - 启动路径无效时返回结构化错误，不抛出
 *  - 错误统一使用 console.error 记录，不阻塞 UI
 */
import {
  app,
  BrowserWindow,
  ipcMain,
  dialog,
  shell,
  screen,
  Notification
} from 'electron';
import { spawn } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';
import Store from 'electron-store';

// -----------------------------
// 持久化存储（使用 electron-store）
// -----------------------------
type StoreSchema = {
  settings: any;
  todos: any[];
  pomodoroState: any;
  pomodoroHistory: any[];
};

const store = new Store<StoreSchema>({
  name: 'focusflow-data',
  defaults: {
    settings: {
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
    },
    todos: [],
    pomodoroState: null,
    pomodoroHistory: []
  }
});

// 单一窗口引用
let mainWindow: BrowserWindow | null = null;

/**
 * 创建主窗口
 * - 开发模式：连接 Vite dev server
 * - 生产模式：加载 dist/renderer/index.html
 */
function createWindow() {
  const display = screen.getPrimaryDisplay();
  const { width, height } = display.workAreaSize;

  mainWindow = new BrowserWindow({
    width: Math.min(1440, width),
    height: Math.min(900, height),
    minWidth: 1100,
    minHeight: 700,
    backgroundColor: '#1E1E2F',
    title: 'FocusFlow',
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  });

  // 窗口准备好后显示，避免闪烁
  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  // 加载入口
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }

  // 拦截外链，使用系统浏览器打开
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // 监听 F11 切换全屏
  mainWindow.webContents.on('before-input-event', (event, input) => {
    if (input.key === 'F11') {
      mainWindow?.setFullScreen(!mainWindow.isFullScreen());
      event.preventDefault();
    }
  });
}

// -----------------------------
// IPC 处理器
// -----------------------------

/**
 * 启动单个应用程序
 * - 使用 child_process.spawn 异步启动，不阻塞主进程
 * - 路径为空 / 文件不存在 返回结构化错误
 */
ipcMain.handle('launch-app', async (_evt, payload: { path: string }) => {
  return launchSingleApp(payload.path, payload.path);
});

/**
 * 批量启动应用（工作模式使用）
 * - 并行启动（不阻塞 UI）
 * - 返回每项启动结果
 */
ipcMain.handle(
  'launch-apps-batch',
  async (_evt, payload: { items: { name: string; path: string }[] }) => {
    const results = await Promise.all(
      payload.items.map((item) => launchSingleApp(item.path, item.name))
    );
    return results;
  }
);

/**
 * 在系统默认浏览器中打开单个 URL
 */
ipcMain.handle('open-url', async (_evt, payload: { url: string }) => {
  return openSingleUrl(payload.url);
});

/**
 * 批量打开 URL
 */
ipcMain.handle(
  'open-urls-batch',
  async (_evt, payload: { urls: { name: string; url: string }[] }) => {
    return Promise.all(
      payload.urls.map(async (item) => {
        const result = await openSingleUrl(item.url);
        return { name: item.name, url: item.url, ...result };
      })
    );
  }
);

/**
 * 打开文件选择对话框选择音频文件
 */
ipcMain.handle(
  'select-audio-file',
  async (_evt, options?: { multiple?: boolean }) => {
    const result = await dialog.showOpenDialog(mainWindow!, {
      title: '选择音频文件',
      properties: options?.multiple
        ? ['openFile', 'multiSelections']
        : ['openFile'],
      filters: [
        { name: '音频', extensions: ['mp3', 'wav', 'ogg', 'flac'] }
      ]
    });
    return {
      canceled: result.canceled,
      filePaths: result.filePaths
    };
  }
);

/**
 * 保存文本文件（导出 Markdown 用）
 * - 弹出保存对话框
 * - 写入 UTF-8 文本
 */
ipcMain.handle(
  'save-text-file',
  async (
    _evt,
    options: {
      defaultName: string;
      content: string;
      filters?: { name: string; extensions: string[] }[];
    }
  ) => {
    try {
      const result = await dialog.showSaveDialog(mainWindow!, {
        title: '保存文件',
        defaultPath: options.defaultName,
        filters: options.filters || [
          { name: '所有文件', extensions: ['*'] }
        ]
      });
      if (result.canceled || !result.filePath) {
        return { canceled: true };
      }
      // 写入文件
      fs.writeFileSync(result.filePath, options.content, {
        encoding: 'utf-8'
      });
      return { canceled: false, filePath: result.filePath };
    } catch (err: any) {
      return { canceled: false, error: err?.message || String(err) };
    }
  }
);

/**
 * 选择可执行文件（添加预设软件时使用）
 */
ipcMain.handle('select-exe-file', async () => {
  const result = await dialog.showOpenDialog(mainWindow!, {
    title: '选择应用程序',
    properties: ['openFile'],
    filters: [
      { name: '可执行文件', extensions: ['exe', 'bat', 'cmd'] },
      { name: '所有文件', extensions: ['*'] }
    ]
  });
  return {
    canceled: result.canceled,
    filePath: result.filePaths[0] || ''
  };
});

/**
 * 切换全屏
 */
ipcMain.handle('toggle-fullscreen', async (_evt, payload: { isFull: boolean }) => {
  if (mainWindow) {
    mainWindow.setFullScreen(payload.isFull);
  }
});

/**
 * 获取应用版本
 */
ipcMain.handle('get-app-version', async () => app.getVersion());

/**
 * 设置开机自启（通过 Electron API 操作注册表）
 */
ipcMain.handle('set-auto-startup', async (_evt, payload: { enabled: boolean }) => {
  try {
    if (process.platform === 'win32') {
      app.setLoginItemSettings({
        openAtLogin: payload.enabled,
        path: process.execPath,
        args: []
      });
      return { success: true };
    }
    // 非 Windows 平台：未实现
    return { success: false, error: '当前平台不支持开机自启' };
  } catch (err: any) {
    return { success: false, error: err?.message || String(err) };
  }
});

/**
 * 发送 Windows 原生通知
 */
ipcMain.handle('show-notification', async (_evt, title: string, body: string) => {
  if (Notification.isSupported()) {
    new Notification({ title, body, silent: false }).show();
  }
});

// -----------------------------
// electron-store 简易封装
// -----------------------------
ipcMain.handle('store-get', async (_evt, key: string) => store.get(key));
ipcMain.handle('store-set', async (_evt, key: string, value: unknown) => {
  store.set(key, value as any);
});
ipcMain.handle('store-delete', async (_evt, key: string) => {
  store.delete(key as any);
});

// -----------------------------
// 工具函数
// -----------------------------

/**
 * 启动单个应用程序
 *  - 检查路径存在性（仅对绝对路径做检查）
 *  - 使用 detached + unref 避免主进程与子进程耦合
 */
async function launchSingleApp(targetPath: string, displayName: string) {
  try {
    if (!targetPath) {
      return {
        name: displayName,
        path: targetPath,
        success: false,
        error: '路径为空'
      };
    }

    // 仅对绝对路径做文件存在检查；可执行文件名（PATH 中查找）跳过
    const isAbsolute = /^[a-zA-Z]:[\\/]/.test(targetPath) || targetPath.startsWith('\\\\');
    if (isAbsolute && !fs.existsSync(targetPath)) {
      return {
        name: displayName,
        path: targetPath,
        success: false,
        error: '文件不存在'
      };
    }

    const child = spawn(targetPath, [], {
      detached: true,
      stdio: 'ignore',
      shell: false
    });
    // unref 让子进程独立于主进程生命周期
    child.unref();

    child.on('error', (err) => {
      console.error(`[launch-app] ${displayName} 启动失败:`, err);
    });

    return {
      name: displayName,
      path: targetPath,
      success: true
    };
  } catch (err: any) {
    return {
      name: displayName,
      path: targetPath,
      success: false,
      error: err?.message || String(err)
    };
  }
}

/**
 * 在系统默认浏览器中打开 URL
 */
async function openSingleUrl(url: string) {
  try {
    if (!/^https?:\/\//i.test(url)) {
      return { success: false, error: 'URL 必须以 http:// 或 https:// 开头' };
    }
    await shell.openExternal(url);
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || String(err) };
  }
}

// -----------------------------
// 应用生命周期
// -----------------------------

// 必须在 app.whenReady() 之前调用，关闭硬件加速以避免部分 Windows 环境下的白屏
app.disableHardwareAcceleration();

// 单实例锁：避免重复启动
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
}

app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
