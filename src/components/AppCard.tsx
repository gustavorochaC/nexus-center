import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { AppData } from "@/data/apps";

interface AppCardProps {
  app: AppData;
}

export function AppCard({ app }: AppCardProps) {
  const { name, description, icon: Icon, color, permission } = app;

  const isLocked = permission === "locked";
  const isEditor = permission === "editor";
  const isViewer = permission === "viewer";

  return (
    <div
      className={cn(
        "group relative flex flex-col rounded-2xl border border-border bg-card p-8 transition-all duration-300",
        isLocked 
          ? "opacity-50 grayscale" 
          : "hover:shadow-xl hover:shadow-primary/5 hover:border-primary/30 hover:-translate-y-1"
      )}
    >
      {/* Icon with color or lock overlay */}
      <div className="relative mb-6">
        <div
          className={cn(
            "flex h-14 w-14 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110",
            isLocked ? "bg-muted/50" : "bg-card"
          )}
          style={{
            backgroundColor: isLocked ? undefined : `${color}12`,
          }}
        >
          <Icon
            className="h-7 w-7"
            style={{ color: isLocked ? "hsl(var(--muted-foreground))" : color }}
          />
        </div>
        {isLocked && (
          <div className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-muted border-2 border-card">
            <Lock className="h-3 w-3 text-muted-foreground" />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="mb-6 flex-1">
        <div className="mb-3 flex items-center gap-3">
          <h3 className="text-lg font-semibold text-card-foreground">{name}</h3>
          {isEditor && (
            <Badge variant="default" className="text-xs px-2 py-0.5">
              Editor
            </Badge>
          )}
          {isViewer && (
            <Badge variant="secondary" className="text-xs px-2 py-0.5">
              Read Only
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
              Locked
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Contact your manager for access</p>
          </TooltipContent>
        </Tooltip>
      ) : isEditor ? (
        <Button className="w-full">Access App</Button>
      ) : (
        <Button variant="outline" className="w-full">
          View Only
        </Button>
      )}
    </div>
  );
}
