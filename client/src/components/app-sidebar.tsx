import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Home, MessageSquare, Users, Settings, UserCog, Hash } from "lucide-react";
import { Link, useLocation } from "wouter";
import type { User } from "@shared/schema";

interface MenuItem {
  title: string;
  url: string;
  icon: typeof Home;
  roles?: ("attendant" | "client")[];
}

const menuItems: MenuItem[] = [
  {
    title: "Início",
    url: "/",
    icon: Home,
  },
  {
    title: "Conversas",
    url: "/conversations",
    icon: MessageSquare,
  },
  {
    title: "Atendentes",
    url: "/attendants",
    icon: UserCog,
    roles: ["attendant"],
  },
  {
    title: "Contatos",
    url: "/clients",
    icon: Users,
    roles: ["attendant"],
  },
  {
    title: "Canais",
    url: "/channels",
    icon: Hash,
  },
  {
    title: "Configurações",
    url: "/settings",
    icon: Settings,
  },
];

interface AppSidebarProps {
  user: User;
}

export function AppSidebar({ user }: AppSidebarProps) {
  const [location] = useLocation();

  const filteredMenuItems = menuItems.filter((item) => {
    if (!item.roles) return true;
    return item.roles.includes(user.role);
  });

  return (
    <Sidebar className="border-r border-border/40 bg-sidebar">
      <div className="flex items-center justify-between h-12 px-4 border-b border-border/40">
        <span className="text-sm font-semibold text-sidebar-foreground">Menu</span>
        <SidebarTrigger data-testid="button-sidebar-toggle" className="h-7 w-7" />
      </div>
      <SidebarContent className="pt-4">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {filteredMenuItems.map((item) => {
                const isActive = location === item.url;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      className={`relative h-12 ${
                        isActive
                          ? "bg-sidebar-accent before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:h-8 before:w-1 before:rounded-r-full before:bg-primary"
                          : ""
                      }`}
                      data-testid={`link-${item.title.toLowerCase()}`}
                    >
                      <Link href={item.url} aria-current={isActive ? "page" : undefined}>
                        <item.icon className="w-8 h-8" />
                        <span className="text-base">{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
