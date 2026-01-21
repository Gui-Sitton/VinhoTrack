import { Muda, Talhao, MudaStatus } from '@/hooks/useMudas';
import { StatusBadge } from './StatusBadge';
import { Card, CardContent } from '@/components/ui/card';
import { MapPin, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface MudaCardProps {
  muda: Muda & { talhao?: Talhao | null };
}

const statusDisplayMap: Record<MudaStatus, string> = {
  ativa: 'Ativa',
  atencao: 'Atenção',
  falha: 'Falha',
  substituida: 'Substituída',
};

export function MudaCard({ muda }: MudaCardProps) {
  const navigate = useNavigate();

  const statusDisplay = statusDisplayMap[muda.status || 'ativa'] as 'Ativa' | 'Atenção' | 'Falha';

  return (
    <Card 
      className="group cursor-pointer transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-1 animate-fade-in"
      onClick={() => navigate(`/mudas/${muda.id}`)}
    >
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="font-display text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
              {muda.codigo}
            </h3>
            <p className="text-sm text-muted-foreground">{muda.talhao?.variedade || 'Variedade'}</p>
          </div>
          <StatusBadge status={statusDisplay} />
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="w-4 h-4" />
            <span>
              {muda.talhao?.codigo || '-'} / L{String(muda.linha).padStart(2, '0')} / P{String(muda.planta_na_linha).padStart(2, '0')}
            </span>
          </div>
          {muda.talhao?.data_plantio && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="w-4 h-4" />
              <span>
                Plantio: {new Date(muda.talhao.data_plantio).toLocaleDateString('pt-BR')}
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
