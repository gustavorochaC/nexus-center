import { Logout, ExpandMore, Settings, Loop, AdminPanelSettings } from "@mui/icons-material";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/AuthContext";
import { useUserSettings } from "@/contexts/UserSettingsContext";
import { useSettingsModal } from "@/contexts/SettingsModalContext";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

export function Header() {
  const navigate = useNavigate();
  const { user, profile, signOut, isAdmin } = useAuth();
  const { settings } = useUserSettings();
  const { openSettings, isOpen } = useSettingsModal();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await signOut();
      navigate("/login", { replace: true });
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  // Gerar iniciais do nome
  const getInitials = (name: string | undefined | null): string => {
    if (!name) return "U";
    const parts = name.split(" ");
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  // Usar nome das configurações se disponível, senão usar perfil/email
  const displayName = settings.displayName || profile?.full_name || user?.email || "Usuário";
  const displayEmail = user?.email || "";
  const initials = getInitials(settings.displayName || profile?.full_name);

  // Se não tem usuário, não renderizar o menu
  if (!user) {
    return null;
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 pointer-events-none">
      {/* Container que espelha o Dashboard */}
      <div className="container mx-auto px-4 max-w-7xl relative w-full">
        {/* User Menu - Alinhado com o container do Dashboard */}
        <div className={`absolute top-8 right-4 z-50 pointer-events-auto transition-opacity duration-200 ${
          isOpen ? 'opacity-50' : ''
        }`}>
        <DropdownMenu>
          <DropdownMenuTrigger className="group flex items-center gap-3 rounded-full border border-border/50 bg-background/50 px-3 py-2 transition-all duration-200 hover:bg-accent/50 hover:border-border focus:outline-none focus:ring-2 focus:ring-primary/20">
            <Avatar className="h-8 w-8 ring-2 ring-background">
              {(settings.avatarUrl || profile?.avatar_url) && (
                <AvatarImage src={settings.avatarUrl || profile?.avatar_url || ''} alt={displayName} />
              )}
              <AvatarFallback className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground text-sm font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="hidden text-left sm:block">
              <p className="text-sm font-medium text-foreground">
                {displayName}
              </p>
            </div>
            <ExpandMore className="h-4 w-4 text-muted-foreground transition-transform duration-200 group-hover:rotate-180" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col">
                <span>{displayName}</span>
                <span className="text-xs font-normal text-muted-foreground">
                  {displayEmail}
                </span>
                {isAdmin && (
                  <span className="mt-1 text-xs font-medium text-primary">
                    Administrador
                  </span>
                )}
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            
            <DropdownMenuItem onClick={openSettings}>
              <Settings className="mr-2 h-4 w-4" />
              Configurações
            </DropdownMenuItem>
            
            {isAdmin && (
              <>
                <DropdownMenuItem onClick={() => navigate("/admin")}>
                  <AdminPanelSettings className="mr-2 h-4 w-4" />
                  Painel Admin
                </DropdownMenuItem>
                <DropdownMenuSeparator />
              </>
            )}
            
            <DropdownMenuItem 
              onClick={handleLogout} 
              className="text-destructive"
              disabled={isLoggingOut}
            >
              {isLoggingOut ? (
                <Loop className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Logout className="mr-2 h-4 w-4" />
              )}
              {isLoggingOut ? "Saindo..." : "Sair"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
