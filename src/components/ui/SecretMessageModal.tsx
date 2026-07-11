import React, { useState } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { TriggerCondition } from '../../types/game.types';

const CONDITIONS: { value: TriggerCondition; label: string; emoji: string }[] = [
  { value: 'manual', label: 'Now', emoji: '📩' },
  { value: 'on_six', label: 'On next 6', emoji: '🎲' },
  { value: 'on_capture', label: 'On capture', emoji: '⚔️' },
  { value: 'on_win', label: 'On win', emoji: '🏆' },
];

interface Props {
  visible: boolean;
  onSend: (message: string, condition: TriggerCondition) => void;
  onClose: () => void;
}

export function SecretMessageModal({ visible, onSend, onClose }: Props) {
  const [message, setMessage] = useState('');
  const [condition, setCondition] = useState<TriggerCondition>('manual');

  const handleSend = () => {
    if (!message.trim()) return;
    onSend(message.trim(), condition);
    setMessage('');
    setCondition('manual');
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <Pressable style={styles.overlay} onPress={onClose}>
        <View style={styles.card} onStartShouldSetResponder={() => true}>
          <Text style={styles.title}>💌 Secret Message</Text>

          <TextInput
            style={styles.input}
            placeholder="Write something sweet..."
            placeholderTextColor="#7c6a9a"
            value={message}
            onChangeText={setMessage}
            multiline
            maxLength={200}
          />

          <Text style={styles.condLabel}>Reveal when:</Text>
          <View style={styles.condRow}>
            {CONDITIONS.map((c) => (
              <TouchableOpacity
                key={c.value}
                style={[styles.condBtn, condition === c.value && styles.condSelected]}
                onPress={() => setCondition(c.value)}
              >
                <Text style={styles.condEmoji}>{c.emoji}</Text>
                <Text style={[styles.condText, condition === c.value && styles.condTextSelected]}>
                  {c.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            style={[styles.sendBtn, !message.trim() && styles.sendDisabled]}
            onPress={handleSend}
            disabled={!message.trim()}
          >
            <Text style={styles.sendText}>Send 💝</Text>
          </TouchableOpacity>
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: '#000000cc',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: '#1e003d',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: '#e91e8c44',
  },
  title: { color: '#fff', fontSize: 20, fontWeight: '700', textAlign: 'center', marginBottom: 16 },
  input: {
    backgroundColor: '#2b0554',
    borderRadius: 12,
    padding: 14,
    color: '#fff',
    fontSize: 15,
    minHeight: 80,
    borderWidth: 1,
    borderColor: '#2e1060',
    marginBottom: 16,
  },
  condLabel: { color: '#c4b5fd', fontSize: 13, marginBottom: 10 },
  condRow: { flexDirection: 'row', gap: 8, marginBottom: 20, flexWrap: 'wrap' },
  condBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#2e1060',
    backgroundColor: '#2b0554',
    minWidth: 70,
  },
  condSelected: { borderColor: '#e91e8c', backgroundColor: '#e91e8c22' },
  condEmoji: { fontSize: 16 },
  condText: { color: '#7c6a9a', fontSize: 10, marginTop: 2 },
  condTextSelected: { color: '#e91e8c' },
  sendBtn: {
    backgroundColor: '#e91e8c',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  sendDisabled: { opacity: 0.4 },
  sendText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
