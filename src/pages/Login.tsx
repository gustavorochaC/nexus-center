import { useState, useEffect } from "react";
import { useNavigate, Link, useLocation, useSearchParams } from "react-router-dom";
import { Visibility, VisibilityOff, Loop } from "@mui/icons-material";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useToast();
  const { signIn, user } = useAuth();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Mostrar toast se veio por reason=inactive
  useEffect(() => {
    const reason = searchParams.get('reason');
    if (reason === 'inactive') {
      toast({
        variant: "destructive",
        title: "Usuário desativado",
        description: "Sua conta está inativa. Entre em contato com o administrador.",
      });
      // Limpar o query param
      setSearchParams({});
    }
  }, [searchParams, setSearchParams, toast]);

  // Redirecionar se já estiver logado
  useEffect(() => {
    if (user) {
      const from = location.state?.from?.pathname || "/dashboard";
      navigate(from, { replace: true });
    }
  }, [user, location, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const { error } = await signIn(email, password);

    if (error) {
      toast({
        variant: "destructive",
        title: "Erro ao fazer login",
        description: getErrorMessage(error.message),
      });
      setIsLoading(false);
      return;
    }

    toast({
      title: "Login realizado com sucesso!",
      description: "Bem-vindo de volta ao Hub Flexibase.",
    });

    const from = location.state?.from?.pathname || "/dashboard";
    navigate(from, { replace: true });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-4 text-center">
          <div className="mx-auto">
            <img 
              src="/flexi.favicon.png" 
              alt="Flexibase" 
              className="h-16 w-16 object-contain mx-auto"
            />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-card-foreground">
              Bem vindo de volta ao HUB Flexibase
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Faça login para acessar suas aplicações
            </p>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu.email@flexibase.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  disabled={isLoading}
                >
                  {showPassword ? (
                    <VisibilityOff className="h-4 w-4" />
                  ) : (
                    <Visibility className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loop className="mr-2 h-4 w-4 animate-spin" />
                  Entrando...
                </>
              ) : (
                "Entrar"
              )}
            </Button>
          </form>
          <p className="mt-6 text-center text-sm text-muted-foreground">
            Novo na plataforma?{" "}
            <Link
              to="/register"
              className="font-medium text-primary hover:underline"
            >
              Registre-se
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

// Helper para mensagens de erro amigáveis
function getErrorMessage(error: string): string {
  const errorMessages: Record<string, string> = {
    "Invalid login credentials": "Email ou senha incorretos",
    "Email not confirmed": "Por favor, confirme seu email antes de fazer login",
    "User not found": "Usuário não encontrado",
    "Invalid email": "Email inválido",
    "Signup requires a valid password": "A senha é obrigatória",
  };

  return errorMessages[error] || "Ocorreu um erro. Tente novamente.";
}
