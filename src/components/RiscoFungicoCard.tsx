import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Bug, TrendingUp, TrendingDown, Minus, ChevronRight } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

type Risco = 'baixo' | 'medio' | 'alto';

interface RiscoDoenca {
  doenca: 'mildio' | 'oidio';
  label: string;
  risco: Risco;
  score: number; // 0-100
  motivo: string;
  ultimaOcorrencia: string | null;
  diasDesdeUltima: number | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const RISCO_CONFIG: Record<Risco, { label: string; color: string; bg: string; border: string; icon: typeof TrendingUp }> = {
  baixo: { label: 'Baixo',  color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200', icon: TrendingDown },
  medio: { label: 'Médio',  color: 'text-amber-700',   bg: 'bg-amber-50',   border: 'border-amber-200',   icon: Minus },
  alto:  { label: 'Alto',   color: 'text-red-700',     bg: 'bg-red-50',     border: 'border-red-200',     icon: TrendingUp },
};

function calcRisco(score: number): Risco {
  if (score >= 60) return 'alto';
  if (score >= 30) return 'medio';
  return 'baixo';
}

// ─── Hook: calcula risco por doença ──────────────────────────────────────────

function useRiscoFungico(talhaoId?: string) {
  return useQuery({
    queryKey: ['risco-fungico', talhaoId],
    queryFn: async () => {
      if (!talhaoId) return null;

      const trintaDias = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
      const seteDias   = new Date(Date.now() - 7  * 86400000).toISOString().slice(0, 10);
      const hoje       = new Date().toISOString().slice(0, 10);

      // Busca ocorrências dos últimos 30 dias
      const { data: ocorrencias } = await supabase
        .from('ocorrencias_fitossanitarias' as any)
        .select('agente, severidade_descricao, data')
        .eq('talhao_id', talhaoId)
        .eq('tipo', 'fungo')
        .gte('data', trintaDias)
        .order('data', { ascending: false });

      // Busca clima dos últimos 7 dias
      const { data: clima } = await supabase
        .from('clima_diario' as any)
        .select('umidade_relativa_max, umidade_relativa_min, temp_max, temp_min, precipitacao_mm')
        .eq('talhao_id', talhaoId)
        .gte('data', seteDias)
        .lte('data', hoje);

      const hoje_ = new Date();

      // Médias climáticas
      const climaArr = (clima as any[]) ?? [];
      const umidadeMedia = climaArr.length > 0
        ? climaArr.reduce((a, r) => a + ((r.umidade_relativa_max + r.umidade_relativa_min) / 2), 0) / climaArr.length
        : 0;
      const tempMedia = climaArr.length > 0
        ? climaArr.reduce((a, r) => a + ((r.temp_max + r.temp_min) / 2), 0) / climaArr.length
        : 0;
      const chuvaTotal = climaArr.reduce((a, r) => a + (r.precipitacao_mm ?? 0), 0);

      const ocArr = (ocorrencias as any[]) ?? [];

      function calcRiscoDoenca(doenca: 'mildio' | 'oidio'): RiscoDoenca {
        const label = doenca === 'mildio' ? 'Míldio' : 'Oídio';
        const ocDoenca = ocArr.filter(o => o.agente === doenca);
        const ultima = ocDoenca[0] ?? null;
        const diasDesdeUltima = ultima
          ? Math.floor((hoje_.getTime() - new Date(ultima.data + 'T12:00:00').getTime()) / 86400000)
          : null;

        let score = 0;
        const motivos: string[] = [];

        // ── Pontuação por ocorrências recentes ──
        ocDoenca.forEach(o => {
          const dias = Math.floor((hoje_.getTime() - new Date(o.data + 'T12:00:00').getTime()) / 86400000);
          const pesoTempo = dias <= 7 ? 1 : dias <= 14 ? 0.7 : 0.4;
          const pesoSev = o.severidade_descricao === 'grave' ? 30 : o.severidade_descricao === 'moderada' ? 20 : 10;
          score += pesoSev * pesoTempo;
        });

        if (ocDoenca.length > 0) {
          motivos.push(`${ocDoenca.length} ocorrência${ocDoenca.length > 1 ? 's' : ''} recente${ocDoenca.length > 1 ? 's' : ''}`);
        }

        // ── Pontuação por clima (condições favoráveis) ──
        if (doenca === 'mildio') {
          // Míldio: alta umidade + temperatura 15-25°C + chuva
          if (umidadeMedia > 80) { score += 20; motivos.push('umidade alta'); }
          else if (umidadeMedia > 70) { score += 10; }
          if (tempMedia >= 15 && tempMedia <= 25) { score += 15; motivos.push('temperatura favorável'); }
          if (chuvaTotal > 10) { score += 15; motivos.push('chuvas recentes'); }
        } else {
          // Oídio: umidade moderada + temperatura 20-28°C + sem chuva
          if (umidadeMedia >= 50 && umidadeMedia <= 80) { score += 20; motivos.push('umidade moderada'); }
          if (tempMedia >= 20 && tempMedia <= 28) { score += 15; motivos.push('temperatura favorável'); }
          if (chuvaTotal < 5 && tempMedia > 18) { score += 10; motivos.push('tempo seco e quente'); }
        }

        score = Math.min(score, 100);
        const risco = calcRisco(score);

        const motivo = motivos.length > 0
          ? motivos.slice(0, 2).join(' · ')
          : risco === 'baixo' ? 'condições desfavoráveis' : 'monitorar condições';

        return { doenca, label, risco, score, motivo, ultimaOcorrencia: ultima?.data ?? null, diasDesdeUltima };
      }

      return {
        mildio: calcRiscoDoenca('mildio'),
        oidio:  calcRiscoDoenca('oidio'),
      };
    },
    enabled: !!talhaoId,
    staleTime: 1000 * 60 * 30,
  });
}

// ─── Component ────────────────────────────────────────────────────────────────

interface RiscoFungicoCardProps {
  talhaoId?: string;
}

export function RiscoFungicoCard({ talhaoId }: RiscoFungicoCardProps) {
  const navigate = useNavigate();
  const { data: risco, isLoading } = useRiscoFungico(talhaoId);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="flex items-center gap-2 mb-3">
            <Bug className="w-4 h-4 text-muted-foreground" />
            <p className="text-sm font-semibold">Risco Fúngico</p>
          </div>
          <div className="space-y-2">
            <div className="h-14 bg-muted animate-pulse rounded-lg" />
            <div className="h-14 bg-muted animate-pulse rounded-lg" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!risco) return null;

  const riscos = [risco.mildio, risco.oidio];
  const riscoMaisAlto = riscos.reduce((a, b) => b.score > a.score ? b : a);
  const temAlto = riscos.some(r => r.risco === 'alto');

  return (
    <button
      className="w-full text-left"
      onClick={() => navigate('/ocorrencias-fungicas')}
    >
      <Card className={temAlto ? 'border-red-300' : ''}>
        <CardContent className="pt-4 pb-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Bug className={`w-4 h-4 ${temAlto ? 'text-red-600' : 'text-muted-foreground'}`} />
              <p className="text-sm font-semibold">Risco Fúngico</p>
            </div>
            <div className="flex items-center gap-1.5">
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${RISCO_CONFIG[riscoMaisAlto.risco].bg} ${RISCO_CONFIG[riscoMaisAlto.risco].color}`}>
                {RISCO_CONFIG[riscoMaisAlto.risco].label}
              </span>
              <ChevronRight size={14} className="text-muted-foreground" />
            </div>
          </div>

          {/* Cards por doença */}
          <div className="grid grid-cols-2 gap-2">
            {riscos.map(r => {
              const cfg = RISCO_CONFIG[r.risco];
              const Icon = cfg.icon;
              return (
                <div
                  key={r.doenca}
                  className={`rounded-lg border p-2.5 ${cfg.border} ${cfg.bg}`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className={`text-xs font-semibold ${cfg.color}`}>{r.label}</span>
                    <Icon size={13} className={cfg.color} />
                  </div>

                  {/* Barra de score */}
                  <div className="h-1.5 rounded-full bg-black/10 overflow-hidden mb-1.5">
                    <div
                      className={`h-full rounded-full transition-all ${
                        r.risco === 'alto' ? 'bg-red-500' : r.risco === 'medio' ? 'bg-amber-500' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${r.score}%` }}
                    />
                  </div>

                  <p className="text-[10px] text-gray-600 leading-tight">{r.motivo}</p>

                  {r.diasDesdeUltima !== null && (
                    <p className="text-[10px] text-gray-500 mt-1">
                      Última: há {r.diasDesdeUltima}d
                    </p>
                  )}
                </div>
              );
            })}
          </div>

          {/* Nota climática */}
          <p className="text-[10px] text-muted-foreground mt-2.5">
            Baseado em ocorrências registradas e clima dos últimos 7 dias
          </p>
        </CardContent>
      </Card>
    </button>
  );
}