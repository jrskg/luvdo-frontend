import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

const DOT_POSITIONS: Record<number, Array<[number, number]>> = {
  1: [[50, 50]],
  2: [[30, 30], [70, 70]],
  3: [[30, 30], [50, 50], [70, 70]],
  4: [[30, 30], [70, 30], [30, 70], [70, 70]],
  5: [[30, 30], [70, 30], [50, 50], [30, 70], [70, 70]],
  6: [[30, 22], [70, 22], [30, 50], [70, 50], [30, 78], [70, 78]],
};

const IDLE_DOTS: Array<[number, number]> = [
  [30, 22], [70, 22], [30, 50], [70, 50], [30, 78], [70, 78],
];

const DOT_R = 12;

interface Props {
  value: number | null;
  isRolling: boolean;
  disabled?: boolean;
  /** Player's hex color — used as the 6-reveal accent (glow, border, dots). */
  accentColor?: string;
}

export function DiceAnimation({ value, isRolling, disabled, accentColor = '#FFD700' }: Props) {
  const rotation = useSharedValue(0);
  const scale = useSharedValue(1);
  const glowOpacity = useSharedValue(0);

  const [rollingFace, setRollingFace] = useState<number>(1);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (isRolling) {
      setRollingFace(Math.ceil(Math.random() * 6));
      intervalRef.current = setInterval(() => {
        setRollingFace(Math.ceil(Math.random() * 6));
      }, 90);

      rotation.value = withRepeat(
        withSequence(
          withTiming(20, { duration: 70 }),
          withTiming(-20, { duration: 70 }),
        ),
        -1,
        true,
      );
      scale.value = withRepeat(
        withSequence(withTiming(0.88, { duration: 85 }), withTiming(1.12, { duration: 85 })),
        -1,
        true,
      );
      glowOpacity.value = 0;
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }

      // Stop the shake quickly — no spring so it snaps cleanly
      rotation.value = withTiming(0, { duration: 80 });

      if (value === 6) {
        // Crisp pop: up then settle — no spring oscillation
        scale.value = withSequence(
          withTiming(1.22, { duration: 90 }),
          withTiming(1, { duration: 260 }),
        );
        glowOpacity.value = withTiming(1, { duration: 130 });
        setTimeout(() => {
          glowOpacity.value = withTiming(0, { duration: 800 });
        }, 1500);
      } else if (value !== null) {
        scale.value = withSequence(
          withTiming(1.10, { duration: 80 }),
          withTiming(1, { duration: 200 }),
        );
      } else {
        // Dice becoming idle — snap immediately, no visible animation
        scale.value = 1;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isRolling, value]);

  const containerStyle = useAnimatedStyle(() => ({
    transform: [
      { rotate: `${rotation.value}deg` },
      { scale: scale.value },
    ],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  const displayValue = isRolling ? rollingFace : value;
  const dots = displayValue ? DOT_POSITIONS[displayValue] : null;
  const isSix = !isRolling && value === 6;

  let dotFill: string;
  if (!dots) {
    dotFill = 'rgba(26,0,53,0.28)';
  } else if (isSix) {
    dotFill = accentColor; // player's own color on six
  } else {
    dotFill = '#1a0035';
  }

  return (
    <View style={styles.wrapper}>
      {/* Colored glow ring — uses player's accent color, not always gold */}
      <Animated.View
        style={[
          styles.glow,
          { boxShadow: `0px 0px 28px ${accentColor}DD` } as any,
          glowStyle,
        ]}
      />

      <Animated.View
        style={[
          styles.dice,
          isSix && ({
            borderColor: accentColor,
            borderWidth: 2,
            backgroundColor: '#FFFEF2',
            shadowColor: accentColor,
            shadowOpacity: 0.5,
          } as any),
          containerStyle,
        ]}
      >
        <Svg width={48} height={48} viewBox="0 0 100 100">
          {(dots ?? IDLE_DOTS).map(([cx, cy], i) => (
            <Circle key={i} cx={cx} cy={cy} r={DOT_R} fill={dotFill} />
          ))}
        </Svg>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  glow: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'transparent',
    elevation: 0,
  } as any,
  dice: {
    width: 56,
    height: 56,
    borderRadius: 11,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 12,
    shadowColor: '#1a0035',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 6,
    borderWidth: 1.5,
    borderColor: 'rgba(26,0,53,0.12)',
  },
} as any);
