import { useState, useMemo, useRef } from 'react';
import { FileBarChart, TrendingUp, Leaf, FlaskConical, BarChart3, Filter, X, Loader2, Database, Droplet, ImageDown } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useReportData, AplicacaoProduto } from '@/hooks/useReportData';
import { useIrrigacoesReport } from '@/hooks/useIrrigacoes';
import ObservacoesReport from '@/components/relatorios/ObservacoesReport';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
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

const COLORS = ['#7c3aed', '#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#6366f1'];
const CATEGORIAS_DEFAULT: AplicacaoProduto['categoria'][] = ['Fungicida', 'Fertilizante', 'Corretivo', 'Inseticida', 'Adjuvante'];

const tooltipStyle = {
  backgroundColor: 'hsl(var(--card))',
  border: '1px solid hsl(var(--border))',
  borderRadius: '8px',
};

export default function RelatoriosPage() {
  const [relatorioGerado, setRelatorioGerado] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState('aplicacoes');

  const relatorioRef = useRef<HTMLDivElement | null>(null);
  const graficoProducaoAnoRef = useRef<HTMLDivElement | null>(null);
  const graficoProducaoMediaRef = useRef<HTMLDivElement | null>(null);
  const graficoAplicacoesCategoriaRef = useRef<HTMLDivElement | null>(null);
  const graficoVolumeAplicadoRef = useRef<HTMLDivElement | null>(null);
  const graficoIrrigacaoAnoRef = useRef<HTMLDivElement | null>(null);
  const graficoIrrigacaoTalhaoRef = useRef<HTMLDivElement | null>(null);
  
  const { 
    producaoSafras, 
    aplicacoesProdutos, 
    anosDisponiveis, 
    categoriasDisponiveis,
    isLoading,
    hasData 
  } = useReportData();

  const { data: irrigacaoData, isLoading: irrigacaoLoading } = useIrrigacoesReport();

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

  const slugificar = (texto: string) =>
    texto
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

  const gerarNomeArquivo = (prefixo: string, extensao: string) => {
    const hoje = new Date().toISOString().slice(0, 10);
    return `${prefixo}-${hoje}.${extensao}`;
  };

  const escaparCSV = (valor: unknown): string => {
    if (valor === null || valor === undefined) return '';
    const texto = String(valor);
    if (/[",\n]/.test(texto)) {
      return `"${texto.replace(/"/g, '""')}"`;
    }
    return texto;
  };

  const handleDownloadCSV = () => {
    if (!relatorioGerado || !hasData) return;

    const linhas: string[] = [];

    linhas.push([
      'tipo_registro',
      'ano',
      'data',
      'categoria',
      'produto',
      'quantidade',
      'unidade',
      'motivo',
      'producao_total_kg',
      'producao_media_kg_planta',
      'plantas_produtivas',
      'irrigacao_volume_total_l',
      'irrigacao_eventos',
      'irrigacao_talhao',
    ].join(','));

    dadosFiltrados.producaoFiltrada.forEach((s) => {
      linhas.push([
        escaparCSV('producao'),
        escaparCSV(s.ano),
        '',
        '',
        '',
        '',
        '',
        '',
        escaparCSV(s.producaoTotal),
        escaparCSV(s.producaoMediaPlanta.toFixed(3)),
        escaparCSV(s.plantasProdutivas),
        '',
        '',
        '',
      ].join(','));
    });

    dadosFiltrados.aplicacoesFiltradas.forEach((ap) => {
      linhas.push([
        escaparCSV('aplicacao'),
        escaparCSV(ap.ano),
        escaparCSV(ap.data),
        escaparCSV(ap.categoria),
        escaparCSV(ap.produto),
        escaparCSV(ap.quantidade),
        escaparCSV(ap.unidade),
        escaparCSV(ap.finalidade),
        '',
        '',
        '',
        '',
        '',
        '',
      ].join(','));
    });

    if (irrigacaoData) {
      irrigacaoData.volumePorAno.forEach((d) => {
        linhas.push([
          escaparCSV('irrigacao_ano'),
          escaparCSV(d.ano),
          '',
          '',
          '',
          '',
          '',
          '',
          '',
          '',
          '',
          escaparCSV(d.volume),
          escaparCSV(irrigacaoData.totalEventos),
          '',
        ].join(','));
      });

      irrigacaoData.volumePorTalhao.forEach((d) => {
        linhas.push([
          escaparCSV('irrigacao_talhao'),
          '',
          '',
          '',
          '',
          '',
          '',
          '',
          '',
          '',
          '',
          escaparCSV(d.volume),
          '',
          escaparCSV(d.talhaoNome),
        ].join(','));
      });
    }

    const conteudo = linhas.join('\n');
    const blob = new Blob([conteudo], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = gerarNomeArquivo('report', 'csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDownloadPDF = async () => {
    if (!relatorioRef.current) return;

    const elemento = relatorioRef.current;
    const canvas = await html2canvas(elemento, { scale: 2 });
    const imgData = canvas.toDataURL('image/png');

    const pdf = new jsPDF('p', 'mm', 'a4');
    const larguraPdf = pdf.internal.pageSize.getWidth();
    const alturaPdf = (canvas.height * larguraPdf) / canvas.width;

    pdf.addImage(imgData, 'PNG', 0, 0, larguraPdf, alturaPdf);
    pdf.save(gerarNomeArquivo('report', 'pdf'));
  };

  const handleDownloadGrafico = async (
    ref: React.RefObject<HTMLDivElement>,
    nomeGrafico: string,
  ) => {
    if (!ref.current) return;

    const canvas = await html2canvas(ref.current, { scale: 2 });
    const imgData = canvas.toDataURL('image/png');

    const link = document.createElement('a');
    link.href = imgData;
    link.download = gerarNomeArquivo(`chart-${slugificar(nomeGrafico)}`, 'png');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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

    const aplicacoesPorCategoria = categoriasParaFiltrar
      .map(categoria => {
        const total = aplicacoesFiltradas
          .filter(ap => ap.categoria === categoria)
          .reduce((acc, ap) => acc + ap.quantidade, 0);
        return { categoria, total };
      })
      .filter(c => c.total > 0);

    const detalhamentoPorCategoria = categoriasParaFiltrar
      .map((categoria) => {
        const aplicacoesCategoria = aplicacoesFiltradas.filter(ap => ap.categoria === categoria);

        if (aplicacoesCategoria.length === 0) {
          return null;
        }

        const quantidadePorProduto = aplicacoesCategoria.reduce((acc, ap) => {
          const chave = ap.produto;
          if (!acc[chave]) {
            acc[chave] = {
              quantidade: 0,
              unidade: ap.unidade,
            };
          }
          acc[chave].quantidade += ap.quantidade;
          return acc;
        }, {} as Record<string, { quantidade: number; unidade: string }>);

        const entradaMaisAplicada = Object.entries(quantidadePorProduto)
          .sort((a, b) => b[1].quantidade - a[1].quantidade)[0];

        if (!entradaMaisAplicada) {
          return null;
        }

        const [produtoNome, dados] = entradaMaisAplicada;

        return {
          categoria,
          produto: produtoNome,
          quantidade: dados.quantidade,
          unidade: dados.unidade,
        };
      })
      .filter((item): item is {
        categoria: AplicacaoProduto['categoria'];
        produto: string;
        quantidade: number;
        unidade: string;
      } => item !== null);

    return {
      producaoFiltrada,
      aplicacoesFiltradas,
      producaoTotal,
      evolucaoPercentual,
      produtoMaisAplicado,
      anoMaiorProdutividade,
      aplicacoesPorAno,
      aplicacoesPorCategoria,
      detalhamentoPorCategoria,
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

  const adjuvantesAplicacoes = dadosFiltrados.aplicacoesFiltradas.filter(ap => ap.categoria === 'Adjuvante');
  const totalAdjuvantesQuantidade = adjuvantesAplicacoes.reduce((acc, ap) => acc + ap.quantidade, 0);
  const totalAplicacoesAdjuvantes = adjuvantesAplicacoes.length;

  return (
    <MainLayout>
      <div className="space-y-6" ref={relatorioRef}>
        {/* Header */}
        <div>
          <h1 className="font-display text-3xl font-bold text-foreground">Relatórios</h1>
          <p className="text-muted-foreground mt-1">
            Geração automática de relatórios agronômicos e produtivos
          </p>
        </div>

        {/* Loading State */}
        {(isLoading || irrigacaoLoading) && (
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
                  ? 'Processe os dados de produção, aplicações, observações e desenvolvimento vegetativo.'
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

        {/* Conteúdo do Relatório com Abas */}
        <div
          className={cn(
            'space-y-6 transition-all duration-500',
            relatorioGerado && hasData ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8 pointer-events-none h-0 overflow-hidden'
          )}
        >
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 max-w-md">
              <TabsTrigger value="aplicacoes" className="gap-2">
                <FlaskConical className="w-4 h-4" />
                Aplicações & Produção
              </TabsTrigger>
              <TabsTrigger value="observacoes" className="gap-2">
                <Leaf className="w-4 h-4" />
                Observações
              </TabsTrigger>
            </TabsList>

            {/* ===== ABA: APLICAÇÕES & PRODUÇÃO ===== */}
            <TabsContent value="aplicacoes" className="space-y-6 mt-6">
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
                    <CardTitle className="font-display text-lg flex items-center justify-between">
                      <span>Produção por Ano</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => handleDownloadGrafico(graficoProducaoAnoRef, 'producao-por-ano')}
                        aria-label="Download gráfico Produção por Ano"
                      >
                        <ImageDown className="w-4 h-4" />
                      </Button>
                    </CardTitle>
                    <CardDescription>Total de produção em kg por safra</CardDescription>
                  </CardHeader>
                  <CardContent ref={graficoProducaoAnoRef}>
                    {producaoData.length > 0 ? (
                      <ResponsiveContainer width="100%" height={280}>
                        <BarChart data={producaoData}>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                          <XAxis dataKey="ano" className="text-sm" />
                          <YAxis className="text-sm" />
                          <Tooltip
                            contentStyle={tooltipStyle}
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
                    <CardTitle className="font-display text-lg flex items-center justify-between">
                      <span>Produção Média por Planta</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => handleDownloadGrafico(graficoProducaoMediaRef, 'producao-media-por-planta')}
                        aria-label="Download gráfico Produção Média por Planta"
                      >
                        <ImageDown className="w-4 h-4" />
                      </Button>
                    </CardTitle>
                    <CardDescription>Evolução da produtividade em kg/planta</CardDescription>
                  </CardHeader>
                  <CardContent ref={graficoProducaoMediaRef}>
                    {producaoMediaData.length > 0 ? (
                      <ResponsiveContainer width="100%" height={280}>
                        <LineChart data={producaoMediaData}>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                          <XAxis dataKey="ano" className="text-sm" />
                          <YAxis className="text-sm" />
                          <Tooltip
                            contentStyle={tooltipStyle}
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
                    <CardTitle className="font-display text-lg flex items-center justify-between">
                      <span>Aplicações por Categoria</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => handleDownloadGrafico(graficoAplicacoesCategoriaRef, 'aplicacoes-por-categoria')}
                        aria-label="Download gráfico Aplicações por Categoria"
                      >
                        <ImageDown className="w-4 h-4" />
                      </Button>
                    </CardTitle>
                    <CardDescription>Distribuição de produtos aplicados</CardDescription>
                  </CardHeader>
                  <CardContent ref={graficoAplicacoesCategoriaRef}>
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
                            contentStyle={tooltipStyle}
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
                    <CardTitle className="font-display text-lg flex items-center justify-between">
                      <span>Volume Aplicado por Ano</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => handleDownloadGrafico(graficoVolumeAplicadoRef, 'volume-aplicado-por-ano')}
                        aria-label="Download gráfico Volume Aplicado por Ano"
                      >
                        <ImageDown className="w-4 h-4" />
                      </Button>
                    </CardTitle>
                    <CardDescription>Total de produtos aplicados (kg + L)</CardDescription>
                  </CardHeader>
                  <CardContent ref={graficoVolumeAplicadoRef}>
                    {volumeAplicadoData.some(d => d.volume > 0) ? (
                      <ResponsiveContainer width="100%" height={280}>
                        <BarChart data={volumeAplicadoData}>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                          <XAxis dataKey="ano" className="text-sm" />
                          <YAxis className="text-sm" />
                          <Tooltip
                            contentStyle={tooltipStyle}
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

              {/* Seção de Irrigação */}
              {irrigacaoData && irrigacaoData.totalEventos > 0 && (
                <>
                  {/* Indicadores de Irrigação */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="animate-fade-in" style={{ animationDelay: '850ms' }}>
                      <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                            <Droplet className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Volume de Água</p>
                            <p className="text-2xl font-bold">{irrigacaoData.totalVolume.toLocaleString()} L</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="animate-fade-in" style={{ animationDelay: '900ms' }}>
                      <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-cyan-500/10 flex items-center justify-center">
                            <Droplet className="w-5 h-5 text-cyan-600" />
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Eventos de Irrigação</p>
                            <p className="text-2xl font-bold">{irrigacaoData.totalEventos}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="animate-fade-in" style={{ animationDelay: '950ms' }}>
                      <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-teal-500/10 flex items-center justify-center">
                            <Droplet className="w-5 h-5 text-teal-600" />
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Talhão Mais Irrigado</p>
                            <p className="text-xl font-bold">{irrigacaoData.talhaoMaisIrrigado?.nome || '-'}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Gráficos de Irrigação */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card className="animate-fade-in" style={{ animationDelay: '1000ms' }}>
                      <CardHeader>
                        <CardTitle className="font-display text-lg flex items-center justify-between">
                          <span>Volume de Água por Ano (L) – Irrigação</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => handleDownloadGrafico(graficoIrrigacaoAnoRef, 'volume-agua-por-ano-irrigacao')}
                            aria-label="Download gráfico Volume de Água por Ano – Irrigação"
                          >
                            <ImageDown className="w-4 h-4" />
                          </Button>
                        </CardTitle>
                        <CardDescription>Distribuição anual do volume de água aplicado</CardDescription>
                      </CardHeader>
                      <CardContent ref={graficoIrrigacaoAnoRef}>
                        {irrigacaoData.volumePorAno.length > 0 ? (
                          <ResponsiveContainer width="100%" height={280}>
                            <BarChart data={irrigacaoData.volumePorAno.map(d => ({ ano: d.ano.toString(), volume: d.volume }))}>
                              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                              <XAxis dataKey="ano" className="text-sm" />
                              <YAxis className="text-sm" />
                              <Tooltip
                                contentStyle={tooltipStyle}
                                formatter={(value: number) => [`${value.toLocaleString()} L`, 'Volume']}
                              />
                              <Bar dataKey="volume" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
                            </BarChart>
                          </ResponsiveContainer>
                        ) : (
                          <div className="h-[280px] flex items-center justify-center text-muted-foreground">
                            Sem dados de irrigação
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    <Card className="animate-fade-in" style={{ animationDelay: '1050ms' }}>
                      <CardHeader>
                        <CardTitle className="font-display text-lg flex items-center justify-between">
                          <span>Volume de Água por Talhão (L) – Irrigação</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => handleDownloadGrafico(graficoIrrigacaoTalhaoRef, 'volume-agua-por-talhao-irrigacao')}
                            aria-label="Download gráfico Volume de Água por Talhão – Irrigação"
                          >
                            <ImageDown className="w-4 h-4" />
                          </Button>
                        </CardTitle>
                        <CardDescription>Distribuição do volume de água por talhão</CardDescription>
                      </CardHeader>
                      <CardContent ref={graficoIrrigacaoTalhaoRef}>
                        {irrigacaoData.volumePorTalhao.length > 0 ? (
                          <ResponsiveContainer width="100%" height={280}>
                            <BarChart data={irrigacaoData.volumePorTalhao.map(d => ({ talhao: d.talhaoNome, volume: d.volume }))}>
                              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                              <XAxis dataKey="talhao" className="text-sm" />
                              <YAxis className="text-sm" />
                              <Tooltip
                                contentStyle={tooltipStyle}
                                formatter={(value: number) => [`${value.toLocaleString()} L`, 'Volume']}
                              />
                              <Bar dataKey="volume" fill="#14b8a6" radius={[4, 4, 0, 0]} />
                            </BarChart>
                          </ResponsiveContainer>
                        ) : (
                          <div className="h-[280px] flex items-center justify-center text-muted-foreground">
                            Sem dados de irrigação
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                </>
              )}

              {/* Resumo Textual - Aplicações */}
              <Card className="animate-fade-in" style={{ animationDelay: '1100ms' }}>
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

                    {dadosFiltrados.detalhamentoPorCategoria.length > 0 && (
                      <div className="space-y-1">
                        <p className="text-foreground leading-relaxed">
                          <strong>📊 Detalhamento por categoria:</strong>
                        </p>
                        {dadosFiltrados.detalhamentoPorCategoria.map((detalhe) => (
                          <p key={detalhe.categoria} className="text-foreground leading-relaxed">
                            - {detalhe.categoria}: produto mais aplicado foi <strong>{detalhe.produto}</strong> com{' '}
                            <strong>{detalhe.quantidade.toFixed(1)} kg/L</strong>
                          </p>
                        ))}
                      </div>
                    )}

                    {/* Nota sobre Adjuvantes */}
                    {dadosFiltrados.aplicacoesFiltradas.length > 0 && totalAplicacoesAdjuvantes === 0 && (
                      <p className="text-foreground leading-relaxed">
                        <strong>🧴 Adjuvantes:</strong> Não foram utilizados adjuvantes no período selecionado.
                      </p>
                    )}

                    {/* Resumo de Irrigação */}
                    {irrigacaoData && irrigacaoData.totalEventos > 0 && (
                      <p className="text-foreground leading-relaxed">
                        <strong>💧 Irrigação:</strong> No período analisado
                        {irrigacaoData.periodoInicio && irrigacaoData.periodoFim && (
                          <> ({format(new Date(irrigacaoData.periodoInicio + 'T12:00:00'), 'dd/MM/yyyy', { locale: ptBR })} a {format(new Date(irrigacaoData.periodoFim + 'T12:00:00'), 'dd/MM/yyyy', { locale: ptBR })})</>
                        )}
                        , foram registrados <strong>{irrigacaoData.totalEventos} eventos de irrigação</strong>, 
                        totalizando <strong>{irrigacaoData.totalVolume.toLocaleString()} litros de água</strong> aplicados
                        {irrigacaoData.talhaoMaisIrrigado && (
                          <>, com maior concentração no talhão <strong>{irrigacaoData.talhaoMaisIrrigado.nome}</strong></>
                        )}.
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
<<<<<<< HEAD
=======
              {/* Bottom Export Buttons */}
              <Card className="animate-fade-in" style={{ animationDelay: '1200ms' }}>
                <CardContent className="py-6">
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <Button variant="outline" className="gap-2 w-full sm:w-auto" onClick={handleDownloadCSV}>
                      <Download className="w-4 h-4" />
                      Download CSV
                    </Button>
                    <Button className="gap-2 w-full sm:w-auto" onClick={handleDownloadPDF}>
                      <FileText className="w-4 h-4" />
                      Download PDF
                    </Button>
                  </div>
                </CardContent>
              </Card>
>>>>>>> parent of 273a60b (Refactor pdf area wrap)
            </TabsContent>

            {/* ===== ABA: OBSERVAÇÕES ===== */}
            <TabsContent value="observacoes" className="mt-6">
              <ObservacoesReport />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </MainLayout>
  );
}
