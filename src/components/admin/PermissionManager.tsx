import { useEffect, useState, useMemo, useCallback } from "react";
import { Loop, Check, Close } from "@mui/icons-material";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { getAllProfiles, upsertPermission, removePermission, getAllPermissions } from "@/services/permissions";
import { getAllApplications } from "@/services/applications";
import type { Profile, Application, Permission, AccessLevel } from "@/types/database";

export function PermissionManager() {
  const { toast } = useToast();
  const [users, setUsers] = useState<Profile[]>([]);
  const [apps, setApps] = useState<Application[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingCell, setUpdatingCell] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [usersData, appsData, permsData] = await Promise.all([
        getAllProfiles(),
        getAllApplications(),
        getAllPermissions(),
      ]);
      
      setUsers(usersData);
      setApps(appsData);
      setPermissions(permsData);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro ao carregar dados",
        description: "Tente novamente mais tarde.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getPermission = useCallback((userId: string, appId: string): AccessLevel => {
    const perm = permissions.find(
      (p) => p.user_id === userId && p.app_id === appId
    );
    return perm?.access_level || "locked";
  }, [permissions]);

  // Memoizar apps ordenados para performance
  const sortedApps = useMemo(() => {
    return [...apps].sort((a, b) => a.name.localeCompare(b.name));
  }, [apps]);

  const handlePermissionChange = async (
    userId: string,
    appId: string,
    newLevel: AccessLevel | "remove"
  ) => {
    const cellKey = `${userId}-${appId}`;
    setUpdatingCell(cellKey);

    try {
      if (newLevel === "remove" || newLevel === "locked") {
        await removePermission(userId, appId);
        setPermissions((prev) =>
          prev.filter((p) => !(p.user_id === userId && p.app_id === appId))
        );
      } else {
        const updated = await upsertPermission(userId, appId, newLevel);
        setPermissions((prev) => {
          const existing = prev.find(
            (p) => p.user_id === userId && p.app_id === appId
          );
          if (existing) {
            return prev.map((p) =>
              p.user_id === userId && p.app_id === appId ? updated : p
            );
          }
          return [...prev, updated];
        });
      }

      toast({
        title: "Permissão atualizada",
        description: "A permissão foi alterada com sucesso.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro ao atualizar permissão",
        description: "Não foi possível alterar a permissão.",
      });
    } finally {
      setUpdatingCell(null);
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Matriz de Permissões</CardTitle>
        <CardDescription>
          Configure quem pode acessar cada aplicação e com qual nível de permissão
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {users.map((user) => {
            return (
              <Card
                key={user.id}
                className="rounded-lg border border-border bg-card transition-colors hover:bg-muted/30"
              >
                <CardContent className="p-6">
                  {/* Header do Usuário */}
                  <div className="flex items-center gap-3 mb-6 pb-4 border-b border-border">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-primary text-primary-foreground text-sm font-semibold">
                        {getInitials(user.email)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-medium text-base text-foreground">
                        {user.email}
                      </p>
                      {user.role === "admin" && (
                        <span className="text-xs font-medium text-primary mt-0.5 inline-block">
                          Administrador
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Lista de Apps */}
                  <div className="space-y-3">
                    {sortedApps.map((app) => {
                      const appCellKey = `${user.id}-${app.id}`;
                      const currentLevel = getPermission(user.id, app.id);
                      const isUpdating = updatingCell === appCellKey;

                      return (
                        <div
                          key={app.id}
                          className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/20 hover:bg-muted/40 transition-colors duration-200"
                        >
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm text-foreground truncate">
                                {app.name}
                              </p>
                              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                                {app.category}
                              </p>
                            </div>
                          </div>
                          <div className="flex-shrink-0 ml-4">
                            {isUpdating ? (
                              <div className="flex items-center justify-center min-h-[44px] min-w-[120px]">
                                <Loop className="h-4 w-4 animate-spin text-primary" />
                              </div>
                            ) : (
                              <Select
                                value={currentLevel}
                                onValueChange={(value) =>
                                  handlePermissionChange(
                                    user.id,
                                    app.id,
                                    value as AccessLevel | "remove"
                                  )
                                }
                              >
                                <SelectTrigger className="w-[140px] min-h-[44px] text-sm">
                                  <SelectValue>
                                    <PermissionBadge level={currentLevel} />
                                  </SelectValue>
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="editor">
                                    <div className="flex items-center gap-2">
                                      <Check className="h-4 w-4 text-green-500" />
                                      <span>Editor</span>
                                    </div>
                                  </SelectItem>
                                  <SelectItem value="viewer">
                                    <div className="flex items-center gap-2">
                                      <Check className="h-4 w-4 text-blue-500" />
                                      <span>Visualizador</span>
                                    </div>
                                  </SelectItem>
                                  <SelectItem value="locked">
                                    <div className="flex items-center gap-2">
                                      <Close className="h-4 w-4 text-red-500" />
                                      <span>Bloqueado</span>
                                    </div>
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Legenda */}
        <div className="mt-6 flex flex-wrap gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-green-500" />
            <span>Editor: Acesso total</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-blue-500" />
            <span>Visualizador: Apenas leitura</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-red-500" />
            <span>Bloqueado: Sem acesso</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Componente de badge de permissão
function PermissionBadge({ level }: { level: AccessLevel }) {
  const config = {
    editor: { color: "text-green-600", bg: "bg-green-100", label: "Editor" },
    viewer: { color: "text-blue-600", bg: "bg-blue-100", label: "Visualizador" },
    locked: { color: "text-red-600", bg: "bg-red-100", label: "Bloqueado" },
  };

  const { color, label } = config[level];

  return (
    <span className={`${color} font-medium`}>
      {label}
    </span>
  );
}

