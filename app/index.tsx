import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import SplashScreen from './splash';

export default function Index() {
  const { session, loading } = useAuth();
  const [isSplashReady, setSplashReady] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Show splash screen for at least 3 seconds
    const timer = setTimeout(() => {
      setSplashReady(true);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!loading && isSplashReady) {
      setTimeout(() => {
        router.replace('/(tabs)');
      }, 0);
    }
  }, [session, loading, isSplashReady]);

  return <SplashScreen />;
}
