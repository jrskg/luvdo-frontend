import { router } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { BoardGlowAnimation } from "../components/animations/BoardGlowAnimation";
import { DiceAnimation } from "../components/animations/DiceAnimation";
import { STEP_DURATION } from "../components/animations/TokenAnimation";
import { LudoBoard } from "../components/board/LudoBoard";
import {
  PLAYER_COLOR_HEX,
  POSITION_TO_GRID,
} from "../constants/board.constants";
import { LocalGameEvent } from "../services/localGame.service";
import { soundService } from "../services/sound.service";
import { useLocalGameStore } from "../stores/useLocalGameStore";
import { useUserStore } from "../stores/useUserStore";
import { Player, PlayerColor } from "../types/game.types";
import { buildTokenPath, pathToPixels } from "../utils/tokenPath";

// ─── Corner mapping ───────────────────────────────────────────────────────────
// When board rotates for myColor, each color's jail appears at a specific
// physical corner of the board view. ROTATED_CORNER[myColor][theirColor]
// gives the physical corner where their jail appears on screen.
const ROTATED_CORNER: Record<
  PlayerColor,
  Record<PlayerColor, "TL" | "TR" | "BL" | "BR">
> = {
  red: { red: "BL", green: "TL", yellow: "TR", blue: "BR" },
  blue: { blue: "BL", red: "TL", green: "TR", yellow: "BR" },
  yellow: { yellow: "BL", blue: "TL", red: "TR", green: "BR" },
  green: { green: "BL", yellow: "TL", blue: "TR", red: "BR" },
};

// Pass-and-play: board is not rotated, fixed color→corner mapping.
const BASE_CORNER: Record<PlayerColor, "TL" | "TR" | "BL" | "BR"> = {
  red: "TL",
  green: "TR",
  yellow: "BR",
  blue: "BL",
};

// ─── Dice panel ───────────────────────────────────────────────────────────────
// One square per player: bordered dice box + player name below.

interface DicePanelProps {
  player: Player;
  isCurrentTurn: boolean;
  canRoll: boolean;
  diceValue: number | null;
  isDiceRolling: boolean;
  onPress: () => void;
  showName?: boolean;
}

function DicePanel({
  player,
  isCurrentTurn,
  canRoll,
  diceValue,
  isDiceRolling,
  onPress,
  showName = true,
}: DicePanelProps) {
  const c = PLAYER_COLOR_HEX[player.color];
  return (
    <View style={dpStyles.wrap}>
      <Pressable
        onPress={onPress}
        disabled={!canRoll}
        style={[
          dpStyles.box,
          { borderColor: isCurrentTurn ? c : "#2e1060" },
          isCurrentTurn && { backgroundColor: c + "15" },
          !isCurrentTurn && dpStyles.boxOff,
        ]}
        hitSlop={8}
      >
        <DiceAnimation
          value={diceValue}
          isRolling={isDiceRolling}
          disabled={!canRoll}
          accentColor={PLAYER_COLOR_HEX[player.color]}
        />
      </Pressable>
      {showName && (
        <Text
          style={[dpStyles.name, isCurrentTurn && { color: c }]}
          numberOfLines={1}
        >
          {player.avatar} {player.name}
        </Text>
      )}
    </View>
  );
}

const dpStyles = StyleSheet.create({
  wrap: { alignItems: "center", gap: 4 },
  box: {
    borderWidth: 2,
    borderRadius: 12,
    backgroundColor: "#1a0035",
    padding: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  boxOff: { opacity: 0.45 },
  name: {
    color: "#7c6a9a",
    fontSize: 11,
    fontWeight: "700",
    textAlign: "center",
    maxWidth: 90,
  },
});

// ─── Game menu modal ──────────────────────────────────────────────────────────

interface GameMenuProps {
  isSoundMuted: boolean;
  isMusicMuted: boolean;
  onToggleSound: () => void;
  onToggleMusic: () => void;
  onQuit: () => void;
  onTestPositions?: () => void;
}

function GameMenu({
  isSoundMuted,
  isMusicMuted,
  onToggleSound,
  onToggleMusic,
  onQuit,
  onTestPositions,
}: GameMenuProps) {
  const [open, setOpen] = useState(false);

  const handleQuit = () => {
    setOpen(false);
    setTimeout(onQuit, 150);
  };

  return (
    <>
      <Pressable
        style={menuStyles.pill}
        onPress={() => setOpen(true)}
        hitSlop={12}
      >
        <Text style={menuStyles.pillIcon}>≡</Text>
      </Pressable>

      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}
      >
        <Pressable style={menuStyles.backdrop} onPress={() => setOpen(false)}>
          {/* onStartShouldSetResponder prevents taps inside the dialog from closing it */}
          <View
            style={menuStyles.dialog}
            onStartShouldSetResponder={() => true}
          >
            <Text style={menuStyles.title}>Game Menu</Text>

            <Pressable style={menuStyles.item} onPress={onToggleSound}>
              <Text style={menuStyles.itemIcon}>
                {isSoundMuted ? "🔇" : "🔊"}
              </Text>
              <Text style={menuStyles.itemText}>
                {isSoundMuted ? "Unmute Sounds" : "Mute Sounds"}
              </Text>
            </Pressable>

            <Pressable style={menuStyles.item} onPress={onToggleMusic}>
              <Text style={menuStyles.itemIcon}>
                {isMusicMuted ? "🎵" : "🎶"}
              </Text>
              <Text style={menuStyles.itemText}>
                {isMusicMuted ? "Unmute Music" : "Mute Music"}
              </Text>
            </Pressable>

            {__DEV__ && onTestPositions ? (
              <>
                <View style={menuStyles.divider} />
                <Pressable
                  style={[menuStyles.item, menuStyles.devRow]}
                  onPress={() => {
                    setOpen(false);
                    setTimeout(onTestPositions, 150);
                  }}
                >
                  <Text style={menuStyles.itemIcon}>🧪</Text>
                  <Text style={[menuStyles.itemText, menuStyles.devText]}>
                    Test: Near Home
                  </Text>
                </Pressable>
              </>
            ) : null}

            <View style={menuStyles.divider} />

            <Pressable
              style={[menuStyles.item, menuStyles.quitRow]}
              onPress={handleQuit}
            >
              <Text style={menuStyles.itemIcon}>🚪</Text>
              <Text style={[menuStyles.itemText, menuStyles.quitText]}>
                Close Game
              </Text>
            </Pressable>

            <Pressable
              style={menuStyles.cancelBtn}
              onPress={() => setOpen(false)}
            >
              <Text style={menuStyles.cancelText}>Cancel</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

const menuStyles = StyleSheet.create({
  pill: {
    alignItems: "center",
    justifyContent: "center",
    width: 40,
    height: 40,
    backgroundColor: "rgba(18,0,48,0.92)",
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#4a1080",
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 5,
  },
  pillIcon: {
    color: "#c4b5fd",
    fontSize: 22,
    fontWeight: "700",
    lineHeight: 24,
  },
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.65)",
    alignItems: "center",
    justifyContent: "center",
  },
  dialog: {
    width: 280,
    backgroundColor: "#130025",
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: "#e91e8c",
    padding: 20,
    gap: 6,
  },
  title: {
    color: "#e91e8c",
    fontSize: 18,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 8,
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: "#1e003d",
  },
  itemIcon: { fontSize: 20 },
  itemText: { color: "#c4b5fd", fontSize: 14, fontWeight: "600", flex: 1 },
  divider: { height: 1, backgroundColor: "#2e1060", marginVertical: 2 },
  quitRow: {
    backgroundColor: "rgba(233,30,140,0.08)",
    borderWidth: 1,
    borderColor: "rgba(233,30,140,0.35)",
  },
  quitText: { color: "#e91e8c" },
  cancelBtn: {
    marginTop: 4,
    paddingVertical: 12,
    alignItems: "center",
    borderRadius: 12,
    backgroundColor: "#1a0035",
  },
  cancelText: { color: "#7c6a9a", fontSize: 14, fontWeight: "600" },
  devRow: {
    backgroundColor: "rgba(74,222,128,0.08)",
    borderWidth: 1,
    borderColor: "rgba(74,222,128,0.35)",
  },
  devText: { color: "#4ade80" },
});

// ─── Main screen ──────────────────────────────────────────────────────────────

export function LocalGameScreen() {
  const { service, gameState, applyEvent, clearLocalGame } =
    useLocalGameStore();
  const { userId } = useUserStore();
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  // Board fills screen width; +8 accounts for the 4px border on each side.
  const cellSize = Math.floor((width - 8) / 15);
  const boardWithBorder = cellSize * 15 + 8;
  const boardSize = cellSize * 15; // inner pixel size (no border)
  // Each jail corner is 6 cells wide — slot width matches this exactly.
  const slotWidth = cellSize * 6;

  // Height available between safe areas, split into top/bottom strips for dice panels.
  const availableH = height - insets.top - insets.bottom;
  // Clamp panel height: at least 88px (fits dice+name) and at most 110px.
  const PANEL_H = Math.max(
    88,
    Math.min(110, Math.floor((availableH - boardWithBorder) / 2)),
  );

  const cellSizeRef = useRef(cellSize);
  useEffect(() => {
    cellSizeRef.current = cellSize;
  }, [cellSize]);

  const [isDiceRolling, setIsDiceRolling] = useState(false);
  const [diceValue, setDiceValue] = useState<number | null>(null);
  // Tracks WHICH player's dice is currently rolling/showing a value.
  // Decoupled from gameState.currentTurn so the right panel animates even when
  // applyLocalDiceRoll advances the turn immediately (no-valid-moves case).
  const [rollingPlayerId, setRollingPlayerId] = useState<string | null>(null);
  // True while a token is visually animating along its path. Blocks the next
  // player from rolling until the movement finishes.
  const [isTokenMoving, setIsTokenMoving] = useState(false);
  const [animationPaths, setAnimationPaths] = useState<
    Record<string, Array<{ x: number; y: number }>>
  >({});
  const rollingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [isSoundMuted, setIsSoundMuted] = useState(false);
  const [isMusicMuted, setIsMusicMuted] = useState(false);
  // ranked player IDs in finish order (1st, 2nd, …) — populated by PLAYER_RANKED events
  const [rankedPlayerIds, setRankedPlayerIds] = useState<string[]>([]);
  const [showSummary, setShowSummary] = useState(false);
  // Holds captured tokens at their pre-capture position while attacker walks to them
  const [overridePositions, setOverridePositions] = useState<
    Record<string, { x: number; y: number; size: number }>
  >({});

  // Derived game state
  const isPassPlay = gameState?.players.every((p) => !p.isBot) ?? false;
  // userId may be null when not authenticated; local game setup falls back to 'local_me'.
  const myPlayer =
    gameState?.players.find((p) => !p.isBot && p.userId === userId) ??
    gameState?.players.find((p) => !p.isBot && p.userId === "local_me");
  const currentPlayer = gameState?.players.find(
    (p) => p.playerId === gameState.currentTurn,
  );
  const isMyTurn = !!myPlayer && gameState?.currentTurn === myPlayer.playerId;

  const canInteract = (isPassPlay || isMyTurn) && !currentPlayer?.isBot;
  // Block rolling while:
  //   • a dice animation is in flight (rollingPlayerId set)
  //   • a token move animation is still playing (isTokenMoving)
  const canRollDice =
    canInteract &&
    gameState?.diceValue === null &&
    gameState?.phase === "playing" &&
    rollingPlayerId === null &&
    !isTokenMoving;
  const canMoveToken = canInteract && (gameState?.validMoves.length ?? 0) > 0;
  // Block token interaction while the dice animation is still running so the player
  // cannot move before seeing the final value, which prevents phantom "extra turns".
  // Also highlight bot's valid tokens during its thinking window so the human
  // can follow the bot's options before the move is made.
  const botThinking =
    !isDiceRolling &&
    currentPlayer?.isBot &&
    (gameState?.validMoves?.length ?? 0) > 0;
  const validMoveTokenIds =
    (!isDiceRolling && canMoveToken) || botThinking
      ? (gameState?.validMoves ?? [])
      : [];

  const tokens = gameState?.tokens ?? [];

  useEffect(() => {
    if (!service) return;

    const unsubscribe = service.on((event: LocalGameEvent) => {
      const currentState = service.getState();
      applyEvent(currentState);

      switch (event.type) {
        case "DICE_ROLLED": {
          if (rollingTimerRef.current) clearTimeout(rollingTimerRef.current);
          const rolledValue = event.diceValue;
          const rolledByPlayer = event.playerId;
          setDiceValue(null);
          setIsDiceRolling(true);
          // Track WHO rolled so the correct panel animates, regardless of
          // whether applyLocalDiceRoll already advanced currentTurn (no valid moves).
          setRollingPlayerId(rolledByPlayer);
          void soundService.play("dice_roll");
          rollingTimerRef.current = setTimeout(() => {
            setIsDiceRolling(false);
            setDiceValue(rolledValue);
            // Keep rollingPlayerId set so the dice value stays visible on the
            // correct panel until PLAYER_TURN clears it.
            rollingTimerRef.current = null;
          }, 600);
          break;
        }
        case "TOKEN_MOVED": {
          // Block interaction until the visual animation finishes.
          // moveDuration is refined below once we know the actual path length.
          setIsTokenMoving(true);
          let moveDuration = 500; // minimum for base→start or single-step moves

          const movToken = currentState.tokens.find(
            (t) => t.tokenId === event.tokenId,
          );
          if (movToken && event.fromPosition !== -1) {
            const CELL = cellSizeRef.current;
            const TOKEN_SIZE = CELL * 0.82;
            const rawPath = buildTokenPath(
              event.fromPosition,
              event.toPosition,
              movToken.color,
            );
            if (rawPath.length > 1) {
              const pixels = pathToPixels(
                rawPath.slice(0, -1),
                CELL,
                TOKEN_SIZE,
              );
              if (pixels.length > 0) {
                // Each step takes STEP_DURATION; +100 ms buffer for animation tail
                const walkMs = pixels.length * STEP_DURATION + 100;
                moveDuration = walkMs + 350; // clear isTokenMoving AFTER animation finishes

                setAnimationPaths((prev) => ({
                  ...prev,
                  [event.tokenId]: pixels,
                }));
                setTimeout(() => {
                  setAnimationPaths((prev) => {
                    const next = { ...prev };
                    delete next[event.tokenId];
                    return next;
                  });
                }, walkMs + 200);

                // Hold the captured token at its grid cell while the attacker walks to it
                if (event.capturedTokenId) {
                  const captureCoord = POSITION_TO_GRID[event.toPosition];
                  if (captureCoord) {
                    const holdPos = {
                      x: captureCoord.col * CELL + (CELL - TOKEN_SIZE) / 2,
                      y: captureCoord.row * CELL + (CELL - TOKEN_SIZE) / 2,
                      size: TOKEN_SIZE,
                    };
                    setOverridePositions((prev) => ({
                      ...prev,
                      [event.capturedTokenId!]: holdPos,
                    }));
                    setTimeout(() => {
                      setOverridePositions((prev) => {
                        const next = { ...prev };
                        delete next[event.capturedTokenId!];
                        return next;
                      });
                    }, walkMs + 150);
                  }
                }
              }
            }
          }

          setTimeout(() => setIsTokenMoving(false), moveDuration);
          void soundService.play(
            event.capturedTokenId ? "capture" : "token_move",
          );
          break;
        }
        case "PLAYER_TURN": {
          if (rollingTimerRef.current) clearTimeout(rollingTimerRef.current);
          setDiceValue(null);
          setIsDiceRolling(false);
          setRollingPlayerId(null);
          break;
        }
        case "PLAYER_RANKED": {
          setRankedPlayerIds((prev) => [...prev, event.playerId]);
          break;
        }
        case "GAME_FINISHED": {
          void soundService.play("win");
          setTimeout(() => setShowSummary(true), 1400);
          break;
        }
      }
    });

    service.start();
    return () => {
      unsubscribe();
      if (rollingTimerRef.current) clearTimeout(rollingTimerRef.current);
    };
  }, [service]);

  const handleDicePress = useCallback(() => {
    if (!canRollDice || !service) return;
    service.rollDice();
  }, [canRollDice, service]);

  const handleTokenPress = useCallback(
    (tokenId: string) => {
      if (!canMoveToken || !validMoveTokenIds.includes(tokenId) || !service)
        return;
      service.moveToken(tokenId);
      void soundService.play("tap");
    },
    [canMoveToken, validMoveTokenIds, service],
  );

  const handleQuit = useCallback(() => {
    clearLocalGame();
    router.replace("/");
  }, [clearLocalGame]);

  const handleTestPositions = useCallback(() => {
    if (!service || !myPlayer) return;
    service.teleportToTestPositions(myPlayer.playerId);
    applyEvent(service.getState());
    setDiceValue(null);
    setIsDiceRolling(false);
    setRollingPlayerId(null);
    setIsTokenMoving(false);
    setAnimationPaths({});
  }, [service, myPlayer, applyEvent]);

  const handleToggleSound = useCallback(() => {
    setIsSoundMuted((prev) => {
      soundService.setSoundMuted(!prev);
      return !prev;
    });
  }, []);

  const handleToggleMusic = useCallback(() => {
    setIsMusicMuted((prev) => {
      soundService.setMusicMuted(!prev);
      return !prev;
    });
  }, []);

  if (!gameState) {
    return (
      <View style={styles.loading}>
        <Text style={styles.loadingText}>Loading game…</Text>
      </View>
    );
  }

  // ── Rank helpers ───────────────────────────────────────────────────────────

  const getRankMeta = (rank: number, totalPlayers: number) => {
    const isLast = rank === totalPlayers;
    const TABLE = [
      { emoji: "🏆", label: "1ST", color: "#FFD700" },
      { emoji: "🥈", label: "2ND", color: "#C0C0C0" },
      { emoji: "🥉", label: "3RD", color: "#CD7F32" },
      { emoji: "", label: "4TH", color: "#888888" },
    ];
    const row = TABLE[Math.min(rank - 1, 3)];
    const stars = isLast ? 0 : Math.max(0, 4 - rank);
    return { ...row, stars };
  };

  // pixel offset of a visual corner's base area within the board container
  const cornerPos = (corner: "TL" | "TR" | "BL" | "BR") => {
    const BORDER = 4;
    const OFFSET = 9 * cellSize;
    if (corner === "TL") return { top: BORDER, left: BORDER };
    if (corner === "TR") return { top: BORDER, left: BORDER + OFFSET };
    if (corner === "BL") return { top: BORDER + OFFSET, left: BORDER };
    return { top: BORDER + OFFSET, left: BORDER + OFFSET };
  };

  // ── Corner assignment ──────────────────────────────────────────────────────
  // In bot mode the board rotates; ROTATED_CORNER maps colors to the physical
  // screen corner where that jail appears after the rotation transform.
  // In pass-and-play the board doesn't rotate so BASE_CORNER applies directly.

  const getCorner = (color: PlayerColor): "TL" | "TR" | "BL" | "BR" => {
    if (isPassPlay) return BASE_CORNER[color];
    const mc = myPlayer?.color;
    return mc ? ROTATED_CORNER[mc][color] : BASE_CORNER[color];
  };

  // Stable visual "whose turn" indicator that doesn't jump mid-animation.
  // Priority: rolling player (dice anim) > nobody (token moving) > real next player.
  const visualCurrentTurn: string | null =
    rollingPlayerId ?? (isTokenMoving ? null : gameState.currentTurn);

  const buildPanel = (corner: "TL" | "TR" | "BL" | "BR"): React.ReactNode => {
    const player = gameState.players.find((p) => getCorner(p.color) === corner);
    if (!player) return null;
    // Visual "active" state follows visualCurrentTurn, not raw game currentTurn,
    // so the highlight doesn't snap to the next player while dice is still showing.
    const isCurrent = visualCurrentTurn === player.playerId;
    const isRollingPanel = rollingPlayerId === player.playerId;
    return (
      <DicePanel
        player={player}
        isCurrentTurn={isCurrent}
        canRoll={canRollDice && gameState.currentTurn === player.playerId}
        diceValue={isRollingPanel ? diceValue : null}
        isDiceRolling={isRollingPanel && isDiceRolling}
        onPress={handleDicePress}
        showName={!isPassPlay}
      />
    );
  };

  // Board rotation: puts myPlayer's jail at the visual bottom-left.
  const boardMyColor = !isPassPlay ? myPlayer?.color : undefined;

  // Total container height = top panel strip + board + bottom panel strip
  const containerH = PANEL_H + boardWithBorder + PANEL_H;

  // Corner slot style — panels sit at the absolute left/right edge with an 8px margin.
  // No fixed width: the panel sizes to its content (the dice box ± name).
  const cornerStyle = (top: boolean, atLeft: boolean) => ({
    position: "absolute" as const,
    top: top ? 0 : undefined,
    bottom: top ? undefined : 0,
    left: atLeft ? 8 : undefined,
    right: atLeft ? undefined : 8,
    height: PANEL_H,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  });

  return (
    <SafeAreaView style={styles.safe}>
      {/* Menu button — positioned below status bar using safe area insets */}
      <View style={[styles.menuAnchor, { top: insets.top + 8 }]}>
        <GameMenu
          isSoundMuted={isSoundMuted}
          isMusicMuted={isMusicMuted}
          onToggleSound={handleToggleSound}
          onToggleMusic={handleToggleMusic}
          onQuit={handleQuit}
          onTestPositions={handleTestPositions}
        />
      </View>

      {/*
        Single container whose height = PANEL_H + board + PANEL_H.
        The board is absolutely positioned in the middle vertical strip.
        The four corner DicePanels are absolutely positioned at each corner.
        The settings cog fills the remaining top-center space between TL and TR.
      */}
      <View style={{ width: boardWithBorder, height: containerH }}>
        {/* ── Corner dice panels ───────────────────────── */}
        <View style={cornerStyle(true, true)}>{buildPanel("TL")}</View>
        <View style={cornerStyle(true, false)}>{buildPanel("TR")}</View>
        <View style={cornerStyle(false, true)}>{buildPanel("BL")}</View>
        <View style={cornerStyle(false, false)}>{buildPanel("BR")}</View>

        {/* ── Board — sits between the two panel strips ─── */}
        <View
          style={{
            position: "absolute",
            top: PANEL_H,
            left: 0,
            width: boardWithBorder,
            height: boardWithBorder,
          }}
        >
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
            myColor={boardMyColor}
            overridePositions={overridePositions}
          />

          {/* Winner overlays — one per finished player, shown in their base area */}
          {rankedPlayerIds.map((pid, idx) => {
            const rp = gameState.players.find((p) => p.playerId === pid);
            if (!rp) return null;
            const corner = getCorner(rp.color);
            const pos = cornerPos(corner);
            const rank = idx + 1;
            const meta = getRankMeta(rank, gameState.players.length);
            const baseSize = 6 * cellSize;
            return (
              <View
                key={pid}
                pointerEvents="none"
                style={{
                  position: "absolute",
                  top: pos.top,
                  left: pos.left,
                  width: baseSize,
                  height: baseSize,
                  backgroundColor: PLAYER_COLOR_HEX[rp.color] + "E6",
                  borderRadius: 10,
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 2,
                }}
              >
                {meta.emoji ? (
                  <Text
                    style={{
                      fontSize: cellSize * 1.7,
                      lineHeight: cellSize * 2,
                    }}
                  >
                    {meta.emoji}
                  </Text>
                ) : null}
                <Text
                  style={{
                    color: "#fff",
                    fontSize: cellSize * 0.85,
                    fontWeight: "900",
                    textShadowColor: "#0006",
                    textShadowOffset: { width: 1, height: 1 },
                    textShadowRadius: 3,
                  }}
                >
                  {meta.label}
                </Text>
                {meta.stars > 0 && (
                  <Text
                    style={{
                      fontSize: cellSize * 0.65,
                      lineHeight: cellSize * 0.85,
                    }}
                  >
                    {"⭐".repeat(meta.stars)}
                  </Text>
                )}
              </View>
            );
          })}
        </View>
      </View>

      {/* Rankings summary modal — appears after the game fully ends */}
      <Modal visible={showSummary} transparent animationType="fade">
        <View style={summaryStyles.backdrop}>
          <View style={summaryStyles.card}>
            <Text style={summaryStyles.title}>Game Over! 🎮</Text>

            {rankedPlayerIds.map((pid, idx) => {
              const rp = gameState.players.find((p) => p.playerId === pid);
              if (!rp) return null;
              const rank = idx + 1;
              const meta = getRankMeta(rank, gameState.players.length);
              const isMe = rp.playerId === myPlayer?.playerId;
              return (
                <View
                  key={pid}
                  style={[
                    summaryStyles.row,
                    isMe && summaryStyles.rowHighlight,
                  ]}
                >
                  <Text style={summaryStyles.rankEmoji}>
                    {meta.emoji || "🎮"}
                  </Text>
                  <View style={{ flex: 1 }}>
                    <Text style={summaryStyles.playerName} numberOfLines={1}>
                      {rp.avatar} {rp.name}
                      {isMe ? "  (you)" : ""}
                    </Text>
                    <Text style={summaryStyles.stars}>
                      {meta.stars > 0 ? "⭐".repeat(meta.stars) : "—"}
                    </Text>
                  </View>
                  <Text
                    style={[summaryStyles.rankLabel, { color: meta.color }]}
                  >
                    {meta.label}
                  </Text>
                </View>
              );
            })}

            <Pressable
              style={summaryStyles.homeBtn}
              onPress={() => {
                clearLocalGame();
                router.replace("/");
              }}
            >
              <Text style={summaryStyles.homeBtnText}>Back to Home</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#0d0020",
    alignItems: "center",
    justifyContent: "center",
  },
  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0d0020",
  },
  loadingText: { color: "#c4b5fd", fontSize: 16 },
  menuAnchor: {
    position: "absolute",
    left: 12,
    zIndex: 50,
  },
});

const summaryStyles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.88)",
    alignItems: "center",
    justifyContent: "center",
  },
  card: {
    width: 300,
    backgroundColor: "#130025",
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: "#e91e8c",
    padding: 20,
    gap: 8,
  },
  title: {
    color: "#e91e8c",
    fontSize: 22,
    fontWeight: "900",
    textAlign: "center",
    marginBottom: 6,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1e003d",
    borderRadius: 12,
    padding: 12,
    gap: 10,
  },
  rowHighlight: {
    borderWidth: 1.5,
    borderColor: "#e91e8c",
  },
  rankEmoji: { fontSize: 28 },
  playerName: { color: "#c4b5fd", fontSize: 13, fontWeight: "700" },
  stars: { color: "#FFD700", fontSize: 12, marginTop: 2 },
  rankLabel: { fontSize: 16, fontWeight: "900" },
  homeBtn: {
    backgroundColor: "#e91e8c",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 4,
  },
  homeBtnText: { color: "#fff", fontSize: 15, fontWeight: "800" },
});
