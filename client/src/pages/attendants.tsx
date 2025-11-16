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
import { Plus, Pencil, Trash2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { User } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

const attendantSchema = z.object({
  username: z.string().min(3, "Nome de usuário deve ter no mínimo 3 caracteres"),
  password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres"),
  name: z.string().min(1, "Nome é obrigatório"),
  avatarUrl: z.string().nullable().optional(),
});

type AttendantForm = z.infer<typeof attendantSchema>;

export default function AttendantsPage() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAttendant, setEditingAttendant] = useState<User | null>(null);
  const [deleteAttendant, setDeleteAttendant] = useState<User | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  const { data: attendants = [], isLoading } = useQuery<User[]>({
    queryKey: ["/api/users/attendants"],
  });

  const form = useForm<AttendantForm>({
    resolver: zodResolver(attendantSchema),
    defaultValues: {
      username: "",
      password: "",
      name: "",
      avatarUrl: null,
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: AttendantForm) => {
      return await apiRequest("POST", "/api/users/attendants", { ...data, avatarUrl });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users/attendants"] });
      toast({
        title: "Atendente criado",
        description: "O atendente foi criado com sucesso.",
      });
      handleCloseDialog();
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao criar atendente",
        description: error.message || "Ocorreu um erro ao criar o atendente.",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<AttendantForm> }) => {
      const updateData: any = { ...data };
      if (avatarUrl !== null) {
        updateData.avatarUrl = avatarUrl;
      }
      return await apiRequest("PATCH", `/api/users/attendants/${id}`, updateData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users/attendants"] });
      toast({
        title: "Atendente atualizado",
        description: "O atendente foi atualizado com sucesso.",
      });
      handleCloseDialog();
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao atualizar atendente",
        description: error.message || "Ocorreu um erro ao atualizar o atendente.",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/users/attendants/${id}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users/attendants"] });
      toast({
        title: "Atendente deletado",
        description: "O atendente foi deletado com sucesso.",
      });
      setDeleteAttendant(null);
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao deletar atendente",
        description: error.message || "Ocorreu um erro ao deletar o atendente.",
        variant: "destructive",
      });
    },
  });

  const handleOpenDialog = (attendant?: User) => {
    if (attendant) {
      setEditingAttendant(attendant);
      setAvatarUrl(attendant.avatarUrl);
      form.reset({
        username: attendant.username,
        password: "",
        name: attendant.name,
        avatarUrl: attendant.avatarUrl,
      });
    } else {
      setEditingAttendant(null);
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
    setEditingAttendant(null);
    setAvatarUrl(null);
    form.reset();
  };

  const onSubmit = (data: AttendantForm) => {
    if (editingAttendant) {
      const updateData: Partial<AttendantForm> = {
        name: data.name,
      };
      if (data.password) {
        updateData.password = data.password;
      }
      updateMutation.mutate({ id: editingAttendant.id, data: updateData });
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
          <h1 className="text-3xl font-bold">Gerenciar Atendentes</h1>
          <p className="text-muted-foreground mt-1">
            Adicione, edite ou remova atendentes do sistema
          </p>
        </div>
        <Button onClick={() => handleOpenDialog()} data-testid="button-add-attendant">
          <Plus className="mr-2 h-4 w-4" />
          Novo Atendente
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">Avatar</TableHead>
              <TableHead>Nome</TableHead>
              <TableHead>Usuário</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {attendants.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                  Nenhum atendente cadastrado
                </TableCell>
              </TableRow>
            ) : (
              attendants.map((attendant) => (
                <TableRow key={attendant.id} data-testid={`row-attendant-${attendant.id}`}>
                  <TableCell>
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={attendant.avatarUrl || undefined} alt={attendant.name} />
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {getInitials(attendant.name)}
                      </AvatarFallback>
                    </Avatar>
                  </TableCell>
                  <TableCell className="font-medium">{attendant.name}</TableCell>
                  <TableCell className="text-muted-foreground">@{attendant.username}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenDialog(attendant)}
                        data-testid={`button-edit-attendant-${attendant.id}`}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDeleteAttendant(attendant)}
                        data-testid={`button-delete-attendant-${attendant.id}`}
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
        <DialogContent className="sm:max-w-[500px]" data-testid="dialog-attendant-form">
          <DialogHeader>
            <DialogTitle>
              {editingAttendant ? "Editar Atendente" : "Novo Atendente"}
            </DialogTitle>
            <DialogDescription>
              {editingAttendant
                ? "Atualize as informações do atendente"
                : "Preencha os dados para criar um novo atendente"}
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
                  placeholder="João da Silva"
                  data-testid="input-attendant-name"
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
                  placeholder="joaosilva"
                  disabled={!!editingAttendant}
                  data-testid="input-attendant-username"
                />
                {form.formState.errors.username && (
                  <p className="text-sm text-destructive">{form.formState.errors.username.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">
                  {editingAttendant ? "Nova Senha (deixe em branco para manter)" : "Senha"}
                </Label>
                <Input
                  id="password"
                  type="password"
                  {...form.register("password")}
                  placeholder={editingAttendant ? "••••••••" : "Senha segura"}
                  data-testid="input-attendant-password"
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
                data-testid="button-cancel-attendant"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
                data-testid="button-save-attendant"
              >
                {createMutation.isPending || updateMutation.isPending ? "Salvando..." : "Salvar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteAttendant} onOpenChange={() => setDeleteAttendant(null)}>
        <AlertDialogContent data-testid="dialog-delete-attendant">
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja deletar o atendente <strong>{deleteAttendant?.name}</strong>?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => setDeleteAttendant(null)}
              disabled={deleteMutation.isPending}
              data-testid="button-cancel-delete"
            >
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteAttendant && deleteMutation.mutate(deleteAttendant.id)}
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
