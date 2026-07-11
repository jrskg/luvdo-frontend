import React, { useEffect, useRef } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { PLAYER_COLOR_HEX, PLAYER_COLOR_LIGHT } from '../../constants/board.constants';
import { PlayerColor, Token } from '../../types/game.types';

interface Props {
  token: Token;
  x: number;
  y: number;
  size: number;
  isHighlighted: boolean;
  isAnimating?: boolean;
  /** Step-by-step pixel path. When provided, token walks each cell before landing. */
  positionSteps?: Array<{ x: number; y: number }>;
  onPress: () => void;
}

export const STEP_DURATION = 250; // ms per cell

// Yellow tokens (#fdd835) can't use gold (#FFD700) for the highlight — use orange instead.
const HIGHLIGHT_COLOR: Record<PlayerColor, string> = {
  red: '#FFD700',
  green: '#FFD700',
  yellow: '#FF6B00',
  blue: '#FFD700',
};

export function TokenAnimation({
  token, x, y, size, isHighlighted, isAnimating, positionSteps, onPress,
}: Props) {
  const posX = useSharedValue(x);
  const posY = useSharedValue(y);
  const scale = useSharedValue(1);
  const highlightPulse = useSharedValue(1);

  // Prevent the direct-slide effect re-firing after a step animation clears.
  // Without this, clearing positionSteps triggers a 280ms slide that can
  // cancel the tail of a still-running withSequence.
  const hadStepAnimRef = useRef(false);

  useEffect(() => {
    const wasStepAnim = hadStepAnimRef.current;

    if (positionSteps && positionSteps.length >= 1) {
      hadStepAnimRef.current = true;
      // Walk every intermediate cell, then land on final (x, y)
      const allSteps = [...positionSteps, { x, y }];
      posX.value = withSequence(
        ...allSteps.map((s) => withTiming(s.x, { duration: STEP_DURATION })),
      );
      posY.value = withSequence(
        ...allSteps.map((s) => withTiming(s.y, { duration: STEP_DURATION })),
      );
    } else if (!wasStepAnim) {
      // Normal direct slide — only when NOT recovering from a step animation
      posX.value = withTiming(x, { duration: 260, easing: Easing.out(Easing.cubic) });
      posY.value = withTiming(y, { duration: 260, easing: Easing.out(Easing.cubic) });
    } else {
      // positionSteps just cleared after step animation — step anim already
      // landed on (x,y), so don't retrigger a competing slide.
      hadStepAnimRef.current = false;
    }
  }, [x, y, positionSteps]);

  useEffect(() => {
    if (isHighlighted) {
      highlightPulse.value = withRepeat(
        withSequence(withTiming(1.25, { duration: 380 }), withTiming(1, { duration: 380 })),
        -1,
        true,
      );
    } else {
      highlightPulse.value = withTiming(1);
    }
  }, [isHighlighted]);

  useEffect(() => {
    if (isAnimating) {
      scale.value = withSequence(
        withTiming(0.7, { duration: 100 }),
        withSpring(1.2, { damping: 5 }),
        withSpring(1),
      );
    }
  }, [isAnimating]);

  const style = useAnimatedStyle(() => ({
    position: 'absolute',
    left: posX.value,
    top: posY.value,
    transform: [{ scale: scale.value * highlightPulse.value }],
  }));

  const hColor = HIGHLIGHT_COLOR[token.color];
  const color = PLAYER_COLOR_HEX[token.color];
  const lightColor = PLAYER_COLOR_LIGHT[token.color];

  return (
    <Animated.View style={style}>
      <Pressable
        onPress={token.state !== 'finished' ? onPress : undefined}
        style={[
          styles.tokenOuter,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: color,
            borderColor: isHighlighted ? hColor : '#ffffff',
            shadowColor: isHighlighted ? hColor : '#000000',
          },
        ]}
      >
        <View
          style={[
            styles.tokenInner,
            {
              width: size * 0.42,
              height: size * 0.42,
              borderRadius: size * 0.21,
              backgroundColor: lightColor,
              borderWidth: 1,
              borderColor: 'rgba(255,255,255,0.5)',
            },
          ]}
        />
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  tokenOuter: {
    borderWidth: 3,
    elevation: 10,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.7,
    shadowRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tokenInner: {},
});
