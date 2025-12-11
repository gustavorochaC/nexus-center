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
        "group relative flex flex-col rounded-xl border border-border bg-card p-6 transition-all duration-200",
        isLocked 
          ? "opacity-60 grayscale" 
          : "hover:shadow-lg hover:border-primary/20"
      )}
    >
      {/* Icon with color or lock overlay */}
      <div className="relative mb-4">
        <div
          className={cn(
            "flex h-12 w-12 items-center justify-center rounded-lg",
            isLocked ? "bg-muted/50" : "bg-card"
          )}
          style={{
            backgroundColor: isLocked ? undefined : `${color}15`,
          }}
        >
          <Icon
            className="h-6 w-6"
            style={{ color: isLocked ? "hsl(var(--muted))" : color }}
          />
        </div>
        {isLocked && (
          <div className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-muted">
            <Lock className="h-3 w-3 text-muted-foreground" />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="mb-4 flex-1">
        <div className="mb-2 flex items-center gap-2">
          <h3 className="font-semibold text-card-foreground">{name}</h3>
          {isEditor && (
            <Badge variant="default" className="text-xs">
              Editor
            </Badge>
          )}
          {isViewer && (
            <Badge variant="secondary" className="text-xs">
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
