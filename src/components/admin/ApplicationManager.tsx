import { useEffect, useState } from "react";
import { Add, Edit, Delete, Loop } from "@mui/icons-material";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

interface ApplicationFormData {
  name: string;
  url: string;
  category: string;
  is_public: boolean;
}

const initialFormData: ApplicationFormData = {
  name: "",
  url: "",
  category: "Produção",
  is_public: false,
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
        url: app.url,
        category: app.category,
        is_public: app.is_public,
      });
    } else {
      setEditingApp(null);
      setFormData(initialFormData);
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingApp(null);
    setFormData(initialFormData);
  };

  const handleSave = async () => {
    if (!formData.name || !formData.url) {
      toast({
        variant: "destructive",
        title: "Campos obrigatórios",
        description: "Nome e URL são obrigatórios.",
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
        description: "Não foi possível salvar a aplicação.",
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
              return (
                <div
                  key={app.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{app.name}</span>
                        {app.is_public && (
                          <span className="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded">
                            Público
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {app.category} • {app.url}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
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
              <Label htmlFor="url">URL Completa *</Label>
              <Input
                id="url"
                value={formData.url}
                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                placeholder="https://exemplo.com ou http://192.168.1.220:8080"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="category">Categoria</Label>
              <Input
                id="category"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                placeholder="Produção, Desenvolvimento, etc."
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Aplicação Pública</Label>
                <p className="text-sm text-muted-foreground">
                  Visível para todos os usuários sem necessidade de permissão
                </p>
              </div>
              <Switch
                checked={formData.is_public}
                onCheckedChange={(checked) => setFormData({ ...formData, is_public: checked })}
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

