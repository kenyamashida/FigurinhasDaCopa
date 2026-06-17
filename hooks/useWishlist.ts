import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

export function useWishlist() {
  const queryClient = useQueryClient();

  const fetchWishlist = async () => {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) return [];

    const { data, error } = await supabase
      .from('wishlist')
      .select('codigo_figurinha')
      .eq('id_usuario', user.user.id);
      
    if (error) throw error;
    return data.map(item => item.codigo_figurinha);
  };

  const { data: wishlist, isLoading } = useQuery({
    queryKey: ['wishlist'],
    queryFn: fetchWishlist,
  });

  const toggleWishlist = useMutation({
    mutationFn: async ({ codigo, isOnWishlist }: { codigo: string, isOnWishlist: boolean }) => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error("Usuário não autenticado");

      if (isOnWishlist) {
        // Remover
        const { error } = await supabase
          .from('wishlist')
          .delete()
          .eq('id_usuario', user.user.id)
          .eq('codigo_figurinha', codigo);
        if (error) throw error;
      } else {
        // Adicionar
        const { error } = await supabase
          .from('wishlist')
          .insert({
            id_usuario: user.user.id,
            codigo_figurinha: codigo
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wishlist'] });
    }
  });

  return {
    wishlist,
    isLoading,
    toggleWishlist
  };
}
