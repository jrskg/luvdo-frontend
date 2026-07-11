import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

type ConnectionState = 'idle' | 'connecting' | 'connected' | 'disconnected' | 'failed';

interface Props {
  connectionState: ConnectionState;
  isMuted: boolean;
  onToggleMute: () => void;
  onToggleVoice: () => void;
}

export function VoiceControls({ connectionState, isMuted, onToggleMute, onToggleVoice }: Props) {
  const pulse = useSharedValue(1);

  React.useEffect(() => {
    if (connectionState === 'connected' && !isMuted) {
      pulse.value = withRepeat(withTiming(1.3, { duration: 800 }), -1, true);
    } else {
      pulse.value = withTiming(1);
    }
  }, [connectionState, isMuted, pulse]);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
    opacity: connectionState === 'connected' ? 1 : 0.5,
  }));

  const isActive = connectionState === 'connected';

  return (
    <View style={styles.container}>
      <Pressable onPress={onToggleVoice} style={styles.voiceBtn}>
        <Animated.View
          style={[
            styles.micCircle,
            isActive && styles.micActive,
            pulseStyle,
          ]}
        >
          <Text style={styles.icon}>
            {connectionState === 'connecting' ? '⏳' : isActive ? '🎙️' : '🎙️'}
          </Text>
        </Animated.View>
      </Pressable>

      {isActive && (
        <Pressable onPress={onToggleMute} style={styles.muteBtn}>
          <Text style={styles.muteIcon}>{isMuted ? '🔇' : '🔊'}</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  voiceBtn: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  micCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2b0554',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#2e1060',
  },
  micActive: {
    borderColor: '#e91e8c',
    backgroundColor: '#e91e8c22',
  },
  icon: {
    fontSize: 18,
  },
  muteBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#2b0554',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#2e1060',
  },
  muteIcon: {
    fontSize: 16,
  },
});
