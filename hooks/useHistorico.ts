import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

export function useHistorico() {
  const fetchHistorico = async () => {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) return [];

    const { data, error } = await supabase
      .from('historico_trocas')
      .select('*, usuario_a_data:profiles!historico_trocas_usuario_a_fkey(nome), usuario_b_data:profiles!historico_trocas_usuario_b_fkey(nome)')
      .or(`usuario_a.eq.${user.user.id},usuario_b.eq.${user.user.id}`)
      .order('realizada_em', { ascending: false });
      
    if (error) {
      console.error(error);
      return [];
    }
    
    // Formatar os dados para fácil consumo
    return data.map((troca: any) => {
      const souUsuarioA = troca.usuario_a === user.user.id;
      return {
        id: troca.id,
        parceiro_nome: souUsuarioA ? troca.usuario_b_data.nome : troca.usuario_a_data.nome,
        figurinhas_recebidas: souUsuarioA ? troca.figurinhas_recebidas : troca.figurinhas_dadas,
        figurinhas_dadas: souUsuarioA ? troca.figurinhas_dadas : troca.figurinhas_recebidas,
        data: new Date(troca.realizada_em).toLocaleDateString()
      };
    });
  };

  const { data: historico, isLoading } = useQuery({
    queryKey: ['historico_trocas'],
    queryFn: fetchHistorico,
  });

  return {
    historico,
    isLoading
  };
}
