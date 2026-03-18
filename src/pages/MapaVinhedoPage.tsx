import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { useMudasGrid, useMudasStats, MudaStatus } from '@/hooks/useMudas';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTalhoes } from '@/hooks/useMudas';
import { Card, CardContent } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { Loader2, ChevronRight, ChevronLeft, Star } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface MudaDetalhada {
  id: string;
  codigo: string;
  planta_na_linha: number;
  status: MudaStatus;
  is_sentinela: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

const STATUS_TEXT: Record<MudaStatus, string> = {
  ativa:       'text-emerald-700',
  atencao:     'text-amber-700',
  falha:       'text-red-700',
  substituida: 'text-slate-600',
};

const STATUS_BG_LIGHT: Record<MudaStatus, string> = {
  ativa:       'bg-emerald-50',
  atencao:     'bg-amber-50',
  falha:       'bg-red-50',
  substituida: 'bg-slate-50',
};

// ─── Hook: mudas de uma linha específica ─────────────────────────────────────

function useMudasLinha(talhaoId?: string, linha?: number) {
  return useQuery({
    queryKey: ['mudas-linha', talhaoId, linha],
    queryFn: async () => {
      if (!talhaoId || !linha) return [];
      const { data, error } = await supabase
        .from('mudas' as any)
        .select('id, codigo, planta_na_linha, status, is_sentinela')
        .eq('talhao_id', talhaoId)
        .eq('linha', linha)
        .order('planta_na_linha');
      if (error) throw error;
      return (data as any[]).map((m: any) => ({
        id: m.id,
        codigo: m.codigo,
        planta_na_linha: m.planta_na_linha,
        status: m.status as MudaStatus,
        is_sentinela: m.is_sentinela ?? false,
      })) as MudaDetalhada[];
    },
    enabled: !!talhaoId && !!linha,
    staleTime: 1000 * 60 * 5,
  });
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function MapaVinhedoPage() {
  const navigate = useNavigate();
  const { data: gridData, isLoading: gridLoading } = useMudasGrid();
  const { data: stats, isLoading: statsLoading } = useMudasStats();
  const { data: talhoes } = useTalhoes();
  const talhaoId = talhoes?.[0]?.id;

  const [linhaSelecionada, setLinhaSelecionada] = useState<number | null>(null);
  const [mudaHover, setMudaHover] = useState<MudaDetalhada | null>(null);

  const { data: mudasLinha, isLoading: loadingLinha } = useMudasLinha(talhaoId, linhaSelecionada ?? undefined);

  // Calcula stats por linha a partir do grid
  function statsLinha(linha: number) {
    const mudas = gridData?.grid[linha] ?? [];
    const total = mudas.length;
    const falhas = mudas.filter(m => m.status === 'falha').length;
    const atencao = mudas.filter(m => m.status === 'atencao').length;
    const ativas = mudas.filter(m => m.status === 'ativa').length;
    return { total, falhas, atencao, ativas };
  }

  return (
    <MainLayout>
      <div className="p-4 md:p-6 space-y-5 max-w-3xl mx-auto">

        {/* Header */}
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground">
            Mapa do Vinhedo
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Toque em uma linha para ver as mudas
          </p>
        </div>

        {/* Stats gerais */}
        {stats && (
          <div className="grid grid-cols-4 gap-2">
            {[
              { label: 'Total',    value: stats.total,  color: 'text-foreground' },
              { label: 'Ativas',   value: stats.ativas,  color: 'text-emerald-600' },
              { label: 'Atenção',  value: stats.atencao, color: 'text-amber-600' },
              { label: 'Falhas',   value: stats.falha,   color: 'text-red-600' },
            ].map(s => (
              <Card key={s.label}>
                <CardContent className="pt-3 pb-3 text-center px-2">
                  <p className={`text-xl font-bold ${s.color}`}>
                    {statsLoading ? '-' : s.value}
                  </p>
                  <p className="text-[11px] text-muted-foreground">{s.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Legenda */}
        <div className="flex flex-wrap gap-3">
          {(Object.keys(STATUS_COLOR) as MudaStatus[]).map(s => (
            <div key={s} className="flex items-center gap-1.5">
              <div className={`w-2.5 h-2.5 rounded-sm ${STATUS_COLOR[s]}`} />
              <span className="text-xs text-muted-foreground">{STATUS_LABEL[s]}</span>
            </div>
          ))}
          <div className="flex items-center gap-1.5">
            <Star size={10} className="text-yellow-500 fill-yellow-400" />
            <span className="text-xs text-muted-foreground">Sentinela</span>
          </div>
        </div>

        {/* Lista de linhas */}
        {gridLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="animate-spin text-primary" />
          </div>
        ) : gridData && gridData.maxLinha > 0 ? (
          <div className="space-y-2">
            {Array.from({ length: gridData.maxLinha }, (_, i) => {
              const linha = i + 1;
              const s = statsLinha(linha);
              const selecionada = linhaSelecionada === linha;

              return (
                <div key={linha}>
                  {/* Card da linha */}
                  <button
                    className={`w-full text-left rounded-xl border transition-all ${
                      selecionada
                        ? 'border-primary bg-primary/5'
                        : 'border-border bg-card hover:border-primary/40'
                    }`}
                    onClick={() => setLinhaSelecionada(selecionada ? null : linha)}
                  >
                    <div className="px-4 py-3 flex items-center gap-3">
                      {/* Label */}
                      <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-bold text-foreground">L{linha}</span>
                      </div>

                      {/* Barra de status proporcional por posição real */}
                      <div className="flex-1">
                        <div className="flex h-4 rounded-full overflow-hidden">
                          {(() => {
                            const mudasLinha = gridData?.grid[linha] ?? [];
                            if (mudasLinha.length === 0) return (
                              <div className="bg-emerald-500 w-full" />
                            );
                            const maxPlanta = Math.max(...mudasLinha.map(m => m.planta_na_linha));
                            return mudasLinha.map((m, idx) => {
                              const prev = idx === 0 ? 0 : mudasLinha[idx - 1].planta_na_linha;
                              const gap = m.planta_na_linha - prev - 1;
                              const color = m.status === 'falha' ? 'bg-red-500'
                                : m.status === 'atencao' ? 'bg-amber-400'
                                : m.status === 'substituida' ? 'bg-slate-400'
                                : 'bg-emerald-500';
                              return (
                                <div key={m.id} className="flex" style={{ width: `${(1 / maxPlanta) * 100}%` }}>
                                  <div className={`w-full ${color}`} />
                                </div>
                              );
                            });
                          })()}
                        </div>
                        <div className="flex gap-3 mt-1">
                          <span className="text-[10px] text-muted-foreground">{s.total} mudas</span>
                          {s.atencao > 0 && (
                            <span className="text-[10px] text-amber-600 font-medium">{s.atencao} atenção</span>
                          )}
                          {s.falhas > 0 && (
                            <span className="text-[10px] text-red-600 font-medium">{s.falhas} falhas</span>
                          )}
                        </div>
                      </div>

                      <ChevronRight
                        size={16}
                        className={`text-muted-foreground flex-shrink-0 transition-transform ${selecionada ? 'rotate-90' : ''}`}
                      />
                    </div>
                  </button>

                  {/* Detalhe expandido da linha */}
                  {selecionada && (
                    <div className="mt-1 rounded-xl border border-primary/20 bg-primary/5 p-3">
                      {loadingLinha ? (
                        <div className="flex justify-center py-4">
                          <Loader2 size={20} className="animate-spin text-primary" />
                        </div>
                      ) : mudasLinha && mudasLinha.length > 0 ? (
                        <>
                          {/* Grid de mudas */}
                          <div className="flex flex-wrap gap-1 mb-2">
                            {mudasLinha.map(muda => (
                              <button
                                key={muda.id}
                                className={`relative w-7 h-7 rounded flex items-center justify-center transition-opacity hover:opacity-80 ${STATUS_COLOR[muda.status]}`}
                                onClick={() => navigate(`/mudas/${muda.id}`)}
                                onMouseEnter={() => setMudaHover(muda)}
                                onMouseLeave={() => setMudaHover(null)}
                                title={`${muda.codigo}${muda.is_sentinela ? ' ★' : ''}`}
                              >
                                {muda.is_sentinela && (
                                  <Star
                                    size={8}
                                    className="absolute top-0.5 right-0.5 text-yellow-300 fill-yellow-300"
                                  />
                                )}
                                <span className="text-[9px] text-white font-medium leading-none">
                                  {muda.planta_na_linha}
                                </span>
                              </button>
                            ))}
                          </div>

                          {/* Tooltip da muda hover */}
                          {mudaHover && (
                            <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-background border border-border text-sm">
                              <div className={`w-2.5 h-2.5 rounded-sm flex-shrink-0 ${STATUS_COLOR[mudaHover.status]}`} />
                              <span className="font-medium text-foreground">{mudaHover.codigo}</span>
                              <span className="text-muted-foreground">P{mudaHover.planta_na_linha}</span>
                              <span className={`text-xs ${STATUS_TEXT[mudaHover.status]}`}>
                                {STATUS_LABEL[mudaHover.status]}
                              </span>
                              {mudaHover.is_sentinela && (
                                <span className="flex items-center gap-1 text-xs text-yellow-600 ml-auto">
                                  <Star size={10} className="fill-yellow-400" /> Sentinela
                                </span>
                              )}
                            </div>
                          )}

                          {/* Legenda sentinelas */}
                          <p className="text-[10px] text-muted-foreground mt-2">
                            ★ = sentinela · toque numa muda para ver detalhes
                          </p>
                        </>
                      ) : (
                        <p className="text-sm text-muted-foreground text-center py-2">
                          Nenhuma muda nesta linha.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            Nenhuma muda cadastrada.
          </div>
        )}

        <p className="text-xs text-muted-foreground pb-4">
          📌 Representação conceitual do vinhedo, não geográfica.
        </p>
      </div>
    </MainLayout>
  );
}