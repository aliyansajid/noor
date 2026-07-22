import { useRouter } from 'expo-router';

import { GradientBackground } from '@/features/onboarding/components/gradient-background';
import { IntroCarousel } from '@/features/onboarding/steps/intro-carousel';

export default function Onboarding() {
  const router = useRouter();
  const finish = () => router.replace('/home');

  // Onboarding is the three full-bleed intro slides, then straight into the app.
  return (
    <GradientBackground>
      <IntroCarousel onDone={finish} onSkip={finish} />
    </GradientBackground>
  );
}
