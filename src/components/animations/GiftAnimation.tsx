import React, { useEffect } from 'react';
import { Dimensions, StyleSheet, Text, View } from 'react-native';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { GiftType, GIFT_EMOJIS } from '../../types/game.types';

const { width: SW, height: SH } = Dimensions.get('window');

const PETAL_COUNT = 16;

interface Props {
  giftType: GiftType | null;
  fromPlayerName?: string;
  message?: string;
  onComplete: () => void;
}

function Petal({ index, emoji }: { index: number; emoji: string }) {
  const x = useSharedValue(Math.random() * SW);
  const y = useSharedValue(-40);
  const rot = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    const delay = index * 60;
    opacity.value = withDelay(delay, withTiming(1, { duration: 200 }));
    y.value = withDelay(delay, withTiming(SH + 40, { duration: 2000 + Math.random() * 1000 }));
    rot.value = withDelay(delay, withTiming(360 + Math.random() * 360, { duration: 2500 }));
  }, []);

  const style = useAnimatedStyle(() => ({
    position: 'absolute',
    left: x.value,
    top: y.value,
    opacity: opacity.value,
    transform: [{ rotate: `${rot.value}deg` }],
  }));

  return (
    <Animated.View style={style}>
      <Text style={{ fontSize: 24 }}>{emoji}</Text>
    </Animated.View>
  );
}

function GiftCenter({ giftType, fromPlayerName, message, onComplete }: Required<Omit<Props, 'giftType'>> & { giftType: GiftType }) {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(1);

  useEffect(() => {
    scale.value = withSequence(
      withSpring(1.3, { damping: 6 }),
      withSpring(1.0, { damping: 10 }),
    );
    opacity.value = withDelay(
      2800,
      withTiming(0, { duration: 500 }, (finished) => {
        if (finished) runOnJS(onComplete)();
      }),
    );
  }, []);

  const style = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[styles.giftCenter, style]}>
      <Text style={styles.giftEmoji}>{GIFT_EMOJIS[giftType]}</Text>
      <Text style={styles.giftFrom}>{fromPlayerName} sent you a gift!</Text>
      {!!message && <Text style={styles.giftMsg}>"{message}"</Text>}
    </Animated.View>
  );
}

export function GiftAnimation({ giftType, fromPlayerName = '', message, onComplete }: Props) {
  if (!giftType) return null;

  const petalEmoji = giftType === 'rose' ? '🌸' : giftType === 'fireworks' ? '✨' : '💫';

  return (
    <View style={styles.overlay} pointerEvents="none">
      {Array.from({ length: PETAL_COUNT }).map((_, i) => (
        <Petal key={i} index={i} emoji={petalEmoji} />
      ))}
      <GiftCenter
        giftType={giftType}
        fromPlayerName={fromPlayerName}
        message={message ?? ''}
        onComplete={onComplete}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#00000088',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 200,
  },
  giftCenter: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#1e003d',
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#e91e8c',
    marginHorizontal: 40,
  },
  giftEmoji: { fontSize: 72 },
  giftFrom: { color: '#fff', fontSize: 16, fontWeight: '600', marginTop: 12, textAlign: 'center' },
  giftMsg: { color: '#e91e8c', fontSize: 14, fontStyle: 'italic', marginTop: 8, textAlign: 'center' },
});
