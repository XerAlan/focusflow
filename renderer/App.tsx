/**
 * 应用根组件
 * - 工具栏 / 三列主区 / 状态栏 / 设置 Modal / Toast
 * - 数据初始化：hydrate stores
 */
import { useEffect } from 'react';
import { useUIStore } from './store/uiStore';
import { useSettingsStore } from './store/settingsStore';
import { useTodoStore } from './store/todoStore';
import { usePomodoroStore } from './store/pomodoroStore';
import { useAudioStore } from './store/audioStore';
import { useNoteStore } from './store/noteStore';
import { toggleFullscreen } from './ipc';
import { ErrorBoundary } from './components/ErrorBoundary';
import { PomodoroTimer } from './components/PomodoroTimer';
import { TodoList } from './components/TodoList';
import { PresetAppsGrid } from './components/PresetAppsGrid';
import { StatsChart } from './components/StatsChart';
import { AudioPlayer } from './components/AudioPlayer';
import { SettingsModal } from './components/SettingsModal';
import { DailyNotes } from './components/DailyNotes';

const Toolbar: React.FC = () => {
  const isFullscreen = useUIStore((s) => s.isFullscreen);
  const setFullscreen = useUIStore((s) => s.setFullscreen);
  const openSettings = useUIStore((s) => s.openSettings);
  const openNotes = useUIStore((s) => s.openNotes);
  const toast = useUIStore((s) => s.toast);

  const handleFullscreen = async () => {
    const next = !isFullscreen;
    await toggleFullscreen(next);
    setFullscreen(next);
    if (next) toast('已进入全屏模式（按 Esc 退出）', 'info');
  };

  return (
    <div className="toolbar">
      <div className="toolbar-left">
        <span className="toolbar-title">FocusFlow</span>
      </div>
      <div className="toolbar-right">
        <button className="icon-btn" onClick={openNotes} title="每日留言">
          📝 留言
        </button>
        <button className="icon-btn" onClick={handleFullscreen} title="全屏切换 (F11)">
          {isFullscreen ? '🗗' : '🗖'} 全屏
        </button>
        <button className="icon-btn" onClick={openSettings} title="设置">
          ⚙️ 设置
        </button>
      </div>
    </div>
  );
};

const StatusBar: React.FC = () => {
  const phase = usePomodoroStore((s) => s.phase);
  const status = usePomodoroStore((s) => s.status);
  const remaining = usePomodoroStore((s) => s.remainingSeconds);
  const statusMessage = useUIStore((s) => s.statusMessage);
  const workModeLaunching = useUIStore((s) => s.workModeLaunching);

  const phaseText = phase === 'focus' ? '专注' : phase === 'shortBreak' ? '短休息' : '长休息';
  const m = Math.floor(remaining / 60);
  const s = remaining % 60;
  const remainingText = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;

  const statusText = statusMessage
    ? statusMessage
    : workModeLaunching
    ? '正在启动工作模式...'
    : '';

  return (
    <div className="statusbar">
      <div>
        当前阶段: {phaseText} · 状态: {status === 'running' ? '进行中' : status === 'paused' ? '已暂停' : '空闲'} · 剩余 {remainingText}
      </div>
      <div>{statusText}</div>
    </div>
  );
};

const ToastContainer: React.FC = () => {
  const toasts = useUIStore((s) => s.toasts);
  if (toasts.length === 0) return null;
  return (
    <div className="toast-container">
      {toasts.map((t) => (
        <div key={t.id} className={`toast ${t.kind}`}>
          {t.message}
        </div>
      ))}
    </div>
  );
};

const LoadingBar: React.FC = () => {
  const launching = useUIStore((s) => s.workModeLaunching);
  if (!launching) return null;
  return <div className="loading-bar" />;
};

export default function App() {
  const hydrateSettings = useSettingsStore((s) => s.hydrate);
  const hydrateTodos = useTodoStore((s) => s.hydrate);
  const hydratePomodoro = usePomodoroStore((s) => s.hydrate);
  const hydrateAudio = useAudioStore((s) => s.hydrate);
  const hydrateNotes = useNoteStore((s) => s.hydrate);

  useEffect(() => {
    (async () => {
      await Promise.all([
        hydrateSettings(),
        hydrateTodos(),
        hydratePomodoro(),
        hydrateAudio(),
        hydrateNotes()
      ]);
    })();
  }, [hydrateSettings, hydrateTodos, hydratePomodoro, hydrateAudio, hydrateNotes]);

  return (
    <ErrorBoundary>
      <div className="app-shell">
        <LoadingBar />
        <Toolbar />
        <div className="main-layout">
          <ErrorBoundary>
            <div className="panel">
              <PomodoroTimer />
              <AudioPlayer />
            </div>
          </ErrorBoundary>
          <ErrorBoundary>
            <div className="panel">
              <TodoList />
            </div>
          </ErrorBoundary>
          <ErrorBoundary>
            <div className="panel">
              <PresetAppsGrid />
              <StatsChart />
            </div>
          </ErrorBoundary>
        </div>
        <StatusBar />
        <SettingsModal />
        <DailyNotes />
        <ToastContainer />
      </div>
    </ErrorBoundary>
  );
}
