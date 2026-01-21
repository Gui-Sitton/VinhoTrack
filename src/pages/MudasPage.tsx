import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { MudaCard } from '@/components/mudas/MudaCard';
import { useMudas, useLinhasUnicas } from '@/hooks/useMudas';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Search, Loader2 } from 'lucide-react';

export default function MudasPage() {
  const [linhaFiltro, setLinhaFiltro] = useState<string>('todas');
  const [busca, setBusca] = useState('');

  const { data: mudas, isLoading: mudasLoading } = useMudas();
  const { data: linhas, isLoading: linhasLoading } = useLinhasUnicas();

  const mudasFiltradas = (mudas || []).filter((muda) => {
    const matchLinha = linhaFiltro === 'todas' || muda.linha === Number(linhaFiltro);
    const matchBusca =
      busca === '' ||
      muda.codigo.toLowerCase().includes(busca.toLowerCase()) ||
      (muda.status && muda.status.toLowerCase().includes(busca.toLowerCase()));
    return matchLinha && matchBusca;
  });

  return (
    <MainLayout>
      <div className="p-8">
        {/* Header */}
        <div className="mb-8 animate-fade-in">
          <h1 className="font-display text-3xl font-bold text-foreground mb-2">
            Mudas
          </h1>
          <p className="text-muted-foreground">
            Lista completa de mudas cadastradas no sistema
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8 animate-fade-in" style={{ animationDelay: '100ms' }}>
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por código ou status..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="pl-10"
            />
          </div>

          <Select value={linhaFiltro} onValueChange={setLinhaFiltro} disabled={linhasLoading}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filtrar por linha" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas as linhas</SelectItem>
              {(linhas || []).map((linha) => (
                <SelectItem key={linha} value={String(linha)}>
                  Linha {linha}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Results count */}
        <p className="text-sm text-muted-foreground mb-4">
          {mudasLoading ? (
            'Carregando...'
          ) : (
            `Exibindo ${mudasFiltradas.length} de ${mudas?.length || 0} mudas`
          )}
        </p>

        {/* Loading State */}
        {mudasLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {/* Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {mudasFiltradas.map((muda, index) => (
                <div key={muda.id} style={{ animationDelay: `${index * 50}ms` }}>
                  <MudaCard muda={muda} />
                </div>
              ))}
            </div>

            {mudasFiltradas.length === 0 && !mudasLoading && (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Nenhuma muda encontrada com os filtros aplicados.</p>
              </div>
            )}
          </>
        )}
      </div>
    </MainLayout>
  );
}
