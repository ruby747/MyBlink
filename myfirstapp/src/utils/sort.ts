import { MemoItemData } from '../types';

const colorRank: Record<string, number> = {
  green: 0,
  red: 1,
  blue: 2,
  black: 3,
};

export function sortMemos(a: MemoItemData, b: MemoItemData) {
  const ca = colorRank[a.color] ?? 99;
  const cb = colorRank[b.color] ?? 99;
  if (ca !== cb) return ca - cb;
  // Stable within color by creation time (older first)
  return a.createdAt - b.createdAt;
}
