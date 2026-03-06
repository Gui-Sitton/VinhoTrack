// ============================================================
// Supabase Edge Function: fetch-clima (versão atualizada)
// Aceita start_date e end_date como query params
// Exemplo: /functions/v1/fetch-clima?start_date=2025-10-10&end_date=2026-03-06
// ============================================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

interface Talhao {
  id: string;
  nome: string;
  latitude: number;
  longitude: number;
}

interface OpenMeteoResponse {
  daily: {
    time: string[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    temperature_2m_mean: number[];
    precipitation_sum: number[];
    relative_humidity_2m_max: number[];
    relative_humidity_2m_min: number[];
    et0_fao_evapotranspiration: number[];
    wind_speed_10m_max: number[];
    shortwave_radiation_sum: number[];
    vapour_pressure_deficit_max: number[];
  };
}

Deno.serve(async (req) => {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  // Ler start_date e end_date da URL — senão usa os últimos 7 dias
  const url = new URL(req.url);
  const hoje = new Date();

  const dataFim = url.searchParams.get('end_date') ?? hoje.toISOString().slice(0, 10);
  const dataInicio = url.searchParams.get('start_date') ?? (() => {
    const d = new Date(hoje);
    d.setDate(hoje.getDate() - 7);
    return d.toISOString().slice(0, 10);
  })();

  // 1. Buscar todos os talhões com coordenadas cadastradas
  const { data: talhoes, error: talhaoError } = await supabase
    .from('talhoes')
    .select('id, nome, latitude, longitude')
    .not('latitude', 'is', null)
    .not('longitude', 'is', null);

  if (talhaoError || !talhoes?.length) {
    return new Response(
      JSON.stringify({ error: 'Nenhum talhão com coordenadas encontrado', detail: talhaoError }),
      { status: 400 }
    );
  }

  const resultados: Record<string, unknown>[] = [];

  for (const talhao of talhoes as Talhao[]) {
    try {
      // 2. Buscar dados da Open-Meteo para o período informado
      const meteoUrl = new URL('https://archive-api.open-meteo.com/v1/archive');
      meteoUrl.searchParams.set('latitude', String(talhao.latitude));
      meteoUrl.searchParams.set('longitude', String(talhao.longitude));
      meteoUrl.searchParams.set('daily', [
        'temperature_2m_max',
        'temperature_2m_min',
        'temperature_2m_mean',
        'precipitation_sum',
        'relative_humidity_2m_max',
        'relative_humidity_2m_min',
        'et0_fao_evapotranspiration',
        'wind_speed_10m_max',
        'shortwave_radiation_sum',
        'vapour_pressure_deficit_max',
      ].join(','));
      meteoUrl.searchParams.set('timezone', 'America/Sao_Paulo');
      meteoUrl.searchParams.set('start_date', dataInicio);
      meteoUrl.searchParams.set('end_date', dataFim);

      const resp = await fetch(meteoUrl.toString());
      if (!resp.ok) throw new Error(`Open-Meteo retornou ${resp.status}: ${await resp.text()}`);

      const meteo: OpenMeteoResponse = await resp.json();
      const { daily } = meteo;

      // 3. Montar registros para inserção
      const registros = daily.time.map((data, i) => {
        const tempMax = daily.temperature_2m_max[i];
        const tempMin = daily.temperature_2m_min[i];
        const grausDia = tempMax != null && tempMin != null
          ? Math.max(0, ((tempMax + tempMin) / 2) - 10)
          : null;

        return {
          talhao_id: talhao.id,
          data,
          temp_max: tempMax,
          temp_min: tempMin,
          temp_media: daily.temperature_2m_mean[i],
          precipitacao_mm: daily.precipitation_sum[i],
          umidade_relativa_max: daily.relative_humidity_2m_max[i],
          umidade_relativa_min: daily.relative_humidity_2m_min[i],
          evapotranspiracao_mm: daily.et0_fao_evapotranspiration[i],
          vento_max_kmh: daily.wind_speed_10m_max[i],
          radiacao_solar_mj: daily.shortwave_radiation_sum[i],
          deficit_pressao_vapor: daily.vapour_pressure_deficit_max[i],
          graus_dia: grausDia,
          fonte: 'open-meteo',
        };
      });

      // 4. Upsert em lotes de 100 para não estourar limites
      const LOTE = 100;
      for (let i = 0; i < registros.length; i += LOTE) {
        const lote = registros.slice(i, i + LOTE);
        const { error: insertError } = await supabase
          .from('clima_diario')
          .upsert(lote, { onConflict: 'talhao_id,data', ignoreDuplicates: false });
        if (insertError) throw insertError;
      }

      resultados.push({ talhao: talhao.nome, registros: registros.length, periodo: `${dataInicio} → ${dataFim}`, ok: true });
    } catch (err) {
      resultados.push({ talhao: (talhao as Talhao).nome, ok: false, erro: String(err) });
    }
  }

  return new Response(JSON.stringify({ resultados }), {
    headers: { 'Content-Type': 'application/json' },
  });
});