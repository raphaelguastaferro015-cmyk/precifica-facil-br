import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Zap, TrendingUp, BarChart3, Bot, ArrowRight, CheckCircle2, Eye, EyeOff, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

const features = [
  { icon: TrendingUp, title: "Precificação Inteligente", desc: "Calcule o preço ideal com base em custo, margem e despesas" },
  { icon: BarChart3, title: "Dashboard Financeiro", desc: "Visualize lucro, receita e margem em tempo real" },
  { icon: Bot, title: "Assistente IA", desc: "Consultor financeiro que analisa seus dados e sugere melhorias" },
  { icon: Zap, title: "Planilha Inteligente", desc: "Simule cenários de precificação com múltiplos produtos" },
];

function PasswordStrengthIndicator({ password }: { password: string }) {
  const hasLength = password.length >= 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[^a-zA-Z0-9]/.test(password);
  const strength = [hasLength, hasUpper, hasNumber, hasSpecial].filter(Boolean).length;

  return (
    <div className="space-y-2">
      <div className="flex gap-1">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full transition-colors ${
              i <= strength
                ? i <= 2
                  ? "bg-red-500"
                  : i === 3
                  ? "bg-yellow-500"
                  : "bg-green-500"
                : "bg-border"
            }`}
          />
        ))}
      </div>
      <div className="text-xs text-muted-foreground space-y-0.5">
        <div className={hasLength ? "text-green-400" : ""}>✓ Mínimo 8 caracteres</div>
        <div className={hasUpper ? "text-green-400" : ""}>✓ Letra maiúscula</div>
        <div className={hasNumber ? "text-green-400" : ""}>✓ Número</div>
        <div className={hasSpecial ? "text-green-400" : ""}>✓ Símbolo especial</div>
      </div>
    </div>
  );
}

export default function Landing() {
  const { isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();
  const [tab, setTab] = useState<"login" | "signup">("login");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Login form
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [loginErrors, setLoginErrors] = useState<Record<string, string>>({});

  // Signup form
  const [signupForm, setSignupForm] = useState({ email: "", name: "", password: "", confirmPassword: "" });
  const [signupErrors, setSignupErrors] = useState<Record<string, string>>({});

  const signin = trpc.auth.signin.useMutation({
    onSuccess: () => {
      toast.success("Login realizado com sucesso!");
      navigate("/dashboard");
    },
    onError: (error) => {
      setLoginErrors({ submit: error.message });
      toast.error(error.message);
    },
  });

  const signup = trpc.auth.signup.useMutation({
    onSuccess: () => {
      toast.success("Conta criada! Faça login para continuar.");
      setTab("login");
      setSignupForm({ email: "", name: "", password: "", confirmPassword: "" });
    },
    onError: (error) => {
      setSignupErrors({ submit: error.message });
      toast.error(error.message);
    },
  });

  useEffect(() => {
    if (!loading && isAuthenticated) {
      navigate("/dashboard");
    }
  }, [loading, isAuthenticated]);

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};
    if (!loginForm.email) errors.email = "Email obrigatório";
    if (!loginForm.password) errors.password = "Senha obrigatória";
    setLoginErrors(errors);
    if (Object.keys(errors).length === 0) {
      signin.mutate(loginForm);
    }
  };

  const handleSignupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};
    if (!signupForm.email) errors.email = "Email obrigatório";
    if (!signupForm.name) errors.name = "Nome obrigatório";
    if (signupForm.password.length < 8) errors.password = "Senha deve ter pelo menos 8 caracteres";
    if (!/[A-Z]/.test(signupForm.password)) errors.password = "Deve conter letra maiúscula";
    if (!/[0-9]/.test(signupForm.password)) errors.password = "Deve conter número";
    if (!/[^a-zA-Z0-9]/.test(signupForm.password)) errors.password = "Deve conter símbolo especial";
    if (signupForm.password !== signupForm.confirmPassword) errors.confirmPassword = "Senhas não conferem";
    setSignupErrors(errors);
    if (Object.keys(errors).length === 0) {
      signup.mutate({ email: signupForm.email, name: signupForm.name, password: signupForm.password });
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-border/50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg gradient-neon flex items-center justify-center neon-glow">
            <Zap className="w-4 h-4 text-black" />
          </div>
          <span className="font-display font-bold text-lg">
            <span className="text-gradient-neon">Precifica</span>
            <span className="text-foreground"> Fácil</span>
          </span>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Left: Hero */}
          <div className="flex flex-col justify-center">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-medium mb-6 w-fit">
              <Zap className="w-3 h-3" />
              Consultor financeiro inteligente
            </div>

            <h1 className="font-display text-4xl md:text-5xl font-bold mb-6 leading-tight">
              Saiba exatamente onde você está{" "}
              <span className="text-gradient-neon">ganhando</span> ou{" "}
              <span style={{ color: "var(--loss)" }}>perdendo</span>
            </h1>

            <p className="text-muted-foreground text-lg mb-8 leading-relaxed">
              Precifique seus produtos com inteligência, controle seu fluxo de caixa e tome decisões financeiras melhores — tudo em um só lugar.
            </p>

            {/* Features grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {features.map(({ icon: Icon, title, desc }) => (
                <div key={title} className="bg-card border border-border rounded-lg p-4 text-left">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
                    <Icon className="w-4 h-4 text-primary" />
                  </div>
                  <h3 className="font-semibold text-xs text-foreground mb-1">{title}</h3>
                  <p className="text-xs text-muted-foreground">{desc}</p>
                </div>
              ))}
            </div>

            {/* Benefits */}
            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2">
              {["Sem cartão", "Setup rápido", "Dados seguros", "Suporte PT-BR"].map((b) => (
                <div key={b} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <CheckCircle2 className="w-3 h-3 text-primary flex-shrink-0" />
                  {b}
                </div>
              ))}
            </div>
          </div>

          {/* Right: Auth Forms */}
          <div className="flex flex-col justify-center">
            <div className="bg-card border border-border rounded-2xl p-8">
              {/* Tabs */}
              <div className="flex gap-2 mb-8">
                <button
                  onClick={() => setTab("login")}
                  className={`flex-1 py-2.5 px-4 rounded-lg font-medium text-sm transition-all ${
                    tab === "login"
                      ? "bg-primary text-black"
                      : "bg-border/30 text-muted-foreground hover:bg-border/50"
                  }`}
                >
                  Entrar
                </button>
                <button
                  onClick={() => setTab("signup")}
                  className={`flex-1 py-2.5 px-4 rounded-lg font-medium text-sm transition-all ${
                    tab === "signup"
                      ? "bg-primary text-black"
                      : "bg-border/30 text-muted-foreground hover:bg-border/50"
                  }`}
                >
                  Criar Conta
                </button>
              </div>

              {/* Login Form */}
              {tab === "login" && (
                <form onSubmit={handleLoginSubmit} className="space-y-4">
                  {loginErrors.submit && (
                    <div className="flex items-start gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-300 text-sm">
                      <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <span>{loginErrors.submit}</span>
                    </div>
                  )}

                  <div>
                    <Label className="text-xs font-medium text-foreground mb-1.5 block">Email</Label>
                    <Input
                      type="email"
                      placeholder="seu@email.com"
                      value={loginForm.email}
                      onChange={(e) => {
                        setLoginForm({ ...loginForm, email: e.target.value });
                        if (loginErrors.email) setLoginErrors({ ...loginErrors, email: "" });
                      }}
                      className={`bg-input border ${loginErrors.email ? "border-red-500" : "border-border"}`}
                    />
                    {loginErrors.email && <p className="text-xs text-red-400 mt-1">{loginErrors.email}</p>}
                  </div>

                  <div>
                    <Label className="text-xs font-medium text-foreground mb-1.5 block">Senha</Label>
                    <div className="relative">
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={loginForm.password}
                        onChange={(e) => {
                          setLoginForm({ ...loginForm, password: e.target.value });
                          if (loginErrors.password) setLoginErrors({ ...loginErrors, password: "" });
                        }}
                        className={`bg-input border ${loginErrors.password ? "border-red-500" : "border-border"} pr-10`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {loginErrors.password && <p className="text-xs text-red-400 mt-1">{loginErrors.password}</p>}
                  </div>

                  <Button
                    type="submit"
                    disabled={signin.isPending}
                    className="w-full gradient-neon text-black font-semibold mt-6"
                  >
                    {signin.isPending ? "Entrando..." : "Entrar"}
                  </Button>

                  <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border/30" /></div>
                    <div className="relative flex justify-center text-xs"><span className="bg-card px-2 text-muted-foreground">ou</span></div>
                  </div>

                  <Button
                    type="button"
                    onClick={() => window.location.href = getLoginUrl()}
                    variant="outline"
                    className="w-full border-border"
                  >
                    Entrar com OAuth
                  </Button>
                </form>
              )}

              {/* Signup Form */}
              {tab === "signup" && (
                <form onSubmit={handleSignupSubmit} className="space-y-4">
                  {signupErrors.submit && (
                    <div className="flex items-start gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-300 text-sm">
                      <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <span>{signupErrors.submit}</span>
                    </div>
                  )}

                  <div>
                    <Label className="text-xs font-medium text-foreground mb-1.5 block">Email</Label>
                    <Input
                      type="email"
                      placeholder="seu@email.com"
                      value={signupForm.email}
                      onChange={(e) => {
                        setSignupForm({ ...signupForm, email: e.target.value });
                        if (signupErrors.email) setSignupErrors({ ...signupErrors, email: "" });
                      }}
                      className={`bg-input border ${signupErrors.email ? "border-red-500" : "border-border"}`}
                    />
                    {signupErrors.email && <p className="text-xs text-red-400 mt-1">{signupErrors.email}</p>}
                  </div>

                  <div>
                    <Label className="text-xs font-medium text-foreground mb-1.5 block">Nome</Label>
                    <Input
                      type="text"
                      placeholder="Seu nome"
                      value={signupForm.name}
                      onChange={(e) => {
                        setSignupForm({ ...signupForm, name: e.target.value });
                        if (signupErrors.name) setSignupErrors({ ...signupErrors, name: "" });
                      }}
                      className={`bg-input border ${signupErrors.name ? "border-red-500" : "border-border"}`}
                    />
                    {signupErrors.name && <p className="text-xs text-red-400 mt-1">{signupErrors.name}</p>}
                  </div>

                  <div>
                    <Label className="text-xs font-medium text-foreground mb-1.5 block">Senha</Label>
                    <div className="relative">
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={signupForm.password}
                        onChange={(e) => {
                          setSignupForm({ ...signupForm, password: e.target.value });
                          if (signupErrors.password) setSignupErrors({ ...signupErrors, password: "" });
                        }}
                        className={`bg-input border ${signupErrors.password ? "border-red-500" : "border-border"} pr-10`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {signupForm.password && <PasswordStrengthIndicator password={signupForm.password} />}
                  </div>

                  <div>
                    <Label className="text-xs font-medium text-foreground mb-1.5 block">Confirmar Senha</Label>
                    <div className="relative">
                      <Input
                        type={showConfirm ? "text" : "password"}
                        placeholder="••••••••"
                        value={signupForm.confirmPassword}
                        onChange={(e) => {
                          setSignupForm({ ...signupForm, confirmPassword: e.target.value });
                          if (signupErrors.confirmPassword) setSignupErrors({ ...signupErrors, confirmPassword: "" });
                        }}
                        className={`bg-input border ${signupErrors.confirmPassword ? "border-red-500" : "border-border"} pr-10`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirm(!showConfirm)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {signupErrors.confirmPassword && <p className="text-xs text-red-400 mt-1">{signupErrors.confirmPassword}</p>}
                  </div>

                  <Button
                    type="submit"
                    disabled={signup.isPending}
                    className="w-full gradient-neon text-black font-semibold mt-6"
                  >
                    {signup.isPending ? "Criando conta..." : "Criar Conta"}
                  </Button>
                </form>
              )}
            </div>

            <p className="text-center text-xs text-muted-foreground mt-6">
              Seus dados são criptografados e nunca compartilhados.
            </p>
          </div>
        </div>
      </main>

      <footer className="text-center py-4 text-xs text-muted-foreground border-t border-border/30">
        © 2025 Precifica Fácil. Todos os direitos reservados.
      </footer>
    </div>
  );
}
