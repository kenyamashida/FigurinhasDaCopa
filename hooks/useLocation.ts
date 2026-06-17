import { useState, useEffect } from 'react';
import * as Location from 'expo-location';
import { supabase } from '../lib/supabase';
import { Alert } from 'react-native';
import { useQuery } from '@tanstack/react-query';

export function useLocation() {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Solicitando permissão e pegando a localização atual
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Permissão para acessar a localização foi negada.');
        return;
      }

      // Inicia o rastreamento em background/foreground contínuo
      const subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced,
          distanceInterval: 50, // Atualiza a cada 50 metros
        },
        async (newLocation) => {
          setLocation(newLocation);
          
          // Sincronizando com o Supabase para atualizar nossa posição no mapa de trocas
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

      return () => {
        subscription.remove();
      };
    })();
  }, []);

  // Fetching de usuários próximos num raio (ex: 5km = 5000 metros)
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
    enabled: !!location, // Só executa se tiver localização
    refetchInterval: 30000, // Atualiza a cada 30 segundos
  });

  const { data: tradePoints } = useQuery({
    queryKey: ['trade_points', location?.coords.latitude, location?.coords.longitude],
    queryFn: async () => {
      if (!location) return [];

      const { data, error } = await supabase.rpc('get_nearby_trade_points', {
        user_lat: location.coords.latitude,
        user_lng: location.coords.longitude,
        radius_meters: 15000, // Raio maior de 15km para pontos fixos
      });

      if (error) {
        console.error("Erro ao buscar trade points:", error);
        return [];
      }
      return data;
    },
    enabled: !!location,
  });

  return { location, errorMsg, nearbyUsers, isLoadingNearby, tradePoints };
}
