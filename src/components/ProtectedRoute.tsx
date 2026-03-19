import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useTalhaoContext } from '@/contexts/TalhaoContext';
import { Loader2 } from 'lucide-react';

function Spinner() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading: authLoading } = useAuth();
  const { talhaoAtivo, isLoading: talhoesLoading } = useTalhaoContext();

  if (authLoading) return <Spinner />;
  if (!user) return <Navigate to="/auth" replace />;
  if (talhoesLoading) return <Spinner />;
  if (!talhaoAtivo) return <Navigate to="/setup" replace />;

  return <>{children}</>;
}

export function AuthRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();

  if (isLoading) return <Spinner />;
  if (!user) return <Navigate to="/auth" replace />;

  return <>{children}</>;
}