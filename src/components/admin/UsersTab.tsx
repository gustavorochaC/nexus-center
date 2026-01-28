import { useState, useEffect, useMemo } from 'react';
import { Person, Search, Folder, Add, Close, Check, Delete, Security, GppBad } from '@mui/icons-material';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
    Card,
    CardContent,
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
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import type { Profile, Group } from '@/types/database';
import {
    getAllProfiles,
    getAllGroups,
    getUserGroups,
    addUserToGroup,
    removeUserFromGroup,
    deleteUser,
    updateUserRole,
} from '@/services/permissions';

export function UsersTab() {
    const { toast } = useToast();
    const { user: currentUser, isAdmin } = useAuth();
    const [users, setUsers] = useState<Profile[]>([]);
    const [groups, setGroups] = useState<Group[]>([]);
    const [userGroups, setUserGroups] = useState<Record<string, Group[]>>({});
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedUser, setSelectedUser] = useState<Profile | null>(null);
    const [showGroupsModal, setShowGroupsModal] = useState(false);
    const [selectedGroupIds, setSelectedGroupIds] = useState<Set<string>>(new Set());
    const [saving, setSaving] = useState(false);
    const [userToDelete, setUserToDelete] = useState<Profile | null>(null);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [userToChangeRole, setUserToChangeRole] = useState<Profile | null>(null);
    const [showRoleDialog, setShowRoleDialog] = useState(false);
    const [changingRole, setChangingRole] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [usersData, groupsData] = await Promise.all([
                getAllProfiles(),
                getAllGroups(),
            ]);
            setUsers(usersData);
            setGroups(groupsData);

            // Buscar grupos de cada usuário
            const groupsMap: Record<string, Group[]> = {};
            for (const user of usersData) {
                const userGroupsList = await getUserGroups(user.id);
                groupsMap[user.id] = userGroupsList;
            }
            setUserGroups(groupsMap);
        } catch (error) {
            console.error('Erro ao carregar dados:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredUsers = useMemo(() => {
        if (!searchTerm.trim()) return users;
        const term = searchTerm.toLowerCase();
        return users.filter(user =>
            user.email.toLowerCase().includes(term) ||
            user.full_name?.toLowerCase().includes(term)
        );
    }, [users, searchTerm]);

    const openGroupsModal = (user: Profile) => {
        setSelectedUser(user);
        const currentGroups = userGroups[user.id] || [];
        setSelectedGroupIds(new Set(currentGroups.map(g => g.id)));
        setShowGroupsModal(true);
    };

    const handleToggleGroup = (groupId: string) => {
        setSelectedGroupIds(prev => {
            const next = new Set(prev);
            if (next.has(groupId)) {
                next.delete(groupId);
            } else {
                next.add(groupId);
            }
            return next;
        });
    };

    const handleSaveGroups = async () => {
        if (!selectedUser) return;

        try {
            setSaving(true);
            const currentGroups = userGroups[selectedUser.id] || [];
            const currentIds = new Set(currentGroups.map(g => g.id));

            // Adicionar aos novos grupos
            for (const groupId of selectedGroupIds) {
                if (!currentIds.has(groupId)) {
                    await addUserToGroup(selectedUser.id, groupId);
                }
            }

            // Remover dos grupos desmarcados
            for (const groupId of currentIds) {
                if (!selectedGroupIds.has(groupId)) {
                    await removeUserFromGroup(selectedUser.id, groupId);
                }
            }

            await fetchData();
            setShowGroupsModal(false);
        } catch (error) {
            console.error('Erro ao salvar grupos:', error);
        } finally {
            setSaving(false);
        }
    };

    const getInitials = (name: string | undefined | null, email: string): string => {
        if (name) {
            const parts = name.split(' ');
            if (parts.length >= 2) {
                return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
            }
            return name.substring(0, 2).toUpperCase();
        }
        return email.substring(0, 2).toUpperCase();
    };

    const openDeleteDialog = (user: Profile) => {
        if (!isAdmin) {
            toast({
                variant: 'destructive',
                title: 'Acesso negado',
                description: 'Apenas administradores podem excluir usuários.',
            });
            return;
        }

        setUserToDelete(user);
        setShowDeleteDialog(true);
    };

    const handleDeleteUser = async () => {
        if (!userToDelete || !isAdmin) return;

        // Validações adicionais no frontend
        if (currentUser?.id === userToDelete.id) {
            toast({
                variant: 'destructive',
                title: 'Erro',
                description: 'Você não pode excluir sua própria conta.',
            });
            setShowDeleteDialog(false);
            setUserToDelete(null);
            return;
        }

        const adminCount = users.filter(u => u.role === 'admin' && u.id !== userToDelete.id).length;
        if (userToDelete.role === 'admin' && adminCount === 0) {
            toast({
                variant: 'destructive',
                title: 'Erro',
                description: 'Não é possível excluir o último administrador do sistema.',
            });
            setShowDeleteDialog(false);
            setUserToDelete(null);
            return;
        }

        try {
            setDeleting(true);
            await deleteUser(userToDelete.id);
            
            toast({
                title: 'Usuário excluído',
                description: `${userToDelete.email} foi excluído com sucesso.`,
            });
            
            setShowDeleteDialog(false);
            setUserToDelete(null);
            await fetchData(); // Atualizar lista
        } catch (error: any) {
            console.error('Erro ao excluir usuário:', error);
            const errorMessage = error?.message || 'Erro desconhecido';
            toast({
                variant: 'destructive',
                title: 'Erro ao excluir usuário',
                description: errorMessage,
            });
        } finally {
            setDeleting(false);
        }
    };

    const canChangeRole = (user: Profile): boolean => {
        if (!isAdmin) return false;
        if (currentUser?.id === user.id) return false; // Não pode alterar próprio role
        
        const adminCount = users.filter(u => u.role === 'admin' && u.id !== user.id).length;
        if (user.role === 'admin' && adminCount === 0) return false; // Não pode remover último admin
        
        return true;
    };

    const openRoleDialog = (user: Profile) => {
        if (!isAdmin) {
            toast({
                variant: 'destructive',
                title: 'Acesso negado',
                description: 'Apenas administradores podem alterar roles.',
            });
            return;
        }

        setUserToChangeRole(user);
        setShowRoleDialog(true);
    };

    const handleToggleRole = async () => {
        if (!userToChangeRole || !isAdmin) return;

        // Validações adicionais no frontend
        if (currentUser?.id === userToChangeRole.id) {
            toast({
                variant: 'destructive',
                title: 'Erro',
                description: 'Você não pode alterar sua própria permissão.',
            });
            setShowRoleDialog(false);
            setUserToChangeRole(null);
            return;
        }

        const adminCount = users.filter(u => u.role === 'admin' && u.id !== userToChangeRole.id).length;
        if (userToChangeRole.role === 'admin' && adminCount === 0) {
            toast({
                variant: 'destructive',
                title: 'Erro',
                description: 'Não é possível remover o último administrador do sistema.',
            });
            setShowRoleDialog(false);
            setUserToChangeRole(null);
            return;
        }

        const newRole = userToChangeRole.role === 'admin' ? 'user' : 'admin';

        try {
            setChangingRole(true);
            await updateUserRole(userToChangeRole.id, newRole);
            
            toast({
                title: 'Permissão atualizada',
                description: `${userToChangeRole.email} agora é ${newRole === 'admin' ? 'administrador' : 'usuário comum'}.`,
            });
            
            setShowRoleDialog(false);
            setUserToChangeRole(null);
            await fetchData(); // Atualizar lista
        } catch (error: any) {
            console.error('Erro ao alterar role:', error);
            const errorMessage = error?.message || 'Erro desconhecido';
            toast({
                variant: 'destructive',
                title: 'Erro ao alterar permissão',
                description: errorMessage,
            });
        } finally {
            setChangingRole(false);
        }
    };

    const canDeleteUser = (user: Profile): boolean => {
        if (!isAdmin) return false;
        if (currentUser?.id === user.id) return false; // Não pode deletar a si mesmo
        
        const adminCount = users.filter(u => u.role === 'admin' && u.id !== user.id).length;
        if (user.role === 'admin' && adminCount === 0) return false; // Não pode deletar último admin
        
        return true;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-xl font-semibold text-foreground">Usuários</h2>
                    <p className="text-muted-foreground text-sm mt-1">
                        Gerencie os grupos de cada usuário
                    </p>
                </div>
                <div className="relative w-full sm:w-64">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar usuário..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="pl-10"
                    />
                </div>
            </div>

            {/* Users List */}
            {users.length === 0 ? (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                        <Person className="h-16 w-16 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-medium text-foreground mb-2">Nenhum usuário cadastrado</h3>
                        <p className="text-muted-foreground text-center">
                            Os usuários aparecerão aqui após se cadastrarem no sistema.
                        </p>
                    </CardContent>
                </Card>
            ) : filteredUsers.length === 0 ? (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                        <Search className="h-16 w-16 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-medium text-foreground mb-2">Nenhum resultado</h3>
                        <p className="text-muted-foreground text-center">
                            Nenhum usuário encontrado para "{searchTerm}"
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-3">
                    {filteredUsers.map(user => {
                        const groups = userGroups[user.id] || [];
                        return (
                            <Card
                                key={user.id}
                                className="hover:shadow-md transition-all duration-200"
                            >
                                <CardContent className="p-4">
                                    <div className="flex items-center justify-between gap-4">
                                        <div className="flex items-center gap-4 flex-1 min-w-0">
                                            {/* Avatar */}
                                            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold flex-shrink-0">
                                                {getInitials(user.full_name, user.email)}
                                            </div>

                                            {/* Info */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <p className="text-foreground font-medium truncate">
                                                        {user.full_name || user.email.split('@')[0]}
                                                    </p>
                                                    {user.role === 'admin' && (
                                                        <Badge variant="secondary" className="bg-purple-100 text-purple-700 hover:bg-purple-100 border-purple-200">
                                                            Admin
                                                        </Badge>
                                                    )}
                                                </div>
                                                <p className="text-muted-foreground text-sm truncate">{user.email}</p>

                                                {/* Group Tags */}
                                                <div className="flex flex-wrap gap-1.5 mt-2">
                                                    {groups.length === 0 ? (
                                                        <span className="text-muted-foreground text-xs">Sem grupos</span>
                                                    ) : (
                                                        groups.map(group => (
                                                            <span
                                                                key={group.id}
                                                                className="px-2 py-0.5 rounded-full text-xs font-medium"
                                                                style={{
                                                                    backgroundColor: `${group.color}20`,
                                                                    color: group.color,
                                                                    border: `1px solid ${group.color}40`,
                                                                }}
                                                            >
                                                                {group.name}
                                                            </span>
                                                        ))
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex gap-2 flex-shrink-0">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => openGroupsModal(user)}
                                            >
                                                <Folder className="h-4 w-4 mr-2" />
                                                Grupos
                                            </Button>
                                            {canChangeRole(user) && (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => openRoleDialog(user)}
                                                    className={user.role === 'admin' ? 'text-amber-600 hover:text-amber-700 hover:bg-amber-50 border-amber-200' : ''}
                                                >
                                                    {user.role === 'admin' ? (
                                                        <>
                                                            <GppBad className="h-4 w-4 mr-2" />
                                                            Remover Admin
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Security className="h-4 w-4 mr-2" />
                                                            Tornar Admin
                                                        </>
                                                    )}
                                                </Button>
                                            )}
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => openDeleteDialog(user)}
                                                disabled={!canDeleteUser(user)}
                                                className="text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/20"
                                            >
                                                <Delete className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}

            {/* Groups Modal */}
            <Dialog open={showGroupsModal} onOpenChange={setShowGroupsModal}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            Gerenciar Grupos de {selectedUser?.full_name || selectedUser?.email}
                        </DialogTitle>
                        <DialogDescription>
                            Selecione os grupos aos quais este usuário pertence
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-3 py-4 max-h-[400px] overflow-y-auto">
                        {groups.length === 0 ? (
                            <div className="text-center py-8">
                                <Folder className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                                <p className="text-muted-foreground">Nenhum grupo criado ainda</p>
                                <p className="text-muted-foreground text-sm mt-1">Crie grupos na aba "Grupos" primeiro</p>
                            </div>
                        ) : (
                            groups.map(group => (
                                <div
                                    key={group.id}
                                    className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:bg-accent"
                                    onClick={() => handleToggleGroup(group.id)}
                                >
                                    <Checkbox
                                        checked={selectedGroupIds.has(group.id)}
                                        onCheckedChange={() => handleToggleGroup(group.id)}
                                    />
                                    <div
                                        className="h-8 w-8 rounded-lg flex items-center justify-center"
                                        style={{ backgroundColor: `${group.color}20` }}
                                    >
                                        <Folder style={{ color: group.color }} className="h-4 w-4" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-foreground font-medium">{group.name}</p>
                                        {group.description && (
                                            <p className="text-muted-foreground text-xs">{group.description}</p>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowGroupsModal(false)}>
                            Cancelar
                        </Button>
                        <Button onClick={handleSaveGroups} disabled={saving} className="bg-blue-600 hover:bg-blue-700 text-white">
                            {saving ? 'Salvando...' : 'Salvar'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Excluir Usuário</AlertDialogTitle>
                        <AlertDialogDescription>
                            Tem certeza que deseja excluir o usuário <strong>{userToDelete?.email}</strong>?
                            <br /><br />
                            Esta ação não pode ser desfeita. O usuário será removido permanentemente do sistema.
                            {userToDelete && userGroups[userToDelete.id]?.length > 0 && (
                                <>
                                    <br /><br />
                                    <span className="text-amber-600 font-medium">
                                        ⚠️ Este usuário está em {userGroups[userToDelete.id].length} grupo(s) e perderá todas as permissões associadas.
                                    </span>
                                </>
                            )}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteUser}
                            disabled={deleting}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {deleting ? 'Excluindo...' : 'Excluir Usuário'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Role Change Confirmation Dialog */}
            <AlertDialog open={showRoleDialog} onOpenChange={setShowRoleDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            {userToChangeRole?.role === 'admin' 
                                ? 'Remover privilégios de administrador?' 
                                : 'Tornar administrador?'}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            {userToChangeRole?.role === 'admin'
                                ? (
                                    <>
                                        <strong>{userToChangeRole.email}</strong> perderá acesso ao painel administrativo e não poderá mais gerenciar usuários, aplicações e permissões.
                                        <br /><br />
                                        <span className="text-amber-600 font-medium">
                                            ⚠️ Certifique-se de que há outros administradores no sistema antes de confirmar.
                                        </span>
                                    </>
                                )
                                : (
                                    <>
                                        <strong>{userToChangeRole?.email}</strong> terá acesso total ao painel administrativo, podendo gerenciar usuários, aplicações e permissões.
                                        <br /><br />
                                        <span className="text-blue-600 font-medium">
                                            ℹ️ Este usuário poderá alterar roles de outros usuários e excluir contas.
                                        </span>
                                    </>
                                )}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={changingRole}>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleToggleRole}
                            disabled={changingRole}
                            className={userToChangeRole?.role === 'admin' ? 'bg-amber-600 hover:bg-amber-700' : ''}
                        >
                            {changingRole ? 'Alterando...' : (userToChangeRole?.role === 'admin' ? 'Remover Admin' : 'Tornar Admin')}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
