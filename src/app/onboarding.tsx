import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { GradientBackground } from '@/features/onboarding/components/gradient-background';
import { SURVEY_QUESTIONS } from '@/features/onboarding/content';
import { IntroCarousel } from '@/features/onboarding/steps/intro-carousel';
import { InterstitialStep } from '@/features/onboarding/steps/interstitial-step';
import { PlanReveal } from '@/features/onboarding/steps/plan-reveal';
import { SurveyStep } from '@/features/onboarding/steps/survey-step';

type Answers = Record<string, string[]>;

export default function Onboarding() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [, setAnswers] = useState<Answers>({});

  const next = () => setStep((s) => s + 1);
  const record = (key: string, selected: string[]) => {
    setAnswers((prev) => ({ ...prev, [key]: selected }));
    next();
  };

  const finish = () => router.replace('/home');

  // Ordered flow. Each entry renders one full-screen beat.
  const steps = useMemo(
    () => [
      () => <IntroCarousel onDone={next} onSkip={finish} />,
      () => (
        <SurveyStep
          question={SURVEY_QUESTIONS[0]}
          progress={0.33}
          onContinue={(sel) => record(SURVEY_QUESTIONS[0].key, sel)}
        />
      ),
      () => (
        <InterstitialStep
          title="Showing up is the hardest part"
          subtitle="You’re already here. We’ll build gently from this moment."
          onContinue={next}
        />
      ),
      () => (
        <SurveyStep
          question={SURVEY_QUESTIONS[1]}
          progress={0.66}
          onContinue={(sel) => record(SURVEY_QUESTIONS[1].key, sel)}
        />
      ),
      () => (
        <InterstitialStep
          title="Crafting your journey"
          subtitle="A path shaped around what matters most to you."
          cta="See my plan"
          onContinue={next}
        />
      ),
      () => <PlanReveal onContinue={finish} />,
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const Current = steps[Math.min(step, steps.length - 1)];

  return (
    <GradientBackground>
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        {/* key remounts on step change so each step re-plays its own entrance
            animations; no layout-animation wrapper (that breaks nested scroll). */}
        <View key={step} style={styles.flex}>
          <Current />
        </View>
      </SafeAreaView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  flex: { flex: 1 },
});
