import { Redirect } from 'expo-router';

/**
 * App entry. For now we always route into onboarding; once auth/session state
 * exists this will branch: signed-in → /home, otherwise → /onboarding.
 * The design showcase lives at /showcase for reference.
 */
export default function Index() {
  return <Redirect href="/onboarding" />;
}
