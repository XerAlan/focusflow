/**
 * 每日留言 Store
 * - 按日期（yyyy-mm-dd）记录一条留言
 * - 持久化到 electron-store 的 'dailyNotes' 键
 * - 数据结构：Record<date, DailyNote>
 */
import { create } from 'zustand';
import type { DailyNote } from '../../shared/types';
import { loadFromStore, saveToStore } from './persist';
import { localDateKey } from '../utils/date';

const STORAGE_KEY = 'dailyNotes';

interface NoteStore {
  notes: Record<string, DailyNote>;
  loaded: boolean;
  hydrate: () => Promise<void>;
  /** 设置/更新某日留言（content 为空时删除该日） */
  setNote: (date: string, content: string) => void;
  remove: (date: string) => void;
  getByDate: (date: string) => DailyNote | undefined;
  /** 列出最近 days 天（含今天），返回按日期倒序的 [date, DailyNote][] */
  recentList: (days?: number) => { date: string; note: DailyNote }[];
  /** 仅列出有留言的日期（按日期倒序） */
  nonEmptyDates: () => string[];
}

const persist = (state: NoteStore) => saveToStore(STORAGE_KEY, state.notes);

export const useNoteStore = create<NoteStore>((set, get) => ({
  notes: {},
  loaded: false,

  hydrate: async () => {
    const data = await loadFromStore<Record<string, DailyNote>>(STORAGE_KEY, {});
    set({ notes: data || {}, loaded: true });
  },

  setNote: (date, content) => {
    const trimmed = content.trim();
    const notes = { ...get().notes };
    if (trimmed.length === 0) {
      delete notes[date];
    } else {
      notes[date] = {
        date,
        content,
        updatedAt: new Date().toISOString()
      };
    }
    set({ notes });
    persist(get());
  },

  remove: (date) => {
    const notes = { ...get().notes };
    delete notes[date];
    set({ notes });
    persist(get());
  },

  getByDate: (date) => get().notes[date],

  recentList: (days = 30) => {
    const out: { date: string; note: DailyNote }[] = [];
    const now = new Date();
    for (let i = 0; i < days; i++) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const key = localDateKey(d);
      const note = get().notes[key];
      out.push({ date: key, note: note as DailyNote });
    }
    return out;
  },

  nonEmptyDates: () => {
    return Object.keys(get().notes)
      .filter((d) => get().notes[d]?.content.trim())
      .sort()
      .reverse();
  }
}));
