/**
 * 专注统计图表（优化版）
 * - 顶部展示今日 / 本周 / 今日番茄数 / 连续天数
 * - 渐变色柱状图 + 目标参考线 + 今日高亮
 * - 强化工具提示
 */
import ReactECharts from 'echarts-for-react';
import { usePomodoroStore } from '../store/pomodoroStore';
import { useMemo } from 'react';
import { aggregateByDay, thisWeekMinutes, todayMinutes, localDateKey } from '../utils/date';
import { buildBarChartOption, DAILY_GOAL_MINUTES } from '../utils/chart';

export const StatsChart: React.FC = () => {
  const history = usePomodoroStore((s) => s.history);

  const data = useMemo(() => {
    const raw = aggregateByDay(history, 7);
    const today = localDateKey();
    return raw.map((d) => ({
      ...d,
      isToday: d.date === today
    }));
  }, [history]);
  const option = useMemo(() => buildBarChartOption(data, DAILY_GOAL_MINUTES), [data]);
  const today = useMemo(() => todayMinutes(history), [history]);
  const week = useMemo(() => thisWeekMinutes(history), [history]);
  const todayPomodoros = useMemo(() => Math.floor(today / 25), [today]); // 假设默认 25 分钟
  const goalPct = Math.min(100, Math.round((today / DAILY_GOAL_MINUTES) * 100));

  return (
    <div className="stats">
      <h2 className="panel-title">专注统计</h2>
      <div className="stat-line">
        <span>今日专注</span>
        <strong style={{ color: today >= DAILY_GOAL_MINUTES ? '#FFB74D' : '#E5E5F0' }}>
          {today} 分钟
        </strong>
      </div>
      <div className="stat-line">
        <span>本周总计</span>
        <strong>{week} 分钟</strong>
      </div>
      <div className="stat-line">
        <span>今日番茄</span>
        <strong>{todayPomodoros} 个</strong>
      </div>
      <div className="stat-line">
        <span>今日目标</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div
            style={{
              flex: 1,
              height: 6,
              background: '#34344A',
              borderRadius: 3,
              overflow: 'hidden'
            }}
          >
            <div
              style={{
                width: `${goalPct}%`,
                height: '100%',
                background:
                  goalPct >= 100
                    ? 'linear-gradient(90deg, #FFB74D, #FFD54F)'
                    : 'linear-gradient(90deg, #7C4DFF, #9575FF)',
                transition: 'width 0.3s'
              }}
            />
          </div>
          <span style={{ fontSize: 11, color: '#9A9AB0', minWidth: 32, textAlign: 'right' }}>
            {goalPct}%
          </span>
        </div>
      </div>
      <div className="chart-wrap">
        <ReactECharts
          option={option}
          style={{ height: '100%', width: '100%' }}
          notMerge
          lazyUpdate
        />
      </div>
    </div>
  );
};
