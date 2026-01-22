import { Grape, Map, List, PlusCircle, Home, FileBarChart, Droplets } from 'lucide-react';
import { NavLink, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';

const menuItems = [
  { title: 'Início', url: '/', icon: Home },
  { title: 'Mudas', url: '/mudas', icon: List },
  { title: 'Mapa do Vinhedo', url: '/mapa', icon: Map },
  { title: 'Aplicações', url: '/aplicacoes', icon: Droplets },
  { title: 'Relatórios', url: '/relatorios', icon: FileBarChart },
  { title: 'Nova Observação', url: '/observacao', icon: PlusCircle },
];

export function AppSidebar() {
  const location = useLocation();

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

      {/* Footer */}
      <div className="p-4 border-t border-sidebar-border">
        <div className="bg-accent/50 rounded-lg p-4">
          <p className="text-xs text-muted-foreground mb-1">Variedade</p>
          <p className="text-sm font-semibold text-foreground">Marselan</p>
          <p className="text-xs text-muted-foreground mt-2">Total de Mudas</p>
          <p className="text-sm font-semibold text-foreground">50 unidades</p>
        </div>
      </div>
    </aside>
  );
}
