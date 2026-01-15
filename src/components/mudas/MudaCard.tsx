import { Muda } from '@/data/mockData';
import { StatusBadge } from './StatusBadge';
import { Card, CardContent } from '@/components/ui/card';
import { MapPin, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface MudaCardProps {
  muda: Muda;
}

export function MudaCard({ muda }: MudaCardProps) {
  const navigate = useNavigate();

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
            <p className="text-sm text-muted-foreground">{muda.variedade}</p>
          </div>
          <StatusBadge status={muda.status} />
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="w-4 h-4" />
            <span>
              {muda.talhao} / {muda.linha} / {muda.plantaNaLinha}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="w-4 h-4" />
            <span>
              Plantio: {new Date(muda.dataPlantio).toLocaleDateString('pt-BR')}
            </span>
          </div>
        </div>

        {muda.observacoes.length > 0 && (
          <div className="mt-4 pt-4 border-t border-border">
            <p className="text-xs text-muted-foreground">
              {muda.observacoes.length} observação(ões) registrada(s)
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
