import React, { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ToastItem, useToastStore } from '../../stores/useToastStore';

const BG: Record<string, string> = {
  success: '#0d2a1e',
  error: '#2a0d0d',
  info: '#1e003d',
};
const BORDER: Record<string, string> = {
  success: '#38a169',
  error: '#e53e3e',
  info: '#4299e1',
};
const ICON: Record<string, string> = {
  success: '✓',
  error: '✕',
  info: 'ℹ',
};
const ICON_COLOR: Record<string, string> = {
  success: '#38a169',
  error: '#e53e3e',
  info: '#4299e1',
};

export function Toast() {
  const { current, dismiss } = useToastStore();
  const insets = useSafeAreaInsets();

  // Cache the last item so we can animate it out even after current → null
  const [displayed, setDisplayed] = useState<ToastItem | null>(null);
  const translateY = useSharedValue(-100);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (current) {
      setDisplayed(current);
      translateY.value = withSpring(0, { damping: 22, stiffness: 280, mass: 0.8 });
      opacity.value = withTiming(1, { duration: 180 });
    } else {
      translateY.value = withTiming(-80, { duration: 220 });
      opacity.value = withTiming(0, { duration: 220 });
      const t = setTimeout(() => setDisplayed(null), 240);
      return () => clearTimeout(t);
    }
  }, [current?.id]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  if (!displayed) return null;

  return (
    <Animated.View
      style={[
        styles.toast,
        {
          backgroundColor: BG[displayed.type],
          borderColor: BORDER[displayed.type],
          top: insets.top + 12,
        },
        animStyle,
      ]}
      pointerEvents="box-none"
    >
      <Text style={[styles.icon, { color: ICON_COLOR[displayed.type] }]}>
        {ICON[displayed.type]}
      </Text>
      <Text style={styles.message} numberOfLines={2}>{displayed.message}</Text>
      <Pressable onPress={dismiss} hitSlop={12}>
        <Text style={styles.close}>✕</Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    zIndex: 9999,
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  icon: { fontSize: 16, fontWeight: '700', width: 18, textAlign: 'center' },
  message: { flex: 1, color: '#eee', fontSize: 14, fontWeight: '500', lineHeight: 20 },
  close: { color: '#7c6a9a', fontSize: 13, paddingLeft: 4 },
});
