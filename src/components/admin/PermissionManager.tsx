import { useEffect, useState } from "react";
import { Loop, Check, Close } from "@mui/icons-material";
import * as MuiIcons from "@mui/icons-material";
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

// Helper para pegar o ícone dinamicamente do Material UI
function getIcon(iconName: string) {
  const mapping: Record<string, string> = {
    Truck: "LocalShipping",
    BarChart3: "BarChart",
    Target: "TrackChanges",
    Users: "People",
    Settings: "Settings",
    LayoutGrid: "GridView",
    Shield: "Security",
  };
  
  const muiName = mapping[iconName] || iconName;
  const IconComponent = (MuiIcons as any)[muiName];
  return IconComponent || MuiIcons.Extension;
}

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

  const getPermission = (userId: string, appId: string): AccessLevel => {
    const perm = permissions.find(
      (p) => p.user_id === userId && p.application_id === appId
    );
    return perm?.access_level || "locked";
  };

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
          prev.filter((p) => !(p.user_id === userId && p.application_id === appId))
        );
      } else {
        const updated = await upsertPermission(userId, appId, newLevel);
        setPermissions((prev) => {
          const existing = prev.find(
            (p) => p.user_id === userId && p.application_id === appId
          );
          if (existing) {
            return prev.map((p) =>
              p.user_id === userId && p.application_id === appId ? updated : p
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

  const getInitials = (name: string): string => {
    const parts = name.split(" ");
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
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
        {users.length === 0 || apps.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {users.length === 0
              ? "Nenhum usuário cadastrado."
              : "Nenhuma aplicação cadastrada."}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="text-left p-3 border-b font-medium text-muted-foreground sticky left-0 bg-background">
                    Usuário
                  </th>
                  {apps.map((app) => {
                    const Icon = getIcon(app.icon);
                    return (
                      <th
                        key={app.id}
                        className="p-3 border-b text-center min-w-[140px]"
                      >
                        <div className="flex flex-col items-center gap-1">
                          <div
                            className="flex h-8 w-8 items-center justify-center rounded-lg"
                            style={{ backgroundColor: `${app.color}20` }}
                          >
                            <Icon className="h-4 w-4" style={{ color: app.color }} />
                          </div>
                          <span className="text-xs font-medium">{app.name}</span>
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-muted/50">
                    <td className="p-3 border-b sticky left-0 bg-background">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                            {getInitials(user.full_name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-sm">{user.full_name}</p>
                          {user.role === "admin" && (
                            <span className="text-xs text-primary">Admin</span>
                          )}
                        </div>
                      </div>
                    </td>
                    {apps.map((app) => {
                      const cellKey = `${user.id}-${app.id}`;
                      const currentLevel = getPermission(user.id, app.id);
                      const isUpdating = updatingCell === cellKey;

                      return (
                        <td key={app.id} className="p-2 border-b text-center">
                          {isUpdating ? (
                            <div className="flex justify-center">
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
                              <SelectTrigger className="w-[130px] h-8 text-xs mx-auto">
                                <SelectValue>
                                  <PermissionBadge level={currentLevel} />
                                </SelectValue>
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="editor">
                                  <div className="flex items-center gap-2">
                                    <Check className="h-3 w-3 text-green-500" />
                                    <span>Editor</span>
                                  </div>
                                </SelectItem>
                                <SelectItem value="viewer">
                                  <div className="flex items-center gap-2">
                                    <Check className="h-3 w-3 text-blue-500" />
                                    <span>Visualizador</span>
                                  </div>
                                </SelectItem>
                                <SelectItem value="locked">
                                  <div className="flex items-center gap-2">
                                    <Close className="h-3 w-3 text-red-500" />
                                    <span>Bloqueado</span>
                                  </div>
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

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

