import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { GiftAnimation } from '../components/animations/GiftAnimation';
import { useGameStore } from '../stores/useGameStore';
import { useUserStore } from '../stores/useUserStore';
import { PLAYER_COLOR_HEX } from '../constants/board.constants';

export function ResultScreen() {
  const { gameState, roomInfo, clearGame } = useGameStore();
  const { userId } = useUserStore();

  const scale = useSharedValue(0);
  const [confettiVisible, setConfettiVisible] = useState(true);

  useEffect(() => {
    scale.value = withSequence(
      withSpring(1.3, { damping: 5 }),
      withSpring(1.0, { damping: 8 }),
    );
  }, []);

  const trophyStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  if (!gameState) {
    return (
      <View style={styles.container}>
        <Text style={styles.subtitle}>Loading result…</Text>
      </View>
    );
  }

  const winner = gameState.players.find(
    (p) => gameState.tokens.filter((t) => t.playerId === p.playerId && t.state === 'finished').length === gameState.config.tokensPerPlayer
  );

  const didIWin = winner?.userId === userId;

  const handlePlayAgain = () => {
    const rn = roomInfo?.roomName;
    clearGame();
    router.replace('/');
    // After clearing, the user will re-create / re-join from home
  };

  const handleHome = () => {
    clearGame();
    router.replace('/');
  };

  return (
    <View style={styles.container}>
      {confettiVisible && (
        <GiftAnimation
          giftType="fireworks"
          fromPlayerName=""
          onComplete={() => setConfettiVisible(false)}
        />
      )}

      <Animated.Text style={[styles.trophy, trophyStyle]}>
        {didIWin ? '🏆' : '🥈'}
      </Animated.Text>

      <Text style={styles.headline}>
        {didIWin ? 'You Won! 🎉' : `${winner?.name ?? 'Opponent'} Won!`}
      </Text>

      {winner && (
        <View style={[styles.winnerBadge, { borderColor: PLAYER_COLOR_HEX[winner.color] }]}>
          <Text style={styles.winnerAvatar}>{winner.avatar}</Text>
          <Text style={styles.winnerName}>{winner.name}</Text>
        </View>
      )}

      <View style={styles.stats}>
        {gameState.players.map((p) => {
          const finished = gameState.tokens.filter(
            (t) => t.playerId === p.playerId && t.state === 'finished',
          ).length;
          return (
            <View key={p.playerId} style={styles.statRow}>
              <Text style={styles.statAvatar}>{p.avatar}</Text>
              <Text style={styles.statName}>{p.name}</Text>
              <Text style={styles.statValue}>{finished}/{gameState.config.tokensPerPlayer} 🏁</Text>
            </View>
          );
        })}
      </View>

      <View style={styles.btnRow}>
        <Pressable style={styles.btnPrimary} onPress={handlePlayAgain}>
          <Text style={styles.btnTextPrimary}>Play Again 🎲</Text>
        </Pressable>
        <Pressable style={styles.btnSecondary} onPress={handleHome}>
          <Text style={styles.btnTextSecondary}>Home</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0d0020',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 28,
    gap: 20,
  },
  trophy: { fontSize: 100 },
  headline: {
    fontSize: 34,
    fontWeight: '900',
    color: '#fff',
    textAlign: 'center',
    textShadowColor: 'rgba(233,30,140,0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 14,
  },
  winnerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    borderWidth: 2.5,
    backgroundColor: '#1a0035',
  },
  winnerAvatar: { fontSize: 30 },
  winnerName: { color: '#fff', fontSize: 20, fontWeight: '800' },
  stats: {
    width: '100%',
    backgroundColor: '#1a0035',
    borderRadius: 20,
    padding: 16,
    gap: 12,
    borderWidth: 1.5,
    borderColor: '#3b0d7a',
  },
  statRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  statAvatar: { fontSize: 24, width: 34 },
  statName: { flex: 1, color: '#e2d0ff', fontSize: 15, fontWeight: '600' },
  statValue: { color: '#a78bfa', fontSize: 14, fontWeight: '600' },
  btnRow: { flexDirection: 'row', gap: 12, width: '100%' },
  btnPrimary: {
    flex: 1,
    backgroundColor: '#e91e8c',
    borderRadius: 16,
    paddingVertical: 17,
    alignItems: 'center',
    shadowColor: '#e91e8c',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 10,
    elevation: 6,
  },
  btnTextPrimary: { color: '#fff', fontSize: 16, fontWeight: '800' },
  btnSecondary: {
    flex: 1,
    backgroundColor: 'transparent',
    borderRadius: 16,
    paddingVertical: 17,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#7c3aed',
  },
  btnTextSecondary: { color: '#c4b5fd', fontSize: 16, fontWeight: '700' },
  subtitle: { color: '#a78bfa', fontSize: 16 },
});
