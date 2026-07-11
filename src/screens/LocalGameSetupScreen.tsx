import React, { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useUserStore } from '../stores/useUserStore';
import { useLocalGameStore } from '../stores/useLocalGameStore';
import { PlayerColor } from '../types/game.types';
import {
  COLOR_ORDER,
  DIAGONAL_BOT_COLORS,
  LocalPlayerSetup,
} from '../services/localGame.service';
import { PLAYER_COLOR_HEX, PLAYER_COLOR_LIGHT } from '../constants/board.constants';

type Mode = '1v1' | '1v2' | '1v3';
type GameType = 'bot' | 'passplay';

const BOT_AVATARS: Record<PlayerColor, string> = { red: '🤖', green: '🤖', yellow: '🤖', blue: '🤖' };
const BOT_NAMES: Record<PlayerColor, string> = { red: 'Bot Red', green: 'Bot Green', yellow: 'Bot Yellow', blue: 'Bot Blue' };

const PLAYER_EMOJIS = ['🎮', '🕹️', '👾', '🎯'];
const PLAYER_DEFAULTS = ['Player 2', 'Player 3', 'Player 4'];

// Given human color(s) + total players, return the full color order
function assignColors(humanColor: PlayerColor, mode: Mode): PlayerColor[] {
  if (mode === '1v1') {
    const bot = DIAGONAL_BOT_COLORS[humanColor];
    return [humanColor, bot];
  }
  if (mode === '1v2') {
    // Human + 2 bots: use diagonal + one adjacent
    const diagonal = DIAGONAL_BOT_COLORS[humanColor];
    const remaining = COLOR_ORDER.filter((c) => c !== humanColor && c !== diagonal);
    return [humanColor, diagonal, remaining[0]];
  }
  // 1v3: human + all 3 other colors
  return [humanColor, ...COLOR_ORDER.filter((c) => c !== humanColor)];
}

export function LocalGameSetupScreen() {
  const { userId, name, avatar, mood } = useUserStore();
  const { startLocalGame } = useLocalGameStore();
  const { defaultType } = useLocalSearchParams<{ defaultType?: string }>();

  const [gameType, setGameType] = useState<GameType>(
    defaultType === 'passplay' ? 'passplay' : 'bot',
  );
  const [mode, setMode] = useState<Mode>('1v1');
  const [myColor, setMyColor] = useState<PlayerColor>('red');
  // Human player names for pass-and-play
  const [humanNames] = useState<string[]>(PLAYER_DEFAULTS);

  const humanCount = mode === '1v1' ? 1 : mode === '1v2' ? 1 : 1;
  const totalPlayers = mode === '1v1' ? 2 : mode === '1v2' ? 3 : 4;
  const botCount = gameType === 'bot' ? totalPlayers - humanCount : 0;
  const passPlayHumanCount = gameType === 'passplay' ? totalPlayers : 0;

  const handleStart = () => {
    const colors = assignColors(myColor, mode);
    const players: LocalPlayerSetup[] = [];

    if (gameType === 'bot') {
      // Me first
      players.push({
        name: name ?? 'Player 1',
        avatar: avatar ?? '😊',
        mood: mood ?? 'Happy',
        color: colors[0],
        isBot: false,
        userId: userId ?? 'local_me',
      });
      // Bots fill remaining slots
      for (let i = 1; i < colors.length; i++) {
        players.push({
          name: BOT_NAMES[colors[i]],
          avatar: '🤖',
          mood: 'Happy',
          color: colors[i],
          isBot: true,
          userId: `bot_${colors[i]}`,
        });
      }
    } else {
      // Pass-and-play: all humans
      for (let i = 0; i < colors.length; i++) {
        players.push({
          name: i === 0 ? (name ?? 'Player 1') : humanNames[i - 1] ?? `Player ${i + 1}`,
          avatar: PLAYER_EMOJIS[i],
          mood: 'Happy',
          color: colors[i],
          isBot: false,
          userId: i === 0 ? (userId ?? 'local_me') : `local_p${i + 1}`,
        });
      }
    }

    startLocalGame(players);
    router.replace('/local-game');
  };

  const modeLabel = (m: Mode) => ({ '1v1': '1 vs 1', '1v2': '1 vs 2', '1v3': '1 vs 3' }[m]);
  const playerCountLabel = mode === '1v1' ? '2 players' : mode === '1v2' ? '3 players' : '4 players';

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.colorDots}>
          {COLOR_ORDER.map((c) => (
            <View key={c} style={[styles.dot, { backgroundColor: PLAYER_COLOR_HEX[c] }]} />
          ))}
        </View>
        <Text style={styles.title}>Offline Game</Text>
        <Text style={styles.subtitle}>No internet needed</Text>
      </View>

      {/* Game Type */}
      <Text style={styles.label}>Game Type</Text>
      <View style={styles.segmented}>
        {(['bot', 'passplay'] as GameType[]).map((gt) => (
          <Pressable
            key={gt}
            style={[styles.seg, gameType === gt && styles.segActive]}
            onPress={() => setGameType(gt)}
          >
            <Text style={[styles.segText, gameType === gt && styles.segTextActive]}>
              {gt === 'bot' ? '🤖 vs Bot' : '👥 Pass & Play'}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Player Count */}
      <Text style={styles.label}>Players</Text>
      <View style={styles.segmented}>
        {(['1v1', '1v2', '1v3'] as Mode[]).map((m) => (
          <Pressable
            key={m}
            style={[styles.seg, mode === m && styles.segActive]}
            onPress={() => setMode(m)}
          >
            <Text style={[styles.segText, mode === m && styles.segTextActive]}>
              {modeLabel(m)}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Color Picker */}
      <Text style={styles.label}>
        {gameType === 'bot' ? 'Your Color' : 'Player 1 Color'}
      </Text>
      <View style={styles.colorRow}>
        {COLOR_ORDER.map((c) => (
          <Pressable
            key={c}
            style={[
              styles.colorBtn,
              { backgroundColor: PLAYER_COLOR_HEX[c], borderColor: myColor === c ? '#fff' : 'transparent' },
            ]}
            onPress={() => setMyColor(c)}
          >
            {myColor === c && <Text style={styles.colorCheck}>✓</Text>}
          </Pressable>
        ))}
      </View>

      {/* Preview */}
      <View style={styles.preview}>
        <Text style={styles.previewTitle}>
          {playerCountLabel} · {gameType === 'bot' ? `${botCount} bot${botCount > 1 ? 's' : ''}` : 'all human'}
        </Text>
        <View style={styles.previewPlayers}>
          {assignColors(myColor, mode).map((c, i) => {
            const isMe = i === 0;
            const isBot = gameType === 'bot' && !isMe;
            return (
              <View key={c} style={[styles.previewChip, { backgroundColor: PLAYER_COLOR_LIGHT[c], borderColor: PLAYER_COLOR_HEX[c] }]}>
                <Text style={styles.previewChipIcon}>{isBot ? '🤖' : PLAYER_EMOJIS[i]}</Text>
                <Text style={[styles.previewChipLabel, { color: PLAYER_COLOR_HEX[c] }]}>
                  {isMe ? (name ?? 'Me') : isBot ? 'Bot' : `P${i + 1}`}
                </Text>
              </View>
            );
          })}
        </View>
      </View>

      {/* Start */}
      <Pressable style={styles.startBtn} onPress={handleStart}>
        <Text style={styles.startText}>Start Game 🎲</Text>
      </Pressable>

      <Pressable style={styles.backBtn} onPress={() => router.back()}>
        <Text style={styles.backText}>← Back</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#0d0020',
    paddingHorizontal: 20,
    paddingBottom: 40,
    gap: 14,
  },
  header: {
    backgroundColor: '#1a0035',
    marginHorizontal: -20,
    paddingHorizontal: 20,
    paddingTop: 52,
    paddingBottom: 24,
    borderBottomWidth: 3,
    borderBottomColor: '#e91e8c',
    gap: 4,
    alignItems: 'center',
  },
  colorDots: { flexDirection: 'row', gap: 8, marginBottom: 4 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  title: {
    fontSize: 36,
    fontWeight: '900',
    color: '#fff',
    textShadowColor: 'rgba(233,30,140,0.6)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
  },
  subtitle: { color: '#c4b5fd', fontSize: 13 },
  label: {
    color: '#a78bfa',
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    fontWeight: '700',
    marginTop: 6,
  },
  segmented: {
    flexDirection: 'row',
    backgroundColor: '#1a0035',
    borderRadius: 14,
    padding: 4,
    gap: 4,
    borderWidth: 1.5,
    borderColor: '#3b0d7a',
  },
  seg: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
  },
  segActive: {
    backgroundColor: '#e91e8c',
    shadowColor: '#e91e8c',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 4,
  },
  segText: { color: '#7c6a9a', fontWeight: '600', fontSize: 13 },
  segTextActive: { color: '#fff', fontWeight: '800' },
  colorRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
  },
  colorBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
  },
  colorCheck: { color: '#fff', fontSize: 22, fontWeight: '900' },
  preview: {
    backgroundColor: '#1a0035',
    borderRadius: 18,
    padding: 16,
    gap: 12,
    borderWidth: 1.5,
    borderColor: '#3b0d7a',
  },
  previewTitle: { color: '#c4b5fd', fontSize: 13, fontWeight: '700', textAlign: 'center' },
  previewPlayers: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 10,
  },
  previewChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 2,
  },
  previewChipIcon: { fontSize: 18 },
  previewChipLabel: { fontSize: 13, fontWeight: '700' },
  startBtn: {
    backgroundColor: '#e91e8c',
    borderRadius: 16,
    paddingVertical: 17,
    alignItems: 'center',
    shadowColor: '#e91e8c',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 10,
    elevation: 6,
    marginTop: 8,
  },
  startText: { color: '#fff', fontSize: 17, fontWeight: '800' },
  backBtn: { alignItems: 'center', paddingVertical: 10 },
  backText: { color: '#7c6a9a', fontSize: 14 },
});
