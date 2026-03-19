import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Leaf, ChevronRight, ChevronLeft, SkipForward,
  CheckCircle2, AlertCircle, Star, ArrowLeft,
  Save, RotateCcw, Sprout, Clock, Users
} from 'lucide-react';
import { differenceInDays } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { useTalhaoContext } from '@/contexts/TalhaoContext';

// ─── Types ────────────────────────────────────────────────────────────────────

type Grupo = 'A' | 'B' | 'C' | 'D' | 'S';

interface MudaInfo {
  id: string;
  codigo: string;
  linha: number;
  planta_na_linha: number;
  grupo_observacao: string | null;
  is_sentinela: boolean;
  ultima_observacao: string | null;
  dias_sem_medir: number | null;
}

interface GrupoStats {
  grupo: Grupo;
  total: number;
  sem_obs: number;
  media_dias: number | null;
}

interface FormData {
  altura_cm: string;
  diametro_caule_mm: string;
  numero_nos: string;
  atingiu_arame: boolean;
  necessita_tutoramento: boolean;
  observacoes: string;
  fase_fenologica: string;
}

const FORM_VAZIO: FormData = {
  altura_cm: '',
  diametro_caule_mm: '',
  numero_nos: '',
  atingiu_arame: false,
  necessita_tutoramento: false,
  observacoes: '',
  fase_fenologica: '',
};

// ─── Fases fenológicas ────────────────────────────────────────────────────────

const FASES_VISUAIS = [
  { value: 'dormencia',              label: 'Dormência' },
  { value: 'inchamento_gemeas',      label: 'Inchamento de gemas' },
  { value: 'brotacao',               label: 'Brotação' },
  { value: 'crescimento_vegetativo', label: 'Crescimento vegetativo' },
  { value: 'lignificacao',           label: 'Lignificação' },
  { value: 'maturacao',              label: 'Maturação' },
];

const FASES_GDD = [
  { label: 'estabelecimento',        gddMin: 0,    gddMax: 150  },
  { label: 'brotacao',               gddMin: 150,  gddMax: 400  },
  { label: 'crescimento_vegetativo', gddMin: 400,  gddMax: 800  },
  { label: 'lignificacao',           gddMin: 800,  gddMax: 1300 },
  { label: 'maturacao',              gddMin: 1300, gddMax: 9999 },
];

function calcFaseGdd(gdd: number): string {
  return (FASES_GDD.find(f => gdd >= f.gddMin && gdd < f.gddMax) ?? FASES_GDD[FASES_GDD.length - 1]).label;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const GRUPO_LABEL: Record<Grupo, string> = {
  A: 'Grupo A', B: 'Grupo B', C: 'Grupo C', D: 'Grupo D', S: 'Sentinelas',
};

const GRUPO_COLOR: Record<Grupo, string> = {
  A: 'text-emerald-700 bg-emerald-50 border-emerald-200',
  B: 'text-lime-700 bg-lime-50 border-lime-200',
  C: 'text-amber-700 bg-amber-50 border-amber-200',
  D: 'text-orange-700 bg-orange-50 border-orange-200',
  S: 'text-yellow-700 bg-yellow-50 border-yellow-200',
};

const GRUPO_DOT: Record<Grupo, string> = {
  A: 'bg-emerald-500', B: 'bg-lime-500', C: 'bg-amber-500',
  D: 'bg-orange-500', S: 'bg-yellow-500',
};

function diasLabel(dias: number | null): string {
  if (dias === null) return 'nunca medida';
  if (dias === 0) return 'hoje';
  if (dias === 1) return 'ontem';
  return `há ${dias}d`;
}

function diasColor(dias: number | null, isSentinela: boolean): string {
  const limite = isSentinela ? 8 : 30;
  if (dias === null) return 'text-red-600';
  if (dias > limite) return 'text-orange-600';
  return 'text-muted-foreground';
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function SessaoObservacaoPage() {
  const { toast } = useToast();

  const [etapa, setEtapa] = useState<'select' | 'list' | 'form'>('select');
  const [grupoSelecionado, setGrupoSelecionado] = useState<Grupo | null>(null);
  const [stats, setStats] = useState<GrupoStats[]>([]);
  const [mudas, setMudas] = useState<MudaInfo[]>([]);
  const [indiceAtual, setIndiceAtual] = useState(0);
  const [formData, setFormData] = useState<FormData>(FORM_VAZIO);
  const [salvando, setSalvando] = useState(false);
  const [concluidas, setConcluidas] = useState<Set<string>>(new Set());
  const [puladas, setPuladas] = useState<Set<string>>(new Set());
  const [loadingStats, setLoadingStats] = useState(true);
  const [gddAcumulado, setGddAcumulado] = useState(0);
  const [loadingMudas, setLoadingMudas] = useState(false);
  const [talhaoId, setTalhaoId] = useState<string | null>(null);

  // ── Talhão via contexto ──────────────────────────────────────────────────
  const { talhaoAtivo } = useTalhaoContext();

  useEffect(() => {
    if (!talhaoAtivo) return;
    setTalhaoId(talhaoAtivo.id);

    // Busca GDD acumulado desde o plantio
    async function fetchGdd() {
      if (!talhaoAtivo.data_plantio) return;
      const { data: climaData } = await supabase
        .from('clima_diario' as any)
        .select('graus_dia')
        .eq('talhao_id', talhaoAtivo.id)
        .gte('data', talhaoAtivo.data_plantio);
      const total = (climaData ?? []).reduce((acc: number, r: any) => acc + (r.graus_dia ?? 0), 0);
      setGddAcumulado(Math.round(total));
    }
    fetchGdd();
  }, [talhaoAtivo]);

  // ── Stats por grupo ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!talhaoId) return;
    async function fetchStats() {
      setLoadingStats(true);

      // Query 1: mudas sem join
      const { data: mudaData, error: e1 } = await supabase
        .from('mudas' as any)
        .select('id, grupo_observacao, is_sentinela')
        .eq('talhao_id', talhaoId);

      if (e1 || !mudaData) { setLoadingStats(false); return; }

      // Query 2: última observação por muda (separada, sem join reverso)
      const mudaIds = (mudaData as any[]).map((m: any) => m.id);
      const { data: obsData } = await supabase
        .from('observacoes_mudas')
        .select('muda_id, data_observacao')
        .in('muda_id', mudaIds)
        .order('data_observacao', { ascending: false });

      // muda_id → dias desde última obs
      const hoje = new Date();
      const ultimaPorMuda: Record<string, number> = {};
      (obsData ?? []).forEach((o: any) => {
        if (!(o.muda_id in ultimaPorMuda)) {
          ultimaPorMuda[o.muda_id] = differenceInDays(hoje, new Date(o.data_observacao));
        }
      });

      const grupos: Grupo[] = ['A', 'B', 'C', 'D', 'S'];
      const result: GrupoStats[] = grupos.map(g => {
        const subset = (mudaData as any[]).filter((m: any) =>
          g === 'S' ? m.is_sentinela : m.grupo_observacao === g
        );
        const diasList = subset.map((m: any) =>
          m.id in ultimaPorMuda ? ultimaPorMuda[m.id] : null
        );
        const semObs = diasList.filter(d => d === null).length;
        const comObs = diasList.filter((d): d is number => d !== null);
        const media = comObs.length > 0
          ? Math.round(comObs.reduce((a, b) => a + b, 0) / comObs.length)
          : null;
        return { grupo: g, total: subset.length, sem_obs: semObs, media_dias: media };
      });

      setStats(result);
      setLoadingStats(false);
    }
    fetchStats();
  }, [talhaoId]);

  // ── Carrega mudas do grupo ───────────────────────────────────────────────
  const carregarMudas = useCallback(async (grupo: Grupo) => {
    if (!talhaoId) return;
    setLoadingMudas(true);

    // Query 1: mudas sem join
    const query: any = supabase
      .from('mudas' as any)
      .select('id, codigo, linha, planta_na_linha, grupo_observacao, is_sentinela')
      .eq('talhao_id', talhaoId)
      .order('linha')
      .order('planta_na_linha');

    if (grupo === 'S') {
      query.filter('is_sentinela', 'eq', true);
    } else {
      query.filter('is_sentinela', 'eq', false).eq('grupo_observacao', grupo);
    }

    const { data } = await query;
    if (!data) { setLoadingMudas(false); return; }

    // Query 2: última observação de cada muda (query separada)
    const mudaIds = (data as any[]).map((m: any) => m.id);
    const { data: obsData } = await supabase
      .from('observacoes_mudas')
      .select('muda_id, data_observacao')
      .in('muda_id', mudaIds)
      .order('data_observacao', { ascending: false });

    const hoje = new Date();
    const ultimaPorMuda: Record<string, string> = {};
    (obsData ?? []).forEach((o: any) => {
      if (!(o.muda_id in ultimaPorMuda)) ultimaPorMuda[o.muda_id] = o.data_observacao;
    });

    const processadas: MudaInfo[] = (data as any[]).map((m: any) => {
      const ultima = ultimaPorMuda[m.id] ?? null;
      return {
        id: m.id, codigo: m.codigo, linha: m.linha,
        planta_na_linha: m.planta_na_linha,
        grupo_observacao: m.grupo_observacao,
        is_sentinela: m.is_sentinela,
        ultima_observacao: ultima,
        dias_sem_medir: ultima ? differenceInDays(hoje, new Date(ultima)) : null,
      };
    });

    setMudas(processadas);
    setLoadingMudas(false);
  }, [talhaoId]);

  async function selecionarGrupo(g: Grupo) {
    setGrupoSelecionado(g);
    setIndiceAtual(0);
    setConcluidas(new Set());
    setPuladas(new Set());
    await carregarMudas(g);
    setEtapa('list');
  }

  function iniciarObservacao(idx: number) {
    setIndiceAtual(idx);
    setFormData(FORM_VAZIO);
    setEtapa('form');
  }

  async function salvarObservacao() {
    const muda = mudas[indiceAtual];
    if (!muda) return;
    if (!formData.altura_cm) {
      toast({ title: 'Altura obrigatória', variant: 'destructive' });
      return;
    }
    if (!formData.fase_fenologica) {
      toast({ title: 'Fase fenológica obrigatória', variant: 'destructive' });
      return;
    }
    setSalvando(true);
    const { error } = await supabase.from('observacoes_mudas' as any).insert(({
      muda_id: muda.id,
      data: new Date().toISOString().split('T')[0],
      fase_fenologica: formData.fase_fenologica || 'crescimento_vegetativo',
      fase_gdd: calcFaseGdd(gddAcumulado),
      altura_cm: parseFloat(formData.altura_cm),
      diametro_caule_mm: formData.diametro_caule_mm ? parseFloat(formData.diametro_caule_mm) : null,
      numero_nos: formData.numero_nos ? parseInt(formData.numero_nos) : null,
      atingiu_arame: formData.atingiu_arame,
      necessita_tutoramento: formData.necessita_tutoramento,
      observacoes: formData.observacoes || null,
    } as any));
    setSalvando(false);
    if (error) {
      toast({ title: 'Erro ao salvar', description: error.message, variant: 'destructive' });
      return;
    }
    setConcluidas(prev => new Set([...prev, muda.id]));
    toast({ title: `✓ ${muda.codigo} salva` });
    avancar();
  }

  function pularMuda() {
    const muda = mudas[indiceAtual];
    if (muda) setPuladas(prev => new Set([...prev, muda.id]));
    avancar();
  }

  function avancar() {
    const proxIdx = mudas.findIndex((m, i) =>
      i > indiceAtual && !concluidas.has(m.id) && !puladas.has(m.id)
    );
    if (proxIdx !== -1) { setIndiceAtual(proxIdx); setFormData(FORM_VAZIO); }
    else setEtapa('list');
  }

  function voltar() {
    if (etapa === 'form') { setEtapa('list'); return; }
    if (etapa === 'list') { setEtapa('select'); setGrupoSelecionado(null); }
  }

  const mudaAtual = mudas[indiceAtual];
  const totalPendentes = mudas.filter(m => !concluidas.has(m.id) && !puladas.has(m.id)).length;
  const progresso = mudas.length > 0
    ? Math.round(((concluidas.size + puladas.size) / mudas.length) * 100) : 0;
  const proximaIdx = mudas.findIndex((m, i) =>
    i > indiceAtual && !concluidas.has(m.id) && !puladas.has(m.id)
  );

  // ─── ETAPA: SELEÇÃO ────────────────────────────────────────────────────────
  if (etapa === 'select') {
    return (
      <MainLayout>
        <div className="p-6 space-y-6">
          <div>
            <h1 className="font-display text-3xl font-bold text-foreground">Sessão de Observação</h1>
            <p className="text-muted-foreground mt-1">Selecione o grupo de hoje para iniciar a coleta</p>
          </div>

          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Grupos Rotativos
            </p>

            {loadingStats ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[0,1,2,3].map(i => (
                  <div key={i} className="h-24 rounded-xl bg-muted animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {(['A','B','C','D'] as Grupo[]).map(g => {
                  const s = stats.find(x => x.grupo === g);
                  if (!s) return null;
                  return (
                    <Card
                      key={g}
                      className="cursor-pointer hover:border-primary/50 hover:shadow-sm transition-all"
                      onClick={() => selecionarGrupo(g)}
                    >
                      <CardContent className="pt-5 pb-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`w-9 h-9 rounded-lg border flex items-center justify-center font-bold text-sm ${GRUPO_COLOR[g]}`}>
                              {g}
                            </div>
                            <div>
                              <p className="font-semibold text-foreground">{GRUPO_LABEL[g]}</p>
                              <p className="text-xs text-muted-foreground">
                                {s.total} mudas
                                {s.sem_obs > 0 && (
                                  <span className="text-orange-600 ml-1">· {s.sem_obs} nunca medidas</span>
                                )}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            {s.media_dias !== null && (
                              <div className="text-right">
                                <p className={`text-sm font-semibold ${s.media_dias > 30 ? 'text-orange-600' : s.media_dias > 20 ? 'text-amber-600' : 'text-muted-foreground'}`}>
                                  {s.media_dias}d
                                </p>
                                <p className="text-[10px] text-muted-foreground">média</p>
                              </div>
                            )}
                            <ChevronRight size={16} className="text-muted-foreground" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>

          {/* Sentinelas */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Monitoramento Semanal
            </p>
            {!loadingStats && (() => {
              const s = stats.find(x => x.grupo === 'S');
              if (!s) return null;
              return (
                <Card
                  className="cursor-pointer hover:border-yellow-400 hover:shadow-sm transition-all border-yellow-200"
                  onClick={() => selecionarGrupo('S')}
                >
                  <CardContent className="pt-5 pb-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg border border-yellow-200 bg-yellow-50 flex items-center justify-center">
                          <Star size={16} className="text-yellow-600 fill-yellow-400" />
                        </div>
                        <div>
                          <p className="font-semibold text-foreground">Sentinelas</p>
                          <p className="text-xs text-muted-foreground">
                            {s.total} mudas · medição semanal recomendada
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {s.media_dias !== null && (
                          <div className="text-right">
                            <p className={`text-sm font-semibold ${s.media_dias > 8 ? 'text-orange-600' : 'text-muted-foreground'}`}>
                              {s.media_dias}d
                            </p>
                            <p className="text-[10px] text-muted-foreground">média</p>
                          </div>
                        )}
                        <ChevronRight size={16} className="text-muted-foreground" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })()}
          </div>
        </div>
      </MainLayout>
    );
  }

  // ─── ETAPA: LISTA ──────────────────────────────────────────────────────────
  if (etapa === 'list') {
    return (
      <MainLayout>
        <div className="p-6 space-y-6">

          {/* Header */}
          <div className="flex items-center gap-3">
            <button onClick={voltar} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
              <ArrowLeft size={18} className="text-muted-foreground" />
            </button>
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="font-display text-2xl font-bold text-foreground">
                  {grupoSelecionado ? GRUPO_LABEL[grupoSelecionado] : ''}
                </h1>
                {concluidas.size > 0 && (
                  <Badge variant="outline" className="text-emerald-700 border-emerald-200 bg-emerald-50">
                    {concluidas.size} salvas
                  </Badge>
                )}
                {puladas.size > 0 && (
                  <Badge variant="outline" className="text-muted-foreground">
                    {puladas.size} puladas
                  </Badge>
                )}
              </div>
              <p className="text-muted-foreground text-sm">{mudas.length} mudas · {totalPendentes} pendentes</p>
            </div>
          </div>

          {/* Progresso */}
          {progresso > 0 && (
            <div>
              <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
                <span>Progresso da sessão</span>
                <span>{progresso}%</span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-500"
                  style={{ width: `${progresso}%` }}
                />
              </div>
            </div>
          )}

          {/* Concluído */}
          {progresso === 100 && (
            <Card className="border-emerald-200 bg-emerald-50">
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center gap-3">
                  <CheckCircle2 size={20} className="text-emerald-600 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-emerald-800">Sessão concluída!</p>
                    <p className="text-xs text-emerald-700">{concluidas.size} observações registradas hoje</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Botão iniciar */}
          {totalPendentes > 0 && (
            <Button
              className="w-full"
              onClick={() => {
                const idx = mudas.findIndex(m => !concluidas.has(m.id) && !puladas.has(m.id));
                if (idx !== -1) iniciarObservacao(idx);
              }}
            >
              <Leaf size={16} className="mr-2" />
              {concluidas.size === 0 ? 'Iniciar sessão' : 'Continuar sessão'}
              <span className="ml-1 text-xs opacity-70">({totalPendentes} restantes)</span>
            </Button>
          )}

          {/* Lista */}
          {loadingMudas ? (
            <div className="space-y-2">
              {Array.from({length: 8}).map((_, i) => (
                <div key={i} className="h-14 rounded-lg bg-muted animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="space-y-1.5">
              {mudas.map((muda, idx) => {
                const feita = concluidas.has(muda.id);
                const pulada = puladas.has(muda.id);
                return (
                  <button
                    key={muda.id}
                    onClick={() => !feita && iniciarObservacao(idx)}
                    disabled={feita}
                    className={`w-full text-left rounded-lg border px-4 py-3 flex items-center gap-3 transition-all ${
                      feita
                        ? 'border-emerald-200 bg-emerald-50/50 opacity-60'
                        : pulada
                        ? 'border-border bg-background opacity-40'
                        : 'border-border bg-card hover:border-primary/40 hover:shadow-sm'
                    }`}
                  >
                    <div className="flex-shrink-0 w-5 h-5 flex items-center justify-center">
                      {feita ? (
                        <CheckCircle2 size={16} className="text-emerald-600" />
                      ) : (
                        <div className="w-4 h-4 rounded-full border-2 border-muted-foreground/30" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-medium text-foreground">{muda.codigo}</span>
                        {muda.is_sentinela && (
                          <Star size={10} className="text-yellow-500 fill-yellow-400 flex-shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Linha {muda.linha} · Planta {muda.planta_na_linha}
                      </p>
                    </div>
                    <span className={`text-xs flex-shrink-0 ${diasColor(muda.dias_sem_medir, muda.is_sentinela)}`}>
                      {diasLabel(muda.dias_sem_medir)}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </MainLayout>
    );
  }

  // ─── ETAPA: FORMULÁRIO ─────────────────────────────────────────────────────
  if (etapa === 'form' && mudaAtual) {
    return (
      <MainLayout>
        <div className="p-6 max-w-lg">

          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <button onClick={voltar} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
              <ArrowLeft size={18} className="text-muted-foreground" />
            </button>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h1 className="font-display text-2xl font-bold text-foreground">{mudaAtual.codigo}</h1>
                {mudaAtual.is_sentinela && (
                  <Star size={14} className="text-yellow-500 fill-yellow-400" />
                )}
              </div>
              <p className="text-muted-foreground text-sm">
                Linha {mudaAtual.linha} · Planta {mudaAtual.planta_na_linha}
                <span className={`ml-2 ${diasColor(mudaAtual.dias_sem_medir, mudaAtual.is_sentinela)}`}>
                  · {diasLabel(mudaAtual.dias_sem_medir)}
                </span>
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-foreground">{indiceAtual + 1}/{mudas.length}</p>
              <p className="text-xs text-muted-foreground">{totalPendentes} restantes</p>
            </div>
          </div>

          {/* Barra de progresso */}
          <div className="h-1.5 rounded-full bg-muted overflow-hidden mb-6">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${((indiceAtual + 1) / mudas.length) * 100}%` }}
            />
          </div>

          {/* Formulário */}
          <div className="space-y-5">

            {/* Altura */}
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">
                Altura <span className="text-red-500">*</span>
                <span className="text-muted-foreground font-normal ml-1">(cm)</span>
              </label>
              <Input
                type="number"
                step="0.5"
                placeholder="ex: 45.5"
                value={formData.altura_cm}
                onChange={e => setFormData(p => ({ ...p, altura_cm: e.target.value }))}
                className="text-lg h-12"
                autoFocus
              />
            </div>

            {/* Diâmetro + Nós */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">
                  Diâmetro caule
                  <span className="text-muted-foreground font-normal ml-1">(mm)</span>
                </label>
                <Input
                  type="number"
                  step="0.1"
                  placeholder="ex: 8.2"
                  value={formData.diametro_caule_mm}
                  onChange={e => setFormData(p => ({ ...p, diametro_caule_mm: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">
                  Nº nós
                </label>
                <Input
                  type="number"
                  placeholder="ex: 12"
                  value={formData.numero_nos}
                  onChange={e => setFormData(p => ({ ...p, numero_nos: e.target.value }))}
                />
              </div>
            </div>

            {/* Checkboxes */}
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFormData(p => ({ ...p, atingiu_arame: !p.atingiu_arame }))}
                className={`py-3 px-4 rounded-lg border text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                  formData.atingiu_arame
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                    : 'bg-background border-border text-muted-foreground hover:border-primary/40'
                }`}
              >
                <CheckCircle2 size={15} className={formData.atingiu_arame ? 'text-emerald-600' : 'text-muted-foreground'} />
                Atingiu arame
              </button>
              <button
                type="button"
                onClick={() => setFormData(p => ({ ...p, necessita_tutoramento: !p.necessita_tutoramento }))}
                className={`py-3 px-4 rounded-lg border text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                  formData.necessita_tutoramento
                    ? 'bg-amber-50 border-amber-300 text-amber-700'
                    : 'bg-background border-border text-muted-foreground hover:border-primary/40'
                }`}
              >
                <AlertCircle size={15} className={formData.necessita_tutoramento ? 'text-amber-600' : 'text-muted-foreground'} />
                Tutoramento
              </button>
            </div>

            {/* Fase visual + GDD */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">
                  Fase visual <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.fase_fenologica}
                  onChange={e => setFormData(p => ({ ...p, fase_fenologica: e.target.value }))}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  <option value="">Selecione...</option>
                  {FASES_VISUAIS.map(f => (
                    <option key={f.value} value={f.value}>{f.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">
                  Fase GDD
                </label>
                <div className="h-9 rounded-md border border-input bg-muted px-3 py-1 text-sm flex items-center text-muted-foreground">
                  {calcFaseGdd(gddAcumulado).replace(/_/g, ' ')}
                  <span className="ml-auto text-xs opacity-60">{gddAcumulado} GDD</span>
                </div>
              </div>
            </div>

            {/* Observações */}
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">
                Observações
              </label>
              <Textarea
                placeholder="Anotações livres..."
                value={formData.observacoes}
                onChange={e => setFormData(p => ({ ...p, observacoes: e.target.value }))}
                className="resize-none min-h-[80px]"
              />
            </div>
          </div>

          {/* Ações */}
          <div className="mt-6 space-y-2">
            <Button
              onClick={salvarObservacao}
              disabled={salvando}
              className="w-full h-11"
            >
              <Save size={15} className="mr-2" />
              {salvando ? 'Salvando...' : proximaIdx !== -1 ? 'Salvar e avançar' : 'Salvar'}
            </Button>

            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                onClick={pularMuda}
              >
                <SkipForward size={14} className="mr-1.5" />
                Pular
              </Button>
              <Button
                variant="outline"
                onClick={() => setFormData(FORM_VAZIO)}
              >
                <RotateCcw size={14} className="mr-1.5" />
                Limpar
              </Button>
            </div>
          </div>

          {/* Próxima muda */}
          {proximaIdx !== -1 && (
            <p className="text-xs text-muted-foreground mt-4 text-center">
              Próxima: <span className="font-medium text-foreground">{mudas[proximaIdx].codigo}</span>
              {' '}· L{mudas[proximaIdx].linha} P{mudas[proximaIdx].planta_na_linha}
            </p>
          )}
        </div>
      </MainLayout>
    );
  }

  return null;
}