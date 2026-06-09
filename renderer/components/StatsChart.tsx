/**
 * 专注统计图表
 * - 近 7 天柱状图
 * - 顶部展示今日 / 本周分钟数
 */
import ReactECharts from 'echarts-for-react';
import { usePomodoroStore } from '../store/pomodoroStore';
import { useMemo } from 'react';
import { aggregateByDay, thisWeekMinutes, todayMinutes } from '../utils/date';
import { buildBarChartOption } from '../utils/chart';

export const StatsChart: React.FC = () => {
  const history = usePomodoroStore((s) => s.history);

  const data = useMemo(() => aggregateByDay(history, 7), [history]);
  const option = useMemo(() => buildBarChartOption(data), [data]);
  const today = useMemo(() => todayMinutes(history), [history]);
  const week = useMemo(() => thisWeekMinutes(history), [history]);

  return (
    <div className="stats">
      <h2 className="panel-title">专注统计</h2>
      <div className="stat-line">
        <span>今日专注</span>
        <strong>{today} 分钟</strong>
      </div>
      <div className="stat-line">
        <span>本周总计</span>
        <strong>{week} 分钟</strong>
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
