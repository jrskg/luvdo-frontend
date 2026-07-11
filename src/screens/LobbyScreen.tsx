import React, { useEffect } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { GameConfigPanel } from '../components/ui/GameConfigPanel';
import { PlayerPanel } from '../components/board/PlayerPanel';
import { useGameStore } from '../stores/useGameStore';
import { useUserStore } from '../stores/useUserStore';
import { useSocket } from '../hooks/useSocket';
import { SOCKET_EVENTS } from '../constants/socket-events';
import { socketService } from '../services/socket.service';

export function LobbyScreen() {
  const { roomInfo, updateConfig, updateRules, clearGame } = useGameStore();
  const { userId } = useUserStore();

  const socket = useSocket();

  const handleLeave = () => {
    socketService.getGameSocket()?.emit(SOCKET_EVENTS.LEAVE_ROOM, {});
    clearGame();
    router.replace('/');
  };

  const players = roomInfo?.players ?? [];
  const isHost = roomInfo?.isHost ?? false;
  const myPlayer = players.find((p) => p.userId === userId);
  const amIReady = myPlayer?.isReady ?? false;
  const allReady = players.length >= 2 && players.every((p) => p.isReady);

  const isGameStarted = useGameStore(state => state.isGameStarted);
  useEffect(() => {
    if (isGameStarted) router.replace('/game');
  }, [isGameStarted]);

  const handleReady = () => {
    socket.playerReady();
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Room Header */}
      <View style={styles.header}>
        <Pressable onPress={handleLeave} style={styles.leaveBtn}>
          <Text style={styles.leaveBtnText}>← Leave</Text>
        </Pressable>
        <Text style={styles.roomName}>{roomInfo?.roomName ?? 'Loading…'}</Text>
        {isHost && <Text style={styles.hostBadge}>HOST</Text>}
      </View>


      <Text style={styles.sectionLabel}>Players ({players.length}/{roomInfo?.config?.maxPlayers ?? 2})</Text>

      {/* Players list */}
      <View style={styles.playerList}>
        {players.map((p, i) => (
          <PlayerPanel
            key={p.playerId}
            player={p}
            isCurrentTurn={false}
            tokensFinished={0}
            totalTokens={roomInfo?.config?.tokensPerPlayer ?? 4}
            entranceDelay={i * 120}
          />
        ))}
        {players.length < (roomInfo?.config?.maxPlayers ?? 2) && (
          <View style={styles.waitingSlot}>
            <Text style={styles.waitingText}>⏳ Waiting for player…</Text>
          </View>
        )}
      </View>

      {/* Config */}
      {roomInfo && (
        <GameConfigPanel
          config={roomInfo.config}
          rules={roomInfo.rules}
          isHost={isHost}
          onChangeConfig={(c) => {
            updateConfig(c);
            socket.updateGameConfig(c);
          }}
          onChangeRules={(r) => {
            updateRules(r);
            socket.setGameRule(r);
          }}
        />
      )}

      {/* Ready / Start */}
      <View style={styles.actions}>
        {!amIReady ? (
          <Pressable style={styles.readyBtn} onPress={handleReady}>
            <Text style={styles.readyBtnText}>✅ I'm Ready</Text>
          </Pressable>
        ) : (
          <View style={styles.readyConfirm}>
            <Text style={styles.readyConfirmText}>
              {allReady ? '🚀 Starting game…' : '✅ Ready — waiting for partner…'}
            </Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#130025',
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 40,
    gap: 18,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  leaveBtn: { paddingVertical: 4, paddingRight: 8 },
  leaveBtnText: { color: '#7c6a9a', fontSize: 14, fontWeight: '600' },
  roomName: { flex: 1, fontSize: 22, fontWeight: '800', color: '#fff' },

  hostBadge: {
    fontSize: 10,
    fontWeight: '700',
    color: '#e91e8c',
    borderWidth: 1,
    borderColor: '#e91e8c',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    letterSpacing: 1,
  },
  sectionLabel: {
    color: '#7c6a9a',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontWeight: '600',
  },
  playerList: { gap: 8 },
  waitingSlot: {
    paddingVertical: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#2e1060',
    borderStyle: 'dashed',
    alignItems: 'center',
  },
  waitingText: { color: '#7c6a9a', fontSize: 14 },
  actions: { marginTop: 8 },
  readyBtn: {
    backgroundColor: '#38a169',
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
  },
  readyBtnText: { color: '#fff', fontSize: 18, fontWeight: '700' },
  readyConfirm: {
    backgroundColor: '#1e003d',
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#38a169',
  },
  readyConfirmText: { color: '#38a169', fontSize: 16, fontWeight: '600' },
});
