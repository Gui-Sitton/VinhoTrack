// Dados simulados para relatórios agronômicos - 3 anos (2023-2025)

export interface ProducaoSafra {
  ano: number;
  producaoTotal: number; // kg
  producaoMediaPlanta: number; // kg/planta
  plantasProdutivas: number;
}

export interface AplicacaoProduto {
  id: string;
  data: string;
  categoria: 'Fungicida' | 'Fertilizante' | 'Corretivo' | 'Inseticida';
  nomeProduto: string;
  quantidade: number; // kg ou L
  unidade: 'kg' | 'L';
  finalidade: string;
  ano: number;
}

export interface DesenvolvimentoVegetativo {
  mes: string;
  ano: number;
  alturaMedia: number; // cm
  linha: string;
}

// Produção por safra (3 anos)
export const producaoSafras: ProducaoSafra[] = [
  {
    ano: 2023,
    producaoTotal: 1250,
    producaoMediaPlanta: 25.0,
    plantasProdutivas: 50,
  },
  {
    ano: 2024,
    producaoTotal: 1680,
    producaoMediaPlanta: 33.6,
    plantasProdutivas: 50,
  },
  {
    ano: 2025,
    producaoTotal: 2100,
    producaoMediaPlanta: 42.0,
    plantasProdutivas: 50,
  },
];

// Aplicações de produtos
export const aplicacoesProdutos: AplicacaoProduto[] = [
  // 2023
  {
    id: 'ap-1',
    data: '2023-03-15',
    categoria: 'Fungicida',
    nomeProduto: 'Cabrio Top',
    quantidade: 2.5,
    unidade: 'kg',
    finalidade: 'Controle preventivo de míldio',
    ano: 2023,
  },
  {
    id: 'ap-2',
    data: '2023-04-20',
    categoria: 'Fertilizante',
    nomeProduto: 'NPK 10-10-10',
    quantidade: 15,
    unidade: 'kg',
    finalidade: 'Nutrição de base',
    ano: 2023,
  },
  {
    id: 'ap-3',
    data: '2023-05-10',
    categoria: 'Fungicida',
    nomeProduto: 'Mancozeb',
    quantidade: 3.0,
    unidade: 'kg',
    finalidade: 'Controle de antracnose',
    ano: 2023,
  },
  {
    id: 'ap-4',
    data: '2023-06-05',
    categoria: 'Fertilizante',
    nomeProduto: 'Sulfato de Potássio',
    quantidade: 8,
    unidade: 'kg',
    finalidade: 'Maturação dos frutos',
    ano: 2023,
  },
  {
    id: 'ap-5',
    data: '2023-07-15',
    categoria: 'Inseticida',
    nomeProduto: 'Decis',
    quantidade: 1.5,
    unidade: 'L',
    finalidade: 'Controle de cochonilha',
    ano: 2023,
  },
  // 2024
  {
    id: 'ap-6',
    data: '2024-03-10',
    categoria: 'Corretivo',
    nomeProduto: 'Calcário Dolomítico',
    quantidade: 50,
    unidade: 'kg',
    finalidade: 'Correção de pH do solo',
    ano: 2024,
  },
  {
    id: 'ap-7',
    data: '2024-03-25',
    categoria: 'Fungicida',
    nomeProduto: 'Cabrio Top',
    quantidade: 3.0,
    unidade: 'kg',
    finalidade: 'Controle preventivo de míldio',
    ano: 2024,
  },
  {
    id: 'ap-8',
    data: '2024-04-15',
    categoria: 'Fertilizante',
    nomeProduto: 'NPK 10-10-10',
    quantidade: 18,
    unidade: 'kg',
    finalidade: 'Nutrição de base',
    ano: 2024,
  },
  {
    id: 'ap-9',
    data: '2024-05-20',
    categoria: 'Fungicida',
    nomeProduto: 'Amistar',
    quantidade: 2.0,
    unidade: 'L',
    finalidade: 'Controle de oídio',
    ano: 2024,
  },
  {
    id: 'ap-10',
    data: '2024-06-10',
    categoria: 'Fertilizante',
    nomeProduto: 'Ácido Bórico',
    quantidade: 2,
    unidade: 'kg',
    finalidade: 'Correção de boro',
    ano: 2024,
  },
  {
    id: 'ap-11',
    data: '2024-07-05',
    categoria: 'Inseticida',
    nomeProduto: 'Karate',
    quantidade: 1.0,
    unidade: 'L',
    finalidade: 'Controle de tripes',
    ano: 2024,
  },
  {
    id: 'ap-12',
    data: '2024-08-15',
    categoria: 'Fertilizante',
    nomeProduto: 'Sulfato de Magnésio',
    quantidade: 5,
    unidade: 'kg',
    finalidade: 'Nutrição foliar',
    ano: 2024,
  },
  // 2025
  {
    id: 'ap-13',
    data: '2025-02-20',
    categoria: 'Corretivo',
    nomeProduto: 'Gesso Agrícola',
    quantidade: 30,
    unidade: 'kg',
    finalidade: 'Correção de cálcio em profundidade',
    ano: 2025,
  },
  {
    id: 'ap-14',
    data: '2025-03-15',
    categoria: 'Fungicida',
    nomeProduto: 'Cabrio Top',
    quantidade: 3.5,
    unidade: 'kg',
    finalidade: 'Controle preventivo de míldio',
    ano: 2025,
  },
  {
    id: 'ap-15',
    data: '2025-04-10',
    categoria: 'Fertilizante',
    nomeProduto: 'NPK 10-10-10',
    quantidade: 20,
    unidade: 'kg',
    finalidade: 'Nutrição de base',
    ano: 2025,
  },
  {
    id: 'ap-16',
    data: '2025-05-05',
    categoria: 'Fungicida',
    nomeProduto: 'Score',
    quantidade: 1.5,
    unidade: 'L',
    finalidade: 'Controle curativo de doenças',
    ano: 2025,
  },
  {
    id: 'ap-17',
    data: '2025-06-20',
    categoria: 'Fertilizante',
    nomeProduto: 'Sulfato de Potássio',
    quantidade: 12,
    unidade: 'kg',
    finalidade: 'Maturação dos frutos',
    ano: 2025,
  },
  {
    id: 'ap-18',
    data: '2025-07-10',
    categoria: 'Inseticida',
    nomeProduto: 'Actara',
    quantidade: 0.8,
    unidade: 'kg',
    finalidade: 'Controle de pulgão',
    ano: 2025,
  },
];

// Desenvolvimento vegetativo por linha
export const desenvolvimentoVegetativo: DesenvolvimentoVegetativo[] = [
  // 2023
  { mes: 'Mar', ano: 2023, alturaMedia: 15, linha: 'L01' },
  { mes: 'Abr', ano: 2023, alturaMedia: 35, linha: 'L01' },
  { mes: 'Mai', ano: 2023, alturaMedia: 58, linha: 'L01' },
  { mes: 'Jun', ano: 2023, alturaMedia: 75, linha: 'L01' },
  { mes: 'Jul', ano: 2023, alturaMedia: 85, linha: 'L01' },
  { mes: 'Mar', ano: 2023, alturaMedia: 12, linha: 'L02' },
  { mes: 'Abr', ano: 2023, alturaMedia: 30, linha: 'L02' },
  { mes: 'Mai', ano: 2023, alturaMedia: 52, linha: 'L02' },
  { mes: 'Jun', ano: 2023, alturaMedia: 70, linha: 'L02' },
  { mes: 'Jul', ano: 2023, alturaMedia: 80, linha: 'L02' },
  // 2024
  { mes: 'Mar', ano: 2024, alturaMedia: 18, linha: 'L01' },
  { mes: 'Abr', ano: 2024, alturaMedia: 42, linha: 'L01' },
  { mes: 'Mai', ano: 2024, alturaMedia: 68, linha: 'L01' },
  { mes: 'Jun', ano: 2024, alturaMedia: 88, linha: 'L01' },
  { mes: 'Jul', ano: 2024, alturaMedia: 100, linha: 'L01' },
  { mes: 'Mar', ano: 2024, alturaMedia: 16, linha: 'L02' },
  { mes: 'Abr', ano: 2024, alturaMedia: 38, linha: 'L02' },
  { mes: 'Mai', ano: 2024, alturaMedia: 62, linha: 'L02' },
  { mes: 'Jun', ano: 2024, alturaMedia: 82, linha: 'L02' },
  { mes: 'Jul', ano: 2024, alturaMedia: 95, linha: 'L02' },
  // 2025
  { mes: 'Mar', ano: 2025, alturaMedia: 20, linha: 'L01' },
  { mes: 'Abr', ano: 2025, alturaMedia: 48, linha: 'L01' },
  { mes: 'Mai', ano: 2025, alturaMedia: 75, linha: 'L01' },
  { mes: 'Jun', ano: 2025, alturaMedia: 95, linha: 'L01' },
  { mes: 'Jul', ano: 2025, alturaMedia: 110, linha: 'L01' },
  { mes: 'Mar', ano: 2025, alturaMedia: 18, linha: 'L02' },
  { mes: 'Abr', ano: 2025, alturaMedia: 44, linha: 'L02' },
  { mes: 'Mai', ano: 2025, alturaMedia: 70, linha: 'L02' },
  { mes: 'Jun', ano: 2025, alturaMedia: 90, linha: 'L02' },
  { mes: 'Jul', ano: 2025, alturaMedia: 105, linha: 'L02' },
];

// Funções auxiliares para cálculos
export const calcularTotais = () => {
  const producaoTotal = producaoSafras.reduce((acc, s) => acc + s.producaoTotal, 0);
  const evolucaoPercentual = ((producaoSafras[2].producaoTotal - producaoSafras[0].producaoTotal) / producaoSafras[0].producaoTotal) * 100;
  
  const aplicacoesPorCategoria = aplicacoesProdutos.reduce((acc, ap) => {
    acc[ap.categoria] = (acc[ap.categoria] || 0) + ap.quantidade;
    return acc;
  }, {} as Record<string, number>);
  
  const produtoMaisAplicado = Object.entries(aplicacoesPorCategoria)
    .sort((a, b) => b[1] - a[1])[0];
  
  const anoMaiorProdutividade = producaoSafras
    .sort((a, b) => b.producaoMediaPlanta - a.producaoMediaPlanta)[0];
  
  return {
    producaoTotal,
    evolucaoPercentual,
    produtoMaisAplicado,
    anoMaiorProdutividade,
    aplicacoesPorCategoria,
  };
};

export const getAplicacoesPorAno = () => {
  return [2023, 2024, 2025].map(ano => {
    const aplicacoesAno = aplicacoesProdutos.filter(ap => ap.ano === ano);
    const totalKg = aplicacoesAno.filter(ap => ap.unidade === 'kg').reduce((acc, ap) => acc + ap.quantidade, 0);
    const totalL = aplicacoesAno.filter(ap => ap.unidade === 'L').reduce((acc, ap) => acc + ap.quantidade, 0);
    return { ano, totalKg, totalL, total: totalKg + totalL };
  });
};

export const getAplicacoesPorCategoria = () => {
  const categorias = ['Fungicida', 'Fertilizante', 'Corretivo', 'Inseticida'] as const;
  return categorias.map(categoria => {
    const total = aplicacoesProdutos
      .filter(ap => ap.categoria === categoria)
      .reduce((acc, ap) => acc + ap.quantidade, 0);
    return { categoria, total };
  });
};
