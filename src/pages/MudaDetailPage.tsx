import { useParams, useNavigate } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { useMudaById, MudaStatus } from '@/hooks/useMudas';
import { StatusBadge } from '@/components/mudas/StatusBadge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, MapPin, Calendar, FileText, Loader2 } from 'lucide-react';
import { ObservacaoMudaItem } from '@/components/observacoes/ObservacaoMudaItem';
const statusDisplayMap: Record<MudaStatus, string> = {
  ativa: 'Ativa',
  atencao: 'Atenção',
  falha: 'Falha',
  substituida: 'Substituída',
};

export default function MudaDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: muda, isLoading, error } = useMudaById(id);

  if (isLoading) {
    return (
      <MainLayout>
        <div className="p-8 flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  if (!muda || error) {
    return (
      <MainLayout>
        <div className="p-8 text-center">
          <h1 className="font-display text-2xl font-bold text-foreground mb-4">
            Muda não encontrada
          </h1>
          <Button onClick={() => navigate('/mudas')}>Voltar para lista</Button>
        </div>
      </MainLayout>
    );
  }

  const talhao = muda.talhao;

  return (
    <MainLayout>
      <div className="p-8">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => navigate('/mudas')}
          className="mb-6 animate-fade-in"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar para lista
        </Button>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8 animate-fade-in" style={{ animationDelay: '100ms' }}>
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="font-display text-3xl font-bold text-foreground">
                {muda.codigo}
              </h1>
              <StatusBadge status={statusDisplayMap[muda.status || 'ativa'] as any} />
            </div>
            <p className="text-muted-foreground">{talhao?.variedade || 'Variedade não definida'}</p>
          </div>
          <Button onClick={() => navigate(`/observacao?muda=${muda.id}`)}>
            Nova Observação
          </Button>
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="animate-fade-in" style={{ animationDelay: '200ms' }}>
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-3">
                <MapPin className="w-5 h-5 text-primary" />
                <h3 className="font-semibold">Localização</h3>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Talhão</span>
                  <span className="font-medium">{talhao?.codigo || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Linha</span>
                  <span className="font-medium">L{String(muda.linha).padStart(2, '0')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Planta</span>
                  <span className="font-medium">P{String(muda.planta_na_linha).padStart(2, '0')}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="animate-fade-in" style={{ animationDelay: '300ms' }}>
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-3">
                <Calendar className="w-5 h-5 text-primary" />
                <h3 className="font-semibold">Data de Plantio & Idade</h3>
              </div>
              <p className="text-2xl font-bold">
                {talhao?.data_plantio ? new Date(talhao.data_plantio + 'T12:00:00').toLocaleDateString('pt-BR', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                }) : 'Não definida'}
              </p>
              {talhao?.data_plantio && (() => {
                const plantingDate = new Date(talhao.data_plantio + 'T12:00:00');
                const today = new Date();
                const diffMs = today.getTime() - plantingDate.getTime();
                const totalDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
                
                if (totalDays < 0) return <p className="text-sm text-muted-foreground mt-2">Plantio futuro</p>;
                
                const years = Math.floor(totalDays / 365);
                const months = Math.floor((totalDays % 365) / 30);
                const days = totalDays % 30;
                
                let ageText = '';
                if (years > 0) ageText += `${years} ano${years > 1 ? 's' : ''}`;
                if (months > 0) ageText += `${ageText ? ', ' : ''}${months} ${months > 1 ? 'meses' : 'mês'}`;
                if (days > 0 && years === 0) ageText += `${ageText ? ' e ' : ''}${days} dia${days > 1 ? 's' : ''}`;
                if (!ageText) ageText = 'Plantada hoje';
                
                return <p className="text-sm text-muted-foreground mt-2">Idade: {ageText}</p>;
              })()}
            </CardContent>
          </Card>

          <Card className="animate-fade-in" style={{ animationDelay: '400ms' }}>
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-3">
                <FileText className="w-5 h-5 text-primary" />
                <h3 className="font-semibold">Observações</h3>
              </div>
              <p className="text-2xl font-bold">{muda.observacoes?.length || 0}</p>
              <p className="text-sm text-muted-foreground">registradas</p>
            </CardContent>
          </Card>
        </div>

        {/* Histórico de Observações */}
        <Card className="animate-fade-in" style={{ animationDelay: '500ms' }}>
          <CardHeader>
            <CardTitle className="font-display">Histórico de Observações</CardTitle>
          </CardHeader>
          <CardContent>
            {!muda.observacoes || muda.observacoes.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                Nenhuma observação registrada para esta muda.
              </p>
            ) : (
              <div className="space-y-6">
                {muda.observacoes.map((obs) => (
                  <ObservacaoMudaItem
                    key={obs.id}
                    observacao={obs}
                    mudaId={muda.id}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
