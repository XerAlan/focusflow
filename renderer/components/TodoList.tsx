/**
 * Todo List 组件
 * - 分组显示（未完成 / 已完成）
 * - 支持拖拽排序（基于 react-easy-sort）+ 上下移动按钮作为回退
 * - 增删改、勾选完成
 */
import { useState } from 'react';
import { useTodoStore } from '../store/todoStore';
import SortableList, { SortableItem, SortableKnob } from 'react-easy-sort';
import type { TodoItem } from '../../shared/types';

const SortableKnobHandle = () => (
  <span className="handle" style={{ cursor: 'grab', userSelect: 'none', padding: '0 4px' }}>⋮⋮</span>
);

const TodoRow: React.FC<{
  todo: TodoItem;
  onToggle: (id: string) => void;
  onRemove: (id: string) => void;
  onEdit: (id: string, title: string) => void;
  onMoveUp?: (id: string) => void;
  onMoveDown?: (id: string) => void;
  allowReorder?: boolean;
}> = ({ todo, onToggle, onRemove, onEdit, onMoveUp, onMoveDown, allowReorder }) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(todo.title);
  const body = (
    <div className={`todo-item ${todo.completed ? 'completed' : ''}`}>
      {allowReorder && <SortableKnob><SortableKnobHandle /></SortableKnob>}
      <input
        type="checkbox"
        checked={todo.completed}
        onChange={() => onToggle(todo.id)}
      />
      {editing ? (
        <input
          value={draft}
          autoFocus
          onChange={(e) => setDraft(e.target.value)}
          onBlur={() => {
            if (draft.trim()) onEdit(todo.id, draft.trim());
            setEditing(false);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              if (draft.trim()) onEdit(todo.id, draft.trim());
              setEditing(false);
            } else if (e.key === 'Escape') {
              setEditing(false);
              setDraft(todo.title);
            }
          }}
          style={{
            flex: 1,
            background: 'transparent',
            border: '1px solid #7C4DFF',
            color: '#E5E5F0',
            borderRadius: 4,
            padding: '2px 6px',
            outline: 'none'
          }}
        />
      ) : (
        <span
          className="todo-title"
          onDoubleClick={() => {
            setDraft(todo.title);
            setEditing(true);
          }}
          title="双击编辑"
        >
          {todo.title}
        </span>
      )}
      <div className="todo-actions">
        {allowReorder && onMoveUp && (
          <button onClick={() => onMoveUp(todo.id)} title="上移">↑</button>
        )}
        {allowReorder && onMoveDown && (
          <button onClick={() => onMoveDown(todo.id)} title="下移">↓</button>
        )}
        <button
          onClick={() => {
            setDraft(todo.title);
            setEditing(true);
          }}
          title="编辑"
        >
          ✎
        </button>
        <button onClick={() => onRemove(todo.id)} title="删除">✕</button>
      </div>
    </div>
  );
  return allowReorder ? <SortableItem key={todo.id}>{body}</SortableItem> : body;
};

export const TodoList: React.FC = () => {
  const todos = useTodoStore((s) => s.todos);
  const add = useTodoStore((s) => s.add);
  const toggle = useTodoStore((s) => s.toggle);
  const remove = useTodoStore((s) => s.remove);
  const update = useTodoStore((s) => s.update);
  const reorder = useTodoStore((s) => s.reorder);

  const [draft, setDraft] = useState('');

  // 排序：未完成按 order 升序；已完成按 createdAt 倒序
  const incomplete = todos.filter((t) => !t.completed).sort((a, b) => a.order - b.order);
  const completed = todos
    .filter((t) => t.completed)
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));

  const submit = () => {
    if (!draft.trim()) return;
    add(draft);
    setDraft('');
  };

  // 拖拽完成：生成新顺序 id 列表并保存
  const onSortEnd = (group: TodoItem[], oldIndex: number, newIndex: number) => {
    if (oldIndex === newIndex) return;
    const ids = group.map((t) => t.id);
    const [m] = ids.splice(oldIndex, 1);
    ids.splice(newIndex, 0, m);
    reorder(ids);
  };

  // 上下移动
  const moveItem = (id: string, delta: number) => {
    const idx = incomplete.findIndex((t) => t.id === id);
    if (idx === -1) return;
    const newIdx = idx + delta;
    if (newIdx < 0 || newIdx >= incomplete.length) return;
    const ids = incomplete.map((t) => t.id);
    [ids[idx], ids[newIdx]] = [ids[newIdx], ids[idx]];
    reorder(ids);
  };

  return (
    <div className="todo-list">
      <h2 className="panel-title">待办事项</h2>
      <div className="todo-section">
        <h3 className="todo-section-title">未完成 ({incomplete.length})</h3>
        {incomplete.length === 0 ? (
          <div style={{ color: '#9A9AB0', fontSize: 12, padding: 8 }}>
            暂无待办，添加一个新任务吧
          </div>
        ) : (
          <SortableList
            onSortEnd={(oldIndex, newIndex) => onSortEnd(incomplete, oldIndex, newIndex)}
            draggedItemClassName="sortable-ghost"
            lockAxis="y"
          >
            {incomplete.map((todo) => (
              <TodoRow
                key={todo.id}
                todo={todo}
                onToggle={toggle}
                onRemove={remove}
                onEdit={(id, title) => update(id, { title })}
                onMoveUp={(id) => moveItem(id, -1)}
                onMoveDown={(id) => moveItem(id, 1)}
                allowReorder
              />
            ))}
          </SortableList>
        )}
      </div>

      <div className="todo-section">
        <h3 className="todo-section-title">已完成 ({completed.length})</h3>
        {completed.length > 0 && (
          <SortableList
            onSortEnd={(oldIndex, newIndex) => onSortEnd(completed, oldIndex, newIndex)}
            draggedItemClassName="sortable-ghost"
            lockAxis="y"
          >
            {completed.map((todo) => (
              <TodoRow
                key={todo.id}
                todo={todo}
                onToggle={toggle}
                onRemove={remove}
                onEdit={(id, title) => update(id, { title })}
                allowReorder
              />
            ))}
          </SortableList>
        )}
      </div>

      <div className="todo-add">
        <input
          placeholder="+ 添加新任务，回车保存"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') submit();
          }}
        />
        <button className="btn btn-primary" onClick={submit}>
          添加
        </button>
      </div>
    </div>
  );
};
