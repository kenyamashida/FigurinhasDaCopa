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

export function useRaridade(codigo?: string) {
  const { data: raridadeData, isLoading } = useRaridadeDinamica();
  
  if (!codigo || !raridadeData) return { data: null, isLoading };
  
  const stickerData = raridadeData.find(r => r.codigo_figurinha === codigo);
  const totalDonos = stickerData ? stickerData.total_donos : 0;
  
  let maxDonos = 0;
  raridadeData.forEach(r => {
    if (r.total_donos > maxDonos) maxDonos = r.total_donos;
  });
  
  let label = 'Comum';
  if (totalDonos === 0) label = 'Impossível';
  else {
    const ratio = totalDonos / Math.max(maxDonos, 1);
    if (ratio <= 0.05) label = 'Lendária';
    else if (ratio <= 0.15) label = 'Épica';
    else if (ratio <= 0.30) label = 'Rara';
    else if (ratio <= 0.60) label = 'Incomum';
  }
  
  return {
    data: {
      e_brilhante: label === 'Lendária' || label === 'Épica',
      raridade_dinamica: label,
      total_usuarios_com_figurinha: totalDonos
    },
    isLoading
  };
}
