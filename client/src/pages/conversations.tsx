import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Send, MessageSquare, User as UserIcon, Clock } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { User, Conversation, Message } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useParams, useSearch } from "wouter";

const conversationSchema = z.object({
  title: z.string().min(1, "Título é obrigatório").optional(),
  channelId: z.string().min(1, "Selecione um canal"),
  clientId: z.string().min(1, "Selecione um cliente"),
  attendantId: z.string().min(1, "Selecione um atendente"),
});

type ConversationForm = z.infer<typeof conversationSchema>;

export default function ConversationsPage() {
  const { toast } = useToast();
  const params = useParams();
  const searchParams = new URLSearchParams(useSearch());
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [isNewConversationOpen, setIsNewConversationOpen] = useState(false);
  const [messageContent, setMessageContent] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: currentUser } = useQuery<User>({
    queryKey: ["/api/auth/me"],
  });

  const { data: channels = [] } = useQuery<any[]>({
    queryKey: ["/api/channels"],
  });

  const { data: conversations = [] } = useQuery<Conversation[]>({
    queryKey: ["/api/conversations"],
  });

  const { data: clients = [] } = useQuery<User[]>({
    queryKey: ["/api/users/clients"],
    enabled: currentUser?.role === "attendant",
  });

  const { data: attendants = [] } = useQuery<User[]>({
    queryKey: ["/api/users/attendants"],
    enabled: currentUser?.role === "attendant",
  });

  const { data: messages = [] } = useQuery<Message[]>({
    queryKey: ["/api/conversations", selectedConversation?.id, "messages"],
    enabled: !!selectedConversation,
  });

  const { data: users = [] } = useQuery<User[]>({
    queryKey: ["/api/users/all"],
    queryFn: async () => {
      if (currentUser?.role !== "attendant") return [];
      const [clientsData, attendantsData] = await Promise.all([
        fetch("/api/users/clients", { credentials: "include" }).then(r => r.json()),
        fetch("/api/users/attendants", { credentials: "include" }).then(r => r.json()),
      ]);
      return [...clientsData, ...attendantsData];
    },
    enabled: currentUser?.role === "attendant",
  });

  const form = useForm<ConversationForm>({
    resolver: zodResolver(conversationSchema),
    defaultValues: {
      title: "",
      channelId: channels.find(c => c.type === "web")?.id || "",
      clientId: searchParams.get("clientId") || "",
      attendantId: currentUser?.id || "",
    },
  });

  useEffect(() => {
    if (channels.length > 0 && !form.getValues("channelId")) {
      const webChannel = channels.find(c => c.type === "web");
      if (webChannel) {
        form.setValue("channelId", webChannel.id);
      }
    }
    
    const clientIdFromUrl = searchParams.get("clientId");
    if (clientIdFromUrl && !form.getValues("clientId")) {
      form.setValue("clientId", clientIdFromUrl);
      setIsNewConversationOpen(true);
    }
  }, [channels, form, searchParams]);

  const createConversationMutation = useMutation<Conversation, Error, ConversationForm>({
    mutationFn: async (data: ConversationForm) => {
      return await apiRequest("POST", "/api/conversations", data) as Promise<Conversation>;
    },
    onSuccess: (newConversation: Conversation) => {
      queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
      toast({
        title: "Conversa criada",
        description: `Protocolo: ${newConversation.protocol}`,
      });
      setIsNewConversationOpen(false);
      setSelectedConversation(newConversation);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao criar conversa",
        description: error.message || "Ocorreu um erro.",
        variant: "destructive",
      });
    },
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!selectedConversation) throw new Error("Nenhuma conversa selecionada");
      return await apiRequest("POST", `/api/conversations/${selectedConversation.id}/messages`, {
        content,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: ["/api/conversations", selectedConversation?.id, "messages"] 
      });
      queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
      setMessageContent("");
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao enviar mensagem",
        description: error.message || "Ocorreu um erro.",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageContent.trim() || !selectedConversation) return;
    sendMessageMutation.mutate(messageContent);
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getUserById = (userId: string | null) => {
    if (!userId) return null;
    return users.find(u => u.id === userId);
  };

  const conversationUsers = selectedConversation 
    ? {
        client: getUserById(selectedConversation.clientId),
        attendant: getUserById(selectedConversation.attendantId),
      }
    : null;

  return (
    <div className="flex h-full">
      <div className="w-80 border-r border-border flex flex-col">
        <div className="p-4 border-b border-border">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Conversas</h2>
            {currentUser?.role === "attendant" && (
              <Button 
                size="sm" 
                onClick={() => setIsNewConversationOpen(true)}
                data-testid="button-new-conversation"
              >
                <Plus className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        <ScrollArea className="flex-1">
          {conversations.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">
              <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-20" />
              <p className="text-sm">Nenhuma conversa</p>
            </div>
          ) : (
            <div className="p-2">
              {conversations.map((conversation) => {
                const isActive = selectedConversation?.id === conversation.id;
                const otherUser = conversation.clientId === currentUser?.id
                  ? getUserById(conversation.attendantId)
                  : getUserById(conversation.clientId);

                return (
                  <button
                    key={conversation.id}
                    onClick={() => setSelectedConversation(conversation)}
                    className={`w-full p-3 rounded-lg mb-2 text-left transition-colors hover-elevate ${
                      isActive ? "bg-sidebar-accent" : ""
                    }`}
                    data-testid={`conversation-item-${conversation.id}`}
                  >
                    <div className="flex items-start gap-3">
                      <Avatar className="h-10 w-10 flex-shrink-0">
                        <AvatarImage src={otherUser?.avatarUrl || undefined} />
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {otherUser ? getInitials(otherUser.name) : "?"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start gap-2">
                          <p className="font-medium truncate">
                            {conversation.title || otherUser?.name || "Sem título"}
                          </p>
                          <Badge variant="outline" className="text-xs flex-shrink-0">
                            {conversation.protocol}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatDistanceToNow(new Date(conversation.updatedAt), {
                            addSuffix: true,
                            locale: ptBR,
                          })}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </div>

      <div className="flex-1 flex flex-col">
        {selectedConversation ? (
          <>
            <div className="p-4 border-b border-border">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold">
                    {selectedConversation.title || "Conversa"}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Protocolo: {selectedConversation.protocol}
                  </p>
                </div>
                <Badge variant={
                  selectedConversation.status === "open" ? "default" :
                  selectedConversation.status === "waiting" ? "secondary" : "outline"
                }>
                  {selectedConversation.status === "open" ? "Aberta" :
                   selectedConversation.status === "waiting" ? "Aguardando" : "Fechada"}
                </Badge>
              </div>
            </div>

            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {messages.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                    <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-20" />
                    <p>Nenhuma mensagem ainda. Envie a primeira!</p>
                  </div>
                ) : (
                  messages.map((message) => {
                    const isCurrentUser = message.senderId === currentUser?.id;
                    const sender = getUserById(message.senderId);

                    return (
                      <div
                        key={message.id}
                        className={`flex gap-3 ${isCurrentUser ? "flex-row-reverse" : ""}`}
                        data-testid={`message-${message.id}`}
                      >
                        <Avatar className="h-8 w-8 flex-shrink-0">
                          <AvatarImage src={sender?.avatarUrl || undefined} />
                          <AvatarFallback className="bg-primary/10 text-primary text-xs">
                            {sender ? getInitials(sender.name) : "?"}
                          </AvatarFallback>
                        </Avatar>
                        <div className={`flex-1 max-w-md ${isCurrentUser ? "text-right" : ""}`}>
                          <div className={`inline-block p-3 rounded-lg ${
                            isCurrentUser 
                              ? "bg-primary text-primary-foreground" 
                              : "bg-muted"
                          }`}>
                            <p className="text-sm">{message.content}</p>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatDistanceToNow(new Date(message.createdAt), {
                              addSuffix: true,
                              locale: ptBR,
                            })}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            <div className="p-4 border-t border-border">
              <form onSubmit={handleSendMessage} className="flex gap-2">
                <Input
                  value={messageContent}
                  onChange={(e) => setMessageContent(e.target.value)}
                  placeholder="Digite sua mensagem..."
                  disabled={sendMessageMutation.isPending}
                  data-testid="input-message"
                />
                <Button
                  type="submit"
                  disabled={!messageContent.trim() || sendMessageMutation.isPending}
                  data-testid="button-send-message"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <MessageSquare className="h-20 w-20 mx-auto mb-4 opacity-20" />
              <p className="text-lg">Selecione uma conversa</p>
              <p className="text-sm mt-1">ou crie uma nova para começar</p>
            </div>
          </div>
        )}
      </div>

      {selectedConversation && (
        <div className="w-80 border-l border-border p-4">
          <h3 className="font-semibold mb-4">Detalhes da Conversa</h3>
          
          <div className="space-y-4">
            <div>
              <Label className="text-xs text-muted-foreground">Protocolo</Label>
              <p className="font-mono font-semibold">{selectedConversation.protocol}</p>
            </div>

            <div>
              <Label className="text-xs text-muted-foreground">Status</Label>
              <p className="capitalize">{selectedConversation.status === "open" ? "Aberta" :
                 selectedConversation.status === "waiting" ? "Aguardando" : "Fechada"}</p>
            </div>

            <div>
              <Label className="text-xs text-muted-foreground mb-2 block">Cliente</Label>
              {conversationUsers?.client && (
                <div className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={conversationUsers.client.avatarUrl || undefined} />
                    <AvatarFallback className="bg-primary/10 text-primary text-xs">
                      {getInitials(conversationUsers.client.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">{conversationUsers.client.name}</p>
                    <p className="text-xs text-muted-foreground">@{conversationUsers.client.username}</p>
                  </div>
                </div>
              )}
            </div>

            <div>
              <Label className="text-xs text-muted-foreground mb-2 block">Atendente</Label>
              {conversationUsers?.attendant && (
                <div className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={conversationUsers.attendant.avatarUrl || undefined} />
                    <AvatarFallback className="bg-primary/10 text-primary text-xs">
                      {getInitials(conversationUsers.attendant.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">{conversationUsers.attendant.name}</p>
                    <p className="text-xs text-muted-foreground">@{conversationUsers.attendant.username}</p>
                  </div>
                </div>
              )}
            </div>

            <div>
              <Label className="text-xs text-muted-foreground">Criada em</Label>
              <p className="text-sm">
                {formatDistanceToNow(new Date(selectedConversation.createdAt), {
                  addSuffix: true,
                  locale: ptBR,
                })}
              </p>
            </div>
          </div>
        </div>
      )}

      <Dialog open={isNewConversationOpen} onOpenChange={setIsNewConversationOpen}>
        <DialogContent className="sm:max-w-[500px]" data-testid="dialog-new-conversation">
          <DialogHeader>
            <DialogTitle>Nova Conversa</DialogTitle>
            <DialogDescription>
              Crie uma nova conversa. Um protocolo único será gerado automaticamente.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={form.handleSubmit((data) => createConversationMutation.mutate(data))} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Título (opcional)</Label>
              <Input
                id="title"
                {...form.register("title")}
                placeholder="Assunto da conversa"
                data-testid="input-conversation-title"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="clientId">Cliente</Label>
              <Select
                value={form.watch("clientId")}
                onValueChange={(value) => form.setValue("clientId", value)}
              >
                <SelectTrigger data-testid="select-client">
                  <SelectValue placeholder="Selecione um cliente" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name} (@{client.username})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.clientId && (
                <p className="text-sm text-destructive">{form.formState.errors.clientId.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="channelId">Canal</Label>
              <Select
                value={form.watch("channelId")}
                onValueChange={(value) => form.setValue("channelId", value)}
              >
                <SelectTrigger data-testid="select-channel">
                  <SelectValue placeholder="Selecione um canal" />
                </SelectTrigger>
                <SelectContent>
                  {channels.map((channel: any) => (
                    <SelectItem key={channel.id} value={channel.id}>
                      {channel.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.channelId && (
                <p className="text-sm text-destructive">{form.formState.errors.channelId.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="attendantId">Atendente</Label>
              <Select
                value={form.watch("attendantId")}
                onValueChange={(value) => form.setValue("attendantId", value)}
              >
                <SelectTrigger data-testid="select-attendant">
                  <SelectValue placeholder="Selecione um atendente" />
                </SelectTrigger>
                <SelectContent>
                  {attendants.map((attendant) => (
                    <SelectItem key={attendant.id} value={attendant.id}>
                      {attendant.name} (@{attendant.username})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.attendantId && (
                <p className="text-sm text-destructive">{form.formState.errors.attendantId.message}</p>
              )}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsNewConversationOpen(false)}
                disabled={createConversationMutation.isPending}
                data-testid="button-cancel-conversation"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={createConversationMutation.isPending}
                data-testid="button-create-conversation"
              >
                {createConversationMutation.isPending ? "Criando..." : "Criar Conversa"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
