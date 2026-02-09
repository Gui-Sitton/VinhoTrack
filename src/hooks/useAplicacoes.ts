import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTalhoes } from './useMudas';

export interface Produto {
  id: string;
  nome: string;
  tipo: 'fungicida' | 'fertilizante' | 'corretivo' | 'inseticida' | 'outro';
  ingrediente_ativo: string | null;
  unidade: string;
}

export interface AplicacaoProduto {
  id: string;
  produto_id: string | null;
  talhao_id: string | null;
  data: string;
  quantidade: number;
  motivo: string | null;
  created_at: string | null;
  produto?: Produto | null;
}

/**
 * Hook para buscar produtos (tabela pública, sem RLS restritivo).
 */
export function useProdutos() {
  return useQuery({
    queryKey: ['produtos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('produtos')
        .select('id, nome, tipo, ingrediente_ativo, unidade, created_at')
        .order('nome');

      if (error) {
        console.error('[useProdutos] Erro ao buscar produtos:', error.message);
        throw error;
      }

      return (data || []) as Produto[];
    },
  });
}

/**
 * Hook para buscar aplicações de produtos do usuário.
 * RLS: acesso via talhao_id -> talhoes.user_id = auth.uid()
 */
export function useAplicacoes() {
  const { data: talhoes, isLoading: talhoesLoading } = useTalhoes();
  const { data: produtos } = useProdutos();

  return useQuery({
    queryKey: ['aplicacoes', talhoes?.map(t => t.id)],
    queryFn: async () => {
      if (!talhoes || talhoes.length === 0) {
        return [];
      }

      const talhaoIds = talhoes.map(t => t.id);

      const { data, error } = await supabase
        .from('aplicacoes_produtos')
        .select('id, produto_id, talhao_id, data, quantidade, motivo, created_at')
        .in('talhao_id', talhaoIds)
        .order('data', { ascending: false });

      if (error) {
        console.error('[useAplicacoes] Erro ao buscar aplicações:', error.message);
        throw error;
      }

      // Enriquecer com dados do produto
      const aplicacoesComProduto = (data || []).map(app => ({
        ...app,
        produto: produtos?.find(p => p.id === app.produto_id) || null,
      }));

      return aplicacoesComProduto as AplicacaoProduto[];
    },
    enabled: !talhoesLoading && !!talhoes,
  });
}

/**
 * Mutation para criar nova aplicação de produto.
 */
export function useCreateAplicacao() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (aplicacao: {
      produto_id: string;
      talhao_id: string;
      data: string;
      quantidade: number;
      motivo?: string;
    }) => {
      const { data, error } = await supabase
        .from('aplicacoes_produtos')
        .insert({
          produto_id: aplicacao.produto_id,
          talhao_id: aplicacao.talhao_id,
          data: aplicacao.data,
          quantidade: aplicacao.quantidade,
          motivo: aplicacao.motivo || null,
        })
        .select('id, produto_id, talhao_id, data, quantidade, motivo, created_at')
        .single();

      if (error) {
        console.error('[useCreateAplicacao] Erro ao criar aplicação:', error.message);
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['aplicacoes'] });
    },
  });
}

/**
 * Mutation para atualizar uma aplicação de produto existente.
 */
export function useUpdateAplicacao() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (aplicacao: {
      id: string;
      produto_id: string;
      talhao_id: string;
      data: string;
      quantidade: number;
      motivo?: string;
    }) => {
      const { data, error } = await supabase
        .from('aplicacoes_produtos')
        .update({
          produto_id: aplicacao.produto_id,
          talhao_id: aplicacao.talhao_id,
          data: aplicacao.data,
          quantidade: aplicacao.quantidade,
          motivo: aplicacao.motivo ?? null,
        })
        .eq('id', aplicacao.id)
        .select('id, produto_id, talhao_id, data, quantidade, motivo, created_at')
        .single();

      if (error) {
        console.error('[useUpdateAplicacao] Erro ao atualizar aplicação:', error.message);
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['aplicacoes'] });
    },
  });
}

/**
 * Mutation para deletar aplicação de produto.
 */
export function useDeleteAplicacao() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('aplicacoes_produtos')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('[useDeleteAplicacao] Erro ao deletar aplicação:', error.message);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['aplicacoes'] });
    },
  });
}
