import { Redirect } from 'expo-router';

import { useSettings } from '@/features/settings/settings-context';

/**
 * App entry. First launch → onboarding; afterwards → Home. Sign-in is optional
 * (offered once after onboarding, and available from Settings), so it's never
 * forced here. Persisted state is already restored — the root layout holds the
 * splash until then.
 */
export default function Index() {
  const { onboarded } = useSettings();
  return <Redirect href={onboarded ? '/home' : '/onboarding'} />;
}
