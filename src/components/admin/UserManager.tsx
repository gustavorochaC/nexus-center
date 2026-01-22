import { useEffect, useState } from "react";
import { Loop, Security, GppBad, Person } from "@mui/icons-material";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { getAllProfiles, updateUserRole } from "@/services/permissions";
import { useAuth } from "@/contexts/AuthContext";
import type { Profile } from "@/types/database";

export function UserManager() {
  const { toast } = useToast();
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<Profile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [changingUser, setChangingUser] = useState<Profile | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const data = await getAllProfiles();
      setUsers(data);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro ao carregar usuários",
        description: "Tente novamente mais tarde.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleToggleRole = async () => {
    if (!changingUser) return;

    const newRole = changingUser.role === "admin" ? "user" : "admin";

    try {
      await updateUserRole(changingUser.id, newRole);
      toast({
        title: "Permissão atualizada",
        description: `${changingUser.email} agora é ${newRole === "admin" ? "administrador" : "usuário comum"}.`,
      });
      setIsDialogOpen(false);
      setChangingUser(null);
      fetchUsers();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro ao atualizar permissão",
        description: "Não foi possível alterar a permissão do usuário.",
      });
    }
  };

  const getInitials = (email: string): string => {
    const username = email.split('@')[0];
    if (username.length >= 2) {
      return username.substring(0, 2).toUpperCase();
    }
    return username.substring(0, 1).toUpperCase();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loop className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const admins = users.filter((u) => u.role === "admin");
  const regularUsers = users.filter((u) => u.role === "user");

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Usuários</CardTitle>
          <CardDescription>
            Gerencie os usuários e suas permissões de administrador ({users.length} usuários)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Administradores */}
          {admins.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                <Security className="h-4 w-4" />
                Administradores ({admins.length})
              </h3>
              <div className="space-y-3">
                {admins.map((profile) => (
                  <UserCard
                    key={profile.id}
                    profile={profile}
                    isCurrentUser={profile.id === currentUser?.id}
                    onToggleRole={() => {
                      setChangingUser(profile);
                      setIsDialogOpen(true);
                    }}
                    getInitials={getInitials}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Usuários comuns */}
          {regularUsers.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                <Person className="h-4 w-4" />
                Usuários ({regularUsers.length})
              </h3>
              <div className="space-y-3">
                {regularUsers.map((profile) => (
                  <UserCard
                    key={profile.id}
                    profile={profile}
                    isCurrentUser={profile.id === currentUser?.id}
                    onToggleRole={() => {
                      setChangingUser(profile);
                      setIsDialogOpen(true);
                    }}
                    getInitials={getInitials}
                  />
                ))}
              </div>
            </div>
          )}

          {users.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum usuário cadastrado.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog de Confirmação */}
      <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {changingUser?.role === "admin" 
                ? "Remover privilégios de administrador?" 
                : "Tornar administrador?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {changingUser?.role === "admin"
                ? `${changingUser?.email} perderá acesso ao painel administrativo e não poderá mais gerenciar usuários, aplicações e permissões.`
                : `${changingUser?.email} terá acesso total ao painel administrativo, podendo gerenciar usuários, aplicações e permissões.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleToggleRole}>
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

// Componente de card do usuário
interface UserCardProps {
  profile: Profile;
  isCurrentUser: boolean;
  onToggleRole: () => void;
  getInitials: (email: string) => string;
}

function UserCard({ profile, isCurrentUser, onToggleRole, getInitials }: UserCardProps) {
  return (
    <div className="flex items-center justify-between p-4 border rounded-lg">
      <div className="flex items-center gap-4">
        <Avatar>
          <AvatarFallback className="bg-primary text-primary-foreground">
            {getInitials(profile.email)}
          </AvatarFallback>
        </Avatar>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-medium">{profile.email}</span>
            {isCurrentUser && (
              <Badge variant="outline" className="text-xs">
                Você
              </Badge>
            )}
            {profile.role === "admin" && (
              <Badge variant="default" className="text-xs">
                Admin
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            Desde {new Date(profile.created_at).toLocaleDateString("pt-BR")}
          </p>
        </div>
      </div>
      
      {!isCurrentUser && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggleRole}
          title={profile.role === "admin" ? "Remover admin" : "Tornar admin"}
        >
          {profile.role === "admin" ? (
            <>
              <GppBad className="mr-2 h-4 w-4" />
              Remover Admin
            </>
          ) : (
            <>
              <Security className="mr-2 h-4 w-4" />
              Tornar Admin
            </>
          )}
        </Button>
      )}
    </div>
  );
}

