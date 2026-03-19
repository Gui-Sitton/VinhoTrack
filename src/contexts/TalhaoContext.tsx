import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Talhao {
  id: string;
  codigo: string;
  nome: string | null;
  variedade: string;
  data_plantio: string;
  area_ha: number | null;
  espacamento_linhas_m: number;
  espacamento_plantas_m: number;
  orientacao_linhas: string | null;
  porta_enxerto: string | null;
  user_id: string | null;
  latitude: number | null;
  longitude: number | null;
}

interface TalhaoContextType {
  talhoes: Talhao[];
  talhaoAtivo: Talhao | null;
  setTalhaoAtivo: (talhao: Talhao) => void;
  isLoading: boolean;
  temMultiplosTalhoes: boolean;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const TalhaoContext = createContext<TalhaoContextType | undefined>(undefined);

const STORAGE_KEY = 'vinhotrack_talhao_ativo';

// ─── Provider ─────────────────────────────────────────────────────────────────

export function TalhaoProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [talhaoAtivoId, setTalhaoAtivoId] = useState<string | null>(() => {
    return localStorage.getItem(STORAGE_KEY);
  });

  const { data: talhoes = [], isLoading } = useQuery({
    queryKey: ['talhoes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('talhoes')
        .select('id, codigo, nome, variedade, data_plantio, area_ha, espacamento_linhas_m, espacamento_plantas_m, orientacao_linhas, porta_enxerto, user_id, latitude, longitude')
        .order('codigo');
      if (error) throw error;
      return (data || []) as Talhao[];
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 5,
  });

  // Quando os talhões carregarem, resolve o talhão ativo
  useEffect(() => {
    if (talhoes.length === 0) return;

    // Tenta restaurar o talhão salvo
    if (talhaoAtivoId) {
      const salvo = talhoes.find(t => t.id === talhaoAtivoId);
      if (salvo) return; // já está correto
    }

    // Fallback: usa o primeiro talhão
    const primeiro = talhoes[0];
    setTalhaoAtivoId(primeiro.id);
    localStorage.setItem(STORAGE_KEY, primeiro.id);
  }, [talhoes]);

  const talhaoAtivo = talhoes.find(t => t.id === talhaoAtivoId) ?? talhoes[0] ?? null;

  function setTalhaoAtivo(talhao: Talhao) {
    setTalhaoAtivoId(talhao.id);
    localStorage.setItem(STORAGE_KEY, talhao.id);
  }

  return (
    <TalhaoContext.Provider value={{
      talhoes,
      talhaoAtivo,
      setTalhaoAtivo,
      isLoading,
      temMultiplosTalhoes: talhoes.length > 1,
    }}>
      {children}
    </TalhaoContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useTalhaoContext() {
  const ctx = useContext(TalhaoContext);
  if (!ctx) throw new Error('useTalhaoContext deve ser usado dentro de TalhaoProvider');
  return ctx;
}