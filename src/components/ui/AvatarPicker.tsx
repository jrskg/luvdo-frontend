import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

const AVATARS = [
  '👩', '👨', '🧑', '👸', '🤴', '🦸‍♀️', '🦸‍♂️', '🧝‍♀️', '🧝‍♂️',
  '🐱', '🐶', '🦊', '🐻', '🐼', '🐨', '🦁', '🐸', '🐙', '🦋', '🌸',
];

interface Props {
  selectedAvatar: string;
  onSelect: (avatar: string) => void;
}

export function AvatarPicker({ selectedAvatar, onSelect }: Props) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      {AVATARS.map((avatar) => (
        <Pressable
          key={avatar}
          onPress={() => onSelect(avatar)}
          style={[styles.item, selectedAvatar === avatar && styles.selected]}
        >
          <Text style={styles.emoji}>{avatar}</Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    paddingHorizontal: 8,
    gap: 8,
    alignItems: 'center',
  },
  item: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#2b0554',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selected: {
    borderColor: '#e91e8c',
    backgroundColor: '#e91e8c22',
  },
  emoji: {
    fontSize: 26,
  },
});
