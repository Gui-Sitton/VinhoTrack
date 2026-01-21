import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';

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

// Hook para buscar todas as mudas
export function useMudas() {
  return useQuery({
    queryKey: ['mudas'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('mudas')
        .select(`
          *,
          talhao:talhoes(*)
        `)
        .order('linha')
        .order('planta_na_linha');

      if (error) throw error;
      return data as (Muda & { talhao: Talhao | null })[];
    },
  });
}

// Hook para buscar muda por ID
export function useMudaById(id: string | undefined) {
  return useQuery({
    queryKey: ['muda', id],
    queryFn: async () => {
      if (!id) return null;
      
      const { data: muda, error: mudaError } = await supabase
        .from('mudas')
        .select(`
          *,
          talhao:talhoes(*)
        `)
        .eq('id', id)
        .maybeSingle();

      if (mudaError) throw mudaError;
      if (!muda) return null;

      const { data: observacoes, error: obsError } = await supabase
        .from('observacoes_mudas')
        .select('*')
        .eq('muda_id', id)
        .order('data', { ascending: false });

      if (obsError) throw obsError;

      return {
        ...muda,
        observacoes: observacoes || [],
      } as Muda & { talhao: Talhao | null; observacoes: Observacao[] };
    },
    enabled: !!id,
  });
}

// Hook para buscar talhões
export function useTalhoes() {
  return useQuery({
    queryKey: ['talhoes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('talhoes')
        .select('*')
        .order('codigo');

      if (error) throw error;
      return data as Talhao[];
    },
  });
}

// Hook para buscar linhas únicas
export function useLinhasUnicas() {
  return useQuery({
    queryKey: ['linhas-unicas'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('mudas')
        .select('linha')
        .order('linha');

      if (error) throw error;
      
      const linhas = [...new Set(data.map(m => m.linha))];
      return linhas;
    },
  });
}

// Hook para buscar estatísticas das mudas
export function useMudasStats() {
  return useQuery({
    queryKey: ['mudas-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('mudas')
        .select('status');

      if (error) throw error;

      const stats = {
        total: data.length,
        ativas: data.filter(m => m.status === 'ativa').length,
        atencao: data.filter(m => m.status === 'atencao').length,
        falha: data.filter(m => m.status === 'falha').length,
        substituida: data.filter(m => m.status === 'substituida').length,
      };

      return stats;
    },
  });
}

// Hook para buscar muda por posição (linha e planta)
export function useMudaByPosition(linha: number, planta: number) {
  return useQuery({
    queryKey: ['muda-position', linha, planta],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('mudas')
        .select('*')
        .eq('linha', linha)
        .eq('planta_na_linha', planta)
        .maybeSingle();

      if (error) throw error;
      return data as Muda | null;
    },
  });
}

// Hook para buscar grid do mapa
export function useMudasGrid() {
  return useQuery({
    queryKey: ['mudas-grid'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('mudas')
        .select('id, codigo, linha, planta_na_linha, status')
        .order('linha')
        .order('planta_na_linha');

      if (error) throw error;
      
      // Organizar por linha
      const grid: Record<number, Muda[]> = {};
      const maxLinha = Math.max(...data.map(m => m.linha), 0);
      const maxPlanta = Math.max(...data.map(m => m.planta_na_linha), 0);
      
      for (let i = 1; i <= maxLinha; i++) {
        grid[i] = data.filter(m => m.linha === i) as Muda[];
      }
      
      return { grid, maxLinha, maxPlanta, mudas: data as Muda[] };
    },
  });
}
