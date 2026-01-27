import { useState } from 'react';
import { Leaf, Ruler, Pencil, Trash2, Check, X, Loader2 } from 'lucide-react';
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
        },
      });

      toast({
        title: 'Sucesso',
        description: 'Observação atualizada com sucesso.',
      });

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

      toast({
        title: 'Sucesso',
        description: 'Observação excluída com sucesso.',
      });
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
    });
    setIsEditing(false);
  };

  const isLoading = updateMutation.isPending || deleteMutation.isPending;

  if (isEditing) {
    return (
      <div className="relative pl-6 pb-6 border-l-2 border-border last:pb-0">
        <div className="absolute left-[-9px] top-0 w-4 h-4 rounded-full bg-primary border-4 border-background" />
        
        <div className="bg-muted/50 rounded-lg p-4 space-y-4">
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
                    <SelectItem key={fase} value={fase}>
                      {fase}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Altura (cm)</label>
            <Input
              type="number"
              placeholder="Altura em cm"
              value={editData.altura_cm}
              onChange={(e) => setEditData({ ...editData, altura_cm: e.target.value })}
              disabled={isLoading}
            />
          </div>
          
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
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCancel}
              disabled={isLoading}
            >
              <X className="w-4 h-4 mr-1" />
              Cancelar
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={isLoading}
            >
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

  return (
    <div className="relative pl-6 pb-6 border-l-2 border-border last:pb-0">
      <div className="absolute left-[-9px] top-0 w-4 h-4 rounded-full bg-primary border-4 border-background" />
      
      <div className="bg-muted/50 rounded-lg p-4">
        <div className="flex flex-wrap items-center gap-4 mb-3">
          <span className="text-sm font-medium text-foreground">
            {new Date(observacao.data + 'T12:00:00').toLocaleDateString('pt-BR')}
          </span>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
            <Leaf className="w-3 h-3 mr-1" />
            {observacao.fase_fenologica}
          </span>
          {observacao.altura_cm && (
            <span className="inline-flex items-center text-xs text-muted-foreground">
              <Ruler className="w-3 h-3 mr-1" />
              {observacao.altura_cm} cm
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
                  <AlertDialogTitle>Tem certeza que deseja excluir esta observação?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta ação não pode ser desfeita. A observação será permanentemente removida do banco de dados.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                    Excluir
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
        {observacao.observacoes && (
          <p className="text-sm text-foreground">{observacao.observacoes}</p>
        )}
      </div>
    </div>
  );
}
