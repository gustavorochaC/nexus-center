import { useState, useEffect } from 'react';
import { ArrowBack, Apps, People, Folder, Security, AdminPanelSettings } from '@mui/icons-material';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { GroupsTab } from '@/components/admin/GroupsTab';
import { UsersTab } from '@/components/admin/UsersTab';
import { AppsConfigTab } from '@/components/admin/AppsConfigTab';
import { PermissionsTab } from '@/components/admin/PermissionsTab';
import { PermissionManager } from '@/components/admin/PermissionManager';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Admin() {
  const { isAdmin, isLoading } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('apps');

  // Redirecionar se não for admin
  useEffect(() => {
    if (!isLoading && !isAdmin) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAdmin, isLoading, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={() => navigate('/dashboard')}
                className="text-muted-foreground hover:text-foreground"
              >
                <ArrowBack className="h-5 w-5 mr-2" />
                Voltar ao Hub
              </Button>
            </div>
          </div>

          <div className="mt-4">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 via-blue-600 to-purple-600 bg-clip-text text-transparent">
              Painel Administrativo
            </h1>
            <p className="text-muted-foreground mt-1">
              Gerencie aplicativos, permissões, usuários e grupos
            </p>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="container mx-auto px-6 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-muted p-1 rounded-xl">
            <TabsTrigger
              value="apps"
              className="rounded-lg px-6 py-2.5 gap-2 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
            >
              <Apps className="h-4 w-4" />
              Aplicativos
            </TabsTrigger>
            <TabsTrigger
              value="permissions"
              className="rounded-lg px-6 py-2.5 gap-2 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
            >
              <Security className="h-4 w-4" />
              Permissões
            </TabsTrigger>
            <TabsTrigger
              value="permission-matrix"
              className="rounded-lg px-6 py-2.5 gap-2 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
            >
              <AdminPanelSettings className="h-4 w-4" />
              Matriz de Permissões
            </TabsTrigger>
            <TabsTrigger
              value="users"
              className="rounded-lg px-6 py-2.5 gap-2 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
            >
              <People className="h-4 w-4" />
              Usuários
            </TabsTrigger>
            <TabsTrigger
              value="groups"
              className="rounded-lg px-6 py-2.5 gap-2 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
            >
              <Folder className="h-4 w-4" />
              Grupos
            </TabsTrigger>
          </TabsList>

          <TabsContent value="apps" className="mt-6">
            <AppsConfigTab />
          </TabsContent>

          <TabsContent value="permissions" className="mt-6">
            <PermissionsTab />
          </TabsContent>

          <TabsContent value="permission-matrix" className="mt-6">
            <PermissionManager />
          </TabsContent>

          <TabsContent value="users" className="mt-6">
            <UsersTab />
          </TabsContent>

          <TabsContent value="groups" className="mt-6">
            <GroupsTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
