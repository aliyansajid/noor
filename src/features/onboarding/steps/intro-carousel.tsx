import { useRef, useState } from 'react';
import {
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { Button } from '@/components/button';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { EmblemStage } from '@/features/onboarding/components/emblem-stage';
import { PageDots } from '@/features/onboarding/components/page-dots';
import { INTRO_SLIDES } from '@/features/onboarding/content';

const { width } = Dimensions.get('window');

export function IntroCarousel({ onDone }: { onDone: () => void }) {
  const [index, setIndex] = useState(0);
  const scrollRef = useRef<ScrollView>(null);
  const last = INTRO_SLIDES.length - 1;

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
      <View style={styles.topBar}>
        <ThemedText type="subtitle" themeColor="primary">
          Noor
        </ThemedText>
        <ThemedText type="label" style={styles.skip} onPress={onDone}>
          Skip
        </ThemedText>
      </View>

      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        style={styles.flex}
      >
        {INTRO_SLIDES.map((slide) => (
          <View key={slide.key} style={[styles.slide, { width }]}>
            <View style={styles.art}>
              <EmblemStage motif={slide.motif} size={116} />
            </View>
            <View style={styles.copy}>
              <ThemedText type="title" style={styles.title}>
                {slide.title}
              </ThemedText>
              <ThemedText type="body" style={styles.subtitle}>
                {slide.subtitle}
              </ThemedText>
            </View>
          </View>
        ))}
      </ScrollView>

      <Animated.View entering={FadeIn} style={styles.footer}>
        <PageDots count={INTRO_SLIDES.length} activeIndex={index} />
        <Button
          title={index === last ? 'Get started' : 'Continue'}
          onPress={next}
          style={styles.cta}
        />
        <ThemedText type="small" style={styles.legal}>
          By continuing you agree to our Terms & Privacy Policy.
        </ThemedText>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.sm,
  },
  skip: { color: '#8A968F' },
  slide: { flex: 1, alignItems: 'center', justifyContent: 'flex-end' },
  art: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  copy: {
    paddingHorizontal: Spacing.xl,
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.xxl,
  },
  title: { color: '#EDE9DF', textAlign: 'center' },
  subtitle: { color: '#A7B0A9', textAlign: 'center', maxWidth: 320 },
  footer: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xl,
    gap: Spacing.xl,
    alignItems: 'center',
  },
  cta: {},
  legal: { color: '#8A968F', textAlign: 'center' },
});
