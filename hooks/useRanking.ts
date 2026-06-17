import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

export function useRanking() {
  const { data: leaderboard, isLoading } = useQuery({
    queryKey: ['leaderboard'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_leaderboard', { limit_num: 50 });

      if (error) {
        console.error("Erro ao buscar ranking:", error);
        return [];
      }
      return data;
    },
    refetchInterval: 60000, // Atualiza a cada 1 minuto
  });

  return { leaderboard, isLoading };
}
