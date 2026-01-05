import { Logout, ExpandMore, Settings, Loop } from "@mui/icons-material";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import { useState } from "react";

export function Header() {
  const navigate = useNavigate();
  const { user, profile, signOut, isAdmin } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    await signOut();
    navigate("/login");
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

  const displayName = profile?.full_name || user?.email || "Usuário";
  const displayEmail = user?.email || "";
  const initials = getInitials(profile?.full_name);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-card/80 backdrop-blur-sm">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <Link to="/dashboard" className="flex items-center gap-3">
          <img 
            src="/flexi-logo.png" 
            alt="Flexibase" 
            className="h-10 object-contain"
          />
        </Link>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors hover:bg-accent">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="hidden text-left sm:block">
              <p className="text-sm font-medium text-foreground">
                {displayName}
              </p>
            </div>
            <ExpandMore className="h-4 w-4 text-muted-foreground" />
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
            
            {isAdmin && (
              <>
                <DropdownMenuItem onClick={() => navigate("/admin")}>
                  <Settings className="mr-2 h-4 w-4" />
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
    </header>
  );
}
