/**
 * useOfflineStorage
 * Gerencia IndexedDB para:
 * 1. Cache de mudas por grupo (snapshot para uso offline)
 * 2. Fila de observações pendentes (salvas offline, sync posterior)
 */

const DB_NAME    = 'vinhotrack_offline';
const DB_VERSION = 1;

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface MudaCache {
  id: string;
  codigo: string;
  linha: number;
  planta_na_linha: number;
  grupo_observacao: string | null;
  is_sentinela: boolean;
  ultima_observacao: string | null;
  dias_sem_medir: number | null;
}

export interface ObservacaoPendente {
  id: string;           // UUID local gerado offline
  muda_id: string;
  muda_codigo: string;  // para exibição no banner
  data: string;
  fase_fenologica: string;
  fase_gdd: string;
  altura_cm: number;
  diametro_caule_mm: number | null;
  numero_nos: number | null;
  atingiu_arame: boolean;
  necessita_tutoramento: boolean;
  observacoes: string | null;
  criado_em: string;    // timestamp local
}

interface GrupoCache {
  talhao_grupo: string;  // `${talhaoId}_${grupo}` — chave composta
  talhaoId: string;
  grupo: string;
  mudas: MudaCache[];
  salvo_em: string;
}

// ─── Inicialização do banco ───────────────────────────────────────────────────

function abrirDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);

    req.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;

      // Store de cache de mudas por grupo
      if (!db.objectStoreNames.contains('grupos_cache')) {
        db.createObjectStore('grupos_cache', { keyPath: 'talhao_grupo' });
      }

      // Store de fila de observações pendentes
      if (!db.objectStoreNames.contains('observacoes_pendentes')) {
        db.createObjectStore('observacoes_pendentes', { keyPath: 'id' });
      }
    };

    req.onsuccess = () => resolve(req.result);
    req.onerror  = () => reject(req.error);
  });
}

// ─── Helpers genéricos ────────────────────────────────────────────────────────

function txGet<T>(db: IDBDatabase, store: string, key: string): Promise<T | null> {
  return new Promise((resolve, reject) => {
    const req = db.transaction(store, 'readonly').objectStore(store).get(key);
    req.onsuccess = () => resolve(req.result ?? null);
    req.onerror   = () => reject(req.error);
  });
}

function txPut(db: IDBDatabase, store: string, value: unknown): Promise<void> {
  return new Promise((resolve, reject) => {
    const req = db.transaction(store, 'readwrite').objectStore(store).put(value);
    req.onsuccess = () => resolve();
    req.onerror   = () => reject(req.error);
  });
}

function txGetAll<T>(db: IDBDatabase, store: string): Promise<T[]> {
  return new Promise((resolve, reject) => {
    const req = db.transaction(store, 'readonly').objectStore(store).getAll();
    req.onsuccess = () => resolve(req.result ?? []);
    req.onerror   = () => reject(req.error);
  });
}

function txDelete(db: IDBDatabase, store: string, key: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const req = db.transaction(store, 'readwrite').objectStore(store).delete(key);
    req.onsuccess = () => resolve();
    req.onerror   = () => reject(req.error);
  });
}

// ─── API pública ──────────────────────────────────────────────────────────────

/**
 * Salva snapshot de mudas de um grupo no cache local.
 * Chamado ao carregar o grupo quando online.
 */
export async function cachearMudasGrupo(
  talhaoId: string,
  grupo: string,
  mudas: MudaCache[]
): Promise<void> {
  try {
    const db = await abrirDB();
    const entry: GrupoCache = {
      talhao_grupo: `${talhaoId}_${grupo}`,
      talhaoId,
      grupo,
      mudas,
      salvo_em: new Date().toISOString(),
    };
    await txPut(db, 'grupos_cache', entry);
  } catch (err) {
    console.warn('[OfflineStorage] Erro ao cachear grupo:', err);
  }
}

/**
 * Recupera mudas de um grupo do cache local.
 * Retorna null se não houver cache.
 */
export async function getMudasCache(
  talhaoId: string,
  grupo: string
): Promise<{ mudas: MudaCache[]; salvo_em: string } | null> {
  try {
    const db    = await abrirDB();
    const entry = await txGet<GrupoCache>(db, 'grupos_cache', `${talhaoId}_${grupo}`);
    if (!entry) return null;
    return { mudas: entry.mudas, salvo_em: entry.salvo_em };
  } catch {
    return null;
  }
}

/**
 * Adiciona uma observação à fila de pendentes.
 * Chamado ao salvar quando offline.
 */
export async function enfileirarObservacao(obs: ObservacaoPendente): Promise<void> {
  try {
    const db = await abrirDB();
    await txPut(db, 'observacoes_pendentes', obs);
  } catch (err) {
    console.warn('[OfflineStorage] Erro ao enfileirar observação:', err);
    throw err;
  }
}

/**
 * Retorna todas as observações pendentes.
 */
export async function getObservacoesPendentes(): Promise<ObservacaoPendente[]> {
  try {
    const db = await abrirDB();
    return await txGetAll<ObservacaoPendente>(db, 'observacoes_pendentes');
  } catch {
    return [];
  }
}

/**
 * Remove uma observação da fila após sync bem-sucedido.
 */
export async function removerObservacaoPendente(id: string): Promise<void> {
  try {
    const db = await abrirDB();
    await txDelete(db, 'observacoes_pendentes', id);
  } catch (err) {
    console.warn('[OfflineStorage] Erro ao remover pendente:', err);
  }
}

/**
 * Conta observações pendentes (para o badge do banner).
 */
export async function contarPendentes(): Promise<number> {
  const pendentes = await getObservacoesPendentes();
  return pendentes.length;
}