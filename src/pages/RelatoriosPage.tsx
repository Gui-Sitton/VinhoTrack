import { useState, useMemo } from 'react';
import { FileBarChart, TrendingUp, Leaf, FlaskConical, BarChart3, Filter, X, Loader2, Database } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useReportData, AplicacaoProduto } from '@/hooks/useReportData';
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

const COLORS = ['#7c3aed', '#10b981', '#f59e0b', '#ef4444', '#6366f1'];
const CATEGORIAS_DEFAULT: AplicacaoProduto['categoria'][] = ['Fungicida', 'Fertilizante', 'Corretivo', 'Inseticida'];

export default function RelatoriosPage() {
  const [relatorioGerado, setRelatorioGerado] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  
  const { 
    producaoSafras, 
    aplicacoesProdutos, 
    anosDisponiveis, 
    categoriasDisponiveis,
    isLoading,
    hasData 
  } = useReportData();

  // Filtros
  const [anosSelecionados, setAnosSelecionados] = useState<number[]>([]);
  const [categoriasSelecionadas, setCategoriasSelecionadas] = useState<AplicacaoProduto['categoria'][]>([]);

  // Inicializar filtros quando os dados carregarem
  useMemo(() => {
    if (anosDisponiveis.length > 0 && anosSelecionados.length === 0) {
      setAnosSelecionados(anosDisponiveis);
    }
    if (categoriasDisponiveis.length > 0 && categoriasSelecionadas.length === 0) {
      setCategoriasSelecionadas(categoriasDisponiveis);
    }
  }, [anosDisponiveis, categoriasDisponiveis]);

  const handleGerarRelatorio = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      setRelatorioGerado(true);
    }, 1500);
  };

  const toggleAno = (ano: number) => {
    setAnosSelecionados(prev => 
      prev.includes(ano) 
        ? prev.filter(a => a !== ano)
        : [...prev, ano].sort()
    );
  };

  const toggleCategoria = (categoria: AplicacaoProduto['categoria']) => {
    setCategoriasSelecionadas(prev =>
      prev.includes(categoria)
        ? prev.filter(c => c !== categoria)
        : [...prev, categoria]
    );
  };

  const limparFiltros = () => {
    setAnosSelecionados(anosDisponiveis);
    setCategoriasSelecionadas(categoriasDisponiveis);
  };

  // Categorias para exibição (usar default se não houver dados)
  const categoriasParaExibir = categoriasDisponiveis.length > 0 ? categoriasDisponiveis : CATEGORIAS_DEFAULT;
  const anosParaExibir = anosDisponiveis.length > 0 ? anosDisponiveis : [new Date().getFullYear()];

  // Dados filtrados
  const dadosFiltrados = useMemo(() => {
    const anosParaFiltrar = anosSelecionados.length > 0 ? anosSelecionados : anosParaExibir;
    const categoriasParaFiltrar = categoriasSelecionadas.length > 0 ? categoriasSelecionadas : categoriasParaExibir;

    const producaoFiltrada = producaoSafras.filter(s => anosParaFiltrar.includes(s.ano));
    const aplicacoesFiltradas = aplicacoesProdutos.filter(
      ap => anosParaFiltrar.includes(ap.ano) && categoriasParaFiltrar.includes(ap.categoria)
    );

    const producaoTotal = producaoFiltrada.reduce((acc, s) => acc + s.producaoTotal, 0);
    const primeiroAno = producaoFiltrada[0];
    const ultimoAno = producaoFiltrada[producaoFiltrada.length - 1];
    const evolucaoPercentual = primeiroAno && ultimoAno && primeiroAno !== ultimoAno
      ? ((ultimoAno.producaoTotal - primeiroAno.producaoTotal) / primeiroAno.producaoTotal) * 100
      : 0;

    const aplicacoesPorCategoriaCalc = aplicacoesFiltradas.reduce((acc, ap) => {
      acc[ap.categoria] = (acc[ap.categoria] || 0) + ap.quantidade;
      return acc;
    }, {} as Record<string, number>);

    const produtoMaisAplicado = Object.entries(aplicacoesPorCategoriaCalc)
      .sort((a, b) => b[1] - a[1])[0] || ['N/A', 0];

    const anoMaiorProdutividade = [...producaoFiltrada]
      .sort((a, b) => b.producaoMediaPlanta - a.producaoMediaPlanta)[0];

    const aplicacoesPorAno = anosParaFiltrar.map(ano => {
      const aplicacoesAno = aplicacoesFiltradas.filter(ap => ap.ano === ano);
      const total = aplicacoesAno.reduce((acc, ap) => acc + ap.quantidade, 0);
      return { ano, total };
    });

    const aplicacoesPorCategoria = categoriasParaFiltrar.map(categoria => {
      const total = aplicacoesFiltradas
        .filter(ap => ap.categoria === categoria)
        .reduce((acc, ap) => acc + ap.quantidade, 0);
      return { categoria, total };
    }).filter(c => c.total > 0);

    return {
      producaoFiltrada,
      aplicacoesFiltradas,
      producaoTotal,
      evolucaoPercentual,
      produtoMaisAplicado,
      anoMaiorProdutividade,
      aplicacoesPorAno,
      aplicacoesPorCategoria,
    };
  }, [anosSelecionados, categoriasSelecionadas, producaoSafras, aplicacoesProdutos, anosParaExibir, categoriasParaExibir]);

  const producaoData = dadosFiltrados.producaoFiltrada.map(s => ({
    ano: s.ano.toString(),
    producao: s.producaoTotal,
  }));

  const producaoMediaData = dadosFiltrados.producaoFiltrada.map(s => ({
    ano: s.ano.toString(),
    media: s.producaoMediaPlanta,
  }));

  const volumeAplicadoData = dadosFiltrados.aplicacoesPorAno.map(a => ({
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

        {/* Loading State */}
        {isLoading && (
          <Card>
            <CardContent className="py-12 flex flex-col items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
              <p className="text-muted-foreground">Carregando dados...</p>
            </CardContent>
          </Card>
        )}

        {/* Botão Principal */}
        {!isLoading && (
          <Card className="border-2 border-dashed border-primary/30 bg-primary/5">
            <CardContent className="py-12 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                {hasData ? (
                  <FileBarChart className="w-8 h-8 text-primary" />
                ) : (
                  <Database className="w-8 h-8 text-muted-foreground" />
                )}
              </div>
              <h2 className="font-display text-xl font-semibold mb-2">
                {hasData ? 'Relatório Agronômico Completo' : 'Sem Dados de Produção'}
              </h2>
              <p className="text-muted-foreground mb-6 max-w-md">
                {hasData 
                  ? 'Processe os dados de produção, aplicações e desenvolvimento vegetativo.'
                  : 'Não há dados de produção ou aplicações cadastrados. Cadastre safras e aplicações para gerar relatórios.'}
              </p>
              <Button
                size="lg"
                onClick={handleGerarRelatorio}
                disabled={isGenerating || !hasData}
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
        )}

        {/* Filtros */}
        {!isLoading && hasData && (
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Filter className="w-5 h-5 text-primary" />
                  <CardTitle className="font-display text-lg">Filtros do Relatório</CardTitle>
                </div>
                {(anosSelecionados.length < anosParaExibir.length || categoriasSelecionadas.length < categoriasParaExibir.length) && (
                  <Button variant="ghost" size="sm" onClick={limparFiltros} className="gap-1">
                    <X className="w-4 h-4" />
                    Limpar filtros
                  </Button>
                )}
              </div>
              <CardDescription>Selecione os anos e categorias para personalizar o relatório</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Filtro por Ano */}
              <div className="space-y-2">
                <p className="text-sm font-medium text-foreground">Anos</p>
                <div className="flex flex-wrap gap-2">
                  {anosParaExibir.map(ano => (
                    <Badge
                      key={ano}
                      variant={anosSelecionados.includes(ano) ? 'default' : 'outline'}
                      className={cn(
                        'cursor-pointer transition-all hover:scale-105',
                        anosSelecionados.includes(ano) 
                          ? 'bg-primary hover:bg-primary/90' 
                          : 'hover:bg-primary/10'
                      )}
                      onClick={() => toggleAno(ano)}
                    >
                      {ano}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Filtro por Categoria */}
              <div className="space-y-2">
                <p className="text-sm font-medium text-foreground">Categorias de Produtos</p>
                <div className="flex flex-wrap gap-2">
                  {categoriasParaExibir.map((categoria, index) => (
                    <Badge
                      key={categoria}
                      variant={categoriasSelecionadas.includes(categoria) ? 'default' : 'outline'}
                      className={cn(
                        'cursor-pointer transition-all hover:scale-105',
                        categoriasSelecionadas.includes(categoria)
                          ? ''
                          : 'hover:bg-primary/10'
                      )}
                      style={{
                        backgroundColor: categoriasSelecionadas.includes(categoria) 
                          ? COLORS[index % COLORS.length] 
                          : undefined,
                        borderColor: !categoriasSelecionadas.includes(categoria) 
                          ? COLORS[index % COLORS.length] 
                          : undefined,
                        color: categoriasSelecionadas.includes(categoria) 
                          ? 'white' 
                          : COLORS[index % COLORS.length],
                      }}
                      onClick={() => toggleCategoria(categoria)}
                    >
                      {categoria}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Resumo dos filtros */}
              <div className="pt-2 border-t border-border">
                <p className="text-sm text-muted-foreground">
                  {anosSelecionados.length} ano(s) · {categoriasSelecionadas.length} categoria(s) selecionada(s)
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Conteúdo do Relatório */}
        <div
          className={cn(
            'space-y-6 transition-all duration-500',
            relatorioGerado && hasData ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8 pointer-events-none h-0 overflow-hidden'
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
                    <p className="text-2xl font-bold">{dadosFiltrados.producaoTotal.toLocaleString()} kg</p>
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
                      {dadosFiltrados.evolucaoPercentual >= 0 ? '+' : ''}{dadosFiltrados.evolucaoPercentual.toFixed(0)}%
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
                    <p className="text-lg font-bold">{dadosFiltrados.produtoMaisAplicado[0]}</p>
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
                    <p className="text-2xl font-bold">{dadosFiltrados.anoMaiorProdutividade?.ano || '-'}</p>
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
                {producaoData.length > 0 ? (
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
                ) : (
                  <div className="h-[280px] flex items-center justify-center text-muted-foreground">
                    Sem dados de produção cadastrados
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Gráfico de Produção Média por Planta */}
            <Card className="animate-fade-in" style={{ animationDelay: '500ms' }}>
              <CardHeader>
                <CardTitle className="font-display text-lg">Produção Média por Planta</CardTitle>
                <CardDescription>Evolução da produtividade em kg/planta</CardDescription>
              </CardHeader>
              <CardContent>
                {producaoMediaData.length > 0 ? (
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
                ) : (
                  <div className="h-[280px] flex items-center justify-center text-muted-foreground">
                    Sem dados de produção cadastrados
                  </div>
                )}
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
                {dadosFiltrados.aplicacoesPorCategoria.length > 0 ? (
                  <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                      <Pie
                        data={dadosFiltrados.aplicacoesPorCategoria}
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
                        {dadosFiltrados.aplicacoesPorCategoria.map((entry, index) => (
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
                ) : (
                  <div className="h-[280px] flex items-center justify-center text-muted-foreground">
                    Sem dados de aplicações cadastrados
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Gráfico de Volume Aplicado por Ano */}
            <Card className="animate-fade-in" style={{ animationDelay: '700ms' }}>
              <CardHeader>
                <CardTitle className="font-display text-lg">Volume Aplicado por Ano</CardTitle>
                <CardDescription>Total de produtos aplicados (kg + L)</CardDescription>
              </CardHeader>
              <CardContent>
                {volumeAplicadoData.some(d => d.volume > 0) ? (
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
                ) : (
                  <div className="h-[280px] flex items-center justify-center text-muted-foreground">
                    Sem dados de aplicações cadastrados
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Resumo Textual */}
          <Card className="animate-fade-in" style={{ animationDelay: '800ms' }}>
            <CardHeader>
              <CardTitle className="font-display text-lg">Resumo Agronômico</CardTitle>
              <CardDescription>
                Análise automática dos dados do período {anosSelecionados.length > 0 ? `${Math.min(...anosSelecionados)}-${Math.max(...anosSelecionados)}` : 'selecionado'}
              </CardDescription>
            </CardHeader>
            <CardContent className="prose prose-sm max-w-none">
              <div className="bg-muted/50 rounded-lg p-6 space-y-4">
                {dadosFiltrados.producaoTotal > 0 ? (
                  <>
                    <p className="text-foreground leading-relaxed">
                      <strong>📊 Produção Total no Período:</strong> A produção acumulada das safras selecionadas 
                      totalizou <strong>{dadosFiltrados.producaoTotal.toLocaleString()} kg</strong> de uva.
                    </p>
                    
                    {dadosFiltrados.producaoFiltrada.length > 1 && (
                      <p className="text-foreground leading-relaxed">
                        <strong>📈 Evolução da Produtividade:</strong> Observou-se um crescimento de{' '}
                        <strong className={dadosFiltrados.evolucaoPercentual >= 0 ? 'text-green-600' : 'text-red-600'}>
                          {dadosFiltrados.evolucaoPercentual >= 0 ? '+' : ''}{dadosFiltrados.evolucaoPercentual.toFixed(0)}%
                        </strong>{' '}
                        na produção total no período selecionado.
                      </p>
                    )}

                    {dadosFiltrados.anoMaiorProdutividade && (
                      <p className="text-foreground leading-relaxed">
                        <strong>🏆 Safra de Destaque:</strong> O ano de{' '}
                        <strong>{dadosFiltrados.anoMaiorProdutividade.ano}</strong> apresentou a maior produtividade 
                        média por planta, atingindo{' '}
                        <strong>{dadosFiltrados.anoMaiorProdutividade.producaoMediaPlanta.toFixed(1)} kg/planta</strong>.
                      </p>
                    )}
                  </>
                ) : (
                  <p className="text-muted-foreground leading-relaxed">
                    Não há dados de produção cadastrados para o período selecionado.
                  </p>
                )}

                {dadosFiltrados.produtoMaisAplicado[0] !== 'N/A' && (
                  <p className="text-foreground leading-relaxed">
                    <strong>🧪 Manejo Fitossanitário:</strong> A categoria de produtos mais aplicada no 
                    período foi <strong>{dadosFiltrados.produtoMaisAplicado[0]}</strong>, totalizando{' '}
                    <strong>{Number(dadosFiltrados.produtoMaisAplicado[1]).toFixed(1)} kg/L</strong>.
                  </p>
                )}

                <div className="border-t border-border pt-4 mt-4">
                  <p className="text-muted-foreground text-sm italic">
                    * Relatório gerado automaticamente com base nos dados registrados no banco de dados.
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
