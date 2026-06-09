/**
 * 时钟组件
 * - 显示当前时间（HH:MM:SS）
 * - 显示当前日期（年月日 + 星期）
 * - 实时刷新（每秒）
 */
import { useEffect, useState } from 'react';

const weekDays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];

const pad = (n: number) => String(n).padStart(2, '0');

export const Clock: React.FC = () => {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const hh = pad(now.getHours());
  const mm = pad(now.getMinutes());
  const ss = pad(now.getSeconds());
  const dateStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  const week = weekDays[now.getDay()];

  return (
    <div className="clock-panel">
      <div className="clock-time">
        <span>{hh}</span>
        <span className="clock-sep">:</span>
        <span>{mm}</span>
        <span className="clock-sep clock-sep-blink">:</span>
        <span className="clock-ss">{ss}</span>
      </div>
      <div className="clock-date">
        {dateStr} · {week}
      </div>
    </div>
  );
};
