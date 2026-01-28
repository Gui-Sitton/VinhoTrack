import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTalhoes } from './useMudas';
import { useAuth } from '@/contexts/AuthContext';

export interface Irrigacao {
  id: string;
  talhao_id: string;
  user_id: string;
  data_inicio: string;
  data_fim: string | null;
  volume_total_l: number;
  volume_por_muda_l: number | null;
  observacoes: string | null;
  created_at: string;
}

export interface IrrigacaoInput {
  talhao_id: string;
  data_inicio: string;
  data_fim?: string | null;
  volume_total_l: number;
  volume_por_muda_l?: number | null;
  observacoes?: string | null;
}

/**
 * Hook para buscar irrigações do usuário.
 * RLS: user_id = auth.uid()
 * Ordenação por data_inicio DESC (mais recente primeiro)
 */
export function useIrrigacoes() {
  const { data: talhoes, isLoading: talhoesLoading } = useTalhoes();

  return useQuery({
    queryKey: ['irrigacoes', talhoes?.map(t => t.id)],
    queryFn: async () => {
      if (!talhoes || talhoes.length === 0) {
        return [];
      }

      const talhaoIds = talhoes.map(t => t.id);

      const { data, error } = await supabase
        .from('irrigacoes_talhoes')
        .select('*')
        .in('talhao_id', talhaoIds)
        .order('data_inicio', { ascending: false });

      if (error) {
        console.error('[useIrrigacoes] Erro ao buscar irrigações:', error.message);
        throw error;
      }

      return (data || []) as Irrigacao[];
    },
    enabled: !talhoesLoading && !!talhoes,
  });
}

/**
 * Hook para criar nova irrigação.
 */
export function useCreateIrrigacao() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (input: IrrigacaoInput) => {
      if (!user?.id) {
        throw new Error('Usuário não autenticado');
      }

      const { data, error } = await supabase
        .from('irrigacoes_talhoes')
        .insert({
          talhao_id: input.talhao_id,
          user_id: user.id,
          data_inicio: input.data_inicio,
          data_fim: input.data_fim || null,
          volume_total_l: input.volume_total_l,
          volume_por_muda_l: input.volume_por_muda_l || null,
          observacoes: input.observacoes || null,
        })
        .select()
        .single();

      if (error) {
        console.error('[useCreateIrrigacao] Erro ao criar irrigação:', error.message);
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['irrigacoes'] });
    },
  });
}

/**
 * Hook para atualizar irrigação existente.
 */
export function useUpdateIrrigacao() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...input }: IrrigacaoInput & { id: string }) => {
      const { data, error } = await supabase
        .from('irrigacoes_talhoes')
        .update({
          talhao_id: input.talhao_id,
          data_inicio: input.data_inicio,
          data_fim: input.data_fim || null,
          volume_total_l: input.volume_total_l,
          volume_por_muda_l: input.volume_por_muda_l || null,
          observacoes: input.observacoes || null,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('[useUpdateIrrigacao] Erro ao atualizar irrigação:', error.message);
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['irrigacoes'] });
    },
  });
}

/**
 * Hook para deletar irrigação.
 */
export function useDeleteIrrigacao() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('irrigacoes_talhoes')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('[useDeleteIrrigacao] Erro ao deletar irrigação:', error.message);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['irrigacoes'] });
    },
  });
}

/**
 * Hook para dados de irrigação no relatório.
 * Retorna estatísticas agregadas.
 */
export function useIrrigacoesReport() {
  const { data: irrigacoes, isLoading } = useIrrigacoes();
  const { data: talhoes } = useTalhoes();

  return useQuery({
    queryKey: ['irrigacoes-report', irrigacoes?.length],
    queryFn: async () => {
      if (!irrigacoes || irrigacoes.length === 0) {
        return {
          totalVolume: 0,
          totalEventos: 0,
          talhaoMaisIrrigado: null as { id: string; nome: string; volume: number } | null,
          volumePorAno: [] as { ano: number; volume: number }[],
          volumePorTalhao: [] as { talhaoId: string; talhaoNome: string; volume: number }[],
          periodoInicio: null as string | null,
          periodoFim: null as string | null,
        };
      }

      // Total de volume e eventos
      const totalVolume = irrigacoes.reduce((acc, i) => acc + Number(i.volume_total_l), 0);
      const totalEventos = irrigacoes.length;

      // Período analisado
      const datasInicio = irrigacoes.map(i => i.data_inicio).sort();
      const periodoInicio = datasInicio[0];
      const periodoFim = datasInicio[datasInicio.length - 1];

      // Volume por talhão
      const volumePorTalhaoMap: Record<string, number> = {};
      irrigacoes.forEach((i) => {
        volumePorTalhaoMap[i.talhao_id] = (volumePorTalhaoMap[i.talhao_id] || 0) + Number(i.volume_total_l);
      });

      const volumePorTalhao = Object.entries(volumePorTalhaoMap).map(([talhaoId, volume]) => {
        const talhao = talhoes?.find(t => t.id === talhaoId);
        return {
          talhaoId,
          talhaoNome: talhao?.codigo || talhao?.nome || 'Desconhecido',
          volume,
        };
      }).sort((a, b) => b.volume - a.volume);

      // Talhão mais irrigado
      const talhaoMaisIrrigado = volumePorTalhao[0] || null;

      // Volume por ano
      const volumePorAnoMap: Record<number, number> = {};
      irrigacoes.forEach((i) => {
        const ano = new Date(i.data_inicio).getFullYear();
        volumePorAnoMap[ano] = (volumePorAnoMap[ano] || 0) + Number(i.volume_total_l);
      });

      const volumePorAno = Object.entries(volumePorAnoMap)
        .map(([ano, volume]) => ({ ano: Number(ano), volume }))
        .sort((a, b) => a.ano - b.ano);

      return {
        totalVolume,
        totalEventos,
        talhaoMaisIrrigado: talhaoMaisIrrigado ? {
          id: talhaoMaisIrrigado.talhaoId,
          nome: talhaoMaisIrrigado.talhaoNome,
          volume: talhaoMaisIrrigado.volume,
        } : null,
        volumePorAno,
        volumePorTalhao,
        periodoInicio,
        periodoFim,
      };
    },
    enabled: !isLoading,
  });
}
