import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Home, MessageSquare, Users, Settings, Hash } from "lucide-react";
import { Link, useLocation } from "wouter";

const menuItems = [
  {
    title: "Início",
    url: "/",
    icon: Home,
  },
  {
    title: "Mensagens",
    url: "/messages",
    icon: MessageSquare,
  },
  {
    title: "Canais",
    url: "/channels",
    icon: Hash,
  },
  {
    title: "Amigos",
    url: "/friends",
    icon: Users,
  },
  {
    title: "Configurações",
    url: "/settings",
    icon: Settings,
  },
];

export function AppSidebar() {
  const [location] = useLocation();

  return (
    <Sidebar>
      <SidebarContent className="pt-4">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => {
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
                      <Link href={item.url}>
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
