import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { mudas } from '@/data/mockData';
import { Grape, Map, List, TrendingUp, AlertTriangle, XCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function HomePage() {
  const navigate = useNavigate();

  const stats = {
    total: mudas.length,
    ativas: mudas.filter((m) => m.status === 'Ativa').length,
    atencao: mudas.filter((m) => m.status === 'Atenção').length,
    falha: mudas.filter((m) => m.status === 'Falha').length,
  };

  const statsCards = [
    {
      title: 'Total de Mudas',
      value: stats.total,
      icon: Grape,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      title: 'Mudas Ativas',
      value: stats.ativas,
      icon: TrendingUp,
      color: 'text-status-active',
      bgColor: 'bg-status-active/10',
    },
    {
      title: 'Em Atenção',
      value: stats.atencao,
      icon: AlertTriangle,
      color: 'text-status-attention',
      bgColor: 'bg-status-attention/10',
    },
    {
      title: 'Falhas',
      value: stats.falha,
      icon: XCircle,
      color: 'text-status-failure',
      bgColor: 'bg-status-failure/10',
    },
  ];

  return (
    <MainLayout>
      <div className="p-8">
        {/* Header */}
        <div className="mb-8 animate-fade-in">
          <h1 className="font-display text-3xl font-bold text-foreground mb-2">
            Bem-vindo ao VinhoTrack
          </h1>
          <p className="text-muted-foreground text-lg">
            Sistema de acompanhamento agronômico para mudas de uva Marselan
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statsCards.map((stat, index) => (
            <Card 
              key={stat.title} 
              className="animate-fade-in"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl ${stat.bgColor} flex items-center justify-center`}>
                    <stat.icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.title}</p>
                    <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="animate-fade-in" style={{ animationDelay: '400ms' }}>
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <List className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-display text-lg font-semibold mb-2">Lista de Mudas</h3>
                  <p className="text-muted-foreground text-sm mb-4">
                    Visualize todas as mudas cadastradas, filtre por linha e acesse os detalhes de cada planta.
                  </p>
                  <Button onClick={() => navigate('/mudas')}>
                    Ver Mudas
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="animate-fade-in" style={{ animationDelay: '500ms' }}>
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Map className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-display text-lg font-semibold mb-2">Mapa do Vinhedo</h3>
                  <p className="text-muted-foreground text-sm mb-4">
                    Visualização espacial do vinhedo com status de cada muda em tempo real.
                  </p>
                  <Button onClick={() => navigate('/mapa')}>
                    Ver Mapa
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Info Section */}
        <Card className="mt-8 animate-fade-in" style={{ animationDelay: '600ms' }}>
          <CardContent className="p-6">
            <h3 className="font-display text-lg font-semibold mb-4">Sobre o Projeto</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Variedade</p>
                <p className="font-semibold">Marselan</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Talhão</p>
                <p className="font-semibold">T01</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Configuração</p>
                <p className="font-semibold">5 linhas × 10 plantas</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
