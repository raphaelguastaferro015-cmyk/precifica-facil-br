import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { User, Mail, LogOut, Shield, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { toast } from "sonner";

export default function Profile() {
  const { user } = useAuth();
  const [, navigate] = useLocation();

  const logout = trpc.auth.logout.useMutation({
    onSuccess: () => {
      toast.success("Até logo!");
      navigate("/");
    },
  });

  const initials = user?.name
    ? user.name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()
    : "U";

  return (
    <div className="space-y-6 max-w-lg">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">Perfil</h1>
        <p className="text-muted-foreground text-sm mt-1">Suas informações de conta</p>
      </div>

      {/* Avatar + Name */}
      <div className="bg-card border border-border rounded-xl p-6 flex items-center gap-4">
        <div className="w-16 h-16 rounded-full gradient-neon flex items-center justify-center text-xl font-bold text-black neon-glow">
          {initials}
        </div>
        <div>
          <p className="font-display font-bold text-lg text-foreground">{user?.name ?? "Usuário"}</p>
          <p className="text-sm text-muted-foreground">{user?.email ?? "—"}</p>
          <span className="inline-flex items-center gap-1 mt-1 text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">
            <Shield className="w-3 h-3" />
            {user?.role === "admin" ? "Administrador" : "Usuário"}
          </span>
        </div>
      </div>

      {/* Info cards */}
      <div className="bg-card border border-border rounded-xl divide-y divide-border">
        {[
          { icon: User, label: "Nome", value: user?.name ?? "—" },
          { icon: Mail, label: "E-mail", value: user?.email ?? "—" },
          { icon: Zap, label: "Método de login", value: user?.loginMethod ?? "OAuth" },
        ].map(({ icon: Icon, label, value }) => (
          <div key={label} className="flex items-center gap-4 px-5 py-4">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Icon className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className="text-sm font-medium text-foreground">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Logout */}
      <div className="bg-card border border-border rounded-xl p-5">
        <h3 className="font-semibold text-sm text-foreground mb-3">Sessão</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Ao sair, você precisará fazer login novamente para acessar o sistema.
        </p>
        <Button
          variant="outline"
          onClick={() => logout.mutate()}
          disabled={logout.isPending}
          className="border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive"
        >
          <LogOut className="w-4 h-4 mr-2" />
          {logout.isPending ? "Saindo..." : "Sair da conta"}
        </Button>
      </div>

      {/* Brand */}
      <div className="text-center py-4">
        <div className="flex items-center justify-center gap-2 mb-1">
          <div className="w-6 h-6 rounded gradient-neon flex items-center justify-center">
            <Zap className="w-3 h-3 text-black" />
          </div>
          <span className="font-display font-bold text-sm text-gradient-neon">Precifica Fácil</span>
        </div>
        <p className="text-xs text-muted-foreground">Seu consultor financeiro inteligente</p>
      </div>
    </div>
  );
}
