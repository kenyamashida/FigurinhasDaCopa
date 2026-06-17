import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { View, ActivityIndicator, Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

export default function Index() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [seenOnboarding, setSeenOnboarding] = useState(false);

  useEffect(() => {
    const checkState = async () => {
      try {
        let hasSeen = null;
        if (Platform.OS === 'web') {
          hasSeen = typeof window !== 'undefined' ? window.localStorage.getItem('has_seen_onboarding') : null;
        } else {
          hasSeen = await SecureStore.getItemAsync('has_seen_onboarding');
        }
        setSeenOnboarding(hasSeen === 'true');
      } catch (e) {
        console.warn('Erro ao ler has_seen_onboarding', e);
      }
      
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      
      // DEBUg: Se tivermos um erro na URL, não vamos redirecionar ainda
      if (Platform.OS === 'web' && window.location.hash.includes('error_description')) {
        const params = new URLSearchParams(window.location.hash.replace('#', '?'));
        alert('Erro do Supabase: ' + params.get('error_description'));
        // Mantem loading para não redirecionar
        return; 
      }
      
      setLoading(false);
    };

    checkState();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#E61D25" />
      </View>
    );
  }

  if (!seenOnboarding) {
    return <Redirect href="/(auth)/onboarding" />;
  }

  if (!session) {
    return <Redirect href="/(auth)/login" />;
  }

  return <Redirect href="/(tabs)/album" />;
}
