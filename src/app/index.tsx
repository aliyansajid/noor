import { Redirect } from 'expo-router';

import { useSettings } from '@/features/settings/settings-context';

/**
 * App entry. First launch → onboarding; afterwards → straight to Home.
 * Persisted state is already loaded by the time this renders — the root layout
 * holds the splash until then. Once auth/session state exists this also
 * branches on it. The design showcase lives at /showcase for reference.
 */
export default function Index() {
  const { onboarded } = useSettings();
  return <Redirect href={onboarded ? '/home' : '/onboarding'} />;
}
