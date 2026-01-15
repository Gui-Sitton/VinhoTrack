export type MudaStatus = 'Ativa' | 'Atenção' | 'Falha';

export interface Observacao {
  id: string;
  data: string;
  faseFenologica: string;
  alturaPlanta: number;
  observacoes: string;
}

export interface Muda {
  id: string;
  codigo: string;
  talhao: string;
  linha: string;
  plantaNaLinha: string;
  variedade: string;
  status: MudaStatus;
  dataPlantio: string;
  observacoes: Observacao[];
}

// Fases fenológicas da videira
export const fasesFenologicas = [
  'Dormência',
  'Brotação',
  'Floração',
  'Frutificação',
  'Desenvolvimento dos frutos',
  'Véraison (início da maturação)',
  'Maturação',
  'Colheita',
];

// Função para gerar código da muda
const gerarCodigo = (index: number): string => {
  return `M${String(index + 1).padStart(4, '0')}`;
};

// Função para gerar observações fictícias
const gerarObservacoes = (mudaIndex: number): Observacao[] => {
  const observacoesBase: Observacao[][] = [
    [
      {
        id: '1',
        data: '2024-03-15',
        faseFenologica: 'Brotação',
        alturaPlanta: 12,
        observacoes: 'Primeiras folhas visíveis. Desenvolvimento normal.',
      },
      {
        id: '2',
        data: '2024-04-20',
        faseFenologica: 'Floração',
        alturaPlanta: 35,
        observacoes: 'Floração iniciada. Boa formação de cachos.',
      },
      {
        id: '3',
        data: '2024-05-25',
        faseFenologica: 'Frutificação',
        alturaPlanta: 58,
        observacoes: 'Frutos em desenvolvimento. Vigor adequado.',
      },
    ],
    [
      {
        id: '1',
        data: '2024-03-18',
        faseFenologica: 'Brotação',
        alturaPlanta: 8,
        observacoes: 'Brotação um pouco atrasada. Monitorar.',
      },
      {
        id: '2',
        data: '2024-04-25',
        faseFenologica: 'Floração',
        alturaPlanta: 28,
        observacoes: 'Desenvolvimento lento. Possível deficiência nutricional.',
      },
    ],
    [
      {
        id: '1',
        data: '2024-03-12',
        faseFenologica: 'Brotação',
        alturaPlanta: 15,
        observacoes: 'Excelente brotação. Vigor acima da média.',
      },
      {
        id: '2',
        data: '2024-04-18',
        faseFenologica: 'Floração',
        alturaPlanta: 42,
        observacoes: 'Floração abundante. Remover cachos extras.',
      },
      {
        id: '3',
        data: '2024-05-20',
        faseFenologica: 'Frutificação',
        alturaPlanta: 68,
        observacoes: 'Remoção de 2 cachos por planta realizada.',
      },
      {
        id: '4',
        data: '2024-06-15',
        faseFenologica: 'Desenvolvimento dos frutos',
        alturaPlanta: 85,
        observacoes: 'Frutos saudáveis. Tamanho uniforme.',
      },
    ],
    [
      {
        id: '1',
        data: '2024-03-20',
        faseFenologica: 'Brotação',
        alturaPlanta: 5,
        observacoes: 'Brotação fraca. Sinais de estresse hídrico.',
      },
    ],
    [],
  ];

  return observacoesBase[mudaIndex % observacoesBase.length] || [];
};

// Função para determinar status baseado nas observações
const determinarStatus = (observacoes: Observacao[], index: number): MudaStatus => {
  // Algumas mudas específicas com problemas para demonstração
  if (index === 3 || index === 13 || index === 27) return 'Falha';
  if (index === 7 || index === 15 || index === 22 || index === 35 || index === 41) return 'Atenção';
  return 'Ativa';
};

// Gerar dados das mudas
export const gerarMudas = (): Muda[] => {
  const mudas: Muda[] = [];
  let index = 0;

  for (let linha = 1; linha <= 5; linha++) {
    for (let planta = 1; planta <= 10; planta++) {
      const observacoes = gerarObservacoes(index);
      mudas.push({
        id: `muda-${index}`,
        codigo: gerarCodigo(index),
        talhao: 'T01',
        linha: `L${String(linha).padStart(2, '0')}`,
        plantaNaLinha: `P${String(planta).padStart(2, '0')}`,
        variedade: 'Marselan',
        status: determinarStatus(observacoes, index),
        dataPlantio: '2024-02-15',
        observacoes,
      });
      index++;
    }
  }

  return mudas;
};

export const mudas = gerarMudas();

// Helper para obter linhas únicas
export const getLinhasUnicas = (): string[] => {
  return [...new Set(mudas.map((m) => m.linha))].sort();
};

// Helper para obter muda por ID
export const getMudaById = (id: string): Muda | undefined => {
  return mudas.find((m) => m.id === id);
};

// Helper para obter muda por código
export const getMudaByCodigo = (codigo: string): Muda | undefined => {
  return mudas.find((m) => m.codigo === codigo);
};

// Helper para obter muda por posição
export const getMudaByPosition = (linha: number, planta: number): Muda | undefined => {
  const linhaStr = `L${String(linha).padStart(2, '0')}`;
  const plantaStr = `P${String(planta).padStart(2, '0')}`;
  return mudas.find((m) => m.linha === linhaStr && m.plantaNaLinha === plantaStr);
};
