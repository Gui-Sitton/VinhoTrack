import { useFasesFenologicasByMuda, FaseFenologica } from '@/hooks/useFasesFenologicas';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Loader2, Leaf, ChevronDown, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useMemo } from 'react';

function calcDays(startStr: string, endStr: string | null): number {
  const start = new Date(startStr + 'T12:00:00');
  const end = endStr ? new Date(endStr + 'T12:00:00') : new Date();
  return Math.max(0, Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
}

function formatDate(dateStr: string): string {
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

interface Props {
  mudaId: string;
}

export function HistoricoFenologico({ mudaId }: Props) {
  const { data: fases, isLoading } = useFasesFenologicasByMuda(mudaId);
  const navigate = useNavigate();

  // Recalculate durations for current phase every render (uses current date)
  const fasesComDuracao = useMemo(() => {
    if (!fases) return [];
    return fases.map(f => ({
      ...f,
      duracao: calcDays(f.data_inicio, f.data_fim),
      isAtual: f.data_fim === null,
    }));
  }, [fases]);

  if (isLoading) {
    return (
      <Card className="animate-fade-in">
        <CardContent className="p-6 flex items-center justify-center">
          <Loader2 className="w-5 h-5 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  const hasCientificData = (f: FaseFenologica) =>
    f.fase_cientifica || f.BBCH_aproximado || f.descricao_cientifica;

  return (
    <Card className="animate-fade-in">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Leaf className="w-5 h-5 text-primary" />
            <CardTitle className="font-display">Histórico Fenológico</CardTitle>
          </div>
          {fasesComDuracao.length > 0 && (
            <Badge variant="secondary">{fasesComDuracao.length} fase{fasesComDuracao.length !== 1 ? 's' : ''}</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {fasesComDuracao.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-4">
              Nenhuma fase fenológica registrada para esta muda.
            </p>
            <Button onClick={() => navigate(`/referencias-fenologicas`)}>
              <Plus className="w-4 h-4 mr-2" />
              Ver referências fenológicas
            </Button>
          </div>
        ) : (
          <div className="relative pl-6">
            {/* Timeline line */}
            <div className="absolute left-[9px] top-2 bottom-2 w-0.5 bg-border" />

            <div className="space-y-6">
              {fasesComDuracao.map((fase, index) => (
                <div key={fase.id} className="relative">
                  {/* Timeline dot */}
                  <div
                    className={`absolute -left-6 top-1 w-[18px] h-[18px] rounded-full border-2 flex items-center justify-center ${
                      fase.isAtual
                        ? 'border-green-500 bg-green-500/20'
                        : 'border-muted-foreground/40 bg-background'
                    }`}
                  >
                    {fase.isAtual && (
                      <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    )}
                  </div>

                  <div
                    className={`rounded-lg border p-4 ${
                      fase.isAtual
                        ? 'border-green-500/30 bg-green-500/5'
                        : 'border-border'
                    }`}
                  >
                    {/* Header */}
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className="font-semibold text-foreground">{fase.fase}</span>
                      {fase.isAtual && (
                        <Badge className="bg-green-500/15 text-green-700 border-green-500/30 hover:bg-green-500/20">
                          Fase atual
                        </Badge>
                      )}
                    </div>

                    {/* Dates & duration */}
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground mb-1">
                      <span>
                        {formatDate(fase.data_inicio)} → {fase.data_fim ? formatDate(fase.data_fim) : 'Hoje'}
                      </span>
                      <span className="font-medium text-foreground">
                        {fase.duracao} dia{fase.duracao !== 1 ? 's' : ''}
                      </span>
                    </div>

                    {/* Scientific info (collapsible) */}
                    {hasCientificData(fase) && (
                      <Collapsible>
                        <CollapsibleTrigger className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mt-2 transition-colors">
                          <ChevronDown className="w-3 h-3" />
                          Informações científicas
                        </CollapsibleTrigger>
                        <CollapsibleContent className="mt-2 space-y-1 text-xs text-muted-foreground border-t border-border/50 pt-2">
                          {fase.fase_cientifica && (
                            <p><span className="font-medium">Fase científica:</span> {fase.fase_cientifica}</p>
                          )}
                          {fase.BBCH_aproximado && (
                            <p><span className="font-medium">BBCH:</span> {fase.BBCH_aproximado}</p>
                          )}
                          {fase.descricao_cientifica && (
                            <p><span className="font-medium">Descrição:</span> {fase.descricao_cientifica}</p>
                          )}
                        </CollapsibleContent>
                      </Collapsible>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
