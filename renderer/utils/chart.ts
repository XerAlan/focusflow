/**
 * ECharts 图表配置（专注时长柱状图）
 */
import type { EChartsOption } from 'echarts';

export const buildBarChartOption = (
  data: { label: string; minutes: number }[]
): EChartsOption => ({
  grid: { top: 16, left: 32, right: 8, bottom: 24 },
  tooltip: {
    trigger: 'axis',
    backgroundColor: '#2A2A3C',
    borderColor: '#3A3A52',
    textStyle: { color: '#E5E5F0' },
    formatter: (params: any) => {
      const p = params[0];
      return `${p.axisValue}<br/>${p.data} 分钟`;
    }
  },
  xAxis: {
    type: 'category',
    data: data.map((d) => d.label),
    axisLine: { lineStyle: { color: '#3A3A52' } },
    axisLabel: { color: '#9A9AB0', fontSize: 10 }
  },
  yAxis: {
    type: 'value',
    name: '分钟',
    nameTextStyle: { color: '#9A9AB0', fontSize: 10 },
    axisLine: { show: false },
    axisLabel: { color: '#9A9AB0', fontSize: 10 },
    splitLine: { lineStyle: { color: '#34344A' } }
  },
  series: [
    {
      type: 'bar',
      data: data.map((d) => d.minutes),
      barWidth: '55%',
      itemStyle: {
        color: '#7C4DFF',
        borderRadius: [4, 4, 0, 0]
      }
    }
  ]
});
