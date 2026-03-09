import { useState } from 'react';
import { Leaf, Ruler, Pencil, Trash2, Check, X, Loader2, CircleDot, Hash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useUpdateObservacaoMuda, useDeleteObservacaoMuda } from '@/hooks/useObservacoes';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface Observacao {
  id: string;
  data: string;
  fase_fenologica: string;
  altura_cm: number | null;
  observacoes: string | null;
  muda_id?: string | null;
  diametro_caule_mm?: number | null;
  numero_nos?: number | null;
  atingiu_arame?: boolean | null;
  necessita_tutoramento?: boolean | null;
}

interface ObservacaoMudaItemProps {
  observacao: Observacao;
  mudaId: string;
}

const FASES_FENOLOGICAS = [
  'Dormência',
  'Brotação',
  'Floração',
  'Frutificação',
  'Maturação',
  'Colheita',
  'Pós-colheita',
];

export function ObservacaoMudaItem({ observacao, mudaId }: ObservacaoMudaItemProps) {
  const { toast } = useToast();
  const updateMutation = useUpdateObservacaoMuda();
  const deleteMutation = useDeleteObservacaoMuda();

  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    data: observacao.data,
    fase_fenologica: observacao.fase_fenologica,
    altura_cm: observacao.altura_cm?.toString() || '',
    observacoes: observacao.observacoes || '',
    diametro_caule_mm: observacao.diametro_caule_mm?.toString() || '',
    numero_nos: observacao.numero_nos?.toString() || '',
    atingiu_arame: observacao.atingiu_arame ?? false,
    necessita_tutoramento: observacao.necessita_tutoramento ?? false,
  });

  const handleSave = async () => {
    try {
      await updateMutation.mutateAsync({
        id: observacao.id,
        updates: {
          data: editData.data,
          fase_fenologica: editData.fase_fenologica,
          altura_cm: editData.altura_cm ? parseFloat(editData.altura_cm) : null,
          observacoes: editData.observacoes || null,
          diametro_caule_mm: editData.diametro_caule_mm ? parseFloat(editData.diametro_caule_mm) : null,
          numero_nos: editData.numero_nos ? parseInt(editData.numero_nos) : null,
          atingiu_arame: editData.atingiu_arame,
          necessita_tutoramento: editData.necessita_tutoramento,
        },
      });

      toast({ title: 'Sucesso', description: 'Observação atualizada com sucesso.' });
      setIsEditing(false);
    } catch (error: any) {
      toast({
        title: 'Erro ao atualizar',
        description: error.message || 'Não foi possível atualizar a observação.',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync({ id: observacao.id, mudaId });
      toast({ title: 'Sucesso', description: 'Observação excluída com sucesso.' });
    } catch (error: any) {
      toast({
        title: 'Erro ao excluir',
        description: error.message || 'Não foi possível excluir a observação.',
        variant: 'destructive',
      });
    }
  };

  const handleCancel = () => {
    setEditData({
      data: observacao.data,
      fase_fenologica: observacao.fase_fenologica,
      altura_cm: observacao.altura_cm?.toString() || '',
      observacoes: observacao.observacoes || '',
      diametro_caule_mm: observacao.diametro_caule_mm?.toString() || '',
      numero_nos: observacao.numero_nos?.toString() || '',
      atingiu_arame: observacao.atingiu_arame ?? false,
      necessita_tutoramento: observacao.necessita_tutoramento ?? false,
    });
    setIsEditing(false);
  };

  const isLoading = updateMutation.isPending || deleteMutation.isPending;

  if (isEditing) {
    return (
      <div className="relative pl-6 pb-6 border-l-2 border-border last:pb-0">
        <div className="absolute left-[-9px] top-0 w-4 h-4 rounded-full bg-primary border-4 border-background" />

        <div className="bg-muted/50 rounded-lg p-4 space-y-4">
          {/* Data + Fase */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Data</label>
              <Input
                type="date"
                value={editData.data}
                onChange={(e) => setEditData({ ...editData, data: e.target.value })}
                disabled={isLoading}
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Fase Fenológica</label>
              <Select
                value={editData.fase_fenologica}
                onValueChange={(value) => setEditData({ ...editData, fase_fenologica: value })}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FASES_FENOLOGICAS.map((fase) => (
                    <SelectItem key={fase} value={fase}>{fase}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Altura + Diâmetro */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Altura (cm)</label>
              <Input
                type="number"
                placeholder="ex: 45"
                value={editData.altura_cm}
                onChange={(e) => setEditData({ ...editData, altura_cm: e.target.value })}
                disabled={isLoading}
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">
                Diâmetro do Caule (mm)
                <span className="ml-1 text-muted-foreground/60">— paquímetro a 10cm do solo</span>
              </label>
              <Input
                type="number"
                step="0.1"
                placeholder="ex: 8.5"
                value={editData.diametro_caule_mm}
                onChange={(e) => setEditData({ ...editData, diametro_caule_mm: e.target.value })}
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Número de nós */}
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Número de Nós</label>
            <Input
              type="number"
              placeholder="ex: 12"
              value={editData.numero_nos}
              onChange={(e) => setEditData({ ...editData, numero_nos: e.target.value })}
              disabled={isLoading}
            />
          </div>

          {/* Checkboxes */}
          <div className="flex flex-wrap gap-6">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={editData.atingiu_arame}
                onChange={(e) => setEditData({ ...editData, atingiu_arame: e.target.checked })}
                disabled={isLoading}
                className="w-4 h-4 accent-primary"
              />
              <span className="text-sm">Atingiu o arame de formação</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={editData.necessita_tutoramento}
                onChange={(e) => setEditData({ ...editData, necessita_tutoramento: e.target.checked })}
                disabled={isLoading}
                className="w-4 h-4 accent-primary"
              />
              <span className="text-sm">Necessita tutoramento</span>
            </label>
          </div>

          {/* Observações */}
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Observações</label>
            <Textarea
              placeholder="Notas técnicas..."
              value={editData.observacoes}
              onChange={(e) => setEditData({ ...editData, observacoes: e.target.value })}
              disabled={isLoading}
              rows={3}
            />
          </div>

          <div className="flex gap-2 justify-end">
            <Button variant="ghost" size="sm" onClick={handleCancel} disabled={isLoading}>
              <X className="w-4 h-4 mr-1" />
              Cancelar
            </Button>
            <Button size="sm" onClick={handleSave} disabled={isLoading}>
              {updateMutation.isPending ? (
                <Loader2 className="w-4 h-4 mr-1 animate-spin" />
              ) : (
                <Check className="w-4 h-4 mr-1" />
              )}
              Salvar
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ── Modo visualização ────────────────────────────────────
  return (
    <div className="relative pl-6 pb-6 border-l-2 border-border last:pb-0">
      <div className="absolute left-[-9px] top-0 w-4 h-4 rounded-full bg-primary border-4 border-background" />

      <div className="bg-muted/50 rounded-lg p-4">
        {/* Linha principal: data, fase, altura, diâmetro */}
        <div className="flex flex-wrap items-center gap-3 mb-3">
          <span className="text-sm font-medium text-foreground">
            {new Date(observacao.data + 'T12:00:00').toLocaleDateString('pt-BR')}
          </span>

          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
            <Leaf className="w-3 h-3 mr-1" />
            {observacao.fase_fenologica}
          </span>

          {observacao.altura_cm != null && (
            <span className="inline-flex items-center text-xs text-muted-foreground">
              <Ruler className="w-3 h-3 mr-1" />
              {observacao.altura_cm} cm
            </span>
          )}

          {observacao.diametro_caule_mm != null && (
            <span className="inline-flex items-center text-xs text-muted-foreground">
              <CircleDot className="w-3 h-3 mr-1" />
              Ø {observacao.diametro_caule_mm} mm
            </span>
          )}

          {observacao.numero_nos != null && (
            <span className="inline-flex items-center text-xs text-muted-foreground">
              <Hash className="w-3 h-3 mr-1" />
              {observacao.numero_nos} nós
            </span>
          )}

          <div className="flex-1" />

          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => setIsEditing(true)}
              disabled={isLoading}
            >
              <Pencil className="w-3.5 h-3.5" />
            </Button>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-destructive hover:text-destructive"
                  disabled={isLoading}
                >
                  {deleteMutation.isPending ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="w-3.5 h-3.5" />
                  )}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Excluir esta observação?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta ação não pode ser desfeita. A observação será permanentemente removida.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Excluir
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        {/* Badges de estado */}
        {(observacao.atingiu_arame || observacao.necessita_tutoramento) && (
          <div className="flex flex-wrap gap-2 mb-2">
            {observacao.atingiu_arame && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-500/10 text-green-700">
                ✓ Atingiu o arame
              </span>
            )}
            {observacao.necessita_tutoramento && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-500/10 text-yellow-700">
                ⚠ Necessita tutoramento
              </span>
            )}
          </div>
        )}

        {observacao.observacoes && (
          <p className="text-sm text-foreground">{observacao.observacoes}</p>
        )}
      </div>
    </div>
  );
}