import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

export function useConquistas() {
  const fetchConquistas = async () => {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) return { todas: [], minhas: [] };

    // Fetch all available conquistas
    const { data: todas, error: errTodas } = await supabase
      .from('conquistas')
      .select('*')
      .order('pontos', { ascending: true });
      
    if (errTodas) throw errTodas;

    // Fetch user unlocked conquistas
    const { data: minhas, error: errMinhas } = await supabase
      .from('user_conquistas')
      .select('id_conquista, desbloqueado_em')
      .eq('id_usuario', user.user.id);
      
    if (errMinhas) throw errMinhas;

    const unlockedIds = minhas.map((m: any) => m.id_conquista);

    // Merge status
    const combined = todas.map((c: any) => ({
      ...c,
      desbloqueada: unlockedIds.includes(c.id),
      desbloqueado_em: minhas.find((m: any) => m.id_conquista === c.id)?.desbloqueado_em
    }));

    return {
      todas: combined,
      minhas: combined.filter(c => c.desbloqueada)
    };
  };

  const { data, isLoading } = useQuery({
    queryKey: ['conquistas'],
    queryFn: fetchConquistas,
  });

  return {
    conquistas: data?.todas || [],
    minhasConquistas: data?.minhas || [],
    isLoading
  };
}
