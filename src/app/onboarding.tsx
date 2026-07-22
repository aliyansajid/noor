import { useRouter } from 'expo-router';

import { useAuth } from '@/features/auth/auth-context';
import { GradientBackground } from '@/features/onboarding/components/gradient-background';
import { IntroCarousel } from '@/features/onboarding/steps/intro-carousel';
import { useSettings } from '@/features/settings/settings-context';

export default function Onboarding() {
  const router = useRouter();
  const { completeOnboarding } = useSettings();
  const { configured, session } = useAuth();

  // Mark onboarding seen (so we skip it next launch), then sign in (or straight
  // into the app when auth isn't configured / already signed in).
  const finish = () => {
    completeOnboarding();
    router.replace(configured && !session ? '/auth' : '/home');
  };

  // Onboarding is the three full-bleed intro slides, then straight into the app.
  return (
    <GradientBackground>
      <IntroCarousel onDone={finish} onSkip={finish} />
    </GradientBackground>
  );
}
