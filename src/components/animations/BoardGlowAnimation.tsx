import React, { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { PLAYER_COLOR_HEX } from '../../constants/board.constants';
import { PlayerColor } from '../../types/game.types';

interface Props {
  playerColor: PlayerColor | null;
  isActive: boolean;
  size: number;
}

export function BoardGlowAnimation({ playerColor, isActive, size }: Props) {
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (isActive && playerColor) {
      opacity.value = withRepeat(withTiming(0.7, { duration: 700 }), -1, true);
    } else {
      opacity.value = withTiming(0, { duration: 300 });
    }
  }, [isActive, playerColor]);

  const glowStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const color = playerColor ? PLAYER_COLOR_HEX[playerColor] : '#e91e8c';

  return (
    <Animated.View
      style={[
        styles.glow,
        {
          width: size + 8,
          height: size + 8,
          borderRadius: 12,
          borderWidth: 3,
          borderColor: color,
          boxShadow: `0px 0px 12px ${color}`,
        } as any,
        glowStyle,
      ]}
      pointerEvents="none"
    />
  );
}

const styles = StyleSheet.create({
  glow: {
    position: 'absolute',
    borderStyle: 'solid',
    elevation: 0,
    zIndex: 1,
  },
});
