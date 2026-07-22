import { useRouter } from 'expo-router';

import { GradientBackground } from '@/features/onboarding/components/gradient-background';
import { IntroCarousel } from '@/features/onboarding/steps/intro-carousel';
import { useSettings } from '@/features/settings/settings-context';

export default function Onboarding() {
  const router = useRouter();
  const { completeOnboarding } = useSettings();

  // Mark onboarding seen (so we skip it next launch), then into the app.
  const finish = () => {
    completeOnboarding();
    router.replace('/home');
  };

  // Onboarding is the three full-bleed intro slides, then straight into the app.
  return (
    <GradientBackground>
      <IntroCarousel onDone={finish} onSkip={finish} />
    </GradientBackground>
  );
}
