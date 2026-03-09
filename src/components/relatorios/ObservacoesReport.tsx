import { useState, useMemo, useRef } from 'react';
import { Leaf, AlertTriangle, TrendingUp, Users, Search, ChevronDown, ChevronUp, Clock, Download, FileText } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useObservacoesReport } from '@/hooks/useObservacoesReport';
import { useTalhoes } from '@/hooks/useMudas';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Area, AreaChart, ComposedChart, Scatter,
} from 'recharts';
import { cn } from '@/lib/utils';

const FASE_COLORS: Record<string, string> = {
  'Dormência': '#6b7280', 'Brotação': '#84cc16', 'Floração': '#f472b6',
  'Frutificação': '#a78bfa', 'Desenvolvimento dos frutos': '#34d399',
  'Véraison (início da maturação)': '#f59e0b', 'Maturação': '#ef4444',
  'Colheita': '#8b5cf6', 'Crescimento vegetativo': '#10b981',
};
const CHART_COLORS = ['#10b981','#f59e0b','#ef4444','#8b5cf6','#3b82f6','#f472b6','#6b7280','#84cc16','#a78bfa'];

const tooltipStyle = {
  backgroundColor: 'hsl(var(--card))',
  border: '1px solid hsl(var(--border))',
  borderRadius: '8px',
};

function formatDate(d: string) { return format(new Date(d + 'T12:00:00'), 'dd/MM/yyyy', { locale: ptBR }); }
function formatDateShort(d: string) { return format(new Date(d + 'T12:00:00'), 'dd/MM', { locale: ptBR }); }

export default function ObservacoesReport() {
  const {
    observacoes, resumo, alturaEvolucao, fasesDistribuicao,
    alertasCriticos, mudasComObservacoes, fasesAtuais, diasPorFase, isLoading,
  } = useObservacoesReport();

  const { data: talhoes } = useTalhoes();
  const talhaoId = talhoes && talhoes.length > 0 ? talhoes[0].id : null;
  const [mudaSelecionada, setMudaSelecionada] = useState('');
  const [showAllAlertas, setShowAllAlertas] = useState(false);
  const [talhaoSelecionado, setTalhaoSelecionado] = useState('');
  const contentRef = useRef<HTMLDivElement>(null);

  const talhaoEfetivoId = talhaoSelecionado || talhaoId || '';

  const { data: viewManejoData } = useQuery({
    queryKey: ['view-manejo-desenvolvimento', talhaoId],
    queryFn: async () => {
      if (!talhaoId) return [];
      const { data, error } = await supabase.from('view_manejo_desenvolvimento_talhao').select('*').eq('talhao_id', talhaoId).order('data_evento', { ascending: true });
      if (error) throw error;
      return data || [];
    },
    enabled: !!talhaoId,
  });

  const { data: viewManejoDataSelecionado } = useQuery({
    queryKey: ['view-manejo-desenvolvimento-selecionado', talhaoEfetivoId],
    queryFn: async () => {
      if (!talhaoEfetivoId) return [];
      const { data, error } = await supabase.from('view_manejo_desenvolvimento_talhao').select('*').eq('talhao_id', talhaoEfetivoId).order('data_evento', { ascending: true });
      if (error) throw error;
      return data || [];
    },
    enabled: !!talhaoEfetivoId,
  });

  const dadosComparativos = useMemo(() => {
    const source = viewManejoDataSelecionado || viewManejoData || [];
    return source.filter(d => d.data_evento !== null).map(d => ({
      data: formatDateShort(d.data_evento as string),
      dataFull: d.data_evento as string,
      alturaMedia: d.altura_media_cm !== null ? Number(Number(d.altura_media_cm).toFixed(1)) : null,
      numAplicacoes: d.num_aplicacoes ?? 0,
      quantidadeTotal: d.quantidade_total ?? 0,
    }));
  }, [viewManejoData, viewManejoDataSelecionado]);

  const historicoMuda = useMemo(() => {
    if (!mudaSelecionada) return [];
    return observacoes.filter(o => o.muda_id === mudaSelecionada).sort((a, b) => b.data.localeCompare(a.data));
  }, [mudaSelecionada, observacoes]);

  const alertasExibidos = showAllAlertas ? alertasCriticos : alertasCriticos.slice(0, 5);

  // ── CSV ────────────────────────────────────────────────
  const handleDownloadCSV = () => {
    if (observacoes.length === 0) return;
    const escapar = (v: unknown) => {
      if (v === null || v === undefined) return '';
      const s = String(v);
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const cab = ['muda_id','muda_codigo','linha','planta','data','fase_fenologica','altura_cm','observacoes'].join(',');
    const linhas = observacoes.map((o: any) => [
      escapar(o.muda_id), escapar(o.muda_codigo || ''), escapar(o.muda_linha || ''),
      escapar(o.muda_planta || ''), escapar(o.data), escapar(o.fase_fenologica),
      escapar(o.altura_cm), escapar(o.observacoes),
    ].join(','));
    const blob = new Blob([[cab, ...linhas].join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `observacoes-${new Date().toISOString().slice(0,10)}.csv`;
    document.body.appendChild(a); a.click();
    document.body.removeChild(a); URL.revokeObjectURL(url);
  };

  // ── PDF ────────────────────────────────────────────────
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
    pdf.save(`observacoes-${new Date().toISOString().slice(0,10)}.pdf`);
  };

  if (isLoading) return (
    <Card><CardContent className="py-12 flex flex-col items-center justify-center">
      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mb-4" />
      <p className="text-muted-foreground">Carregando dados de observações...</p>
    </CardContent></Card>
  );

  if (resumo.totalObservacoes === 0) return (
    <Card><CardContent className="py-12 flex flex-col items-center justify-center text-center">
      <Leaf className="w-12 h-12 text-muted-foreground mb-4" />
      <h3 className="font-display text-lg font-semibold mb-2">Sem Observações Registradas</h3>
      <p className="text-muted-foreground max-w-md">Registre observações para gerar o relatório.</p>
    </CardContent></Card>
  );

  return (
    <div className="space-y-6">
      <div ref={contentRef} className="space-y-6">

        {/* Indicadores */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="animate-fade-in" style={{ animationDelay: '0ms' }}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center"><Leaf className="w-5 h-5 text-primary" /></div>
                <div><p className="text-sm text-muted-foreground">Total de Observações</p><p className="text-2xl font-bold">{resumo.totalObservacoes}</p></div>
              </div>
            </CardContent>
          </Card>
          <Card className="animate-fade-in" style={{ animationDelay: '100ms' }}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center"><TrendingUp className="w-5 h-5 text-green-600" /></div>
                <div><p className="text-sm text-muted-foreground">Altura Média (fase atual)</p><p className="text-2xl font-bold">{resumo.alturaMedia.toFixed(1)} cm</p></div>
              </div>
            </CardContent>
          </Card>
          <Card className="animate-fade-in" style={{ animationDelay: '200ms' }}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center"><Clock className="w-5 h-5 text-purple-600" /></div>
                <div><p className="text-sm text-muted-foreground">Fase de Maior Duração</p><p className="text-lg font-bold truncate max-w-[160px]" title={resumo.faseMaiorDuracao}>{resumo.faseMaiorDuracao}</p></div>
              </div>
            </CardContent>
          </Card>
          <Card className="animate-fade-in" style={{ animationDelay: '300ms' }}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center"><Users className="w-5 h-5 text-amber-600" /></div>
                <div><p className="text-sm text-muted-foreground">Mudas Observadas</p><p className="text-2xl font-bold">{resumo.mudasObservadas}<span className="text-sm font-normal text-muted-foreground">/{resumo.totalMudas}</span></p></div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Gráficos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="animate-fade-in" style={{ animationDelay: '400ms' }}>
            <CardHeader>
              <CardTitle className="font-display text-lg">📈 Desenvolvimento ao Longo do Tempo</CardTitle>
              <CardDescription>Evolução da altura média por fase fenológica</CardDescription>
            </CardHeader>
            <CardContent>
              {alturaEvolucao.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <AreaChart data={alturaEvolucao.map(d => ({ data: formatDateShort(d.data), altura: Number(d.alturaMedia.toFixed(1)) }))}>
                    <defs><linearGradient id="alturaGradient" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/><stop offset="95%" stopColor="#10b981" stopOpacity={0}/></linearGradient></defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="data" className="text-sm" /><YAxis className="text-sm" unit=" cm" />
                    <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`${v} cm`, 'Altura média']} />
                    <Area type="stepAfter" dataKey="altura" stroke="#10b981" strokeWidth={2} fill="url(#alturaGradient)" dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }} />
                  </AreaChart>
                </ResponsiveContainer>
              ) : <div className="h-[280px] flex items-center justify-center text-muted-foreground">Sem dados de altura registrados</div>}
            </CardContent>
          </Card>

          <Card className="animate-fade-in" style={{ animationDelay: '500ms' }}>
            <CardHeader>
              <CardTitle className="font-display text-lg">🌱 Duração por Fase Fenológica</CardTitle>
              <CardDescription>Total de dias acumulados em cada fase</CardDescription>
            </CardHeader>
            <CardContent>
              {fasesDistribuicao.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={fasesDistribuicao.map(d => ({ fase: d.fase.length > 15 ? d.fase.substring(0,15)+'…' : d.fase, faseFull: d.fase, dias: d.count }))} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis type="number" className="text-sm" /><YAxis dataKey="fase" type="category" className="text-sm" width={120} />
                    <Tooltip contentStyle={tooltipStyle} formatter={(v: number, _: any, p: any) => [`${v} dias`, p.payload.faseFull]} />
                    <Bar dataKey="dias" radius={[0,4,4,0]}>
                      {fasesDistribuicao.map((entry, i) => (
                        <rect key={`cell-${i}`} fill={FASE_COLORS[entry.fase] || CHART_COLORS[i % CHART_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : <div className="h-[280px] flex items-center justify-center text-muted-foreground">Sem dados de fases registrados</div>}
            </CardContent>
          </Card>
        </div>

        {/* Alertas */}
        {alertasCriticos.length > 0 && (
          <Card className="animate-fade-in border-amber-200 dark:border-amber-800" style={{ animationDelay: '600ms' }}>
            <CardHeader>
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                <CardTitle className="font-display text-lg">⚠️ Alertas Agronômicos Identificados</CardTitle>
              </div>
              <CardDescription>{alertasCriticos.length} observação(ões) com palavras-chave de alerta</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {alertasExibidos.map((alerta) => (
                  <div key={alerta.id} className="flex items-start gap-3 p-3 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-800">
                    <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium">{alerta.muda_codigo} (L{alerta.muda_linha}/P{alerta.muda_planta})</span>
                        <Badge variant="outline" className="text-amber-600 border-amber-300 text-xs">{alerta.palavraChave}</Badge>
                        <span className="text-xs text-muted-foreground ml-auto">{formatDate(alerta.data)}</span>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">{alerta.observacao}</p>
                    </div>
                  </div>
                ))}
              </div>
              {alertasCriticos.length > 5 && (
                <button onClick={() => setShowAllAlertas(!showAllAlertas)} className="mt-3 flex items-center gap-1 text-sm text-primary hover:underline">
                  {showAllAlertas ? <><ChevronUp className="w-4 h-4" />Mostrar menos</> : <><ChevronDown className="w-4 h-4" />Ver todos ({alertasCriticos.length})</>}
                </button>
              )}
            </CardContent>
          </Card>
        )}

        {/* Manejo × Desenvolvimento */}
        <Card className="animate-fade-in" style={{ animationDelay: '700ms' }}>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <CardTitle className="font-display text-lg">🌿 Manejo × Desenvolvimento</CardTitle>
                <CardDescription>Curva de crescimento com marcadores nos dias de aplicação</CardDescription>
              </div>
              {talhoes && talhoes.length > 1 && (
                <Select value={talhaoSelecionado || talhaoId || ''} onValueChange={setTalhaoSelecionado}>
                  <SelectTrigger className="w-48"><SelectValue placeholder="Selecionar talhão..." /></SelectTrigger>
                  <SelectContent>{talhoes.map(t => <SelectItem key={t.id} value={t.id}>{t.nome || t.codigo}</SelectItem>)}</SelectContent>
                </Select>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {dadosComparativos.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={320}>
                  <ComposedChart data={dadosComparativos}>
                    <defs><linearGradient id="compAlturaGradient2" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/><stop offset="95%" stopColor="#10b981" stopOpacity={0}/></linearGradient></defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="data" className="text-sm" tick={{ fontSize: 11 }} />
                    <YAxis yAxisId="altura" className="text-sm" unit=" cm" width={60} />
                    <YAxis yAxisId="aplicacao" orientation="right" className="text-sm" hide />
                    <Tooltip contentStyle={tooltipStyle} content={({ active, payload, label }) => {
                      if (!active || !payload?.length) return null;
                      const d = payload[0]?.payload;
                      return (
                        <div style={tooltipStyle} className="px-3 py-2 text-xs space-y-1">
                          <p className="font-semibold">{label}</p>
                          {d.alturaMedia !== null && <p>Altura média: <strong>{d.alturaMedia} cm</strong></p>}
                          {d.numAplicacoes > 0 && <><p>Aplicações: <strong>{d.numAplicacoes}</strong></p><p>Qtd total: <strong>{Number(d.quantidadeTotal).toFixed(2)}</strong></p></>}
                        </div>
                      );
                    }} />
                    <Area yAxisId="altura" type="monotone" dataKey="alturaMedia" stroke="#10b981" strokeWidth={2} fill="url(#compAlturaGradient2)" dot={false} connectNulls name="Altura média (cm)" />
                    <Scatter yAxisId="altura" dataKey={(d: any) => d.numAplicacoes > 0 ? d.alturaMedia : null} fill="#7c3aed" name="Aplicação"
                      shape={(props: any) => {
                        const { cx, cy, payload } = props;
                        if (!payload?.numAplicacoes || payload.numAplicacoes === 0) return <g />;
                        const r = Math.max(5, Math.min(14, 5 + Math.sqrt(payload.quantidadeTotal || 0) * 0.3));
                        return <circle cx={cx} cy={cy} r={r} fill="#7c3aed" fillOpacity={0.7} stroke="#5b21b6" strokeWidth={1} />;
                      }}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
                <p className="text-xs text-muted-foreground mt-2 italic">Linha verde: altura média (cm) · Círculos roxos: dias com aplicação (tamanho proporcional à quantidade)</p>
              </>
            ) : <div className="h-[320px] flex items-center justify-center text-muted-foreground">Sem dados disponíveis</div>}
          </CardContent>
        </Card>

        {/* Histórico por muda */}
        <Card className="animate-fade-in" style={{ animationDelay: '800ms' }}>
          <CardHeader>
            <CardTitle className="font-display text-lg">📋 Histórico Detalhado por Muda</CardTitle>
            <CardDescription>Selecione uma muda para ver sua linha do tempo completa</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <Select value={mudaSelecionada} onValueChange={setMudaSelecionada}>
                <SelectTrigger className="w-full md:w-80"><SelectValue placeholder="Selecionar muda..." /></SelectTrigger>
                <SelectContent>{mudasComObservacoes.map(m => <SelectItem key={m.id} value={m.id}>{m.codigo} — Linha {m.linha}, Planta {m.planta}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            {mudaSelecionada && historicoMuda.length > 0 ? (
              <div className="space-y-3">
                {historicoMuda.map((obs, i) => (
                  <div key={obs.id} className={cn('relative pl-6 pb-4', i < historicoMuda.length - 1 && 'border-l-2 border-border ml-2')}>
                    <div className="absolute -left-[5px] top-1 w-3 h-3 rounded-full bg-primary border-2 border-background" />
                    <div className="bg-muted/50 rounded-lg p-4 ml-2">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <span className="text-sm font-semibold">{formatDate(obs.data)}</span>
                        <Badge variant="outline" className="text-xs" style={{ borderColor: FASE_COLORS[obs.fase_fenologica] || '#6b7280', color: FASE_COLORS[obs.fase_fenologica] || '#6b7280' }}>{obs.fase_fenologica}</Badge>
                        {obs.altura_cm !== null && <Badge variant="secondary" className="text-xs">{obs.altura_cm} cm</Badge>}
                      </div>
                      {obs.observacoes && <p className="text-sm text-muted-foreground">{obs.observacoes}</p>}
                    </div>
                  </div>
                ))}
              </div>
            ) : mudaSelecionada ? (
              <p className="text-muted-foreground text-sm">Nenhuma observação encontrada.</p>
            ) : (
              <div className="text-center py-8">
                <Search className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground text-sm">Selecione uma muda para visualizar seu histórico.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Resumo textual */}
        <Card className="animate-fade-in" style={{ animationDelay: '900ms' }}>
          <CardHeader>
            <CardTitle className="font-display text-lg">Resumo de Observações</CardTitle>
            <CardDescription>Análise automática das fases fenológicas e observações</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-muted/50 rounded-lg p-6 space-y-4">
              <p className="text-foreground leading-relaxed">
                <strong>🌱 Observações Registradas:</strong> Foram registradas <strong>{resumo.totalObservacoes} observações</strong>
                {resumo.periodoInicio && resumo.periodoFim && <> entre <strong>{formatDate(resumo.periodoInicio)}</strong> e <strong>{formatDate(resumo.periodoFim)}</strong></>}.
                Altura média atual: <strong>{resumo.alturaMedia.toFixed(1)} cm</strong>.
              </p>
              <p className="text-foreground leading-relaxed">
                <strong>⏱️ Duração por Fase:</strong> Fase com maior tempo: <strong>{resumo.faseMaiorDuracao}</strong>
                {diasPorFase[resumo.faseMaiorDuracao] && <>, com <strong>{diasPorFase[resumo.faseMaiorDuracao]} dias</strong></>}.
                {Object.entries(diasPorFase).length > 1 && <> Demais: {Object.entries(diasPorFase).filter(([f]) => f !== resumo.faseMaiorDuracao).sort((a,b)=>b[1]-a[1]).map(([f,d]) => `${f} (${d} dias)`).join(', ')}.</>}
              </p>
              <p className="text-foreground leading-relaxed">
                <strong>👁️ Cobertura:</strong> Das {resumo.totalMudas} mudas, <strong>{resumo.mudasObservadas}</strong> ({resumo.totalMudas > 0 ? ((resumo.mudasObservadas / resumo.totalMudas) * 100).toFixed(1) : 0}%) têm observação registrada.
              </p>
              {alertasCriticos.length > 0 && (
                <p className="text-foreground leading-relaxed">
                  <strong>⚠️ Alertas:</strong> <strong>{alertasCriticos.length} observações</strong> com indicadores de problemas requerendo acompanhamento.
                </p>
              )}
              <div className="border-t border-border pt-4 mt-4">
                <p className="text-muted-foreground text-sm italic">* Altura calculada a partir de fases_fenologicas_mudas (fase ativa, data_fim IS NULL).</p>
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