import { Lock, OpenInNew } from "@mui/icons-material";
import * as MuiIcons from "@mui/icons-material";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { UserApplication } from "@/types/database";

interface AppCardProps {
  app: UserApplication;
}

// Helper para pegar o ícone dinamicamente do Material UI
function getIcon(iconName: string) {
  // Mapping for legacy Lucide names to MUI
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

export function AppCard({ app }: AppCardProps) {
  const { id, name, description, icon, color, access_level, base_url, port } = app;

  const isLocked = access_level === "locked";
  const isEditor = access_level === "editor";
  const isViewer = access_level === "viewer";

  const Icon = getIcon(icon);

  const handleAccess = () => {
    const url = `${base_url}:${port}`;
    window.open(url, '_blank');
  };

  return (
    <div
      className={cn(
        "group relative flex flex-col rounded-2xl border bg-card p-6 transition-all duration-300",
        isLocked
          ? "opacity-60 cursor-not-allowed border-border"
          : "cursor-pointer border-border/50 hover:border-transparent hover:shadow-xl hover:-translate-y-1"
      )}
      style={
        !isLocked
          ? {
            background: 'linear-gradient(135deg, hsl(var(--card)) 0%, hsl(var(--card)) 100%)',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
          }
          : undefined
      }
    >
      {/* Gradient border effect on hover */}
      {!isLocked && (
        <div
          className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10 blur-sm"
          style={{
            background: `linear-gradient(135deg, ${color}40, ${color}20)`,
            transform: 'scale(1.02)',
          }}
        />
      )}

      {/* Icon with gradient background */}
      <div className="relative mb-5">
        <div
          className={cn(
            "flex h-16 w-16 items-center justify-center rounded-2xl transition-all duration-300",
            isLocked ? "bg-muted/30" : "group-hover:scale-110 shadow-lg"
          )}
          style={
            !isLocked
              ? {
                background: `linear-gradient(135deg, ${color}20, ${color}40)`,
              }
              : undefined
          }
        >
          <Icon
            className="h-8 w-8 transition-transform duration-300 group-hover:scale-110"
            style={{ color: isLocked ? "hsl(var(--muted-foreground))" : color }}
          />
        </div>
        {isLocked && (
          <div className="absolute -right-1 -top-1 flex h-7 w-7 items-center justify-center rounded-full bg-muted border-2 border-card shadow-md">
            <Lock className="h-3.5 w-3.5 text-muted-foreground" />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="mb-5 flex-1">
        <div className="mb-2 flex items-center gap-2 flex-wrap">
          <h3 className="text-xl font-semibold text-card-foreground tracking-tight">
            {name}
          </h3>
          {isEditor && (
            <Badge
              variant="default"
              className="text-xs px-2.5 py-0.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20"
            >
              Pode Editar
            </Badge>
          )}
          {isViewer && (
            <Badge
              variant="secondary"
              className="text-xs px-2.5 py-0.5 bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20"
            >
              Apenas Visualização
            </Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {description}
        </p>
      </div>

      {/* Action Button */}
      {isLocked ? (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline" disabled className="w-full">
              <Lock className="mr-2 h-4 w-4" />
              Bloqueado
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
