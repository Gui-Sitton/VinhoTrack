import { useState, useMemo } from 'react';
import { Leaf, TrendingUp, Calendar, Droplets, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTalhoes } from '@/hooks/useMudas';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ComposedChart,
  Line,
  Scatter,
  Area,
} from 'recharts';

const tooltipStyle = {
  backgroundColor: 'hsl(var(--card))',
  border: '1px solid hsl(var(--border))',
  borderRadius: '8px',
};

function formatDate(dateStr: string) {
  return format(new Date(dateStr + 'T12:00:00'), 'dd/MM/yyyy', { locale: ptBR });
}

function formatDateShort(dateStr: string) {
  return format(new Date(dateStr + 'T12:00:00'), 'dd/MM', { locale: ptBR });
}

interface ViewRow {
  talhao_id: string;
  data_evento: string;
  altura_media_cm: number | null;
  num_aplicacoes: number | null;
  quantidade_total: number | null;
}

export default function ObservacoesReport() {
  const { data: talhoes, isLoading: talhoesLoading } = useTalhoes();
  const [talhaoSelecionado, setTalhaoSelecionado] = useState<string>('');

  // Auto-select first talhão
  useMemo(() => {
    if (talhoes && talhoes.length > 0 && !talhaoSelecionado) {
      setTalhaoSelecionado(talhoes[0].id);
    }
  }, [talhoes, talhaoSelecionado]);

  // Single query to the view
  const { data: viewData, isLoading: viewLoading } = useQuery({
    queryKey: ['view-manejo-desenvolvimento', talhaoSelecionado],
    queryFn: async () => {
      if (!talhaoSelecionado) return [];
      const { data, error } = await supabase
        .from('view_manejo_desenvolvimento_talhao')
        .select('*')
        .eq('talhao_id', talhaoSelecionado)
        .order('data_evento', { ascending: true });
      if (error) throw error;
      return (data || []) as ViewRow[];
    },
    enabled: !!talhaoSelecionado,
  });

  const isLoading = talhoesLoading || viewLoading;

  // Process data from view
  const processedData = useMemo(() => {
    if (!viewData || viewData.length === 0) {
      return {
        chartData: [],
        alturaInicial: 0,
        alturaAtual: 0,
        totalAplicacoes: 0,
        quantidadeTotal: 0,
        periodoInicio: null as string | null,
        periodoFim: null as string | null,
        diasSemManejo: 0,
        crescimentoAposAplicacao: [] as { data: string; crescimento: number }[],
      };
    }

    const chartData = viewData.map(row => ({
      data: formatDateShort(row.data_evento),
      dataFull: row.data_evento,
      altura: row.altura_media_cm ? Number(row.altura_media_cm) : null,
      numAplicacoes: Number(row.num_aplicacoes || 0),
      quantidadeTotal: Number(row.quantidade_total || 0),
      // For scatter: only show point when there are applications
      aplicacaoPonto: Number(row.num_aplicacoes || 0) > 0
        ? (row.altura_media_cm ? Number(row.altura_media_cm) : 0)
        : null,
      tamanho: Number(row.num_aplicacoes || 0) > 0
        ? Math.max(60, Math.min(300, Number(row.quantidade_total || 0) * 3))
        : 0,
    }));

    const alturas = viewData.filter(r => r.altura_media_cm !== null).map(r => Number(r.altura_media_cm));
    const alturaInicial = alturas.length > 0 ? alturas[0] : 0;
    const alturaAtual = alturas.length > 0 ? alturas[alturas.length - 1] : 0;

    const totalAplicacoes = viewData.reduce((acc, r) => acc + Number(r.num_aplicacoes || 0), 0);
    const quantidadeTotal = viewData.reduce((acc, r) => acc + Number(r.quantidade_total || 0), 0);

    const periodoInicio = viewData[0]?.data_evento || null;
    const periodoFim = viewData[viewData.length - 1]?.data_evento || null;

    // Identify periods without management
    let maxGap = 0;
    const datasComAplicacao = viewData.filter(r => Number(r.num_aplicacoes || 0) > 0);
    for (let i = 1; i < datasComAplicacao.length; i++) {
      const prev = new Date(datasComAplicacao[i - 1].data_evento + 'T00:00:00');
      const curr = new Date(datasComAplicacao[i].data_evento + 'T00:00:00');
      const gap = Math.round((curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24));
      if (gap > maxGap) maxGap = gap;
    }

    // Detect growth after applications
    const crescimentoAposAplicacao: { data: string; crescimento: number }[] = [];
    for (let i = 0; i < viewData.length; i++) {
      if (Number(viewData[i].num_aplicacoes || 0) > 0) {
        // Find next height point
        for (let j = i + 1; j < viewData.length; j++) {
          if (viewData[j].altura_media_cm !== null && viewData[i].altura_media_cm !== null) {
            const crescimento = Number(viewData[j].altura_media_cm) - Number(viewData[i].altura_media_cm);
            if (crescimento > 0) {
              crescimentoAposAplicacao.push({
                data: viewData[i].data_evento,
                crescimento,
              });
            }
            break;
          }
        }
      }
    }

    return {
      chartData,
      alturaInicial,
      alturaAtual,
      totalAplicacoes,
      quantidadeTotal,
      periodoInicio,
      periodoFim,
      diasSemManejo: maxGap,
      crescimentoAposAplicacao,
    };
  }, [viewData]);

  const talhaoNome = useMemo(() => {
    if (!talhoes || !talhaoSelecionado) return '';
    const t = talhoes.find(t => t.id === talhaoSelecionado);
    return t?.nome || t?.codigo || '';
  }, [talhoes, talhaoSelecionado]);

  if (isLoading && !viewData) {
    return (
      <Card>
        <CardContent className="py-12 flex flex-col items-center justify-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-muted-foreground">Carregando dados de observações...</p>
        </CardContent>
      </Card>
    );
  }

  if (!talhoes || talhoes.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 flex flex-col items-center justify-center text-center">
          <Leaf className="w-12 h-12 text-muted-foreground mb-4" />
          <h3 className="font-display text-lg font-semibold mb-2">Sem Talhões Cadastrados</h3>
          <p className="text-muted-foreground max-w-md">
            Cadastre talhões e registre fases fenológicas para gerar o relatório.
          </p>
        </CardContent>
      </Card>
    );
  }

  const { chartData, alturaInicial, alturaAtual, totalAplicacoes, quantidadeTotal, periodoInicio, periodoFim, diasSemManejo, crescimentoAposAplicacao } = processedData;

  return (
    <div className="space-y-6">
      {/* Seletor de Talhão */}
      <Card className="animate-fade-in">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium text-foreground whitespace-nowrap">Talhão:</label>
            <Select value={talhaoSelecionado} onValueChange={setTalhaoSelecionado}>
              <SelectTrigger className="w-full md:w-80">
                <SelectValue placeholder="Selecionar talhão..." />
              </SelectTrigger>
              <SelectContent>
                {talhoes.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.nome || t.codigo} — {t.variedade}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Indicadores Rápidos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="animate-fade-in" style={{ animationDelay: '0ms' }}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Altura Atual</p>
                <p className="text-2xl font-bold">{alturaAtual.toFixed(1)} cm</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="animate-fade-in" style={{ animationDelay: '100ms' }}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                <Leaf className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Crescimento Total</p>
                <p className="text-2xl font-bold">{(alturaAtual - alturaInicial).toFixed(1)} cm</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="animate-fade-in" style={{ animationDelay: '200ms' }}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <Droplets className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Aplicações</p>
                <p className="text-2xl font-bold">{totalAplicacoes}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="animate-fade-in" style={{ animationDelay: '300ms' }}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pontos no Gráfico</p>
                <p className="text-2xl font-bold">{chartData.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico Principal Combinado */}
      <Card className="animate-fade-in" style={{ animationDelay: '400ms' }}>
        <CardHeader>
          <CardTitle className="font-display text-lg">📈 Crescimento × Manejo no Tempo — {talhaoNome}</CardTitle>
          <CardDescription>
            Linha contínua: altura média do talhão (cm) · Pontos roxos: aplicações de produtos (tamanho = quantidade)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={350}>
              <ComposedChart data={chartData}>
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
                  content={({ active, payload, label }) => {
                    if (!active || !payload || payload.length === 0) return null;
                    const row = payload[0]?.payload;
                    if (!row) return null;
                    return (
                      <div className="rounded-lg border bg-card px-3 py-2 text-xs shadow-xl space-y-1">
                        <p className="font-medium">{row.dataFull ? formatDate(row.dataFull) : label}</p>
                        {row.altura !== null && (
                          <p className="text-green-600">Altura média: {row.altura} cm</p>
                        )}
                        {row.numAplicacoes > 0 && (
                          <>
                            <p className="text-purple-600">Aplicações: {row.numAplicacoes}</p>
                            <p className="text-purple-600">Quantidade total: {row.quantidadeTotal.toFixed(1)}</p>
                          </>
                        )}
                      </div>
                    );
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="altura"
                  stroke="#10b981"
                  strokeWidth={2}
                  fill="url(#alturaGradient)"
                  dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                  connectNulls
                  name="Altura média"
                />
                <Scatter
                  dataKey="aplicacaoPonto"
                  fill="#7c3aed"
                  name="Aplicações"
                  shape={(props: any) => {
                    const { cx, cy, payload } = props;
                    if (!payload?.aplicacaoPonto) return null;
                    const r = Math.max(5, Math.min(15, (payload.quantidadeTotal || 1) * 0.2));
                    return (
                      <circle
                        cx={cx}
                        cy={cy}
                        r={r}
                        fill="#7c3aed"
                        fillOpacity={0.7}
                        stroke="#7c3aed"
                        strokeWidth={1}
                      />
                    );
                  }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[350px] flex items-center justify-center text-muted-foreground">
              Sem dados para o talhão selecionado
            </div>
          )}
        </CardContent>
      </Card>

      {/* Resumo Textual */}
      <Card className="animate-fade-in" style={{ animationDelay: '500ms' }}>
        <CardHeader>
          <CardTitle className="font-display text-lg">📊 Resumo Analítico — {talhaoNome}</CardTitle>
          <CardDescription>
            Análise automática baseada na view agregada por talhão
          </CardDescription>
        </CardHeader>
        <CardContent className="prose prose-sm max-w-none">
          <div className="bg-muted/50 rounded-lg p-6 space-y-4">
            <p className="text-foreground leading-relaxed">
              <strong>🌱 Desenvolvimento:</strong>{' '}
              {periodoInicio && periodoFim ? (
                <>
                  O talhão <strong>{talhaoNome}</strong> foi acompanhado entre{' '}
                  <strong>{formatDate(periodoInicio)}</strong> e{' '}
                  <strong>{formatDate(periodoFim)}</strong>.
                </>
              ) : (
                <>O talhão <strong>{talhaoNome}</strong> ainda não possui registros.</>
              )}{' '}
              A altura inicial registrada foi de <strong>{alturaInicial.toFixed(1)} cm</strong>,
              evoluindo para <strong>{alturaAtual.toFixed(1)} cm</strong> atualmente,
              representando um crescimento de <strong>{(alturaAtual - alturaInicial).toFixed(1)} cm</strong> no período.
            </p>

            <p className="text-foreground leading-relaxed">
              <strong>💊 Manejo:</strong> Foram realizadas{' '}
              <strong>{totalAplicacoes} aplicações</strong> de produtos no período,
              com um volume total de <strong>{quantidadeTotal.toFixed(1)} unidades</strong>.
              {diasSemManejo > 0 && (
                <> O maior intervalo sem manejo foi de <strong>{diasSemManejo} dias</strong>.</>
              )}
            </p>

            {crescimentoAposAplicacao.length > 0 && (
              <p className="text-foreground leading-relaxed">
                <strong>📈 Resposta ao Manejo:</strong> Foram observados{' '}
                <strong>{crescimentoAposAplicacao.length} episódios</strong> de crescimento
                logo após aplicações de produtos, sugerindo resposta positiva do vinhedo ao manejo realizado.
              </p>
            )}

            <div className="border-t border-border pt-4 mt-4">
              <p className="text-muted-foreground text-sm italic">
                * Dados obtidos exclusivamente da view view_manejo_desenvolvimento_talhao,
                agregados por talhão e data. Cada ponto representa um dia com evento relevante (mudança de fase ou aplicação).
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
