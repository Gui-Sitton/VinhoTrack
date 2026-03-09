// components/relatorios/ClimaReport.tsx
import { useRef } from 'react';
import { Cloud, Droplets, Thermometer, Wind, Zap, AlertTriangle, Leaf, Loader2, Sun, Activity, Download, FileText } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useClima } from '@/hooks/useClima';
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Legend, ReferenceLine, ComposedChart,
} from 'recharts';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const tooltipStyle = {
  backgroundColor: 'hsl(var(--card))',
  border: '1px solid hsl(var(--border))',
  borderRadius: '8px',
  fontSize: '12px',
};

interface ClimaReportProps {
  talhaoId?: string | null;
  dataInicio: string;
  dataFim: string;
}

export default function ClimaReport({ talhaoId = null, dataInicio, dataFim }: ClimaReportProps) {
  const { data: clima, isLoading, error } = useClima(talhaoId, dataInicio, dataFim);
  const contentRef = useRef<HTMLDivElement>(null);

  const escapar = (v: unknown) => {
    if (v === null || v === undefined) return '';
    const s = String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };

  const handleDownloadCSV = () => {
    if (!clima || clima.registros.length === 0) return;
    const cab = ['data','temp_max_c','temp_min_c','temp_media_c','precipitacao_mm','umidade_max_pct','umidade_min_pct','evapotranspiracao_mm','vento_max_kmh','radiacao_solar_mj','graus_dia_gdd','deficit_pressao_vapor_kpa'].join(',');
    const linhas = clima.registros.map((r: any) => [
      escapar(r.data), escapar(r.temp_max), escapar(r.temp_min), escapar(r.temp_media),
      escapar(r.precipitacao_mm), escapar(r.umidade_relativa_max), escapar(r.umidade_relativa_min),
      escapar(r.evapotranspiracao_mm), escapar(r.vento_max_kmh), escapar(r.radiacao_solar_mj),
      escapar(r.graus_dia), escapar(r.deficit_pressao_vapor),
    ].join(','));
    const blob = new Blob([[cab, ...linhas].join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `clima-${dataInicio}_${dataFim}.csv`;
    document.body.appendChild(a); a.click();
    document.body.removeChild(a); URL.revokeObjectURL(url);
  };

  const handleDownloadPDF = async () => {
    if (!contentRef.current) return;
    const canvas = await html2canvas(contentRef.current, { scale: 2 });
    const pdf = new jsPDF('p', 'mm', 'a4');
    const w = pdf.internal.pageSize.getWidth();
    const h = (canvas.height * w) / canvas.width;
    const ph = pdf.internal.pageSize.getHeight();
    let y = 0;
    while (y < h) {
      if (y > 0) pdf.addPage();
      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, -y, w, h);
      y += ph;
    }
    pdf.save(`clima-${dataInicio}_${dataFim}.pdf`);
  };

  if (isLoading) return (
    <Card><CardContent className="py-12 flex flex-col items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
      <p className="text-muted-foreground">Carregando dados climáticos...</p>
    </CardContent></Card>
  );

  if (error || !clima || clima.registros.length === 0) return (
    <Card className="border-dashed"><CardContent className="py-12 flex flex-col items-center justify-center text-center">
      <Cloud className="w-10 h-10 text-muted-foreground mb-3" />
      <p className="font-medium mb-1">Sem dados climáticos</p>
      <p className="text-sm text-muted-foreground max-w-sm">Os dados serão coletados automaticamente a partir de amanhã às 06:00.</p>
    </CardContent></Card>
  );

  const dadosGraficos = clima.registros.map((r: any) => ({
    data: format(new Date(r.data + 'T12:00:00'), 'dd/MM', { locale: ptBR }),
    tempMax: r.temp_max, tempMin: r.temp_min, tempMedia: r.temp_media,
    chuva: r.precipitacao_mm, umidadeMax: r.umidade_relativa_max, umidadeMin: r.umidade_relativa_min,
    et0: r.evapotranspiracao_mm, grausDia: r.graus_dia, vpd: r.deficit_pressao_vapor,
    vento: r.vento_max_kmh, radiacao: r.radiacao_solar_mj,
  }));

  let gddAcc = 0;
  const dadosGDD = dadosGraficos.map(d => { gddAcc += d.grausDia ?? 0; return { ...d, gddAcumulado: Math.round(gddAcc) }; });

  const diasRiscoFungico = clima.registros.filter((r: any) => (r.umidade_relativa_max ?? 0) > 85 && (r.precipitacao_mm ?? 0) > 0.5).length;
  const diasEstresseVPD = clima.registros.filter((r: any) => (r.deficit_pressao_vapor ?? 0) > 1.5).length;
  const ventoMax = Math.max(...clima.registros.map((r: any) => r.vento_max_kmh ?? 0));
  const radiacaoMedia = clima.registros.length ? Math.round(clima.registros.reduce((a: number, r: any) => a + (r.radiacao_solar_mj ?? 0), 0) / clima.registros.length * 10) / 10 : 0;
  const vpdMax = Math.max(...clima.registros.map((r: any) => r.deficit_pressao_vapor ?? 0));

  return (
    <div className="space-y-6">
      <div ref={contentRef} className="space-y-6">

        {/* Cards resumo */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Precipitação Total', value: `${clima.precipitacaoTotal} mm`, sub: `${clima.diasComChuva} dias com chuva`, Icon: Droplets, color: 'text-blue-600', bg: 'bg-blue-500/10' },
            { label: 'Temp. Média', value: `${clima.tempMediaPeriodo}°C`, Icon: Thermometer, color: 'text-orange-600', bg: 'bg-orange-500/10' },
            { label: 'GDD Acumulado', value: `${clima.grausDiaAcumulado}°`, Icon: Leaf, color: 'text-green-600', bg: 'bg-green-500/10' },
            { label: 'Risco Fúngico', value: `${diasRiscoFungico} dias`, Icon: AlertTriangle, color: diasRiscoFungico > 3 ? 'text-red-600' : 'text-yellow-600', bg: diasRiscoFungico > 3 ? 'bg-red-500/10' : 'bg-yellow-500/10' },
            { label: 'ET₀ Total', value: `${clima.evapotranspiracaoTotal} mm`, Icon: Zap, color: 'text-yellow-600', bg: 'bg-yellow-500/10' },
            { label: 'Vento Máx.', value: `${ventoMax.toFixed(0)} km/h`, Icon: Wind, color: 'text-slate-600', bg: 'bg-slate-500/10' },
            { label: 'Radiação Média', value: `${radiacaoMedia} MJ/m²`, Icon: Sun, color: 'text-yellow-500', bg: 'bg-yellow-400/10' },
            { label: 'Dias Estresse VPD', value: `${diasEstresseVPD} dias`, sub: `VPD máx: ${vpdMax.toFixed(2)} kPa`, Icon: Activity, color: diasEstresseVPD > 5 ? 'text-red-600' : 'text-purple-600', bg: diasEstresseVPD > 5 ? 'bg-red-500/10' : 'bg-purple-500/10' },
          ].map(({ label, value, sub, Icon, color, bg }) => (
            <Card key={label}><CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg ${bg} flex items-center justify-center`}><Icon className={`w-5 h-5 ${color}`} /></div>
                <div>
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <p className="text-xl font-bold">{value}</p>
                  {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
                </div>
              </div>
            </CardContent></Card>
          ))}
        </div>

        {/* Temperatura */}
        <Card>
          <CardHeader>
            <CardTitle className="font-display text-lg flex items-center gap-2"><Thermometer className="w-5 h-5 text-orange-500" /> Temperatura (°C)</CardTitle>
            <CardDescription>Máxima, mínima e média diária</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={dadosGraficos}>
                <defs>
                  <linearGradient id="cMax" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#f97316" stopOpacity={0.2}/><stop offset="95%" stopColor="#f97316" stopOpacity={0}/></linearGradient>
                  <linearGradient id="cMin" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/><stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/></linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="data" tick={{ fontSize: 11 }} /><YAxis tick={{ fontSize: 11 }} unit="°C" />
                <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`${v?.toFixed(1)}°C`]} /><Legend />
                <Area type="monotone" dataKey="tempMax" name="Máx" stroke="#f97316" fill="url(#cMax)" strokeWidth={2} dot={false} />
                <Area type="monotone" dataKey="tempMin" name="Mín" stroke="#3b82f6" fill="url(#cMin)" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="tempMedia" name="Média" stroke="#8b5cf6" strokeWidth={2} dot={false} strokeDasharray="4 2" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Precipitação + ET₀ */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2"><Droplets className="w-4 h-4 text-blue-500" /> Precipitação Diária (mm)</CardTitle>
              <CardDescription>{clima.diasComChuva} dias com chuva · total {clima.precipitacaoTotal} mm</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={dadosGraficos}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="data" tick={{ fontSize: 11 }} /><YAxis tick={{ fontSize: 11 }} unit="mm" />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`${v?.toFixed(1)} mm`, 'Chuva']} />
                  <Bar dataKey="chuva" fill="#0ea5e9" radius={[3,3,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2"><Zap className="w-4 h-4 text-yellow-500" /> ET₀ vs Precipitação (mm)</CardTitle>
              <CardDescription>Quando ET₀ {'>'} Chuva, as mudas dependem de irrigação · ET₀ total: {clima.evapotranspiracaoTotal} mm</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={dadosGraficos}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="data" tick={{ fontSize: 11 }} /><YAxis tick={{ fontSize: 11 }} unit="mm" />
                  <Tooltip contentStyle={tooltipStyle} /><Legend />
                  <Bar dataKey="et0" name="ET₀" fill="#f59e0b" radius={[3,3,0,0]} />
                  <Bar dataKey="chuva" name="Chuva" fill="#0ea5e9" radius={[3,3,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Umidade */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2"><Droplets className="w-4 h-4 text-sky-500" /> Umidade Relativa (%)</CardTitle>
            <CardDescription>Linha vermelha em 85% — risco fúngico · {diasRiscoFungico} dias de risco</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={dadosGraficos}>
                <defs><linearGradient id="gradUmid" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.2}/><stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/></linearGradient></defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="data" tick={{ fontSize: 11 }} /><YAxis domain={[0,100]} tick={{ fontSize: 11 }} unit="%" />
                <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`${v?.toFixed(0)}%`]} />
                <ReferenceLine y={85} stroke="#ef4444" strokeDasharray="4 2" label={{ value: '⚠ 85%', fill: '#ef4444', fontSize: 11, position: 'insideTopRight' }} />
                <Legend />
                <Area type="monotone" dataKey="umidadeMax" name="Umidade Máx" stroke="#0ea5e9" fill="url(#gradUmid)" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="umidadeMin" name="Umidade Mín" stroke="#7dd3fc" strokeWidth={1.5} dot={false} strokeDasharray="3 2" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* GDD */}
        <Card>
          <CardHeader>
            <CardTitle className="font-display text-lg flex items-center gap-2"><Leaf className="w-5 h-5 text-green-500" /> Graus-Dia Acumulados (GDD base 10°C)</CardTitle>
            <CardDescription>Total: {clima.grausDiaAcumulado} GDD · barras = diário · linha = acumulado</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <ComposedChart data={dadosGDD}>
                <defs><linearGradient id="gradGDD" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/><stop offset="95%" stopColor="#10b981" stopOpacity={0}/></linearGradient></defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="data" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="left" tick={{ fontSize: 11 }} /><YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={tooltipStyle} /><Legend />
                <Bar yAxisId="right" dataKey="grausDia" name="GDD diário" fill="#86efac" radius={[3,3,0,0]} />
                <Area yAxisId="left" type="monotone" dataKey="gddAcumulado" name="GDD acumulado" stroke="#10b981" fill="url(#gradGDD)" strokeWidth={2} dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Vento + Radiação + VPD */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Wind className="w-4 h-4 text-slate-500" /> Vento Máximo (km/h)</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={dadosGraficos}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="data" tick={{ fontSize: 10 }} /><YAxis tick={{ fontSize: 10 }} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`${v?.toFixed(0)} km/h`, 'Vento']} />
                  <Bar dataKey="vento" fill="#94a3b8" radius={[3,3,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Sun className="w-4 h-4 text-yellow-500" /> Radiação Solar (MJ/m²)</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={dadosGraficos}>
                  <defs><linearGradient id="gradRad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#fbbf24" stopOpacity={0.3}/><stop offset="95%" stopColor="#fbbf24" stopOpacity={0}/></linearGradient></defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="data" tick={{ fontSize: 10 }} /><YAxis tick={{ fontSize: 10 }} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`${v?.toFixed(1)} MJ/m²`, 'Radiação']} />
                  <Area type="monotone" dataKey="radiacao" stroke="#fbbf24" fill="url(#gradRad)" strokeWidth={2} dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Cloud className="w-4 h-4 text-purple-500" /> VPD (kPa)</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={dadosGraficos}>
                  <defs><linearGradient id="gradVPD" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#a855f7" stopOpacity={0.2}/><stop offset="95%" stopColor="#a855f7" stopOpacity={0}/></linearGradient></defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="data" tick={{ fontSize: 10 }} /><YAxis tick={{ fontSize: 10 }} unit=" kPa" />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`${v?.toFixed(2)} kPa`, 'VPD']} />
                  <ReferenceLine y={1.5} stroke="#ef4444" strokeDasharray="4 2" label={{ value: '⚠ 1.5', fill: '#ef4444', fontSize: 10, position: 'insideTopRight' }} />
                  <ReferenceLine y={0.8} stroke="#f97316" strokeDasharray="4 2" label={{ value: '🍄 0.8', fill: '#f97316', fontSize: 10, position: 'insideBottomRight' }} />
                  <Area type="monotone" dataKey="vpd" stroke="#a855f7" fill="url(#gradVPD)" strokeWidth={2} dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Análise textual */}
        <Card>
          <CardHeader><CardTitle className="font-display text-lg">Análise Climática do Período</CardTitle></CardHeader>
          <CardContent>
            <div className="bg-muted/50 rounded-lg p-6 space-y-3">
              <p className="text-foreground leading-relaxed"><strong>🌡️ Temperatura:</strong> Média de <strong>{clima.tempMediaPeriodo}°C</strong>.</p>
              <p className="text-foreground leading-relaxed">
                <strong>🌧️ Precipitação:</strong> {clima.diasComChuva} dias com chuva, totalizando <strong>{clima.precipitacaoTotal} mm</strong>.
                {clima.precipitacaoTotal < clima.evapotranspiracaoTotal ? ` ET₀ (${clima.evapotranspiracaoTotal} mm) superou a chuva — irrigação necessária.` : ` Precipitação supriu ET₀ de ${clima.evapotranspiracaoTotal} mm.`}
              </p>
              <p className="text-foreground leading-relaxed"><strong>🍇 GDD:</strong> <strong>{clima.grausDiaAcumulado} graus-dia</strong> acumulados (base 10°C).</p>
              {diasRiscoFungico > 0 && <p className="text-foreground leading-relaxed"><strong>⚠️ Risco Fúngico:</strong> <strong className={diasRiscoFungico > 3 ? 'text-red-600' : 'text-yellow-600'}>{diasRiscoFungico} dias com condições favoráveis</strong> (umidade {'>'} 85% + chuva).</p>}
              {diasEstresseVPD > 0 && <p className="text-foreground leading-relaxed"><strong>🌬️ Estresse VPD:</strong> <strong className={diasEstresseVPD > 5 ? 'text-red-600' : 'text-yellow-600'}>{diasEstresseVPD} dias {'>'} 1.5 kPa</strong>{vpdMax > 2.5 ? ` — pico de ${vpdMax.toFixed(2)} kPa (estresse severo).` : '.'}</p>}
              <p className="text-foreground leading-relaxed"><strong>☀️ Radiação:</strong> Média de <strong>{radiacaoMedia} MJ/m²/dia</strong>.</p>
              <div className="border-t border-border pt-4 mt-2">
                <p className="text-muted-foreground text-sm italic">* Open-Meteo · GDD base 10°C · VPD: {'<'}0.8=risco fúngico · 0.8–1.5=ideal · {'>'}1.5=estresse</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Botões exportação */}
      <Card>
        <CardContent className="py-6">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button variant="outline" className="gap-2 w-full sm:w-auto" onClick={handleDownloadCSV}>
              <Download className="w-4 h-4" /> Download CSV
            </Button>
            <Button className="gap-2 w-full sm:w-auto" onClick={handleDownloadPDF}>
              <FileText className="w-4 h-4" /> Download PDF
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}