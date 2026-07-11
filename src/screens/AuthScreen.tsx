import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { AvatarPicker } from '../components/ui/AvatarPicker';
import { MoodSelector } from '../components/ui/MoodSelector';
import { ValidatedInput } from '../components/ui/ValidatedInput';
import { useUserStore } from '../stores/useUserStore';
import { useSocketStore } from '../stores/useSocketStore';
import { useToastStore } from '../stores/useToastStore';
import { MoodType } from '../types/game.types';

type Tab = 'login' | 'register';

// ─── Field validators ────────────────────────────────────────────────────────

const validateDisplayName = (v: string): string | null => {
  if (!v.trim()) return 'Display name is required';
  if (v.trim().length < 2) return 'At least 2 characters';
  return null;
};

const validateUsername = (v: string): string | null => {
  if (!v.trim()) return 'Username is required';
  if (v.length < 3) return 'At least 3 characters';
  if (!/^[a-z0-9_]+$/i.test(v)) return 'Letters, numbers, and _ only';
  return null;
};

const validatePin = (v: string): string | null => {
  if (!v) return 'PIN is required';
  if (!/^\d+$/.test(v)) return 'Digits only (0–9)';
  if (v.length < 4) return `${v.length}/4 digits minimum`;
  return null;
};

const validatePinLogin = (v: string): string | null => {
  if (!v) return 'Enter your PIN';
  return null;
};

// ─── Screen ──────────────────────────────────────────────────────────────────

export function AuthScreen() {
  const { login, register } = useUserStore();
  const { connect } = useSocketStore();
  const toast = useToastStore();
  const [tab, setTab] = useState<Tab>('login');
  const [loading, setLoading] = useState(false);

  // Shared fields
  const [username, setUsername] = useState('');
  const [pin, setPin] = useState('');

  // Register-only fields
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState('👩');
  const [mood, setMood] = useState<MoodType>('Happy');

  const switchTab = (next: Tab) => {
    if (next === tab) return;
    setTab(next);
  };

  const handleLogin = async () => {
    if (!username.trim()) { toast.show('Enter your username', 'error'); return; }
    if (!pin.trim()) { toast.show('Enter your PIN', 'error'); return; }
    setLoading(true);
    try {
      await login({ username: username.trim().toLowerCase(), pin: pin.trim() });
      const { name } = useUserStore.getState();
      connect(useUserStore.getState().token!);
      toast.show(`Welcome back${name ? ', ' + name : ''}! 👋`, 'success', 2000);
      router.replace('/');
    } catch (e: any) {
      toast.show(e.message ?? 'Login failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (validateDisplayName(name)) { toast.show(validateDisplayName(name)!, 'error'); return; }
    if (validateUsername(username)) { toast.show(validateUsername(username)!, 'error'); return; }
    if (validatePin(pin)) { toast.show(validatePin(pin)!, 'error'); return; }
    setLoading(true);
    try {
      await register({
        name: name.trim(),
        username: username.trim().toLowerCase(),
        pin: pin.trim(),
        avatar,
        mood,
      });
      connect(useUserStore.getState().token!);
      toast.show('Account created! Let\'s play 🎮', 'success', 2000);
      router.replace('/');
    } catch (e: any) {
      toast.show(e.message ?? 'Registration failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">

        {/* Logo */}
        <View style={styles.heroSection}>
          <View style={styles.colorStrip}>
            <View style={[styles.colorPill, { backgroundColor: '#e53935' }]} />
            <View style={[styles.colorPill, { backgroundColor: '#43a047' }]} />
            <View style={[styles.colorPill, { backgroundColor: '#fdd835' }]} />
            <View style={[styles.colorPill, { backgroundColor: '#1e88e5' }]} />
          </View>
          <View style={styles.logoRow}>
            <Text style={styles.title}>Luvdo</Text>
            <Text style={styles.heart}>❤️</Text>
          </View>
          <Text style={styles.subtitle}>Play Ludo with your person 🎮</Text>
        </View>

        {/* Tabs */}
        <View style={styles.tabs}>
          <Pressable
            style={[styles.tab, tab === 'login' && styles.tabActive]}
            onPress={() => switchTab('login')}
          >
            <Text style={[styles.tabText, tab === 'login' && styles.tabTextActive]}>Login</Text>
          </Pressable>
          <Pressable
            style={[styles.tab, tab === 'register' && styles.tabActive]}
            onPress={() => switchTab('register')}
          >
            <Text style={[styles.tabText, tab === 'register' && styles.tabTextActive]}>
              Create Account
            </Text>
          </Pressable>
        </View>

        {/* Register-only fields */}
        {tab === 'register' && (
          <>
            <Text style={styles.sectionLabel}>Avatar</Text>
            <AvatarPicker selectedAvatar={avatar} onSelect={setAvatar} />

            <ValidatedInput
              label="Display Name"
              value={name}
              onChangeText={setName}
              validate={validateDisplayName}
              placeholder="Your name (shown in game)"
              maxLength={30}
              containerStyle={styles.fieldGap}
            />
          </>
        )}

        {/* Shared fields */}
        <ValidatedInput
          label="Username"
          value={username}
          onChangeText={(t) => setUsername(t.toLowerCase())}
          validate={tab === 'register' ? validateUsername : (v) => (!v.trim() ? 'Username is required' : null)}
          placeholder="unique_username"
          maxLength={20}
          autoCapitalize="none"
          autoCorrect={false}
          containerStyle={tab === 'register' ? styles.fieldGap : undefined}
        />

        <ValidatedInput
          label="PIN (4–6 digits)"
          value={pin}
          onChangeText={setPin}
          validate={tab === 'register' ? validatePin : validatePinLogin}
          placeholder="••••"
          maxLength={6}
          keyboardType="number-pad"
          secureTextEntry
          containerStyle={styles.fieldGap}
        />

        {/* Register mood */}
        {tab === 'register' && (
          <>
            <Text style={[styles.sectionLabel, styles.fieldGap]}>Your Mood</Text>
            <MoodSelector currentMood={mood} onChange={setMood} />
          </>
        )}

        {/* Submit */}
        <Pressable
          style={[styles.btn, styles.fieldGap]}
          onPress={tab === 'login' ? handleLogin : handleRegister}
          disabled={loading}
        >
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.btnText}>{tab === 'login' ? 'Login' : 'Create Account'}</Text>
          }
        </Pressable>

        {tab === 'login' && (
          <Text style={styles.hint}>
            No account?{' '}
            <Text style={styles.hintLink} onPress={() => switchTab('register')}>
              Create one
            </Text>
          </Text>
        )}

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#0d0020',
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  heroSection: {
    marginHorizontal: -24,
    paddingHorizontal: 24,
    paddingTop: 52,
    paddingBottom: 28,
    backgroundColor: '#1a0035',
    borderBottomWidth: 3,
    borderBottomColor: '#e91e8c',
    marginBottom: 24,
    gap: 6,
  },
  colorStrip: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 6,
  },
  colorPill: {
    width: 28,
    height: 8,
    borderRadius: 4,
  },
  logoRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  title: {
    fontSize: 48,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: -1,
    textShadowColor: 'rgba(233,30,140,0.6)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
  },
  heart: { fontSize: 40 },
  subtitle: { textAlign: 'center', color: '#c4b5fd', fontSize: 14 },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#1a0035',
    borderRadius: 16,
    padding: 5,
    marginBottom: 20,
    borderWidth: 1.5,
    borderColor: '#3b0d7a',
  },
  tab: {
    flex: 1,
    paddingVertical: 11,
    alignItems: 'center',
    borderRadius: 12,
  },
  tabActive: {
    backgroundColor: '#e91e8c',
    shadowColor: '#e91e8c',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 4,
  },
  tabText: { color: '#7c6a9a', fontWeight: '600', fontSize: 14 },
  tabTextActive: { color: '#fff', fontWeight: '800' },
  sectionLabel: {
    color: '#a78bfa',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    fontWeight: '700',
    marginBottom: 8,
  },
  fieldGap: { marginTop: 16 },
  btn: {
    backgroundColor: '#e91e8c',
    borderRadius: 16,
    paddingVertical: 17,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#e91e8c',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 10,
    elevation: 6,
  },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  hint: { textAlign: 'center', color: '#7c6a9a', fontSize: 13, marginTop: 14 },
  hintLink: { color: '#e91e8c', fontWeight: '700' },
});
