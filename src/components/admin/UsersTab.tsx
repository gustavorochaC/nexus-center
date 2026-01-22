import { useState, useEffect, useMemo } from 'react';
import { Person, Search, Folder, Add, Close, Check } from '@mui/icons-material';
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
import { Checkbox } from '@/components/ui/checkbox';
import type { Profile, Group } from '@/types/database';
import {
    getAllProfiles,
    getAllGroups,
    getUserGroups,
    addUserToGroup,
    removeUserFromGroup,
} from '@/services/permissions';

export function UsersTab() {
    const [users, setUsers] = useState<Profile[]>([]);
    const [groups, setGroups] = useState<Group[]>([]);
    const [userGroups, setUserGroups] = useState<Record<string, Group[]>>({});
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedUser, setSelectedUser] = useState<Profile | null>(null);
    const [showGroupsModal, setShowGroupsModal] = useState(false);
    const [selectedGroupIds, setSelectedGroupIds] = useState<Set<string>>(new Set());
    const [saving, setSaving] = useState(false);

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
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-xl font-semibold text-white">Usuários</h2>
                    <p className="text-slate-400 text-sm mt-1">
                        Gerencie os grupos de cada usuário
                    </p>
                </div>
                <div className="relative w-full sm:w-64">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                        placeholder="Buscar usuário..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="pl-10 bg-white/5 border-white/20 text-white"
                    />
                </div>
            </div>

            {/* Users List */}
            {users.length === 0 ? (
                <Card className="bg-white/5 border-white/10">
                    <CardContent className="flex flex-col items-center justify-center py-12">
                        <Person className="h-16 w-16 text-slate-500 mb-4" />
                        <h3 className="text-lg font-medium text-white mb-2">Nenhum usuário cadastrado</h3>
                        <p className="text-slate-400 text-center">
                            Os usuários aparecerão aqui após se cadastrarem no sistema.
                        </p>
                    </CardContent>
                </Card>
            ) : filteredUsers.length === 0 ? (
                <Card className="bg-white/5 border-white/10">
                    <CardContent className="flex flex-col items-center justify-center py-12">
                        <Search className="h-16 w-16 text-slate-500 mb-4" />
                        <h3 className="text-lg font-medium text-white mb-2">Nenhum resultado</h3>
                        <p className="text-slate-400 text-center">
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
                                className="bg-white/5 border-white/10 hover:bg-white/10 transition-all duration-200"
                            >
                                <CardContent className="p-4">
                                    <div className="flex items-center justify-between gap-4">
                                        <div className="flex items-center gap-4 flex-1 min-w-0">
                                            {/* Avatar */}
                                            <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white font-semibold flex-shrink-0">
                                                {getInitials(user.full_name, user.email)}
                                            </div>

                                            {/* Info */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <p className="text-white font-medium truncate">
                                                        {user.full_name || user.email.split('@')[0]}
                                                    </p>
                                                    {user.role === 'admin' && (
                                                        <Badge variant="secondary" className="bg-purple-500/20 text-purple-300 border-purple-400/30">
                                                            Admin
                                                        </Badge>
                                                    )}
                                                </div>
                                                <p className="text-slate-400 text-sm truncate">{user.email}</p>

                                                {/* Group Tags */}
                                                <div className="flex flex-wrap gap-1.5 mt-2">
                                                    {groups.length === 0 ? (
                                                        <span className="text-slate-500 text-xs">Sem grupos</span>
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
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => openGroupsModal(user)}
                                            className="border-white/20 text-white hover:bg-white/10 flex-shrink-0"
                                        >
                                            <Folder className="h-4 w-4 mr-2" />
                                            Grupos
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}

            {/* Groups Modal */}
            <Dialog open={showGroupsModal} onOpenChange={setShowGroupsModal}>
                <DialogContent className="bg-slate-900 border-white/10">
                    <DialogHeader>
                        <DialogTitle className="text-white">
                            Gerenciar Grupos de {selectedUser?.full_name || selectedUser?.email}
                        </DialogTitle>
                        <DialogDescription className="text-slate-400">
                            Selecione os grupos aos quais este usuário pertence
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-3 py-4 max-h-[400px] overflow-y-auto">
                        {groups.length === 0 ? (
                            <div className="text-center py-8">
                                <Folder className="h-12 w-12 text-slate-500 mx-auto mb-3" />
                                <p className="text-slate-400">Nenhum grupo criado ainda</p>
                                <p className="text-slate-500 text-sm mt-1">Crie grupos na aba "Grupos" primeiro</p>
                            </div>
                        ) : (
                            groups.map(group => (
                                <div
                                    key={group.id}
                                    className="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/10 cursor-pointer hover:bg-white/10"
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
                                        <p className="text-white font-medium">{group.name}</p>
                                        {group.description && (
                                            <p className="text-slate-400 text-xs">{group.description}</p>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setShowGroupsModal(false)}>
                            Cancelar
                        </Button>
                        <Button onClick={handleSaveGroups} disabled={saving} className="bg-blue-500">
                            {saving ? 'Salvando...' : 'Salvar'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
