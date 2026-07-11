import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { PLAYER_COLOR_HEX, PLAYER_COLOR_LIGHT } from '../../constants/board.constants';
import { MOOD_EMOJIS } from '../../types/game.types';
import { Player, Token } from '../../types/game.types';

interface Props {
  player: Player;
  isCurrentTurn: boolean;
  tokensFinished: number;
  totalTokens: number;
  isOpponent?: boolean;
  entranceDelay?: number;
}

export function PlayerPanel({ player, isCurrentTurn, tokensFinished, totalTokens, isOpponent, entranceDelay = 0 }: Props) {
  const color = PLAYER_COLOR_HEX[player.color];
  const lightColor = PLAYER_COLOR_LIGHT[player.color];

  const opacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = withDelay(entranceDelay, withTiming(1, { duration: 300 }));
  }, []);

  const animStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View
      style={[
        styles.container,
        isCurrentTurn && { borderColor: color, backgroundColor: color + '15' },
        animStyle,
      ]}
    >
      <View style={[styles.avatarWrapper, { borderColor: color }]}>
        <Text style={styles.avatar}>{player.avatar}</Text>
        {isCurrentTurn && <View style={[styles.turnDot, { backgroundColor: color }]} />}
      </View>

      <View style={styles.info}>
        <View style={styles.nameRow}>
          <Text style={styles.name} numberOfLines={1}>{player.name}</Text>
          <Text style={styles.mood}>{MOOD_EMOJIS[player.mood]}</Text>
          {!player.isConnected && <Text style={styles.offline}>●</Text>}
        </View>
        <View style={styles.progressRow}>
          {Array.from({ length: totalTokens }).map((_, i) => (
            <View
              key={i}
              style={[
                styles.tokenDot,
                { backgroundColor: i < tokensFinished ? color : '#2e1060' },
              ]}
            />
          ))}
        </View>
      </View>

      {isCurrentTurn && (
        <View style={[styles.turnBadge, { backgroundColor: color }]}>
          <Text style={styles.turnText}>TURN</Text>
        </View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#2e1060',
    backgroundColor: '#1e003d',
  },
  avatarWrapper: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2b0554',
    position: 'relative',
  },
  avatar: { fontSize: 24 },
  turnDot: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#1e003d',
  },
  info: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  name: { color: '#fff', fontSize: 14, fontWeight: '600', maxWidth: 100 },
  mood: { fontSize: 14 },
  offline: { color: '#e53e3e', fontSize: 8 },
  progressRow: { flexDirection: 'row', gap: 4, marginTop: 4 },
  tokenDot: { width: 8, height: 8, borderRadius: 4 },
  turnBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  turnText: { color: '#fff', fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },
});
