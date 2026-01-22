import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowBack, OpenInNew, ErrorOutline, Refresh, Fullscreen, FullscreenExit } from "@mui/icons-material";
import { Button } from "@/components/ui/button";
import { getUserApplications } from "@/services/applications";
import type { UserApplication } from "@/types/database";
import { cn } from "@/lib/utils";
import { TruckLoader } from "@/components/TruckLoader";

export default function AppViewer() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [app, setApp] = useState<UserApplication | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [iframeLoading, setIframeLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const iframeLoadTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const fetchApp = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Buscar aplicações e garantir delay mínimo de 1s
        const startTime = Date.now();
        const apps = await getUserApplications();
        const elapsed = Date.now() - startTime;
        const remainingDelay = Math.max(0, 1000 - elapsed);
        
        if (remainingDelay > 0) {
          await new Promise<void>(resolve => setTimeout(() => resolve(), remainingDelay));
        }
        
        const foundApp = apps.find((a) => a.id === id);
        
        if (!foundApp) {
          setError("Aplicação não encontrada");
          setIsLoading(false);
          return;
        }
        
        if (foundApp.access_level === "locked") {
          setError("Você não tem permissão para acessar esta aplicação");
          setIsLoading(false);
          return;
        }
        
        setApp(foundApp);
        setIsLoading(false);
      } catch (err) {
        console.error("Erro ao carregar aplicação:", err);
        setError("Não foi possível carregar a aplicação");
        setIsLoading(false);
      }
    };

    if (id) {
      fetchApp();
    }
  }, [id]);

  const appUrl = app?.url || "";

  // Reset iframe loading quando o app muda
  useEffect(() => {
    if (app) {
      setIframeLoading(true);
      // Limpar timeout anterior se existir
      if (iframeLoadTimeoutRef.current) {
        clearTimeout(iframeLoadTimeoutRef.current);
      }
    }
  }, [app?.id]);

  const handleOpenExternal = () => {
    if (appUrl) {
      window.open(appUrl, "_blank");
    }
  };

  const handleIframeLoad = () => {
    // Limpar timeout anterior se existir
    if (iframeLoadTimeoutRef.current) {
      clearTimeout(iframeLoadTimeoutRef.current);
    }
    
    // Garantir delay mínimo de 1s para ver a animação
    iframeLoadTimeoutRef.current = setTimeout(() => {
      setIframeLoading(false);
      iframeLoadTimeoutRef.current = null;
    }, 1000);
  };

  // Cleanup timeout ao desmontar
  useEffect(() => {
    return () => {
      if (iframeLoadTimeoutRef.current) {
        clearTimeout(iframeLoadTimeoutRef.current);
      }
    };
  }, []);

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <TruckLoader />
      </div>
    );
  }

  // Error state
  if (error || !app) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4 max-w-md text-center">
          <ErrorOutline className="h-12 w-12 text-destructive" />
          <h1 className="text-xl font-semibold text-foreground">
            {error || "Aplicação não encontrada"}
          </h1>
          <p className="text-muted-foreground">
            Verifique se você tem permissão para acessar esta aplicação ou se a URL está correta.
          </p>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => navigate("/dashboard")}>
              <ArrowBack className="mr-2 h-4 w-4" />
              Voltar ao Hub
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      "flex flex-col bg-background",
      isFullscreen ? "fixed inset-0 z-50" : "min-h-screen"
    )}>
      {/* Header Bar */}
      <header className="flex items-center justify-between border-b border-border bg-card px-4 py-3">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/dashboard")}
          >
            <ArrowBack className="mr-2 h-4 w-4" />
            Voltar ao Hub
          </Button>
          
          <div className="h-6 w-px bg-border" />
          
          <div className="flex items-center gap-2">
            <span className="font-medium text-foreground">{app.name}</span>
            {app.access_level === "viewer" && (
              <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                Apenas visualização
              </span>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleFullscreen}
            title={isFullscreen ? "Sair do modo tela cheia" : "Modo tela cheia"}
          >
            {isFullscreen ? (
              <FullscreenExit className="h-4 w-4" />
            ) : (
              <Fullscreen className="h-4 w-4" />
            )}
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleOpenExternal}
            title="Abrir em nova aba"
          >
            <OpenInNew className="h-4 w-4" />
          </Button>
        </div>
      </header>

      {/* iframe Container */}
      <div className="relative flex-1">
        {/* Loading overlay for iframe */}
        {iframeLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background z-10">
            <TruckLoader />
          </div>
        )}
        
        <iframe
          src={appUrl}
          title={app.name}
          className="w-full h-full border-0"
          style={{ height: isFullscreen ? "calc(100vh - 57px)" : "calc(100vh - 57px)" }}
          onLoad={handleIframeLoad}
          allow="fullscreen; clipboard-read; clipboard-write"
          sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-modals"
        />
      </div>
    </div>
  );
}

