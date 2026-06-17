import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

export function useRaridade(codigo: string | undefined) {
  return useQuery({
    queryKey: ['raridade', codigo],
    queryFn: async () => {
      if (!codigo) return null;
      const { data, error } = await supabase
        .from('v_raridade_figurinhas')
        .select('*')
        .eq('codigo', codigo)
        .single();
        
      if (error && error.code !== 'PGRST116') {
        console.error("Erro ao buscar raridade:", error);
      }
      return data;
    },
    enabled: !!codigo,
  });
}
