import { useState, useEffect } from 'react';
import { Platform } from 'react-native';
import { supabase } from '../lib/supabase';
import { useQuery } from '@tanstack/react-query';

export function useLocation() {
  const [location, setLocation] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    // expo-location não funciona corretamente na web
    if (Platform.OS === 'web') {
      setErrorMsg('Localização não disponível na versão web.');
      return;
    }

    let subscription: any = null;

    const startWatching = async () => {
      const Location = require('expo-location');
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Permissão para acessar a localização foi negada.');
        return;
      }

      subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced,
          distanceInterval: 50,
        },
        async (newLocation: any) => {
          setLocation(newLocation);
          
          const { data: user } = await supabase.auth.getUser();
          if (user?.user) {
            await supabase
              .from('profiles')
              .update({
                latitude: newLocation.coords.latitude,
                longitude: newLocation.coords.longitude,
                atualizado_em: new Date().toISOString()
              })
              .eq('id', user.user.id);
          }
        }
      );
    };

    startWatching();

    return () => {
      if (subscription) {
        subscription.remove();
      }
    };
  }, []);

  const { data: nearbyUsers, isLoading: isLoadingNearby } = useQuery({
    queryKey: ['nearby_users', location?.coords.latitude, location?.coords.longitude],
    queryFn: async () => {
      if (!location) return [];
      const { data, error } = await supabase.rpc('get_nearby_users', {
        user_lat: location.coords.latitude,
        user_lng: location.coords.longitude,
        radius_meters: 5000,
      });
      if (error) {
        console.error("Erro ao buscar usuários próximos:", error);
        return [];
      }
      return data;
    },
    enabled: !!location && Platform.OS !== 'web',
    refetchInterval: 30000,
  });

  const { data: tradePoints } = useQuery({
    queryKey: ['trade_points', location?.coords.latitude, location?.coords.longitude],
    queryFn: async () => {
      if (!location) return [];
      const { data, error } = await supabase.rpc('get_nearby_trade_points', {
        user_lat: location.coords.latitude,
        user_lng: location.coords.longitude,
        radius_meters: 15000,
      });
      if (error) {
        console.error("Erro ao buscar trade points:", error);
        return [];
      }
      return data;
    },
    enabled: !!location && Platform.OS !== 'web',
  });

  return { location, errorMsg, nearbyUsers, isLoadingNearby, tradePoints };
}

