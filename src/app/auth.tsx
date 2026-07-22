import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

import { Button } from '@/components/button';
import { ThemedText } from '@/components/themed-text';
import { FontFamily, Spacing } from '@/constants/theme';
import { useAuth } from '@/features/auth/auth-context';
import { GradientBackground } from '@/features/onboarding/components/gradient-background';

/** Multicolor Google "G" mark. */
function GoogleIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 48 48">
      <Path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 4.1 29.6 2 24 2 11.8 2 2 11.8 2 24s9.8 22 22 22 22-9.8 22-22c0-1.5-.2-2.6-.4-3.5z" />
      <Path fill="#FF3D00" d="M4.3 14.7l6.6 4.8C12.7 15.1 17 12 24 12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 4.1 29.6 2 24 2 15.6 2 8.3 6.8 4.3 14.7z" />
      <Path fill="#4CAF50" d="M24 46c5.5 0 10.4-2.1 14.1-5.5l-6.5-5.5c-2 1.4-4.7 2.5-7.6 2.5-5.2 0-9.6-3.3-11.2-8l-6.5 5C8.2 41.1 15.5 46 24 46z" />
      <Path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.1-4.1 5.5l6.5 5.5C41.8 35.6 46 30.4 46 24c0-1.5-.2-2.6-.4-3.5z" />
    </Svg>
  );
}

/** Google sign-in. Redirects to Home once a session exists. */
export default function Auth() {
  const router = useRouter();
  const { session, signInWithGoogle } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  // Leave the screen: back to wherever we came from (e.g. Settings), or Home
  // when this was the post-onboarding step (no history).
  const done = () => (router.canGoBack() ? router.back() : router.replace('/home'));

  useEffect(() => {
    if (session) done();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  const onGoogle = async () => {
    setError('');
    setBusy(true);
    try {
      await signInWithGoogle();
    } catch {
      setError('Sign-in didn’t complete. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const skip = () => done();

  return (
    <GradientBackground>
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.topBar}>
          <Pressable
            onPress={skip}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Skip sign in"
            style={({ pressed }) => [styles.close, { opacity: pressed ? 0.6 : 1 }]}
          >
            <Svg width={26} height={26} viewBox="0 0 24 24" fill="none">
              <Path
                d="M6 6l12 12M18 6L6 18"
                stroke="#A7B0A9"
                strokeWidth={2}
                strokeLinecap="round"
              />
            </Svg>
          </Pressable>
        </View>

        <View style={styles.hero}>
          <ThemedText style={styles.wordmark}>Noor</ThemedText>
          <ThemedText type="body" style={styles.tagline}>
            Ask the Qur’an — grounded, gentle answers with authentic ayah.
          </ThemedText>
        </View>

        <View style={styles.footer}>
          <Button
            title="Continue with Google"
            variant="secondary"
            leftIcon={<GoogleIcon />}
            loading={busy}
            onPress={onGoogle}
          />
          {error ? (
            <ThemedText type="small" style={styles.error}>
              {error}
            </ThemedText>
          ) : null}
          <ThemedText type="small" style={styles.legal}>
            By continuing you agree to our Terms & Privacy Policy.
          </ThemedText>
        </View>
      </SafeAreaView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, justifyContent: 'space-between' },
  topBar: { flexDirection: 'row', justifyContent: 'flex-end', paddingHorizontal: Spacing.lg, paddingTop: Spacing.sm },
  close: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  hero: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: Spacing.xl, gap: Spacing.md },
  wordmark: { fontFamily: FontFamily.serifBold, fontSize: 52, lineHeight: 62, color: '#E3C46B' },
  tagline: { color: '#A7B0A9', textAlign: 'center', maxWidth: 320 },
  footer: { paddingHorizontal: Spacing.xl, paddingBottom: Spacing.xl, gap: Spacing.lg, alignItems: 'center' },
  error: { color: '#E5675A', textAlign: 'center' },
  legal: { color: '#8A968F', textAlign: 'center' },
});
