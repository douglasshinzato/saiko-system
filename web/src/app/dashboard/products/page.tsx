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
  ChevronDown,
  ChevronRight,
} from 'lucide-react';

interface ProductVariant {
  id?: string;
  productId?: string;
  barcode: string;
  sku: string | null;
  description: string;
  price: number;
  cost: number | null;
  quantity: number;
}

interface Product {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  variants: ProductVariant[];
}

export default function ProductsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const isAdmin = user?.role === 'ADMIN';

  // Estados de Busca e Modais
  const [search, setSearch] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isCollisionOpen, setIsCollisionOpen] = useState(false);

  // Estados para controle de expansão de linhas da tabela
  const [expandedProductIds, setExpandedProductIds] = useState<Record<string, boolean>>({});

  // Seleções
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [collisionVariants, setCollisionVariants] = useState<any[]>([]);

  // Estados do Formulário do Produto Pai
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  // Estados das Variações no Formulário
  const [formVariants, setFormVariants] = useState<ProductVariant[]>([]);

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
      const target = e.target as HTMLElement;
      const isEditingText = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA';
      
      // Ignora digitação se estiver em um input de texto que NÃO seja um código de barras de variação
      if (isEditingText && !target.id.startsWith('barcode-')) {
        return;
      }

      const currentTime = Date.now();

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
  }, [products, isFormOpen, isCollisionOpen]);

  const handleScannedBarcode = async (scannedBarcode: string) => {
    toast.info(`Código detectado: ${scannedBarcode}`);

    try {
      const response = await api.get(`/products/barcode/${scannedBarcode}`);
      const variants = response.data;

      if (variants.length === 1) {
        const variant = variants[0];
        const product = products.find((p) => p.id === variant.productId);
        if (product) {
          handleEditClick(product);
        } else {
          toast.error('Produto correspondente não encontrado localmente.');
        }
      } else if (variants.length > 1) {
        setCollisionVariants(variants);
        setIsCollisionOpen(true);
      }
    } catch (error: any) {
      if (error.response?.status === 404) {
        if (!isAdmin) {
          toast.warning('Código não cadastrado. Apenas administradores podem cadastrar produtos.');
          return;
        }
        handleCreateClick();
        setFormVariants([
          { barcode: scannedBarcode, sku: null, description: 'Única', price: 0, cost: null, quantity: 0 }
        ]);
        toast.message('Novo código de barras detectado!', {
          description: 'Preencha as informações para cadastrar o produto e a variação correspondente.',
        });
      } else {
        toast.error('Erro ao pesquisar produto no banco de dados.');
      }
    }
  };

  // Funções de controle do Formulário de Variações
  const handleAddVariantField = () => {
    setFormVariants((prev) => [
      ...prev,
      { barcode: '', sku: null, description: '', price: 0, cost: null, quantity: 0 },
    ]);
  };

  const handleRemoveVariantField = (index: number) => {
    setFormVariants((prev) => prev.filter((_, i) => i !== index));
  };

  const handleVariantFieldChange = (index: number, field: keyof ProductVariant, value: any) => {
    setFormVariants((prev) =>
      prev.map((v, i) => {
        if (i === index) {
          return {
            ...v,
            [field]: value,
          };
        }
        return v;
      })
    );
  };

  // Funções de manipulação do Formulário Principal
  const handleCreateClick = () => {
    setSelectedProduct(null);
    setName('');
    setDescription('');
    setFormVariants([
      { barcode: '', sku: null, description: 'Única', price: 0, cost: null, quantity: 0 },
    ]);
    setIsFormOpen(true);
  };

  const handleEditClick = (product: Product) => {
    setSelectedProduct(product);
    setName(product.name);
    setDescription(product.description || '');
    setFormVariants(
      product.variants.map((v) => ({
        id: v.id,
        productId: v.productId,
        barcode: v.barcode,
        sku: v.sku,
        description: v.description,
        price: v.price,
        cost: v.cost,
        quantity: v.quantity,
      }))
    );
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

  const toggleProductExpand = (id: string) => {
    setExpandedProductIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name) {
      toast.error('Preencha o nome do produto.');
      return;
    }

    if (formVariants.length === 0) {
      toast.error('O produto precisa ter pelo menos uma variação cadastrada.');
      return;
    }

    // Validações básicas das variações
    for (let i = 0; i < formVariants.length; i++) {
      const v = formVariants[i];
      if (!v.barcode || !v.description) {
        toast.error(`Preencha o Código de Barras e Descrição da Variação #${i + 1}.`);
        return;
      }
      if (!v.price || Number(v.price) <= 0) {
        toast.error(`O Preço de Venda da Variação #${i + 1} deve ser maior que zero.`);
        return;
      }
    }

    const payload = {
      name,
      description: description || null,
      variants: formVariants.map((v) => ({
        id: v.id,
        barcode: v.barcode,
        sku: v.sku || null,
        description: v.description,
        price: typeof v.price === 'string' ? parseFloat(v.price) : v.price,
        cost: v.cost ? (typeof v.cost === 'string' ? parseFloat(v.cost) : v.cost) : null,
        quantity: typeof v.quantity === 'string' ? parseInt(v.quantity, 10) : v.quantity,
      })),
    };

    if (selectedProduct) {
      updateMutation.mutate({ id: selectedProduct.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  // Funções Auxiliares para a Tabela Principal
  const formatPriceRange = (variants: ProductVariant[]) => {
    if (variants.length === 0) return '-';
    const prices = variants.map((v) => v.price);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    if (minPrice === maxPrice) {
      return minPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    }
    return `${minPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} - ${maxPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`;
  };

  const formatCostRange = (variants: ProductVariant[]) => {
    const costs = variants.map((v) => v.cost).filter((c): c is number => c !== null);
    if (costs.length === 0) return '-';
    const minCost = Math.min(...costs);
    const maxCost = Math.max(...costs);
    if (minCost === maxCost) {
      return minCost.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    }
    return `${minCost.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} - ${maxCost.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`;
  };

  const getTotalQuantity = (variants: ProductVariant[]) => {
    return variants.reduce((acc, v) => acc + v.quantity, 0);
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
                <TableHead className="w-[40px]"></TableHead>
                <TableHead>Nome do Produto</TableHead>
                <TableHead>Descrição Geral</TableHead>
                <TableHead className="text-right">Preço de Venda</TableHead>
                {isAdmin && <TableHead className="text-right">Preço de Custo</TableHead>}
                <TableHead className="text-right">Estoque Geral</TableHead>
                {isAdmin && <TableHead className="text-center w-[120px]">Ações</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product) => {
                const isExpanded = !!expandedProductIds[product.id];
                const totalStock = getTotalQuantity(product.variants);
                const hasLowStockVariant = product.variants.some((v) => v.quantity <= 5);

                return (
                  <React.Fragment key={product.id}>
                    {/* Linha Principal do Produto */}
                    <TableRow
                      className="hover:bg-zinc-50 dark:hover:bg-zinc-800/25 cursor-pointer"
                      onClick={() => toggleProductExpand(product.id)}
                    >
                      <TableCell className="text-center p-2">
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4 text-zinc-400" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-zinc-400" />
                        )}
                      </TableCell>
                      <TableCell className="font-semibold">{product.name}</TableCell>
                      <TableCell className="text-muted-foreground truncate max-w-[200px]" title={product.description || ''}>
                        {product.description || '-'}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatPriceRange(product.variants)}
                      </TableCell>
                      {isAdmin && (
                        <TableCell className="text-right text-muted-foreground">
                          {formatCostRange(product.variants)}
                        </TableCell>
                      )}
                      <TableCell className="text-right">
                        <span className={`inline-flex items-center gap-1.5 font-bold ${hasLowStockVariant ? 'text-amber-500' : 'text-zinc-900 dark:text-zinc-100'}`}>
                          {hasLowStockVariant && <AlertTriangle className="h-3.5 w-3.5" />}
                          {totalStock} un.
                        </span>
                      </TableCell>
                      {isAdmin && (
                        <TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
                              onClick={() => handleEditClick(product)}
                              title="Editar Produto"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-zinc-400 hover:text-red-600"
                              onClick={() => handleDeleteClick(product)}
                              title="Excluir Produto"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      )}
                    </TableRow>

                    {/* Linha das Variações do Produto (Expandida) */}
                    {isExpanded && (
                      <TableRow className="hover:bg-transparent">
                        <TableCell colSpan={isAdmin ? 7 : 5} className="bg-zinc-50/50 dark:bg-zinc-900/10 p-4 border-t">
                          <div className="pl-6 border-l-2 border-primary/40 space-y-2">
                            <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                              Variações de {product.name} ({product.variants.length})
                            </div>
                            <div className="border rounded-lg bg-card overflow-hidden">
                              <Table>
                                <TableHeader className="bg-zinc-50/75 dark:bg-zinc-950/25">
                                  <TableRow className="hover:bg-transparent">
                                    <TableHead className="h-8 text-xs font-medium">Código de Barras</TableHead>
                                    <TableHead className="h-8 text-xs font-medium">Tamanho / Descrição</TableHead>
                                    <TableHead className="h-8 text-xs font-medium text-right">Preço de Venda</TableHead>
                                    {isAdmin && <TableHead className="h-8 text-xs font-medium text-right">Preço de Custo</TableHead>}
                                    <TableHead className="h-8 text-xs font-medium text-right">Estoque</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {product.variants.map((v) => {
                                    const isLowStock = v.quantity <= 5;
                                    return (
                                      <TableRow key={v.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/10">
                                        <TableCell className="py-2 text-xs font-mono font-semibold">{v.barcode}</TableCell>
                                        <TableCell className="py-2 text-xs font-medium">{v.description}</TableCell>
                                        <TableCell className="py-2 text-xs text-right font-semibold text-primary">
                                          {v.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                        </TableCell>
                                        {isAdmin && (
                                          <TableCell className="py-2 text-xs text-right text-muted-foreground">
                                            {v.cost ? v.cost.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '-'}
                                          </TableCell>
                                        )}
                                        <TableCell className={`py-2 text-xs text-right font-bold ${isLowStock ? 'text-amber-500' : ''}`}>
                                          {v.quantity} un.
                                        </TableCell>
                                      </TableRow>
                                    );
                                  })}
                                </TableBody>
                              </Table>
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Modal de Formulário (Cadastro / Edição) */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-xl w-full border">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">
              {selectedProduct ? 'Editar Produto' : 'Cadastrar Novo Produto'}
            </DialogTitle>
            <DialogDescription>
              {selectedProduct
                ? 'Altere as informações gerais e gerencie as variações do produto.'
                : 'Insira os dados do produto pai e defina as variações de estoque.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome do Produto *</Label>
              <Input
                id="name"
                placeholder="Ex: Calça de Pesca Mar Negro"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Descrição Geral</Label>
              <Input
                id="description"
                placeholder="Ex: Calça com proteção solar e secagem rápida"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            {/* Sub-form de Variações */}
            <div className="space-y-4 pr-1">
              <div className="flex items-center justify-between border-b pb-2">
                <Label className="font-bold text-sm">Variações de Estoque ({formVariants.length})</Label>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={handleAddVariantField}
                  className="h-8 text-xs font-semibold"
                >
                  <Plus className="mr-1 h-3.5 w-3.5" /> Adicionar Variação
                </Button>
              </div>

              <div className="space-y-3 max-h-[260px] overflow-y-auto pr-1">
                {formVariants.map((variant, index) => (
                  <div key={index} className="relative border p-3 rounded-lg bg-zinc-50/50 dark:bg-zinc-900/30 shadow-sm space-y-2.5">
                    {formVariants.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-1 top-1 h-7 w-7 text-zinc-400 hover:text-red-600"
                        onClick={() => handleRemoveVariantField(index)}
                        title="Remover Variação"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}

                    <div className="text-xs font-bold text-muted-foreground uppercase">
                      Variação #{index + 1}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs" htmlFor={`barcode-${index}`}>Código de Barras *</Label>
                        <Input
                          id={`barcode-${index}`}
                          placeholder="Ex: 49427"
                          value={variant.barcode}
                          onChange={(e) => handleVariantFieldChange(index, 'barcode', e.target.value)}
                          required
                          className="h-8 text-xs"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs" htmlFor={`desc-${index}`}>Tamanho / Modelo *</Label>
                        <Input
                          id={`desc-${index}`}
                          placeholder="Ex: P ao GG, G1 ao G3"
                          value={variant.description}
                          onChange={(e) => handleVariantFieldChange(index, 'description', e.target.value)}
                          required
                          className="h-8 text-xs"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs" htmlFor={`price-${index}`}>Preço Venda (R$) *</Label>
                        <Input
                          id={`price-${index}`}
                          type="number"
                          step="0.01"
                          min="0.01"
                          placeholder="229.00"
                          value={variant.price || ''}
                          onChange={(e) => handleVariantFieldChange(index, 'price', e.target.value)}
                          required
                          className="h-8 text-xs"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs" htmlFor={`cost-${index}`}>Custo (R$)</Label>
                        <Input
                          id={`cost-${index}`}
                          type="number"
                          step="0.01"
                          placeholder="150.00"
                          value={variant.cost ?? ''}
                          onChange={(e) => handleVariantFieldChange(index, 'cost', e.target.value)}
                          className="h-8 text-xs"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs" htmlFor={`qty-${index}`}>Qtd Estoque *</Label>
                        <Input
                          id={`qty-${index}`}
                          type="number"
                          min="0"
                          placeholder="10"
                          value={variant.quantity ?? ''}
                          onChange={(e) => handleVariantFieldChange(index, 'quantity', e.target.value)}
                          required
                          className="h-8 text-xs"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
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
        <DialogContent className="sm:max-w-sm w-full border">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Excluir Produto
            </DialogTitle>
            <DialogDescription className="pt-2">
              Tem certeza que deseja excluir o produto{' '}
              <strong className="text-zinc-900 dark:text-zinc-50">"{selectedProduct?.name}"</strong>?
              Esta ação excluirá permanentemente o produto e **todas as suas variações** associadas.
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

      {/* Modal de Resolução de Colisão do Scanner */}
      <Dialog open={isCollisionOpen} onOpenChange={setIsCollisionOpen}>
        <DialogContent className="sm:max-w-md w-full border">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2 text-amber-500">
              <Barcode className="h-5 w-5" />
              Código Duplicado Detectado
            </DialogTitle>
            <DialogDescription className="pt-1">
              O código de barras escaneado corresponde a múltiplas variações registradas no estoque. Selecione qual deseja gerenciar:
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-4 max-h-[300px] overflow-y-auto pr-1">
            {collisionVariants.map((variant) => (
              <Button
                key={variant.id}
                variant="outline"
                className="flex flex-col items-start gap-1 p-4 h-auto text-left justify-start hover:border-primary/50 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 group transition-all"
                onClick={() => {
                  setIsCollisionOpen(false);
                  const product = products.find((p) => p.id === variant.productId);
                  if (product) {
                    handleEditClick(product);
                  }
                }}
              >
                <div className="flex justify-between items-center w-full">
                  <span className="font-bold text-sm text-zinc-900 dark:text-zinc-50 group-hover:text-primary transition-colors">
                    {variant.product?.name || 'Produto'}
                  </span>
                  <span className="text-xs font-mono bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded text-muted-foreground font-semibold">
                    {variant.barcode}
                  </span>
                </div>
                <div className="flex justify-between items-center w-full text-xs text-muted-foreground mt-0.5">
                  <span>Modelo: <strong>{variant.description}</strong></span>
                  <span className="font-bold text-primary">
                    {variant.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </span>
                </div>
              </Button>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCollisionOpen(false)} className="w-full sm:w-auto">
              Cancelar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
