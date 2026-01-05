import { Header } from "@/components/Header";
import { AppCard } from "@/components/AppCard";
import { useAuth } from "@/contexts/AuthContext";
import type { UserApplication } from "@/types/database";
import { Person, AutoAwesome } from "@mui/icons-material";

export default function Dashboard() {
  const { profile } = useAuth();

  // Primary Applications (High Priority)
  const primaryApps: UserApplication[] = [
    {
      id: "5",
      name: "SCV",
      description: "Sistema de Controle Veicular - Gestão completa da frota",
      icon: "Truck",
      color: "#ef4444",
      port: 8084,
      base_url: "http://192.168.1.220",
      display_order: 1,
      access_level: "editor",
    },
    {
      id: "3",
      name: "SGI",
      description: "Sistema de Gestão de Indicadores - Dashboards e métricas",
      icon: "BarChart3",
      color: "#10b981",
      port: 8082,
      base_url: "http://192.168.1.220",
      display_order: 2,
      access_level: "editor",
    },
  ];

  // Secondary Applications
  const secondaryApps: UserApplication[] = [
    {
      id: "1",
      name: "Metas",
      description: "Gestão de metas e objetivos",
      icon: "Target",
      color: "#3b82f6",
      port: 8080,
      base_url: "http://192.168.1.220",
      display_order: 1,
      access_level: "editor",
    },
    {
      id: "2",
      name: "Gerador de QrCode",
      description: "Ferramenta utilitária de QR Codes",
      icon: "QrCode",
      color: "#8b5cf6",
      port: 8081,
      base_url: "http://192.168.1.220",
      display_order: 2,
      access_level: "editor",
    },
    {
      id: "4",
      name: "Análise de Editais",
      description: "Gestão e análise de documentos",
      icon: "FileSearch",
      color: "#f59e0b",
      port: 8083,
      base_url: "http://192.168.1.220",
      display_order: 3,
      access_level: "editor",
    },
  ];

  const firstName = profile?.full_name?.split(" ")[0] || "Usuário";
  const initials = profile?.full_name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "U";

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-8 max-w-7xl">
        {/* User Profile Section */}
        <div className="mb-8 flex items-center gap-4 p-6 rounded-2xl bg-gradient-to-br from-purple-500/10 via-blue-500/10 to-pink-500/10 border border-purple-500/20">
          {/* Avatar */}
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500 to-blue-500 text-white font-semibold text-xl shadow-lg">
            {initials}
          </div>

          {/* User Info */}
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-2xl font-bold text-foreground tracking-tight">
                {profile?.full_name || "Usuário"}
              </h2>
              <AutoAwesome className="h-5 w-5 text-purple-500" />
            </div>
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <Person className="h-4 w-4" />
              {profile?.email || "usuario@exemplo.com"}
            </p>
          </div>
        </div>

        {/* Welcome Section */}
        <div className="mb-12">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-3 bg-gradient-to-r from-purple-600 via-blue-600 to-purple-600 bg-clip-text text-transparent">
            Bem vindo de volta, {firstName}
          </h1>
          <p className="text-lg text-muted-foreground">
            Selecione o sistema que deseja acessar
          </p>
        </div>

        {/* Primary Apps Section */}
        <section className="mb-16">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-8 w-1.5 bg-gradient-to-b from-purple-500 to-blue-500 rounded-full" />
            <h2 className="text-2xl font-bold tracking-tight text-foreground">
              Principais
            </h2>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:gap-8">
            {primaryApps.map((app) => (
              <AppCard key={app.id} app={app} />
            ))}
          </div>
        </section>

        {/* Secondary Apps Section */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <div className="h-8 w-1.5 bg-gradient-to-b from-slate-400 to-slate-300 rounded-full" />
            <h2 className="text-xl font-semibold tracking-tight text-muted-foreground">
              Outros Sistemas
            </h2>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {secondaryApps.map((app) => (
              <AppCard key={app.id} app={app} />
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
