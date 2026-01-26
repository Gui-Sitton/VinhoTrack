import { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { useMudas, useMudaById, fasesFenologicas } from '@/hooks/useMudas';
import { useCreateObservacao } from '@/hooks/useObservacoes';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, CheckCircle, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { observacaoSchema } from '@/lib/validations';

export default function NovaObservacaoPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const mudaIdParam = searchParams.get('muda');

  const [formData, setFormData] = useState({
    mudaId: mudaIdParam || '',
    data: new Date().toISOString().split('T')[0],
    faseFenologica: '',
    alturaPlanta: '',
    observacoes: '',
  });

  const [submitted, setSubmitted] = useState(false);

  const { data: mudas, isLoading: mudasLoading } = useMudas();
  const { data: selectedMuda } = useMudaById(formData.mudaId || undefined);
  const createObservacao = useCreateObservacao();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Parse and validate input with Zod schema
    const alturaNum = formData.alturaPlanta ? Number(formData.alturaPlanta) : null;
    const inputData = {
      muda_id: formData.mudaId,
      data: formData.data,
      fase_fenologica: formData.faseFenologica,
      altura_cm: alturaNum !== null && isNaN(alturaNum) ? 0 : alturaNum,
      observacoes: formData.observacoes || null,
    };

    const validationResult = observacaoSchema.safeParse(inputData);

    if (!validationResult.success) {
      const firstError = validationResult.error.errors[0];
      toast({
        title: 'Erro de validação',
        description: firstError.message,
        variant: 'destructive',
      });
      return;
    }

    try {
      // Use the validated data which has correct types
      await createObservacao.mutateAsync({
        muda_id: validationResult.data.muda_id,
        data: validationResult.data.data,
        fase_fenologica: validationResult.data.fase_fenologica,
        altura_cm: validationResult.data.altura_cm,
        observacoes: validationResult.data.observacoes,
      });

      setSubmitted(true);
      toast({
        title: 'Observação registrada!',
        description: 'A observação foi salva com sucesso.',
      });
    } catch (error) {
      toast({
        title: 'Erro ao salvar',
        description: 'Não foi possível salvar a observação. Tente novamente.',
        variant: 'destructive',
      });
    }
  };

  if (submitted) {
    return (
      <MainLayout>
        <div className="p-8 flex items-center justify-center min-h-[60vh]">
          <Card className="max-w-md w-full text-center animate-fade-in">
            <CardContent className="p-8">
              <div className="w-16 h-16 rounded-full bg-status-active/20 flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-8 h-8 text-status-active" />
              </div>
              <h2 className="font-display text-2xl font-bold text-foreground mb-2">
                Observação Registrada
              </h2>
              <p className="text-muted-foreground mb-6">
                A observação foi salva com sucesso para a muda {selectedMuda?.codigo}.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button variant="outline" onClick={() => setSubmitted(false)}>
                  Nova Observação
                </Button>
                <Button onClick={() => navigate(`/mudas/${formData.mudaId}`)}>
                  Ver Muda
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="p-8">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-6 animate-fade-in"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>

        {/* Header */}
        <div className="mb-8 animate-fade-in" style={{ animationDelay: '100ms' }}>
          <h1 className="font-display text-3xl font-bold text-foreground mb-2">
            Nova Observação
          </h1>
          <p className="text-muted-foreground">
            Registre uma nova observação agronômica para uma muda
          </p>
        </div>

        {/* Form */}
        <Card className="max-w-2xl animate-fade-in" style={{ animationDelay: '200ms' }}>
          <CardHeader>
            <CardTitle>Dados da Observação</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Seleção da Muda */}
              <div className="space-y-2">
                <Label htmlFor="muda">Muda *</Label>
                <Select
                  value={formData.mudaId}
                  onValueChange={(value) =>
                    setFormData({ ...formData, mudaId: value })
                  }
                  disabled={mudasLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={mudasLoading ? "Carregando..." : "Selecione uma muda"} />
                  </SelectTrigger>
                  <SelectContent>
                    {(mudas || []).map((muda) => (
                      <SelectItem key={muda.id} value={muda.id}>
                        {muda.codigo} - L{String(muda.linha).padStart(2, '0')}/P{String(muda.planta_na_linha).padStart(2, '0')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Data */}
              <div className="space-y-2">
                <Label htmlFor="data">Data *</Label>
                <Input
                  id="data"
                  type="date"
                  value={formData.data}
                  onChange={(e) =>
                    setFormData({ ...formData, data: e.target.value })
                  }
                />
              </div>

              {/* Fase Fenológica */}
              <div className="space-y-2">
                <Label htmlFor="fase">Fase Fenológica *</Label>
                <Select
                  value={formData.faseFenologica}
                  onValueChange={(value) =>
                    setFormData({ ...formData, faseFenologica: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a fase" />
                  </SelectTrigger>
                  <SelectContent>
                    {fasesFenologicas.map((fase) => (
                      <SelectItem key={fase} value={fase}>
                        {fase}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Altura da Planta */}
              <div className="space-y-2">
                <Label htmlFor="altura">Altura da Planta (cm)</Label>
                <Input
                  id="altura"
                  type="number"
                  placeholder="Ex: 45"
                  value={formData.alturaPlanta}
                  onChange={(e) =>
                    setFormData({ ...formData, alturaPlanta: e.target.value })
                  }
                />
              </div>

              {/* Observações */}
              <div className="space-y-2">
                <Label htmlFor="obs">Observações Técnicas</Label>
                <Textarea
                  id="obs"
                  placeholder="Descreva observações relevantes sobre a muda..."
                  rows={4}
                  value={formData.observacoes}
                  onChange={(e) =>
                    setFormData({ ...formData, observacoes: e.target.value })
                  }
                />
              </div>

              {/* Submit */}
              <div className="flex gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => navigate(-1)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={createObservacao.isPending}>
                  {createObservacao.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    'Registrar Observação'
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
