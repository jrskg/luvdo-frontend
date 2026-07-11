import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { ReactionType, REACTION_EMOJIS } from '../../types/game.types';

const REACTIONS = Object.keys(REACTION_EMOJIS) as ReactionType[];

interface Props {
  onReact: (type: ReactionType) => void;
}

function ReactionButton({ type, onPress }: { type: ReactionType; onPress: () => void }) {
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = () => {
    scale.value = withSpring(1.4, { damping: 5 }, () => {
      scale.value = withSpring(1);
    });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  return (
    <Pressable onPress={handlePress}>
      <Animated.View style={[styles.btn, animStyle]}>
        <Text style={styles.emoji}>{REACTION_EMOJIS[type]}</Text>
      </Animated.View>
    </Pressable>
  );
}

export function ReactionBar({ onReact }: Props) {
  return (
    <View style={styles.container}>
      {REACTIONS.map((type) => (
        <ReactionButton key={type} type={type} onPress={() => onReact(type)} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 4,
  },
  btn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#2b0554',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#2e1060',
  },
  emoji: {
    fontSize: 20,
  },
});
