import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// =============== TIPOS ===============

interface NovaObservacao {
  muda_id: string;
  data: string;
  fase_fenologica: string;
  altura_cm: number | null;
  observacoes: string | null;
}

export interface ObservacaoMudaUpdate {
  data?: string;
  fase_fenologica?: string;
  altura_cm?: number | null;
  observacoes?: string | null;
}

export interface ObservacaoGrupoUpdate {
  data?: string;
  observacao?: string;
}

export interface ObservacaoTalhaoUpdate {
  data?: string;
  tipo?: string;
  observacao?: string;
  origem?: string | null;
}

// =============== OBSERVAÇÕES DE MUDAS ===============

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
      queryClient.invalidateQueries({ queryKey: ['muda', variables.muda_id] });
      queryClient.invalidateQueries({ queryKey: ['mudas'] });
    },
  });
}

/**
 * Hook para atualizar uma observação de muda.
 */
export function useUpdateObservacaoMuda() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: ObservacaoMudaUpdate }) => {
      const { data, error } = await supabase
        .from('observacoes_mudas')
        .update(updates)
        .eq('id', id)
        .select('id, muda_id, data, fase_fenologica, altura_cm, observacoes, created_at')
        .single();

      if (error) {
        console.error('[useUpdateObservacaoMuda] Erro ao atualizar observação:', error.message, error.code);
        throw error;
      }

      return data;
    },
    onSuccess: (data) => {
      if (data?.muda_id) {
        queryClient.invalidateQueries({ queryKey: ['muda', data.muda_id] });
      }
      queryClient.invalidateQueries({ queryKey: ['mudas'] });
    },
  });
}

/**
 * Hook para deletar uma observação de muda.
 */
export function useDeleteObservacaoMuda() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, mudaId }: { id: string; mudaId?: string }) => {
      const { error } = await supabase
        .from('observacoes_mudas')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('[useDeleteObservacaoMuda] Erro ao deletar observação:', error.message, error.code);
        throw error;
      }

      return { id, mudaId };
    },
    onSuccess: (data) => {
      if (data?.mudaId) {
        queryClient.invalidateQueries({ queryKey: ['muda', data.mudaId] });
      }
      queryClient.invalidateQueries({ queryKey: ['mudas'] });
    },
  });
}

// =============== OBSERVAÇÕES DE GRUPOS ===============

/**
 * Hook para atualizar uma observação de grupo.
 */
export function useUpdateObservacaoGrupo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: ObservacaoGrupoUpdate }) => {
      const { data, error } = await supabase
        .from('observacoes_grupos')
        .update(updates)
        .eq('id', id)
        .select('id, talhao_id, data, observacao, created_at')
        .single();

      if (error) {
        console.error('[useUpdateObservacaoGrupo] Erro ao atualizar observação:', error.message, error.code);
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['observacoes_grupos'] });
    },
  });
}

/**
 * Hook para deletar uma observação de grupo.
 */
export function useDeleteObservacaoGrupo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('observacoes_grupos')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('[useDeleteObservacaoGrupo] Erro ao deletar observação:', error.message, error.code);
        throw error;
      }

      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['observacoes_grupos'] });
    },
  });
}

// =============== OBSERVAÇÕES DE TALHÕES ===============

/**
 * Hook para atualizar uma observação de talhão.
 */
export function useUpdateObservacaoTalhao() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: ObservacaoTalhaoUpdate }) => {
      const { data, error } = await supabase
        .from('observacoes_talhoes')
        .update(updates)
        .eq('id', id)
        .select('id, talhao_id, data, tipo, observacao, origem, created_at')
        .single();

      if (error) {
        console.error('[useUpdateObservacaoTalhao] Erro ao atualizar observação:', error.message, error.code);
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['observacoes_talhoes'] });
    },
  });
}

/**
 * Hook para deletar uma observação de talhão.
 */
export function useDeleteObservacaoTalhao() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('observacoes_talhoes')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('[useDeleteObservacaoTalhao] Erro ao deletar observação:', error.message, error.code);
        throw error;
      }

      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['observacoes_talhoes'] });
    },
  });
}
