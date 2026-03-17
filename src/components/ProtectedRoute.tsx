import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useTalhoes } from '@/hooks/useMudas';
import { Loader2 } from 'lucide-react';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading: authLoading } = useAuth();
  const { data: talhoes, isLoading: talhoesLoading } = useTalhoes();

  // Aguarda autenticação
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Não autenticado → login
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Aguarda carregar talhões
  if (talhoesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Autenticado mas sem talhão → cadastro inicial
  if (talhoes && talhoes.length === 0) {
    return <Navigate to="/setup" replace />;
  }

  return <>{children}</>;
}