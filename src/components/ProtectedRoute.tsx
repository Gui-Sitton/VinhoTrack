import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useTalhoes } from '@/hooks/useMudas';
import { Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

function useTalhoesCondicional(enabled: boolean) {
  return useQuery({
    queryKey: ['talhoes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('talhoes')
        .select('id')
        .order('created_at');
      if (error) throw error;
      return data || [];
    },
    enabled, // só roda se autenticado
  });
}

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading: authLoading } = useAuth();
  const { data: talhoes, isLoading: talhoesLoading } = useTalhoesCondicional(!!user && !authLoading);

  // 1. Aguarda autenticação resolver
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // 2. Não autenticado → login
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // 3. Autenticado mas talhões ainda carregando → aguarda
  if (talhoesLoading || talhoes === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // 4. Autenticado e sem talhão → setup
  if (talhoes.length === 0) {
    return <Navigate to="/setup" replace />;
  }

  return <>{children}</>;
}

// Rota que exige auth mas NÃO exige talhão (ex: /setup)
export function AuthRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
}