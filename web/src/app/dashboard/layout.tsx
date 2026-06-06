'use client';

import React from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import {
  LayoutDashboard,
  Package,
  Users,
  LogOut,
  Sun,
  Moon,
  Loader2,
  Menu,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const pathname = usePathname();
  const router = useRouter();

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="text-sm text-muted-foreground">Carregando painel...</span>
        </div>
      </div>
    );
  }

  // Se por acaso passar pelas verificações de login mas o user ainda for null, evita quebras
  if (!user) return null;

  const isAdmin = user.role === 'ADMIN';

  const menuItems = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Estoque', href: '/dashboard/products', icon: Package },
    ...(isAdmin
      ? [{ name: 'Funcionários', href: '/dashboard/employees', icon: Users }]
      : []),
  ];

  return (
    <div className="flex-1 flex min-h-screen bg-zinc-50 dark:bg-zinc-950">
      {/* Sidebar Desktop */}
      <aside className="hidden md:flex w-64 flex-col border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-50">
        {/* Header da Sidebar */}
        <div className="h-16 flex items-center px-6 border-b border-zinc-200 dark:border-zinc-800 gap-2">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-black text-lg">
            S
          </div>
          <span className="font-bold text-lg tracking-tight">Saiko System</span>
        </div>

        {/* Links de navegação */}
        <nav className="flex-1 p-4 space-y-1">
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50'
                    : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50 hover:bg-zinc-50 dark:hover:bg-zinc-800/50'
                }`}
              >
                <Icon className="h-5 w-5" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Footer da Sidebar */}
        <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 flex flex-col gap-3">
          {/* Informações do Usuário */}
          <div className="flex items-center justify-between px-2">
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-semibold truncate">{user.name}</span>
              <span className="text-xs text-muted-foreground truncate uppercase font-bold tracking-wider">
                {user.role === 'ADMIN' ? 'Administrador' : 'Operador'}
              </span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-zinc-400 hover:text-red-500"
              onClick={logout}
              title="Sair"
            >
              <LogOut className="h-4.5 w-4.5" />
            </Button>
          </div>

          <div className="flex items-center justify-between px-2 pt-2 border-t border-zinc-100 dark:border-zinc-800/50">
            <span className="text-xs text-muted-foreground">Tema do sistema</span>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 rounded-full"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            >
              <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            </Button>
          </div>
        </div>
      </aside>

      {/* Conteúdo Principal */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Navbar Mobile */}
        <header className="md:hidden h-16 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-black text-lg">
              S
            </div>
            <span className="font-bold text-lg tracking-tight">Saiko System</span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9 rounded-full"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            >
              <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger className="h-9 w-9 flex items-center justify-center rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 cursor-pointer outline-none">
                <Menu className="h-5 w-5" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Navegação</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {menuItems.map((item) => (
                  <DropdownMenuItem
                    key={item.href}
                    onClick={() => router.push(item.href)}
                    className="w-full flex items-center gap-2 cursor-pointer"
                  >
                    <item.icon className="h-4 w-4" />
                    {item.name}
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuLabel className="flex flex-col">
                  <span className="text-sm font-semibold truncate">{user.name}</span>
                  <span className="text-xs text-muted-foreground font-normal">
                    {user.role === 'ADMIN' ? 'Administrador' : 'Operador'}
                  </span>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-red-600 focus:text-red-600" onClick={logout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Sair do sistema
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Área Principal de Scroll */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}
