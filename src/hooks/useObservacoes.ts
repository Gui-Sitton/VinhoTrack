import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface NovaObservacao {
  muda_id: string;
  data: string;
  fase_fenologica: string;
  altura_cm: number | null;
  observacoes: string | null;
}

/**
 * Hook para criar uma nova observação de muda.
 * RLS: acesso via muda_id -> mudas.talhao_id -> talhoes.user_id = auth.uid()
 */
export function useCreateObservacao() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (observacao: NovaObservacao) => {
      const { data, error } = await supabase
        .from('observacoes_mudas')
        .insert({
          muda_id: observacao.muda_id,
          data: observacao.data,
          fase_fenologica: observacao.fase_fenologica,
          altura_cm: observacao.altura_cm,
          observacoes: observacao.observacoes,
        })
        .select('id, muda_id, data, fase_fenologica, altura_cm, observacoes, created_at')
        .single();

      if (error) {
        console.error('[useCreateObservacao] Erro ao criar observação:', error.message, error.code);
        throw error;
      }

      return data;
    },
    onSuccess: (_, variables) => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: ['muda', variables.muda_id] });
      queryClient.invalidateQueries({ queryKey: ['mudas'] });
    },
  });
}
