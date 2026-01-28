import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { AppCard } from "@/components/AppCard";
import { useAuth } from "@/contexts/AuthContext";
import { useSettingsModal } from "@/contexts/SettingsModalContext";
import Settings from "@/pages/Settings";
import { getUserAppsWithPermissions } from "@/services/permissions";
import { useEffect, useState } from "react";
import { Loop } from "@mui/icons-material";
import type { UserAppWithPermission } from "@/types/database";

export default function Dashboard() {
  const { profile, user, isLoading: authLoading } = useAuth();
  const { isOpen, closeSettings } = useSettingsModal();
  const [apps, setApps] = useState<UserAppWithPermission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Aguardar auth carregar
    if (authLoading) {
      return;
    }

    // Se não tem usuário, não buscar apps
    if (!user?.id) {
      setIsLoading(false);
      return;
    }

    async function loadApps() {
      try {
        setIsLoading(true);
        setError(null);
        console.log('Dashboard: Buscando apps para:', user?.id);

        const data = await getUserAppsWithPermissions(user?.id);
        console.log('Dashboard: Apps carregados:', data.length);

        setApps(data);
      } catch (err) {
        console.error('Erro ao carregar aplicações:', err);
        setError('Não foi possível carregar as aplicações');
      } finally {
        setIsLoading(false);
      }
    }

    loadApps();
  }, [user?.id, authLoading]);


  // Separar apps por display_order e categoria
  const sortedApps = [...apps].sort((a, b) => a.app_display_order - b.app_display_order);
  const primaryApps = sortedApps.filter(app => app.app_category === 'Primário');
  const secondaryApps = sortedApps.filter(app => app.app_category !== 'Primário');

  const firstName = profile?.email?.split("@")[0] || "Usuário";

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Settings Modal */}
      {isOpen && <Settings onClose={closeSettings} />}

      <main className="container mx-auto px-4 py-8 max-w-7xl pb-24">
        {/* Welcome Section */}
        <div className="mb-12">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-3 bg-gradient-to-r from-purple-600 via-blue-600 to-purple-600 bg-clip-text text-transparent">
            Bem vindo de volta, {firstName}
          </h1>
          <p className="text-lg text-muted-foreground">
            Selecione o sistema que deseja acessar
          </p>
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="flex flex-col items-center gap-4">
              <Loop className="h-8 w-8 animate-spin text-primary" />
              <p className="text-muted-foreground">Carregando aplicações...</p>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="flex items-center justify-center py-12">
            <p className="text-destructive">{error}</p>
          </div>
        )}

        {/* Apps Grid */}
        {!isLoading && !error && (
          <>
            {/* Seção Principal */}
            {primaryApps.length > 0 && (
              <section className="mb-12">
                <div className="flex items-center gap-3 mb-6">
                  <div className="h-8 w-1.5 bg-gradient-to-b from-purple-500 to-blue-500 rounded-full" />
                  <h2 className="text-2xl font-bold tracking-tight text-foreground">
                    Principal
                  </h2>
                </div>
                <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
                  {primaryApps.map((app) => (
                    <AppCard key={app.app_id} app={app} variant="primary" />
                  ))}
                </div>
              </section>
            )}

            {/* Seção Secundário */}
            <section>
              {primaryApps.length > 0 && (
                <div className="flex items-center gap-3 mb-6">
                  <div className="h-8 w-1.5 bg-gradient-to-b from-purple-500 to-blue-500 rounded-full" />
                  <h2 className="text-2xl font-bold tracking-tight text-foreground">
                    Secundário
                  </h2>
                </div>
              )}
              {primaryApps.length === 0 && (
                <div className="flex items-center gap-3 mb-6">
                  <div className="h-8 w-1.5 bg-gradient-to-b from-purple-500 to-blue-500 rounded-full" />
                  <h2 className="text-2xl font-bold tracking-tight text-foreground">
                    Aplicações
                  </h2>
                </div>
              )}
              <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                {secondaryApps.map((app) => (
                  <AppCard key={app.app_id} app={app} variant="secondary" />
                ))}
              </div>
              {sortedApps.length === 0 && (
                <p className="text-center text-muted-foreground py-12">
                  Nenhuma aplicação disponível
                </p>
              )}
              {primaryApps.length > 0 && secondaryApps.length === 0 && (
                <p className="text-center text-muted-foreground py-12">
                  Nenhuma aplicação secundária disponível
                </p>
              )}
            </section>
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}
