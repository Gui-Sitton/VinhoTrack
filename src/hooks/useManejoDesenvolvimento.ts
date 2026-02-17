import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTalhoes } from './useMudas';

export interface ManejoDesenvolvimentoItem {
  data_evento: string;
  fase: string;
  alturaMedia: number;
  numAplicacoes: number;
  quantidadeTotal: number;
}

/**
 * Hook para buscar dados da view_manejo_desenvolvimento,
 * agregados por (data_evento, fase), filtrados por talhão.
 */
export function useManejoDesenvolvimento(talhaoId?: string) {
  const { data: talhoes, isLoading: talhoesLoading } = useTalhoes();

  return useQuery({
    queryKey: ['manejo-desenvolvimento', talhaoId, talhoes?.map(t => t.id)],
    queryFn: async (): Promise<ManejoDesenvolvimentoItem[]> => {
      if (!talhoes || talhoes.length === 0) return [];

      let query = supabase
        .from('view_manejo_desenvolvimento')
        .select('data_evento, fase, altura_media_cm, num_aplicacoes, quantidade_total, talhao_id')
        .order('data_evento', { ascending: true });

      if (talhaoId && talhaoId !== 'todos') {
        query = query.eq('talhao_id', talhaoId);
      } else {
        query = query.in('talhao_id', talhoes.map(t => t.id));
      }

      const { data, error } = await query;
      if (error) {
        console.error('[useManejoDesenvolvimento] Erro:', error.message);
        throw error;
      }
      if (!data || data.length === 0) return [];

      // Aggregate by (data_evento, fase)
      const grouped: Record<string, {
        soma_altura: number;
        count: number;
        apps: number;
        qty: number;
        fase: string;
        data: string;
      }> = {};

      for (const row of data) {
        const key = `${row.data_evento}|${row.fase}`;
        if (!grouped[key]) {
          grouped[key] = {
            soma_altura: 0,
            count: 0,
            apps: 0,
            qty: 0,
            fase: row.fase || '',
            data: row.data_evento || '',
          };
        }
        grouped[key].soma_altura += Number(row.altura_media_cm || 0);
        grouped[key].count += 1;
        grouped[key].apps += Number(row.num_aplicacoes || 0);
        grouped[key].qty += Number(row.quantidade_total || 0);
      }

      return Object.values(grouped)
        .map(g => ({
          data_evento: g.data,
          fase: g.fase,
          alturaMedia: g.count > 0 ? Math.round((g.soma_altura / g.count) * 10) / 10 : 0,
          numAplicacoes: g.apps,
          quantidadeTotal: Math.round(g.qty * 10) / 10,
        }))
        .sort((a, b) => a.data_evento.localeCompare(b.data_evento));
    },
    enabled: !talhoesLoading && !!talhoes,
  });
}
