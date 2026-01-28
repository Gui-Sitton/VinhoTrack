import { useState } from 'react';
import { Loader2, Plus, Trash2, Droplet, Calendar, Pencil, X, Check } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useTalhoes } from '@/hooks/useMudas';
import {
  useIrrigacoes,
  useCreateIrrigacao,
  useUpdateIrrigacao,
  useDeleteIrrigacao,
  Irrigacao,
} from '@/hooks/useIrrigacoes';
import { irrigacaoSchema } from '@/lib/irrigacaoValidations';

const emptyForm = {
  talhao_id: '',
  data_inicio: format(new Date(), 'yyyy-MM-dd'),
  data_fim: '',
  volume_total_l: '',
  volume_por_muda_l: '',
  observacoes: '',
};

export default function IrrigacoesPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<Record<string, string>>({});
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: talhoes, isLoading: talhoesLoading } = useTalhoes();
  const { data: irrigacoes, isLoading: irrigacoesLoading } = useIrrigacoes();
  const createIrrigacao = useCreateIrrigacao();
  const updateIrrigacao = useUpdateIrrigacao();
  const deleteIrrigacao = useDeleteIrrigacao();

  const isLoading = talhoesLoading || irrigacoesLoading;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const volumeTotal = parseFloat(formData.volume_total_l);
    const volumePorMuda = formData.volume_por_muda_l ? parseFloat(formData.volume_por_muda_l) : null;

    const inputData = {
      talhao_id: formData.talhao_id,
      data_inicio: formData.data_inicio,
      data_fim: formData.data_fim || null,
      volume_total_l: isNaN(volumeTotal) ? 0 : volumeTotal,
      volume_por_muda_l: volumePorMuda && !isNaN(volumePorMuda) ? volumePorMuda : null,
      observacoes: formData.observacoes || null,
    };

    const validationResult = irrigacaoSchema.safeParse(inputData);

    if (!validationResult.success) {
      const firstError = validationResult.error.errors[0];
      toast.error(firstError.message);
      return;
    }

    const validatedData = validationResult.data;

    try {
      await createIrrigacao.mutateAsync({
        talhao_id: validatedData.talhao_id,
        data_inicio: validatedData.data_inicio,
        data_fim: validatedData.data_fim,
        volume_total_l: validatedData.volume_total_l,
        volume_por_muda_l: validatedData.volume_por_muda_l,
        observacoes: validatedData.observacoes,
      });
      toast.success('Irrigação registrada com sucesso!');
      setIsDialogOpen(false);
      setFormData(emptyForm);
    } catch (error) {
      toast.error('Erro ao registrar irrigação');
    }
  };

  const startEditing = (irrigacao: Irrigacao) => {
    setEditingId(irrigacao.id);
    setEditFormData({
      talhao_id: irrigacao.talhao_id,
      data_inicio: irrigacao.data_inicio,
      data_fim: irrigacao.data_fim || '',
      volume_total_l: String(irrigacao.volume_total_l),
      volume_por_muda_l: irrigacao.volume_por_muda_l ? String(irrigacao.volume_por_muda_l) : '',
      observacoes: irrigacao.observacoes || '',
    });
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditFormData({});
  };

  const handleSaveEdit = async () => {
    if (!editingId) return;

    const volumeTotal = parseFloat(editFormData.volume_total_l);
    const volumePorMuda = editFormData.volume_por_muda_l ? parseFloat(editFormData.volume_por_muda_l) : null;

    const inputData = {
      talhao_id: editFormData.talhao_id,
      data_inicio: editFormData.data_inicio,
      data_fim: editFormData.data_fim || null,
      volume_total_l: isNaN(volumeTotal) ? 0 : volumeTotal,
      volume_por_muda_l: volumePorMuda && !isNaN(volumePorMuda) ? volumePorMuda : null,
      observacoes: editFormData.observacoes || null,
    };

    const validationResult = irrigacaoSchema.safeParse(inputData);

    if (!validationResult.success) {
      const firstError = validationResult.error.errors[0];
      toast.error(firstError.message);
      return;
    }

    const validatedData = validationResult.data;

    try {
      await updateIrrigacao.mutateAsync({
        id: editingId,
        talhao_id: validatedData.talhao_id,
        data_inicio: validatedData.data_inicio,
        data_fim: validatedData.data_fim,
        volume_total_l: validatedData.volume_total_l,
        volume_por_muda_l: validatedData.volume_por_muda_l,
        observacoes: validatedData.observacoes,
      });
      toast.success('Irrigação atualizada com sucesso!');
      cancelEditing();
    } catch (error) {
      toast.error('Erro ao atualizar irrigação');
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      await deleteIrrigacao.mutateAsync(deleteId);
      toast.success('Irrigação removida com sucesso!');
      setDeleteId(null);
    } catch (error) {
      toast.error('Erro ao remover irrigação');
    }
  };

  // Estatísticas
  const totalVolume = irrigacoes?.reduce((acc, i) => acc + Number(i.volume_total_l), 0) || 0;
  const totalEventos = irrigacoes?.length || 0;
  const mediaVolumePorEvento = totalEventos > 0 ? totalVolume / totalEventos : 0;

  if (isLoading) {
    return (
      <div className="flex min-h-screen bg-background">
        <AppSidebar />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar />
      <main className="flex-1 p-6 md:p-8 overflow-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground">
              Irrigação
            </h1>
            <p className="text-muted-foreground mt-1">
              Gerencie os registros de irrigação dos talhões
            </p>
          </div>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Nova Irrigação
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Droplet className="h-5 w-5 text-blue-500" />
                  Registrar Irrigação
                </DialogTitle>
                <DialogDescription>
                  Registre um novo evento de irrigação
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Talhão */}
                <div className="space-y-2">
                  <Label htmlFor="talhao">Talhão *</Label>
                  <Select
                    value={formData.talhao_id}
                    onValueChange={(value) => setFormData({ ...formData, talhao_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o talhão" />
                    </SelectTrigger>
                    <SelectContent>
                      {talhoes?.map((talhao) => (
                        <SelectItem key={talhao.id} value={talhao.id}>
                          {talhao.codigo} - {talhao.variedade}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Data de Início */}
                <div className="space-y-2">
                  <Label htmlFor="data_inicio">Data de Início *</Label>
                  <Input
                    type="date"
                    id="data_inicio"
                    value={formData.data_inicio}
                    onChange={(e) => setFormData({ ...formData, data_inicio: e.target.value })}
                    required
                  />
                </div>

                {/* Data de Fim */}
                <div className="space-y-2">
                  <Label htmlFor="data_fim">Data de Fim (opcional)</Label>
                  <Input
                    type="date"
                    id="data_fim"
                    value={formData.data_fim}
                    onChange={(e) => setFormData({ ...formData, data_fim: e.target.value })}
                  />
                </div>

                {/* Volume Total */}
                <div className="space-y-2">
                  <Label htmlFor="volume_total_l">Volume Total (L) *</Label>
                  <Input
                    type="number"
                    id="volume_total_l"
                    placeholder="Ex: 1000"
                    step="0.01"
                    min="0"
                    value={formData.volume_total_l}
                    onChange={(e) => setFormData({ ...formData, volume_total_l: e.target.value })}
                    required
                  />
                </div>

                {/* Volume por Muda */}
                <div className="space-y-2">
                  <Label htmlFor="volume_por_muda_l">Volume por Muda (L) (opcional)</Label>
                  <Input
                    type="number"
                    id="volume_por_muda_l"
                    placeholder="Ex: 2.5"
                    step="0.01"
                    min="0"
                    value={formData.volume_por_muda_l}
                    onChange={(e) => setFormData({ ...formData, volume_por_muda_l: e.target.value })}
                  />
                </div>

                {/* Observações */}
                <div className="space-y-2">
                  <Label htmlFor="observacoes">Observações</Label>
                  <Textarea
                    id="observacoes"
                    placeholder="Observações sobre a irrigação..."
                    value={formData.observacoes}
                    onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                    rows={3}
                  />
                </div>

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={createIrrigacao.isPending}>
                    {createIrrigacao.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      'Salvar'
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <Droplet className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Volume Total</p>
                  <p className="text-2xl font-bold">{totalVolume.toLocaleString()} L</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-cyan-100 dark:bg-cyan-900/30 rounded-lg">
                  <Calendar className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Eventos de Irrigação</p>
                  <p className="text-2xl font-bold">{totalEventos}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-teal-100 dark:bg-teal-900/30 rounded-lg">
                  <Droplet className="h-5 w-5 text-teal-600 dark:text-teal-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Média por Evento</p>
                  <p className="text-2xl font-bold">{mediaVolumePorEvento.toLocaleString(undefined, { maximumFractionDigits: 0 })} L</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabela de Irrigações */}
        <Card>
          <CardHeader>
            <CardTitle>Histórico de Irrigação</CardTitle>
            <CardDescription>
              Todos os eventos de irrigação registrados, ordenados por data de início
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!irrigacoes || irrigacoes.length === 0 ? (
              <div className="text-center py-12">
                <Droplet className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">
                  Nenhuma irrigação registrada
                </h3>
                <p className="text-muted-foreground mb-4">
                  Comece registrando o primeiro evento de irrigação
                </p>
                <Button onClick={() => setIsDialogOpen(true)} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Nova Irrigação
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Talhão</TableHead>
                      <TableHead>Data Início</TableHead>
                      <TableHead>Data Fim</TableHead>
                      <TableHead>Volume Total (L)</TableHead>
                      <TableHead>Vol./Muda (L)</TableHead>
                      <TableHead>Observações</TableHead>
                      <TableHead className="w-[100px]">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {irrigacoes.map((irrigacao) => {
                      const talhao = talhoes?.find(t => t.id === irrigacao.talhao_id);
                      const isEditing = editingId === irrigacao.id;

                      if (isEditing) {
                        return (
                          <TableRow key={irrigacao.id}>
                            <TableCell>
                              <Select
                                value={editFormData.talhao_id}
                                onValueChange={(value) => setEditFormData({ ...editFormData, talhao_id: value })}
                              >
                                <SelectTrigger className="w-[140px]">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {talhoes?.map((t) => (
                                    <SelectItem key={t.id} value={t.id}>
                                      {t.codigo}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </TableCell>
                            <TableCell>
                              <Input
                                type="date"
                                value={editFormData.data_inicio}
                                onChange={(e) => setEditFormData({ ...editFormData, data_inicio: e.target.value })}
                                className="w-[130px]"
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                type="date"
                                value={editFormData.data_fim}
                                onChange={(e) => setEditFormData({ ...editFormData, data_fim: e.target.value })}
                                className="w-[130px]"
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                step="0.01"
                                value={editFormData.volume_total_l}
                                onChange={(e) => setEditFormData({ ...editFormData, volume_total_l: e.target.value })}
                                className="w-[100px]"
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                step="0.01"
                                value={editFormData.volume_por_muda_l}
                                onChange={(e) => setEditFormData({ ...editFormData, volume_por_muda_l: e.target.value })}
                                className="w-[80px]"
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                value={editFormData.observacoes}
                                onChange={(e) => setEditFormData({ ...editFormData, observacoes: e.target.value })}
                                className="w-[150px]"
                              />
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={handleSaveEdit}
                                  disabled={updateIrrigacao.isPending}
                                >
                                  <Check className="h-4 w-4 text-green-600" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={cancelEditing}
                                >
                                  <X className="h-4 w-4 text-muted-foreground" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      }

                      return (
                        <TableRow key={irrigacao.id}>
                          <TableCell className="font-medium">
                            {talhao?.codigo || '-'}
                          </TableCell>
                          <TableCell>
                            {format(new Date(irrigacao.data_inicio + 'T12:00:00'), 'dd/MM/yyyy', { locale: ptBR })}
                          </TableCell>
                          <TableCell>
                            {irrigacao.data_fim
                              ? format(new Date(irrigacao.data_fim + 'T12:00:00'), 'dd/MM/yyyy', { locale: ptBR })
                              : '-'}
                          </TableCell>
                          <TableCell>
                            {Number(irrigacao.volume_total_l).toLocaleString()}
                          </TableCell>
                          <TableCell>
                            {irrigacao.volume_por_muda_l
                              ? Number(irrigacao.volume_por_muda_l).toLocaleString()
                              : '-'}
                          </TableCell>
                          <TableCell className="max-w-[200px] truncate">
                            {irrigacao.observacoes || '-'}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => startEditing(irrigacao)}
                              >
                                <Pencil className="h-4 w-4 text-muted-foreground" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setDeleteId(irrigacao.id)}
                                disabled={deleteIrrigacao.isPending}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este registro de irrigação? Esta ação não pode ser desfeita.
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
  );
}
