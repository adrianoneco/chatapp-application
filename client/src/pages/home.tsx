import { MessageSquare, Zap, Shield, Users } from "lucide-react";

export default function HomePage() {
  return (
    <div className="flex flex-col items-center justify-center h-full p-8">
      <div className="max-w-2xl text-center space-y-6">
        <div className="flex justify-center mb-6">
          <div className="relative">
            <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full"></div>
            <MessageSquare className="relative w-24 h-24 text-primary" />
          </div>
        </div>

        <h1 className="text-4xl font-bold text-foreground" data-testid="text-welcome-title">
          Bem-vindo ao ChatWave
        </h1>

        <p className="text-lg text-muted-foreground" data-testid="text-welcome-description">
          Uma plataforma moderna de mensagens com design incrível e recursos poderosos.
          Comece explorando o menu lateral para descobrir todas as funcionalidades.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
          <div className="flex flex-col items-center p-6 rounded-lg bg-card border border-card-border space-y-3">
            <Zap className="w-12 h-12 text-primary" />
            <h3 className="text-lg font-semibold">Rápido</h3>
            <p className="text-sm text-muted-foreground text-center">
              Mensagens instantâneas com baixa latência
            </p>
          </div>

          <div className="flex flex-col items-center p-6 rounded-lg bg-card border border-card-border space-y-3">
            <Shield className="w-12 h-12 text-primary" />
            <h3 className="text-lg font-semibold">Seguro</h3>
            <p className="text-sm text-muted-foreground text-center">
              Suas conversas protegidas com criptografia
            </p>
          </div>

          <div className="flex flex-col items-center p-6 rounded-lg bg-card border border-card-border space-y-3">
            <Users className="w-12 h-12 text-primary" />
            <h3 className="text-lg font-semibold">Conectado</h3>
            <p className="text-sm text-muted-foreground text-center">
              Conecte-se com amigos e comunidades
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
