'use client';

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/use-auth';
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
} from '@/components/ui/dialog';
import {
  Search,
  Plus,
  Edit,
  Trash2,
  Package,
  Barcode,
  Loader2,
  AlertTriangle,
} from 'lucide-react';

interface Product {
  id: string;
  barcode: string;
  name: string;
  description: string | null;
  price: number;
  cost: number | null;
  quantity: number;
}

export default function ProductsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const isAdmin = user?.role === 'ADMIN';

  // Estados de Busca e Modais
  const [search, setSearch] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Estados dos Campos do Formulário
  const [barcode, setBarcode] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [cost, setCost] = useState('');
  const [quantity, setQuantity] = useState('');

  // 1. Query: Listar produtos
  const { data: products = [], isLoading } = useQuery<Product[]>({
    queryKey: ['products', search],
    queryFn: async () => {
      const response = await api.get('/products', {
        params: { search: search || undefined },
      });
      return response.data;
    },
  });

  // 2. Mutation: Criar produto
  const createMutation = useMutation({
    mutationFn: async (newProduct: any) => {
      const response = await api.post('/products', newProduct);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Produto cadastrado com sucesso!');
      closeForm();
    },
    onError: (error: any) => {
      const msg = error.response?.data?.message || 'Erro ao cadastrar produto.';
      toast.error(msg);
    },
  });

  // 3. Mutation: Editar produto
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await api.put(`/products/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Produto atualizado com sucesso!');
      closeForm();
    },
    onError: (error: any) => {
      const msg = error.response?.data?.message || 'Erro ao atualizar produto.';
      toast.error(msg);
    },
  });

  // 4. Mutation: Deletar produto
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await api.delete(`/products/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Produto excluído com sucesso!');
      setIsDeleteOpen(false);
      setSelectedProduct(null);
    },
    onError: (error: any) => {
      const msg = error.response?.data?.message || 'Erro ao excluir produto.';
      toast.error(msg);
    },
  });

  // 5. Integração com Leitor de Código de Barras (Keypress listener global)
  useEffect(() => {
    let chars: string[] = [];
    let lastKeyTime = Date.now();

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignora se estiver digitando em outros inputs de texto,
      // exceto se for o campo de código de barras do próprio formulário.
      const target = e.target as HTMLElement;
      const isEditingText = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA';
      if (isEditingText && target.id !== 'barcode') {
        return;
      }

      const currentTime = Date.now();

      // Leitores de código de barras digitam extremamente rápido (geralmente < 20ms por caractere).
      // Se a diferença de tempo for maior que 40ms, reinicia o buffer assumindo digitação manual.
      if (currentTime - lastKeyTime > 40) {
        chars = [];
      }

      lastKeyTime = currentTime;

      if (e.key === 'Enter') {
        if (chars.length >= 3) {
          const scannedBarcode = chars.join('');
          chars = [];
          e.preventDefault();
          handleScannedBarcode(scannedBarcode);
        }
      } else if (e.key.length === 1 && /[a-zA-Z0-9-]/.test(e.key)) {
        chars.push(e.key);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [products, isFormOpen]);

  const handleScannedBarcode = (scannedBarcode: string) => {
    toast.info(`Código detectado: ${scannedBarcode}`);

    // Procura o produto cadastrado localmente no array do React Query
    const existingProduct = products.find((p) => p.barcode === scannedBarcode);

    if (existingProduct) {
      // Abre o modal de edição com o produto correspondente
      handleEditClick(existingProduct);
    } else {
      if (!isAdmin) {
        toast.warning('Código não cadastrado. Apenas administradores podem cadastrar produtos.');
        return;
      }
      // Abre o formulário de cadastro de novo produto preenchendo o código de barras
      handleCreateClick();
      setBarcode(scannedBarcode);
      toast.message('Novo código de barras detectado!', {
        description: 'Preencha o restante das informações para cadastrar o produto.',
      });
    }
  };

  // Funções de manipulação do Formulário
  const handleCreateClick = () => {
    setSelectedProduct(null);
    setBarcode('');
    setName('');
    setDescription('');
    setPrice('');
    setCost('');
    setQuantity('0');
    setIsFormOpen(true);
  };

  const handleEditClick = (product: Product) => {
    setSelectedProduct(product);
    setBarcode(product.barcode);
    setName(product.name);
    setDescription(product.description || '');
    setPrice(product.price.toString());
    setCost(product.cost?.toString() || '');
    setQuantity(product.quantity.toString());
    setIsFormOpen(true);
  };

  const handleDeleteClick = (product: Product) => {
    setSelectedProduct(product);
    setIsDeleteOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setSelectedProduct(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!barcode || !name || !price || !quantity) {
      toast.error('Preencha todos os campos obrigatórios.');
      return;
    }

    const payload = {
      barcode,
      name,
      description: description || null,
      price: parseFloat(price),
      cost: cost ? parseFloat(cost) : null,
      quantity: parseInt(quantity, 10),
    };

    if (selectedProduct) {
      updateMutation.mutate({ id: selectedProduct.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Estoque de Produtos</h2>
          <p className="text-muted-foreground">
            Visualize, filtre e cadastre os produtos da loja. Você também pode bipar o leitor de código de barras a qualquer momento para abrir ou cadastrar um item.
          </p>
        </div>
        {isAdmin && (
          <Button onClick={handleCreateClick} className="font-semibold self-start md:self-auto">
            <Plus className="mr-2 h-4 w-4" />
            Cadastrar Produto
          </Button>
        )}
      </div>

      {/* Barra de Ações (Pesquisa e Feedback de Scanner) */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:max-w-sm">
          <Search className="absolute left-3 top-2.5 h-4.5 w-4.5 text-muted-foreground" />
          <Input
            placeholder="Pesquisar por nome ou código..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full border bg-zinc-50 dark:bg-zinc-900/50 text-xs text-muted-foreground font-medium animate-pulse">
          <Barcode className="h-4 w-4 text-primary" />
          Leitor USB pronto. Bipe um código de barras para atalho rápido.
        </div>
      </div>

      {/* Tabela de Produtos */}
      <div className="border rounded-xl bg-card text-card-foreground overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="text-sm text-muted-foreground">Carregando lista de produtos...</span>
          </div>
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center text-muted-foreground gap-2">
            <Package className="h-12 w-12 stroke-1 text-zinc-300" />
            <p className="text-base font-semibold">Nenhum produto cadastrado.</p>
            <p className="text-xs max-w-sm">Utilize o botão acima ou bipe um código de barras para criar o primeiro produto.</p>
          </div>
        ) : (
          <Table>
            <TableHeader className="bg-zinc-50/75 dark:bg-zinc-950/25">
              <TableRow>
                <TableHead>Código de Barras</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead className="text-right">Preço de Venda</TableHead>
                {isAdmin && <TableHead className="text-right">Preço de Custo</TableHead>}
                <TableHead className="text-right">Estoque</TableHead>
                {isAdmin && <TableHead className="text-center w-[120px]">Ações</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product) => {
                const isLowStock = product.quantity <= 5;
                return (
                  <TableRow key={product.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/25">
                    <TableCell className="font-mono text-xs font-semibold">{product.barcode}</TableCell>
                    <TableCell className="font-semibold">{product.name}</TableCell>
                    <TableCell className="text-right font-medium">
                      {product.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </TableCell>
                    {isAdmin && (
                      <TableCell className="text-right text-muted-foreground">
                        {product.cost
                          ? product.cost.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                          : '-'}
                      </TableCell>
                    )}
                    <TableCell className="text-right">
                      <span className={`inline-flex items-center gap-1.5 font-bold ${isLowStock ? 'text-amber-500' : 'text-zinc-900 dark:text-zinc-100'}`}>
                        {isLowStock && <AlertTriangle className="h-3.5 w-3.5" />}
                        {product.quantity} un.
                      </span>
                    </TableCell>
                    {isAdmin && (
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
                            onClick={() => handleEditClick(product)}
                            title="Editar"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-zinc-400 hover:text-red-600"
                            onClick={() => handleDeleteClick(product)}
                            title="Excluir"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Modal de Formulário (Cadastro / Edição) */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-md border">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">
              {selectedProduct ? 'Editar Produto' : 'Cadastrar Novo Produto'}
            </DialogTitle>
            <DialogDescription>
              {selectedProduct
                ? 'Altere as informações do produto conforme necessário.'
                : 'Insira os dados do novo produto para adicioná-lo ao estoque local.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="barcode">Código de Barras *</Label>
              <Input
                id="barcode"
                placeholder="Ex: 7891000100010"
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                required
                disabled={selectedProduct !== null} // Código de barras de produtos existentes é imutável
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Nome do Produto *</Label>
              <Input
                id="name"
                placeholder="Ex: Coca-Cola 350ml"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Input
                id="description"
                placeholder="Ex: Bebida gaseificada lata"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">Preço de Venda (R$) *</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="5.50"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cost">Preço de Custo (R$)</Label>
                <Input
                  id="cost"
                  type="number"
                  step="0.01"
                  min="0.00"
                  placeholder="3.20"
                  value={cost}
                  onChange={(e) => setCost(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantidade em Estoque *</Label>
              <Input
                id="quantity"
                type="number"
                min="0"
                placeholder="10"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                required
              />
            </div>
            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={closeForm}>
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
                className="font-semibold"
              >
                {(createMutation.isPending || updateMutation.isPending) && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Salvar Produto
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal de Exclusão */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="max-w-sm border">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Excluir Produto
            </DialogTitle>
            <DialogDescription className="pt-2">
              Tem certeza que deseja excluir o produto{' '}
              <strong className="text-zinc-900 dark:text-zinc-50">"{selectedProduct?.name}"</strong>?
              Esta ação é permanente e não poderá ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 mt-4">
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              className="font-semibold"
              onClick={() => selectedProduct && deleteMutation.mutate(selectedProduct.id)}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Excluir Permanentemente
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
