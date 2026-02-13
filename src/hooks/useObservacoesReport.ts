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
  fase?: string;
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

export interface FaseFenologicaReport {
  id: string;
  muda_id: string;
  fase: string;
  data_inicio: string;
  data_fim: string | null;
}

export interface ObservacoesReportData {
  observacoes: ObservacaoReport[];
  resumo: ObservacoesResumo;
  alturaEvolucao: AlturaEvolucao[];
  fasesDistribuicao: FaseDistribuicao[];
  alertasCriticos: AlertaCritico[];
  mudasComObservacoes: { codigo: string; id: string; linha: number; planta: number }[];
  fasesAtuais: FaseFenologicaReport[];
  isLoading: boolean;
  error: Error | null;
}

const PALAVRAS_CRITICAS = ['doença', 'praga', 'seca', 'morte', 'estresse', 'murcha', 'queimadura', 'necrose', 'amarelecimento', 'deficiência'];

// Alturas padrão por fase (cm)
const ALTURA_PADRAO: Record<string, number> = {
  'plantio': 5,
  'brotamento_inicial': 20,
  'brotação': 20,
  'Brotação': 20,
  'crescimento_vegetativo': 100,
  'Crescimento vegetativo': 100,
};

function getAlturaPadrao(fase: string): number {
  // Tentar match exato, depois case-insensitive
  if (ALTURA_PADRAO[fase]) return ALTURA_PADRAO[fase];
  const lower = fase.toLowerCase();
  for (const [key, val] of Object.entries(ALTURA_PADRAO)) {
    if (key.toLowerCase() === lower) return val;
  }
  // Se contém palavras-chave
  if (lower.includes('plantio') || lower.includes('dormência') || lower.includes('dormencia')) return 5;
  if (lower.includes('brot')) return 20;
  if (lower.includes('crescimento') || lower.includes('vegetativ')) return 100;
  if (lower.includes('floração') || lower.includes('floracao')) return 120;
  if (lower.includes('frutificação') || lower.includes('frutificacao')) return 130;
  if (lower.includes('maturação') || lower.includes('maturacao') || lower.includes('véraison') || lower.includes('veraison')) return 140;
  if (lower.includes('colheita')) return 150;
  return 50; // default
}

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

  // 3. Buscar fases fenológicas de todas as mudas
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
          .select('id, muda_id, fase, data_inicio, data_fim')
          .in('muda_id', batch)
          .order('data_inicio', { ascending: true });

        if (error) {
          console.error('[useObservacoesReport] Erro ao buscar fases:', error.message);
          throw error;
        }

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
            fasePredominante: '-',
            mudasObservadas: 0,
            totalMudas: mudas?.length || 0,
          },
          alturaEvolucao: [],
          fasesDistribuicao: [],
          alertasCriticos: [],
          mudasComObservacoes: [],
          fasesAtuais: [],
        };
      }

      const fases = fasesRaw || [];

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

      // ===== ALTURA MÉDIA (regra nova) =====
      // Para cada muda: observação mais recente (data DESC, altura_cm DESC)
      const obsMaisRecentePorMuda = new Map<string, { altura_cm: number; data: string }>();
      // observacoesRaw já está ordenado por data DESC, altura_cm DESC
      for (const obs of observacoesRaw) {
        if (obs.muda_id && obs.altura_cm !== null && obs.altura_cm > 0) {
          if (!obsMaisRecentePorMuda.has(obs.muda_id)) {
            obsMaisRecentePorMuda.set(obs.muda_id, { altura_cm: obs.altura_cm, data: obs.data });
          }
        }
      }
      const alturasRecentes = Array.from(obsMaisRecentePorMuda.values());
      const alturaMedia = alturasRecentes.length > 0
        ? alturasRecentes.reduce((acc, o) => acc + o.altura_cm, 0) / alturasRecentes.length
        : 0;

      // ===== FASE PREDOMINANTE (de fases_fenologicas_mudas, data_fim IS NULL) =====
      const fasesAtuais = fases.filter(f => f.data_fim === null);
      const fasesCountAtual: Record<string, number> = {};
      fasesAtuais.forEach(f => {
        fasesCountAtual[f.fase] = (fasesCountAtual[f.fase] || 0) + 1;
      });
      const fasePredominante = Object.entries(fasesCountAtual)
        .sort((a, b) => b[1] - a[1])[0]?.[0] || '-';

      // Datas e cobertura
      const datas = observacoes.map(o => o.data).sort();
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

      // ===== EVOLUÇÃO DE ALTURA AO LONGO DO TEMPO (refazer) =====
      // Para cada muda: construir curva usando fases + observações
      const pontosTemporais: { data: string; altura: number }[] = [];

      for (const muda of mudas) {
        const mudaFases = fases.filter(f => f.muda_id === muda.id).sort((a, b) => a.data_inicio.localeCompare(b.data_inicio));
        const mudaObs = observacoesRaw.filter((o: any) => o.muda_id === muda.id && o.altura_cm !== null && o.altura_cm > 0);

        // Fases anteriores: usar data_fim com altura padrão
        for (const fase of mudaFases) {
          if (fase.data_fim) {
            pontosTemporais.push({
              data: fase.data_fim,
              altura: getAlturaPadrao(fase.fase),
            });
          } else {
            // Fase atual: usar observação mais recente ou altura padrão
            const obsRecente = mudaObs.length > 0 ? mudaObs[0] : null;
            if (obsRecente) {
              pontosTemporais.push({
                data: obsRecente.data,
                altura: obsRecente.altura_cm,
              });
            } else {
              pontosTemporais.push({
                data: fase.data_inicio,
                altura: getAlturaPadrao(fase.fase),
              });
            }
          }
        }

        // Se não tem fases mas tem observações
        if (mudaFases.length === 0 && mudaObs.length > 0) {
          for (const obs of mudaObs) {
            pontosTemporais.push({ data: obs.data, altura: obs.altura_cm });
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

      // ===== DISTRIBUIÇÃO DE FASES (de fases_fenologicas_mudas, data_fim IS NULL) =====
      const fasesDistribuicao: FaseDistribuicao[] = Object.entries(fasesCountAtual)
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
    fasesAtuais: processedData.data?.fasesAtuais || [],
    isLoading: isLoading || processedData.isLoading,
    error: (error as Error) || processedData.error || null,
  };
}
