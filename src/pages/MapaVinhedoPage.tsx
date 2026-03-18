import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { useMudasGrid, useMudasStats, MudaStatus } from '@/hooks/useMudas';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { Loader2, ZoomIn, ZoomOut } from 'lucide-react';
import { Button } from '@/components/ui/button';

const STATUS_COLOR: Record<MudaStatus, string> = {
  ativa:       'bg-emerald-500',
  atencao:     'bg-amber-400',
  falha:       'bg-red-500',
  substituida: 'bg-slate-400',
};

const STATUS_LABEL: Record<MudaStatus, string> = {
  ativa:       'Ativa',
  atencao:     'Atenção',
  falha:       'Falha',
  substituida: 'Substituída',
};

const ZOOM_SIZES = [
  { label: 'XS', cell: 6,  showLabel: false },
  { label: 'S',  cell: 10, showLabel: false },
  { label: 'M',  cell: 16, showLabel: false },
  { label: 'L',  cell: 24, showLabel: true  },
];

export default function MapaVinhedoPage() {
  const navigate = useNavigate();
  const { data: gridData, isLoading: gridLoading } = useMudasGrid();
  const { data: stats, isLoading: statsLoading } = useMudasStats();
  const [zoomIdx, setZoomIdx] = useState(1);
  const [tooltip, setTooltip] = useState<{ codigo: string; status: string; linha: number; planta: number } | null>(null);

  const zoom = ZOOM_SIZES[zoomIdx];

  return (
    <MainLayout>
      <div className="p-6 space-y-6">

        {/* Header */}
        <div>
          <h1 className="font-display text-3xl font-bold text-foreground">Mapa do Vinhedo</h1>
          <p className="text-muted-foreground mt-1">
            Visualização espacial do talhão · clique numa muda para ver detalhes
          </p>
        </div>

        {/* Legenda + Zoom */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap gap-4">
            {(Object.keys(STATUS_COLOR) as MudaStatus[]).map(s => (
              <div key={s} className="flex items-center gap-1.5">
                <div className={`w-3 h-3 rounded-sm ${STATUS_COLOR[s]}`} />
                <span className="text-sm text-muted-foreground">{STATUS_LABEL[s]}</span>
              </div>
            ))}
          </div>

          {/* Controles de zoom */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Zoom</span>
            <Button
              variant="outline" size="icon"
              className="h-7 w-7"
              disabled={zoomIdx === 0}
              onClick={() => setZoomIdx(i => i - 1)}
            >
              <ZoomOut size={14} />
            </Button>
            <span className="text-xs font-medium w-6 text-center">{zoom.label}</span>
            <Button
              variant="outline" size="icon"
              className="h-7 w-7"
              disabled={zoomIdx === ZOOM_SIZES.length - 1}
              onClick={() => setZoomIdx(i => i + 1)}
            >
              <ZoomIn size={14} />
            </Button>
          </div>
        </div>

        {/* Grid */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="font-display text-base">Talhão</CardTitle>
          </CardHeader>
          <CardContent>
            {gridLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : gridData && gridData.maxLinha > 0 ? (
              <div className="overflow-auto">
                <div style={{ minWidth: 'max-content' }}>

                  {/* Header de plantas — mostra a cada 10 para não poluir */}
                  <div className="flex mb-1" style={{ paddingLeft: 40 }}>
                    {Array.from({ length: gridData.maxPlanta }, (_, i) => {
                      const p = i + 1;
                      const show = p === 1 || p % 10 === 0 || p === gridData.maxPlanta;
                      return (
                        <div
                          key={i}
                          style={{ width: zoom.cell, flexShrink: 0 }}
                          className="flex items-center justify-center"
                        >
                          {show && (
                            <span className="text-[9px] text-muted-foreground" style={{ fontSize: 9 }}>
                              {p}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Linhas */}
                  {Array.from({ length: gridData.maxLinha }, (_, linhaIdx) => {
                    const linha = linhaIdx + 1;
                    const mudasLinha = gridData.grid[linha] || [];

                    return (
                      <div key={linhaIdx} className="flex items-center mb-0.5">
                        {/* Label da linha */}
                        <div
                          className="flex items-center justify-end pr-1.5 flex-shrink-0 text-[10px] text-muted-foreground"
                          style={{ width: 40 }}
                        >
                          L{linha}
                        </div>

                        {/* Células */}
                        {Array.from({ length: gridData.maxPlanta }, (_, plantaIdx) => {
                          const planta = plantaIdx + 1;
                          const muda = mudasLinha.find(m => m.planta_na_linha === planta);
                          const status = (muda?.status as MudaStatus) ?? 'ativa';
                          const colorClass = muda ? STATUS_COLOR[status] : 'bg-muted/30';

                          return (
                            <div
                              key={plantaIdx}
                              style={{ width: zoom.cell, height: zoom.cell, flexShrink: 0 }}
                              className={`${colorClass} cursor-pointer transition-opacity hover:opacity-70 rounded-[1px]`}
                              onClick={() => muda && navigate(`/mudas/${muda.id}`)}
                              onMouseEnter={() => muda && setTooltip({
                                codigo: muda.codigo,
                                status: STATUS_LABEL[status],
                                linha,
                                planta,
                              })}
                              onMouseLeave={() => setTooltip(null)}
                            />
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Nenhuma muda cadastrada.</p>
              </div>
            )}

            {/* Tooltip */}
            {tooltip && (
              <div className="mt-3 px-3 py-2 rounded-lg bg-muted text-sm flex gap-4">
                <span className="font-medium text-foreground">{tooltip.codigo}</span>
                <span className="text-muted-foreground">L{tooltip.linha} · P{tooltip.planta}</span>
                <span className="text-muted-foreground">{tooltip.status}</span>
              </div>
            )}

            {/* Stats */}
            {stats && (
              <div className="mt-6 pt-4 border-t border-border grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold">{statsLoading ? '-' : stats.total}</p>
                  <p className="text-xs text-muted-foreground">Total</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-emerald-600">{statsLoading ? '-' : stats.ativas}</p>
                  <p className="text-xs text-muted-foreground">Ativas</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-amber-600">{statsLoading ? '-' : stats.atencao}</p>
                  <p className="text-xs text-muted-foreground">Atenção</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-red-600">{statsLoading ? '-' : stats.falha}</p>
                  <p className="text-xs text-muted-foreground">Falhas</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <p className="text-sm text-muted-foreground">
          📌 Representação conceitual do vinhedo, não geográfica.
        </p>
      </div>
    </MainLayout>
  );
}