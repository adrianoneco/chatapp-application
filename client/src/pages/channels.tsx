import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Hash, Globe, MessageCircle, Send } from "lucide-react";
import type { Channel } from "@shared/schema";

export default function ChannelsPage() {
  const { data: channels = [], isLoading } = useQuery<Channel[]>({
    queryKey: ["/api/channels"],
  });

  const getChannelIcon = (type: string) => {
    switch (type) {
      case "web":
        return <Globe className="h-6 w-6" />;
      case "whatsapp":
        return <MessageCircle className="h-6 w-6" />;
      case "telegram":
        return <Send className="h-6 w-6" />;
      default:
        return <Hash className="h-6 w-6" />;
    }
  };

  const getChannelTypeName = (type: string) => {
    switch (type) {
      case "web":
        return "Web";
      case "whatsapp":
        return "WhatsApp";
      case "telegram":
        return "Telegram";
      default:
        return type;
    }
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
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Canais de Comunicação</h1>
        <p className="text-muted-foreground mt-1">
          Gerencie os canais disponíveis para atendimento
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {channels.length === 0 ? (
          <div className="col-span-full text-center py-12 text-muted-foreground">
            <Hash className="h-16 w-16 mx-auto mb-4 opacity-20" />
            <p>Nenhum canal cadastrado</p>
          </div>
        ) : (
          channels.map((channel) => (
            <Card key={channel.id} className="hover-elevate" data-testid={`channel-card-${channel.id}`}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10 text-primary">
                      {getChannelIcon(channel.type)}
                    </div>
                    <div>
                      <CardTitle className="text-lg">{channel.name}</CardTitle>
                      <CardDescription className="text-sm">
                        {getChannelTypeName(channel.type)}
                      </CardDescription>
                    </div>
                  </div>
                  <Badge variant={channel.isActive === "true" ? "default" : "secondary"}>
                    {channel.isActive === "true" ? "Ativo" : "Inativo"}
                  </Badge>
                </div>
              </CardHeader>
              {channel.description && (
                <CardContent>
                  <p className="text-sm text-muted-foreground">{channel.description}</p>
                </CardContent>
              )}
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
