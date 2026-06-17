import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

export function useAlbum() {
  const queryClient = useQueryClient();

  // Buscar inventário do usuário atual
  const { data: inventario, isLoading } = useQuery({
    queryKey: ['inventario'],
    queryFn: async () => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('inventario')
        .select('*')
        .eq('id_usuario', user.user.id);

      if (error) throw error;
      return data || [];
    },
  });

  // Colar ou descolar figurinha (toggle)
  const toggleSticker = useMutation({
    mutationFn: async ({ codigo, atual }: { codigo: string; atual: number }) => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Usuário não autenticado');

      const novaQuantidade = atual > 0 ? 0 : 1;

      const { error } = await supabase
        .from('inventario')
        .upsert({
          id_usuario: user.user.id,
          codigo_figurinha: codigo,
          quantidade_colada: novaQuantidade,
          atualizado_em: new Date().toISOString(),
        });

      if (error) throw error;
      return { codigo, quantidade_colada: novaQuantidade };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventario'] });
    },
  });

  // Atualizar repetidas
  const updateRepeats = useMutation({
    mutationFn: async ({ codigo, repetidas }: { codigo: string; repetidas: number }) => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Usuário não autenticado');

      const { error } = await supabase
        .from('inventario')
        .upsert({
          id_usuario: user.user.id,
          codigo_figurinha: codigo,
          quantidade_repetida: repetidas,
          atualizado_em: new Date().toISOString(),
        });

      if (error) throw error;
      return { codigo, quantidade_repetida: repetidas };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventario'] });
    },
  });

  return {
    inventario,
    isLoading,
    toggleSticker,
    updateRepeats,
  };
}
