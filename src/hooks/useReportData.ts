import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTalhoes } from './useMudas';

export interface ProducaoSafra {
  ano: number;
  producaoTotal: number;
  producaoMediaPlanta: number;
  plantasProdutivas: number;
}

export interface AplicacaoProduto {
  id: string;
  ano: number;
  data: string;
  produto: string;
  categoria: 'Fungicida' | 'Fertilizante' | 'Corretivo' | 'Inseticida' | 'Outro';
  quantidade: number;
  unidade: string;
  finalidade: string;
}

/**
 * Hook para buscar safras do usuário.
 * RLS: acesso via talhao_id -> talhoes.user_id = auth.uid()
 */
export function useSafras() {
  const { data: talhoes, isLoading: talhoesLoading } = useTalhoes();

  return useQuery({
    queryKey: ['safras', talhoes?.map(t => t.id)],
    queryFn: async () => {
      if (!talhoes || talhoes.length === 0) return [];

      const talhaoIds = talhoes.map(t => t.id);

      const { data, error } = await supabase
        .from('safras')
        .select('id, talhao_id, ano, data_inicio, data_fim, created_at')
        .in('talhao_id', talhaoIds)
        .order('ano');

      if (error) {
        console.error('[useSafras] Erro ao buscar safras:', error.message);
        throw error;
      }

      return data || [];
    },
    enabled: !talhoesLoading && !!talhoes,
  });
}

/**
 * Hook para buscar dados de produção.
 * RLS: acesso via talhao_id -> talhoes.user_id = auth.uid()
 */
export function useProducao() {
  const { data: talhoes, isLoading: talhoesLoading } = useTalhoes();
  const { data: safras, isLoading: safrasLoading } = useSafras();

  return useQuery({
    queryKey: ['producao', talhoes?.map(t => t.id)],
    queryFn: async () => {
      if (!talhoes || talhoes.length === 0) return [];

      const talhaoIds = talhoes.map(t => t.id);

      const { data, error } = await supabase
        .from('producao')
        .select('id, safra_id, talhao_id, producao_total_kg, plantas_produtivas, observacoes, created_at')
        .in('talhao_id', talhaoIds);

      if (error) {
        console.error('[useProducao] Erro ao buscar produção:', error.message);
        throw error;
      }

      return data || [];
    },
    enabled: !talhoesLoading && !!talhoes,
  });
}

/**
 * Hook para buscar dados de produção agrupados por safra.
 */
export function useProducaoSafras(): ReturnType<typeof useQuery<ProducaoSafra[]>> {
  const { data: safras, isLoading: safrasLoading } = useSafras();
  const { data: producao, isLoading: producaoLoading } = useProducao();

  return useQuery({
    queryKey: ['producao-safras', safras?.length, producao?.length],
    queryFn: async (): Promise<ProducaoSafra[]> => {
      if (!safras) return [];

      // Agrupar produção por ano
      const producaoPorAno: Record<number, { total: number; plantas: number }> = {};

      if (producao) {
        producao.forEach((p) => {
          const safra = safras.find(s => s.id === p.safra_id);
          const ano = safra?.ano;
          if (ano) {
            if (!producaoPorAno[ano]) {
              producaoPorAno[ano] = { total: 0, plantas: 0 };
            }
            producaoPorAno[ano].total += Number(p.producao_total_kg);
            producaoPorAno[ano].plantas += p.plantas_produtivas || 0;
          }
        });
      }

      const result: ProducaoSafra[] = safras.map((s) => ({
        ano: s.ano,
        producaoTotal: producaoPorAno[s.ano]?.total || 0,
        producaoMediaPlanta: producaoPorAno[s.ano]?.plantas
          ? producaoPorAno[s.ano].total / producaoPorAno[s.ano].plantas
          : 0,
        plantasProdutivas: producaoPorAno[s.ano]?.plantas || 0,
      }));

      return result;
    },
    enabled: !safrasLoading && !producaoLoading,
  });
}

/**
 * Hook para buscar aplicações de produtos.
 * RLS: acesso via talhao_id -> talhoes.user_id = auth.uid()
 * produtos é público (SELECT permitido)
 */
export function useAplicacoesProdutos() {
  const { data: talhoes, isLoading: talhoesLoading } = useTalhoes();

  return useQuery({
    queryKey: ['aplicacoes-produtos', talhoes?.map(t => t.id)],
    queryFn: async (): Promise<AplicacaoProduto[]> => {
      if (!talhoes || talhoes.length === 0) return [];

      const talhaoIds = talhoes.map(t => t.id);

      // Buscar aplicações do usuário
      const { data: aplicacoes, error: aplicacoesError } = await supabase
        .from('aplicacoes_produtos')
        .select('id, produto_id, talhao_id, data, quantidade, motivo, created_at')
        .in('talhao_id', talhaoIds)
        .order('data', { ascending: false });

      if (aplicacoesError) {
        console.error('[useAplicacoesProdutos] Erro ao buscar aplicações:', aplicacoesError.message);
        throw aplicacoesError;
      }

      if (!aplicacoes || aplicacoes.length === 0) return [];

      // Buscar produtos (tabela pública)
      const produtoIds = [...new Set(aplicacoes.map(a => a.produto_id).filter(Boolean))];
      
      let produtos: { id: string; nome: string; tipo: string; unidade: string }[] = [];
      
      if (produtoIds.length > 0) {
        const { data: produtosData, error: produtosError } = await supabase
          .from('produtos')
          .select('id, nome, tipo, unidade')
          .in('id', produtoIds);

        if (produtosError) {
          console.error('[useAplicacoesProdutos] Erro ao buscar produtos:', produtosError.message);
          // Continuar sem produtos
        } else {
          produtos = produtosData || [];
        }
      }

      const tipoMap: Record<string, AplicacaoProduto['categoria']> = {
        fungicida: 'Fungicida',
        fertilizante: 'Fertilizante',
        corretivo: 'Corretivo',
        inseticida: 'Inseticida',
        outro: 'Outro',
      };

      const result: AplicacaoProduto[] = aplicacoes.map((ap) => {
        const produto = produtos.find(p => p.id === ap.produto_id);

        return {
          id: ap.id,
          ano: new Date(ap.data).getFullYear(),
          data: ap.data,
          produto: produto?.nome || 'Desconhecido',
          categoria: tipoMap[produto?.tipo || ''] || 'Outro',
          quantidade: Number(ap.quantidade),
          unidade: produto?.unidade || 'kg',
          finalidade: ap.motivo || '',
        };
      });

      return result;
    },
    enabled: !talhoesLoading && !!talhoes,
  });
}

/**
 * Hook para buscar anos disponíveis baseado nas safras do usuário.
 */
export function useAnosDisponiveis() {
  const { data: safras, isLoading: safrasLoading } = useSafras();
  const { data: aplicacoes, isLoading: aplicacoesLoading } = useAplicacoesProdutos();

  return useQuery({
    queryKey: ['anos-disponiveis', safras?.length, aplicacoes?.length],
    queryFn: async () => {
      const anosSet = new Set<number>();

      // Anos das safras
      if (safras) {
        safras.forEach(s => anosSet.add(s.ano));
      }

      // Anos das aplicações
      if (aplicacoes) {
        aplicacoes.forEach(a => anosSet.add(a.ano));
      }

      const anos = Array.from(anosSet).sort((a, b) => a - b);

      // Se não há dados, retornar ano atual
      if (anos.length === 0) {
        return [new Date().getFullYear()];
      }

      return anos;
    },
    enabled: !safrasLoading && !aplicacoesLoading,
  });
}

/**
 * Hook para buscar categorias disponíveis.
 * produtos é tabela pública.
 */
export function useCategoriasDisponiveis() {
  return useQuery({
    queryKey: ['categorias-disponiveis'],
    queryFn: async () => {
      const { data: produtos, error } = await supabase
        .from('produtos')
        .select('tipo');

      if (error) {
        console.error('[useCategoriasDisponiveis] Erro ao buscar categorias:', error.message);
        throw error;
      }

      const tipoMap: Record<string, AplicacaoProduto['categoria']> = {
        fungicida: 'Fungicida',
        fertilizante: 'Fertilizante',
        corretivo: 'Corretivo',
        inseticida: 'Inseticida',
        outro: 'Outro',
      };

      if (!produtos || produtos.length === 0) {
        return ['Fungicida', 'Fertilizante', 'Corretivo', 'Inseticida'] as AplicacaoProduto['categoria'][];
      }

      const categorias = [...new Set(produtos.map(p => tipoMap[p.tipo] || 'Outro'))];
      return categorias as AplicacaoProduto['categoria'][];
    },
  });
}

/**
 * Hook combinado para dados do relatório.
 * Centraliza loading e erros.
 */
export function useReportData() {
  const producao = useProducaoSafras();
  const aplicacoes = useAplicacoesProdutos();
  const anos = useAnosDisponiveis();
  const categorias = useCategoriasDisponiveis();

  const isLoading = producao.isLoading || aplicacoes.isLoading || anos.isLoading || categorias.isLoading;
  const hasData = (producao.data?.length || 0) > 0 || (aplicacoes.data?.length || 0) > 0;

  return {
    producaoSafras: producao.data || [],
    aplicacoesProdutos: aplicacoes.data || [],
    anosDisponiveis: anos.data || [],
    categoriasDisponiveis: categorias.data || [],
    isLoading,
    hasData,
    error: producao.error || aplicacoes.error || anos.error || categorias.error,
  };
}
