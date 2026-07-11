import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { LudoBoard } from '../components/board/LudoBoard';
import { PlayerPanel } from '../components/board/PlayerPanel';
import { DiceAnimation } from '../components/animations/DiceAnimation';
import { ReactionAnimation } from '../components/animations/ReactionAnimation';
import { GiftAnimation } from '../components/animations/GiftAnimation';
import { BoardGlowAnimation } from '../components/animations/BoardGlowAnimation';
import { ReactionBar } from '../components/ui/ReactionBar';
import { GiftButton } from '../components/ui/GiftButton';
import { VoiceControls } from '../components/ui/VoiceControls';
import { SecretMessageModal } from '../components/ui/SecretMessageModal';
import { useGameStore } from '../stores/useGameStore';
import { useUserStore } from '../stores/useUserStore';
import { useSocketStore } from '../stores/useSocketStore';
import { useVoiceStore } from '../stores/useVoiceStore';
import { useSocket } from '../hooks/useSocket';
import { useGameLogic } from '../hooks/useGameLogic';
import { soundService } from '../services/sound.service';
import {
  GiftType,
  Player,
  ReactionType,
  TriggerCondition,
} from '../types/game.types';
import { buildTokenPath, pathToPixels } from '../utils/tokenPath';

export function GameScreen() {
  const { gameState } = useGameStore();
  const { userId } = useUserStore();
  const { registerAnimationCallbacks, clearAnimationCallbacks } = useSocketStore();
  const { isVoiceChatEnabled, isMuted, connectionState, enableVoiceChat, disableVoiceChat, toggleMute } = useVoiceStore();
  const socket = useSocket();
  const { isMyTurn, myPlayer, opponentPlayers, canRollDice, canMoveToken, validMoveTokenIds, currentPlayer, diceValue } = useGameLogic();

  const { width } = useWindowDimensions();
  const cellSize = Math.floor((width - 8) / 15);
  const boardSize = cellSize * 15;

  const [isDiceRolling, setIsDiceRolling] = useState(false);
  const [animationPaths, setAnimationPaths] = useState<Record<string, Array<{ x: number; y: number }>>>({});
  const cellSizeRef = useRef(cellSize);
  useEffect(() => { cellSizeRef.current = cellSize; }, [cellSize]);
  const [activeReaction, setActiveReaction] = useState<{ type: ReactionType; name: string } | null>(null);
  const [activeGift, setActiveGift] = useState<{ type: GiftType; name: string; message?: string } | null>(null);
  const [secretMessage, setSecretMessage] = useState<{ text: string; fromName: string } | null>(null);
  const [showSecretModal, setShowSecretModal] = useState(false);

  const tokens = gameState?.tokens ?? [];
  const opponent = opponentPlayers[0] ?? null;
  const opponentTokensFinished = opponent
    ? tokens.filter((t) => t.playerId === opponent.playerId && t.state === 'finished').length
    : 0;
  const myTokensFinished = myPlayer
    ? tokens.filter((t) => t.playerId === myPlayer.playerId && t.state === 'finished').length
    : 0;
  const totalTokens = gameState?.config?.tokensPerPlayer ?? 4;

  // Preload sounds on mount
  useEffect(() => {
    soundService.preloadAll();
    socket.requestStateSync();

    return () => {
      clearAnimationCallbacks();
    };
  }, []);

  // Register animation callbacks
  useEffect(() => {
    registerAnimationCallbacks({
      onDiceRolled: (value, validMoves, byPlayerId) => {
        const myId = useUserStore.getState().userId;
        const me = useGameStore.getState().gameState?.players.find(p => p.userId === myId);
        if (byPlayerId !== me?.playerId) {
          // Bot/opponent rolled — show rolling animation briefly
          setIsDiceRolling(true);
          setTimeout(() => setIsDiceRolling(false), 700);
        } else {
          setIsDiceRolling(false);
        }
        void soundService.play('dice_roll');
      },
      onTokenMoved: (tokenId, from, to, capturedTokenId) => {
        const state = useGameStore.getState().gameState;
        const token = state?.tokens.find((t) => t.tokenId === tokenId);
        if (token && from !== -1) {
          const CELL = cellSizeRef.current;
          const TOKEN_SIZE = CELL * 0.82;
          const rawPath = buildTokenPath(from, to, token.color);
          if (rawPath.length > 1) {
            const pixels = pathToPixels(rawPath.slice(0, -1), CELL, TOKEN_SIZE);
            if (pixels.length > 0) {
              setAnimationPaths((prev) => ({ ...prev, [tokenId]: pixels }));
              const clearMs = pixels.length * 125 + 300;
              setTimeout(() => {
                setAnimationPaths((prev) => {
                  const next = { ...prev };
                  delete next[tokenId];
                  return next;
                });
              }, clearMs);
            }
          }
        }
        void soundService.play(capturedTokenId ? 'capture' : 'token_move');
      },
      onReactionReceived: (type, fromPlayerId, fromName) => {
        setActiveReaction({ type, name: fromName });
        void soundService.play('reaction');
      },
      onGiftReceived: (type, fromPlayerId, fromName, message) => {
        setActiveGift({ type, name: fromName, message });
        void soundService.play('gift');
      },
      onSecretMessage: (message, fromName, condition) => {
        setSecretMessage({ text: message, fromName });
      },
      onPlayerTurn: () => {
        // Turn state is derived from gameState directly
      },
      onGameFinished: (winnerId, winnerName) => {
        void soundService.play('win');
        setTimeout(() => router.replace('/result'), 2000);
      },
    });
  }, []);


  const handleDicePress = useCallback(() => {
    if (!canRollDice) return;
    setIsDiceRolling(true);
    socket.rollDice();
    void soundService.play('dice_roll');
  }, [canRollDice, socket]);

  const handleTokenPress = useCallback((tokenId: string) => {
    if (!canMoveToken || !validMoveTokenIds.includes(tokenId)) return;
    socket.moveToken(tokenId);
    void soundService.play('tap');
  }, [canMoveToken, validMoveTokenIds, socket]);

  const handleSendGift = useCallback((gift: GiftType) => {
    if (!opponent) return;
    socket.sendGift(gift, opponent.playerId);
  }, [opponent, socket]);

  const handleSendSecret = useCallback((message: string, condition: TriggerCondition) => {
    socket.sendSecretMessage(message, condition);
    setShowSecretModal(false);
  }, [socket]);

  const handleToggleVoice = useCallback(async () => {
    if (isVoiceChatEnabled) {
      await disableVoiceChat();
    } else if (opponent?.socketId) {
      await enableVoiceChat(opponent.socketId);
    }
  }, [isVoiceChatEnabled, opponent, enableVoiceChat, disableVoiceChat]);

  if (!gameState) {
    return (
      <View style={styles.loading}>
        <Text style={styles.loadingText}>Loading game…</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      {/* ── Opponent ─────────────────────────────────────────────────────────── */}
      {opponent && (
        <View style={styles.topSection}>
          <PlayerPanel
            player={opponent}
            isCurrentTurn={currentPlayer?.playerId === opponent.playerId}
            tokensFinished={opponentTokensFinished}
            totalTokens={totalTokens}
            isOpponent
          />
          {gameState.config.enableVoiceChat && (
            <VoiceControls
              connectionState={connectionState}
              isMuted={isMuted}
              onToggleMute={toggleMute}
              onToggleVoice={handleToggleVoice}
            />
          )}
        </View>
      )}

      {/* ── Board ─────────────────────────────────────────────────────────────── */}
      <View style={styles.boardWrapper}>
        <BoardGlowAnimation
          playerColor={currentPlayer?.color ?? null}
          isActive={!!currentPlayer}
          size={boardSize}
        />
        <LudoBoard
          tokens={tokens}
          validMoveTokenIds={validMoveTokenIds}
          onTokenPress={handleTokenPress}
          cellSize={cellSize}
          animationPaths={animationPaths}
        />
      </View>

      {/* ── Bottom Controls ───────────────────────────────────────────────────── */}
      <View style={styles.bottomSection}>
        <View style={styles.bottomRow}>
          {/* My player panel */}
          {myPlayer && (
            <View style={styles.bottomPanelWrap}>
              <PlayerPanel
                player={myPlayer}
                isCurrentTurn={isMyTurn}
                tokensFinished={myTokensFinished}
                totalTokens={totalTokens}
              />
            </View>
          )}

          {/* Dice + extra actions */}
          <View style={styles.diceColumn}>
            <Pressable
              onPress={handleDicePress}
              disabled={!canRollDice}
              style={[styles.diceWrapper, canRollDice && styles.diceWrapperActive]}
            >
              <DiceAnimation
                value={diceValue}
                isRolling={isDiceRolling}
                disabled={!canRollDice}
              />
            </Pressable>

            <View style={styles.extraActions}>
              {gameState.config.enableGifts && opponent && (
                <GiftButton targetPlayerId={opponent.playerId} onSendGift={handleSendGift} />
              )}
              {gameState.config.enableSecretMessages && (
                <Pressable style={styles.secretBtn} onPress={() => setShowSecretModal(true)}>
                  <Text style={styles.secretIcon}>💌</Text>
                </Pressable>
              )}
            </View>
          </View>
        </View>

        {/* Reaction bar — full width below */}
        {gameState.config.enableReactions && (
          <ReactionBar onReact={(t) => socket.sendReaction(t)} />
        )}
      </View>

      {/* ── Overlays ──────────────────────────────────────────────────────────── */}
      {activeReaction && (
        <ReactionAnimation
          reactionType={activeReaction.type}
          fromPlayerName={activeReaction.name}
          onComplete={() => setActiveReaction(null)}
        />
      )}

      {activeGift && (
        <GiftAnimation
          giftType={activeGift.type}
          fromPlayerName={activeGift.name}
          message={activeGift.message}
          onComplete={() => setActiveGift(null)}
        />
      )}

      {secretMessage && (
        <View style={styles.secretReveal}>
          <Text style={styles.secretRevealTitle}>💌 Secret Message from {secretMessage.fromName}</Text>
          <Text style={styles.secretRevealText}>"{secretMessage.text}"</Text>
          <Pressable onPress={() => setSecretMessage(null)} style={styles.secretDismiss}>
            <Text style={styles.secretDismissText}>Close</Text>
          </Pressable>
        </View>
      )}

      <SecretMessageModal
        visible={showSecretModal}
        onSend={handleSendSecret}
        onClose={() => setShowSecretModal(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0d0020' },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0d0020' },
  loadingText: { color: '#c4b5fd', fontSize: 16 },
  topSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 4,
    gap: 8,
  },
  boardWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
  },
  bottomSection: {
    paddingHorizontal: 10,
    paddingTop: 10,
    paddingBottom: 14,
    gap: 8,
    backgroundColor: '#130025',
    borderTopWidth: 1,
    borderTopColor: '#2e1060',
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  bottomPanelWrap: { flex: 1 },
  diceColumn: {
    alignItems: 'center',
    gap: 6,
  },
  diceWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
    padding: 4,
  },
  diceWrapperActive: {
    backgroundColor: 'rgba(233,30,140,0.08)',
  },
  extraActions: { flexDirection: 'row', gap: 6, alignItems: 'center' },
  secretBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#1e003d',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(233,30,140,0.5)',
  },
  secretIcon: { fontSize: 20 },
  secretReveal: {
    position: 'absolute',
    bottom: 100,
    left: 20,
    right: 20,
    backgroundColor: '#1e003d',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#e91e8c',
    zIndex: 300,
  },
  secretRevealTitle: { color: '#ff79c6', fontSize: 14, fontWeight: '700', marginBottom: 8 },
  secretRevealText: { color: '#fff', fontSize: 16, fontStyle: 'italic' },
  secretDismiss: { marginTop: 12, alignItems: 'center' },
  secretDismissText: { color: '#a78bfa', fontSize: 14 },
});
