import { useState, useMemo } from 'react';
import { Leaf, AlertTriangle, TrendingUp, Users, Search, ChevronDown, ChevronUp, Clock } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useObservacoesReport } from '@/hooks/useObservacoesReport';
import { useTalhoes } from '@/hooks/useMudas';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Area,
  AreaChart,
  ComposedChart,
  Scatter,
} from 'recharts';
import { cn } from '@/lib/utils';

const FASE_COLORS: Record<string, string> = {
  'Dormência': '#6b7280',
  'Brotação': '#84cc16',
  'Floração': '#f472b6',
  'Frutificação': '#a78bfa',
  'Desenvolvimento dos frutos': '#34d399',
  'Véraison (início da maturação)': '#f59e0b',
  'Maturação': '#ef4444',
  'Colheita': '#8b5cf6',
  'Crescimento vegetativo': '#10b981',
};

const CHART_COLORS = ['#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#3b82f6', '#f472b6', '#6b7280', '#84cc16', '#a78bfa'];

function formatDate(dateStr: string) {
  return format(new Date(dateStr + 'T12:00:00'), 'dd/MM/yyyy', { locale: ptBR });
}

function formatDateShort(dateStr: string) {
  return format(new Date(dateStr + 'T12:00:00'), 'dd/MM', { locale: ptBR });
}

const tooltipStyle = {
  backgroundColor: 'hsl(var(--card))',
  border: '1px solid hsl(var(--border))',
  borderRadius: '8px',
};



export default function ObservacoesReport() {
  const {
    observacoes,
    resumo,
    alturaEvolucao,
    fasesDistribuicao,
    alertasCriticos,
    mudasComObservacoes,
    fasesAtuais,
    diasPorFase,
    isLoading,
  } = useObservacoesReport();

  const { data: talhoes } = useTalhoes();

  // Seleciona o primeiro talhão disponível para o gráfico Manejo × Desenvolvimento
  const talhaoId = talhoes && talhoes.length > 0 ? talhoes[0].id : null;

  const { data: viewManejoData } = useQuery({
    queryKey: ['view-manejo-desenvolvimento', talhaoId],
    queryFn: async () => {
      if (!talhaoId) return [];
      const { data, error } = await supabase
        .from('view_manejo_desenvolvimento_talhao')
        .select('*')
        .eq('talhao_id', talhaoId)
        .order('data_evento', { ascending: true });
      if (error) throw error;
      return data || [];
    },
    enabled: !!talhaoId,
  });

  const [mudaSelecionada, setMudaSelecionada] = useState<string>('');
  const [showAllAlertas, setShowAllAlertas] = useState(false);
  const [talhaoSelecionado, setTalhaoSelecionado] = useState<string>('');

  // Talhão efetivo para o gráfico
  const talhaoEfetivoId = talhaoSelecionado || talhaoId || '';

  const { data: viewManejoDataSelecionado } = useQuery({
    queryKey: ['view-manejo-desenvolvimento-selecionado', talhaoEfetivoId],
    queryFn: async () => {
      if (!talhaoEfetivoId) return [];
      const { data, error } = await supabase
        .from('view_manejo_desenvolvimento_talhao')
        .select('*')
        .eq('talhao_id', talhaoEfetivoId)
        .order('data_evento', { ascending: true });
      if (error) throw error;
      return data || [];
    },
    enabled: !!talhaoEfetivoId,
  });

  // Dados do gráfico Manejo × Desenvolvimento vindos da view
  const dadosComparativos = useMemo(() => {
    const source = viewManejoDataSelecionado || viewManejoData || [];
    return source
      .filter(d => d.data_evento !== null)
      .map(d => ({
        data: formatDateShort(d.data_evento as string),
        dataFull: d.data_evento as string,
        alturaMedia: d.altura_media_cm !== null ? Number(Number(d.altura_media_cm).toFixed(1)) : null,
        numAplicacoes: d.num_aplicacoes ?? 0,
        quantidadeTotal: d.quantidade_total ?? 0,
      }));
  }, [viewManejoData, viewManejoDataSelecionado]);

  // Histórico da muda selecionada
  const historicoMuda = useMemo(() => {
    if (!mudaSelecionada) return [];
    return observacoes
      .filter(o => o.muda_id === mudaSelecionada)
      .sort((a, b) => b.data.localeCompare(a.data));
  }, [mudaSelecionada, observacoes]);

  const alertasExibidos = showAllAlertas ? alertasCriticos : alertasCriticos.slice(0, 5);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12 flex flex-col items-center justify-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-muted-foreground">Carregando dados de observações...</p>
        </CardContent>
      </Card>
    );
  }

  if (resumo.totalObservacoes === 0) {
    return (
      <Card>
        <CardContent className="py-12 flex flex-col items-center justify-center text-center">
          <Leaf className="w-12 h-12 text-muted-foreground mb-4" />
          <h3 className="font-display text-lg font-semibold mb-2">Sem Observações Registradas</h3>
          <p className="text-muted-foreground max-w-md">
            Nenhuma observação de muda foi encontrada. Registre observações para gerar o relatório.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Indicadores Rápidos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="animate-fade-in" style={{ animationDelay: '0ms' }}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Leaf className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total de Observações</p>
                <p className="text-2xl font-bold">{resumo.totalObservacoes}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="animate-fade-in" style={{ animationDelay: '100ms' }}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Altura Média (fase atual)</p>
                <p className="text-2xl font-bold">{resumo.alturaMedia.toFixed(1)} cm</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="animate-fade-in" style={{ animationDelay: '200ms' }}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <Clock className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Fase de Maior Duração</p>
                <p className="text-lg font-bold truncate max-w-[160px]" title={resumo.faseMaiorDuracao}>
                  {resumo.faseMaiorDuracao}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="animate-fade-in" style={{ animationDelay: '300ms' }}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Mudas Observadas</p>
                <p className="text-2xl font-bold">
                  {resumo.mudasObservadas}
                  <span className="text-sm font-normal text-muted-foreground">/{resumo.totalMudas}</span>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos - Linha 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Evolução da Altura */}
        <Card className="animate-fade-in" style={{ animationDelay: '400ms' }}>
          <CardHeader>
            <CardTitle className="font-display text-lg">📈 Desenvolvimento ao Longo do Tempo</CardTitle>
            <CardDescription>Evolução da altura média por fase fenológica (degraus por fase)</CardDescription>
          </CardHeader>
          <CardContent>
            {alturaEvolucao.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={alturaEvolucao.map(d => ({
                  data: formatDateShort(d.data),
                  altura: Number(d.alturaMedia.toFixed(1)),
                }))}>
                  <defs>
                    <linearGradient id="alturaGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="data" className="text-sm" />
                  <YAxis className="text-sm" unit=" cm" />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    formatter={(value: number) => [`${value} cm`, 'Altura média']}
                  />
                  <Area
                    type="stepAfter"
                    dataKey="altura"
                    stroke="#10b981"
                    strokeWidth={2}
                    fill="url(#alturaGradient)"
                    dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[280px] flex items-center justify-center text-muted-foreground">
                Sem dados de altura registrados nas fases fenológicas
              </div>
            )}
          </CardContent>
        </Card>

        {/* Distribuição de Fases — agora em DIAS */}
        <Card className="animate-fade-in" style={{ animationDelay: '500ms' }}>
          <CardHeader>
            <CardTitle className="font-display text-lg">🌱 Duração por Fase Fenológica</CardTitle>
            <CardDescription>Total de dias acumulados em cada fase (todas as mudas)</CardDescription>
          </CardHeader>
          <CardContent>
            {fasesDistribuicao.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={fasesDistribuicao.map(d => ({
                  fase: d.fase.length > 15 ? d.fase.substring(0, 15) + '…' : d.fase,
                  faseFull: d.fase,
                  dias: d.count,
                }))} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis type="number" className="text-sm" />
                  <YAxis dataKey="fase" type="category" className="text-sm" width={120} />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    formatter={(value: number, _: any, props: any) => [
                      `${value} dias`,
                      props.payload.faseFull,
                    ]}
                  />
                  <Bar dataKey="dias" radius={[0, 4, 4, 0]}>
                    {fasesDistribuicao.map((entry, index) => (
                      <rect key={`cell-${index}`} fill={FASE_COLORS[entry.fase] || CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[280px] flex items-center justify-center text-muted-foreground">
                Sem dados de fases registrados
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Alertas Críticos */}
      {alertasCriticos.length > 0 && (
        <Card className="animate-fade-in border-amber-200 dark:border-amber-800" style={{ animationDelay: '600ms' }}>
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              <CardTitle className="font-display text-lg">⚠️ Alertas Agronômicos Identificados</CardTitle>
            </div>
            <CardDescription>
              {alertasCriticos.length} observação(ões) contendo palavras-chave de alerta
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {alertasExibidos.map((alerta) => (
                <div
                  key={alerta.id}
                  className="flex items-start gap-3 p-3 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-800"
                >
                  <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-foreground">
                        {alerta.muda_codigo} (L{alerta.muda_linha}/P{alerta.muda_planta})
                      </span>
                      <Badge variant="outline" className="text-amber-600 border-amber-300 text-xs">
                        {alerta.palavraChave}
                      </Badge>
                      <span className="text-xs text-muted-foreground ml-auto">
                        {formatDate(alerta.data)}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">{alerta.observacao}</p>
                  </div>
                </div>
              ))}
            </div>
            {alertasCriticos.length > 5 && (
              <button
                onClick={() => setShowAllAlertas(!showAllAlertas)}
                className="mt-3 flex items-center gap-1 text-sm text-primary hover:underline"
              >
                {showAllAlertas ? (
                  <>
                    <ChevronUp className="w-4 h-4" />
                    Mostrar menos
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-4 h-4" />
                    Ver todos ({alertasCriticos.length})
                  </>
                )}
              </button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Seção Comparativa - Manejo × Desenvolvimento (via view agregada) */}
      <Card className="animate-fade-in" style={{ animationDelay: '700ms' }}>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <CardTitle className="font-display text-lg">🌿 Manejo × Desenvolvimento</CardTitle>
              <CardDescription>
                Curva de crescimento do talhão com marcadores nos dias de aplicação de produtos
              </CardDescription>
            </div>
            {talhoes && talhoes.length > 1 && (
              <Select value={talhaoSelecionado || talhaoId || ''} onValueChange={setTalhaoSelecionado}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Selecionar talhão..." />
                </SelectTrigger>
                <SelectContent>
                  {talhoes.map(t => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.nome || t.codigo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {dadosComparativos.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={320}>
                <ComposedChart data={dadosComparativos}>
                  <defs>
                    <linearGradient id="compAlturaGradient2" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="data" className="text-sm" tick={{ fontSize: 11 }} />
                  <YAxis yAxisId="altura" className="text-sm" unit=" cm" width={60} />
                  <YAxis yAxisId="aplicacao" orientation="right" className="text-sm" hide />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    content={({ active, payload, label }) => {
                      if (!active || !payload?.length) return null;
                      const d = payload[0]?.payload;
                      return (
                        <div style={tooltipStyle} className="px-3 py-2 text-xs space-y-1">
                          <p className="font-semibold">{label}</p>
                          {d.alturaMedia !== null && (
                            <p>Altura média: <strong>{d.alturaMedia} cm</strong></p>
                          )}
                          {d.numAplicacoes > 0 && (
                            <>
                              <p>Aplicações: <strong>{d.numAplicacoes}</strong></p>
                              <p>Quantidade total: <strong>{Number(d.quantidadeTotal).toFixed(2)}</strong></p>
                            </>
                          )}
                        </div>
                      );
                    }}
                  />
                  <Area
                    yAxisId="altura"
                    type="monotone"
                    dataKey="alturaMedia"
                    stroke="#10b981"
                    strokeWidth={2}
                    fill="url(#compAlturaGradient2)"
                    dot={false}
                    connectNulls
                    name="Altura média (cm)"
                  />
                  <Scatter
                    yAxisId="altura"
                    dataKey={(d: any) => d.numAplicacoes > 0 ? d.alturaMedia : null}
                    fill="#7c3aed"
                    name="Aplicação"
                    shape={(props: any) => {
                      const { cx, cy, payload } = props;
                      if (!payload?.numAplicacoes || payload.numAplicacoes === 0) return <g />;
                      const r = Math.max(5, Math.min(14, 5 + Math.sqrt(payload.quantidadeTotal || 0) * 0.3));
                      return <circle cx={cx} cy={cy} r={r} fill="#7c3aed" fillOpacity={0.7} stroke="#5b21b6" strokeWidth={1} />;
                    }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
              <p className="text-xs text-muted-foreground mt-2 italic">
                Linha verde: altura média do talhão (cm) · Círculos roxos: dias com aplicação de produtos (tamanho proporcional à quantidade)
              </p>
            </>
          ) : (
            <div className="h-[320px] flex items-center justify-center text-muted-foreground">
              Sem dados disponíveis para o talhão selecionado
            </div>
          )}
        </CardContent>
      </Card>

      {/* Histórico por Muda */}
      <Card className="animate-fade-in" style={{ animationDelay: '800ms' }}>
        <CardHeader>
          <CardTitle className="font-display text-lg">📋 Histórico Detalhado por Muda</CardTitle>
          <CardDescription>Selecione uma muda para ver sua linha do tempo completa</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <Select value={mudaSelecionada} onValueChange={setMudaSelecionada}>
              <SelectTrigger className="w-full md:w-80">
                <SelectValue placeholder="Selecionar muda..." />
              </SelectTrigger>
              <SelectContent>
                {mudasComObservacoes.map((muda) => (
                  <SelectItem key={muda.id} value={muda.id}>
                    {muda.codigo} — Linha {muda.linha}, Planta {muda.planta}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {mudaSelecionada && historicoMuda.length > 0 ? (
            <div className="space-y-3">
              {historicoMuda.map((obs, index) => (
                <div
                  key={obs.id}
                  className={cn(
                    'relative pl-6 pb-4',
                    index < historicoMuda.length - 1 && 'border-l-2 border-border ml-2'
                  )}
                >
                  <div className="absolute -left-[5px] top-1 w-3 h-3 rounded-full bg-primary border-2 border-background" />
                  <div className="bg-muted/50 rounded-lg p-4 ml-2">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className="text-sm font-semibold text-foreground">
                        {formatDate(obs.data)}
                      </span>
                      <Badge
                        variant="outline"
                        className="text-xs"
                        style={{
                          borderColor: FASE_COLORS[obs.fase_fenologica] || '#6b7280',
                          color: FASE_COLORS[obs.fase_fenologica] || '#6b7280',
                        }}
                      >
                        {obs.fase_fenologica}
                      </Badge>
                      {obs.altura_cm !== null && (
                        <Badge variant="secondary" className="text-xs">
                          {obs.altura_cm} cm
                        </Badge>
                      )}
                    </div>
                    {obs.observacoes && (
                      <p className="text-sm text-muted-foreground">{obs.observacoes}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : mudaSelecionada ? (
            <p className="text-muted-foreground text-sm">Nenhuma observação encontrada para esta muda.</p>
          ) : (
            <div className="text-center py-8">
              <Search className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground text-sm">
                Selecione uma muda acima para visualizar seu histórico completo.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Resumo Textual */}
      <Card className="animate-fade-in" style={{ animationDelay: '900ms' }}>
        <CardHeader>
          <CardTitle className="font-display text-lg">Resumo de Observações</CardTitle>
          <CardDescription>
            Análise automática baseada nas fases fenológicas e observações registradas
          </CardDescription>
        </CardHeader>
        <CardContent className="prose prose-sm max-w-none">
          <div className="bg-muted/50 rounded-lg p-6 space-y-4">
            <p className="text-foreground leading-relaxed">
              <strong>🌱 Observações Registradas:</strong> Foram registradas{' '}
              <strong>{resumo.totalObservacoes} observações</strong>
              {resumo.periodoInicio && resumo.periodoFim && (
                <>
                  {' '}entre{' '}
                  <strong>{formatDate(resumo.periodoInicio)}</strong> e{' '}
                  <strong>{formatDate(resumo.periodoFim)}</strong>
                </>
              )}
              . A altura média atual, baseada na fase ativa de cada muda, é de{' '}
              <strong>{resumo.alturaMedia.toFixed(1)} cm</strong>.
            </p>

            <p className="text-foreground leading-relaxed">
              <strong>⏱️ Duração por Fase:</strong> A fase com maior tempo acumulado é{' '}
              <strong>{resumo.faseMaiorDuracao}</strong>
              {diasPorFase[resumo.faseMaiorDuracao] && (
                <>, com <strong>{diasPorFase[resumo.faseMaiorDuracao]} dias</strong> totais</>
              )}
              .
              {Object.entries(diasPorFase).length > 1 && (
                <> Demais fases: {Object.entries(diasPorFase)
                  .filter(([f]) => f !== resumo.faseMaiorDuracao)
                  .sort((a, b) => b[1] - a[1])
                  .map(([f, d]) => `${f} (${d} dias)`)
                  .join(', ')}.</>
              )}
            </p>

            <p className="text-foreground leading-relaxed">
              <strong>👁️ Cobertura:</strong> Das {resumo.totalMudas} mudas cadastradas,{' '}
              <strong>{resumo.mudasObservadas}</strong> ({resumo.totalMudas > 0 ? ((resumo.mudasObservadas / resumo.totalMudas) * 100).toFixed(1) : 0}%)
              possuem ao menos uma observação registrada.
            </p>

            {alertasCriticos.length > 0 && (
              <p className="text-foreground leading-relaxed">
                <strong>⚠️ Alertas:</strong> Foram identificadas{' '}
                <strong>{alertasCriticos.length} observações</strong> contendo indicadores de
                problemas fitossanitários ou estresse, requerendo acompanhamento técnico.
              </p>
            )}

            {dadosComparativos.length > 0 && (
              <p className="text-foreground leading-relaxed">
                <strong>📊 Manejo × Desenvolvimento:</strong> A análise correlaciona as aplicações
                de produtos com a altura registrada na fase fenológica vigente em cada data,
                permitindo avaliar o impacto do manejo no desenvolvimento cronológico das mudas.
              </p>
            )}

            <div className="border-t border-border pt-4 mt-4">
              <p className="text-muted-foreground text-sm italic">
                * Altura média calculada exclusivamente a partir de fases_fenologicas_mudas (fase atual, data_fim IS NULL).
                Duração por fase calculada pela diferença entre data_inicio e data_fim (ou data atual).
                Gráfico de desenvolvimento exibe degraus por fase com datas reais.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
