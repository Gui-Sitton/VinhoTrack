import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

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

// Hook para buscar dados de produção por safra
export function useProducaoSafras() {
  return useQuery({
    queryKey: ['producao-safras'],
    queryFn: async () => {
      const { data: safras, error: safrasError } = await supabase
        .from('safras')
        .select('*')
        .order('ano');

      if (safrasError) throw safrasError;

      const { data: producao, error: producaoError } = await supabase
        .from('producao')
        .select('*, safra:safras(ano)');

      if (producaoError) throw producaoError;

      // Agrupar produção por ano
      const producaoPorAno: Record<number, { total: number; plantas: number }> = {};
      
      producao.forEach((p) => {
        const ano = (p.safra as any)?.ano;
        if (ano) {
          if (!producaoPorAno[ano]) {
            producaoPorAno[ano] = { total: 0, plantas: 0 };
          }
          producaoPorAno[ano].total += Number(p.producao_total_kg);
          producaoPorAno[ano].plantas += p.plantas_produtivas || 0;
        }
      });

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
  });
}

// Hook para buscar aplicações de produtos
export function useAplicacoesProdutos() {
  return useQuery({
    queryKey: ['aplicacoes-produtos'],
    queryFn: async () => {
      const { data: aplicacoes, error: aplicacoesError } = await supabase
        .from('aplicacoes_produtos')
        .select('*, produto:produtos(*)')
        .order('data', { ascending: false });

      if (aplicacoesError) throw aplicacoesError;

      const result: AplicacaoProduto[] = aplicacoes.map((ap) => {
        const produto = ap.produto as any;
        const tipoMap: Record<string, AplicacaoProduto['categoria']> = {
          fungicida: 'Fungicida',
          fertilizante: 'Fertilizante',
          corretivo: 'Corretivo',
          inseticida: 'Inseticida',
          outro: 'Outro',
        };

        return {
          id: ap.id,
          ano: new Date(ap.data).getFullYear(),
          data: ap.data,
          produto: produto?.nome || 'Desconhecido',
          categoria: tipoMap[produto?.tipo] || 'Outro',
          quantidade: Number(ap.quantidade),
          unidade: produto?.unidade || 'kg',
          finalidade: ap.motivo || '',
        };
      });

      return result;
    },
  });
}

// Hook para buscar anos disponíveis
export function useAnosDisponiveis() {
  return useQuery({
    queryKey: ['anos-disponiveis'],
    queryFn: async () => {
      const { data: safras, error } = await supabase
        .from('safras')
        .select('ano')
        .order('ano');

      if (error) throw error;
      
      if (safras.length === 0) {
        // Fallback: buscar anos das aplicações
        const { data: aplicacoes } = await supabase
          .from('aplicacoes_produtos')
          .select('data');
        
        if (aplicacoes && aplicacoes.length > 0) {
          const anos = [...new Set(aplicacoes.map(a => new Date(a.data).getFullYear()))];
          return anos.sort();
        }
        
        // Se não há dados, retornar ano atual
        return [new Date().getFullYear()];
      }

      return safras.map(s => s.ano);
    },
  });
}

// Hook para buscar categorias disponíveis
export function useCategoriasDisponiveis() {
  return useQuery({
    queryKey: ['categorias-disponiveis'],
    queryFn: async () => {
      const { data: produtos, error } = await supabase
        .from('produtos')
        .select('tipo');

      if (error) throw error;
      
      const tipoMap: Record<string, AplicacaoProduto['categoria']> = {
        fungicida: 'Fungicida',
        fertilizante: 'Fertilizante',
        corretivo: 'Corretivo',
        inseticida: 'Inseticida',
        outro: 'Outro',
      };

      if (produtos.length === 0) {
        return ['Fungicida', 'Fertilizante', 'Corretivo', 'Inseticida'] as AplicacaoProduto['categoria'][];
      }

      const categorias = [...new Set(produtos.map(p => tipoMap[p.tipo] || 'Outro'))];
      return categorias as AplicacaoProduto['categoria'][];
    },
  });
}

// Hook combinado para dados do relatório
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
