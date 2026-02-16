import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTalhoes } from './useMudas';

// =============== TIPOS ===============

export interface ObservacaoReport {
  id: string;
  data: string;
  fase_fenologica: string;
  altura_cm: number | null;
  observacoes: string | null;
  muda_id: string | null;
  muda_codigo: string;
  muda_linha: number;
  muda_planta: number;
  talhao_nome: string;
}

export interface ObservacoesResumo {
  totalObservacoes: number;
  periodoInicio: string | null;
  periodoFim: string | null;
  alturaMedia: number;
  faseMaiorDuracao: string;
  mudasObservadas: number;
  totalMudas: number;
}

export interface AlturaEvolucao {
  data: string;
  alturaMedia: number;
  totalObservacoes: number;
  fase?: string;
}

export interface FaseDistribuicao {
  fase: string;
  count: number; // days accumulated
}

export interface AlertaCritico {
  id: string;
  data: string;
  muda_codigo: string;
  muda_linha: number;
  muda_planta: number;
  observacao: string;
  palavraChave: string;
}

export interface FaseFenologicaReport {
  id: string;
  muda_id: string;
  fase: string;
  data_inicio: string;
  data_fim: string | null;
  altura_media_cm: number | null;
}

export interface ObservacoesReportData {
  observacoes: ObservacaoReport[];
  resumo: ObservacoesResumo;
  alturaEvolucao: AlturaEvolucao[];
  fasesDistribuicao: FaseDistribuicao[];
  alertasCriticos: AlertaCritico[];
  mudasComObservacoes: { codigo: string; id: string; linha: number; planta: number }[];
  fasesAtuais: FaseFenologicaReport[];
  diasPorFase: Record<string, number>;
  isLoading: boolean;
  error: Error | null;
}

const PALAVRAS_CRITICAS = ['doença', 'praga', 'seca', 'morte', 'estresse', 'murcha', 'queimadura', 'necrose', 'amarelecimento', 'deficiência'];

function diffDays(start: string, end: string): number {
  const s = new Date(start + 'T00:00:00');
  const e = new Date(end + 'T00:00:00');
  return Math.max(0, Math.round((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)));
}

function todayStr(): string {
  return new Date().toISOString().split('T')[0];
}

export function useObservacoesReport(): ObservacoesReportData {
  const { data: talhoes, isLoading: talhoesLoading } = useTalhoes();

  // 1. Buscar todas as mudas do usuário
  const { data: mudas, isLoading: mudasLoading } = useQuery({
    queryKey: ['report-mudas', talhoes?.map(t => t.id)],
    queryFn: async () => {
      if (!talhoes || talhoes.length === 0) return [];
      const talhaoIds = talhoes.map(t => t.id);
      const { data, error } = await supabase
        .from('mudas')
        .select('id, codigo, linha, planta_na_linha, talhao_id')
        .in('talhao_id', talhaoIds)
        .range(0, 1999);
      if (error) throw error;
      return data || [];
    },
    enabled: !talhoesLoading && !!talhoes,
  });

  // 2. Buscar todas as observações
  const { data: observacoesRaw, isLoading: obsLoading, error } = useQuery({
    queryKey: ['report-observacoes', mudas?.length],
    queryFn: async () => {
      if (!mudas || mudas.length === 0) return [];
      const mudaIds = mudas.map(m => m.id);
      const allObs: any[] = [];
      for (let i = 0; i < mudaIds.length; i += 500) {
        const batch = mudaIds.slice(i, i + 500);
        const { data, error } = await supabase
          .from('observacoes_mudas')
          .select('id, data, fase_fenologica, altura_cm, observacoes, muda_id')
          .in('muda_id', batch)
          .order('data', { ascending: false });
        if (error) throw error;
        if (data) allObs.push(...data);
      }
      return allObs;
    },
    enabled: !mudasLoading && !!mudas && mudas.length > 0,
  });

  // 3. Buscar fases fenológicas (com altura_media_cm)
  const { data: fasesRaw, isLoading: fasesLoading } = useQuery({
    queryKey: ['report-fases-fenologicas', mudas?.length],
    queryFn: async () => {
      if (!mudas || mudas.length === 0) return [];
      const mudaIds = mudas.map(m => m.id);
      const allFases: any[] = [];
      for (let i = 0; i < mudaIds.length; i += 500) {
        const batch = mudaIds.slice(i, i + 500);
        const { data, error } = await supabase
          .from('fases_fenologicas_mudas')
          .select('id, muda_id, fase, data_inicio, data_fim, altura_media_cm')
          .in('muda_id', batch)
          .order('data_inicio', { ascending: true });
        if (error) throw error;
        if (data) allFases.push(...data);
      }
      return allFases as FaseFenologicaReport[];
    },
    enabled: !mudasLoading && !!mudas && mudas.length > 0,
  });

  // 4. Processar dados
  const isLoading = talhoesLoading || mudasLoading || obsLoading || fasesLoading;

  const processedData = useQuery({
    queryKey: ['report-observacoes-processed', observacoesRaw?.length, mudas?.length, fasesRaw?.length],
    queryFn: async () => {
      if (!observacoesRaw || !mudas || !talhoes) {
        return {
          observacoes: [],
          resumo: {
            totalObservacoes: 0,
            periodoInicio: null,
            periodoFim: null,
            alturaMedia: 0,
            faseMaiorDuracao: '-',
            mudasObservadas: 0,
            totalMudas: mudas?.length || 0,
          },
          alturaEvolucao: [],
          fasesDistribuicao: [],
          alertasCriticos: [],
          mudasComObservacoes: [],
          fasesAtuais: [],
          diasPorFase: {},
        };
      }

      const fases = fasesRaw || [];
      const hoje = todayStr();

      // Enriquecer observações
      const observacoes: ObservacaoReport[] = observacoesRaw.map(obs => {
        const muda = mudas.find(m => m.id === obs.muda_id);
        const talhao = talhoes.find(t => t.id === muda?.talhao_id);
        return {
          id: obs.id,
          data: obs.data,
          fase_fenologica: obs.fase_fenologica,
          altura_cm: obs.altura_cm,
          observacoes: obs.observacoes,
          muda_id: obs.muda_id,
          muda_codigo: muda?.codigo || 'N/A',
          muda_linha: muda?.linha || 0,
          muda_planta: muda?.planta_na_linha || 0,
          talhao_nome: talhao?.nome || talhao?.codigo || 'N/A',
        };
      });

      // ===== DIAS ACUMULADOS POR FASE =====
      const diasPorFase: Record<string, number> = {};
      for (const f of fases) {
        const fim = f.data_fim || hoje;
        const dias = diffDays(f.data_inicio, fim);
        diasPorFase[f.fase] = (diasPorFase[f.fase] || 0) + dias;
      }

      // ===== FASE COM MAIOR DURAÇÃO =====
      const faseMaiorDuracao = Object.entries(diasPorFase)
        .sort((a, b) => b[1] - a[1])[0]?.[0] || '-';

      // ===== ALTURA MÉDIA (da fase atual de cada muda) =====
      const fasesAtuais = fases.filter(f => f.data_fim === null);
      const alturasAtuais = fasesAtuais
        .filter(f => f.altura_media_cm !== null && f.altura_media_cm > 0)
        .map(f => Number(f.altura_media_cm));
      const alturaMedia = alturasAtuais.length > 0
        ? alturasAtuais.reduce((a, b) => a + b, 0) / alturasAtuais.length
        : 0;

      // Datas e cobertura
      const datas = observacoes.map(o => o.data).sort();
      const mudasObservadasSet = new Set(observacoes.map(o => o.muda_id));

      const resumo: ObservacoesResumo = {
        totalObservacoes: observacoes.length,
        periodoInicio: datas[0] || null,
        periodoFim: datas[datas.length - 1] || null,
        alturaMedia,
        faseMaiorDuracao,
        mudasObservadas: mudasObservadasSet.size,
        totalMudas: mudas.length,
      };

      // ===== EVOLUÇÃO DE ALTURA (degraus por fase) =====
      const pontosTemporais: { data: string; altura: number }[] = [];
      for (const muda of mudas) {
        const mudaFases = fases
          .filter(f => f.muda_id === muda.id)
          .sort((a, b) => a.data_inicio.localeCompare(b.data_inicio));

        for (const fase of mudaFases) {
          const altura = fase.altura_media_cm !== null ? Number(fase.altura_media_cm) : 0;
          if (altura <= 0) continue;

          // Point at start of phase
          pontosTemporais.push({ data: fase.data_inicio, altura });
          // Point at end of phase (or today)
          const fim = fase.data_fim || hoje;
          if (fim !== fase.data_inicio) {
            pontosTemporais.push({ data: fim, altura });
          }
        }
      }

      // Agrupar por data e calcular média
      const alturaPorData: Record<string, { soma: number; count: number }> = {};
      pontosTemporais.forEach(p => {
        if (!alturaPorData[p.data]) {
          alturaPorData[p.data] = { soma: 0, count: 0 };
        }
        alturaPorData[p.data].soma += p.altura;
        alturaPorData[p.data].count += 1;
      });

      const alturaEvolucao: AlturaEvolucao[] = Object.entries(alturaPorData)
        .map(([data, val]) => ({
          data,
          alturaMedia: val.soma / val.count,
          totalObservacoes: val.count,
        }))
        .sort((a, b) => a.data.localeCompare(b.data));

      // ===== DISTRIBUIÇÃO DE FASES (dias acumulados) =====
      const fasesDistribuicao: FaseDistribuicao[] = Object.entries(diasPorFase)
        .map(([fase, count]) => ({ fase, count }))
        .sort((a, b) => b.count - a.count);

      // Alertas críticos
      const alertasCriticos: AlertaCritico[] = [];
      observacoes.forEach(o => {
        if (o.observacoes) {
          const texto = o.observacoes.toLowerCase();
          for (const palavra of PALAVRAS_CRITICAS) {
            if (texto.includes(palavra)) {
              alertasCriticos.push({
                id: o.id,
                data: o.data,
                muda_codigo: o.muda_codigo,
                muda_linha: o.muda_linha,
                muda_planta: o.muda_planta,
                observacao: o.observacoes,
                palavraChave: palavra,
              });
              break;
            }
          }
        }
      });

      // Lista de mudas com observações
      const mudasMap = new Map<string, { codigo: string; id: string; linha: number; planta: number }>();
      observacoes.forEach(o => {
        if (o.muda_id && !mudasMap.has(o.muda_id)) {
          mudasMap.set(o.muda_id, {
            codigo: o.muda_codigo,
            id: o.muda_id,
            linha: o.muda_linha,
            planta: o.muda_planta,
          });
        }
      });
      const mudasComObservacoes = Array.from(mudasMap.values())
        .sort((a, b) => a.linha - b.linha || a.planta - b.planta);

      return {
        observacoes,
        resumo,
        alturaEvolucao,
        fasesDistribuicao,
        alertasCriticos,
        mudasComObservacoes,
        fasesAtuais,
        diasPorFase,
      };
    },
    enabled: !isLoading && !!observacoesRaw,
  });

  return {
    observacoes: processedData.data?.observacoes || [],
    resumo: processedData.data?.resumo || {
      totalObservacoes: 0,
      periodoInicio: null,
      periodoFim: null,
      alturaMedia: 0,
      faseMaiorDuracao: '-',
      mudasObservadas: 0,
      totalMudas: 0,
    },
    alturaEvolucao: processedData.data?.alturaEvolucao || [],
    fasesDistribuicao: processedData.data?.fasesDistribuicao || [],
    alertasCriticos: processedData.data?.alertasCriticos || [],
    mudasComObservacoes: processedData.data?.mudasComObservacoes || [],
    fasesAtuais: processedData.data?.fasesAtuais || [],
    diasPorFase: processedData.data?.diasPorFase || {},
    isLoading: isLoading || processedData.isLoading,
    error: (error as Error) || processedData.error || null,
  };
}
