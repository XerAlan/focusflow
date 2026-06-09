/**
 * 每日留言（内嵌式面板，固定在主区底部左侧）
 * - 左侧：日期侧边栏（最近 30 天 + 更早留言）
 * - 右侧：textarea 直接编辑（无模态）
 * - 自动保存（500ms 防抖）
 * - 顶部工具栏：导出 Markdown / 删除
 * - 当天高亮 + 「今天」标签
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { useNoteStore } from '../store/noteStore';
import { useUIStore } from '../store/uiStore';
import { localDateKey } from '../utils/date';
import { buildNotesMarkdown } from '../utils/markdownExport';
import { saveTextFile } from '../ipc';

const weekDays = ['日', '一', '二', '三', '四', '五', '六'];

const formatDateLabel = (key: string): { week: string; date: string } => {
  const [y, m, d] = key.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return { week: `周${weekDays[date.getDay()]}`, date: `${m}/${d}` };
};

const formatFullDate = (key: string): string => {
  const [y, m, d] = key.split('-').map(Number);
  return `${y} 年 ${m} 月 ${d} 日`;
};

export const NotesPanel: React.FC = () => {
  const notes = useNoteStore((s) => s.notes);
  const setNote = useNoteStore((s) => s.setNote);
  const remove = useNoteStore((s) => s.remove);
  const toast = useUIStore((s) => s.toast);

  const todayKey = useMemo(() => localDateKey(), []);
  const [selectedDate, setSelectedDate] = useState<string>(todayKey);
  const [draft, setDraft] = useState<string>('');
  const [savedFlag, setSavedFlag] = useState<'idle' | 'saving' | 'saved'>('idle');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 切换日期时同步内容
  useEffect(() => {
    const note = useNoteStore.getState().notes[selectedDate];
    setDraft(note?.content || '');
    setSavedFlag('idle');
  }, [selectedDate]);

  // 草稿变化：触发防抖保存
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setSavedFlag('saving');
    debounceRef.current = setTimeout(() => {
      const current = useNoteStore.getState().notes[selectedDate];
      if ((current?.content || '') === draft) {
        setSavedFlag('saved');
        return;
      }
      setNote(selectedDate, draft);
      setSavedFlag('saved');
    }, 500);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [draft, selectedDate, setNote]);

  // 卸载时强制 flush
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
        setNote(selectedDate, draft);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 构造日期列表：最近 30 天 + 更早有内容的
  const recentKeys: string[] = useMemo(() => {
    const out: string[] = [];
    const now = new Date();
    for (let i = 0; i < 30; i++) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      out.push(localDateKey(d));
    }
    return out;
  }, []);

  const recentSet = useMemo(() => new Set(recentKeys), [recentKeys]);
  const olderKeys = useMemo(
    () =>
      Object.keys(notes)
        .filter((d) => notes[d]?.content.trim() && !recentSet.has(d))
        .sort()
        .reverse(),
    [notes, recentSet]
  );

  // 导出 Markdown
  const handleExport = async () => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      setNote(selectedDate, draft);
    }
    const content = buildNotesMarkdown(useNoteStore.getState().notes);
    const stamp = new Date().toISOString().slice(0, 10);
    const res = await saveTextFile({
      defaultName: `focusflow-notes-${stamp}.md`,
      content,
      filters: [{ name: 'Markdown', extensions: ['md', 'markdown'] }]
    });
    if (res.canceled) return;
    if (res.error) {
      toast(`导出失败: ${res.error}`, 'error');
    } else {
      toast(`已导出到: ${res.filePath}`, 'success');
    }
  };

  // 删除当前日期留言
  const handleDelete = () => {
    if (!notes[selectedDate]) return;
    if (!confirm(`确定删除 ${formatFullDate(selectedDate)} 的留言？`)) return;
    remove(selectedDate);
    setDraft('');
    toast('已删除', 'success');
  };

  const statusText =
    savedFlag === 'saving' ? '保存中…' : savedFlag === 'saved' ? '✓ 已保存' : '编辑中…';

  return (
    <div className="notes-panel">
      <div className="notes-panel-header">
        <span className="notes-panel-title">📝 每日留言</span>
        <div className="notes-panel-actions">
          <button className="btn" onClick={handleExport} title="导出全部留言为 Markdown">
            📤 导出 MD
          </button>
          <button
            className="btn btn-danger"
            onClick={handleDelete}
            disabled={!notes[selectedDate]}
          >
            删除
          </button>
        </div>
      </div>
      <div className="notes-body">
        {/* 左侧日期列表 */}
        <div className="notes-sidebar">
          <div className="notes-sidebar-title">最近 30 天</div>
          <div className="notes-date-list">
            {recentKeys.map((date) => {
              const isToday = date === todayKey;
              const note = notes[date];
              const hasContent = !!note?.content.trim();
              const isSelected = date === selectedDate;
              const { week, date: d } = formatDateLabel(date);
              return (
                <button
                  key={date}
                  className={`notes-date-item ${isSelected ? 'selected' : ''} ${
                    hasContent ? 'has-content' : ''
                  }`}
                  onClick={() => setSelectedDate(date)}
                >
                  <div className="notes-date-main">
                    <span className="notes-date-d">{d}</span>
                    <span className="notes-date-week">{week}</span>
                    {isToday && <span className="notes-date-tag">今天</span>}
                  </div>
                  {hasContent && (
                    <div className="notes-date-preview">{note.content.slice(0, 20)}…</div>
                  )}
                </button>
              );
            })}
          </div>
          {olderKeys.length > 0 && (
            <>
              <div className="notes-sidebar-title" style={{ marginTop: 8 }}>
                更早
              </div>
              <div className="notes-date-list">
                {olderKeys.slice(0, 50).map((date) => {
                  const isSelected = date === selectedDate;
                  const { date: d } = formatDateLabel(date);
                  return (
                    <button
                      key={date}
                      className={`notes-date-item compact ${isSelected ? 'selected' : ''}`}
                      onClick={() => setSelectedDate(date)}
                      title={date}
                    >
                      <span className="notes-date-d">{d}</span>
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* 右侧编辑区 */}
        <div className="notes-editor">
          <div className="notes-editor-header">
            <div className="notes-editor-date">
              {formatFullDate(selectedDate)}
              {selectedDate === todayKey && (
                <span className="notes-date-tag" style={{ marginLeft: 8 }}>
                  今天
                </span>
              )}
            </div>
            <span className="notes-save-status">{statusText}</span>
          </div>
          <textarea
            className="notes-textarea"
            placeholder="记录今天的心情、收获、反思或任何想说的话…"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
          />
          <div className="notes-editor-footer">字数：{draft.length}</div>
        </div>
      </div>
    </div>
  );
};
