import React, { useEffect, useRef, useState } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
  ViewStyle,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

interface Props extends Omit<TextInputProps, 'style'> {
  label: string;
  value: string;
  validate?: (v: string) => string | null; // null = valid
  containerStyle?: ViewStyle;
}

export function ValidatedInput({
  label,
  value,
  validate,
  containerStyle,
  onFocus,
  onBlur,
  ...inputProps
}: Props) {
  const [touched, setTouched] = useState(false);

  const hasContent = value.length > 0;
  const errorMsg = touched && hasContent && validate ? validate(value) : null;
  const isValid = touched && hasContent && validate ? validate(value) === null : false;
  const showHint = touched && hasContent;

  const hintOpacity = useSharedValue(0);
  const prevShow = useRef(false);

  useEffect(() => {
    if (showHint !== prevShow.current) {
      hintOpacity.value = withTiming(showHint ? 1 : 0, { duration: 200 });
      prevShow.current = showHint;
    }
  }, [showHint]);

  const hintStyle = useAnimatedStyle(() => ({ opacity: hintOpacity.value }));

  const borderColor = isValid ? '#38a169' : errorMsg ? '#e53e3e' : '#2e1060';

  return (
    <View style={containerStyle}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[styles.input, { borderColor }]}
        value={value}
        onFocus={(e) => { onFocus?.(e); }}
        onBlur={(e) => { setTouched(true); onBlur?.(e); }}
        onChangeText={(t) => {
          if (!touched && t.length > 0) setTouched(true);
          inputProps.onChangeText?.(t);
        }}
        placeholderTextColor="#7c6a9a"
        {...inputProps}
      />
      <Animated.View style={[styles.hintRow, hintStyle]}>
        {isValid ? (
          <Text style={styles.hintValid}>✓ Looks good</Text>
        ) : errorMsg ? (
          <Text style={styles.hintError}>{errorMsg}</Text>
        ) : null}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    color: '#7c6a9a',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#1e003d',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: '#fff',
    fontSize: 16,
    borderWidth: 1,
  },
  hintRow: { minHeight: 20, paddingTop: 5, paddingLeft: 4 },
  hintValid: { color: '#38a169', fontSize: 12, fontWeight: '600' },
  hintError: { color: '#e53e3e', fontSize: 12 },
});
