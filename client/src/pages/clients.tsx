import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AvatarUpload } from "@/components/avatar-upload";
import { Plus, Pencil, Trash2, MessageSquare } from "lucide-react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { User } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

const clientSchema = z.object({
  username: z.string().min(3, "Nome de usuário deve ter no mínimo 3 caracteres"),
  password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres"),
  name: z.string().min(1, "Nome é obrigatório"),
  avatarUrl: z.string().nullable().optional(),
});

type ClientForm = z.infer<typeof clientSchema>;

export default function ClientsPage() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<User | null>(null);
  const [deleteClient, setDeleteClient] = useState<User | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  const { data: clients = [], isLoading } = useQuery<User[]>({
    queryKey: ["/api/users/clients"],
  });

  const { data: channels = [] } = useQuery<any[]>({
    queryKey: ["/api/channels"],
  });

  const form = useForm<ClientForm>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      username: "",
      password: "",
      name: "",
      avatarUrl: null,
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: ClientForm) => {
      return await apiRequest("POST", "/api/users/clients", { ...data, avatarUrl });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users/clients"] });
      toast({
        title: "Contato criado",
        description: "O contato foi criado com sucesso.",
      });
      handleCloseDialog();
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao criar contato",
        description: error.message || "Ocorreu um erro ao criar o contato.",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<ClientForm> }) => {
      const updateData: any = { ...data };
      if (avatarUrl !== null) {
        updateData.avatarUrl = avatarUrl;
      }
      return await apiRequest("PATCH", `/api/users/clients/${id}`, updateData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users/clients"] });
      toast({
        title: "Contato atualizado",
        description: "O contato foi atualizado com sucesso.",
      });
      handleCloseDialog();
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao atualizar contato",
        description: error.message || "Ocorreu um erro ao atualizar o contato.",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/users/clients/${id}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users/clients"] });
      toast({
        title: "Contato deletado",
        description: "O contato foi deletado com sucesso.",
      });
      setDeleteClient(null);
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao deletar contato",
        description: error.message || "Ocorreu um erro ao deletar o contato.",
        variant: "destructive",
      });
    },
  });

  const handleOpenDialog = (client?: User) => {
    if (client) {
      setEditingClient(client);
      setAvatarUrl(client.avatarUrl);
      form.reset({
        username: client.username,
        password: "",
        name: client.name,
        avatarUrl: client.avatarUrl,
      });
    } else {
      setEditingClient(null);
      setAvatarUrl(null);
      form.reset({
        username: "",
        password: "",
        name: "",
        avatarUrl: null,
      });
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingClient(null);
    setAvatarUrl(null);
    form.reset();
  };

  const onSubmit = (data: ClientForm) => {
    if (editingClient) {
      const updateData: Partial<ClientForm> = {
        name: data.name,
      };
      if (data.password) {
        updateData.password = data.password;
      }
      updateMutation.mutate({ id: editingClient.id, data: updateData });
    } else {
      createMutation.mutate(data);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const handleStartConversation = (clientId: string) => {
    const webChannel = channels.find(c => c.type === "web");
    if (!webChannel) {
      toast({
        title: "Erro",
        description: "Canal web não encontrado",
        variant: "destructive",
      });
      return;
    }
    setLocation(`/conversations/${webChannel.id}?clientId=${clientId}`);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-pulse text-muted-foreground">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Gerenciar Contatos</h1>
          <p className="text-muted-foreground mt-1">
            Adicione, edite ou remova contatos/clientes do sistema
          </p>
        </div>
        <Button onClick={() => handleOpenDialog()} data-testid="button-add-client">
          <Plus className="mr-2 h-4 w-4" />
          Novo Contato
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">Avatar</TableHead>
              <TableHead>Nome</TableHead>
              <TableHead>Usuário</TableHead>
              <TableHead className="w-32"></TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {clients.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                  Nenhum contato cadastrado
                </TableCell>
              </TableRow>
            ) : (
              clients.map((client) => (
                <TableRow key={client.id} data-testid={`row-client-${client.id}`}>
                  <TableCell>
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={client.avatarUrl || undefined} alt={client.name} />
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {getInitials(client.name)}
                      </AvatarFallback>
                    </Avatar>
                  </TableCell>
                  <TableCell className="font-medium">{client.name}</TableCell>
                  <TableCell className="text-muted-foreground">@{client.username}</TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleStartConversation(client.id)}
                      data-testid={`button-start-conversation-${client.id}`}
                    >
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Iniciar Conversa
                    </Button>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenDialog(client)}
                        data-testid={`button-edit-client-${client.id}`}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDeleteClient(client)}
                        data-testid={`button-delete-client-${client.id}`}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]" data-testid="dialog-client-form">
          <DialogHeader>
            <DialogTitle>
              {editingClient ? "Editar Contato" : "Novo Contato"}
            </DialogTitle>
            <DialogDescription>
              {editingClient
                ? "Atualize as informações do contato"
                : "Preencha os dados para criar um novo contato"}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="flex justify-center">
              <AvatarUpload
                currentAvatar={avatarUrl}
                onAvatarChange={setAvatarUrl}
                userName={form.watch("name") || "Novo"}
              />
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome Completo</Label>
                <Input
                  id="name"
                  {...form.register("name")}
                  placeholder="Maria Santos"
                  data-testid="input-client-name"
                />
                {form.formState.errors.name && (
                  <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="username">Nome de Usuário</Label>
                <Input
                  id="username"
                  {...form.register("username")}
                  placeholder="mariasantos"
                  disabled={!!editingClient}
                  data-testid="input-client-username"
                />
                {form.formState.errors.username && (
                  <p className="text-sm text-destructive">{form.formState.errors.username.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">
                  {editingClient ? "Nova Senha (deixe em branco para manter)" : "Senha"}
                </Label>
                <Input
                  id="password"
                  type="password"
                  {...form.register("password")}
                  placeholder={editingClient ? "••••••••" : "Senha segura"}
                  data-testid="input-client-password"
                />
                {form.formState.errors.password && (
                  <p className="text-sm text-destructive">{form.formState.errors.password.message}</p>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleCloseDialog}
                disabled={createMutation.isPending || updateMutation.isPending}
                data-testid="button-cancel-client"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
                data-testid="button-save-client"
              >
                {createMutation.isPending || updateMutation.isPending ? "Salvando..." : "Salvar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteClient} onOpenChange={() => setDeleteClient(null)}>
        <AlertDialogContent data-testid="dialog-delete-client">
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja deletar o contato <strong>{deleteClient?.name}</strong>?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => setDeleteClient(null)}
              disabled={deleteMutation.isPending}
              data-testid="button-cancel-delete"
            >
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteClient && deleteMutation.mutate(deleteClient.id)}
              disabled={deleteMutation.isPending}
              className="bg-destructive hover:bg-destructive/90"
              data-testid="button-confirm-delete"
            >
              {deleteMutation.isPending ? "Deletando..." : "Deletar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
