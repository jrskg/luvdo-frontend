import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { router } from 'expo-router';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
} from 'react-native-reanimated';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function ScaleBtn({ style, onPress, disabled, children }: { style?: any; onPress: () => void; disabled?: boolean; children: React.ReactNode }) {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <AnimatedPressable
      style={[style, animStyle]}
      onPress={onPress}
      disabled={disabled}
      onPressIn={() => { scale.value = withSpring(0.95, { damping: 15 }); }}
      onPressOut={() => { scale.value = withSpring(1, { damping: 12 }); }}
    >
      {children}
    </AnimatedPressable>
  );
}
import { useUserStore } from '../stores/useUserStore';
import { useGameStore } from '../stores/useGameStore';
import { useSocketStore } from '../stores/useSocketStore';
import { SOCKET_EVENTS } from '../constants/socket-events';
import { socketService } from '../services/socket.service';
import { MoodSelector } from '../components/ui/MoodSelector';
import { MoodType } from '../types/game.types';

export function HomeScreen() {
  const { name, avatar, mood, logout, setMood } = useUserStore();
  const { gameError } = useSocketStore();
  const [roomName, setRoomName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const heartScale = useSharedValue(1);
  useEffect(() => {
    heartScale.value = withRepeat(
      withSequence(withSpring(1.2, { damping: 5 }), withSpring(1, { damping: 8 })),
      -1,
      false,
    );
  }, []);
  const heartStyle = useAnimatedStyle(() => ({ transform: [{ scale: heartScale.value }] }));

  // Navigate to lobby (or directly to game for bot games)
  const roomInfo = useGameStore(state => state.roomInfo);
  const isGameStarted = useGameStore(state => state.isGameStarted);

  useEffect(() => {
    if (roomInfo?.roomId && !roomInfo.isBotGame) {
      router.push({ pathname: '/lobby', params: { roomId: roomInfo.roomId, roomName: roomInfo.roomName } });
    }
  }, [roomInfo?.roomId]);

  useEffect(() => {
    if (isGameStarted) router.replace('/game');
  }, [isGameStarted]);

  const emitWhenConnected = (event: string, payload: object) => {
    const socket = socketService.getGameSocket();
    if (!socket) return;
    if (socket.connected) {
      socket.emit(event, payload);
    } else {
      socket.once('connect', () => socket.emit(event, payload));
    }
  };

  const handleAction = async (action: 'create' | 'join') => {
    if (!roomName.trim()) { setError('Enter a room name'); return; }
    setError('');
    setLoading(true);
    try {
      const event = action === 'create' ? SOCKET_EVENTS.CREATE_ROOM : SOCKET_EVENTS.JOIN_ROOM;
      emitWhenConnected(event, { roomName: roomName.trim() });
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">

        {/* Hero header */}
        <View style={styles.heroSection}>
          <View style={styles.colorDots}>
            <View style={[styles.dot, { backgroundColor: '#e53935' }]} />
            <View style={[styles.dot, { backgroundColor: '#43a047' }]} />
            <View style={[styles.dot, { backgroundColor: '#fdd835' }]} />
            <View style={[styles.dot, { backgroundColor: '#1e88e5' }]} />
          </View>
          <View style={styles.logoRow}>
            <Text style={styles.title}>Luvdo</Text>
            <Animated.Text style={[styles.heart, heartStyle]}>❤️</Animated.Text>
          </View>
          <Text style={styles.subtitle}>Play Ludo with your person 🎮</Text>
        </View>

        {/* User info */}
        <View style={styles.userRow}>
          <View style={styles.userInfo}>
            <Text style={styles.userAvatar}>{avatar}</Text>
            <View>
              <Text style={styles.userHey}>Hey there,</Text>
              <Text style={styles.userName}>{name}</Text>
            </View>
          </View>
          <Pressable style={styles.logoutBtn} onPress={() => { logout(); router.replace('/auth'); }}>
            <Text style={styles.logoutText}>Logout</Text>
          </Pressable>
        </View>

        {/* Mood */}
        <Text style={styles.label}>🎭 Your Mood</Text>
        <MoodSelector currentMood={mood ?? 'Happy'} onChange={(m: MoodType) => setMood(m)} />

        {/* Room card */}
        <View style={styles.roomCard}>
          <Text style={styles.roomCardTitle}>🏠 Room Name</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. A ❤️ B"
            placeholderTextColor="#7c6a9a"
            value={roomName}
            onChangeText={setRoomName}
            maxLength={30}
          />
          {error ? <Text style={styles.error}>{error}</Text> : null}

          <View style={styles.btnRow}>
            <ScaleBtn style={[styles.btn, styles.btnCreate]} onPress={() => handleAction('create')} disabled={loading}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Create Room</Text>}
            </ScaleBtn>
            <ScaleBtn style={[styles.btn, styles.btnJoin]} onPress={() => handleAction('join')} disabled={loading}>
              <Text style={[styles.btnText, { color: '#e91e8c' }]}>Join Room</Text>
            </ScaleBtn>
          </View>
        </View>

        {/* Divider */}
        <View style={styles.dividerRow}>
          <View style={styles.divider} />
          <Text style={styles.dividerText}>or play offline</Text>
          <View style={styles.divider} />
        </View>

        {/* Local play button */}
        <ScaleBtn style={styles.btnOffline} onPress={() => router.push('/local-setup')} disabled={loading}>
          <View style={styles.btnBotInner}>
            <Text style={styles.btnBotIcon}>🎲</Text>
            <View>
              <Text style={styles.btnBotText}>Play Local</Text>
              <Text style={styles.btnBotSub}>Bots or Pass & Play • No internet</Text>
            </View>
          </View>
        </ScaleBtn>

        {/* Color bar decoration */}
        <View style={styles.colorBar}>
          <View style={[styles.colorBarSegment, { backgroundColor: '#e53935' }]} />
          <View style={[styles.colorBarSegment, { backgroundColor: '#43a047' }]} />
          <View style={[styles.colorBarSegment, { backgroundColor: '#fdd835' }]} />
          <View style={[styles.colorBarSegment, { backgroundColor: '#1e88e5' }]} />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#0d0020',
    paddingHorizontal: 20,
    paddingBottom: 40,
    gap: 16,
  },
  heroSection: {
    backgroundColor: '#1a0035',
    marginHorizontal: -20,
    paddingHorizontal: 20,
    paddingTop: 52,
    paddingBottom: 24,
    borderBottomWidth: 3,
    borderBottomColor: '#e91e8c',
    gap: 8,
  },
  colorDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 4,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  logoRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  title: {
    fontSize: 48,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: -1,
    textShadowColor: 'rgba(233,30,140,0.6)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
  },
  heart: { fontSize: 40 },
  subtitle: { textAlign: 'center', color: '#c4b5fd', fontSize: 14 },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1e003d',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1.5,
    borderColor: '#7c3aed',
  },
  userInfo: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  userAvatar: { fontSize: 32 },
  userHey: { color: '#7c6a9a', fontSize: 11 },
  userName: { color: '#fff', fontWeight: '700', fontSize: 16 },
  logoutBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e91e8c',
  },
  logoutText: { color: '#e91e8c', fontSize: 12, fontWeight: '700' },
  label: { color: '#a78bfa', fontSize: 12, textTransform: 'uppercase', letterSpacing: 1.5, fontWeight: '700' },
  roomCard: {
    backgroundColor: '#1a0035',
    borderRadius: 20,
    padding: 16,
    gap: 12,
    borderWidth: 1.5,
    borderColor: '#3b0d7a',
  },
  roomCardTitle: { color: '#c4b5fd', fontSize: 14, fontWeight: '700' },
  input: {
    backgroundColor: '#0d0020',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: '#fff',
    fontSize: 16,
    borderWidth: 1.5,
    borderColor: '#3b0d7a',
  },
  error: { color: '#ff6b6b', fontSize: 13, textAlign: 'center' },
  btnRow: { flexDirection: 'row', gap: 12 },
  btn: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnCreate: {
    backgroundColor: '#e91e8c',
    shadowColor: '#e91e8c',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  btnJoin: { backgroundColor: 'transparent', borderWidth: 2, borderColor: '#e91e8c' },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  divider: { flex: 1, height: 1, backgroundColor: '#2e1060' },
  dividerText: { color: '#7c6a9a', fontSize: 12 },
  btnOffline: {
    borderRadius: 18,
    backgroundColor: '#1a0035',
    borderWidth: 2,
    borderColor: '#e91e8c',
    overflow: 'hidden',
    shadowColor: '#e91e8c',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  btnBotInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  btnBotIcon: { fontSize: 36 },
  btnBotText: { color: '#e2d0ff', fontSize: 18, fontWeight: '800' },
  btnBotSub: { color: '#7c6a9a', fontSize: 12, marginTop: 2 },
  colorBar: {
    flexDirection: 'row',
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    marginTop: 8,
  },
  colorBarSegment: { flex: 1 },
});
