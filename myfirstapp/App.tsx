import React, { useEffect, useMemo, useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Modal,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  useColorScheme,
} from 'react-native';
import { MemoItemData, MemoColor } from './src/types';
import { sortMemos } from './src/utils/sort';
import { loadMemos, saveMemos, serializeMemosForWidget } from './src/storage';
import MemoItem from './src/components/MemoItem';
// Subscriptions removed per request; pure RN only
import { setMemos as setMemosForWidget } from './src/native/SharedDefaults';

function uuid() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export default function App() {
  const isDarkMode = useColorScheme() === 'dark';
  const [memos, setMemos] = useState<MemoItemData[]>([]);
  const [text, setText] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');
  const [deleteMode, setDeleteMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  // Subscription gating removed

  useEffect(() => {
    (async () => {
      const saved = await loadMemos();
      setMemos(saved);
    })();
  }, []);

  useEffect(() => {
    saveMemos(memos);
    // If native bridge is linked, push updates to the widget
    try {
      const json = serializeMemosForWidget(memos);
      setMemosForWidget(json);
    } catch (_) {}
  }, [memos]);

  const sorted = useMemo(() => [...memos].sort(sortMemos), [memos]);

  const addMemo = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    const now = Date.now();
    setMemos((prev) => [
      ...prev,
      { id: uuid(), text: trimmed, color: 'black', createdAt: now, updatedAt: now },
    ]);
    setText('');
  };

  const setColor = (id: string, color: MemoColor) => {
    setMemos((prev) => prev.map((m) => (m.id === id ? { ...m, color, updatedAt: Date.now() } : m)));
  };

  const requestEdit = (id: string) => {
    const item = memos.find((m) => m.id === id);
    if (!item) return;
    setEditingId(id);
    setEditingText(item.text);
  };

  const saveEdit = () => {
    if (!editingId) return;
    const trimmed = editingText.trim();
    if (!trimmed) {
      // empty -> delete
      setMemos((prev) => prev.filter((m) => m.id !== editingId));
    } else {
      setMemos((prev) => prev.map((m) => (m.id === editingId ? { ...m, text: trimmed, updatedAt: Date.now() } : m)));
    }
    setEditingId(null);
    setEditingText('');
  };

  const deleteMemo = (id: string) => {
    setMemos((prev) => prev.filter((m) => m.id !== id));
  };

  const toggleDeleteMode = () => {
    setDeleteMode((v) => !v);
    setSelectedIds(new Set());
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const confirmDeleteSelected = () => {
    if (selectedIds.size === 0) return;
    const ids = new Set(selectedIds);
    setMemos((prev) => prev.filter((m) => !ids.has(m.id)));
    setSelectedIds(new Set());
    setDeleteMode(false);
  };

  return (
    <SafeAreaView style={[styles.safe, isDarkMode && styles.safeDark]}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={76}
      >
        {/* Memo area with wrap and translucent background */}
        <ScrollView
          style={styles.widgetScroll}
          contentContainerStyle={[styles.widgetContainer, isDarkMode && styles.widgetContainerDark]}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.inlineWrap}>
            {sorted.map((item, idx) => (
              <View key={item.id} style={styles.inlineItem}>
                <MemoItem
                  item={item}
                  onChangeColor={setColor}
                  onRequestEdit={requestEdit}
                  onDelete={deleteMemo}
                  selectable={deleteMode}
                  selected={selectedIds.has(item.id)}
                  onToggleSelect={toggleSelect}
                />
              </View>
            ))}
          </View>
        </ScrollView>

        {/* Delete toolbar */}
        <View style={styles.toolbar}>
          {!deleteMode ? (
            <TouchableOpacity onPress={toggleDeleteMode} style={styles.toolbarBtn}>
              <Text style={styles.toolbarBtnText}>삭제</Text>
            </TouchableOpacity>
          ) : (
            <>
              <Text style={[styles.toolbarInfo, isDarkMode && styles.toolbarInfoDark]}>선택: {selectedIds.size}개</Text>
              <TouchableOpacity onPress={confirmDeleteSelected} style={[styles.toolbarBtn, styles.toolbarDanger]}>
                <Text style={styles.toolbarDangerText}>삭제 실행</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={toggleDeleteMode} style={styles.toolbarBtn}>
                <Text style={styles.toolbarBtnText}>취소</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* Input (bottom) */}
        <View style={[styles.inputBar, isDarkMode && styles.inputBarDark]}>
          <TextInput
            placeholder="메모를 입력하세요"
            value={text}
            onChangeText={setText}
            onSubmitEditing={addMemo}
            returnKeyType="done"
            style={[styles.input, isDarkMode && styles.inputDark]}
            placeholderTextColor={isDarkMode ? '#9AA0A6' : '#888'}
          />
          <TouchableOpacity onPress={addMemo} style={[styles.addBtn, isDarkMode && styles.addBtnDark]}>
            <Text style={[styles.addBtnText, isDarkMode && styles.addBtnTextDark]}>추가</Text>
          </TouchableOpacity>
        </View>

        {/* Edit modal */}
        <Modal visible={!!editingId} transparent animationType="fade">
          <View style={styles.modalBackdrop}>
            <View style={[styles.modalCard, isDarkMode && styles.modalCardDark]}>
              <Text style={[styles.modalTitle, isDarkMode && styles.modalTitleDark]}>메모 수정</Text>
              <TextInput
                value={editingText}
                onChangeText={setEditingText}
                style={[styles.modalInput, isDarkMode && styles.modalInputDark]}
                autoFocus
              />
              <View style={styles.modalRow}>
                <TouchableOpacity onPress={() => { setEditingId(null); setEditingText(''); }} style={styles.modalBtn}>
                  <Text>취소</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={saveEdit} style={[styles.modalBtn, styles.modalPrimary]}>
                  <Text style={{ color: 'white' }}>저장</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f6f6f6' },
  safeDark: { backgroundColor: '#000' },
  container: { flex: 1 },
  widgetScroll: { flexGrow: 0 },
  widgetContainer: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: 'rgba(0,0,0,0.05)',
    margin: 12,
    borderRadius: 12,
  },
  widgetContainerDark: {
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  inlineWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  inlineItem: {
    marginRight: 12, // visual gap ≈ 3 spaces
    marginBottom: 8,
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  toolbarInfo: { flex: 1, color: '#555' },
  toolbarInfoDark: { color: '#BBB' },
  toolbarBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#eee',
    borderRadius: 8,
    marginLeft: 8,
  },
  toolbarBtnText: { color: '#111' },
  toolbarDanger: { backgroundColor: '#f8d7da' },
  toolbarDangerText: { color: '#c62828', fontWeight: '600' },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: 'white',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#ddd',
  },
  inputBarDark: {
    backgroundColor: '#111',
    borderTopColor: '#333',
  },
  input: {
    flex: 1,
    height: 40,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: 'white',
    color: '#111',
  },
  inputDark: {
    borderColor: '#333',
    backgroundColor: '#1E1E1E',
    color: '#EEE',
  },
  addBtn: {
    marginLeft: 8,
    backgroundColor: '#111',
    paddingHorizontal: 16,
    height: 40,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtnText: { color: 'white', fontWeight: '600' },
  addBtnDark: { backgroundColor: '#EEE' },
  addBtnTextDark: { color: '#111' },
  banner: {
    backgroundColor: '#E3F2FD',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#BBDEFB',
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bannerText: { color: '#1565C0' },
  bannerBtn: {
    backgroundColor: '#1565C0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  bannerBtnText: { color: 'white', fontWeight: '600' },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCard: {
    width: '86%',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
  },
  modalTitle: { fontSize: 16, fontWeight: '600', marginBottom: 8, color: '#111' },
  modalInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 40,
    marginBottom: 12,
    color: '#111',
  },
  // Dark modal overrides
  modalCardDark: { backgroundColor: '#1C1C1E' },
  modalTitleDark: { color: '#EEE' },
  modalInputDark: { borderColor: '#333', color: '#EEE', backgroundColor: '#2A2A2C' },
  modalRow: { flexDirection: 'row', justifyContent: 'flex-end' },
  modalBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginLeft: 8,
    borderRadius: 8,
    backgroundColor: '#eee',
  },
  modalPrimary: { backgroundColor: '#111' },
});
