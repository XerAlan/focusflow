/**
 * 工作模式按钮（一键进入工作模式）
 * - 触发批量启动软件 + 批量打开 URL + 自动开始番茄钟
 * - 提供过程反馈（Toast + 状态栏）
 */
import { useState } from 'react';
import { useSettingsStore } from '../store/settingsStore';
import { usePomodoroStore } from '../store/pomodoroStore';
import { useAudioStore } from '../store/audioStore';
import { useUIStore } from '../store/uiStore';
import { launchWorkMode } from '../utils/launchWorkMode';

export const WorkModeButton: React.FC = () => {
  const settings = useSettingsStore();
  const pomodoroStatus = usePomodoroStore((s) => s.status);
  const pomodoroStart = usePomodoroStore((s) => s.start);
  const pomodoroReset = usePomodoroStore((s) => s.reset);
  const pomodoroRemaining = usePomodoroStore((s) => s.remainingSeconds);
  const audioPlayByPath = useAudioStore((s) => s.playByPath);
  const audioStop = useAudioStore((s) => s.stop);

  const toast = useUIStore((s) => s.toast);
  const setStatusMessage = useUIStore((s) => s.setStatusMessage);
  const workModeLaunching = useUIStore((s) => s.workModeLaunching);
  const setWorkModeLaunching = useUIStore((s) => s.setWorkModeLaunching);
  const [showCancel, setShowCancel] = useState(false);
  const [cancelToken, setCancelToken] = useState<{ cancelled: boolean }>({ cancelled: false });

  const handleClick = async () => {
    if (workModeLaunching) {
      setShowCancel(true);
      // 简单取消：直接标记
      cancelToken.cancelled = true;
      return;
    }
    setWorkModeLaunching(true);
    const token = { cancelled: false };
    setCancelToken(token);
    setShowCancel(true);
    setStatusMessage('正在启动工作模式...');
    toast('正在启动工作模式...', 'info');

    // 可选音频
    const audioPath = settings.workMode.defaultAudioPath;
    if (audioPath) {
      try {
        audioStop();
        await audioPlayByPath(audioPath);
        setStatusMessage('正在播放工作模式默认音频...');
      } catch (e) {
        // 忽略音频错误
      }
    }

    // 启动软件 + URL
    const res = await launchWorkMode(settings.workMode, settings.presetApps);

    if (token.cancelled) {
      setStatusMessage('工作模式启动已取消');
      toast('工作模式启动已取消', 'warning');
      setWorkModeLaunching(false);
      setShowCancel(false);
      return;
    }

    // 自动开始番茄钟
    if (pomodoroStatus !== 'running') {
      if (pomodoroRemaining <= 0) {
        pomodoroReset();
      }
      pomodoroStart();
    }

    setStatusMessage(
      `工作模式已就绪 · 启动 ${res.appResults.length} 个应用，${res.urlResults.length} 个网址`
    );
    toast(
      `工作模式已就绪 · 启动 ${res.appResults.length} 个应用，${res.urlResults.length} 个网址`,
      'success'
    );
    setWorkModeLaunching(false);
    setTimeout(() => setShowCancel(false), 1500);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
      <button
        className="btn btn-workmode"
        onClick={handleClick}
        title="一键启动所有工作模式配置的软件和网址，并自动开始番茄钟"
      >
        ⚡ 工作模式
      </button>
      {showCancel && workModeLaunching && (
        <button
          className="btn btn-danger"
          style={{ fontSize: 12, padding: '4px 10px' }}
          onClick={() => {
            cancelToken.cancelled = true;
          }}
        >
          中止启动
        </button>
      )}
    </div>
  );
};
