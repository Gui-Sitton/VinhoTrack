import { useState } from 'react';
import { FileBarChart, TrendingUp, Leaf, FlaskConical, BarChart3 } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  producaoSafras,
  calcularTotais,
  getAplicacoesPorAno,
  getAplicacoesPorCategoria,
} from '@/data/reportData';
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
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { cn } from '@/lib/utils';

const COLORS = ['#7c3aed', '#10b981', '#f59e0b', '#ef4444'];

export default function RelatoriosPage() {
  const [relatorioGerado, setRelatorioGerado] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGerarRelatorio = () => {
    setIsGenerating(true);
    // Simula processamento
    setTimeout(() => {
      setIsGenerating(false);
      setRelatorioGerado(true);
    }, 1500);
  };

  const totais = calcularTotais();
  const aplicacoesPorAno = getAplicacoesPorAno();
  const aplicacoesPorCategoria = getAplicacoesPorCategoria();

  const producaoData = producaoSafras.map(s => ({
    ano: s.ano.toString(),
    producao: s.producaoTotal,
  }));

  const producaoMediaData = producaoSafras.map(s => ({
    ano: s.ano.toString(),
    media: s.producaoMediaPlanta,
  }));

  const volumeAplicadoData = aplicacoesPorAno.map(a => ({
    ano: a.ano.toString(),
    volume: a.total,
  }));

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="font-display text-3xl font-bold text-foreground">Relatórios</h1>
          <p className="text-muted-foreground mt-1">
            Geração automática de relatórios agronômicos e produtivos
          </p>
        </div>

        {/* Botão Principal */}
        <Card className="border-2 border-dashed border-primary/30 bg-primary/5">
          <CardContent className="py-12 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <FileBarChart className="w-8 h-8 text-primary" />
            </div>
            <h2 className="font-display text-xl font-semibold mb-2">
              Relatório Agronômico Completo
            </h2>
            <p className="text-muted-foreground mb-6 max-w-md">
              Processe os dados de produção, aplicações e desenvolvimento vegetativo dos últimos 3 anos.
            </p>
            <Button
              size="lg"
              onClick={handleGerarRelatorio}
              disabled={isGenerating}
              className="gap-2"
            >
              {isGenerating ? (
                <>
                  <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                  Processando...
                </>
              ) : (
                <>
                  <BarChart3 className="w-5 h-5" />
                  Gerar Relatório Agronômico
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Conteúdo do Relatório */}
        <div
          className={cn(
            'space-y-6 transition-all duration-500',
            relatorioGerado ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8 pointer-events-none h-0 overflow-hidden'
          )}
        >
          {/* Indicadores Rápidos */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="animate-fade-in" style={{ animationDelay: '0ms' }}>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Produção Total</p>
                    <p className="text-2xl font-bold">{totais.producaoTotal.toLocaleString()} kg</p>
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
                    <p className="text-sm text-muted-foreground">Evolução</p>
                    <p className="text-2xl font-bold text-green-600">
                      +{totais.evolucaoPercentual.toFixed(0)}%
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="animate-fade-in" style={{ animationDelay: '200ms' }}>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                    <FlaskConical className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Mais Aplicado</p>
                    <p className="text-lg font-bold">{totais.produtoMaisAplicado[0]}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="animate-fade-in" style={{ animationDelay: '300ms' }}>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                    <BarChart3 className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Melhor Safra</p>
                    <p className="text-2xl font-bold">{totais.anoMaiorProdutividade.ano}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Gráficos - Linha 1 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Gráfico de Produção por Ano */}
            <Card className="animate-fade-in" style={{ animationDelay: '400ms' }}>
              <CardHeader>
                <CardTitle className="font-display text-lg">Produção por Ano</CardTitle>
                <CardDescription>Total de produção em kg por safra</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={producaoData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="ano" className="text-sm" />
                    <YAxis className="text-sm" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                      formatter={(value: number) => [`${value.toLocaleString()} kg`, 'Produção']}
                    />
                    <Bar dataKey="producao" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Gráfico de Produção Média por Planta */}
            <Card className="animate-fade-in" style={{ animationDelay: '500ms' }}>
              <CardHeader>
                <CardTitle className="font-display text-lg">Produção Média por Planta</CardTitle>
                <CardDescription>Evolução da produtividade em kg/planta</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={producaoMediaData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="ano" className="text-sm" />
                    <YAxis className="text-sm" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                      formatter={(value: number) => [`${value.toFixed(1)} kg/planta`, 'Média']}
                    />
                    <Line
                      type="monotone"
                      dataKey="media"
                      stroke="hsl(var(--primary))"
                      strokeWidth={3}
                      dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Gráficos - Linha 2 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Gráfico de Pizza - Aplicações por Categoria */}
            <Card className="animate-fade-in" style={{ animationDelay: '600ms' }}>
              <CardHeader>
                <CardTitle className="font-display text-lg">Aplicações por Categoria</CardTitle>
                <CardDescription>Distribuição de produtos aplicados</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie
                      data={aplicacoesPorCategoria}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={2}
                      dataKey="total"
                      nameKey="categoria"
                      label={({ categoria, percent }) =>
                        `${categoria} ${(percent * 100).toFixed(0)}%`
                      }
                      labelLine={false}
                    >
                      {aplicacoesPorCategoria.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                      formatter={(value: number) => [`${value.toFixed(1)} kg/L`, 'Quantidade']}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Gráfico de Volume Aplicado por Ano */}
            <Card className="animate-fade-in" style={{ animationDelay: '700ms' }}>
              <CardHeader>
                <CardTitle className="font-display text-lg">Volume Aplicado por Ano</CardTitle>
                <CardDescription>Total de produtos aplicados (kg + L)</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={volumeAplicadoData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="ano" className="text-sm" />
                    <YAxis className="text-sm" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                      formatter={(value: number) => [`${value.toFixed(1)} kg/L`, 'Volume']}
                    />
                    <Bar dataKey="volume" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Resumo Textual */}
          <Card className="animate-fade-in" style={{ animationDelay: '800ms' }}>
            <CardHeader>
              <CardTitle className="font-display text-lg">Resumo Agronômico</CardTitle>
              <CardDescription>Análise automática dos dados do período 2023-2025</CardDescription>
            </CardHeader>
            <CardContent className="prose prose-sm max-w-none">
              <div className="bg-muted/50 rounded-lg p-6 space-y-4">
                <p className="text-foreground leading-relaxed">
                  <strong>📊 Produção Total no Período:</strong> A produção acumulada das safras de 2023 a 2025 
                  totalizou <strong>{totais.producaoTotal.toLocaleString()} kg</strong> de uva Marselan, 
                  distribuídos em 50 plantas produtivas.
                </p>
                
                <p className="text-foreground leading-relaxed">
                  <strong>📈 Evolução da Produtividade:</strong> Observou-se um crescimento de{' '}
                  <strong className="text-green-600">+{totais.evolucaoPercentual.toFixed(0)}%</strong>{' '}
                  na produção total entre 2023 e 2025, demonstrando a maturação do vinhedo e a eficácia 
                  das práticas de manejo adotadas.
                </p>

                <p className="text-foreground leading-relaxed">
                  <strong>🏆 Safra de Destaque:</strong> O ano de{' '}
                  <strong>{totais.anoMaiorProdutividade.ano}</strong> apresentou a maior produtividade 
                  média por planta, atingindo{' '}
                  <strong>{totais.anoMaiorProdutividade.producaoMediaPlanta.toFixed(1)} kg/planta</strong>.
                </p>

                <p className="text-foreground leading-relaxed">
                  <strong>🧪 Manejo Fitossanitário:</strong> A categoria de produtos mais aplicada no 
                  período foi <strong>{totais.produtoMaisAplicado[0]}</strong>, totalizando{' '}
                  <strong>{totais.produtoMaisAplicado[1].toFixed(1)} kg/L</strong>, seguida por 
                  aplicações regulares de fertilizantes para manutenção nutricional.
                </p>

                <div className="border-t border-border pt-4 mt-4">
                  <p className="text-muted-foreground text-sm italic">
                    * Relatório gerado automaticamente com base nos dados registrados. 
                    Para análises mais detalhadas, consulte o histórico individual de cada muda.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
