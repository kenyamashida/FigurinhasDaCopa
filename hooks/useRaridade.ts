import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

export function useRaridadeDinamica() {
  return useQuery({
    queryKey: ['raridade-ranking'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_raridade_ranking');
      if (error) throw error;
      return data as { codigo_figurinha: string; total_donos: number }[];
    },
    staleTime: 1000 * 60 * 5, // Cache por 5 minutos
  });
}
