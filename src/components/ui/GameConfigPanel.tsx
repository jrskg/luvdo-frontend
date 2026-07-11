import React from 'react';
import { StyleSheet, Switch, Text, View } from 'react-native';
import { GameConfig, GameRules } from '../../types/game.types';

interface Props {
  config: GameConfig;
  rules: GameRules;
  isHost: boolean;
  onChangeConfig: (c: Partial<GameConfig>) => void;
  onChangeRules: (r: Partial<GameRules>) => void;
}

function Row({ label, value, onToggle, disabled }: { label: string; value: boolean; onToggle: () => void; disabled?: boolean }) {
  return (
    <View style={styles.row}>
      <Text style={[styles.rowLabel, disabled && styles.disabledText]}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onToggle}
        disabled={disabled}
        trackColor={{ false: '#2e1060', true: '#e91e8c' }}
        thumbColor={value ? '#fff' : '#7c6a9a'}
      />
    </View>
  );
}

export function GameConfigPanel({ config, rules, isHost, onChangeConfig, onChangeRules }: Props) {
  if (!isHost) {
    return (
      <View style={styles.container}>
        <Text style={styles.sectionTitle}>Game Settings</Text>
        <Text style={styles.waiting}>Waiting for host to configure…</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Game Settings</Text>

      <Row label="Enable Voice Chat" value={config.enableVoiceChat}
        onToggle={() => onChangeConfig({ enableVoiceChat: !config.enableVoiceChat })} />
      <Row label="Enable Reactions" value={config.enableReactions}
        onToggle={() => onChangeConfig({ enableReactions: !config.enableReactions })} />
      <Row label="Enable Gifts" value={config.enableGifts}
        onToggle={() => onChangeConfig({ enableGifts: !config.enableGifts })} />
      <Row label="Enable Secret Messages" value={config.enableSecretMessages}
        onToggle={() => onChangeConfig({ enableSecretMessages: !config.enableSecretMessages })} />

      <Text style={[styles.sectionTitle, { marginTop: 16 }]}>Rules</Text>
      <Row label="Require 6 to Start" value={rules.requireSixToStart}
        onToggle={() => onChangeRules({ requireSixToStart: !rules.requireSixToStart })} />
      <Row label="Extra Turn on 6" value={rules.extraTurnOnSix}
        onToggle={() => onChangeRules({ extraTurnOnSix: !rules.extraTurnOnSix })} />
      <Row label="Extra Turn on Capture" value={rules.extraTurnOnCapture}
        onToggle={() => onChangeRules({ extraTurnOnCapture: !rules.extraTurnOnCapture })} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1e003d',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#2e1060',
  },
  sectionTitle: {
    color: '#e91e8c',
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#2e1060',
  },
  rowLabel: { color: '#c4b5fd', fontSize: 14 },
  disabledText: { color: '#7c6a9a' },
  waiting: { color: '#7c6a9a', fontSize: 13, fontStyle: 'italic' },
});
