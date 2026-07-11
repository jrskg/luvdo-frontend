import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { MoodType, MOOD_COLORS, MOOD_EMOJIS } from '../../types/game.types';

const MOODS: MoodType[] = ['Happy', 'Angry', 'Missing'];

interface Props {
  currentMood: MoodType;
  onChange: (mood: MoodType) => void;
}

function MoodButton({ mood, selected, onPress }: { mood: MoodType; selected: boolean; onPress: () => void }) {
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = () => {
    scale.value = withSpring(1.2, { damping: 6 }, () => {
      scale.value = withSpring(1);
    });
    onPress();
  };

  return (
    <Pressable onPress={handlePress}>
      <Animated.View
        style={[
          styles.moodButton,
          selected && { borderColor: MOOD_COLORS[mood], borderWidth: 2, backgroundColor: MOOD_COLORS[mood] + '22' },
          animStyle,
        ]}
      >
        <Text style={styles.emoji}>{MOOD_EMOJIS[mood]}</Text>
        <Text style={[styles.label, selected && { color: MOOD_COLORS[mood] }]}>{mood}</Text>
      </Animated.View>
    </Pressable>
  );
}

export function MoodSelector({ currentMood, onChange }: Props) {
  return (
    <View style={styles.container}>
      {MOODS.map((mood) => (
        <MoodButton
          key={mood}
          mood={mood}
          selected={currentMood === mood}
          onPress={() => onChange(mood)}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
  moodButton: {
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#2e1060',
    backgroundColor: '#2b0554',
  },
  emoji: {
    fontSize: 22,
  },
  label: {
    marginTop: 4,
    fontSize: 11,
    color: '#7c6a9a',
    fontWeight: '600',
  },
});
