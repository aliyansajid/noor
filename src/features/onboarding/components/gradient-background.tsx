import { LinearGradient } from 'expo-linear-gradient';
import { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

/**
 * The Noor onboarding canvas: a deep night-emerald gradient with a soft gold
 * glow bleeding from the top — our reverent answer to Bible Chat's violet.
 */
export function GradientBackground({ children }: { children: ReactNode }) {
  return (
    <View style={styles.root}>
      <LinearGradient
        colors={['#123227', '#0E1512', '#080C0A']}
        locations={[0, 0.55, 1]}
        style={StyleSheet.absoluteFill}
      />
      {/* gold glow wash near the top */}
      <LinearGradient
        colors={['rgba(227,196,107,0.16)', 'rgba(227,196,107,0)']}
        style={styles.glow}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0E1512' },
  glow: { position: 'absolute', top: 0, left: 0, right: 0, height: '45%' },
});
