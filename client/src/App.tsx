import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider, useQuery } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppHeader } from "@/components/app-header";
import { AppSidebar } from "@/components/app-sidebar";
import LoginPage from "@/pages/login";
import HomePage from "@/pages/home";
import NotFound from "@/pages/not-found";
import type { User } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

function AuthenticatedLayout({ user }: { user: User }) {
  const handleLogout = async () => {
    await apiRequest("POST", "/api/auth/logout", {});
    queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
  };

  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  } as React.CSSProperties;

  return (
    <SidebarProvider style={style}>
      <div className="flex h-screen w-full">
        <AppSidebar />
        <div className="flex flex-col flex-1 overflow-hidden">
          <AppHeader user={user} onLogout={handleLogout} />
          <main className="flex-1 overflow-auto">
            <Switch>
              <Route path="/" component={HomePage} />
              <Route path="/messages" component={() => <div className="p-8">Mensagens em breve...</div>} />
              <Route path="/channels" component={() => <div className="p-8">Canais em breve...</div>} />
              <Route path="/friends" component={() => <div className="p-8">Amigos em breve...</div>} />
              <Route path="/settings" component={() => <div className="p-8">Configurações em breve...</div>} />
              <Route component={NotFound} />
            </Switch>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

function Router() {
  const { data: user, isLoading } = useQuery<User>({
    queryKey: ["/api/auth/me"],
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-pulse text-muted-foreground">Carregando...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <LoginPage
        onLoginSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
        }}
      />
    );
  }

  return <AuthenticatedLayout user={user} />;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Router />
          <Toaster />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
