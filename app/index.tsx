import { Redirect } from 'expo-router';

/**
 * Root index — immediately hands off to the auth guard in _layout.tsx.
 * The guard will redirect to /(auth)/welcome or the correct dashboard
 * depending on whether a session exists.
 */
export default function Index() {
  return <Redirect href="/(auth)/welcome" />;
}
