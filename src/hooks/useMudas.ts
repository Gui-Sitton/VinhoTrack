import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type MudaStatus = 'ativa' | 'atencao' | 'falha' | 'substituida';

export interface Muda {
  id: string;
  codigo: string;
  linha: number;
  planta_na_linha: number;
  status: MudaStatus;
  talhao_id: string | null;
  latitude: number | null;
  longitude: number | null;
  created_at: string | null;
  talhao?: Talhao | null;
  observacoes?: Observacao[];
}

export interface Talhao {
  id: string;
  codigo: string;
  nome: string | null;
  variedade: string;
  data_plantio: string;
  area_ha: number | null;
  espacamento_linhas_m: number;
  espacamento_plantas_m: number;
  orientacao_linhas: string | null;
  porta_enxerto: string | null;
  user_id: string | null;
}

export interface Observacao {
  id: string;
  data: string;
  fase_fenologica: string;
  altura_cm: number | null;
  observacoes: string | null;
  muda_id: string | null;
  created_at: string | null;
}

// Fases fenológicas da videira
export const fasesFenologicas = [
  'Dormência',
  'Brotação',
  'Floração',
  'Frutificação',
  'Desenvolvimento dos frutos',
  'Véraison (início da maturação)',
  'Maturação',
  'Colheita',
  'Crescimento vegetativo',
];

/**
 * Hook raiz: busca os talhões do usuário autenticado.
 * Esta é a primeira query a ser feita - todas as outras dependem dela.
 * RLS: talhoes.user_id = auth.uid()
 */
export function useTalhoes() {
  return useQuery({
    queryKey: ['talhoes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('talhoes')
        .select('id, codigo, nome, variedade, data_plantio, area_ha, espacamento_linhas_m, espacamento_plantas_m, orientacao_linhas, porta_enxerto, user_id')
        .order('codigo');

      if (error) {
        // Diferenciar erro de RLS de outros erros
        console.error('[useTalhoes] Erro ao buscar talhões:', error.message, error.code);
        throw error;
      }

      // Array vazio é um estado válido (usuário sem talhões)
      return (data || []) as Talhao[];
    },
  });
}

/**
 * Hook para buscar mudas do usuário.
 * Depende dos talhões carregados previamente.
 * RLS: acesso via talhao_id -> talhoes.user_id = auth.uid()
 */
export function useMudas() {
  const { data: talhoes, isLoading: talhoesLoading } = useTalhoes();
  
  return useQuery({
    queryKey: ['mudas', talhoes?.map(t => t.id)],
    queryFn: async () => {
      // Se não há talhões, não há mudas
      if (!talhoes || talhoes.length === 0) {
        return [];
      }

      const talhaoIds = talhoes.map(t => t.id);

      const { data, error } = await supabase
        .from('mudas')
        .select('id, codigo, linha, planta_na_linha, status, talhao_id, latitude, longitude, created_at')
        .in('talhao_id', talhaoIds)
        .order('linha')
        .order('planta_na_linha');

      if (error) {
        console.error('[useMudas] Erro ao buscar mudas:', error.message, error.code);
        throw error;
      }

      // Enriquecer com dados do talhão
      const mudasComTalhao = (data || []).map(muda => ({
        ...muda,
        talhao: talhoes.find(t => t.id === muda.talhao_id) || null,
      }));

      return mudasComTalhao as (Muda & { talhao: Talhao | null })[];
    },
    enabled: !talhoesLoading && !!talhoes,
  });
}

/**
 * Hook para buscar muda por ID.
 * Carrega também as observações relacionadas.
 */
export function useMudaById(id: string | undefined) {
  const { data: talhoes } = useTalhoes();

  return useQuery({
    queryKey: ['muda', id],
    queryFn: async () => {
      if (!id || !talhoes || talhoes.length === 0) return null;

      const talhaoIds = talhoes.map(t => t.id);

      // Buscar muda
      const { data: muda, error: mudaError } = await supabase
        .from('mudas')
        .select('id, codigo, linha, planta_na_linha, status, talhao_id, latitude, longitude, created_at')
        .eq('id', id)
        .in('talhao_id', talhaoIds)
        .maybeSingle();

      if (mudaError) {
        console.error('[useMudaById] Erro ao buscar muda:', mudaError.message);
        throw mudaError;
      }

      if (!muda) return null;

      // Buscar observações da muda
      const { data: observacoes, error: obsError } = await supabase
        .from('observacoes_mudas')
        .select('id, data, fase_fenologica, altura_cm, observacoes, muda_id, created_at')
        .eq('muda_id', id)
        .order('data', { ascending: false });

      if (obsError) {
        console.error('[useMudaById] Erro ao buscar observações:', obsError.message);
        // Não falhar completamente se as observações falharem
      }

      return {
        ...muda,
        talhao: talhoes.find(t => t.id === muda.talhao_id) || null,
        observacoes: observacoes || [],
      } as Muda & { talhao: Talhao | null; observacoes: Observacao[] };
    },
    enabled: !!id && !!talhoes && talhoes.length > 0,
  });
}

/**
 * Hook para buscar linhas únicas das mudas do usuário.
 */
export function useLinhasUnicas() {
  const { data: mudas, isLoading } = useMudas();

  return useQuery({
    queryKey: ['linhas-unicas', mudas?.length],
    queryFn: async () => {
      if (!mudas) return [];
      const linhas = [...new Set(mudas.map(m => m.linha))].sort((a, b) => a - b);
      return linhas;
    },
    enabled: !isLoading && !!mudas,
  });
}

/**
 * Hook para estatísticas das mudas.
 * Derivado das mudas já carregadas.
 */
export function useMudasStats() {
  const { data: mudas, isLoading, error } = useMudas();

  return useQuery({
    queryKey: ['mudas-stats', mudas?.length],
    queryFn: async () => {
      if (!mudas) {
        return { total: 0, ativas: 0, atencao: 0, falha: 0, substituida: 0 };
      }

      return {
        total: mudas.length,
        ativas: mudas.filter(m => m.status === 'ativa').length,
        atencao: mudas.filter(m => m.status === 'atencao').length,
        falha: mudas.filter(m => m.status === 'falha').length,
        substituida: mudas.filter(m => m.status === 'substituida').length,
      };
    },
    enabled: !isLoading,
  });
}

/**
 * Hook para grid do mapa do vinhedo.
 * Derivado das mudas já carregadas.
 */
export function useMudasGrid() {
  const { data: mudas, isLoading, error } = useMudas();

  return useQuery({
    queryKey: ['mudas-grid', mudas?.length],
    queryFn: async () => {
      if (!mudas || mudas.length === 0) {
        return { grid: {}, maxLinha: 0, maxPlanta: 0, mudas: [] };
      }

      // Organizar por linha
      const grid: Record<number, Muda[]> = {};
      const maxLinha = Math.max(...mudas.map(m => m.linha), 0);
      const maxPlanta = Math.max(...mudas.map(m => m.planta_na_linha), 0);

      for (let i = 1; i <= maxLinha; i++) {
        grid[i] = mudas.filter(m => m.linha === i) as Muda[];
      }

      return { grid, maxLinha, maxPlanta, mudas: mudas as Muda[] };
    },
    enabled: !isLoading,
  });
}

/**
 * Hook para buscar muda por posição (linha e planta).
 */
export function useMudaByPosition(linha: number, planta: number) {
  const { data: mudas, isLoading } = useMudas();

  return useQuery({
    queryKey: ['muda-position', linha, planta],
    queryFn: async () => {
      if (!mudas) return null;
      return mudas.find(m => m.linha === linha && m.planta_na_linha === planta) || null;
    },
    enabled: !isLoading && !!mudas,
  });
}
