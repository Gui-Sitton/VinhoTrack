import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface NovaObservacao {
  muda_id: string;
  data: string;
  fase_fenologica: string;
  altura_cm: number | null;
  observacoes: string | null;
}

// Hook para criar uma nova observação
export function useCreateObservacao() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (observacao: NovaObservacao) => {
      const { data, error } = await supabase
        .from('observacoes_mudas')
        .insert(observacao)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: ['muda', variables.muda_id] });
      queryClient.invalidateQueries({ queryKey: ['mudas'] });
    },
  });
}
