import { useTalhaoContext } from '@/contexts/TalhaoContext';
import { ChevronDown, MapPin, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

export function TalhaoSelector() {
  const { talhoes, talhaoAtivo, setTalhaoAtivo, temMultiplosTalhoes } = useTalhaoContext();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Fecha ao clicar fora
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  if (!talhaoAtivo) return null;

  // Com apenas um talhão, mostra label simples + botão adicionar
  if (!temMultiplosTalhoes) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted/50">
          <MapPin size={13} className="text-muted-foreground flex-shrink-0" />
          <span className="text-sm font-medium text-foreground">
            {talhaoAtivo.codigo}{talhaoAtivo.nome ? ` — ${talhaoAtivo.nome}` : ''}
          </span>
          <span className="text-xs text-muted-foreground hidden sm:inline">
            · {talhaoAtivo.variedade}
          </span>
        </div>
        <button
          onClick={() => navigate('/setup?modo=adicionar')}
          title="Adicionar novo talhão"
          className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-primary"
        >
          <Plus size={15} />
        </button>
      </div>
    );
  }

  // Com múltiplos talhões, mostra dropdown
  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
      >
        <MapPin size={13} className="text-muted-foreground flex-shrink-0" />
        <span className="text-sm font-medium text-foreground">
          {talhaoAtivo.codigo}{talhaoAtivo.nome ? ` — ${talhaoAtivo.nome}` : ''}
        </span>
        <span className="text-xs text-muted-foreground hidden sm:inline">
          · {talhaoAtivo.variedade}
        </span>
        <ChevronDown
          size={13}
          className={cn('text-muted-foreground transition-transform ml-0.5', open && 'rotate-180')}
        />
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1 w-64 bg-background border border-border rounded-xl shadow-lg z-50 overflow-hidden">
          <div className="px-3 py-2 border-b border-border">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Selecionar talhão
            </p>
          </div>
          <div className="py-1">
            {talhoes.map(t => (
              <button
                key={t.id}
                onClick={() => { setTalhaoAtivo(t); setOpen(false); }}
                className={cn(
                  'w-full text-left px-3 py-2.5 flex items-start gap-2.5 hover:bg-muted transition-colors',
                  t.id === talhaoAtivo.id && 'bg-primary/5'
                )}
              >
                <div className={cn(
                  'w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0',
                  t.id === talhaoAtivo.id ? 'bg-primary' : 'bg-muted-foreground/30'
                )} />
                <div>
                  <p className={cn(
                    'text-sm font-medium',
                    t.id === talhaoAtivo.id ? 'text-primary' : 'text-foreground'
                  )}>
                    {t.codigo}{t.nome ? ` — ${t.nome}` : ''}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {t.variedade}
                    {t.area_ha && ` · ${t.area_ha} ha`}
                  </p>
                </div>
              </button>
            ))}
          </div>
          <div className="border-t border-border py-1">
            <button
              onClick={() => { navigate('/setup?modo=adicionar'); setOpen(false); }}
              className="w-full text-left px-3 py-2.5 flex items-center gap-2.5 hover:bg-muted transition-colors text-sm text-muted-foreground hover:text-primary"
            >
              <Plus size={14} />
              Adicionar novo talhão
            </button>
          </div>
        </div>
      )}
    </div>
  );
}