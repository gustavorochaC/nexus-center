import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Visibility, VisibilityOff, Loop } from "@mui/icons-material";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

export default function Register() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { signUp, user } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Redirecionar se já estiver logado
  if (user) {
    navigate("/dashboard", { replace: true });
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validação básica
    if (password.length < 6) {
      toast({
        variant: "destructive",
        title: "Senha muito curta",
        description: "A senha deve ter pelo menos 6 caracteres.",
      });
      return;
    }

    setIsLoading(true);

    const { error } = await signUp(email, password, name);

    if (error) {
      toast({
        variant: "destructive",
        title: "Erro ao criar conta",
        description: getErrorMessage(error.message),
      });
      setIsLoading(false);
      return;
    }

    toast({
      title: "Conta criada com sucesso!",
      description: "Verifique seu email para confirmar o cadastro.",
    });

    // Aguardar um pouco antes de redirecionar
    setTimeout(() => {
      navigate("/login");
    }, 2000);
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
              Crie sua conta
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Entre para a equipe Flexibase
            </p>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome Completo</Label>
              <Input
                id="name"
                type="text"
                placeholder="João Silva"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email Corporativo</Label>
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
                  minLength={6}
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
              <p className="text-xs text-muted-foreground">
                Mínimo de 6 caracteres
              </p>
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loop className="mr-2 h-4 w-4 animate-spin" />
                  Criando conta...
                </>
              ) : (
                "Criar Conta"
              )}
            </Button>
          </form>
          <p className="mt-6 text-center text-sm text-muted-foreground">
            Já tem uma conta?{" "}
            <Link
              to="/login"
              className="font-medium text-primary hover:underline"
            >
              Faça login
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
    "User already registered": "Este email já está cadastrado",
    "Password should be at least 6 characters": "A senha deve ter pelo menos 6 caracteres",
    "Unable to validate email address: invalid format": "Formato de email inválido",
    "Signup requires a valid password": "A senha é obrigatória",
  };

  return errorMessages[error] || "Ocorreu um erro. Tente novamente.";
}
