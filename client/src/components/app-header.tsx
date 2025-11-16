import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
    <header className="sticky top-0 z-50 w-full h-16 border-b border-white/10 backdrop-blur-xl bg-gradient-to-r from-blue-900 via-purple-900 to-purple-800 bg-opacity-90">
      <div className="flex items-center justify-between h-full px-6">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-white/10 backdrop-blur-md border border-white/20">
            <svg
              className="w-6 h-6 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
              />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-white">ChatWave</h1>
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
                    <AvatarFallback className="bg-white/20 text-white text-sm font-semibold">
                      {userInitials}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" data-testid="menu-user-dropdown">
                <div className="flex items-center gap-2 p-2">
                  <Avatar className="h-8 w-8">
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
