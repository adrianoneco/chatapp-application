import { Switch, Route, useLocation } from "wouter";
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
import AttendantsPage from "@/pages/attendants";
import ClientsPage from "@/pages/clients";
import ConversationsPage from "@/pages/conversations";
import ChannelsPage from "@/pages/channels";
import type { User } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

function AuthenticatedLayout({ user }: { user: User }) {
  const [, setLocation] = useLocation();
  
  const handleLogout = async () => {
    try {
      await apiRequest("POST", "/api/auth/logout", {});
      queryClient.setQueryData(["/api/auth/me"], null);
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      setLocation("/");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  } as React.CSSProperties;

  return (
    <div className="flex flex-col h-screen w-full">
      <AppHeader user={user} onLogout={handleLogout} />
      <SidebarProvider style={style}>
        <div className="flex flex-1 w-full overflow-hidden">
          <AppSidebar user={user} />
          <main className="flex-1 overflow-auto">
            <Switch>
              <Route path="/" component={HomePage} />
              <Route path="/attendants" component={AttendantsPage} />
              <Route path="/clients" component={ClientsPage} />
              <Route path="/channels" component={ChannelsPage} />
              <Route path="/conversations/:channelId?/:conversationId?" component={ConversationsPage} />
              <Route path="/settings" component={() => <div className="p-8">Configurações em breve...</div>} />
              <Route component={NotFound} />
            </Switch>
          </main>
        </div>
      </SidebarProvider>
    </div>
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
