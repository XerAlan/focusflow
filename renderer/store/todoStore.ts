/**
 * Todo Store
 * - 增删改查、排序、完成状态
 * - 持久化到 'todos' 键
 */
import { create } from 'zustand';
import type { TodoItem } from '../../shared/types';
import { newId } from '../utils/id';
import { loadFromStore, saveToStore } from './persist';

const STORAGE_KEY = 'todos';

interface TodoStore {
  todos: TodoItem[];
  loaded: boolean;
  hydrate: () => Promise<void>;
  add: (title: string, description?: string) => TodoItem;
  update: (id: string, patch: Partial<TodoItem>) => void;
  remove: (id: string) => void;
  toggle: (id: string) => void;
  reorder: (orderedIds: string[]) => void;
}

const persist = (state: TodoStore) => saveToStore(STORAGE_KEY, state.todos);

export const useTodoStore = create<TodoStore>((set, get) => ({
  todos: [],
  loaded: false,

  hydrate: async () => {
    const data = await loadFromStore<TodoItem[]>(STORAGE_KEY, []);
    set({ todos: data, loaded: true });
  },

  add: (title, description) => {
    const order = get().todos.length;
    const newItem: TodoItem = {
      id: newId('todo-'),
      title: title.trim(),
      description: description?.trim() || undefined,
      completed: false,
      createdAt: new Date().toISOString(),
      order
    };
    const todos = [...get().todos, newItem];
    set({ todos });
    persist(get());
    return newItem;
  },

  update: (id, patch) => {
    set({
      todos: get().todos.map((t) => (t.id === id ? { ...t, ...patch } : t))
    });
    persist(get());
  },

  remove: (id) => {
    set({ todos: get().todos.filter((t) => t.id !== id) });
    persist(get());
  },

  toggle: (id) => {
    set({
      todos: get().todos.map((t) =>
        t.id === id ? { ...t, completed: !t.completed } : t
      )
    });
    persist(get());
  },

  reorder: (orderedIds) => {
    const map = new Map(get().todos.map((t) => [t.id, t]));
    const next: TodoItem[] = [];
    orderedIds.forEach((id, idx) => {
      const item = map.get(id);
      if (item) next.push({ ...item, order: idx });
    });
    // 追加可能遗漏的项
    map.forEach((item, id) => {
      if (!orderedIds.includes(id)) next.push(item);
    });
    set({ todos: next });
    persist(get());
  }
}));
