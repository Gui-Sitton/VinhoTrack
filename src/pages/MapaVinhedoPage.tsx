import { MainLayout } from '@/components/layout/MainLayout';
import { getMudaByPosition, MudaStatus } from '@/data/mockData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

export default function MapaVinhedoPage() {
  const navigate = useNavigate();

  const linhas = 5;
  const plantasPorLinha = 10;

  const getGridCellClass = (status: MudaStatus) => {
    switch (status) {
      case 'Ativa':
        return 'vineyard-grid-active';
      case 'Atenção':
        return 'vineyard-grid-attention';
      case 'Falha':
        return 'vineyard-grid-failure';
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
            Visualização espacial do Talhão T01 - Clique em uma muda para ver detalhes
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
        </div>

        {/* Map Grid */}
        <Card className="animate-fade-in" style={{ animationDelay: '200ms' }}>
          <CardHeader>
            <CardTitle className="font-display">Talhão T01</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <div className="min-w-[600px]">
                {/* Column Headers */}
                <div className="flex gap-2 mb-2 ml-16">
                  {Array.from({ length: plantasPorLinha }, (_, i) => (
                    <div
                      key={i}
                      className="w-16 h-8 flex items-center justify-center text-xs font-medium text-muted-foreground"
                    >
                      P{String(i + 1).padStart(2, '0')}
                    </div>
                  ))}
                </div>

                {/* Rows */}
                {Array.from({ length: linhas }, (_, linhaIndex) => (
                  <div key={linhaIndex} className="flex gap-2 mb-2">
                    {/* Row Header */}
                    <div className="w-14 h-16 flex items-center justify-center text-xs font-medium text-muted-foreground">
                      L{String(linhaIndex + 1).padStart(2, '0')}
                    </div>

                    {/* Cells */}
                    {Array.from({ length: plantasPorLinha }, (_, plantaIndex) => {
                      const muda = getMudaByPosition(linhaIndex + 1, plantaIndex + 1);
                      if (!muda) return null;

                      return (
                        <div
                          key={plantaIndex}
                          className={cn(
                            'vineyard-grid-cell w-16 h-16',
                            getGridCellClass(muda.status)
                          )}
                          onClick={() => navigate(`/mudas/${muda.id}`)}
                          title={`${muda.codigo} - ${muda.status}`}
                        >
                          <div className="text-center">
                            <div className="font-semibold">{muda.codigo.replace('M', '')}</div>
                            <div className="text-[10px] opacity-75">{muda.status}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>

            {/* Info */}
            <div className="mt-8 pt-6 border-t border-border">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-foreground">50</p>
                  <p className="text-sm text-muted-foreground">Total</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-status-active">42</p>
                  <p className="text-sm text-muted-foreground">Ativas</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-status-attention">5</p>
                  <p className="text-sm text-muted-foreground">Atenção</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-status-failure">3</p>
                  <p className="text-sm text-muted-foreground">Falhas</p>
                </div>
              </div>
            </div>
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
