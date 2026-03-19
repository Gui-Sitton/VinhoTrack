import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useTalhaoContext } from '@/contexts/TalhaoContext';
import {
  ArrowLeft, Save, Loader2, AlertTriangle,
  Calendar, Layers, Leaf, CheckCircle2, Plus, Trash2
} from 'lucide-react';
import { RiscoFungicoCard } from '@/components/RiscoFungicoCard';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useQuery, useQueryClient } from '@tanstack/react-query';

// ─── Types ────────────────────────────────────────────────────────────────────

type Doenca = 'mildio' | 'oidio';
type Severidade = 'leve' | 'moderada' | 'grave';
type ParteAfetada = 'folha' | 'cacho' | 'ramo' | 'brotacao';

interface Ocorrencia {
  id: string;
  data: string;
  agente: string;
  severidade_descricao: string;
  linha: number | null;
  parte_afetada: string | null;
  acao_tomada: string | null;
  observacao: string | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const DOENCA_LABEL: Record<Doenca, string> = {
  mildio: 'Míldio',
  oidio:  'Oídio',
};

const DOENCA_DESC: Record<Doenca, string> = {
  mildio: 'Plasmopara viticola — manchas amarelas, mofo branco',
  oidio:  'Uncinula necator — pó branco, tecido ressecado',
};

const SEVERIDADE_COLOR: Record<Severidade, string> = {
  leve:     'bg-yellow-50 border-yellow-300 text-yellow-700',
  moderada: 'bg-orange-50 border-orange-300 text-orange-700',
  grave:    'bg-red-50 border-red-300 text-red-700',
};

const PARTE_LABEL: Record<ParteAfetada, string> = {
  folha:    'Folha',
  cacho:    'Cacho',
  ramo:     'Ramo',
  brotacao: 'Brotação',
};

// ─── Hook histórico ───────────────────────────────────────────────────────────

function useOcorrenciasFungicas(talhaoId?: string) {
  return useQuery({
    queryKey: ['ocorrencias-fungicas', talhaoId],
    queryFn: async () => {
      if (!talhaoId) return [];
      const { data, error } = await supabase
        .from('ocorrencias_fitossanitarias' as any)
        .select('id, data, agente, severidade_descricao, linha, parte_afetada, acao_tomada, observacao')
        .eq('talhao_id', talhaoId)
        .eq('tipo', 'fungo')
        .order('data', { ascending: false })
        .limit(20);
      if (error) throw error;
      return (data as any ?? []) as Ocorrencia[];
    },
    enabled: !!talhaoId,
    staleTime: 1000 * 60 * 5,
  });
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function OcorrenciaFungicaPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { talhaoAtivo: talhao } = useTalhaoContext();

  const { data: historico, isLoading: loadingHistorico } = useOcorrenciasFungicas(talhao?.id);

  const [etapa, setEtapa] = useState<'form' | 'historico'>('form');
  const [salvando, setSalvando] = useState(false);

  const [form, setForm] = useState({
    data: new Date().toISOString().split('T')[0],
    doenca: '' as Doenca | '',
    severidade: '' as Severidade | '',
    linha: '',
    partes: [] as ParteAfetada[],
    acao_tomada: '',
    observacao: '',
  });

  function toggleParte(p: ParteAfetada) {
    setForm(prev => ({
      ...prev,
      partes: prev.partes.includes(p)
        ? prev.partes.filter(x => x !== p)
        : [...prev.partes, p],
    }));
  }

  async function salvar() {
    if (!form.doenca || !form.severidade) {
      toast({ title: 'Selecione a doença e a severidade', variant: 'destructive' });
      return;
    }
    if (!talhao) {
      toast({ title: 'Nenhum talhão encontrado', variant: 'destructive' });
      return;
    }

    setSalvando(true);
    try {
      const { error } = await supabase
        .from('ocorrencias_fitossanitarias' as any)
        .insert(({
          talhao_id: talhao.id,
          tipo: 'fungo',
          agente: form.doenca,
          data: form.data,
          severidade: form.severidade === 'leve' ? 1 : form.severidade === 'moderada' ? 3 : 5,
          severidade_descricao: form.severidade,
          linha: form.linha ? parseInt(form.linha) : null,
          parte_afetada: form.partes.length > 0 ? form.partes.join(',') : null,
          acao_tomada: form.acao_tomada || null,
          observacao: form.observacao || null,
        } as any));

      if (error) throw error;

      await queryClient.invalidateQueries({ queryKey: ['ocorrencias-fungicas'] });
      await queryClient.invalidateQueries({ queryKey: ['ocorrencias-dashboard'] });

      toast({ title: `${DOENCA_LABEL[form.doenca as Doenca]} registrada!` });
      setForm({
        data: new Date().toISOString().split('T')[0],
        doenca: '',
        severidade: '',
        linha: '',
        partes: [],
        acao_tomada: '',
        observacao: '',
      });
    } catch (err: any) {
      toast({ title: 'Erro ao salvar', description: err.message, variant: 'destructive' });
    } finally {
      setSalvando(false);
    }
  }

  async function excluir(id: string) {
    const { error } = await supabase
      .from('ocorrencias_fitossanitarias' as any)
      .delete()
      .eq('id', id);
    if (error) {
      toast({ title: 'Erro ao excluir', variant: 'destructive' });
      return;
    }
    await queryClient.invalidateQueries({ queryKey: ['ocorrencias-fungicas'] });
    toast({ title: 'Ocorrência removida' });
  }

  return (
    <MainLayout>
      <div className="p-6 max-w-2xl space-y-6">

        {/* Header */}
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
            <ArrowLeft size={18} className="text-muted-foreground" />
          </button>
          <div className="flex-1">
            <h1 className="font-display text-2xl font-bold text-foreground">Ocorrência Fúngica</h1>
            <p className="text-muted-foreground text-sm">Registre míldio ou oídio no talhão</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant={etapa === 'form' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setEtapa('form')}
            >
              <Plus size={14} className="mr-1" /> Novo
            </Button>
            <Button
              variant={etapa === 'historico' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setEtapa('historico')}
            >
              Histórico
              {historico && historico.length > 0 && (
                <Badge className="ml-1.5 h-4 px-1 text-[10px]">{historico.length}</Badge>
              )}
            </Button>
          </div>
        </div>

        {/* ── Card de Risco ── */}
        <RiscoFungicoCard talhaoId={talhao?.id} />

        {/* ── FORMULÁRIO ── */}
        {etapa === 'form' && (
          <div className="space-y-4">

            {/* Data */}
            <div className="space-y-1.5">
              <Label>Data</Label>
              <Input
                type="date"
                value={form.data}
                onChange={e => setForm(p => ({ ...p, data: e.target.value }))}
              />
            </div>

            {/* Doença */}
            <div className="space-y-1.5">
              <Label>Doença <span className="text-red-500">*</span></Label>
              <div className="grid grid-cols-2 gap-3">
                {(['mildio', 'oidio'] as Doenca[]).map(d => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setForm(p => ({ ...p, doenca: d }))}
                    className={`p-3 rounded-lg border text-left transition-all ${
                      form.doenca === d
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/40'
                    }`}
                  >
                    <p className="font-medium text-sm text-foreground">{DOENCA_LABEL[d]}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{DOENCA_DESC[d]}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Severidade */}
            <div className="space-y-1.5">
              <Label>Severidade <span className="text-red-500">*</span></Label>
              <div className="grid grid-cols-3 gap-2">
                {(['leve', 'moderada', 'grave'] as Severidade[]).map(s => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setForm(p => ({ ...p, severidade: s }))}
                    className={`py-2.5 px-3 rounded-lg border text-sm font-medium capitalize transition-all ${
                      form.severidade === s
                        ? SEVERIDADE_COLOR[s]
                        : 'border-border text-muted-foreground hover:border-primary/40'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-3 gap-2 text-[10px] text-muted-foreground px-1">
                <span>Focos isolados</span>
                <span className="text-center">Múltiplos focos</span>
                <span className="text-right">Disseminado</span>
              </div>
            </div>

            {/* Linha */}
            <div className="space-y-1.5">
              <Label>
                Linha afetada
                <span className="text-muted-foreground font-normal ml-1">(deixe vazio para talhão inteiro)</span>
              </Label>
              <Input
                type="number"
                placeholder="ex: 3"
                value={form.linha}
                onChange={e => setForm(p => ({ ...p, linha: e.target.value }))}
              />
            </div>

            {/* Parte afetada */}
            <div className="space-y-1.5">
              <Label>Parte afetada</Label>
              <div className="flex flex-wrap gap-2">
                {(['folha', 'cacho', 'ramo', 'brotacao'] as ParteAfetada[]).map(p => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => toggleParte(p)}
                    className={`px-3 py-1.5 rounded-lg border text-sm transition-all ${
                      form.partes.includes(p)
                        ? 'border-primary bg-primary/5 text-primary font-medium'
                        : 'border-border text-muted-foreground hover:border-primary/40'
                    }`}
                  >
                    {PARTE_LABEL[p]}
                  </button>
                ))}
              </div>
            </div>

            {/* Ação tomada */}
            <div className="space-y-1.5">
              <Label>Ação tomada</Label>
              <Input
                placeholder="ex: Aplicação de fungicida cúprico"
                value={form.acao_tomada}
                onChange={e => setForm(p => ({ ...p, acao_tomada: e.target.value }))}
              />
            </div>

            {/* Observações */}
            <div className="space-y-1.5">
              <Label>Observações</Label>
              <Textarea
                placeholder="Anotações livres..."
                value={form.observacao}
                onChange={e => setForm(p => ({ ...p, observacao: e.target.value }))}
                className="resize-none min-h-[80px]"
              />
            </div>

            <Button className="w-full h-11" onClick={salvar} disabled={salvando}>
              {salvando
                ? <><Loader2 size={15} className="animate-spin mr-2" />Salvando...</>
                : <><Save size={15} className="mr-2" />Registrar ocorrência</>
              }
            </Button>
          </div>
        )}

        {/* ── HISTÓRICO ── */}
        {etapa === 'historico' && (
          <div className="space-y-3">
            {loadingHistorico ? (
              <div className="flex justify-center py-8">
                <Loader2 className="animate-spin text-primary" />
              </div>
            ) : historico && historico.length > 0 ? (
              historico.map(o => (
                <Card key={o.id}>
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 space-y-1.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-sm text-foreground">
                            {o.agente === 'mildio' ? 'Míldio' : o.agente === 'oidio' ? 'Oídio' : o.agente}
                          </span>
                          {o.severidade_descricao && (
                            <Badge variant="outline" className={`text-[10px] capitalize ${
                              o.severidade_descricao === 'grave' ? 'border-red-300 text-red-700 bg-red-50' :
                              o.severidade_descricao === 'moderada' ? 'border-orange-300 text-orange-700 bg-orange-50' :
                              'border-yellow-300 text-yellow-700 bg-yellow-50'
                            }`}>
                              {o.severidade_descricao}
                            </Badge>
                          )}
                          {o.linha && (
                            <Badge variant="outline" className="text-[10px]">
                              Linha {o.linha}
                            </Badge>
                          )}
                          {!o.linha && (
                            <Badge variant="outline" className="text-[10px]">
                              Talhão inteiro
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(o.data + 'T12:00:00'), "d 'de' MMMM 'de' yyyy", { locale: ptBR })}
                        </p>
                        {o.parte_afetada && (
                          <p className="text-xs text-muted-foreground">
                            Partes: {o.parte_afetada.split(',').map((p: string) => PARTE_LABEL[p as ParteAfetada] ?? p).join(', ')}
                          </p>
                        )}
                        {o.acao_tomada && (
                          <p className="text-xs text-foreground">
                            <span className="text-muted-foreground">Ação: </span>{o.acao_tomada}
                          </p>
                        )}
                        {o.observacao && (
                          <p className="text-xs text-muted-foreground">{o.observacao}</p>
                        )}
                      </div>
                      <button
                        onClick={() => excluir(o.id)}
                        className="p-1.5 rounded hover:bg-red-50 text-muted-foreground hover:text-red-600 transition-colors flex-shrink-0"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <AlertTriangle className="mx-auto mb-3 opacity-30" size={32} />
                <p>Nenhuma ocorrência registrada ainda.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </MainLayout>
  );
}