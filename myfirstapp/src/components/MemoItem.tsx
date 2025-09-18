import React, { useRef } from 'react';
import { View, Text, StyleSheet, GestureResponderEvent, useColorScheme } from 'react-native';
import { MemoItemData, MemoColor } from '../types';

type Props = {
  item: MemoItemData;
  onChangeColor: (id: string, color: MemoColor) => void;
  onRequestEdit: (id: string) => void;
  onDelete: (id: string) => void;
  selectable?: boolean;
  selected?: boolean;
  onToggleSelect?: (id: string) => void;
};

const LONG_PRESS_MS = 450; // long press threshold
const DELETE_DRAG_DY = 80; // px drag down to delete

function MemoItem({ item, onChangeColor, onRequestEdit, onDelete, selectable, selected, onToggleSelect }: Props) {
  const isDarkMode = useColorScheme() === 'dark';
  const pressStartTimeRef = useRef(0);
  const longTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longActiveRef = useRef(false);

  const startYRef = useRef(0);
  const lastYRef = useRef(0);
  const deletedRef = useRef(false);

  const handleGrant = (e: GestureResponderEvent) => {
    const now = Date.now();
    pressStartTimeRef.current = now;
    deletedRef.current = false;
    longActiveRef.current = false;
    startYRef.current = e.nativeEvent.pageY;
    lastYRef.current = e.nativeEvent.pageY;
    if (longTimerRef.current) clearTimeout(longTimerRef.current);
    longTimerRef.current = setTimeout(() => {
      longActiveRef.current = true;
    }, LONG_PRESS_MS);
  };

  const handleMove = (e: GestureResponderEvent) => {
    lastYRef.current = e.nativeEvent.pageY;
    const dy = lastYRef.current - startYRef.current;
    if (longActiveRef.current && !deletedRef.current && dy > DELETE_DRAG_DY) {
      deletedRef.current = true;
      if (longTimerRef.current) clearTimeout(longTimerRef.current);
      onDelete(item.id);
    }
  };

  const handleRelease = () => {
    if (longTimerRef.current) clearTimeout(longTimerRef.current);
    if (deletedRef.current) return;
    if (longActiveRef.current) {
      // Long press without delete → edit
      if (!selectable) onRequestEdit(item.id);
      return;
    }
    if (selectable) {
      onToggleSelect?.(item.id);
    } else {
      // Single tap → cycle color: black -> blue -> red -> green -> black
      onChangeColor(item.id, nextColor(item.color));
    }
  };

  return (
    <View
      style={[styles.container]}
      onStartShouldSetResponder={() => true}
      onResponderGrant={handleGrant}
      onResponderMove={handleMove}
      onResponderRelease={handleRelease}
    >
      <Text style={[styles.text, dynamicColorStyle(item.color, isDarkMode), selected ? styles.selectedText : null]}>{item.text}</Text>
    </View>
  );
}

function dynamicColorStyle(color: MemoColor, isDark: boolean) {
  switch (color) {
    case 'red':
      return { color: '#E53935' };
    case 'blue':
      return { color: '#1E88E5' };
    case 'green':
      return { color: '#43A047' };
    default:
      return { color: isDark ? '#EEE' : '#111' };
  }
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 4,
    paddingHorizontal: 0,
    backgroundColor: 'transparent',
  },
  text: {
    fontSize: 16,
  },
  selectedText: {
    textDecorationLine: 'underline',
  },
});

export default React.memo(MemoItem, (prev, next) => {
  return (
    prev.item.id === next.item.id &&
    prev.item.text === next.item.text &&
    prev.item.color === next.item.color &&
    prev.selectable === next.selectable &&
    prev.selected === next.selected
  );
});

function nextColor(color: MemoColor): MemoColor {
  switch (color) {
    case 'black':
      return 'blue';
    case 'blue':
      return 'red';
    case 'red':
      return 'green';
    default:
      return 'black';
  }
}
