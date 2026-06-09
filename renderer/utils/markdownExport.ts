/**
 * 将留言导出为 Markdown 文本
 * - 按日期分组倒序
 * - 格式：# 标题 + ## 日期小节 + 内容
 * - 自动转义 markdown 特殊字符（仅最小化处理）
 */
import type { DailyNote } from '../../shared/types';

const weekDays = ['日', '一', '二', '三', '四', '五', '六'];

const formatDateHeading = (key: string): string => {
  const [y, m, d] = key.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return `${y} 年 ${m} 月 ${d} 日 · 周${weekDays[date.getDay()]}`;
};

const escapeFence = (content: string): string => {
  // 避免内容里的 ``` 破坏代码围栏
  return content.replace(/```/g, 'ʼʼʼ');
};

export const buildNotesMarkdown = (
  notes: Record<string, DailyNote>,
  options?: { title?: string; filterEmpty?: boolean }
): string => {
  const title = options?.title || 'FocusFlow 每日留言';
  const filterEmpty = options?.filterEmpty !== false;

  const entries = Object.keys(notes)
    .filter((d) => (filterEmpty ? notes[d]?.content.trim() : true))
    .sort()
    .reverse();

  const lines: string[] = [];
  lines.push(`# ${title}`);
  lines.push('');
  lines.push(`> 导出时间：${new Date().toLocaleString('zh-CN')}`);
  lines.push(`> 留言条数：${entries.length}`);
  lines.push('');
  lines.push('---');
  lines.push('');

  if (entries.length === 0) {
    lines.push('_暂无留言_');
    lines.push('');
  } else {
    for (const date of entries) {
      const note = notes[date];
      lines.push(`## ${formatDateHeading(date)}`);
      lines.push('');
      // 缩进内容
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
