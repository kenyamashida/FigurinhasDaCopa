import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { Alert } from 'react-native';

export function useMatches() {
  const queryClient = useQueryClient();

  const { data: perfectMatches, isLoading: isLoadingMatches } = useQuery({
    queryKey: ['perfect_matches'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_perfect_matches');

      if (error) {
        console.error("Erro ao buscar matches:", error);
        return [];
      }
      return data;
    },
  });

  const requestTrade = useMutation({
    mutationFn: async (parceiroId: string) => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error("Não logado");

      const { data, error } = await supabase
        .from('matches')
        .insert({
          usuario_a: user.user.id,
          usuario_b: parceiroId,
          status: 'pendente'
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      Alert.alert("Sucesso!", "Solicitação de troca enviada!");
      queryClient.invalidateQueries({ queryKey: ['active_matches'] });
    },
    onError: (err: any) => {
      Alert.alert("Aviso", "Você já enviou uma solicitação para este colecionador ou houve um erro.");
    }
  });

  return { perfectMatches, isLoadingMatches, requestTrade };
}
