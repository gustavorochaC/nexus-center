import { useState, useEffect } from 'react';
import { Add, Edit, Delete, Folder, ColorLens, Close, Check } from '@mui/icons-material';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import type { Group, GroupPermission, Application, AccessLevel } from '@/types/database';
import {
    getAllGroups,
    createGroup,
    updateGroup,
    deleteGroup,
    getGroupPermissions,
    setGroupPermission,
    removeGroupPermission,
    getGroupMembers,
} from '@/services/permissions';
import { getAllApplications } from '@/services/applications';

const PRESET_COLORS = [
    '#3B82F6', // Blue
    '#10B981', // Emerald
    '#F59E0B', // Amber
    '#EF4444', // Red
    '#8B5CF6', // Violet
    '#EC4899', // Pink
    '#06B6D4', // Cyan
    '#84CC16', // Lime
];

export function GroupsTab() {
    const [groups, setGroups] = useState<Group[]>([]);
    const [apps, setApps] = useState<Application[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
    const [groupPermissions, setGroupPermissions] = useState<GroupPermission[]>([]);
    const [memberCount, setMemberCount] = useState<Record<string, number>>({});

    // Modal states
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showPermissionsModal, setShowPermissionsModal] = useState(false);

    // Form states
    const [formName, setFormName] = useState('');
    const [formDescription, setFormDescription] = useState('');
    const [formColor, setFormColor] = useState('#3B82F6');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [groupsData, appsData] = await Promise.all([
                getAllGroups(),
                getAllApplications(),
            ]);
            setGroups(groupsData);
            setApps(appsData);

            // Buscar contagem de membros para cada grupo
            const counts: Record<string, number> = {};
            for (const group of groupsData) {
                const members = await getGroupMembers(group.id);
                counts[group.id] = members.length;
            }
            setMemberCount(counts);
        } catch (error) {
            console.error('Erro ao carregar dados:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateGroup = async () => {
        if (!formName.trim()) return;

        try {
            setSaving(true);
            await createGroup(formName.trim(), formDescription.trim(), formColor);
            await fetchData();
            setShowCreateModal(false);
            resetForm();
        } catch (error) {
            console.error('Erro ao criar grupo:', error);
            alert('Erro ao criar grupo. Verifique se o nome já existe.');
        } finally {
            setSaving(false);
        }
    };

    const handleUpdateGroup = async () => {
        if (!selectedGroup || !formName.trim()) return;

        try {
            setSaving(true);
            await updateGroup(selectedGroup.id, {
                name: formName.trim(),
                description: formDescription.trim(),
                color: formColor,
            });
            await fetchData();
            setShowEditModal(false);
            resetForm();
        } catch (error) {
            console.error('Erro ao atualizar grupo:', error);
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteGroup = async (group: Group) => {
        if (!confirm(`Tem certeza que deseja excluir o grupo "${group.name}"? Todos os membros perderão as permissões herdadas.`)) {
            return;
        }

        try {
            await deleteGroup(group.id);
            await fetchData();
        } catch (error) {
            console.error('Erro ao excluir grupo:', error);
        }
    };

    const openEditModal = (group: Group) => {
        setSelectedGroup(group);
        setFormName(group.name);
        setFormDescription(group.description || '');
        setFormColor(group.color || '#3B82F6');
        setShowEditModal(true);
    };

    const openPermissionsModal = async (group: Group) => {
        setSelectedGroup(group);
        try {
            const permissions = await getGroupPermissions(group.id);
            setGroupPermissions(permissions);
            setShowPermissionsModal(true);
        } catch (error) {
            console.error('Erro ao carregar permissões:', error);
        }
    };

    const handleSetPermission = async (appId: string, accessLevel: AccessLevel) => {
        if (!selectedGroup) return;

        try {
            await setGroupPermission(selectedGroup.id, appId, accessLevel);
            const permissions = await getGroupPermissions(selectedGroup.id);
            setGroupPermissions(permissions);
        } catch (error) {
            console.error('Erro ao definir permissão:', error);
        }
    };

    const handleRemovePermission = async (appId: string) => {
        if (!selectedGroup) return;

        try {
            await removeGroupPermission(selectedGroup.id, appId);
            const permissions = await getGroupPermissions(selectedGroup.id);
            setGroupPermissions(permissions);
        } catch (error) {
            console.error('Erro ao remover permissão:', error);
        }
    };

    const getPermissionForApp = (appId: string): AccessLevel | null => {
        const perm = groupPermissions.find(p => p.app_id === appId);
        return perm?.access_level || null;
    };

    const resetForm = () => {
        setFormName('');
        setFormDescription('');
        setFormColor('#3B82F6');
        setSelectedGroup(null);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-semibold text-white">Grupos de Permissão</h2>
                    <p className="text-slate-400 text-sm mt-1">
                        Crie grupos e defina permissões padrão para cada aplicativo
                    </p>
                </div>
                <Button
                    onClick={() => setShowCreateModal(true)}
                    className="bg-blue-500 hover:bg-blue-600"
                >
                    <Add className="h-4 w-4 mr-2" />
                    Criar Grupo
                </Button>
            </div>

            {/* Groups Grid */}
            {groups.length === 0 ? (
                <Card className="bg-white/5 border-white/10">
                    <CardContent className="flex flex-col items-center justify-center py-12">
                        <Folder className="h-16 w-16 text-slate-500 mb-4" />
                        <h3 className="text-lg font-medium text-white mb-2">Nenhum grupo criado</h3>
                        <p className="text-slate-400 text-center mb-4">
                            Crie grupos para organizar permissões e facilitar a gestão de usuários.
                        </p>
                        <Button onClick={() => setShowCreateModal(true)} className="bg-blue-500 hover:bg-blue-600">
                            Criar Primeiro Grupo
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {groups.map(group => (
                        <Card
                            key={group.id}
                            className="bg-white/5 border-white/10 hover:bg-white/10 transition-all duration-200"
                        >
                            <CardHeader className="pb-3">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-3">
                                        <div
                                            className="h-10 w-10 rounded-lg flex items-center justify-center"
                                            style={{ backgroundColor: `${group.color}20` }}
                                        >
                                            <Folder style={{ color: group.color }} className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-white text-lg">{group.name}</CardTitle>
                                            <CardDescription className="text-slate-400">
                                                {memberCount[group.id] || 0} membros
                                            </CardDescription>
                                        </div>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                {group.description && (
                                    <p className="text-slate-400 text-sm mb-4 line-clamp-2">{group.description}</p>
                                )}
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => openPermissionsModal(group)}
                                        className="flex-1 border-white/20 text-white hover:bg-white/10"
                                    >
                                        Permissões
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => openEditModal(group)}
                                        className="text-slate-400 hover:text-white"
                                    >
                                        <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleDeleteGroup(group)}
                                        className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                                    >
                                        <Delete className="h-4 w-4" />
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Create Group Modal */}
            <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
                <DialogContent className="bg-slate-900 border-white/10">
                    <DialogHeader>
                        <DialogTitle className="text-white">Criar Novo Grupo</DialogTitle>
                        <DialogDescription className="text-slate-400">
                            Defina um nome e cor para identificar o grupo.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="name" className="text-white">Nome</Label>
                            <Input
                                id="name"
                                value={formName}
                                onChange={e => setFormName(e.target.value)}
                                placeholder="Ex: Equipe Vendas"
                                className="bg-white/5 border-white/20 text-white"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="description" className="text-white">Descrição (opcional)</Label>
                            <Input
                                id="description"
                                value={formDescription}
                                onChange={e => setFormDescription(e.target.value)}
                                placeholder="Ex: Acesso a metas e relatórios comerciais"
                                className="bg-white/5 border-white/20 text-white"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-white">Cor</Label>
                            <div className="flex gap-2 flex-wrap">
                                {PRESET_COLORS.map(color => (
                                    <button
                                        key={color}
                                        onClick={() => setFormColor(color)}
                                        className={`h-8 w-8 rounded-lg transition-all ${formColor === color ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-900' : ''
                                            }`}
                                        style={{ backgroundColor: color }}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => { setShowCreateModal(false); resetForm(); }}>
                            Cancelar
                        </Button>
                        <Button onClick={handleCreateGroup} disabled={saving || !formName.trim()} className="bg-blue-500">
                            {saving ? 'Criando...' : 'Criar Grupo'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Edit Group Modal */}
            <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
                <DialogContent className="bg-slate-900 border-white/10">
                    <DialogHeader>
                        <DialogTitle className="text-white">Editar Grupo</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="edit-name" className="text-white">Nome</Label>
                            <Input
                                id="edit-name"
                                value={formName}
                                onChange={e => setFormName(e.target.value)}
                                className="bg-white/5 border-white/20 text-white"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="edit-description" className="text-white">Descrição</Label>
                            <Input
                                id="edit-description"
                                value={formDescription}
                                onChange={e => setFormDescription(e.target.value)}
                                className="bg-white/5 border-white/20 text-white"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-white">Cor</Label>
                            <div className="flex gap-2 flex-wrap">
                                {PRESET_COLORS.map(color => (
                                    <button
                                        key={color}
                                        onClick={() => setFormColor(color)}
                                        className={`h-8 w-8 rounded-lg transition-all ${formColor === color ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-900' : ''
                                            }`}
                                        style={{ backgroundColor: color }}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => { setShowEditModal(false); resetForm(); }}>
                            Cancelar
                        </Button>
                        <Button onClick={handleUpdateGroup} disabled={saving || !formName.trim()} className="bg-blue-500">
                            {saving ? 'Salvando...' : 'Salvar'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Permissions Modal */}
            <Dialog open={showPermissionsModal} onOpenChange={setShowPermissionsModal}>
                <DialogContent className="bg-slate-900 border-white/10 max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-white">
                            Permissões: {selectedGroup?.name}
                        </DialogTitle>
                        <DialogDescription className="text-slate-400">
                            Defina o nível de acesso para cada aplicativo
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-3 py-4">
                        {apps.map(app => {
                            const currentLevel = getPermissionForApp(app.id);
                            return (
                                <div
                                    key={app.id}
                                    className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10"
                                >
                                    <div className="flex items-center gap-3">
                                        <div
                                            className="h-10 w-10 rounded-lg flex items-center justify-center"
                                            style={{ backgroundColor: `${app.color || '#3B82F6'}20` }}
                                        >
                                            <Folder style={{ color: app.color || '#3B82F6' }} className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <p className="text-white font-medium">{app.name}</p>
                                            {app.description && (
                                                <p className="text-slate-400 text-xs">{app.description}</p>
                                            )}
                                        </div>
                                    </div>
                                    <Select
                                        value={currentLevel || 'none'}
                                        onValueChange={(value) => {
                                            if (value === 'none') {
                                                handleRemovePermission(app.id);
                                            } else {
                                                handleSetPermission(app.id, value as AccessLevel);
                                            }
                                        }}
                                    >
                                        <SelectTrigger className="w-40 bg-white/5 border-white/20 text-white">
                                            <SelectValue placeholder="Não definido" />
                                        </SelectTrigger>
                                        <SelectContent className="bg-slate-800 border-white/10">
                                            <SelectItem value="none" className="text-slate-400">Não definido</SelectItem>
                                            <SelectItem value="editor" className="text-emerald-400">
                                                Editor (Acesso Total)
                                            </SelectItem>
                                            <SelectItem value="viewer" className="text-blue-400">
                                                Visualizador
                                            </SelectItem>
                                            <SelectItem value="locked" className="text-slate-400">
                                                Bloqueado
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            );
                        })}
                    </div>
                    <DialogFooter>
                        <Button onClick={() => setShowPermissionsModal(false)} className="bg-blue-500">
                            Concluído
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
