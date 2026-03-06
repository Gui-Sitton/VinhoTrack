// hooks/useClima.ts
// Coloque em: src/hooks/useClima.ts

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client'; // ajuste o caminho conforme seu projeto

export interface ClimaDiario {
  id: string;
  talhao_id: string;
  data: string;
  temp_max: number | null;
  temp_min: number | null;
  temp_media: number | null;
  precipitacao_mm: number | null;
  umidade_relativa_max: number | null;
  umidade_relativa_min: number | null;
  evapotranspiracao_mm: number | null;
  vento_max_kmh: number | null;
  radiacao_solar_mj: number | null;
  graus_dia: number | null;
  deficit_pressao_vapor: number | null;
  fonte: string;
}

export interface ClimaResumo {
  registros: ClimaDiario[];
  precipitacaoTotal: number;
  grausDiaAcumulado: number;
  diasComChuva: number;
  diasAltaUmidade: number; // umidade > 85% — risco fúngico
  tempMediaPeriodo: number;
  evapotranspiracaoTotal: number;
  periodoInicio: string | null;
  periodoFim: string | null;
}

async function fetchClima(
  talhaoId: string | null,
  dataInicio: string,
  dataFim: string
): Promise<ClimaResumo> {
  let query = supabase
    .from('clima_diario')
    .select('*')
    .gte('data', dataInicio)
    .lte('data', dataFim)
    .order('data', { ascending: true });

  if (talhaoId) {
    query = query.eq('talhao_id', talhaoId);
  }

  const { data, error } = await query;
  if (error) throw error;

  const registros: ClimaDiario[] = data ?? [];

  const precipitacaoTotal = registros.reduce((acc, r) => acc + (r.precipitacao_mm ?? 0), 0);
  const grausDiaAcumulado = registros.reduce((acc, r) => acc + (r.graus_dia ?? 0), 0);
  const diasComChuva = registros.filter(r => (r.precipitacao_mm ?? 0) > 0.5).length;
  const diasAltaUmidade = registros.filter(r => (r.umidade_relativa_max ?? 0) > 85).length;
  const evapotranspiracaoTotal = registros.reduce((acc, r) => acc + (r.evapotranspiracao_mm ?? 0), 0);

  const mediasTemp = registros.filter(r => r.temp_media != null).map(r => r.temp_media!);
  const tempMediaPeriodo = mediasTemp.length > 0
    ? mediasTemp.reduce((a, b) => a + b, 0) / mediasTemp.length
    : 0;

  return {
    registros,
    precipitacaoTotal: Math.round(precipitacaoTotal * 10) / 10,
    grausDiaAcumulado: Math.round(grausDiaAcumulado),
    diasComChuva,
    diasAltaUmidade,
    tempMediaPeriodo: Math.round(tempMediaPeriodo * 10) / 10,
    evapotranspiracaoTotal: Math.round(evapotranspiracaoTotal * 10) / 10,
    periodoInicio: registros[0]?.data ?? null,
    periodoFim: registros[registros.length - 1]?.data ?? null,
  };
}

export function useClima(
  talhaoId: string | null,
  dataInicio: string,
  dataFim: string
) {
  return useQuery({
    queryKey: ['clima', talhaoId, dataInicio, dataFim],
    queryFn: () => fetchClima(talhaoId, dataInicio, dataFim),
    enabled: !!dataInicio && !!dataFim,
    staleTime: 1000 * 60 * 30, // 30 min — dados climáticos não mudam com frequência
  });
}

// Hook simplificado para os últimos N dias (útil para dashboard)
export function useClimaUltimosDias(talhaoId: string | null, dias = 30) {
  const hoje = new Date();
  const inicio = new Date(hoje);
  inicio.setDate(hoje.getDate() - dias);

  const dataInicio = inicio.toISOString().slice(0, 10);
  const dataFim = hoje.toISOString().slice(0, 10);

  return useClima(talhaoId, dataInicio, dataFim);
}