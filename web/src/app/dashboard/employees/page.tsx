'use client';

import React, { useState } from 'react';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Search,
  Plus,
  Edit,
  Trash2,
  Users,
  ShieldAlert,
  Loader2,
  Lock,
  Mail,
  UserCheck,
} from 'lucide-react';

interface Employee {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'OPERATOR';
  isActive: boolean;
  createdAt: string;
}

export default function EmployeesPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const isAdmin = user?.role === 'ADMIN';

  // Estados de Busca e Modais
  const [search, setSearch] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);

  // Estados dos Campos do Formulário
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'ADMIN' | 'OPERATOR'>('OPERATOR');
  const [isActive, setIsActive] = useState<boolean>(true);

  // Se o usuário logado não for ADMIN, bloqueia o acesso visualmente
  if (!isAdmin) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-20 text-center gap-4">
        <div className="h-16 w-16 rounded-full bg-red-100 dark:bg-red-950/35 flex items-center justify-center text-red-600 dark:text-red-500 animate-bounce">
          <ShieldAlert className="h-8 w-8" />
        </div>
        <div className="space-y-2 max-w-sm">
          <h3 className="text-xl font-bold tracking-tight">Acesso Negado</h3>
          <p className="text-sm text-muted-foreground">
            Apenas administradores do sistema têm permissão para acessar a tela de gerenciamento de funcionários.
          </p>
        </div>
      </div>
    );
  }

  // 1. Query: Listar funcionários
  const { data: employees = [], isLoading } = useQuery<Employee[]>({
    queryKey: ['employees'],
    queryFn: async () => {
      const response = await api.get('/employees');
      return response.data;
    },
  });

  // 2. Mutation: Criar funcionário
  const createMutation = useMutation({
    mutationFn: async (newEmployee: any) => {
      const response = await api.post('/employees', newEmployee);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      toast.success('Funcionário cadastrado com sucesso!');
      closeForm();
    },
    onError: (error: any) => {
      const msg = error.response?.data?.message || 'Erro ao cadastrar funcionário.';
      toast.error(msg);
    },
  });

  // 3. Mutation: Editar funcionário
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await api.put(`/employees/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      toast.success('Funcionário atualizado com sucesso!');
      closeForm();
    },
    onError: (error: any) => {
      const msg = error.response?.data?.message || 'Erro ao atualizar funcionário.';
      toast.error(msg);
    },
  });

  // 4. Mutation: Deletar funcionário
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await api.delete(`/employees/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      toast.success('Funcionário excluído com sucesso!');
      setIsDeleteOpen(false);
      setSelectedEmployee(null);
    },
    onError: (error: any) => {
      const msg = error.response?.data?.message || 'Erro ao excluir funcionário.';
      toast.error(msg);
    },
  });

  // Funções auxiliares
  const handleCreateClick = () => {
    setSelectedEmployee(null);
    setName('');
    setEmail('');
    setPassword('');
    setRole('OPERATOR');
    setIsActive(true);
    setIsFormOpen(true);
  };

  const handleEditClick = (emp: Employee) => {
    setSelectedEmployee(emp);
    setName(emp.name);
    setEmail(emp.email);
    setPassword(''); // A senha não é carregada por motivos de segurança
    setRole(emp.role);
    setIsActive(emp.isActive);
    setIsFormOpen(true);
  };

  const handleDeleteClick = (emp: Employee) => {
    setSelectedEmployee(emp);
    setIsDeleteOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setSelectedEmployee(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !email || (!selectedEmployee && !password)) {
      toast.error('Preencha todos os campos obrigatórios.');
      return;
    }

    const payload: any = {
      name,
      email,
      role,
      isActive,
    };

    // Só envia a senha se for criação ou se o admin optou por alterar a senha do usuário existente
    if (password) {
      payload.password = password;
    }

    if (selectedEmployee) {
      updateMutation.mutate({ id: selectedEmployee.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  // Filtragem local dos funcionários na tabela
  const filteredEmployees = employees.filter(
    (emp) =>
      emp.name.toLowerCase().includes(search.toLowerCase()) ||
      emp.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Funcionários da Loja</h2>
          <p className="text-muted-foreground">
            Cadastre novos colaboradores, altere permissões de acesso ou gerencie o status das contas do sistema.
          </p>
        </div>
        <Button onClick={handleCreateClick} className="font-semibold self-start md:self-auto">
          <Plus className="mr-2 h-4 w-4" />
          Adicionar Funcionário
        </Button>
      </div>

      {/* Busca */}
      <div className="relative w-full md:max-w-sm">
        <Search className="absolute left-3 top-2.5 h-4.5 w-4.5 text-muted-foreground" />
        <Input
          placeholder="Pesquisar por nome ou e-mail..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Tabela de Funcionários */}
      <div className="border rounded-xl bg-card text-card-foreground overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="text-sm text-muted-foreground">Carregando lista de funcionários...</span>
          </div>
        ) : filteredEmployees.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center text-muted-foreground gap-2">
            <Users className="h-12 w-12 stroke-1 text-zinc-300" />
            <p className="text-base font-semibold">Nenhum funcionário encontrado.</p>
            <p className="text-xs">Clique em "Adicionar Funcionário" para criar um novo usuário.</p>
          </div>
        ) : (
          <Table>
            <TableHeader className="bg-zinc-50/75 dark:bg-zinc-950/25">
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>E-mail</TableHead>
                <TableHead>Cargo</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-center w-[120px]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEmployees.map((emp) => {
                const isCurrentUser = user?.id === emp.id;
                return (
                  <TableRow key={emp.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/25">
                    <TableCell className="font-semibold flex items-center gap-2">
                      {emp.name}
                      {isCurrentUser && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-primary/10 text-primary">
                          Você
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{emp.email}</TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${emp.role === 'ADMIN' ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/50 dark:text-indigo-400' : 'bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-300'}`}>
                        {emp.role === 'ADMIN' ? 'Administrador' : 'Operador'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center gap-1.5 text-xs font-semibold ${emp.isActive ? 'text-green-600 dark:text-green-500' : 'text-red-500'}`}>
                        <span className={`h-2 w-2 rounded-full ${emp.isActive ? 'bg-green-500' : 'bg-red-500'}`} />
                        {emp.isActive ? 'Ativo' : 'Inativo'}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
                          onClick={() => handleEditClick(emp)}
                          title="Editar"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-zinc-400 hover:text-red-600"
                          onClick={() => handleDeleteClick(emp)}
                          disabled={isCurrentUser} // Impede o admin logado de se excluir diretamente
                          title={isCurrentUser ? 'Não é possível excluir a si mesmo' : 'Excluir'}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
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
              {selectedEmployee ? 'Editar Funcionário' : 'Adicionar Funcionário'}
            </DialogTitle>
            <DialogDescription>
              {selectedEmployee
                ? 'Modifique os dados do funcionário ou altere o status de ativação.'
                : 'Defina os dados de login e permissões do novo colaborador.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome Completo *</Label>
              <Input
                id="name"
                placeholder="Ex: João da Silva"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">E-mail de Login *</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 h-4.5 w-4.5 text-zinc-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="joao@saiko.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="pl-10"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">
                {selectedEmployee ? 'Nova Senha (deixe em branco para manter)' : 'Senha de Acesso *'}
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-4.5 w-4.5 text-zinc-400" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required={selectedEmployee === null}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="role">Cargo *</Label>
                <Select value={role} onValueChange={(val: any) => setRole(val)}>
                  <SelectTrigger id="role">
                    <SelectValue placeholder="Selecione o cargo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="OPERATOR">Operador / Vendedor</SelectItem>
                    <SelectItem value="ADMIN">Administrador</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {selectedEmployee && (
                <div className="space-y-2">
                  <Label htmlFor="isActive">Status da Conta *</Label>
                  <Select
                    value={isActive ? 'active' : 'inactive'}
                    onValueChange={(val) => setIsActive(val === 'active')}
                  >
                    <SelectTrigger id="isActive">
                      <SelectValue placeholder="Selecione o status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Ativo</SelectItem>
                      <SelectItem value="inactive">Inativo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
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
                Salvar Funcionário
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
              <ShieldAlert className="h-5 w-5" />
              Excluir Funcionário
            </DialogTitle>
            <DialogDescription className="pt-2">
              Tem certeza que deseja excluir o colaborador{' '}
              <strong className="text-zinc-900 dark:text-zinc-50">"{selectedEmployee?.name}"</strong>?
              O acesso desta conta será cancelado definitivamente.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 mt-4">
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              className="font-semibold"
              onClick={() => selectedEmployee && deleteMutation.mutate(selectedEmployee.id)}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirmar Exclusão
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
