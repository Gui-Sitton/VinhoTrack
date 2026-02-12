import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BookOpen, ExternalLink } from 'lucide-react';

interface Referencia {
  id: string;
  autores: string;
  ano: number;
  titulo: string;
  periodico: string;
  doi?: string;
  link?: string;
  resumo: string;
  fasesRelacionadas: string[];
}

const referenciasIniciais: Referencia[] = [
  {
    id: '1',
    autores: 'Lorenz, D.H.; Eichhorn, K.W.; Bleiholder, H.; Klose, R.; Meier, U.; Weber, E.',
    ano: 1995,
    titulo: 'Growth stages of the grapevine: Phenological growth stages of the grapevine (Vitis vinifera L. ssp. vinifera) — Codes and descriptions according to the extended BBCH scale',
    periodico: 'Australian Journal of Grape and Wine Research',
    doi: '10.1111/j.1755-0238.1995.tb00085.x',
    resumo: 'Base científica internacional para definição dos estágios de brotação, floração, veraison e maturação da videira segundo a escala BBCH.',
    fasesRelacionadas: ['Brotação', 'Floração', 'Veraison', 'Maturação'],
  },
  {
    id: '2',
    autores: 'Coombe, B.G.',
    ano: 1995,
    titulo: 'Adoption of a system for identifying grapevine growth stages',
    periodico: 'Australian Journal of Grape and Wine Research',
    doi: '10.1111/j.1755-0238.1995.tb00086.x',
    resumo: 'Complementa e padroniza a identificação dos estágios fenológicos da videira, facilitando a comunicação entre pesquisadores e viticultores.',
    fasesRelacionadas: ['Brotação', 'Floração', 'Frutificação', 'Veraison', 'Maturação'],
  },
  {
    id: '3',
    autores: 'Mandelli, F.; Berlato, M.A.; Tonietto, J.; Bergamaschi, H.',
    ano: 2003,
    titulo: 'Fenologia da videira na Serra Gaúcha',
    periodico: 'Pesquisa Agropecuária Gaúcha — Embrapa Uva e Vinho',
    link: 'https://www.embrapa.br/uva-e-vinho',
    resumo: 'Validação experimental das fases fenológicas da videira em condições edafoclimáticas do Sul do Brasil, referência para viticultura na Serra Gaúcha.',
    fasesRelacionadas: ['Dormência', 'Brotação', 'Floração', 'Maturação'],
  },
  {
    id: '4',
    autores: 'Projeto UFPel — Universidade Federal de Pelotas',
    ano: 2020,
    titulo: 'Fenologia da uva Marselan (Vitis vinifera) em Bagé, RS',
    periodico: 'Universidade Federal de Pelotas — Programa de Pós-Graduação em Agronomia',
    link: 'https://wp.ufpel.edu.br/',
    resumo: 'Aplicação direta da escala fenológica na cultivar Marselan em condições de Campanha Gaúcha, base para o calendário fenológico utilizado neste sistema.',
    fasesRelacionadas: ['Dormência', 'Brotação', 'Floração', 'Veraison', 'Maturação', 'Colheita'],
  },
];

export default function ReferenciasFenologicasPage() {
  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-primary" />
            Referências Fenológicas
          </h1>
          <p className="text-muted-foreground mt-1">
            Fontes científicas utilizadas para definição das fases fenológicas da videira Marselan (Vitis vinifera).
          </p>
        </div>

        <div className="space-y-4">
          {referenciasIniciais.map((ref) => (
            <Card key={ref.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-4">
                  <CardTitle className="text-base font-semibold leading-snug">
                    {ref.titulo}
                  </CardTitle>
                  <Badge variant="outline" className="shrink-0">
                    {ref.ano}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {ref.autores}
                </p>
                <p className="text-sm italic text-muted-foreground">
                  {ref.periodico}
                </p>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-foreground">{ref.resumo}</p>

                <div className="flex flex-wrap gap-1.5">
                  {ref.fasesRelacionadas.map((fase) => (
                    <Badge key={fase} variant="secondary" className="text-xs">
                      {fase}
                    </Badge>
                  ))}
                </div>

                {(ref.doi || ref.link) && (
                  <a
                    href={ref.doi ? `https://doi.org/${ref.doi}` : ref.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                  >
                    <ExternalLink className="w-3 h-3" />
                    {ref.doi ? `DOI: ${ref.doi}` : 'Acessar fonte'}
                  </a>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="border-dashed">
          <CardContent className="py-6 text-center text-sm text-muted-foreground">
            Novas referências poderão ser adicionadas futuramente via banco de dados.
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
