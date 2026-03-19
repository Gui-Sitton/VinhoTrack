import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Grape, Loader2, MapPin, ChevronRight, ChevronLeft, CheckCircle2, ArrowLeft } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';

const VARIEDADES = [
  'Marselan', 'Cabernet Sauvignon', 'Merlot', 'Pinot Noir',
  'Chardonnay', 'Sauvignon Blanc', 'Syrah', 'Tannat',
  'Cabernet Franc', 'Malbec', 'Outro',
];

const PORTA_ENXERTOS = [
  'SO4', 'Paulsen 1103', '101-14 Mgt', 'Kober 5BB',
  'Riparia Gloire', '420A', 'Gravesac', 'Outro',
];

export default function CadastroTalhaoPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const modoAdicionar = searchParams.get('modo') === 'adicionar';
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [etapa, setEtapa] = useState<1 | 2>(1);
  const [salvando, setSalvando] = useState(false);
  const [buscandoLocalizacao, setBuscandoLocalizacao] = useState(false);

  const [form, setForm] = useState({
    codigo: '',
    nome: '',
    variedade: '',
    data_plantio: '',
    area_ha: '',
    espacamento_linhas_m: '3.0',
    espacamento_plantas_m: '1.5',
    porta_enxerto: '',
    latitude: '',
    longitude: '',
  });

  const [mudaConfig, setMudaConfig] = useState({
    num_linhas: '',
    plantas_por_linha: '',
    prefixo: 'M',
  });

  const totalMudas = (() => {
    const l = parseInt(mudaConfig.num_linhas) || 0;
    const p = parseInt(mudaConfig.plantas_por_linha) || 0;
    return l * p;
  })();

  function set(field: string, value: string) {
    setForm(p => ({ ...p, [field]: value }));
  }

  function setMuda(field: string, value: string) {
    setMudaConfig(p => ({ ...p, [field]: value }));
  }

  function buscarLocalizacao() {
    if (!navigator.geolocation) {
      toast({ title: 'GPS não disponível', variant: 'destructive' });
      return;
    }
    setBuscandoLocalizacao(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setForm(p => ({
          ...p,
          latitude: pos.coords.latitude.toFixed(6),
          longitude: pos.coords.longitude.toFixed(6),
        }));
        setBuscandoLocalizacao(false);
        toast({ title: 'Localização obtida!' });
      },
      () => {
        setBuscandoLocalizacao(false);
        toast({ title: 'Erro ao obter localização', variant: 'destructive' });
      }
    );
  }

  function avancarParaMudas() {
    if (!form.codigo || !form.variedade || !form.data_plantio) {
      toast({ title: 'Preencha os campos obrigatórios', variant: 'destructive' });
      return;
    }
    setEtapa(2);
  }

  async function salvar() {
    const numLinhas = parseInt(mudaConfig.num_linhas);
    const plantasPorLinha = parseInt(mudaConfig.plantas_por_linha);

    if (!numLinhas || !plantasPorLinha || numLinhas < 1 || plantasPorLinha < 1) {
      toast({ title: 'Informe o número de linhas e plantas', variant: 'destructive' });
      return;
    }

    setSalvando(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      // 1. Cria o talhão
      const { data: talhao, error: talhaoError } = await supabase
        .from('talhoes')
        .insert({
          codigo: form.codigo.toUpperCase(),
          nome: form.nome || null,
          variedade: form.variedade,
          data_plantio: form.data_plantio,
          area_ha: form.area_ha ? parseFloat(form.area_ha) : null,
          espacamento_linhas_m: parseFloat(form.espacamento_linhas_m) || 3.0,
          espacamento_plantas_m: parseFloat(form.espacamento_plantas_m) || 1.5,
          porta_enxerto: form.porta_enxerto || null,
          latitude: form.latitude ? parseFloat(form.latitude) : null,
          longitude: form.longitude ? parseFloat(form.longitude) : null,
          user_id: user.id,
        })
        .select('id')
        .single();

      if (talhaoError || !talhao) throw talhaoError ?? new Error('Erro ao criar talhão');

      // 2. Gera mudas com grupos e sentinelas
      const mudas = [];
      let contador = 1;
      const totalMudasCalc = numLinhas * plantasPorLinha;
      const grupos = ['A', 'B', 'C', 'D'] as const;

      // Calcula número de sentinelas proporcional ao tamanho da linha
      function calcNumSentinelas(total: number): number {
        if (total <= 50)  return 3;
        if (total <= 100) return 4;
        if (total <= 150) return 5;
        if (total <= 200) return 6;
        return Math.ceil(total / 40);
      }

      // Distribui sentinelas em intervalos iguais ao longo da linha
      function calcPosicoesSentinelas(total: number): Set<number> {
        const n = calcNumSentinelas(total);
        const pos = new Set<number>();
        pos.add(1);
        pos.add(total);
        if (n > 2) {
          const intervalo = (total - 1) / (n - 1);
          for (let i = 1; i < n - 1; i++) {
            pos.add(Math.round(1 + i * intervalo));
          }
        }
        return pos;
      }

      const sentinelasPosicoes = calcPosicoesSentinelas(plantasPorLinha);

      for (let linha = 1; linha <= numLinhas; linha++) {
        for (let planta = 1; planta <= plantasPorLinha; planta++) {
          const codigo = `${mudaConfig.prefixo}${String(contador).padStart(4, '0')}`;
          const idxGlobal = contador - 1;
          const grupoIdx = Math.floor((idxGlobal / totalMudasCalc) * 4);
          const grupo = grupos[Math.min(grupoIdx, 3)];

          mudas.push({
            talhao_id: talhao.id,
            codigo,
            linha,
            planta_na_linha: planta,
            status: 'ativa',
            data_plantio: form.data_plantio,
            grupo_observacao: grupo,
            is_sentinela: sentinelasPosicoes.has(planta),
          });
          contador++;
        }
      }

      const LOTE = 500;
      for (let i = 0; i < mudas.length; i += LOTE) {
        const { error } = await supabase.from('mudas').insert(mudas.slice(i, i + LOTE));
        if (error) throw error;
      }

      await queryClient.invalidateQueries({ queryKey: ['talhoes'] });
      await queryClient.invalidateQueries({ queryKey: ['mudas'] });
      await queryClient.refetchQueries({ queryKey: ['talhoes'] });

      toast({ title: `Talhão criado com ${mudas.length} mudas!` });
      navigate('/', { replace: true });
    } catch (err: any) {
      toast({ title: 'Erro ao salvar', description: err.message, variant: 'destructive' });
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 p-4 flex items-start justify-center py-8">
      <div className="w-full max-w-lg space-y-6">

        {/* Botão voltar — só aparece no modo adicionar */}
        {modoAdicionar && (
          <div className="flex justify-start">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft size={16} />
              Voltar
            </button>
          </div>
        )}

        {/* Header */}
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-primary/10 rounded-full">
              <Grape className="h-8 w-8 text-primary" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-foreground">
            {modoAdicionar ? 'Novo talhão' : 'Configure seu talhão'}
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {etapa === 1 ? 'Informações do vinhedo' : 'Grade de mudas'}
          </p>
        </div>

        {/* Steps indicator */}
        <div className="flex items-center justify-center gap-3">
          {[1, 2].map(s => (
            <div key={s} className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${
                etapa === s
                  ? 'bg-primary text-primary-foreground'
                  : etapa > s
                  ? 'bg-emerald-500 text-white'
                  : 'bg-muted text-muted-foreground'
              }`}>
                {etapa > s ? <CheckCircle2 size={16} /> : s}
              </div>
              {s < 2 && <div className={`w-12 h-0.5 ${etapa > s ? 'bg-emerald-500' : 'bg-muted'}`} />}
            </div>
          ))}
        </div>

        {/* ── ETAPA 1: Talhão ── */}
        {etapa === 1 && (
          <>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Identificação</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Código <span className="text-red-500">*</span></Label>
                    <Input placeholder="ex: T1" value={form.codigo} onChange={e => set('codigo', e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Nome</Label>
                    <Input placeholder="ex: Parcela Norte" value={form.nome} onChange={e => set('nome', e.target.value)} />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label>Variedade <span className="text-red-500">*</span></Label>
                  <select
                    value={form.variedade}
                    onChange={e => set('variedade', e.target.value)}
                    className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                  >
                    <option value="">Selecione...</option>
                    {VARIEDADES.map(v => <option key={v} value={v}>{v}</option>)}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Data de plantio <span className="text-red-500">*</span></Label>
                    <Input type="date" value={form.data_plantio} onChange={e => set('data_plantio', e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Área (ha)</Label>
                    <Input type="number" step="0.01" placeholder="ex: 1.5" value={form.area_ha} onChange={e => set('area_ha', e.target.value)} />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label>Porta-enxerto</Label>
                  <select
                    value={form.porta_enxerto}
                    onChange={e => set('porta_enxerto', e.target.value)}
                    className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                  >
                    <option value="">Selecione...</option>
                    {PORTA_ENXERTOS.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Espaçamento</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Entre linhas (m)</Label>
                    <Input type="number" step="0.1" value={form.espacamento_linhas_m} onChange={e => set('espacamento_linhas_m', e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Entre plantas (m)</Label>
                    <Input type="number" step="0.1" value={form.espacamento_plantas_m} onChange={e => set('espacamento_plantas_m', e.target.value)} />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Localização</CardTitle>
                <CardDescription className="text-xs">Necessária para coleta automática de dados climáticos</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button type="button" variant="outline" className="w-full" onClick={buscarLocalizacao} disabled={buscandoLocalizacao}>
                  {buscandoLocalizacao ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <MapPin className="h-4 w-4 mr-2" />}
                  Usar minha localização atual
                </Button>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Latitude</Label>
                    <Input placeholder="ex: -29.168771" value={form.latitude} onChange={e => set('latitude', e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Longitude</Label>
                    <Input placeholder="ex: -51.179504" value={form.longitude} onChange={e => set('longitude', e.target.value)} />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Button className="w-full h-11" onClick={avancarParaMudas}>
              Próximo — Configurar mudas
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          </>
        )}

        {/* ── ETAPA 2: Mudas ── */}
        {etapa === 2 && (
          <>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Grade de mudas</CardTitle>
                <CardDescription className="text-xs">
                  Os códigos serão gerados automaticamente (M0001, M0002...)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Nº de linhas <span className="text-red-500">*</span></Label>
                    <Input
                      type="number"
                      placeholder="ex: 6"
                      value={mudaConfig.num_linhas}
                      onChange={e => setMuda('num_linhas', e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Plantas por linha <span className="text-red-500">*</span></Label>
                    <Input
                      type="number"
                      placeholder="ex: 192"
                      value={mudaConfig.plantas_por_linha}
                      onChange={e => setMuda('plantas_por_linha', e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label>Prefixo do código</Label>
                  <Input
                    placeholder="ex: M"
                    maxLength={3}
                    value={mudaConfig.prefixo}
                    onChange={e => setMuda('prefixo', e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Exemplo: prefixo "M" gera M0001, M0002...
                  </p>
                </div>

                {totalMudas > 0 && (() => {
                  const linhas = parseInt(mudaConfig.num_linhas) || 0;
                  const porLinha = parseInt(mudaConfig.plantas_por_linha) || 0;
                  // 3 sentinelas por linha (início, meio, fim)
                  const nSent = porLinha <= 50 ? 3 : porLinha <= 100 ? 4 : porLinha <= 150 ? 5 : porLinha <= 200 ? 6 : Math.ceil(porLinha / 40);
                  const totalSentinelas = linhas * nSent;
                  const porGrupo = Math.floor(totalMudas / 4);
                  return (
                    <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3 space-y-1.5">
                      <p className="text-sm font-semibold text-emerald-800">
                        {totalMudas.toLocaleString('pt-BR')} mudas serão criadas
                      </p>
                      <p className="text-xs text-emerald-600">
                        {mudaConfig.prefixo}0001 até {mudaConfig.prefixo}{String(totalMudas).padStart(4, '0')}
                        {' · '}{mudaConfig.num_linhas} linhas × {mudaConfig.plantas_por_linha} plantas
                      </p>
                      <div className="flex gap-2 flex-wrap pt-0.5">
                        {['A','B','C','D'].map(g => (
                          <span key={g} className="text-[11px] bg-white border border-emerald-200 rounded px-1.5 py-0.5 text-emerald-700 font-medium">
                            Grupo {g}: ~{porGrupo}
                          </span>
                        ))}
                        <span className="text-[11px] bg-yellow-50 border border-yellow-200 rounded px-1.5 py-0.5 text-yellow-700 font-medium">
                          ★ Sentinelas: {totalSentinelas}
                        </span>
                      </div>
                    </div>
                  );
                })()}
              </CardContent>
            </Card>

            <div className="grid grid-cols-2 gap-3">
              <Button variant="outline" className="h-11" onClick={() => setEtapa(1)}>
                <ChevronLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
              <Button className="h-11" onClick={salvar} disabled={salvando || totalMudas === 0}>
                {salvando ? (
                  <><Loader2 className="h-4 w-4 animate-spin mr-2" />Criando...</>
                ) : (
                  <>Criar talhão</>
                )}
              </Button>
            </div>
          </>
        )}

        <div className="h-4" />
      </div>
    </div>
  );
}