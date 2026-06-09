/**
 * 将留言导出为不同格式的文本
 * - Markdown: 按日期分组倒序的 .md
 * - JSON: 结构化 .json
 * - TXT: 纯文本
 * 支持范围过滤（all / week / month / lastNDays）
 */
import type { DailyNote } from '../../shared/types';

const weekDays = ['日', '一', '二', '三', '四', '五', '六'];

export type ExportFormat = 'markdown' | 'json' | 'txt';
export type ExportRange = 'all' | 'week' | 'month' | 'last7' | 'last30';

export interface ExportOptions {
  range?: ExportRange;
  format?: ExportFormat;
  filterEmpty?: boolean; // 默认 true
}

const formatDateHeading = (key: string): string => {
  const [y, m, d] = key.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return `${y} 年 ${m} 月 ${d} 日 · 周${weekDays[date.getDay()]}`;
};

const escapeFence = (content: string): string =>
  content.replace(/```/g, 'ʼʼʼ');

/**
 * 根据范围过滤出要导出的日期列表（按日期倒序）
 */
const filterByRange = (
  notes: Record<string, DailyNote>,
  range: ExportRange,
  filterEmpty: boolean
): string[] => {
  const all = Object.keys(notes)
    .filter((d) => (filterEmpty ? notes[d]?.content.trim() : true))
    .sort()
    .reverse();

  if (range === 'all') return all;

  const now = new Date();
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);

  if (range === 'week') {
    const day = now.getDay(); // 0=Sun
    start.setDate(now.getDate() - day);
  } else if (range === 'month') {
    start.setDate(1);
  } else if (range === 'last7') {
    start.setDate(now.getDate() - 6);
  } else if (range === 'last30') {
    start.setDate(now.getDate() - 29);
  }

  const startKey = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(
    2,
    '0'
  )}-${String(start.getDate()).padStart(2, '0')}`;
  return all.filter((d) => d >= startKey);
};

/** 构造 Markdown 文本 */
export const buildMarkdown = (
  notes: Record<string, DailyNote>,
  options?: { range?: ExportRange; filterEmpty?: boolean; title?: string }
): string => {
  const range = options?.range || 'all';
  const filterEmpty = options?.filterEmpty !== false;
  const title = options?.title || 'FocusFlow 每日留言';
  const dates = filterByRange(notes, range, filterEmpty);

  const lines: string[] = [];
  lines.push(`# ${title}`);
  lines.push('');
  lines.push(`> 导出时间：${new Date().toLocaleString('zh-CN')}`);
  lines.push(`> 范围：${rangeLabel(range)} · 留言条数：${dates.length}`);
  lines.push('');
  lines.push('---');
  lines.push('');

  if (dates.length === 0) {
    lines.push('_暂无留言_');
    lines.push('');
  } else {
    for (const date of dates) {
      const note = notes[date];
      lines.push(`## ${formatDateHeading(date)}`);
      lines.push('');
      const body = escapeFence(note.content).split('\n');
      for (const line of body) {
        if (line.trim() === '') {
          lines.push('');
        } else {
          lines.push(line);
        }
      }
      lines.push('');
    }
  }

  return lines.join('\n');
};

/** 构造 JSON 文本 */
export const buildJSON = (
  notes: Record<string, DailyNote>,
  options?: { range?: ExportRange; filterEmpty?: boolean }
): string => {
  const range = options?.range || 'all';
  const filterEmpty = options?.filterEmpty !== false;
  const dates = filterByRange(notes, range, filterEmpty);
  const payload = {
    meta: {
      exportedAt: new Date().toISOString(),
      range,
      rangeLabel: rangeLabel(range),
      count: dates.length
    },
    notes: dates.map((d) => notes[d])
  };
  return JSON.stringify(payload, null, 2);
};

/** 构造纯文本 */
export const buildTXT = (
  notes: Record<string, DailyNote>,
  options?: { range?: ExportRange; filterEmpty?: boolean }
): string => {
  const range = options?.range || 'all';
  const filterEmpty = options?.filterEmpty !== false;
  const dates = filterByRange(notes, range, filterEmpty);
  const lines: string[] = [];
  lines.push(`FocusFlow 每日留言`);
  lines.push(`导出时间：${new Date().toLocaleString('zh-CN')}`);
  lines.push(`范围：${rangeLabel(range)} · 条数：${dates.length}`);
  lines.push('='.repeat(40));
  lines.push('');

  for (const date of dates) {
    const note = notes[date];
    lines.push(formatDateHeading(date));
    lines.push('-'.repeat(40));
    lines.push(note.content);
    lines.push('');
  }

  return lines.join('\n');
};

export const buildExport = (
  format: ExportFormat,
  notes: Record<string, DailyNote>,
  options?: ExportOptions
): string => {
  const opts = { range: options?.range, filterEmpty: options?.filterEmpty };
  if (format === 'json') return buildJSON(notes, opts);
  if (format === 'txt') return buildTXT(notes, opts);
  return buildMarkdown(notes, opts);
};

export const rangeLabel = (range: ExportRange): string => {
  switch (range) {
    case 'all':
      return '全部';
    case 'week':
      return '本周';
    case 'month':
      return '本月';
    case 'last7':
      return '最近 7 天';
    case 'last30':
      return '最近 30 天';
  }
};

export const formatLabel = (format: ExportFormat): string => {
  switch (format) {
    case 'markdown':
      return 'Markdown';
    case 'json':
      return 'JSON';
    case 'txt':
      return '纯文本';
  }
};

export const formatExt = (format: ExportFormat): string => {
  switch (format) {
    case 'markdown':
      return 'md';
    case 'json':
      return 'json';
    case 'txt':
      return 'txt';
  }
};
