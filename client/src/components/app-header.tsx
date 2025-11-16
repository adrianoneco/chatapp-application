import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ThemeToggle } from "@/components/theme-toggle";
import { LogOut, Settings, User as UserIcon } from "lucide-react";
import type { User } from "@shared/schema";

interface AppHeaderProps {
  user: User | null;
  onLogout: () => Promise<void>;
}

export function AppHeader({ user, onLogout }: AppHeaderProps) {
  const userInitials = user?.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "U";

  return (
    <header className="sticky top-0 z-50 w-full h-20 border-b border-white/10 backdrop-blur-xl bg-white/10 dark:bg-gray-900/40 rounded-2xl shadow-2xl">
      <div className="flex items-center justify-between h-full px-8">
        <div className="flex items-center gap-3">
          <svg
            className="w-auto h-12"
            viewBox="0 0 200 50"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle cx="25" cy="25" r="20" className="fill-primary" />
            <path
              d="M15 20 Q25 15, 35 20 L35 30 Q25 35, 15 30 Z"
              className="fill-background"
            />
            <path
              d="M20 25 L30 25 M25 20 L25 30"
              className="stroke-primary"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <text
              x="55"
              y="32"
              className="fill-foreground font-bold"
              fontSize="24"
              fontFamily="system-ui"
            >
              ChatWave
            </text>
          </svg>
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          
          {user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="relative h-9 w-9 rounded-full border-2 border-white/20"
                  data-testid="button-user-menu"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.avatarUrl || undefined} alt={user.name} />
                    <AvatarFallback className="bg-white/20 text-white text-sm font-semibold">
                      {userInitials}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" data-testid="menu-user-dropdown">
                <div className="flex items-center gap-2 p-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.avatarUrl || undefined} alt={user.name} />
                    <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
                      {userInitials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none" data-testid="text-user-name">
                      {user.name}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground" data-testid="text-username">
                      @{user.username}
                    </p>
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem data-testid="menu-item-profile">
                  <UserIcon className="w-4 h-4" />
                  <span>Perfil</span>
                </DropdownMenuItem>
                <DropdownMenuItem data-testid="menu-item-settings">
                  <Settings className="w-4 h-4" />
                  <span>Configurações</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onLogout} data-testid="menu-item-logout">
                  <LogOut className="w-4 h-4" />
                  <span>Sair</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </header>
  );
}
