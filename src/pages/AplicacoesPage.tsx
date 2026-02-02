import { useState } from 'react';
import { Loader2, Plus, Trash2, Droplets, Calendar, Package, FlaskConical } from 'lucide-react';
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
import { Badge } from '@/components/ui/badge';
import { useTalhoes } from '@/hooks/useMudas';
import { useProdutos, useAplicacoes, useCreateAplicacao, useDeleteAplicacao } from '@/hooks/useAplicacoes';
import { aplicacaoSchema } from '@/lib/validations';

const tipoBadgeColors: Record<string, string> = {
  fungicida: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
  fertilizante: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  corretivo: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300',
  inseticida: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
  adjuvante: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  outro: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300',
};

const tipoLabels: Record<string, string> = {
  fungicida: 'Fungicida',
  fertilizante: 'Fertilizante',
  corretivo: 'Corretivo',
  inseticida: 'Inseticida',
  adjuvante: 'Adjuvante',
  outro: 'Outro',
};

export default function AplicacoesPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    produto_id: '',
    talhao_id: '',
    data: format(new Date(), 'yyyy-MM-dd'),
    quantidade: '',
    motivo: '',
  });

  const { data: talhoes, isLoading: talhoesLoading } = useTalhoes();
  const { data: produtos, isLoading: produtosLoading } = useProdutos();
  const { data: aplicacoes, isLoading: aplicacoesLoading } = useAplicacoes();
  const createAplicacao = useCreateAplicacao();
  const deleteAplicacao = useDeleteAplicacao();

  const isLoading = talhoesLoading || produtosLoading || aplicacoesLoading;

  const selectedProduto = produtos?.find(p => p.id === formData.produto_id);
  const selectedTalhao = talhoes?.find(t => t.id === formData.talhao_id);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Parse and validate input with Zod schema
    const quantidadeNum = parseFloat(formData.quantidade);
    const inputData = {
      produto_id: formData.produto_id,
      talhao_id: formData.talhao_id,
      data: formData.data,
      quantidade: isNaN(quantidadeNum) ? 0 : quantidadeNum,
      motivo: formData.motivo || undefined,
    };

    const validationResult = aplicacaoSchema.safeParse(inputData);

    if (!validationResult.success) {
      const firstError = validationResult.error.errors[0];
      toast.error(firstError.message);
      return;
    }

    try {
      // Use the validated data which has correct types
      await createAplicacao.mutateAsync({
        produto_id: validationResult.data.produto_id,
        talhao_id: validationResult.data.talhao_id,
        data: validationResult.data.data,
        quantidade: validationResult.data.quantidade,
        motivo: validationResult.data.motivo,
      });

      toast.success('Aplicação registrada com sucesso!');
      setIsDialogOpen(false);
      setFormData({
        produto_id: '',
        talhao_id: '',
        data: format(new Date(), 'yyyy-MM-dd'),
        quantidade: '',
        motivo: '',
      });
    } catch (error) {
      toast.error('Erro ao registrar aplicação');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteAplicacao.mutateAsync(id);
      toast.success('Aplicação removida com sucesso!');
    } catch (error) {
      toast.error('Erro ao remover aplicação');
    }
  };

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
              Aplicações de Produtos
            </h1>
            <p className="text-muted-foreground mt-1">
              Gerencie as aplicações de fungicidas, fertilizantes e outros produtos
            </p>
          </div>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Nova Aplicação
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Droplets className="h-5 w-5 text-primary" />
                  Registrar Aplicação
                </DialogTitle>
                <DialogDescription>
                  Registre uma nova aplicação de produto no talhão
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

                {/* Produto */}
                <div className="space-y-2">
                  <Label htmlFor="produto">Produto *</Label>
                  <Select
                    value={formData.produto_id}
                    onValueChange={(value) => setFormData({ ...formData, produto_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o produto" />
                    </SelectTrigger>
                    <SelectContent>
                      {produtos?.map((produto) => (
                        <SelectItem key={produto.id} value={produto.id}>
                          <div className="flex items-center gap-2">
                            <span>{produto.nome}</span>
                            <Badge variant="outline" className="text-xs">
                              {tipoLabels[produto.tipo]}
                            </Badge>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedProduto?.ingrediente_ativo && (
                    <p className="text-xs text-muted-foreground">
                      Ingrediente ativo: {selectedProduto.ingrediente_ativo}
                    </p>
                  )}
                </div>

                {/* Data */}
                <div className="space-y-2">
                  <Label htmlFor="data">Data da Aplicação *</Label>
                  <Input
                    type="date"
                    id="data"
                    value={formData.data}
                    onChange={(e) => setFormData({ ...formData, data: e.target.value })}
                    required
                  />
                </div>

                {/* Quantidade */}
                <div className="space-y-2">
                  <Label htmlFor="quantidade">
                    Quantidade {selectedProduto ? `(${selectedProduto.unidade})` : ''} *
                  </Label>
                  <Input
                    type="number"
                    id="quantidade"
                    placeholder="Ex: 2.5"
                    step="0.01"
                    min="0"
                    value={formData.quantidade}
                    onChange={(e) => setFormData({ ...formData, quantidade: e.target.value })}
                    required
                  />
                </div>

                {/* Motivo */}
                <div className="space-y-2">
                  <Label htmlFor="motivo">Motivo / Observações</Label>
                  <Textarea
                    id="motivo"
                    placeholder="Descreva o motivo da aplicação..."
                    value={formData.motivo}
                    onChange={(e) => setFormData({ ...formData, motivo: e.target.value })}
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
                  <Button type="submit" disabled={createAplicacao.isPending}>
                    {createAplicacao.isPending ? (
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Droplets className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total de Aplicações</p>
                  <p className="text-2xl font-bold">{aplicacoes?.length || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                  <FlaskConical className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Fungicidas</p>
                  <p className="text-2xl font-bold">
                    {aplicacoes?.filter(a => a.produto?.tipo === 'fungicida').length || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                  <Package className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Fertilizantes</p>
                  <p className="text-2xl font-bold">
                    {aplicacoes?.filter(a => a.produto?.tipo === 'fertilizante').length || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                  <Calendar className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Produtos</p>
                  <p className="text-2xl font-bold">{produtos?.length || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabela de Aplicações */}
        <Card>
          <CardHeader>
            <CardTitle>Histórico de Aplicações</CardTitle>
            <CardDescription>
              Todas as aplicações de produtos registradas no sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!aplicacoes || aplicacoes.length === 0 ? (
              <div className="text-center py-12">
                <Droplets className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">
                  Nenhuma aplicação registrada
                </h3>
                <p className="text-muted-foreground mb-4">
                  Comece registrando a primeira aplicação de produto
                </p>
                <Button onClick={() => setIsDialogOpen(true)} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Nova Aplicação
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Produto</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Talhão</TableHead>
                      <TableHead>Quantidade</TableHead>
                      <TableHead>Motivo</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {aplicacoes.map((aplicacao) => {
                      const talhao = talhoes?.find(t => t.id === aplicacao.talhao_id);
                      return (
                        <TableRow key={aplicacao.id}>
                          <TableCell className="font-medium">
                            {format(new Date(aplicacao.data), 'dd/MM/yyyy', { locale: ptBR })}
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">{aplicacao.produto?.nome || '-'}</p>
                              {aplicacao.produto?.ingrediente_ativo && (
                                <p className="text-xs text-muted-foreground">
                                  {aplicacao.produto.ingrediente_ativo}
                                </p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {aplicacao.produto?.tipo && (
                              <Badge className={tipoBadgeColors[aplicacao.produto.tipo]}>
                                {tipoLabels[aplicacao.produto.tipo]}
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {talhao ? `${talhao.codigo}` : '-'}
                          </TableCell>
                          <TableCell>
                            {aplicacao.quantidade} {aplicacao.produto?.unidade || ''}
                          </TableCell>
                          <TableCell className="max-w-[200px] truncate">
                            {aplicacao.motivo || '-'}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(aplicacao.id)}
                              disabled={deleteAplicacao.isPending}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
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
    </div>
  );
}
