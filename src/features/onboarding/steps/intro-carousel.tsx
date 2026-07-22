import { LinearGradient } from 'expo-linear-gradient';
import { useRef, useState } from 'react';
import {
  Dimensions,
  Image,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/button';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { PageDots } from '@/features/onboarding/components/page-dots';
import { INTRO_SLIDES } from '@/features/onboarding/content';

const { width, height } = Dimensions.get('window');

export function IntroCarousel({ onDone, onSkip }: { onDone: () => void; onSkip: () => void }) {
  const [index, setIndex] = useState(0);
  const scrollRef = useRef<ScrollView>(null);
  const insets = useSafeAreaInsets();
  const last = INTRO_SLIDES.length - 1;
  const slide = INTRO_SLIDES[index];

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const i = Math.round(e.nativeEvent.contentOffset.x / width);
    if (i !== index) setIndex(i);
  };

  const next = () => {
    if (index < last) {
      scrollRef.current?.scrollTo({ x: (index + 1) * width, animated: true });
    } else {
      onDone();
    }
  };

  return (
    <View style={styles.root}>
      {/* full-bleed paging images */}
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        style={StyleSheet.absoluteFill}
      >
        {INTRO_SLIDES.map((s) => (
          <Image key={s.key} source={s.image} style={styles.image} resizeMode="cover" />
        ))}
      </ScrollView>

      {/* scrim: light wash up top for Skip, strong fade at the bottom for text */}
      <LinearGradient
        pointerEvents="none"
        colors={['rgba(8,12,10,0.45)', 'transparent', 'rgba(8,12,10,0.35)', 'rgba(8,12,10,0.96)']}
        locations={[0, 0.22, 0.5, 1]}
        style={StyleSheet.absoluteFill}
      />

      {/* Skip */}
      <View style={[styles.topBar, { paddingTop: insets.top + Spacing.sm }]}>
        <ThemedText type="label" style={styles.skip} onPress={onSkip}>
          Skip
        </ThemedText>
      </View>

      {/* Copy + controls */}
      <View style={[styles.bottom, { paddingBottom: insets.bottom + Spacing.xl }]}>
        <Animated.View key={index} entering={FadeIn.duration(450)} style={styles.copy}>
          <ThemedText type="title" style={styles.title}>
            {slide.title}
          </ThemedText>
          <ThemedText type="body" style={styles.subtitle}>
            {slide.subtitle}
          </ThemedText>
        </Animated.View>

        <PageDots count={INTRO_SLIDES.length} activeIndex={index} />
        <Button
          title={index === last ? 'Get started' : 'Continue'}
          onPress={next}
          style={styles.cta}
        />
        <ThemedText type="small" style={styles.legal}>
          By continuing you agree to our Terms & Privacy Policy.
        </ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#080C0A' },
  image: { width, height },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    alignItems: 'flex-end',
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.sm,
  },
  skip: { color: '#EDE9DF' },
  bottom: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: Spacing.xl,
    gap: Spacing.xl,
    alignItems: 'center',
  },
  copy: { alignItems: 'center', gap: Spacing.md },
  title: { color: '#EDE9DF', textAlign: 'center' },
  subtitle: { color: '#C6CEC7', textAlign: 'center', maxWidth: 340 },
  cta: { alignSelf: 'stretch' },
  legal: { color: '#8A968F', textAlign: 'center' },
});
