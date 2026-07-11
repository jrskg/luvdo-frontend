import React, { useState } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { GiftType, GIFT_EMOJIS } from '../../types/game.types';

const GIFTS = Object.keys(GIFT_EMOJIS) as GiftType[];

interface Props {
  targetPlayerId: string;
  onSendGift: (giftType: GiftType) => void;
}

export function GiftButton({ targetPlayerId, onSendGift }: Props) {
  const [visible, setVisible] = useState(false);

  const handleSend = (gift: GiftType) => {
    onSendGift(gift);
    setVisible(false);
  };

  return (
    <>
      <Pressable style={styles.btn} onPress={() => setVisible(true)}>
        <Text style={styles.icon}>🎁</Text>
      </Pressable>

      <Modal visible={visible} transparent animationType="slide">
        <Pressable style={styles.overlay} onPress={() => setVisible(false)}>
          <View style={styles.sheet}>
            <Text style={styles.title}>Send a Gift 💝</Text>
            <View style={styles.grid}>
              {GIFTS.map((gift) => (
                <TouchableOpacity
                  key={gift}
                  style={styles.giftItem}
                  onPress={() => handleSend(gift)}
                >
                  <Text style={styles.giftEmoji}>{GIFT_EMOJIS[gift]}</Text>
                  <Text style={styles.giftLabel}>{gift}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  btn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#1e003d',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e91e8c55',
  },
  icon: { fontSize: 20 },
  overlay: {
    flex: 1,
    backgroundColor: '#000000aa',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#1e003d',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  title: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 20,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 16,
  },
  giftItem: {
    alignItems: 'center',
    width: 64,
  },
  giftEmoji: { fontSize: 32 },
  giftLabel: {
    marginTop: 4,
    color: '#c4b5fd',
    fontSize: 11,
    textTransform: 'capitalize',
  },
});
