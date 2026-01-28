import { useState, useEffect } from 'react';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    type DragEndEvent,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
    Add,
    Edit,
    Delete,
    DragIndicator,
    Apps,
    Star,
    StarBorder,
} from '@mui/icons-material';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import {
    getAllApplications,
    createApplication,
    updateApplication,
    deleteApplication,
    updateApplicationsOrder,
} from '@/services/applications';
import type { Application } from '@/types/database';

interface SortableAppItemProps {
    app: Application;
    onEdit: (app: Application) => void;
    onDelete: (app: Application) => void;
    onTogglePrimary: (app: Application) => void;
}

function SortableAppItem({ app, onEdit, onDelete, onTogglePrimary }: SortableAppItemProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: app.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    const isPrimary = app.category === 'Primário';

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`flex items-center gap-3 p-4 rounded-xl border transition-all duration-200 cursor-pointer bg-card
                ${isDragging ? 'shadow-lg border-primary/50 bg-accent' : 'hover:bg-accent/50 border-border'}
            `}
        >
            {/* Drag Handle */}
            <button
                {...attributes}
                {...listeners}
                className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground"
            >
                <DragIndicator className="h-5 w-5" />
            </button>

            {/* App Icon */}
            <div
                className="h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: `${app.color || '#3B82F6'}20` }}
            >
                <Apps style={{ color: app.color || '#3B82F6' }} className="h-5 w-5" />
            </div>

            {/* App Info */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <span className="text-foreground font-medium truncate">{app.name}</span>
                    {isPrimary && (
                        <Badge variant="secondary" className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-amber-200 text-xs">
                            Primário
                        </Badge>
                    )}
                    {app.is_public && (
                        <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-emerald-200 text-xs">
                            Público
                        </Badge>
                    )}
                </div>
                <p className="text-muted-foreground text-sm truncate">{app.url}</p>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onTogglePrimary(app)}
                    className="text-muted-foreground hover:text-amber-500"
                    title={isPrimary ? 'Remover destaque' : 'Marcar como primário'}
                >
                    {isPrimary ? <Star className="h-4 w-4 text-amber-500" /> : <StarBorder className="h-4 w-4" />}
                </Button>
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onEdit(app)}
                    className="text-muted-foreground hover:text-primary"
                >
                    <Edit className="h-4 w-4" />
                </Button>
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onDelete(app)}
                    className="text-muted-foreground hover:text-destructive"
                >
                    <Delete className="h-4 w-4" />
                </Button>
            </div>
        </div>
    );
}

interface ApplicationFormData {
    name: string;
    url: string;
    description: string;
    category: string;
    color: string;
    is_public: boolean;
}

const initialFormData: ApplicationFormData = {
    name: '',
    url: '',
    description: '',
    category: 'Secundário',
    color: '#3B82F6',
    is_public: false,
};

export function AppsConfigTab() {
    const { toast } = useToast();
    const [apps, setApps] = useState<Application[]>([]);
    const [loading, setLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [editingApp, setEditingApp] = useState<Application | null>(null);
    const [deletingApp, setDeletingApp] = useState<Application | null>(null);
    const [formData, setFormData] = useState<ApplicationFormData>(initialFormData);
    const [isSaving, setIsSaving] = useState(false);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    useEffect(() => {
        fetchApps();
    }, []);

    const fetchApps = async () => {
        try {
            setLoading(true);
            const data = await getAllApplications();
            // Ordenar por display_order
            const sorted = [...data].sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
            setApps(sorted);
        } catch (error) {
            toast({
                variant: 'destructive',
                title: 'Erro ao carregar aplicativos',
                description: 'Tente novamente mais tarde.',
            });
        } finally {
            setLoading(false);
        }
    };

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            const oldIndex = apps.findIndex((app) => app.id === active.id);
            const newIndex = apps.findIndex((app) => app.id === over.id);

            const newApps = arrayMove(apps, oldIndex, newIndex);
            setApps(newApps);

            // Atualizar ordem no banco
            try {
                const updates = newApps.map((app, index) => ({
                    id: app.id,
                    display_order: index + 1,
                }));
                await updateApplicationsOrder(updates);
                toast({
                    title: 'Ordem atualizada',
                    description: 'A ordem dos aplicativos foi salva.',
                });
            } catch (error) {
                toast({
                    variant: 'destructive',
                    title: 'Erro ao salvar ordem',
                    description: 'Não foi possível atualizar a ordem.',
                });
                fetchApps(); // Reverter
            }
        }
    };

    const handleOpenDialog = (app?: Application) => {
        if (app) {
            setEditingApp(app);
            setFormData({
                name: app.name,
                url: app.url,
                description: app.description || '',
                category: app.category || 'Secundário',
                color: app.color || '#3B82F6',
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
                variant: 'destructive',
                title: 'Campos obrigatórios',
                description: 'Nome e URL são obrigatórios.',
            });
            return;
        }

        try {
            setIsSaving(true);

            if (editingApp) {
                await updateApplication(editingApp.id, formData);
                toast({
                    title: 'Aplicativo atualizado',
                    description: `${formData.name} foi atualizado com sucesso.`,
                });
            } else {
                await createApplication({
                    ...formData,
                    display_order: apps.length + 1,
                });
                toast({
                    title: 'Aplicativo criado',
                    description: `${formData.name} foi adicionado com sucesso.`,
                });
            }

            handleCloseDialog();
            fetchApps();
        } catch (error) {
            toast({
                variant: 'destructive',
                title: 'Erro ao salvar',
                description: 'Não foi possível salvar o aplicativo.',
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
                title: 'Aplicativo removido',
                description: `${deletingApp.name} foi removido com sucesso.`,
            });
            setIsDeleteDialogOpen(false);
            setDeletingApp(null);
            fetchApps();
        } catch (error) {
            toast({
                variant: 'destructive',
                title: 'Erro ao remover',
                description: 'Não foi possível remover o aplicativo.',
            });
        }
    };

    const handleTogglePrimary = async (app: Application) => {
        const newCategory = app.category === 'Primário' ? 'Secundário' : 'Primário';
        try {
            await updateApplication(app.id, { category: newCategory });
            toast({
                title: newCategory === 'Primário' ? 'Marcado como primário' : 'Desmarcado',
                description: `${app.name} agora é ${newCategory.toLowerCase()}.`,
            });
            fetchApps();
        } catch (error) {
            toast({
                variant: 'destructive',
                title: 'Erro ao atualizar',
                description: 'Não foi possível alterar a categoria.',
            });
        }
    };

    // Separar apps por categoria
    const primaryApps = apps.filter((app) => app.category === 'Primário');
    const secondaryApps = apps.filter((app) => app.category !== 'Primário');

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-xl font-semibold text-foreground">Aplicativos</h2>
                        <p className="text-muted-foreground text-sm mt-1">
                            Configure os aplicativos do Hub e sua ordem de exibição
                        </p>
                    </div>
                    <Button
                        onClick={() => handleOpenDialog()}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                        <Add className="h-4 w-4 mr-2" />
                        Novo Aplicativo
                    </Button>
                </div>

                {/* Content */}
                {apps.length === 0 ? (
                    <Card>
                        <CardContent className="flex flex-col items-center justify-center py-12">
                            <Apps className="h-16 w-16 text-muted-foreground mb-4" />
                            <h3 className="text-lg font-medium text-foreground mb-2">
                                Nenhum aplicativo cadastrado
                            </h3>
                            <p className="text-muted-foreground text-center">
                                Clique em "Novo Aplicativo" para começar
                            </p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-6">
                        {/* Primary Apps */}
                        {primaryApps.length > 0 && (
                            <Card>
                                <CardHeader className="pb-3 border-b">
                                    <div className="flex items-center gap-2">
                                        <Star className="h-5 w-5 text-amber-500" />
                                        <div>
                                            <CardTitle className="text-lg">Aplicativos Primários</CardTitle>
                                            <CardDescription>
                                                Aparecem em destaque no Hub
                                            </CardDescription>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="pt-6">
                                    <DndContext
                                        sensors={sensors}
                                        collisionDetection={closestCenter}
                                        onDragEnd={handleDragEnd}
                                    >
                                        <SortableContext
                                            items={primaryApps.map((app) => app.id)}
                                            strategy={verticalListSortingStrategy}
                                        >
                                            <div className="space-y-2">
                                                {primaryApps.map((app) => (
                                                    <SortableAppItem
                                                        key={app.id}
                                                        app={app}
                                                        onEdit={handleOpenDialog}
                                                        onDelete={(app) => {
                                                            setDeletingApp(app);
                                                            setIsDeleteDialogOpen(true);
                                                        }}
                                                        onTogglePrimary={handleTogglePrimary}
                                                    />
                                                ))}
                                            </div>
                                        </SortableContext>
                                    </DndContext>
                                </CardContent>
                            </Card>
                        )}

                        {/* Secondary Apps */}
                        <Card>
                            <CardHeader className="pb-3 border-b">
                                <div className="flex items-center gap-2">
                                    <Apps className="h-5 w-5 text-muted-foreground" />
                                    <div>
                                        <CardTitle className="text-lg">
                                            {primaryApps.length > 0 ? 'Aplicativos Secundários' : 'Todos os Aplicativos'}
                                        </CardTitle>
                                        <CardDescription>
                                            {primaryApps.length > 0
                                                ? 'Arraste para reordenar. Clique na estrela para destacar.'
                                                : 'Arraste para reordenar os aplicativos'
                                            }
                                        </CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="pt-6">
                                <DndContext
                                    sensors={sensors}
                                    collisionDetection={closestCenter}
                                    onDragEnd={handleDragEnd}
                                >
                                    <SortableContext
                                        items={secondaryApps.map((app) => app.id)}
                                        strategy={verticalListSortingStrategy}
                                    >
                                        <div className="space-y-2">
                                            {secondaryApps.map((app) => (
                                                <SortableAppItem
                                                    key={app.id}
                                                    app={app}
                                                    onEdit={handleOpenDialog}
                                                    onDelete={(app) => {
                                                        setDeletingApp(app);
                                                        setIsDeleteDialogOpen(true);
                                                    }}
                                                    onTogglePrimary={handleTogglePrimary}
                                                />
                                            ))}
                                        </div>
                                    </SortableContext>
                                </DndContext>

                                {secondaryApps.length === 0 && primaryApps.length > 0 && (
                                    <div className="text-center py-8 text-muted-foreground">
                                        Todos os aplicativos estão marcados como primários
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                )}
            </div>

            {/* Dialog de Criar/Editar */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>
                            {editingApp ? 'Editar Aplicativo' : 'Novo Aplicativo'}
                        </DialogTitle>
                        <DialogDescription>
                            {editingApp
                                ? 'Atualize as informações do aplicativo'
                                : 'Adicione um novo aplicativo ao Hub'}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="name">Nome *</Label>
                            <Input
                                id="name"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="Nome do aplicativo"
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
                            <Label htmlFor="description">Descrição</Label>
                            <Input
                                id="description"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                placeholder="Breve descrição do aplicativo"
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="color">Cor</Label>
                            <div className="flex gap-2">
                                <Input
                                    id="color"
                                    type="color"
                                    value={formData.color}
                                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                                    className="w-12 h-10 p-1"
                                />
                                <Input
                                    value={formData.color}
                                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                                    placeholder="#3B82F6"
                                    className="flex-1"
                                />
                            </div>
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label>Aplicativo Primário</Label>
                                <p className="text-sm text-muted-foreground">
                                    Aparece em destaque no Hub
                                </p>
                            </div>
                            <Switch
                                checked={formData.category === 'Primário'}
                                onCheckedChange={(checked) =>
                                    setFormData({ ...formData, category: checked ? 'Primário' : 'Secundário' })
                                }
                            />
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label>Aplicativo Público</Label>
                                <p className="text-sm text-muted-foreground">
                                    Visível sem necessidade de permissão
                                </p>
                            </div>
                            <Switch
                                checked={formData.is_public}
                                onCheckedChange={(checked) =>
                                    setFormData({ ...formData, is_public: checked })
                                }
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={handleCloseDialog}>
                            Cancelar
                        </Button>
                        <Button
                            onClick={handleSave}
                            disabled={isSaving}
                        >
                            {isSaving ? 'Salvando...' : editingApp ? 'Salvar' : 'Criar'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Dialog de Confirmação de Delete */}
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Remover aplicativo?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta ação não pode ser desfeita. O aplicativo "{deletingApp?.name}" será
                            removido permanentemente e todas as permissões associadas serão perdidas.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>
                            Cancelar
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            Remover
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
