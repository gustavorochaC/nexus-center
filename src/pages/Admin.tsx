import { useState } from "react";
import { Header } from "@/components/Header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ApplicationManager } from "@/components/admin/ApplicationManager";
import { UserManager } from "@/components/admin/UserManager";
import { PermissionManager } from "@/components/admin/PermissionManager";
import { GridView, People, Security } from "@mui/icons-material";

export default function Admin() {
  const [activeTab, setActiveTab] = useState("applications");

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-semibold text-foreground tracking-tight">
            Painel Administrativo
          </h1>
          <p className="mt-2 text-muted-foreground">
            Gerencie aplicações, usuários e permissões do Hub Flexibase
          </p>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
            <TabsTrigger value="applications" className="flex items-center gap-2">
              <GridView className="h-4 w-4" />
              <span className="hidden sm:inline">Aplicações</span>
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <People className="h-4 w-4" />
              <span className="hidden sm:inline">Usuários</span>
            </TabsTrigger>
            <TabsTrigger value="permissions" className="flex items-center gap-2">
              <Security className="h-4 w-4" />
              <span className="hidden sm:inline">Permissões</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="applications" className="space-y-4">
            <ApplicationManager />
          </TabsContent>

          <TabsContent value="users" className="space-y-4">
            <UserManager />
          </TabsContent>

          <TabsContent value="permissions" className="space-y-4">
            <PermissionManager />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

