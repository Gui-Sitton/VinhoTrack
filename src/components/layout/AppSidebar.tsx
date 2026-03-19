import { useState } from 'react';
import { Grape, Map, List, PlusCircle, Home, FileBarChart, Droplets, Droplet, LogOut, Cloud, Bug, Menu, X } from 'lucide-react';
import { NavLink, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useMudasStats, useTalhoes } from '@/hooks/useMudas';
import { useTalhaoContext } from '@/contexts/TalhaoContext';
import { Button } from '@/components/ui/button';

const menuItems = [
  { title: 'Início',           url: '/',                        icon: Home },
  { title: 'Mudas',            url: '/mudas',                   icon: List },
  { title: 'Mapa do Vinhedo',  url: '/mapa',                    icon: Map },
  { title: 'Aplicações',       url: '/aplicacoes',              icon: Droplets },
  { title: 'Irrigação',        url: '/irrigacoes',              icon: Droplet },
  { title: 'Clima',            url: '/clima',                   icon: Cloud },
  { title: 'Relatórios',       url: '/relatorios',              icon: FileBarChart },
  { title: 'Nova Observação',  url: '/observacao',              icon: PlusCircle },
  { title: 'Ocorrências',      url: '/ocorrencias-fungicas',    icon: Bug },
];

export function AppSidebar() {
  const location = useLocation();
  const { user, signOut } = useAuth();
  const { data: stats } = useMudasStats();
  const { data: talhoes } = useTalhoes();
  const [open, setOpen] = useState(false);

  const variedade = talhoes?.[0]?.variedade || 'N/A';

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-6 border-b border-sidebar-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
              <Grape className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-display text-lg font-bold text-sidebar-foreground">VinhoTrack</h1>
              <p className="text-xs text-muted-foreground">Gestão de Mudas</p>
            </div>
          </div>
          {/* Botão fechar no mobile */}
          <button
            className="md:hidden p-1.5 rounded-lg hover:bg-muted transition-colors"
            onClick={() => setOpen(false)}
          >
            <X size={18} className="text-muted-foreground" />
          </button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 overflow-y-auto">
        <ul className="space-y-1">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.url;
            return (
              <li key={item.url}>
                <NavLink
                  to={item.url}
                  onClick={() => setOpen(false)}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200',
                    isActive
                      ? 'bg-sidebar-accent text-sidebar-primary'
                      : 'text-sidebar-foreground hover:bg-sidebar-accent/50'
                  )}
                >
                  <item.icon className="w-5 h-5 flex-shrink-0" />
                  {item.title}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-sidebar-border">
        <div className="bg-accent/50 rounded-lg p-4 mb-3">
          <p className="text-xs text-muted-foreground mb-1">Variedade</p>
          <p className="text-sm font-semibold text-foreground">{variedade}</p>
          <p className="text-xs text-muted-foreground mt-2">Total de Mudas</p>
          <p className="text-sm font-semibold text-foreground">{stats?.total || 0} unidades</p>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground truncate max-w-[140px]" title={user?.email || ''}>
            {user?.email}
          </span>
          <Button variant="ghost" size="sm" onClick={signOut} className="h-8 w-8 p-0">
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* ── DESKTOP: sidebar fixa ── */}
      <aside className="hidden md:flex w-64 bg-sidebar border-r border-sidebar-border min-h-screen flex-col">
        <SidebarContent />
      </aside>

      {/* ── MOBILE: botão hamburguer + drawer ── */}
      <div className="md:hidden">
        {/* Topbar mobile */}
        <div className="fixed top-0 left-0 right-0 z-40 h-14 bg-sidebar border-b border-sidebar-border flex items-center px-4 gap-3">
          <button
            onClick={() => setOpen(true)}
            className="p-2 rounded-lg hover:bg-muted transition-colors"
          >
            <Menu size={20} className="text-sidebar-foreground" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
              <Grape className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-display font-bold text-sidebar-foreground">VinhoTrack</span>
          </div>
        </div>

        {/* Espaço para não sobrepor o conteúdo */}
        <div className="h-14" />

        {/* Overlay escuro */}
        {open && (
          <div
            className="fixed inset-0 z-50 bg-black/50"
            onClick={() => setOpen(false)}
          />
        )}

        {/* Drawer */}
        <div
          className={cn(
            'fixed top-0 left-0 z-50 h-full w-72 bg-sidebar shadow-xl transition-transform duration-300',
            open ? 'translate-x-0' : '-translate-x-full'
          )}
        >
          <SidebarContent />
        </div>
      </div>
    </>
  );
}