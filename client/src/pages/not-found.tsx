import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Home, SearchX } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background">
      <div className="text-center space-y-6 p-8">
        <div className="flex justify-center">
          <div className="relative">
            <div className="absolute inset-0 bg-destructive/20 blur-3xl rounded-full"></div>
            <SearchX className="relative w-32 h-32 text-destructive" />
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-9xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent" data-testid="text-404">
            404
          </h1>
          <h2 className="text-2xl font-semibold text-foreground">
            Página não encontrada
          </h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            Desculpe, a página que você está procurando não existe ou foi movida.
          </p>
        </div>

        <Button
          asChild
          size="lg"
          className="rounded-full px-8"
          data-testid="button-go-home"
        >
          <Link href="/">
            <Home className="w-5 h-5" />
            Voltar para o Início
          </Link>
        </Button>
      </div>
    </div>
  );
}
