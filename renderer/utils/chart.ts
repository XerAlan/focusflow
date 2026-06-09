/**
 * ECharts 图表配置（专注时长可视化 - 优化版）
 * - 渐变色柱状图（按强度上色）
 * - 每日目标参考线（默认 4 个番茄 = 100 分钟，可配置）
 * - 增强的工具提示
 * - 今日柱条高亮
 */
import type { EChartsOption } from 'echarts';

export interface ChartDataPoint {
  date: string; // yyyy-mm-dd
  label: string; // M/D
  minutes: number;
  isToday?: boolean;
}

export const DAILY_GOAL_MINUTES = 100; // 4 个番茄 = 100 分钟

/**
 * 渐变色生成器
 * - 0 分钟: 灰色
 * - 50% 目标: 蓝色
 * - 达到目标: 紫色
 * - 超过目标: 金色
 */
const colorForMinutes = (m: number): string => {
  if (m <= 0) return '#34344A';
  if (m < DAILY_GOAL_MINUTES * 0.5) return '#5C6BC0'; // 蓝
  if (m < DAILY_GOAL_MINUTES) return '#7C4DFF'; // 紫
  if (m < DAILY_GOAL_MINUTES * 1.5) return '#FFB74D'; // 金
  return '#FFD54F';
};

export const buildBarChartOption = (
  data: ChartDataPoint[],
  goalMinutes: number = DAILY_GOAL_MINUTES
): EChartsOption => {
  const maxValue = Math.max(
    goalMinutes,
    ...data.map((d) => d.minutes),
    60
  );
  const todayLabel = data.find((d) => d.isToday)?.label;

  return {
    grid: { top: 28, left: 36, right: 12, bottom: 24 },
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(42, 42, 60, 0.95)',
      borderColor: '#7C4DFF',
      borderWidth: 1,
      textStyle: { color: '#E5E5F0', fontSize: 12 },
      padding: [8, 12],
      formatter: (params: any) => {
        const p = params[0];
        const minutes = p.data;
        const pct = goalMinutes > 0 ? Math.round((minutes / goalMinutes) * 100) : 0;
        const stars =
          minutes === 0
            ? '—'
            : minutes >= goalMinutes * 1.5
            ? '🔥🔥🔥'
            : minutes >= goalMinutes
            ? '🔥🔥'
            : minutes >= goalMinutes * 0.5
            ? '🔥'
            : '🌱';
        return `
          <div style="font-weight:600">${p.axisValue}${p.axisValue === todayLabel ? ' (今天)' : ''}</div>
          <div style="margin-top:4px">⏱ ${minutes} 分钟</div>
          <div style="color:#9A9AB0;font-size:11px">完成度 ${pct}% ${stars}</div>
        `;
      }
    },
    xAxis: {
      type: 'category',
      data: data.map((d) => d.label),
      axisLine: { lineStyle: { color: '#3A3A52' } },
      axisTick: { show: false },
      axisLabel: {
        color: '#9A9AB0',
        fontSize: 10,
        formatter: (val: string) => {
          return val === todayLabel ? `今` : val;
        }
      }
    },
    yAxis: {
      type: 'value',
      name: '分钟',
      nameTextStyle: { color: '#9A9AB0', fontSize: 10, padding: [0, 0, 4, 0] },
      max: Math.ceil(maxValue * 1.1),
      axisLine: { show: false },
      axisLabel: { color: '#9A9AB0', fontSize: 10 },
      splitLine: { lineStyle: { color: '#2A2A3C', type: 'dashed' } }
    },
    series: [
      // 主柱（渐变 + 个性化颜色）
      {
        type: 'bar',
        data: data.map((d) => ({
          value: d.minutes,
          itemStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: lighten(colorForMinutes(d.minutes), 0.15) },
                { offset: 1, color: colorForMinutes(d.minutes) }
              ]
            },
            borderRadius: [4, 4, 0, 0],
            // 今日加亮边框
            borderColor: d.isToday ? '#FFFFFF' : 'transparent',
            borderWidth: d.isToday ? 1.5 : 0
          }
        })),
        barWidth: '50%',
        // 顶部显示数值
        label: {
          show: true,
          position: 'top',
          color: '#9A9AB0',
          fontSize: 9,
          formatter: (params: any) => (params.value > 0 ? params.value : '')
        },
        markLine: {
          silent: true,
          symbol: 'none',
          lineStyle: {
            color: '#FFB74D',
            type: 'dashed',
            width: 1
          },
          label: {
            color: '#FFB74D',
            fontSize: 10,
            formatter: `目标 ${goalMinutes} 分钟`,
            position: 'end'
          },
          data: [{ yAxis: goalMinutes }]
        }
      }
    ]
  };
};

/** 简单颜色加亮（用于渐变） */
const lighten = (color: string, amount: number): string => {
  // 简化版：如果是 hex 颜色，转为 hls 加亮
  if (color.startsWith('#')) {
    const hex = color.replace('#', '');
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    const lr = Math.min(255, Math.floor(r + (255 - r) * amount));
    const lg = Math.min(255, Math.floor(g + (255 - g) * amount));
    const lb = Math.min(255, Math.floor(b + (255 - b) * amount));
    return `#${lr.toString(16).padStart(2, '0')}${lg
      .toString(16)
      .padStart(2, '0')}${lb.toString(16).padStart(2, '0')}`;
  }
  return color;
};
