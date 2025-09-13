export type MemoColor = 'red' | 'blue' | 'black';

export interface MemoItemData {
  id: string;
  text: string;
  color: MemoColor;
  createdAt: number;
  updatedAt: number;
}
