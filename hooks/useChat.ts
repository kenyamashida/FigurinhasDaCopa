import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useEffect, useState } from 'react';
import { Alert } from 'react-native';

export function useActiveMatches() {
  const { data: activeMatches, isLoading } = useQuery({
    queryKey: ['active_matches'],
    queryFn: async () => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return [];

      const { data, error } = await supabase
        .from('matches')
        .select(`
          id,
          status,
          criado_em,
          profile_a:usuario_a (id, nome, avatar_url),
          profile_b:usuario_b (id, nome, avatar_url)
        `)
        .or(`usuario_a.eq.${user.user.id},usuario_b.eq.${user.user.id}`)
        .eq('status', 'pendente') // Para MVP, consideramos pendente como ativo. Pode ser aceito.
        .order('criado_em', { ascending: false });

      if (error) {
        console.error("Erro ao buscar matches ativos:", error);
        return [];
      }

      // Formatando os dados para identificar o "outro" parceiro na conversa
      return data.map((match: any) => {
        const isUserA = match.profile_a.id === user.user?.id;
        return {
          id: match.id,
          status: match.status,
          criado_em: match.criado_em,
          parceiro: isUserA ? match.profile_b : match.profile_a,
        };
      });
    },
  });

  return { activeMatches, isLoading };
}

export function useChat(matchId: string) {
  const queryClient = useQueryClient();
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setCurrentUserId(data.user.id);
    });
  }, []);

  const { data: messages, isLoading: isLoadingMessages } = useQuery({
    queryKey: ['messages', matchId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('mensagens')
        .select('*')
        .eq('match_id', matchId)
        .order('criado_em', { ascending: true });

      if (error) throw error;
      return data || [];
    },
    enabled: !!matchId,
  });

  // Inscrevendo-se em novas mensagens via Supabase Realtime WebSockets
  useEffect(() => {
    if (!matchId) return;

    const subscription = supabase
      .channel(`chat_${matchId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'mensagens',
          filter: `match_id=eq.${matchId}`,
        },
        (payload) => {
          // Atualiza o cache do React Query em tempo real
          queryClient.setQueryData(['messages', matchId], (oldData: any) => {
            return [...(oldData || []), payload.new];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [matchId, queryClient]);

  const sendMessage = useMutation({
    mutationFn: async (conteudo: string) => {
      if (!currentUserId || !conteudo.trim()) return;

      const { error } = await supabase
        .from('mensagens')
        .insert({
          match_id: matchId,
          remetente_id: currentUserId,
          conteudo: conteudo.trim(),
        });

      if (error) {
        Alert.alert("Erro", "Falha ao enviar mensagem");
        throw error;
      }
    },
  });

  return { messages, isLoadingMessages, sendMessage, currentUserId };
}
