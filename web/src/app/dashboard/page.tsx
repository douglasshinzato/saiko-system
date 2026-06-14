'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, AlertTriangle, BadgeAlert, Layers, ExternalLink, ArrowUpRight, Users } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';

interface ProductVariant {
  id: string;
  productId: string;
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
  variants: ProductVariant[];
}

export default function DashboardPage() {
  const { user } = useAuth();

  // Buscar todos os produtos do backend
  const { data: products = [], isLoading } = useQuery<Product[]>({
    queryKey: ['products'],
    queryFn: async () => {
      const response = await api.get('/products');
      return response.data;
    },
  });

  const allVariants = products.flatMap((p) => p.variants);
  const totalProducts = allVariants.length;
  const totalStockItems = allVariants.reduce((acc, v) => acc + v.quantity, 0);

  // Alerta de estoque baixo (menor ou igual a 5 unidades)
  const lowStockVariants = allVariants.filter((v) => v.quantity <= 5);
  const totalLowStock = lowStockVariants.length;

  return (
    <div className="space-y-8">
      {/* Mensagem de Boas-Vindas */}
      <div className="flex flex-col gap-1">
        <h2 className="text-3xl font-bold tracking-tight">Olá, {user?.name}!</h2>
        <p className="text-muted-foreground">Bem-vindo ao Saiko System. Aqui está o resumo do seu estoque local hoje.</p>
      </div>

      {/* Cards de Métricas */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Produtos Cadastrados</CardTitle>
            <Layers className="h-4 w-4 text-zinc-400" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-8 w-24 bg-zinc-200 dark:bg-zinc-800 animate-pulse rounded" />
            ) : (
              <div className="text-3xl font-bold">{totalProducts}</div>
            )}
            <p className="text-xs text-muted-foreground mt-1">Total de variações de itens no catálogo</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Itens em Estoque</CardTitle>
            <Package className="h-4 w-4 text-zinc-400" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-8 w-24 bg-zinc-200 dark:bg-zinc-800 animate-pulse rounded" />
            ) : (
              <div className="text-3xl font-bold">{totalStockItems}</div>
            )}
            <p className="text-xs text-muted-foreground mt-1">Soma de todas as unidades físicas disponíveis</p>
          </CardContent>
        </Card>

        <Card className={totalLowStock > 0 ? 'ring-2 ring-amber-500/20 dark:ring-amber-500/10' : ''}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alertas de Estoque Baixo</CardTitle>
            <AlertTriangle className={`h-4 w-4 ${totalLowStock > 0 ? 'text-amber-500 animate-pulse' : 'text-zinc-400'}`} />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-8 w-24 bg-zinc-200 dark:bg-zinc-800 animate-pulse rounded" />
            ) : (
              <div className={`text-3xl font-bold ${totalLowStock > 0 ? 'text-amber-500' : ''}`}>{totalLowStock}</div>
            )}
            <p className="text-xs text-muted-foreground mt-1">Produtos com quantidade menor ou igual a 5 un.</p>
          </CardContent>
        </Card>
      </div>

      {/* Grid Secundário: Alertas Críticos e Links Rápidos */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Tabela de Estoque Baixo */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <BadgeAlert className="h-5 w-5 text-amber-500" />
                Estoque Crítico
              </CardTitle>
              <CardDescription>Produtos que necessitam de reposição imediata.</CardDescription>
            </div>
            <Link
              href="/dashboard/products"
              className="text-xs text-primary hover:underline flex items-center gap-1 font-medium"
            >
              Ver estoque completo
              <ExternalLink className="h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                <div className="h-10 bg-zinc-100 dark:bg-zinc-800/50 animate-pulse rounded" />
                <div className="h-10 bg-zinc-100 dark:bg-zinc-800/50 animate-pulse rounded" />
                <div className="h-10 bg-zinc-100 dark:bg-zinc-800/50 animate-pulse rounded" />
              </div>
            ) : lowStockVariants.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
                <Package className="h-10 w-10 mb-2 stroke-1 text-zinc-300" />
                <p className="text-sm font-medium">Nenhum produto com estoque crítico.</p>
                <p className="text-xs">Parabéns! Todos os itens estão bem abastecidos.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-zinc-200 dark:border-zinc-800 text-muted-foreground text-left">
                      <th className="py-2 font-medium">Produto / Variação</th>
                      <th className="py-2 font-medium text-right">Preço</th>
                      <th className="py-2 font-medium text-right">Qtd</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lowStockVariants.slice(0, 5).map((variant) => {
                      const parentProduct = products.find((p) => p.id === variant.productId);
                      const displayName = parentProduct
                        ? `${parentProduct.name} (${variant.description})`
                        : variant.description;

                      return (
                        <tr key={variant.id} className="border-b border-zinc-100 dark:border-zinc-800/50 hover:bg-zinc-50 dark:hover:bg-zinc-800/25">
                          <td className="py-3 pr-2">
                            <div className="font-semibold truncate max-w-[180px] md:max-w-[220px]" title={displayName}>
                              {displayName}
                            </div>
                            <div className="text-xs text-muted-foreground font-mono">{variant.barcode}</div>
                          </td>
                          <td className="py-3 text-right">
                            {variant.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                          </td>
                          <td className="py-3 text-right font-bold text-amber-500">
                            {variant.quantity} un.
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Card de Atalhos Rápidos */}
        <Card className="flex flex-col justify-between">
          <CardHeader>
            <CardTitle className="text-lg font-bold">Atalhos Rápidos</CardTitle>
            <CardDescription>Acesse rapidamente as ferramentas mais comuns do sistema.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 flex-1">
            <Link
              href="/dashboard/products"
              className="flex items-center justify-between p-4 rounded-xl border border-zinc-200/50 dark:border-zinc-800 bg-zinc-50 hover:bg-zinc-100/80 dark:bg-zinc-950 dark:hover:bg-zinc-900/50 transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                  <Package className="h-5 w-5" />
                </div>
                <div className="flex flex-col text-left">
                  <span className="font-bold text-sm">Gerenciar Estoque</span>
                  <span className="text-xs text-muted-foreground">Cadastrar, editar e pesquisar produtos</span>
                </div>
              </div>
              <ArrowUpRight className="h-5 w-5 text-zinc-400 group-hover:text-primary transition-colors" />
            </Link>

            {user?.role === 'ADMIN' && (
              <Link
                href="/dashboard/employees"
                className="flex items-center justify-between p-4 rounded-xl border border-zinc-200/50 dark:border-zinc-800 bg-zinc-50 hover:bg-zinc-100/80 dark:bg-zinc-950 dark:hover:bg-zinc-900/50 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                    <Users className="h-5 w-5" />
                  </div>
                  <div className="flex flex-col text-left">
                    <span className="font-bold text-sm">Gerenciar Funcionários</span>
                    <span className="text-xs text-muted-foreground">Cadastrar novos operadores e alterar permissões</span>
                  </div>
                </div>
                <ArrowUpRight className="h-5 w-5 text-zinc-400 group-hover:text-primary transition-colors" />
              </Link>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
