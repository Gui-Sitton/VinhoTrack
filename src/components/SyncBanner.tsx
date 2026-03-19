import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import {
  getObservacoesPendentes,
  removerObservacaoPendente,
  ObservacaoPendente,
} from '@/lib/useOfflineStorage';
import { CloudUpload, CheckCircle2, AlertCircle, Loader2, X } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';

type SyncStatus = 'idle' | 'syncing' | 'success' | 'error';

export function SyncBanner() {
  const online = useOnlineStatus();
  const queryClient = useQueryClient();

  const [pendentes, setPendentes] = useState<ObservacaoPendente[]>([]);
  const [status, setStatus] = useState<SyncStatus>('idle');
  const [erros, setErros] = useState(0);
  const [dispensado, setDispensado] = useState(false);

  // Verifica pendentes sempre que voltar online
  useEffect(() => {
    async function verificar() {
      const lista = await getObservacoesPendentes();
      setPendentes(lista);
      setDispensado(false);
      setStatus('idle');
    }
    if (online) verificar();
  }, [online]);

  const sincronizar = useCallback(async () => {
    if (pendentes.length === 0) return;
    setStatus('syncing');
    let erroCount = 0;

    for (const obs of pendentes) {
      try {
        const { id: _localId, muda_codigo: _codigo, criado_em: _criado, ...payload } = obs;
        const { error } = await supabase
          .from('observacoes_mudas' as any)
          .insert(payload as any);

        if (error) {
          console.error('[Sync] Erro ao inserir:', obs.muda_codigo, error.message);
          erroCount++;
        } else {
          await removerObservacaoPendente(obs.id);
        }
      } catch (err) {
        erroCount++;
      }
    }

    setErros(erroCount);

    if (erroCount === 0) {
      setStatus('success');
      setPendentes([]);
      // Invalida queries para atualizar dados
      await queryClient.invalidateQueries({ queryKey: ['ultima-observacao'] });
      await queryClient.invalidateQueries({ queryKey: ['ocorrencias-fungicas'] });
      setTimeout(() => setDispensado(true), 3000);
    } else {
      setStatus('error');
      // Atualiza lista de pendentes
      const restantes = await getObservacoesPendentes();
      setPendentes(restantes);
    }
  }, [pendentes, queryClient]);

  // Não mostra se offline, sem pendentes, ou dispensado
  if (!online || pendentes.length === 0 || dispensado) return null;

  return (
    <div className={`mx-4 md:mx-6 mb-3 rounded-xl border px-4 py-3 flex items-center gap-3 transition-all ${
      status === 'success' ? 'bg-emerald-50 border-emerald-200' :
      status === 'error'   ? 'bg-red-50 border-red-200' :
                             'bg-amber-50 border-amber-200'
    }`}>
      {/* Ícone de status */}
      <div className="flex-shrink-0">
        {status === 'syncing' && <Loader2 size={18} className="animate-spin text-amber-600" />}
        {status === 'success' && <CheckCircle2 size={18} className="text-emerald-600" />}
        {status === 'error'   && <AlertCircle size={18} className="text-red-600" />}
        {status === 'idle'    && <CloudUpload size={18} className="text-amber-600" />}
      </div>

      {/* Mensagem */}
      <div className="flex-1 min-w-0">
        {status === 'idle' && (
          <>
            <p className="text-sm font-semibold text-amber-800">
              {pendentes.length} observação{pendentes.length > 1 ? 'ções' : ''} pendente{pendentes.length > 1 ? 's' : ''}
            </p>
            <p className="text-xs text-amber-700">Registradas offline — toque para sincronizar</p>
          </>
        )}
        {status === 'syncing' && (
          <p className="text-sm font-semibold text-amber-800">Sincronizando...</p>
        )}
        {status === 'success' && (
          <p className="text-sm font-semibold text-emerald-800">
            Sincronização concluída!
          </p>
        )}
        {status === 'error' && (
          <>
            <p className="text-sm font-semibold text-red-800">
              {erros} erro{erros > 1 ? 's' : ''} na sincronização
            </p>
            <p className="text-xs text-red-700">Toque para tentar novamente</p>
          </>
        )}
      </div>

      {/* Ações */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {(status === 'idle' || status === 'error') && (
          <button
            onClick={sincronizar}
            className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${
              status === 'error'
                ? 'bg-red-600 text-white hover:bg-red-700'
                : 'bg-amber-600 text-white hover:bg-amber-700'
            }`}
          >
            Sincronizar
          </button>
        )}
        {status !== 'syncing' && (
          <button
            onClick={() => setDispensado(true)}
            className="p-1 rounded hover:bg-black/10 transition-colors"
          >
            <X size={14} className="text-current opacity-60" />
          </button>
        )}
      </div>
    </div>
  );
}