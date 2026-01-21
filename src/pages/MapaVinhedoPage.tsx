import { MainLayout } from '@/components/layout/MainLayout';
import { useMudasGrid, useMudasStats, MudaStatus } from '@/hooks/useMudas';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

const statusDisplayMap: Record<MudaStatus, string> = {
  ativa: 'Ativa',
  atencao: 'Atenção',
  falha: 'Falha',
  substituida: 'Substituída',
};

export default function MapaVinhedoPage() {
  const navigate = useNavigate();
  const { data: gridData, isLoading: gridLoading } = useMudasGrid();
  const { data: stats, isLoading: statsLoading } = useMudasStats();

  const getGridCellClass = (status: MudaStatus | null) => {
    switch (status) {
      case 'ativa':
        return 'vineyard-grid-active';
      case 'atencao':
        return 'vineyard-grid-attention';
      case 'falha':
        return 'vineyard-grid-failure';
      case 'substituida':
        return 'bg-muted text-muted-foreground';
      default:
        return 'vineyard-grid-active';
    }
  };

  return (
    <MainLayout>
      <div className="p-8">
        {/* Header */}
        <div className="mb-8 animate-fade-in">
          <h1 className="font-display text-3xl font-bold text-foreground mb-2">
            Mapa do Vinhedo
          </h1>
          <p className="text-muted-foreground">
            Visualização espacial do talhão - Clique em uma muda para ver detalhes
          </p>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-6 mb-8 animate-fade-in" style={{ animationDelay: '100ms' }}>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded vineyard-grid-active" />
            <span className="text-sm text-muted-foreground">Ativa</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded vineyard-grid-attention" />
            <span className="text-sm text-muted-foreground">Atenção</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded vineyard-grid-failure" />
            <span className="text-sm text-muted-foreground">Falha</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-muted" />
            <span className="text-sm text-muted-foreground">Substituída</span>
          </div>
        </div>

        {/* Map Grid */}
        <Card className="animate-fade-in" style={{ animationDelay: '200ms' }}>
          <CardHeader>
            <CardTitle className="font-display">Talhão</CardTitle>
          </CardHeader>
          <CardContent>
            {gridLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : gridData && gridData.maxLinha > 0 ? (
              <div className="overflow-x-auto">
                <div className="min-w-[600px]">
                  {/* Column Headers */}
                  <div className="flex gap-2 mb-2 ml-16">
                    {Array.from({ length: gridData.maxPlanta }, (_, i) => (
                      <div
                        key={i}
                        className="w-16 h-8 flex items-center justify-center text-xs font-medium text-muted-foreground"
                      >
                        P{String(i + 1).padStart(2, '0')}
                      </div>
                    ))}
                  </div>

                  {/* Rows */}
                  {Array.from({ length: gridData.maxLinha }, (_, linhaIndex) => {
                    const linha = linhaIndex + 1;
                    const mudasLinha = gridData.grid[linha] || [];
                    
                    return (
                      <div key={linhaIndex} className="flex gap-2 mb-2">
                        {/* Row Header */}
                        <div className="w-14 h-16 flex items-center justify-center text-xs font-medium text-muted-foreground">
                          L{String(linha).padStart(2, '0')}
                        </div>

                        {/* Cells */}
                        {Array.from({ length: gridData.maxPlanta }, (_, plantaIndex) => {
                          const planta = plantaIndex + 1;
                          const muda = mudasLinha.find(m => m.planta_na_linha === planta);
                          
                          if (!muda) {
                            return (
                              <div
                                key={plantaIndex}
                                className="w-16 h-16 rounded border border-dashed border-border flex items-center justify-center text-xs text-muted-foreground"
                              >
                                -
                              </div>
                            );
                          }

                          return (
                            <div
                              key={plantaIndex}
                              className={cn(
                                'vineyard-grid-cell w-16 h-16',
                                getGridCellClass(muda.status)
                              )}
                              onClick={() => navigate(`/mudas/${muda.id}`)}
                              title={`${muda.codigo} - ${statusDisplayMap[muda.status || 'ativa']}`}
                            >
                              <div className="text-center">
                                <div className="font-semibold">{muda.codigo.replace('M', '')}</div>
                                <div className="text-[10px] opacity-75">
                                  {statusDisplayMap[muda.status || 'ativa']}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Nenhuma muda cadastrada no sistema.</p>
              </div>
            )}

            {/* Info */}
            {stats && (
              <div className="mt-8 pt-6 border-t border-border">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold text-foreground">
                      {statsLoading ? '-' : stats.total}
                    </p>
                    <p className="text-sm text-muted-foreground">Total</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-status-active">
                      {statsLoading ? '-' : stats.ativas}
                    </p>
                    <p className="text-sm text-muted-foreground">Ativas</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-status-attention">
                      {statsLoading ? '-' : stats.atencao}
                    </p>
                    <p className="text-sm text-muted-foreground">Atenção</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-status-failure">
                      {statsLoading ? '-' : stats.falha}
                    </p>
                    <p className="text-sm text-muted-foreground">Falhas</p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Note */}
        <p className="text-sm text-muted-foreground mt-6">
          📌 Este mapa é uma representação conceitual do vinhedo, não geográfica.
        </p>
      </div>
    </MainLayout>
  );
}
