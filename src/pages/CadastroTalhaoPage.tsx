import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Grape, Loader2, MapPin } from 'lucide-react';
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
  const { toast } = useToast();
  const queryClient = useQueryClient();

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

  function set(field: string, value: string) {
    setForm(p => ({ ...p, [field]: value }));
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

  async function salvar() {
    if (!form.codigo || !form.variedade || !form.data_plantio) {
      toast({ title: 'Preencha os campos obrigatórios', variant: 'destructive' });
      return;
    }

    setSalvando(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { error } = await supabase.from('talhoes').insert({
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
      });

      if (error) throw error;

      await queryClient.invalidateQueries({ queryKey: ['talhoes'] });
      toast({ title: 'Talhão cadastrado!', description: 'Bem-vindo ao VinhoTrack.' });
      navigate('/');
    } catch (err: any) {
      toast({ title: 'Erro ao salvar', description: err.message, variant: 'destructive' });
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 p-4 flex items-start justify-center py-8">
      <div className="w-full max-w-lg space-y-6">

        {/* Header */}
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-primary/10 rounded-full">
              <Grape className="h-8 w-8 text-primary" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-foreground">Configure seu talhão</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Cadastre as informações do seu vinhedo para começar
          </p>
        </div>

        {/* Identificação */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Identificação</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="codigo">
                  Código <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="codigo"
                  placeholder="ex: T1"
                  value={form.codigo}
                  onChange={e => set('codigo', e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="nome">Nome</Label>
                <Input
                  id="nome"
                  placeholder="ex: Parcela Norte"
                  value={form.nome}
                  onChange={e => set('nome', e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="variedade">
                Variedade <span className="text-red-500">*</span>
              </Label>
              <select
                id="variedade"
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
                <Label htmlFor="data_plantio">
                  Data de plantio <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="data_plantio"
                  type="date"
                  value={form.data_plantio}
                  onChange={e => set('data_plantio', e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="area_ha">Área (ha)</Label>
                <Input
                  id="area_ha"
                  type="number"
                  step="0.01"
                  placeholder="ex: 1.5"
                  value={form.area_ha}
                  onChange={e => set('area_ha', e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="porta_enxerto">Porta-enxerto</Label>
              <select
                id="porta_enxerto"
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

        {/* Espaçamento */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Espaçamento</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="espacamento_linhas">Entre linhas (m)</Label>
                <Input
                  id="espacamento_linhas"
                  type="number"
                  step="0.1"
                  value={form.espacamento_linhas_m}
                  onChange={e => set('espacamento_linhas_m', e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="espacamento_plantas">Entre plantas (m)</Label>
                <Input
                  id="espacamento_plantas"
                  type="number"
                  step="0.1"
                  value={form.espacamento_plantas_m}
                  onChange={e => set('espacamento_plantas_m', e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Localização */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Localização</CardTitle>
            <CardDescription className="text-xs">
              Necessária para coleta automática de dados climáticos
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={buscarLocalizacao}
              disabled={buscandoLocalizacao}
            >
              {buscandoLocalizacao
                ? <Loader2 className="h-4 w-4 animate-spin mr-2" />
                : <MapPin className="h-4 w-4 mr-2" />}
              Usar minha localização atual
            </Button>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="latitude">Latitude</Label>
                <Input
                  id="latitude"
                  placeholder="ex: -29.123456"
                  value={form.latitude}
                  onChange={e => set('latitude', e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="longitude">Longitude</Label>
                <Input
                  id="longitude"
                  placeholder="ex: -51.123456"
                  value={form.longitude}
                  onChange={e => set('longitude', e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Button className="w-full h-11" onClick={salvar} disabled={salvando}>
          {salvando && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
          Criar talhão e entrar
        </Button>

        <div className="h-4" />
      </div>
    </div>
  );
}