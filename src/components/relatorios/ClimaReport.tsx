// components/relatorios/ClimaReport.tsx
// Coloque em: src/components/relatorios/ClimaReport.tsx

import { useState } from 'react';
import { Cloud, Droplets, Thermometer, Wind, Zap, AlertTriangle, Leaf, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useClima } from '@/hooks/useClima';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const tooltipStyle = {
  backgroundColor: 'hsl(var(--card))',
  border: '1px solid hsl(var(--border))',
  borderRadius: '8px',
};

interface ClimaReportProps {
  talhaoId?: string | null;
  dataInicio: string;
  dataFim: string;
}

export default function ClimaReport({ talhaoId = null, dataInicio, dataFim }: ClimaReportProps) {
  const { data: clima, isLoading, error } = useClima(talhaoId, dataInicio, dataFim);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12 flex flex-col items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground">Carregando dados climáticos...</p>
        </CardContent>
      </Card>
    );
  }

  if (error || !clima || clima.registros.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-12 flex flex-col items-center justify-center text-center">
          <Cloud className="w-10 h-10 text-muted-foreground mb-3" />
          <p className="font-medium text-foreground mb-1">Sem dados climáticos</p>
          <p className="text-sm text-muted-foreground max-w-sm">
            Os dados serão coletados automaticamente a partir de amanhã às 06:00.
            Se a Edge Function ainda não foi configurada, consulte o arquivo de instruções.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Formatar dados para os gráficos
  const dadosGraficos = clima.registros.map(r => ({
    data: format(new Date(r.data + 'T12:00:00'), 'dd/MM', { locale: ptBR }),
    tempMax: r.temp_max,
    tempMin: r.temp_min,
    tempMedia: r.temp_media,
    chuva: r.precipitacao_mm,
    umidadeMax: r.umidade_relativa_max,
    et0: r.evapotranspiracao_mm,
    grausDia: r.graus_dia,
    vpd: r.deficit_pressao_vapor,
  }));

  // Risco fúngico: dias consecutivos com umidade >85% e chuva
  const diasRiscoFungico = clima.registros.filter(
    r => (r.umidade_relativa_max ?? 0) > 85 && (r.precipitacao_mm ?? 0) > 0.5
  ).length;

  return (
    <div className="space-y-6">
      {/* Indicadores rápidos */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Droplets className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Precipitação Total</p>
                <p className="text-xl font-bold">{clima.precipitacaoTotal} mm</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
                <Thermometer className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Temp. Média</p>
                <p className="text-xl font-bold">{clima.tempMediaPeriodo}°C</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                <Leaf className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">GDD Acumulado</p>
                <p className="text-xl font-bold">{clima.grausDiaAcumulado}°</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${diasRiscoFungico > 3 ? 'bg-red-500/10' : 'bg-yellow-500/10'}`}>
                <AlertTriangle className={`w-5 h-5 ${diasRiscoFungico > 3 ? 'text-red-600' : 'text-yellow-600'}`} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Risco Fúngico</p>
                <p className="text-xl font-bold">{diasRiscoFungico} dias</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico de Temperatura */}
      <Card>
        <CardHeader>
          <CardTitle className="font-display text-lg flex items-center gap-2">
            <Thermometer className="w-5 h-5 text-orange-500" />
            Temperatura (°C)
          </CardTitle>
          <CardDescription>Máxima, mínima e média diária</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={dadosGraficos}>
              <defs>
                <linearGradient id="colorMax" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f97316" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorMin" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="data" className="text-xs" />
              <YAxis className="text-xs" unit="°C" />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`${v?.toFixed(1)}°C`]} />
              <Legend />
              <Area type="monotone" dataKey="tempMax" name="Máx" stroke="#f97316" fill="url(#colorMax)" strokeWidth={2} dot={false} />
              <Area type="monotone" dataKey="tempMin" name="Mín" stroke="#3b82f6" fill="url(#colorMin)" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="tempMedia" name="Média" stroke="#8b5cf6" strokeWidth={2} dot={false} strokeDasharray="4 2" />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Gráfico de Precipitação */}
      <Card>
        <CardHeader>
          <CardTitle className="font-display text-lg flex items-center gap-2">
            <Droplets className="w-5 h-5 text-blue-500" />
            Precipitação Diária (mm)
          </CardTitle>
          <CardDescription>{clima.diasComChuva} dias com chuva no período</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={dadosGraficos}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="data" className="text-xs" />
              <YAxis className="text-xs" unit="mm" />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`${v?.toFixed(1)} mm`, 'Chuva']} />
              <Bar dataKey="chuva" name="Precipitação" fill="#0ea5e9" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Gráfico ET₀ vs Chuva */}
      <Card>
        <CardHeader>
          <CardTitle className="font-display text-lg flex items-center gap-2">
            <Zap className="w-5 h-5 text-yellow-500" />
            Evapotranspiração vs Precipitação (mm)
          </CardTitle>
          <CardDescription>
            Quando ET₀ {'>'} Chuva, a planta depende da irrigação — ET₀ total: {clima.evapotranspiracaoTotal} mm
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={dadosGraficos}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="data" className="text-xs" />
              <YAxis className="text-xs" unit="mm" />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend />
              <Bar dataKey="et0" name="ET₀" fill="#f59e0b" radius={[3, 3, 0, 0]} />
              <Bar dataKey="chuva" name="Chuva" fill="#0ea5e9" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* GDD Acumulado */}
      <Card>
        <CardHeader>
          <CardTitle className="font-display text-lg flex items-center gap-2">
            <Leaf className="w-5 h-5 text-green-500" />
            Graus-Dia Acumulados (GDD base 10°C)
          </CardTitle>
          <CardDescription>
            Indica o desenvolvimento fenológico — brotamento ~30 GDD, floração ~150 GDD, maturação ~1000 GDD
          </CardDescription>
        </CardHeader>
        <CardContent>
          {(() => {
            let acumulado = 0;
            const dadosGDD = dadosGraficos.map(d => {
              acumulado += d.grausDia ?? 0;
              return { ...d, gddAcumulado: Math.round(acumulado) };
            });
            return (
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={dadosGDD}>
                  <defs>
                    <linearGradient id="colorGDD" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="data" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`${v} GDD`]} />
                  <Area type="monotone" dataKey="gddAcumulado" name="GDD Acumulado" stroke="#10b981" fill="url(#colorGDD)" strokeWidth={2} dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            );
          })()}
        </CardContent>
      </Card>

      {/* Resumo textual automático */}
      <Card>
        <CardHeader>
          <CardTitle className="font-display text-lg">Análise Climática do Período</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-muted/50 rounded-lg p-6 space-y-3">
            <p className="text-foreground leading-relaxed">
              <strong>🌡️ Temperatura:</strong> A temperatura média no período foi de{' '}
              <strong>{clima.tempMediaPeriodo}°C</strong>.
            </p>
            <p className="text-foreground leading-relaxed">
              <strong>🌧️ Precipitação:</strong> Foram registrados <strong>{clima.diasComChuva} dias com chuva</strong>,
              totalizando <strong>{clima.precipitacaoTotal} mm</strong>.
              {clima.precipitacaoTotal < clima.evapotranspiracaoTotal
                ? ` A evapotranspiração (${clima.evapotranspiracaoTotal} mm) superou a precipitação, indicando necessidade de irrigação complementar.`
                : ` A precipitação foi suficiente para suprir a evapotranspiração estimada de ${clima.evapotranspiracaoTotal} mm.`}
            </p>
            <p className="text-foreground leading-relaxed">
              <strong>🍇 Desenvolvimento Vegetativo:</strong> Foram acumulados{' '}
              <strong>{clima.grausDiaAcumulado} graus-dia</strong> (base 10°C) no período.
            </p>
            {diasRiscoFungico > 0 && (
              <p className="text-foreground leading-relaxed">
                <strong>⚠️ Risco Fitossanitário:</strong> Foram identificados{' '}
                <strong className={diasRiscoFungico > 3 ? 'text-red-600' : 'text-yellow-600'}>
                  {diasRiscoFungico} dias com condições favoráveis a doenças fúngicas
                </strong>{' '}
                (umidade {'>'} 85% + chuva). Verifique as aplicações de fungicida no período.
              </p>
            )}
            <p className="text-foreground leading-relaxed">
              <strong>💧 Evapotranspiração:</strong> A ET₀ acumulada foi de{' '}
              <strong>{clima.evapotranspiracaoTotal} mm</strong>, referência para manejo da irrigação.
            </p>
            <div className="border-t border-border pt-4 mt-2">
              <p className="text-muted-foreground text-sm italic">
                * Dados coletados automaticamente via Open-Meteo (open-meteo.com). GDD calculado com base 10°C.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}