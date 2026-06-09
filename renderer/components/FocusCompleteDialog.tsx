/**
 * 专注完成弹窗
 * - 用户看到专注完成的庆祝效果
 * - 「开始休息」「跳过休息」「稍后提醒」三个选项
 * - 弹窗 30 秒未操作自动关闭
 */
import { useEffect, useState } from 'react';
import { useUIStore } from '../store/uiStore';
import { usePomodoroStore } from '../store/pomodoroStore';
import { useSettingsStore } from '../store/settingsStore';

const AUTO_DISMISS_MS = 30000;

export const FocusCompleteDialog: React.FC = () => {
  const dialog = useUIStore((s) => s.focusCompleteDialog);
  const dismiss = useUIStore((s) => s.dismissFocusComplete);
  const toast = useUIStore((s) => s.toast);

  const phase = usePomodoroStore((s) => s.phase);
  const status = usePomodoroStore((s) => s.status);
  const startPomodoro = usePomodoroStore((s) => s.start);
  const skipPhase = usePomodoroStore((s) => s.skipPhase);
  const setPhase = usePomodoroStore((s) => s.setPhase);

  const shortBreakDuration = useSettingsStore((s) => s.shortBreakDuration);
  const longBreakDuration = useSettingsStore((s) => s.longBreakDuration);

  const [countdown, setCountdown] = useState(Math.ceil(AUTO_DISMISS_MS / 1000));

  useEffect(() => {
    if (!dialog) return;
    setCountdown(Math.ceil(AUTO_DISMISS_MS / 1000));
    const id = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(id);
          // 自动关闭：跳到下一阶段 focus
          setPhase('focus');
          toast('已自动跳到专注模式', 'info');
          dismiss();
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dialog?.nonce]);

  if (!dialog) return null;

  // 当前已经在跑休息中（说明自动开始了），文案变化
  const isAutoStarted = status === 'running' && phase === dialog.nextPhase;
  const breakMinutes =
    dialog.nextPhase === 'longBreak' ? longBreakDuration : shortBreakDuration;

  return (
    <div
      className="modal-backdrop"
      onClick={() => {
        // 点击空白：默认行为是开始休息
        if (!isAutoStarted) startPomodoro();
        dismiss();
      }}
    >
      <div
        className="focus-complete-dialog"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="focus-complete-icon">🎉</div>
        <h2 className="focus-complete-title">专注完成！</h2>
        <p className="focus-complete-desc">
          你刚刚完成了 <strong>{dialog.durationMinutes} 分钟</strong>的专注。
          <br />
          {isAutoStarted
            ? `${breakMinutes} 分钟休息已开始倒计时。`
            : `建议休息 ${breakMinutes} 分钟。`}
        </p>
        <div className="focus-complete-actions">
          {!isAutoStarted ? (
            <button
              className="btn btn-success"
              onClick={() => {
                startPomodoro();
                dismiss();
              }}
            >
              ☕ 开始休息
            </button>
          ) : (
            <button
              className="btn"
              onClick={() => {
                skipPhase();
                dismiss();
              }}
            >
              ⏭ 跳过休息
            </button>
          )}
          <button
            className="btn"
            onClick={() => {
              // 跳到专注但不开始
              setPhase('focus');
              dismiss();
            }}
          >
            专注下一轮
          </button>
        </div>
        <div className="focus-complete-auto">
          {countdown} 秒后自动关闭
        </div>
      </div>
    </div>
  );
};
