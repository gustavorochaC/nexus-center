import { Lock, OpenInNew, Block } from "@mui/icons-material";
import * as MuiIcons from "@mui/icons-material";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import type { UserApplication, UserAppWithPermission, AccessLevel } from "@/types/database";

// Aceita ambos os tipos de app (legacy e novo com grupos)
type AppData = UserApplication | UserAppWithPermission;

interface AppCardProps {
  app: AppData;
  variant?: 'primary' | 'secondary';
}

// Helper para pegar o ícone dinamicamente do Material UI
function getIcon(iconName: string | undefined) {
  if (!iconName) return MuiIcons.Extension;

  // Mapping for common names to MUI
  const mapping: Record<string, string> = {
    Truck: "LocalShipping",
    BarChart3: "BarChart",
    Target: "TrackChanges",
    Users: "People",
    Settings: "Settings",
    LayoutGrid: "GridView",
    Shield: "Security",
  };

  const muiName = mapping[iconName] || iconName;
  const IconComponent = (MuiIcons as any)[muiName];
  return IconComponent || MuiIcons.Extension;
}

// Helper para normalizar dados do app (legacy vs novo formato)
function normalizeApp(app: AppData) {
  // Checar se é UserAppWithPermission (tem app_id)
  if ('app_id' in app) {
    return {
      id: app.app_id,
      name: app.app_name,
      url: app.app_url,
      icon_name: app.app_icon,
      access_level: app.access_level as AccessLevel,
      is_active: app.app_is_active,
      category: app.app_category,
      description: app.app_description,
      color: app.app_color,
    };
  }
  // Legacy UserApplication
  return {
    id: app.id,
    name: app.name,
    url: app.url,
    icon_name: app.icon_name,
    access_level: app.access_level as AccessLevel,
    is_active: app.is_active,
    category: app.category,
    description: undefined,
    color: undefined,
  };
}

export function AppCard({ app: rawApp, variant = 'secondary' }: AppCardProps) {
  const app = normalizeApp(rawApp);
  const { name, icon_name, url, access_level, is_active } = app;
  const { toast } = useToast();
  
  const isPrimary = variant === 'primary';

  const isLocked = access_level === "locked";
  const isEditor = access_level === "editor";
  const isViewer = access_level === "viewer";
  const isInactive = !is_active;

  const Icon = getIcon(icon_name);

  const handleAccess = () => {
    // Bloquear se app desativado
    if (isInactive) {
      toast({
        variant: "destructive",
        title: "Aplicação desativada",
        description: "Esta aplicação está temporariamente indisponível.",
      });
      return;
    }

    // Bloquear se sem acesso
    if (isLocked) {
      toast({
        variant: "destructive",
        title: "Sem permissão",
        description: "Você não tem acesso a esta aplicação. Contate o administrador.",
      });
      return;
    }

    window.open(url, '_blank');
  };

  // Definir cor padrão baseado em categoria ou fallback
  const defaultColor = app.color || "#6366f1";

  return (
    <div
      className={cn(
        "group relative flex flex-col rounded-2xl border bg-card transition-all duration-300",
        isPrimary ? "p-8" : "p-6",
        isLocked || isInactive
          ? "opacity-60 cursor-not-allowed border-border"
          : "cursor-pointer border-border/50 hover:border-transparent hover:shadow-xl hover:-translate-y-1"
      )}
      style={
        !isLocked && !isInactive
          ? {
            background: 'linear-gradient(135deg, hsl(var(--card)) 0%, hsl(var(--card)) 100%)',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
          }
          : undefined
      }
    >
      {/* Gradient border effect on hover */}
      {!isLocked && !isInactive && (
        <div
          className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10 blur-sm"
          style={{
            background: `linear-gradient(135deg, ${defaultColor}40, ${defaultColor}20)`,
            transform: 'scale(1.02)',
          }}
        />
      )}

      {/* Icon with gradient background */}
      <div className={cn("relative", isPrimary ? "mb-6" : "mb-5")}>
        <div
          className={cn(
            "flex items-center justify-center rounded-2xl transition-all duration-300",
            isPrimary ? "h-20 w-20" : "h-16 w-16",
            isLocked || isInactive ? "bg-muted/30" : "group-hover:scale-110 shadow-lg"
          )}
          style={
            !isLocked && !isInactive
              ? {
                background: `linear-gradient(135deg, ${defaultColor}20, ${defaultColor}40)`,
              }
              : undefined
          }
        >
          <Icon
            className={cn(
              "transition-transform duration-300 group-hover:scale-110",
              isPrimary ? "h-10 w-10" : "h-8 w-8"
            )}
            style={{ color: (isLocked || isInactive) ? "hsl(var(--muted-foreground))" : defaultColor }}
          />
        </div>
        {isLocked && (
          <div className="absolute -right-1 -top-1 flex h-7 w-7 items-center justify-center rounded-full bg-muted border-2 border-card shadow-md">
            <Lock className="h-3.5 w-3.5 text-muted-foreground" />
          </div>
        )}
        {isInactive && (
          <div className="absolute -right-1 -top-1 flex h-7 w-7 items-center justify-center rounded-full bg-destructive/20 border-2 border-card shadow-md">
            <Block className="h-3.5 w-3.5 text-destructive" />
          </div>
        )}
      </div>

      {/* Content */}
      <div className={cn("flex-1", isPrimary ? "mb-6" : "mb-5")}>
        <div className="mb-2 flex items-center gap-2 flex-wrap">
          <h3 className={cn(
            "font-semibold text-card-foreground tracking-tight",
            isPrimary ? "text-2xl" : "text-xl"
          )}>
            {name}
          </h3>
          {isInactive && (
            <Badge
              variant="destructive"
              className="text-xs px-2.5 py-0.5"
            >
              Desativado
            </Badge>
          )}
          {isLocked && (
            <Badge
              variant="secondary"
              className="text-xs px-2.5 py-0.5 bg-slate-500/20 text-slate-500 dark:text-slate-400 border-slate-500/30"
            >
              SEM PERMISSÃO
            </Badge>
          )}
          {!isInactive && !isLocked && isEditor && (
            <Badge
              variant="default"
              className="text-xs px-2.5 py-0.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20"
            >
              Acesso Total
            </Badge>
          )}
          {!isInactive && !isLocked && isViewer && (
            <Badge
              variant="secondary"
              className="text-xs px-2.5 py-0.5 bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20"
            >
              Somente Leitura
            </Badge>
          )}
        </div>
        <p className={cn(
          "text-muted-foreground leading-relaxed",
          isPrimary ? "text-base" : "text-sm"
        )}>
          {app.description || app.category || "Aplicação do sistema"}
        </p>
      </div>

      {/* Action Button */}
      {isInactive ? (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline" disabled className="w-full">
              <Block className="mr-2 h-4 w-4" />
              Desativado
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Esta aplicação está temporariamente indisponível</p>
          </TooltipContent>
        </Tooltip>
      ) : isLocked ? (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline" disabled className="w-full">
              <Lock className="mr-2 h-4 w-4" />
              Sem Acesso
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Contate seu administrador para solicitar acesso</p>
          </TooltipContent>
        </Tooltip>
      ) : (
        <Button
          className={cn(
            "w-full font-medium transition-all duration-300",
            isEditor
              ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-md hover:shadow-lg"
              : "bg-muted/50 text-foreground hover:bg-muted border border-border"
          )}
          onClick={handleAccess}
        >
          <OpenInNew className="mr-2 h-4 w-4" />
          {isEditor ? "Acessar Aplicação" : "Visualizar"}
        </Button>
      )}
    </div>
  );
}
