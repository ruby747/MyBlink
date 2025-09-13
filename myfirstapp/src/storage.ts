import AsyncStorage from '@react-native-async-storage/async-storage';
import { MemoItemData } from './types';

const KEY = 'MEMOS_V1';

export async function loadMemos(): Promise<MemoItemData[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed as MemoItemData[];
    return [];
  } catch (e) {
    return [];
  }
}

export async function saveMemos(memos: MemoItemData[]): Promise<void> {
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(memos));
  } catch (e) {
    // ignore
  }
}

// Serialize memos for WidgetKit (id, text, color only)
export function serializeMemosForWidget(memos: MemoItemData[]): string {
  return JSON.stringify(
    memos.map((m) => ({ id: m.id, text: m.text, color: m.color }))
  );
}
