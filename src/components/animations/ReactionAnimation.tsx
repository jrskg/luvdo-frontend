import React, { useEffect } from 'react';
import { StyleSheet, Text } from 'react-native';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { ReactionType, REACTION_EMOJIS } from '../../types/game.types';

interface Props {
  reactionType: ReactionType | null;
  fromPlayerName: string;
  onComplete: () => void;
}

export function ReactionAnimation({ reactionType, fromPlayerName, onComplete }: Props) {
  const scale = useSharedValue(0);
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (!reactionType) return;

    scale.value = 0;
    translateY.value = 0;
    opacity.value = 1;

    scale.value = withSequence(
      withSpring(1.5, { damping: 5, stiffness: 200 }),
      withSpring(1.0, { damping: 10 }),
    );

    translateY.value = withDelay(
      600,
      withTiming(-120, { duration: 900 }),
    );

    opacity.value = withDelay(
      600,
      withTiming(0, { duration: 900 }, (finished) => {
        if (finished) runOnJS(onComplete)();
      }),
    );
  }, [reactionType]);

  const style = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { translateY: translateY.value }],
    opacity: opacity.value,
  }));

  if (!reactionType) return null;

  return (
    <Animated.View style={[styles.container, style]} pointerEvents="none">
      <Text style={styles.emoji}>{REACTION_EMOJIS[reactionType]}</Text>
      <Text style={styles.name}>{fromPlayerName}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    alignSelf: 'center',
    bottom: '40%',
    alignItems: 'center',
    zIndex: 100,
  },
  emoji: {
    fontSize: 56,
    textShadow: '0px 2px 8px rgba(0, 0, 0, 1)',
  },
  name: {
    color: '#fff',
    fontSize: 12,
    marginTop: 4,
    opacity: 0.8,
  },
} as any);
