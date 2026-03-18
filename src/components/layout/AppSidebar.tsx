import { Grape, Map, List, PlusCircle, Home, FileBarChart, Droplets, Droplet, LogOut, BookOpen, Cloud, Bug } from 'lucide-react';
import { NavLink, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useMudasStats, useTalhoes } from '@/hooks/useMudas';
import { Button } from '@/components/ui/button';

const menuItems = [
  { title: 'Início',           url: '/',                      icon: Home },
  { title: 'Mudas',            url: '/mudas',                 icon: List },
  { title: 'Mapa do Vinhedo',  url: '/mapa',                  icon: Map },
  { title: 'Aplicações',       url: '/aplicacoes',            icon: Droplets },
  { title: 'Irrigação',        url: '/irrigacoes',            icon: Droplet },
  { title: 'Clima',            url: '/clima',                 icon: Cloud },
  { title: 'Relatórios',       url: '/relatorios',            icon: FileBarChart },
  { title: 'Nova Observação',  url: '/observacao',            icon: PlusCircle },
  { title: 'Ocorrências',      url: '/ocorrencias-fungicas',  icon: Bug },
];

export function AppSidebar() {
  const location = useLocation();
  const { user, signOut } = useAuth();
  const { data: stats } = useMudasStats();
  const { data: talhoes } = useTalhoes();

  const variedade = talhoes?.[0]?.variedade || 'N/A';

  return (
    <aside className="w-64 bg-sidebar border-r border-sidebar-border min-h-screen flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
            <Grape className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-display text-lg font-bold text-sidebar-foreground">
              VinhoTrack
            </h1>
            <p className="text-xs text-muted-foreground">Gestão de Mudas</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <ul className="space-y-1">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.url;
            return (
              <li key={item.url}>
                <NavLink
                  to={item.url}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200',
                    isActive
                      ? 'bg-sidebar-accent text-sidebar-primary'
                      : 'text-sidebar-foreground hover:bg-sidebar-accent/50'
                  )}
                >
                  <item.icon className="w-5 h-5" />
                  {item.title}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Stats Footer */}
      <div className="p-4 border-t border-sidebar-border">
        <div className="bg-accent/50 rounded-lg p-4 mb-3">
          <p className="text-xs text-muted-foreground mb-1">Variedade</p>
          <p className="text-sm font-semibold text-foreground">{variedade}</p>
          <p className="text-xs text-muted-foreground mt-2">Total de Mudas</p>
          <p className="text-sm font-semibold text-foreground">{stats?.total || 0} unidades</p>
        </div>

        {/* User & Logout */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground truncate max-w-[140px]" title={user?.email || ''}>
            {user?.email}
          </span>
          <Button variant="ghost" size="sm" onClick={signOut} className="h-8 w-8 p-0">
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </aside>
  );
}