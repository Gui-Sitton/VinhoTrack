import { ReactNode } from 'react';
import { AppSidebar } from './AppSidebar';
import { TalhaoSelector } from '@/components/TalhaoSelector';
import { useTalhaoContext } from '@/contexts/TalhaoContext';

interface MainLayoutProps {
  children: ReactNode;
}

function TopBar() {
  const { talhaoAtivo } = useTalhaoContext();
  if (!talhaoAtivo) return null;

  return (
    <div className="sticky top-0 z-30 h-11 bg-background/95 backdrop-blur border-b border-border flex items-center px-4 md:px-6">
      <TalhaoSelector />
    </div>
  );
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="flex min-h-screen w-full bg-background">
      <AppSidebar />
      <main className="flex-1 overflow-auto flex flex-col">
        {/* Espaço no mobile para a topbar da sidebar */}
        <div className="md:hidden h-14" />
        <TopBar />
        <div className="flex-1">
          {children}
        </div>
      </main>
    </div>
  );
}