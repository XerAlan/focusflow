/**
 * 番茄钟组件
 * - 圆形进度环 + 数字倒计时
 * - 阶段切换 / 开始暂停 / 重置 / 跳过
 */
import { useEffect, useMemo } from 'react';
import { usePomodoroStore } from '../store/pomodoroStore';
import { useSettingsStore } from '../store/settingsStore';
import { formatTime, phaseLabel } from '../utils/timer';
import { WorkModeButton } from './WorkModeButton';

const RING_RADIUS = 90;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

export const PomodoroTimer: React.FC = () => {
  const phase = usePomodoroStore((s) => s.phase);
  const status = usePomodoroStore((s) => s.status);
  const remainingSeconds = usePomodoroStore((s) => s.remainingSeconds);
  const totalSeconds = usePomodoroStore((s) => s.totalSeconds);
  const completedFocusCount = usePomodoroStore((s) => s.completedFocusCount);

  const start = usePomodoroStore((s) => s.start);
  const pause = usePomodoroStore((s) => s.pause);
  const reset = usePomodoroStore((s) => s.reset);
  const skipPhase = usePomodoroStore((s) => s.skipPhase);
  const setPhase = usePomodoroStore((s) => s.setPhase);
  const recover = usePomodoroStore((s) => s.recover);

  const pomodoroDuration = useSettingsStore((s) => s.pomodoroDuration);

  // 首次挂载尝试恢复
  useEffect(() => {
    recover();
  }, [recover]);

  const { m, s } = useMemo(() => formatTime(remainingSeconds), [remainingSeconds]);
  const progress = useMemo(() => {
    if (totalSeconds <= 0) return 0;
    return Math.max(0, Math.min(1, 1 - remainingSeconds / totalSeconds));
  }, [remainingSeconds, totalSeconds]);
  const dashOffset = RING_CIRCUMFERENCE * (1 - progress);

  const ringColor =
    phase === 'focus'
      ? '#7C4DFF'
      : phase === 'shortBreak'
      ? '#4CAF50'
      : '#FFB74D';

  return (
    <div className="pomodoro">
      <div className="pomodoro-phase">
        {phaseLabel(phase)} · 已完成 {completedFocusCount} 个番茄
      </div>
      <div className="pomodoro-ring">
        <svg viewBox="0 0 200 200">
          <circle
            cx="100"
            cy="100"
            r={RING_RADIUS}
            stroke="#34344A"
            strokeWidth="8"
            fill="none"
          />
          <circle
            cx="100"
            cy="100"
            r={RING_RADIUS}
            stroke={ringColor}
            strokeWidth="8"
            fill="none"
            strokeLinecap="round"
            strokeDasharray={RING_CIRCUMFERENCE}
            strokeDashoffset={dashOffset}
            style={{ transition: 'stroke-dashoffset 0.5s linear' }}
          />
        </svg>
        <div className="pomodoro-time">
          <div>
            <span className="minutes">{m}</span>
            <span className="seconds">:{s}</span>
          </div>
          <div style={{ fontSize: 12, color: '#9A9AB0' }}>
            {phaseLabel(phase)} {pomodoroDuration}m
          </div>
        </div>
      </div>
      <div className="pomodoro-controls">
        {status !== 'running' ? (
          <button className="btn btn-primary" onClick={start}>
            {status === 'paused' ? '继续' : '开始'}
          </button>
        ) : (
          <button className="btn" onClick={pause}>
            暂停
          </button>
        )}
        <button className="btn" onClick={reset}>
          重置
        </button>
        <button className="btn" onClick={skipPhase} title="跳过当前阶段">
          跳过
        </button>
      </div>
      <WorkModeButton />
      <div className="pomodoro-controls" style={{ marginTop: 4 }}>
        <button
          className={`btn ${phase === 'focus' ? 'btn-primary' : ''}`}
          onClick={() => setPhase('focus')}
        >
          专注
        </button>
        <button
          className={`btn ${phase === 'shortBreak' ? 'btn-success' : ''}`}
          onClick={() => setPhase('shortBreak')}
        >
          短休息
        </button>
        <button
          className={`btn ${phase === 'longBreak' ? 'btn-success' : ''}`}
          onClick={() => setPhase('longBreak')}
        >
          长休息
        </button>
      </div>
    </div>
  );
};
