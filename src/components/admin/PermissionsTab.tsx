import { useState, useEffect } from 'react';
import { Apps, Person, Visibility, Edit, Lock } from '@mui/icons-material';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from '@/components/ui/card';
import type { Application } from '@/types/database';
import { getAllApplications } from '@/services/applications';
import { getAppAccessStats } from '@/services/permissions';

interface AppWithStats extends Application {
    stats?: {
        total_users: number;
        editors: number;
        viewers: number;
        locked: number;
    };
}

export function PermissionsTab() {
    const [apps, setApps] = useState<AppWithStats[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const appsData = await getAllApplications();

            // Buscar estatísticas para cada app
            const appsWithStats: AppWithStats[] = await Promise.all(
                appsData.map(async app => {
                    const stats = await getAppAccessStats(app.id);
                    return {
                        ...app,
                        stats: stats || undefined,
                    };
                })
            );

            setApps(appsWithStats);
        } catch (error) {
            console.error('Erro ao carregar dados:', error);
        } finally {
            setLoading(false);
        }
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
            <div>
                <h2 className="text-xl font-semibold text-foreground">Permissões</h2>
                <p className="text-muted-foreground text-sm mt-1">
                    Visão geral de quem tem acesso a cada aplicativo
                </p>
            </div>

            {/* Apps Grid */}
            {apps.length === 0 ? (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                        <Apps className="h-16 w-16 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-medium text-foreground mb-2">Nenhum aplicativo cadastrado</h3>
                        <p className="text-muted-foreground text-center">
                            Cadastre aplicativos na aba "Aplicativos" para gerenciar permissões.
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {apps.map(app => {
                        const stats = app.stats;
                        const totalWithAccess = (stats?.editors || 0) + (stats?.viewers || 0);

                        return (
                            <Card
                                key={app.id}
                                className="transition-all duration-200 hover:shadow-md"
                            >
                                <CardHeader className="pb-3 border-b">
                                    <div className="flex items-start gap-4">
                                        <div
                                            className="h-12 w-12 rounded-xl flex items-center justify-center flex-shrink-0"
                                            style={{ backgroundColor: `${app.color || '#3B82F6'}20` }}
                                        >
                                            <Apps style={{ color: app.color || '#3B82F6' }} className="h-6 w-6" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <CardTitle className="text-lg truncate">{app.name}</CardTitle>
                                            <CardDescription className="truncate">
                                                {app.description || 'Sem descrição'}
                                            </CardDescription>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="pt-4">
                                    {/* Stats */}
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-muted-foreground flex items-center gap-2">
                                                <Person className="h-4 w-4" />
                                                Total com acesso
                                            </span>
                                            <span className="font-semibold text-foreground">{totalWithAccess}</span>
                                        </div>

                                        {/* Access Breakdown */}
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between">
                                                <span className="text-emerald-600 text-xs flex items-center gap-1.5">
                                                    <Edit className="h-3 w-3" />
                                                    Editores
                                                </span>
                                                <span className="text-emerald-600 text-xs font-medium">
                                                    {stats?.editors || 0}
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-blue-600 text-xs flex items-center gap-1.5">
                                                    <Visibility className="h-3 w-3" />
                                                    Visualizadores
                                                </span>
                                                <span className="text-blue-600 text-xs font-medium">
                                                    {stats?.viewers || 0}
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-muted-foreground text-xs flex items-center gap-1.5">
                                                    <Lock className="h-3 w-3" />
                                                    Bloqueados
                                                </span>
                                                <span className="text-muted-foreground text-xs font-medium">
                                                    {stats?.locked || 0}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Progress Bar */}
                                        {stats && stats.total_users > 0 && (
                                            <div className="h-2 bg-secondary rounded-full overflow-hidden flex">
                                                <div
                                                    className="bg-emerald-500 h-full"
                                                    style={{ width: `${(stats.editors / stats.total_users) * 100}%` }}
                                                />
                                                <div
                                                    className="bg-blue-500 h-full"
                                                    style={{ width: `${(stats.viewers / stats.total_users) * 100}%` }}
                                                />
                                                <div
                                                    className="bg-slate-300 h-full"
                                                    style={{ width: `${(stats.locked / stats.total_users) * 100}%` }}
                                                />
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
