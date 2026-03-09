import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTalhoes } from '@/hooks/useMudas';
import {
  Thermometer, Droplets, Wind, Sun, Leaf, CloudRain,
  Zap, AlertTriangle, Loader2, Cloud, Activity
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  ReferenceLine, ComposedChart,
} from 'recharts';
import { format, subDays, subMonths, startOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

// ── Períodos disponíveis ─────────────────────────────────────
const PERIODOS = [
  { label: 'Hoje',        dias: 1   },
  { label: 'Ontem',       dias: 2   },
  { label: '7 dias',      dias: 7   },
  { label: '30 dias',     dias: 30  },
  { label: '6 meses',     dias: 180 },
] as const;

type Periodo = typeof PERIODOS[number];

const tooltipStyle = {
  backgroundColor: 'hsl(var(--card))',
  border: '1px solid hsl(var(--border))',
  borderRadius: '8px',
  fontSize: '12px',
};

// ── Hook de dados climáticos ─────────────────────────────────
function useClimaRange(talhaoId: string | undefined, dias: number) {
  const hoje = new Date();
  const inicio = dias === 1
    ? format(hoje, 'yyyy-MM-dd')
    : dias === 2
      ? format(subDays(hoje, 1), 'yyyy-MM-dd')
      : format(subDays(hoje, dias - 1), 'yyyy-MM-dd');
  const fim = format(hoje, 'yyyy-MM-dd');

  return useQuery({
    queryKey: ['clima-range', talhaoId, dias],
    queryFn: async () => {
      let q = (supabase as any)
        .from('clima_diario')
        .select('*')
        .gte('data', inicio)
        .lte('data', fim)
        .order('data', { ascending: true });
      if (talhaoId) q = q.eq('talhao_id', talhaoId);
      const { data, error } = await q;
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!talhaoId,
    staleTime: 1000 * 60 * 30,
  });
}

// ── Formatar label do eixo X conforme período ────────────────
function formatarEixoX(dataStr: string, dias: number) {
  const d = new Date(dataStr + 'T12:00:00');
  if (dias <= 2)  return format(d, 'HH:mm');
  if (dias <= 7)  return format(d, 'dd/MM', { locale: ptBR });
  if (dias <= 30) return format(d, 'dd/MM', { locale: ptBR });
  return format(d, 'MMM', { locale: ptBR });
}

// ── Card de métrica simples ──────────────────────────────────
function MetricCard({
  label, value, unit, icon: Icon, color, bg, sub
}: {
  label: string; value: string | number | null; unit?: string;
  icon: any; color: string; bg: string; sub?: string;
}) {
  return (
    <Card>
      <CardContent className="pt-5 pb-4">
        <div className="flex items-start gap-3">
          <div className={`w-9 h-9 rounded-lg ${bg} flex items-center justify-center flex-shrink-0`}>
            <Icon className={`w-4 h-4 ${color}`} />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">{label}</p>
            {value != null
              ? <p className="text-lg font-bold leading-tight">{value}{unit && <span className="text-sm font-normal text-muted-foreground ml-1">{unit}</span>}</p>
              : <p className="text-sm text-muted-foreground">—</p>}
            {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Componente principal ─────────────────────────────────────
export default function ClimaPage() {
  const [periodoSelecionado, setPeriodoSelecionado] = useState<Periodo>(PERIODOS[2]);
  const { data: talhoes } = useTalhoes();
  const talhaoId = talhoes?.[0]?.id;

  const { data: registros = [], isLoading } = useClimaRange(talhaoId, periodoSelecionado.dias);

  // ── Agregar dados para gráficos ──────────────────────────
  const dadosGraficos = registros.map((r: any) => ({
    data: r.data,
    dataLabel: formatarEixoX(r.data, periodoSelecionado.dias),
    tempMax: r.temp_max,
    tempMin: r.temp_min,
    tempMedia: r.temp_media,
    chuva: r.precipitacao_mm,
    umidadeMax: r.umidade_relativa_max,
    umidadeMin: r.umidade_relativa_min,
    et0: r.evapotranspiracao_mm,
    gdd: r.graus_dia,
    vento: r.vento_max_kmh,
    radiacao: r.radiacao_solar_mj,
    vpd: r.deficit_pressao_vapor,
  }));

  // GDD acumulado progressivo
  let gddAcc = 0;
  const dadosGDD = dadosGraficos.map(d => {
    gddAcc += d.gdd ?? 0;
    return { ...d, gddAcumulado: Math.round(gddAcc) };
  });

  // ── Estatísticas do período ──────────────────────────────
  const stats = {
    tempMaxima: registros.length ? Math.max(...registros.map((r: any) => r.temp_max ?? -99)) : null,
    tempMinima: registros.length ? Math.min(...registros.map((r: any) => r.temp_min ?? 99)) : null,
    tempMedia: registros.length
      ? Math.round(registros.reduce((acc: number, r: any) => acc + (r.temp_media ?? 0), 0) / registros.length * 10) / 10
      : null,
    chuvaTotal: Math.round(registros.reduce((acc: number, r: any) => acc + (r.precipitacao_mm ?? 0), 0) * 10) / 10,
    diasComChuva: registros.filter((r: any) => (r.precipitacao_mm ?? 0) > 0.5).length,
    et0Total: Math.round(registros.reduce((acc: number, r: any) => acc + (r.evapotranspiracao_mm ?? 0), 0) * 10) / 10,
    gddTotal: Math.round(registros.reduce((acc: number, r: any) => acc + (r.graus_dia ?? 0), 0)),
    diasRiscoFungico: registros.filter((r: any) => (r.umidade_relativa_max ?? 0) > 85 && (r.precipitacao_mm ?? 0) > 0.5).length,
    umidadeMediaMax: registros.length
      ? Math.round(registros.reduce((acc: number, r: any) => acc + (r.umidade_relativa_max ?? 0), 0) / registros.length)
      : null,
    ventoMax: registros.length ? Math.max(...registros.map((r: any) => r.vento_max_kmh ?? 0)) : null,
    radiacaoMedia: registros.length
      ? Math.round(registros.reduce((acc: number, r: any) => acc + (r.radiacao_solar_mj ?? 0), 0) / registros.length * 10) / 10
      : null,
    vpdMax: registros.length ? Math.max(...registros.map((r: any) => r.deficit_pressao_vapor ?? 0)) : null,
  };

  const mostrarDiaUnico = periodoSelecionado.dias <= 2;
  const dadoDiaUnico = registros[registros.length - 1];

  return (
    <MainLayout>
      <div className="p-6 space-y-6">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold text-foreground">Clima</h1>
            <p className="text-muted-foreground mt-1">
              Dados climáticos coletados automaticamente via Open-Meteo
              {talhoes?.[0] && ` — ${talhoes[0].nome || talhoes[0].codigo}`}
            </p>
          </div>

          {/* Seletor de período */}
          <div className="flex gap-1 bg-muted p-1 rounded-lg">
            {PERIODOS.map((p) => (
              <button
                key={p.label}
                onClick={() => setPeriodoSelecionado(p)}
                className={cn(
                  'px-3 py-1.5 rounded-md text-sm font-medium transition-all',
                  periodoSelecionado.label === p.label
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <Card>
            <CardContent className="py-16 flex flex-col items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-primary mb-3" />
              <p className="text-muted-foreground text-sm">Carregando dados climáticos...</p>
            </CardContent>
          </Card>
        ) : registros.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-16 flex flex-col items-center justify-center text-center">
              <Cloud className="w-10 h-10 text-muted-foreground mb-3" />
              <p className="font-medium mb-1">Sem dados para este período</p>
              <p className="text-sm text-muted-foreground max-w-sm">
                Os dados são coletados automaticamente às 03h. Verifique se a Edge Function está configurada.
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* ── Cards de métricas ── */}
            <section>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                Resumo — {periodoSelecionado.label}
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                <MetricCard
                  label="Temp. Máxima"
                  value={mostrarDiaUnico ? dadoDiaUnico?.temp_max?.toFixed(1) : stats.tempMaxima?.toFixed(1)}
                  unit="°C"
                  icon={Thermometer}
                  color="text-orange-500"
                  bg="bg-orange-500/10"
                  sub={!mostrarDiaUnico ? 'máx do período' : undefined}
                />
                <MetricCard
                  label="Temp. Mínima"
                  value={mostrarDiaUnico ? dadoDiaUnico?.temp_min?.toFixed(1) : stats.tempMinima?.toFixed(1)}
                  unit="°C"
                  icon={Thermometer}
                  color="text-blue-500"
                  bg="bg-blue-500/10"
                  sub={!mostrarDiaUnico ? 'mín do período' : undefined}
                />
                <MetricCard
                  label="Temp. Média"
                  value={mostrarDiaUnico ? dadoDiaUnico?.temp_media?.toFixed(1) : stats.tempMedia}
                  unit="°C"
                  icon={Activity}
                  color="text-amber-500"
                  bg="bg-amber-500/10"
                />
                <MetricCard
                  label="Precipitação"
                  value={mostrarDiaUnico ? dadoDiaUnico?.precipitacao_mm?.toFixed(1) : stats.chuvaTotal}
                  unit="mm"
                  icon={CloudRain}
                  color="text-blue-600"
                  bg="bg-blue-600/10"
                  sub={!mostrarDiaUnico ? `${stats.diasComChuva} dias com chuva` : undefined}
                />
                <MetricCard
                  label="ET₀"
                  value={mostrarDiaUnico ? dadoDiaUnico?.evapotranspiracao_mm?.toFixed(1) : stats.et0Total}
                  unit="mm"
                  icon={Zap}
                  color="text-yellow-600"
                  bg="bg-yellow-500/10"
                  sub={!mostrarDiaUnico ? 'evapotranspiração total' : undefined}
                />
                <MetricCard
                  label="GDD"
                  value={mostrarDiaUnico ? dadoDiaUnico?.graus_dia?.toFixed(1) : stats.gddTotal}
                  unit="°"
                  icon={Leaf}
                  color="text-green-600"
                  bg="bg-green-500/10"
                  sub={!mostrarDiaUnico ? 'graus-dia acumulados' : undefined}
                />
                <MetricCard
                  label="Umidade Máx."
                  value={mostrarDiaUnico ? dadoDiaUnico?.umidade_relativa_max?.toFixed(0) : stats.umidadeMediaMax}
                  unit="%"
                  icon={Droplets}
                  color="text-sky-500"
                  bg="bg-sky-500/10"
                  sub={!mostrarDiaUnico ? 'média máxima do período' : undefined}
                />
                <MetricCard
                  label="Vento Máx."
                  value={mostrarDiaUnico ? dadoDiaUnico?.vento_max_kmh?.toFixed(0) : stats.ventoMax?.toFixed(0)}
                  unit="km/h"
                  icon={Wind}
                  color="text-slate-500"
                  bg="bg-slate-500/10"
                  sub={!mostrarDiaUnico ? 'máx do período' : undefined}
                />
                <MetricCard
                  label="Radiação Solar"
                  value={mostrarDiaUnico ? dadoDiaUnico?.radiacao_solar_mj?.toFixed(1) : stats.radiacaoMedia}
                  unit="MJ/m²"
                  icon={Sun}
                  color="text-yellow-500"
                  bg="bg-yellow-400/10"
                  sub={!mostrarDiaUnico ? 'média diária' : undefined}
                />
                <MetricCard
                  label="VPD Máx."
                  value={mostrarDiaUnico ? dadoDiaUnico?.deficit_pressao_vapor?.toFixed(2) : stats.vpdMax?.toFixed(2)}
                  unit="kPa"
                  icon={Cloud}
                  color="text-purple-500"
                  bg="bg-purple-500/10"
                  sub="déficit pressão vapor"
                />
                {!mostrarDiaUnico && (
                  <MetricCard
                    label="Risco Fúngico"
                    value={stats.diasRiscoFungico}
                    unit="dias"
                    icon={AlertTriangle}
                    color={stats.diasRiscoFungico > 3 ? 'text-red-600' : 'text-yellow-600'}
                    bg={stats.diasRiscoFungico > 3 ? 'bg-red-500/10' : 'bg-yellow-500/10'}
                    sub="umidade >85% + chuva"
                  />
                )}
              </div>
            </section>

            {/* ── Gráficos (apenas para períodos > 1 dia) ── */}
            {!mostrarDiaUnico && (
              <>
                {/* Temperatura */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Thermometer className="w-4 h-4 text-orange-500" />
                      Temperatura (°C)
                    </CardTitle>
                    <CardDescription>Máxima, média e mínima diária</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={260}>
                      <AreaChart data={dadosGraficos}>
                        <defs>
                          <linearGradient id="gradMax" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#f97316" stopOpacity={0.15} />
                            <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                          </linearGradient>
                          <linearGradient id="gradMin" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="dataLabel" className="text-xs" tick={{ fontSize: 11 }} />
                        <YAxis className="text-xs" tick={{ fontSize: 11 }} unit="°" />
                        <Tooltip contentStyle={tooltipStyle} formatter={(v: number, n: string) => [`${v?.toFixed(1)}°C`, n]} />
                        <Legend />
                        <Area type="monotone" dataKey="tempMax" name="Máx" stroke="#f97316" fill="url(#gradMax)" strokeWidth={2} dot={false} />
                        <Area type="monotone" dataKey="tempMin" name="Mín" stroke="#3b82f6" fill="url(#gradMin)" strokeWidth={2} dot={false} />
                        <Line type="monotone" dataKey="tempMedia" name="Média" stroke="#8b5cf6" strokeWidth={2} dot={false} strokeDasharray="4 2" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Precipitação + ET₀ */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base flex items-center gap-2">
                        <CloudRain className="w-4 h-4 text-blue-500" />
                        Precipitação Diária (mm)
                      </CardTitle>
                      <CardDescription>{stats.diasComChuva} dias com chuva · total {stats.chuvaTotal} mm</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={220}>
                        <BarChart data={dadosGraficos}>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                          <XAxis dataKey="dataLabel" tick={{ fontSize: 11 }} />
                          <YAxis tick={{ fontSize: 11 }} unit="mm" />
                          <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`${v?.toFixed(1)} mm`, 'Chuva']} />
                          <Bar dataKey="chuva" name="Precipitação" fill="#0ea5e9" radius={[3, 3, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Zap className="w-4 h-4 text-yellow-500" />
                        ET₀ vs Precipitação (mm)
                      </CardTitle>
                      <CardDescription>Quando ET₀ {'>'} Chuva, as mudas dependem de irrigação</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={220}>
                        <BarChart data={dadosGraficos}>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                          <XAxis dataKey="dataLabel" tick={{ fontSize: 11 }} />
                          <YAxis tick={{ fontSize: 11 }} unit="mm" />
                          <Tooltip contentStyle={tooltipStyle} />
                          <Legend />
                          <Bar dataKey="et0" name="ET₀" fill="#f59e0b" radius={[3, 3, 0, 0]} />
                          <Bar dataKey="chuva" name="Chuva" fill="#0ea5e9" radius={[3, 3, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </div>

                {/* Umidade + Risco fúngico */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Droplets className="w-4 h-4 text-sky-500" />
                      Umidade Relativa (%)
                    </CardTitle>
                    <CardDescription>
                      Linha vermelha em 85% — acima desse valor há risco elevado de doenças fúngicas
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={220}>
                      <AreaChart data={dadosGraficos}>
                        <defs>
                          <linearGradient id="gradUmid" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.2} />
                            <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="dataLabel" tick={{ fontSize: 11 }} />
                        <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} unit="%" />
                        <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`${v?.toFixed(0)}%`]} />
                        <ReferenceLine y={85} stroke="#ef4444" strokeDasharray="4 2" label={{ value: 'Risco 85%', fill: '#ef4444', fontSize: 11 }} />
                        <Legend />
                        <Area type="monotone" dataKey="umidadeMax" name="Umidade Máx" stroke="#0ea5e9" fill="url(#gradUmid)" strokeWidth={2} dot={false} />
                        <Line type="monotone" dataKey="umidadeMin" name="Umidade Mín" stroke="#7dd3fc" strokeWidth={1.5} dot={false} strokeDasharray="3 2" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* GDD acumulado */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Leaf className="w-4 h-4 text-green-500" />
                      Graus-Dia Acumulados no Período (GDD base 10°C)
                    </CardTitle>
                    <CardDescription>
                      Total acumulado no período: {stats.gddTotal} GDD
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={220}>
                      <ComposedChart data={dadosGDD}>
                        <defs>
                          <linearGradient id="gradGDD" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="dataLabel" tick={{ fontSize: 11 }} />
                        <YAxis yAxisId="left" tick={{ fontSize: 11 }} />
                        <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} />
                        <Tooltip contentStyle={tooltipStyle} />
                        <Legend />
                        <Bar yAxisId="right" dataKey="gdd" name="GDD diário" fill="#86efac" radius={[3, 3, 0, 0]} />
                        <Area yAxisId="left" type="monotone" dataKey="gddAcumulado" name="GDD acumulado" stroke="#10b981" fill="url(#gradGDD)" strokeWidth={2} dot={false} />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Vento + Radiação + VPD */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Wind className="w-4 h-4 text-slate-500" />
                        Vento Máximo (km/h)
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={180}>
                        <BarChart data={dadosGraficos}>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                          <XAxis dataKey="dataLabel" tick={{ fontSize: 10 }} />
                          <YAxis tick={{ fontSize: 10 }} unit=" km/h" />
                          <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`${v?.toFixed(0)} km/h`, 'Vento']} />
                          <Bar dataKey="vento" fill="#94a3b8" radius={[3, 3, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Sun className="w-4 h-4 text-yellow-500" />
                        Radiação Solar (MJ/m²)
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={180}>
                        <AreaChart data={dadosGraficos}>
                          <defs>
                            <linearGradient id="gradRad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#fbbf24" stopOpacity={0.3} />
                              <stop offset="95%" stopColor="#fbbf24" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                          <XAxis dataKey="dataLabel" tick={{ fontSize: 10 }} />
                          <YAxis tick={{ fontSize: 10 }} />
                          <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`${v?.toFixed(1)} MJ/m²`, 'Radiação']} />
                          <Area type="monotone" dataKey="radiacao" stroke="#fbbf24" fill="url(#gradRad)" strokeWidth={2} dot={false} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Cloud className="w-4 h-4 text-purple-500" />
                        VPD — Déficit Pressão Vapor (kPa)
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={180}>
                        <AreaChart data={dadosGraficos}>
                          <defs>
                            <linearGradient id="gradVPD" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#a855f7" stopOpacity={0.2} />
                              <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                          <XAxis dataKey="dataLabel" tick={{ fontSize: 10 }} />
                          <YAxis tick={{ fontSize: 10 }} unit=" kPa" />
                          <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`${v?.toFixed(2)} kPa`, 'VPD']} />
                          <ReferenceLine
                            y={1.5}
                            stroke="#ef4444"
                            strokeDasharray="4 2"
                            label={{ value: '⚠ Estresse 1.5', fill: '#ef4444', fontSize: 10, position: 'insideTopRight' }}/>
                          <ReferenceLine
                            y={0.8}
                            stroke="#f97316"
                            strokeDasharray="4 2"
                            label={{ value: '🍄 Risco fúngico 0.8', fill: '#f97316', fontSize: 10, position: 'insideBottomRight' }}/>
                          <Area type="monotone" dataKey="vpd" stroke="#a855f7" fill="url(#gradVPD)" strokeWidth={2} dot={false} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </div>
              </>
            )}

            {/* ── Tabela detalhada para hoje/ontem ── */}
            {mostrarDiaUnico && dadoDiaUnico && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Dados Completos</CardTitle>
                  <CardDescription>
                    {format(new Date(dadoDiaUnico.data + 'T12:00:00'), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                      { label: 'Temperatura Máxima', value: dadoDiaUnico.temp_max?.toFixed(1), unit: '°C' },
                      { label: 'Temperatura Mínima', value: dadoDiaUnico.temp_min?.toFixed(1), unit: '°C' },
                      { label: 'Temperatura Média', value: dadoDiaUnico.temp_media?.toFixed(1), unit: '°C' },
                      { label: 'Precipitação', value: dadoDiaUnico.precipitacao_mm?.toFixed(1), unit: 'mm' },
                      { label: 'Umidade Máxima', value: dadoDiaUnico.umidade_relativa_max?.toFixed(0), unit: '%' },
                      { label: 'Umidade Mínima', value: dadoDiaUnico.umidade_relativa_min?.toFixed(0), unit: '%' },
                      { label: 'Evapotranspiração ET₀', value: dadoDiaUnico.evapotranspiracao_mm?.toFixed(1), unit: 'mm' },
                      { label: 'Vento Máximo', value: dadoDiaUnico.vento_max_kmh?.toFixed(0), unit: 'km/h' },
                      { label: 'Radiação Solar', value: dadoDiaUnico.radiacao_solar_mj?.toFixed(1), unit: 'MJ/m²' },
                      { label: 'GDD do Dia', value: dadoDiaUnico.graus_dia?.toFixed(1), unit: '°' },
                      { label: 'VPD Máximo', value: dadoDiaUnico.deficit_pressao_vapor?.toFixed(2), unit: 'kPa' },
                    ].map(item => (
                      <div key={item.label} className="bg-muted/50 rounded-lg p-3">
                        <p className="text-xs text-muted-foreground mb-1">{item.label}</p>
                        <p className="text-lg font-bold">
                          {item.value ?? '—'}
                          {item.value && <span className="text-sm font-normal text-muted-foreground ml-1">{item.unit}</span>}
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Nota de rodapé */}
            <p className="text-xs text-muted-foreground text-center pb-2">
              Dados coletados automaticamente via Open-Meteo · Atualização diária às 03h (horário de Brasília)
            </p>
          </>
        )}
      </div>
    </MainLayout>
  );
}