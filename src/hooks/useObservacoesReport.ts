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
  fasePredominante: string;
  mudasObservadas: number;
  totalMudas: number;
}

export interface AlturaEvolucao {
  data: string;
  alturaMedia: number;
  totalObservacoes: number;
}

export interface FaseDistribuicao {
  fase: string;
  count: number;
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

export interface ObservacoesReportData {
  observacoes: ObservacaoReport[];
  resumo: ObservacoesResumo;
  alturaEvolucao: AlturaEvolucao[];
  fasesDistribuicao: FaseDistribuicao[];
  alertasCriticos: AlertaCritico[];
  mudasComObservacoes: { codigo: string; id: string; linha: number; planta: number }[];
  isLoading: boolean;
  error: Error | null;
}

const PALAVRAS_CRITICAS = ['doença', 'praga', 'seca', 'morte', 'estresse', 'murcha', 'queimadura', 'necrose', 'amarelecimento', 'deficiência'];

/**
 * Hook para buscar todas as observações de mudas para relatório.
 * Respeita RLS via cadeia talhao_id -> talhoes.user_id = auth.uid()
 */
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

      if (error) {
        console.error('[useObservacoesReport] Erro ao buscar mudas:', error.message);
        throw error;
      }

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

      // Buscar em lotes de 500 para respeitar limites
      const allObs: any[] = [];
      for (let i = 0; i < mudaIds.length; i += 500) {
        const batch = mudaIds.slice(i, i + 500);
        const { data, error } = await supabase
          .from('observacoes_mudas')
          .select('id, data, fase_fenologica, altura_cm, observacoes, muda_id')
          .in('muda_id', batch)
          .order('data', { ascending: false })
          .order('altura_cm', { ascending: false });

        if (error) {
          console.error('[useObservacoesReport] Erro ao buscar observações:', error.message);
          throw error;
        }

        if (data) allObs.push(...data);
      }

      return allObs;
    },
    enabled: !mudasLoading && !!mudas && mudas.length > 0,
  });

  // 3. Processar dados
  const isLoading = talhoesLoading || mudasLoading || obsLoading;

  const processedData = useQuery({
    queryKey: ['report-observacoes-processed', observacoesRaw?.length, mudas?.length],
    queryFn: async () => {
      if (!observacoesRaw || !mudas || !talhoes) {
        return {
          observacoes: [],
          resumo: {
            totalObservacoes: 0,
            periodoInicio: null,
            periodoFim: null,
            alturaMedia: 0,
            fasePredominante: '-',
            mudasObservadas: 0,
            totalMudas: mudas?.length || 0,
          },
          alturaEvolucao: [],
          fasesDistribuicao: [],
          alertasCriticos: [],
          mudasComObservacoes: [],
        };
      }

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

      // Resumo
      const datas = observacoes.map(o => o.data).sort();
      const alturasValidas = observacoes.filter(o => o.altura_cm !== null && o.altura_cm > 0);
      const alturaMedia = alturasValidas.length > 0
        ? alturasValidas.reduce((acc, o) => acc + (o.altura_cm || 0), 0) / alturasValidas.length
        : 0;

      // Fase predominante
      const fasesCount: Record<string, number> = {};
      observacoes.forEach(o => {
        fasesCount[o.fase_fenologica] = (fasesCount[o.fase_fenologica] || 0) + 1;
      });
      const fasePredominante = Object.entries(fasesCount)
        .sort((a, b) => b[1] - a[1])[0]?.[0] || '-';

      const mudasObservadasSet = new Set(observacoes.map(o => o.muda_id));

      const resumo: ObservacoesResumo = {
        totalObservacoes: observacoes.length,
        periodoInicio: datas[0] || null,
        periodoFim: datas[datas.length - 1] || null,
        alturaMedia,
        fasePredominante,
        mudasObservadas: mudasObservadasSet.size,
        totalMudas: mudas.length,
      };

      // Evolução de altura ao longo do tempo (agrupado por data)
      const alturaPorData: Record<string, { soma: number; count: number }> = {};
      observacoes.forEach(o => {
        if (o.altura_cm !== null && o.altura_cm > 0) {
          if (!alturaPorData[o.data]) {
            alturaPorData[o.data] = { soma: 0, count: 0 };
          }
          alturaPorData[o.data].soma += o.altura_cm;
          alturaPorData[o.data].count += 1;
        }
      });

      const alturaEvolucao: AlturaEvolucao[] = Object.entries(alturaPorData)
        .map(([data, val]) => ({
          data,
          alturaMedia: val.soma / val.count,
          totalObservacoes: val.count,
        }))
        .sort((a, b) => a.data.localeCompare(b.data));

      // Distribuição de fases fenológicas
      const fasesDistribuicao: FaseDistribuicao[] = Object.entries(fasesCount)
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
              break; // Uma palavra por observação é suficiente
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
      fasePredominante: '-',
      mudasObservadas: 0,
      totalMudas: 0,
    },
    alturaEvolucao: processedData.data?.alturaEvolucao || [],
    fasesDistribuicao: processedData.data?.fasesDistribuicao || [],
    alertasCriticos: processedData.data?.alertasCriticos || [],
    mudasComObservacoes: processedData.data?.mudasComObservacoes || [],
    isLoading: isLoading || processedData.isLoading,
    error: (error as Error) || processedData.error || null,
  };
}
