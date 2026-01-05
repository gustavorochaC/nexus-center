import { useEffect, useState } from "react";
import { Add, Edit, Delete, Loop, PowerSettingsNew, PowerOff } from "@mui/icons-material";
import * as MuiIcons from "@mui/icons-material";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import {
  getAllApplications,
  createApplication,
  updateApplication,
  deleteApplication,
} from "@/services/applications";
import type { Application } from "@/types/database";

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
    Image: "Image",
    QrCode: "QrCode",
    FileSearch: "FindInPage",
    Car: "DirectionsCar",
    Box: "Inventory2",
    Database: "Storage",
    FileText: "Description",
    Calendar: "CalendarToday",
    Mail: "Mail",
    Phone: "Phone",
    Map: "Map",
    ShoppingCart: "ShoppingCart",
    CreditCard: "CreditCard",
    Package: "Inventory",
    Building: "Business",
    Home: "Home",
  };
  
  const muiName = mapping[iconName] || iconName;
  const IconComponent = (MuiIcons as any)[muiName];
  return IconComponent || MuiIcons.Extension;
}

// Lista de ícones disponíveis
const availableIcons = [
  "Image", "QrCode", "BarChart3", "FileSearch", "Car", "Box", "Database",
  "Users", "Settings", "FileText", "Calendar", "Mail", "Phone", "Map",
  "ShoppingCart", "CreditCard", "Package", "Truck", "Building", "Home"
];

interface ApplicationFormData {
  name: string;
  description: string;
  icon: string;
  color: string;
  port: number;
  base_url: string;
  is_active: boolean;
  display_order: number;
}

const initialFormData: ApplicationFormData = {
  name: "",
  description: "",
  icon: "Box",
  color: "#6366f1",
  port: 8080,
  base_url: "http://192.168.1.220",
  is_active: true,
  display_order: 0,
};

export function ApplicationManager() {
  const { toast } = useToast();
  const [apps, setApps] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingApp, setEditingApp] = useState<Application | null>(null);
  const [deletingApp, setDeletingApp] = useState<Application | null>(null);
  const [formData, setFormData] = useState<ApplicationFormData>(initialFormData);
  const [isSaving, setIsSaving] = useState(false);

  const fetchApps = async () => {
    try {
      setIsLoading(true);
      const data = await getAllApplications();
      setApps(data);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro ao carregar aplicações",
        description: "Tente novamente mais tarde.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchApps();
  }, []);

  const handleOpenDialog = (app?: Application) => {
    if (app) {
      setEditingApp(app);
      setFormData({
        name: app.name,
        description: app.description || "",
        icon: app.icon,
        color: app.color,
        port: app.port,
        base_url: app.base_url,
        is_active: app.is_active,
        display_order: app.display_order,
      });
    } else {
      setEditingApp(null);
      setFormData({
        ...initialFormData,
        display_order: apps.length + 1,
      });
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingApp(null);
    setFormData(initialFormData);
  };

  const handleSave = async () => {
    if (!formData.name || !formData.port) {
      toast({
        variant: "destructive",
        title: "Campos obrigatórios",
        description: "Nome e porta são obrigatórios.",
      });
      return;
    }

    try {
      setIsSaving(true);

      if (editingApp) {
        await updateApplication(editingApp.id, formData);
        toast({
          title: "Aplicação atualizada",
          description: `${formData.name} foi atualizada com sucesso.`,
        });
      } else {
        await createApplication(formData);
        toast({
          title: "Aplicação criada",
          description: `${formData.name} foi criada com sucesso.`,
        });
      }

      handleCloseDialog();
      fetchApps();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro ao salvar",
        description: "Não foi possível salvar a aplicação. Verifique se a porta já não está em uso.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingApp) return;

    try {
      await deleteApplication(deletingApp.id);
      toast({
        title: "Aplicação removida",
        description: `${deletingApp.name} foi removida com sucesso.`,
      });
      setIsDeleteDialogOpen(false);
      setDeletingApp(null);
      fetchApps();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro ao remover",
        description: "Não foi possível remover a aplicação.",
      });
    }
  };

  const handleToggleActive = async (app: Application) => {
    try {
      await updateApplication(app.id, { is_active: !app.is_active });
      toast({
        title: app.is_active ? "Aplicação desativada" : "Aplicação ativada",
        description: `${app.name} foi ${app.is_active ? "desativada" : "ativada"}.`,
      });
      fetchApps();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível alterar o status.",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loop className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Aplicações</CardTitle>
            <CardDescription>
              Gerencie as aplicações disponíveis no hub ({apps.length} aplicações)
            </CardDescription>
          </div>
          <Button onClick={() => handleOpenDialog()}>
            <Add className="mr-2 h-4 w-4" />
            Nova Aplicação
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {apps.map((app) => {
              const Icon = getIcon(app.icon);
              return (
                <div
                  key={app.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className="flex h-10 w-10 items-center justify-center rounded-lg"
                      style={{ backgroundColor: `${app.color}20` }}
                    >
                      <Icon className="h-5 w-5" style={{ color: app.color }} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{app.name}</span>
                        {!app.is_active && (
                          <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded">
                            Inativo
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Porta: {app.port} • {app.base_url}:{app.port}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleToggleActive(app)}
                      title={app.is_active ? "Desativar" : "Ativar"}
                    >
                      {app.is_active ? (
                        <PowerSettingsNew className="h-4 w-4 text-green-500" />
                      ) : (
                        <PowerOff className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleOpenDialog(app)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setDeletingApp(app);
                        setIsDeleteDialogOpen(true);
                      }}
                    >
                      <Delete className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              );
            })}

            {apps.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                Nenhuma aplicação cadastrada. Clique em "Nova Aplicação" para adicionar.
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Dialog de Criar/Editar */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingApp ? "Editar Aplicação" : "Nova Aplicação"}
            </DialogTitle>
            <DialogDescription>
              {editingApp
                ? "Atualize as informações da aplicação"
                : "Adicione uma nova aplicação ao hub"}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Nome *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Nome da aplicação"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descrição breve da aplicação"
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="port">Porta *</Label>
                <Input
                  id="port"
                  type="number"
                  value={formData.port}
                  onChange={(e) => setFormData({ ...formData, port: parseInt(e.target.value) || 0 })}
                  placeholder="8080"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="base_url">URL Base</Label>
                <Input
                  id="base_url"
                  value={formData.base_url}
                  onChange={(e) => setFormData({ ...formData, base_url: e.target.value })}
                  placeholder="http://192.168.1.220"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Ícone</Label>
                <div className="flex flex-wrap gap-2 p-2 border rounded-lg max-h-24 overflow-y-auto">
                  {availableIcons.map((iconName) => {
                    const IconOption = getIcon(iconName);
                    return (
                      <button
                        key={iconName}
                        type="button"
                        onClick={() => setFormData({ ...formData, icon: iconName })}
                        className={`p-2 rounded hover:bg-accent ${
                          formData.icon === iconName ? "bg-primary text-primary-foreground" : ""
                        }`}
                        title={iconName}
                      >
                        <IconOption className="h-4 w-4" />
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="color">Cor</Label>
                <div className="flex gap-2">
                  <Input
                    id="color"
                    type="color"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="w-12 h-10 p-1 cursor-pointer"
                  />
                  <Input
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    placeholder="#6366f1"
                    className="flex-1"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Ativo</Label>
                <p className="text-sm text-muted-foreground">
                  Aplicação visível para usuários
                </p>
              </div>
              <Switch
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving && <Loop className="mr-2 h-4 w-4 animate-spin" />}
              {editingApp ? "Salvar" : "Criar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Confirmação de Delete */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover aplicação?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. A aplicação "{deletingApp?.name}" será
              removida permanentemente e todas as permissões associadas serão perdidas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

