import { useState, useMemo } from 'react';
import { Leaf, AlertTriangle, TrendingUp, Users, Calendar, Search, ChevronDown, ChevronUp } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useObservacoesReport, ObservacaoReport, FaseFenologicaReport } from '@/hooks/useObservacoesReport';
import { useAplicacoesProdutos } from '@/hooks/useReportData';
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
    isLoading,
  } = useObservacoesReport();

  const { data: aplicacoes } = useAplicacoesProdutos();

  const [mudaSelecionada, setMudaSelecionada] = useState<string>('');
  const [showAllAlertas, setShowAllAlertas] = useState(false);

  // Histórico da muda selecionada
  const historicoMuda = useMemo(() => {
    if (!mudaSelecionada) return [];
    return observacoes
      .filter(o => o.muda_id === mudaSelecionada)
      .sort((a, b) => b.data.localeCompare(a.data));
  }, [mudaSelecionada, observacoes]);

  // Dados para seção comparativa Manejo × Desenvolvimento
  const dadosComparativos = useMemo(() => {
    if (alturaEvolucao.length === 0) return [];

    // Mapear aplicações por data com altura associada
    const aplicacoesPorData: Record<string, number> = {};
    if (aplicacoes) {
      aplicacoes.forEach(ap => {
        aplicacoesPorData[ap.data] = (aplicacoesPorData[ap.data] || 0) + 1;
      });
    }

    // Combinar dados de altura com aplicações
    return alturaEvolucao.map(item => ({
      data: formatDateShort(item.data),
      dataFull: item.data,
      alturaMedia: Number(item.alturaMedia.toFixed(1)),
      aplicacoes: aplicacoesPorData[item.data] || 0,
    }));
  }, [alturaEvolucao, aplicacoes]);

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
                <p className="text-sm text-muted-foreground">Altura Média</p>
                <p className="text-2xl font-bold">{resumo.alturaMedia.toFixed(1)} cm</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="animate-fade-in" style={{ animationDelay: '200ms' }}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Fase Predominante</p>
                <p className="text-lg font-bold truncate max-w-[160px]" title={resumo.fasePredominante}>
                  {resumo.fasePredominante}
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
            <CardTitle className="font-display text-lg">📈 Altura Média ao Longo do Tempo</CardTitle>
            <CardDescription>Evolução da altura com base em fases fenológicas e observações</CardDescription>
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
                    type="monotone"
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
                Sem dados de altura registrados
              </div>
            )}
          </CardContent>
        </Card>

        {/* Distribuição de Fases */}
        <Card className="animate-fade-in" style={{ animationDelay: '500ms' }}>
          <CardHeader>
            <CardTitle className="font-display text-lg">🌱 Distribuição das Fases Fenológicas</CardTitle>
            <CardDescription>Contagem de mudas por fase atual (fases_fenologicas_mudas)</CardDescription>
          </CardHeader>
          <CardContent>
            {fasesDistribuicao.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={fasesDistribuicao.map(d => ({
                  fase: d.fase.length > 15 ? d.fase.substring(0, 15) + '…' : d.fase,
                  faseFull: d.fase,
                  count: d.count,
                }))} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis type="number" className="text-sm" />
                  <YAxis dataKey="fase" type="category" className="text-sm" width={120} />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    formatter={(value: number, _: any, props: any) => [
                      `${value} mudas`,
                      props.payload.faseFull,
                    ]}
                  />
                  <Bar dataKey="count" radius={[0, 4, 4, 0]}>
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

      {/* Seção Comparativa - Manejo × Desenvolvimento */}
      {dadosComparativos.length > 0 && (
        <Card className="animate-fade-in" style={{ animationDelay: '700ms' }}>
          <CardHeader>
            <CardTitle className="font-display text-lg">🌿 Manejo × Desenvolvimento</CardTitle>
            <CardDescription>
              Relação entre aplicações de produtos e evolução de altura das mudas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={dadosComparativos}>
                <defs>
                  <linearGradient id="compAlturaGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="data" className="text-sm" />
                <YAxis yAxisId="left" className="text-sm" unit=" cm" />
                <YAxis yAxisId="right" orientation="right" className="text-sm" />
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(value: number, name: string) => {
                    if (name === 'alturaMedia') return [`${value} cm`, 'Altura média'];
                    return [`${value}`, 'Aplicações'];
                  }}
                />
                <Area
                  yAxisId="left"
                  type="monotone"
                  dataKey="alturaMedia"
                  stroke="#10b981"
                  strokeWidth={2}
                  fill="url(#compAlturaGradient)"
                  name="alturaMedia"
                />
                <Scatter
                  yAxisId="right"
                  dataKey="aplicacoes"
                  fill="#7c3aed"
                  name="aplicacoes"
                  shape="diamond"
                />
              </ComposedChart>
            </ResponsiveContainer>
            <p className="text-xs text-muted-foreground mt-2 italic">
              Linha verde: altura média (cm) · Losangos roxos: nº de aplicações de produtos na data
            </p>
          </CardContent>
        </Card>
      )}

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
                  {/* Timeline dot */}
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
            Análise automática das observações registradas
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
              . A altura média atual (baseada na observação mais recente de cada muda) é de{' '}
              <strong>{resumo.alturaMedia.toFixed(1)} cm</strong>.
            </p>

            <p className="text-foreground leading-relaxed">
              <strong>🌿 Fase Predominante:</strong> Com base nas fases fenológicas atuais
              (registros com data_fim em aberto), a fase predominante é{' '}
              <strong>{resumo.fasePredominante}</strong>
              {fasesDistribuicao.length > 0 && (
                <>, com {fasesDistribuicao[0]?.count} mudas nesta fase</>
              )}
              .
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

            {dadosComparativos.some(d => d.aplicacoes > 0) && (
              <p className="text-foreground leading-relaxed">
                <strong>📊 Manejo × Desenvolvimento:</strong> A análise comparativa correlaciona
                as aplicações de produtos com a evolução de altura das mudas, considerando alturas
                reais das observações e alturas estimadas por fase fenológica.
              </p>
            )}

            <div className="border-t border-border pt-4 mt-4">
              <p className="text-muted-foreground text-sm italic">
                * Altura média calculada pela observação mais recente de cada muda.
                Fase predominante baseada em fases_fenologicas_mudas (data_fim IS NULL).
                Distribuição de fases baseada exclusivamente na tabela de fases fenológicas.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
