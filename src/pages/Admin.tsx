import { useState, useEffect } from 'react';
import { ArrowBack, Apps, People, Folder } from '@mui/icons-material';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { GroupsTab } from '@/components/admin/GroupsTab';
import { UsersTab } from '@/components/admin/UsersTab';
import { AppsTab } from '@/components/admin/AppsTab';
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
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <header className="border-b border-white/10 bg-black/20 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={() => navigate('/dashboard')}
                className="text-slate-400 hover:text-white"
              >
                <ArrowBack className="h-5 w-5 mr-2" />
                Voltar ao Hub
              </Button>
            </div>
          </div>

          <div className="mt-4">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 via-cyan-400 to-teal-400 bg-clip-text text-transparent">
              Painel Administrativo
            </h1>
            <p className="text-slate-400 mt-1">
              Gerencie aplicativos, usuários e grupos de permissão
            </p>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="container mx-auto px-6 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-white/5 border border-white/10 p-1.5 rounded-xl">
            <TabsTrigger
              value="apps"
              className="data-[state=active]:bg-blue-500 data-[state=active]:text-white rounded-lg px-6 py-2.5 gap-2"
            >
              <Apps className="h-4 w-4" />
              Aplicativos
            </TabsTrigger>
            <TabsTrigger
              value="users"
              className="data-[state=active]:bg-blue-500 data-[state=active]:text-white rounded-lg px-6 py-2.5 gap-2"
            >
              <People className="h-4 w-4" />
              Usuários
            </TabsTrigger>
            <TabsTrigger
              value="groups"
              className="data-[state=active]:bg-blue-500 data-[state=active]:text-white rounded-lg px-6 py-2.5 gap-2"
            >
              <Folder className="h-4 w-4" />
              Grupos
            </TabsTrigger>
          </TabsList>

          <TabsContent value="apps" className="mt-6">
            <AppsTab />
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
