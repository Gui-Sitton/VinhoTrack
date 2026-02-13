import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface FaseFenologica {
  id: string;
  muda_id: string;
  fase: string;
  data_inicio: string;
  data_fim: string | null;
  fase_cientifica: string | null;
  BBCH_aproximado: string | null;
  descricao_cientifica: string | null;
}

export function useFasesFenologicasByMuda(mudaId: string | undefined) {
  return useQuery({
    queryKey: ['fases-fenologicas', mudaId],
    queryFn: async () => {
      if (!mudaId) return [];

      const { data, error } = await supabase
        .from('fases_fenologicas_mudas')
        .select('id, muda_id, fase, data_inicio, data_fim, fase_cientifica, BBCH_aproximado, descricao_cientifica')
        .eq('muda_id', mudaId)
        .order('data_inicio', { ascending: true });

      if (error) {
        console.error('[useFasesFenologicasByMuda] Erro:', error.message);
        throw error;
      }

      return (data || []) as FaseFenologica[];
    },
    enabled: !!mudaId,
  });
}
