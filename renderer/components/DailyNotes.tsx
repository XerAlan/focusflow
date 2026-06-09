/**
 * 每日留言 模态框
 * - 左侧：日期侧边栏（最近 30 天 + 全部有内容日期）
 * - 右侧：textarea 编辑区
 * - 自动保存（防抖 500ms）+ 手动「保存」按钮
 * - 删除某日留言
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { useNoteStore } from '../store/noteStore';
import { useUIStore } from '../store/uiStore';
import { localDateKey } from '../utils/date';

const formatDateLabel = (key: string): { week: string; date: string } => {
  // key: yyyy-mm-dd
  const [y, m, d] = key.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  const weekDays = ['日', '一', '二', '三', '四', '五', '六'];
  return {
    week: `周${weekDays[date.getDay()]}`,
    date: `${m}/${d}`
  };
};

const formatFullDate = (key: string): string => {
  const [y, m, d] = key.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return `${y} 年 ${m} 月 ${d} 日`;
};

export const DailyNotes: React.FC = () => {
  const open = useUIStore((s) => s.notesOpen);
  const close = useUIStore((s) => s.closeNotes);
  const toast = useUIStore((s) => s.toast);

  const recentList = useNoteStore((s) => s.recentList);
  const nonEmptyDates = useNoteStore((s) => s.nonEmptyDates);
  const setNote = useNoteStore((s) => s.setNote);
  const remove = useNoteStore((s) => s.remove);

  const todayKey = useMemo(() => localDateKey(), []);
  const [selectedDate, setSelectedDate] = useState<string>(todayKey);
  const [draft, setDraft] = useState<string>('');
  const [savedFlag, setSavedFlag] = useState<'idle' | 'saving' | 'saved'>('idle');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 打开模态时默认选中今天
  useEffect(() => {
    if (open) {
      setSelectedDate(todayKey);
      setDraft(useNoteStore.getState().notes[todayKey]?.content || '');
      setSavedFlag('idle');
    }
  }, [open, todayKey]);

  // 切换日期时同步内容
  useEffect(() => {
    const note = useNoteStore.getState().notes[selectedDate];
    setDraft(note?.content || '');
    setSavedFlag('idle');
  }, [selectedDate]);

  // 草稿变化：触发防抖保存
  useEffect(() => {
    if (!open) return;
    // 避免在切换日期瞬间保存（用 setSavedFlag 标记）
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
  }, [draft, selectedDate, setNote, open]);

  // 关闭窗口时强制 flush
  const handleClose = () => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
    setNote(selectedDate, draft);
    close();
  };

  const handleDelete = () => {
    if (!confirm(`确定删除 ${formatFullDate(selectedDate)} 的留言？`)) return;
    remove(selectedDate);
    setDraft('');
    toast('已删除', 'success');
  };

  // 合并「最近 30 天」+ 「所有有内容的日期」并去重
  const recent = recentList(30);
  const recentSet = new Set(recent.map((r) => r.date));
  const nonEmpty = nonEmptyDates().filter((d) => !recentSet.has(d));
  const nonEmptyItems = nonEmpty.map((d) => ({
    date: d,
    note: useNoteStore.getState().notes[d]
  }));

  if (!open) return null;

  const statusText =
    savedFlag === 'saving'
      ? '保存中…'
      : savedFlag === 'saved'
      ? '✓ 已自动保存'
      : '编辑中…';

  return (
    <div className="modal-backdrop" onClick={handleClose}>
      <div
        className="modal"
        style={{ width: 'min(820px, 94vw)', height: 'min(620px, 88vh)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2 className="modal-title">📝 每日留言</h2>
          <button className="icon-btn" onClick={handleClose}>
            ✕
          </button>
        </div>
        <div className="notes-body">
          {/* 左侧日期列表 */}
          <div className="notes-sidebar">
            <div className="notes-sidebar-title">最近 30 天</div>
            <div className="notes-date-list">
              {recent.map(({ date, note }) => {
                const isToday = date === todayKey;
                const hasContent = !!note?.content.trim();
                const isSelected = date === selectedDate;
                const { week, date: d } = formatDateLabel(date);
                return (
                  <button
                    key={date}
                    className={`notes-date-item ${isSelected ? 'selected' : ''} ${hasContent ? 'has-content' : ''}`}
                    onClick={() => setSelectedDate(date)}
                  >
                    <div className="notes-date-main">
                      <span className="notes-date-d">{d}</span>
                      <span className="notes-date-week">{week}</span>
                      {isToday && <span className="notes-date-tag">今天</span>}
                    </div>
                    {hasContent && (
                      <div className="notes-date-preview">
                        {note.content.slice(0, 24)}
                        {note.content.length > 24 ? '…' : ''}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
            {nonEmptyItems.length > 0 && (
              <>
                <div className="notes-sidebar-title" style={{ marginTop: 12 }}>
                  更早留言
                </div>
                <div className="notes-date-list">
                  {nonEmptyItems.map(({ date, note }) => {
                    const isSelected = date === selectedDate;
                    const { date: d } = formatDateLabel(date);
                    return (
                      <button
                        key={date}
                        className={`notes-date-item compact ${isSelected ? 'selected' : ''}`}
                        onClick={() => setSelectedDate(date)}
                      >
                        <span className="notes-date-d">{d}</span>
                        <span className="notes-date-preview">
                          {note?.content.slice(0, 20)}…
                        </span>
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
              <div className="notes-editor-actions">
                <span className="notes-save-status">{statusText}</span>
                <button
                  className="btn btn-danger"
                  style={{ fontSize: 12, padding: '4px 10px' }}
                  onClick={handleDelete}
                  disabled={!useNoteStore.getState().notes[selectedDate]}
                >
                  删除
                </button>
                <button className="btn btn-primary" onClick={handleClose}>
                  关闭
                </button>
              </div>
            </div>
            <textarea
              className="notes-textarea"
              placeholder="记录今天的心情、收获、反思或任何想说的话…"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              autoFocus
            />
            <div className="notes-editor-footer">
              字数：{draft.length}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
