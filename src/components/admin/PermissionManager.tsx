import { useEffect, useState, useMemo, useCallback } from "react";
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
    QrCode: "QrCode",
    FileSearch: "FindInPage",
  };
  
  const muiName = mapping[iconName] || iconName;
  const IconComponent = (MuiIcons as any)[muiName];
  return IconComponent || MuiIcons.Extension;
}

// Dados mock para demonstração visual
const mockUsers: Profile[] = [
  {
    id: "mock-user-1",
    full_name: "João Silva",
    avatar_url: null,
    role: "user",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "mock-user-2",
    full_name: "Maria Santos",
    avatar_url: null,
    role: "admin",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "mock-user-3",
    full_name: "Carlos Oliveira",
    avatar_url: null,
    role: "user",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

const mockApps: Application[] = [
  {
    id: "mock-app-1",
    name: "SCV",
    description: "Sistema de Controle Veicular",
    icon: "Truck",
    color: "#ef4444",
    port: 8084,
    base_url: "http://192.168.1.220",
    is_active: true,
    display_order: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "mock-app-2",
    name: "SGI",
    description: "Sistema de Gestão de Indicadores",
    icon: "BarChart3",
    color: "#10b981",
    port: 8082,
    base_url: "http://192.168.1.220",
    is_active: true,
    display_order: 2,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "mock-app-3",
    name: "Metas",
    description: "Gestão de metas e objetivos",
    icon: "Target",
    color: "#3b82f6",
    port: 8080,
    base_url: "http://192.168.1.220",
    is_active: true,
    display_order: 3,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "mock-app-4",
    name: "Gerador de QrCode",
    description: "Ferramenta utilitária de QR Codes",
    icon: "QrCode",
    color: "#8b5cf6",
    port: 8081,
    base_url: "http://192.168.1.220",
    is_active: true,
    display_order: 4,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

const mockPermissions: Permission[] = [
  // João Silva - Editor no SCV, Viewer no SGI, Locked nos outros
  { id: "mock-perm-1", user_id: "mock-user-1", application_id: "mock-app-1", access_level: "editor", created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: "mock-perm-2", user_id: "mock-user-1", application_id: "mock-app-2", access_level: "viewer", created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  // Maria Santos (Admin) - Editor em todos
  { id: "mock-perm-3", user_id: "mock-user-2", application_id: "mock-app-1", access_level: "editor", created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: "mock-perm-4", user_id: "mock-user-2", application_id: "mock-app-2", access_level: "editor", created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: "mock-perm-5", user_id: "mock-user-2", application_id: "mock-app-3", access_level: "editor", created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: "mock-perm-6", user_id: "mock-user-2", application_id: "mock-app-4", access_level: "editor", created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  // Carlos Oliveira - Viewer no Metas, Locked nos outros
  { id: "mock-perm-7", user_id: "mock-user-3", application_id: "mock-app-3", access_level: "viewer", created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
];

export function PermissionManager() {
  const { toast } = useToast();
  const [users, setUsers] = useState<Profile[]>([]);
  const [apps, setApps] = useState<Application[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingCell, setUpdatingCell] = useState<string | null>(null);
  const [isUsingMockData, setIsUsingMockData] = useState(false);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [usersData, appsData, permsData] = await Promise.all([
        getAllProfiles(),
        getAllApplications(),
        getAllPermissions(),
      ]);
      
      // Se não houver dados reais, usar dados mock
      if (usersData.length === 0 || appsData.length === 0) {
        setUsers(mockUsers);
        setApps(mockApps);
        setPermissions(mockPermissions);
        setIsUsingMockData(true);
      } else {
        setUsers(usersData);
        setApps(appsData);
        setPermissions(permsData);
        setIsUsingMockData(false);
      }
    } catch (error) {
      // Em caso de erro, usar dados mock
      setUsers(mockUsers);
      setApps(mockApps);
      setPermissions(mockPermissions);
      setIsUsingMockData(true);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getPermission = useCallback((userId: string, appId: string): AccessLevel => {
    const perm = permissions.find(
      (p) => p.user_id === userId && p.application_id === appId
    );
    return perm?.access_level || "locked";
  }, [permissions]);

  // Memoizar apps ordenados para performance
  const sortedApps = useMemo(() => {
    return [...apps].sort((a, b) => a.display_order - b.display_order);
  }, [apps]);

  const handlePermissionChange = async (
    userId: string,
    appId: string,
    newLevel: AccessLevel | "remove"
  ) => {
    // Se estiver usando dados mock, apenas atualizar visualmente
    if (isUsingMockData) {
      const cellKey = `${userId}-${appId}`;
      setUpdatingCell(cellKey);
      
      // Simular delay
      await new Promise(resolve => setTimeout(resolve, 300));
      
      if (newLevel === "remove" || newLevel === "locked") {
        setPermissions((prev) =>
          prev.filter((p) => !(p.user_id === userId && p.application_id === appId))
        );
      } else {
        setPermissions((prev) => {
          const existing = prev.find(
            (p) => p.user_id === userId && p.application_id === appId
          );
          if (existing) {
            return prev.map((p) =>
              p.user_id === userId && p.application_id === appId 
                ? { ...p, access_level: newLevel, updated_at: new Date().toISOString() }
                : p
            );
          }
          return [...prev, {
            id: `mock-perm-${Date.now()}`,
            user_id: userId,
            application_id: appId,
            access_level: newLevel,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }];
        });
      }
      
      setUpdatingCell(null);
      return;
    }

    // Lógica original para dados reais
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
        <div className="flex items-start justify-between">
          <div>
            <CardTitle>Matriz de Permissões</CardTitle>
            <CardDescription>
              Configure quem pode acessar cada aplicação e com qual nível de permissão
            </CardDescription>
          </div>
          {isUsingMockData && (
            <span className="text-xs px-2 py-1 rounded-md bg-muted text-muted-foreground border border-border">
              Dados de exemplo
            </span>
          )}
        </div>
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
                        {getInitials(user.full_name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-medium text-base text-foreground">
                        {user.full_name}
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
                      const Icon = getIcon(app.icon);

                      return (
                        <div
                          key={app.id}
                          className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/20 hover:bg-muted/40 transition-colors duration-200"
                        >
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div
                              className="flex h-10 w-10 items-center justify-center rounded-lg flex-shrink-0"
                              style={{ backgroundColor: `${app.color}20` }}
                            >
                              <Icon className="h-5 w-5" style={{ color: app.color }} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm text-foreground truncate">
                                {app.name}
                              </p>
                              {app.description && (
                                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                                  {app.description}
                                </p>
                              )}
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

