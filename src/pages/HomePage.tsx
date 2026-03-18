import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent } from '@/components/ui/card';
import { useMudasStats, useTalhoes } from '@/hooks/useMudas';
import { Grape, TrendingUp, AlertTriangle, XCircle, Loader2, Thermometer, Droplets, Leaf, CloudRain, ClipboardList, Sprout, Bug } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// ── Fases fenológicas para MUDAS no 1º ano (base GDD 10°C) ──
const FASES_MUDA = [
  { label: 'Estabelecimento', gddMin: 0,    gddMax: 150,  cor: '#94a3b8', desc: 'Adaptação e enraizamento inicial' },
  { label: 'Brotação',        gddMin: 150,  gddMax: 400,  cor: '#86efac', desc: 'Primeiros brotos e folhas' },
  { label: 'Crescimento',     gddMin: 400,  gddMax: 800,  cor: '#4ade80', desc: 'Crescimento vegetativo ativo' },
  { label: 'Lignificação',    gddMin: 800,  gddMax: 1300, cor: '#f59e0b', desc: 'Início da lenhificação dos ramos' },
  { label: 'Maturação',       gddMin: 1300, gddMax: 2000, cor: '#7c3aed', desc: 'Preparação para dormência' },
];

function getFaseMuda(gdd: number) {
  return FASES_MUDA.find(f => gdd >= f.gddMin && gdd < f.gddMax)
    ?? FASES_MUDA[FASES_MUDA.length - 1];
}

const FASE_GDD_MAP: Record<string, typeof FASES_MUDA[0]> = {
  estabelecimento:        FASES_MUDA[0],
  brotacao:               FASES_MUDA[1],
  crescimento_vegetativo: FASES_MUDA[2],
  lignificacao:           FASES_MUDA[3],
  maturacao:              FASES_MUDA[4],
};

// ── Hook: clima de hoje ──────────────────────────────────────
function useClimaHoje(talhaoId?: string) {
  const hoje = new Date().toISOString().slice(0, 10);
  const ontem = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  return useQuery({
    queryKey: ['clima-hoje', talhaoId],
    queryFn: async () => {
      let q = (supabase as any).from('clima_diario').select('*')
        .gte('data', ontem).lte('data', hoje)
        .order('data', { ascending: false }).limit(1);
      if (talhaoId) q = q.eq('talhao_id', talhaoId);
      const { data, error } = await q;
      if (error) throw error;
      return data?.[0] ?? null;
    },
    staleTime: 1000 * 60 * 30,
  });
}

// ── Hook: GDD acumulado ──────────────────────────────────────
function useGDDAcumulado(talhaoId?: string, dataPlantio?: string) {
  return useQuery({
    queryKey: ['gdd-acumulado', talhaoId, dataPlantio],
    queryFn: async () => {
      if (!dataPlantio) return 0;
      let q = (supabase as any).from('clima_diario').select('graus_dia').gte('data', dataPlantio);
      if (talhaoId) q = q.eq('talhao_id', talhaoId);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []).reduce((acc: number, r: any) => acc + (r.graus_dia ?? 0), 0);
    },
    enabled: !!dataPlantio,
    staleTime: 1000 * 60 * 30,
  });
}

// ── Hook: balanço hídrico ────────────────────────────────────
function useBalancoHidrico(talhaoId?: string) {
  const hoje = new Date().toISOString().slice(0, 10);
  const seteDias = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);
  return useQuery({
    queryKey: ['balanco-hidrico', talhaoId],
    queryFn: async () => {
      let q = (supabase as any).from('clima_diario')
        .select('precipitacao_mm, evapotranspiracao_mm')
        .gte('data', seteDias).lte('data', hoje);
      if (talhaoId) q = q.eq('talhao_id', talhaoId);
      const { data: climaData, error } = await q;
      if (error) throw error;
      const chuva = (climaData ?? []).reduce((acc: number, r: any) => acc + (r.precipitacao_mm ?? 0), 0);
      const et0   = (climaData ?? []).reduce((acc: number, r: any) => acc + (r.evapotranspiracao_mm ?? 0), 0);
      let qi = (supabase as any).from('irrigacoes_talhoes').select('volume_por_muda_l').gte('data_inicio', seteDias);
      if (talhaoId) qi = qi.eq('talhao_id', talhaoId);
      const { data: irrigData } = await qi;
      const irrigacaoMm = (irrigData ?? []).reduce((acc: number, r: any) => acc + ((r.volume_por_muda_l ?? 0) / 2), 0);
      const deficit = Math.round((et0 - (chuva + irrigacaoMm)) * 10) / 10;
      return {
        chuva:       Math.round(chuva * 10) / 10,
        et0:         Math.round(et0 * 10) / 10,
        irrigacaoMm: Math.round(irrigacaoMm * 10) / 10,
        deficit,
      };
    },
    staleTime: 1000 * 60 * 30,
  });
}

// ── Hook: última observação ──────────────────────────────────
function useUltimaObservacao() {
  return useQuery({
    queryKey: ['ultima-observacao'],
    queryFn: async () => {
      const { data, error } = await supabase.from('observacoes_mudas')
        .select('data, fase_fenologica, observacoes')
        .order('data', { ascending: false }).limit(1);
      if (error) throw error;
      return data?.[0] ?? null;
    },
    staleTime: 1000 * 60 * 5,
  });
}

// ── Hook: fase GDD observada ─────────────────────────────────
function useFaseGddObservada() {
  return useQuery({
    queryKey: ['fase-gdd-observada'],
    queryFn: async () => {
      const { data, error } = await supabase.from('observacoes_mudas')
        .select('fase_gdd').not('fase_gdd', 'is', null)
        .order('data', { ascending: false }).limit(1);
      if (error) throw error;
      return (data?.[0] as any)?.fase_gdd ?? null;
    },
    staleTime: 1000 * 60 * 30,
  });
}

// ── Hook: alertas de doenças (últimos 14 dias) ───────────────
function useAlertaDoencas(talhaoId?: string) {
  return useQuery({
    queryKey: ['alerta-doencas', talhaoId],
    queryFn: async () => {
      if (!talhaoId) return [];
      const quatorzeDias = new Date(Date.now() - 14 * 86400000).toISOString().slice(0, 10);
      const { data, error } = await supabase
        .from('ocorrencias_fitossanitarias' as any)
        .select('id, data, agente, severidade_descricao, linha')
        .eq('talhao_id', talhaoId)
        .eq('tipo', 'fungo')
        .gte('data', quatorzeDias)
        .order('data', { ascending: false });
      if (error) throw error;
      return (data as any[]) ?? [];
    },
    enabled: !!talhaoId,
    staleTime: 1000 * 60 * 5,
  });
}

// ── Componente principal ─────────────────────────────────────
export default function HomePage() {
  const navigate = useNavigate();
  const { data: stats,  isLoading: statsLoading  } = useMudasStats();
  const { data: talhoes, isLoading: talhoesLoading } = useTalhoes();

  const talhao      = talhoes?.[0];
  const talhaoId    = talhao?.id;
  const dataPlantio = talhao?.data_plantio;

  const { data: climaHoje,     isLoading: climaLoading   } = useClimaHoje(talhaoId);
  const { data: gddTotal = 0,  isLoading: gddLoading     } = useGDDAcumulado(talhaoId, dataPlantio);
  const { data: balanco,       isLoading: balancoLoading } = useBalancoHidrico(talhaoId);
  const { data: ultimaObs,     isLoading: obsLoading     } = useUltimaObservacao();
  const { data: faseGddObs                               } = useFaseGddObservada();
  const { data: alertasDoenca                            } = useAlertaDoencas(talhaoId);

  const fase           = faseGddObs ? (FASE_GDD_MAP[faseGddObs] ?? getFaseMuda(gddTotal)) : getFaseMuda(gddTotal);
  const faseIndex      = FASES_MUDA.indexOf(fase);
  const progressoGeral = Math.min(100, (gddTotal / 2000) * 100);
  const precisaIrrigar = balanco && balanco.deficit > 5;

  const diasDesdeObs = ultimaObs
    ? Math.floor((Date.now() - new Date(ultimaObs.data + 'T12:00:00').getTime()) / 86400000)
    : null;

  const temAlertaDoenca = alertasDoenca && alertasDoenca.length > 0;
  const ultimaDoenca    = alertasDoenca?.[0];

  return (
    <MainLayout>
      {/* Padding extra no topo no mobile para compensar a topbar fixa */}
      <div className="p-4 md:p-6 space-y-5 md:space-y-6">

        {/* Header */}
        <div className="animate-fade-in">
          <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>

        {/* ── Alerta de doença ── */}
        {temAlertaDoenca && (
          <button
            onClick={() => navigate('/ocorrencias-fungicas')}
            className="w-full text-left animate-fade-in"
          >
            <Card className="border-red-300 bg-red-50">
              <CardContent className="pt-4 pb-4">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-red-100 flex items-center justify-center flex-shrink-0">
                    <Bug className="w-4 h-4 text-red-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-red-800">
                      {alertasDoenca!.length === 1
                        ? 'Ocorrência fúngica nos últimos 14 dias'
                        : `${alertasDoenca!.length} ocorrências fúngicas nos últimos 14 dias`}
                    </p>
                    <p className="text-xs text-red-600 mt-0.5">
                      Última: {ultimaDoenca?.agente === 'mildio' ? 'Míldio' : 'Oídio'}
                      {ultimaDoenca?.severidade_descricao && ` — ${ultimaDoenca.severidade_descricao}`}
                      {ultimaDoenca?.linha && ` · Linha ${ultimaDoenca.linha}`}
                    </p>
                  </div>
                  <span className="text-xs text-red-500 flex-shrink-0">Ver →</span>
                </div>
              </CardContent>
            </Card>
          </button>
        )}

        {/* ── Clima hoje ── */}
        <section className="animate-fade-in" style={{ animationDelay: '50ms' }}>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Clima Hoje</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'Temperatura', icon: Thermometer, color: 'text-orange-500', bg: 'bg-orange-500/10',
                value: climaHoje ? `${climaHoje.temp_max?.toFixed(0)}° / ${climaHoje.temp_min?.toFixed(0)}°` : null },
              { label: 'Precipitação', icon: CloudRain, color: 'text-blue-500', bg: 'bg-blue-500/10',
                value: climaHoje ? `${climaHoje.precipitacao_mm?.toFixed(1) ?? '0'} mm` : null },
              { label: 'Umidade Máx.', icon: Droplets, color: 'text-sky-500', bg: 'bg-sky-500/10',
                value: climaHoje ? `${climaHoje.umidade_relativa_max?.toFixed(0) ?? '-'}%` : null },
              { label: 'GDD Hoje', icon: Leaf, color: 'text-green-500', bg: 'bg-green-500/10',
                value: climaHoje ? `+${climaHoje.graus_dia?.toFixed(1) ?? '0'}°` : null },
            ].map((item) => (
              <Card key={item.label}>
                <CardContent className="pt-4 pb-3 px-3 md:pt-5 md:pb-4 md:px-6">
                  <div className="flex items-center gap-2 md:gap-3">
                    <div className={`w-8 h-8 md:w-9 md:h-9 rounded-lg ${item.bg} flex items-center justify-center flex-shrink-0`}>
                      {climaLoading
                        ? <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />
                        : <item.icon className={`w-3.5 h-3.5 md:w-4 md:h-4 ${item.color}`} />}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] md:text-xs text-muted-foreground truncate">{item.label}</p>
                      {climaLoading
                        ? <div className="h-5 w-14 bg-muted animate-pulse rounded mt-1" />
                        : item.value
                          ? <p className="text-base md:text-lg font-bold leading-tight">{item.value}</p>
                          : <p className="text-xs text-muted-foreground">Sem dados</p>}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* ── Status das mudas ── */}
        <section className="animate-fade-in" style={{ animationDelay: '100ms' }}>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Status das Mudas</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { title: 'Total',      value: stats?.total,   icon: Grape,          color: 'text-primary',    bg: 'bg-primary/10' },
              { title: 'Ativas',     value: stats?.ativas,  icon: TrendingUp,     color: 'text-green-600',  bg: 'bg-green-500/10' },
              { title: 'Em Atenção', value: stats?.atencao, icon: AlertTriangle,  color: 'text-yellow-600', bg: 'bg-yellow-500/10' },
              { title: 'Falhas',     value: stats?.falha,   icon: XCircle,        color: 'text-red-600',    bg: 'bg-red-500/10' },
            ].map((s, i) => (
              <Card key={s.title} className="animate-fade-in" style={{ animationDelay: `${100 + i * 50}ms` }}>
                <CardContent className="pt-4 pb-3 px-3 md:pt-5 md:pb-4 md:px-6">
                  <div className="flex items-center gap-2 md:gap-3">
                    <div className={`w-8 h-8 md:w-9 md:h-9 rounded-lg ${s.bg} flex items-center justify-center flex-shrink-0`}>
                      {statsLoading
                        ? <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />
                        : <s.icon className={`w-3.5 h-3.5 md:w-4 md:h-4 ${s.color}`} />}
                    </div>
                    <div>
                      <p className="text-[11px] md:text-xs text-muted-foreground">{s.title}</p>
                      <p className="text-base md:text-lg font-bold">{statsLoading ? '-' : s.value}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* ── GDD + Balanço Hídrico ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 animate-fade-in" style={{ animationDelay: '200ms' }}>

          <Card>
            <CardContent className="pt-4 pb-4 md:pt-5 md:pb-5">
              <div className="flex items-center gap-2 mb-3 md:mb-4">
                <Sprout className="w-4 h-4 text-green-600" />
                <p className="text-sm font-semibold">Desenvolvimento das Mudas</p>
              </div>
              {gddLoading ? (
                <div className="space-y-2">
                  <div className="h-8 w-32 bg-muted animate-pulse rounded" />
                  <div className="h-2 w-full bg-muted animate-pulse rounded-full" />
                </div>
              ) : (
                <>
                  <div className="flex items-end justify-between mb-3">
                    <div>
                      <p className="text-xl md:text-2xl font-bold">{Math.round(gddTotal)} GDD</p>
                      <p className="text-xs text-muted-foreground">acumulados desde o plantio</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold" style={{ color: fase.cor }}>{fase.label}</p>
                      <p className="text-xs text-muted-foreground max-w-[130px] text-right hidden md:block">{fase.desc}</p>
                    </div>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2 mb-3">
                    <div className="h-2 rounded-full transition-all duration-700"
                      style={{ width: `${progressoGeral}%`, backgroundColor: fase.cor }} />
                  </div>
                  <div className="flex gap-1">
                    {FASES_MUDA.map((f, i) => (
                      <div key={f.label} className="flex-1 text-center">
                        <div className="h-1 rounded-full mb-1 transition-opacity"
                          style={{ backgroundColor: f.cor, opacity: i <= faseIndex ? 1 : 0.2 }} />
                        <p className="text-[9px] md:text-[10px] text-muted-foreground truncate">{f.label}</p>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card className={precisaIrrigar ? 'border-orange-400' : ''}>
            <CardContent className="pt-4 pb-4 md:pt-5 md:pb-5">
              <div className="flex items-center justify-between mb-3 md:mb-4">
                <div className="flex items-center gap-2">
                  <Droplets className="w-4 h-4 text-blue-500" />
                  <p className="text-sm font-semibold">Balanço Hídrico — 7d</p>
                </div>
                {!balancoLoading && balanco && (
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                    precisaIrrigar ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'
                  }`}>
                    {precisaIrrigar ? '⚠️ Irrigar' : '✅ Ok'}
                  </span>
                )}
              </div>
              {balancoLoading ? (
                <div className="grid grid-cols-3 gap-2">
                  {[0,1,2].map(i => <div key={i} className="h-14 bg-muted animate-pulse rounded-lg" />)}
                </div>
              ) : balanco ? (
                <>
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    {[
                      { label: 'Chuva',   value: `${balanco.chuva} mm`,   color: 'text-blue-600' },
                      { label: 'ET₀',     value: `${balanco.et0} mm`,     color: 'text-orange-600' },
                      { label: 'Déficit', value: `${balanco.deficit > 0 ? '+' : ''}${balanco.deficit} mm`,
                        color: balanco.deficit > 5 ? 'text-orange-600' : 'text-green-600' },
                    ].map(item => (
                      <div key={item.label} className="bg-muted/50 rounded-lg p-2 md:p-3 text-center">
                        <p className="text-[10px] md:text-xs text-muted-foreground mb-1">{item.label}</p>
                        <p className={`text-base md:text-lg font-bold ${item.color}`}>{item.value}</p>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {precisaIrrigar
                      ? `Déficit de ${balanco.deficit} mm — considere irrigar hoje.`
                      : 'Disponibilidade hídrica adequada esta semana.'}
                  </p>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">Sem dados climáticos.</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ── Última observação + info projeto ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 animate-fade-in" style={{ animationDelay: '300ms' }}>

          <Card className="cursor-pointer hover:border-primary/50 transition-colors active:opacity-80"
            onClick={() => navigate('/mudas')}>
            <CardContent className="pt-4 pb-4 md:pt-5 md:pb-5">
              <div className="flex items-center gap-2 mb-3">
                <ClipboardList className="w-4 h-4 text-primary" />
                <p className="text-sm font-semibold">Última Observação</p>
              </div>
              {obsLoading ? (
                <div className="space-y-2">
                  <div className="h-5 w-24 bg-muted animate-pulse rounded" />
                  <div className="h-4 w-full bg-muted animate-pulse rounded" />
                </div>
              ) : ultimaObs ? (
                <>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                      {ultimaObs.fase_fenologica}
                    </span>
                    <span className={`text-xs font-semibold ${diasDesdeObs && diasDesdeObs > 7 ? 'text-orange-600' : 'text-muted-foreground'}`}>
                      {diasDesdeObs === 0 ? 'Hoje' : diasDesdeObs === 1 ? 'Ontem' : `Há ${diasDesdeObs}d`}
                    </span>
                  </div>
                  {ultimaObs.observacoes && (
                    <p className="text-sm text-muted-foreground line-clamp-2">{ultimaObs.observacoes}</p>
                  )}
                  {diasDesdeObs && diasDesdeObs > 7 && (
                    <p className="text-xs text-orange-600 mt-2 font-medium">
                      ⚠️ Última visita há {diasDesdeObs} dias
                    </p>
                  )}
                </>
              ) : (
                <p className="text-sm text-muted-foreground">Nenhuma observação registrada.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4 pb-4 md:pt-5 md:pb-5">
              <div className="flex items-center gap-2 mb-3">
                <Grape className="w-4 h-4 text-primary" />
                <p className="text-sm font-semibold">Sobre o Projeto</p>
              </div>
              {talhoesLoading ? (
                <div className="grid grid-cols-2 gap-3">
                  {[0,1,2,3].map(i => <div key={i} className="h-10 bg-muted animate-pulse rounded" />)}
                </div>
              ) : talhao ? (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Variedade</p>
                    <p className="text-sm font-semibold">{talhao.variedade}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Talhão</p>
                    <p className="text-sm font-semibold">{talhao.codigo}{talhao.nome && ` — ${talhao.nome}`}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Plantio</p>
                    <p className="text-sm font-semibold">
                      {new Date(talhao.data_plantio + 'T12:00:00').toLocaleDateString('pt-BR', {
                        day: 'numeric', month: 'short', year: 'numeric',
                      })}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Fase Atual</p>
                    <p className="text-sm font-semibold" style={{ color: fase.cor }}>{fase.label}</p>
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">Nenhum talhão cadastrado.</p>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="h-2" />
      </div>
    </MainLayout>
  );
}