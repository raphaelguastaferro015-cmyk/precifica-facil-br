import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { cn } from "@/lib/utils";
import {
  BarChart3,
  Bot,
  ChevronLeft,
  ChevronRight,
  DollarSign,
  FileSpreadsheet,
  LayoutDashboard,
  LogOut,
  Package,
  PieChart,
  TrendingUp,
  User,
  Zap,
} from "lucide-react";
import { ReactNode, useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

const navItems = [
  { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { path: "/pricing", label: "Precificação", icon: TrendingUp },
  { path: "/products", label: "Produtos", icon: Package },
  { path: "/cashflow", label: "Fluxo de Caixa", icon: DollarSign },
  { path: "/smartsheet", label: "Planilha Inteligente", icon: FileSpreadsheet },
  { path: "/reports", label: "Relatórios", icon: BarChart3 },
  { path: "/ai", label: "Assistente IA", icon: Bot },
];

interface AppLayoutProps {
  children: ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const { user, loading, isAuthenticated } = useAuth();
  const [location, navigate] = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const logout = trpc.auth.logout.useMutation({
    onSuccess: () => {
      toast.success("Até logo!");
      navigate("/");
    },
  });

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      window.location.href = getLoginUrl();
    }
  }, [loading, isAuthenticated]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <p className="text-muted-foreground text-sm">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  const initials = user?.name
    ? user.name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()
    : "U";

  return (
    <div className="flex min-h-screen bg-background">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 h-full z-50 flex flex-col transition-all duration-300",
          "border-r border-[var(--sidebar-border)]",
          "bg-[var(--sidebar)]",
          collapsed ? "w-16" : "w-64",
          "lg:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Logo */}
        <div className={cn(
          "flex items-center h-16 px-4 border-b border-[var(--sidebar-border)]",
          collapsed ? "justify-center" : "gap-3"
        )}>
          <div className="w-8 h-8 rounded-lg gradient-neon flex items-center justify-center flex-shrink-0 neon-glow">
            <Zap className="w-4 h-4 text-black" />
          </div>
          {!collapsed && (
            <div>
              <span className="font-display font-bold text-sm text-gradient-neon">Precifica</span>
              <span className="font-display font-bold text-sm text-foreground"> Fácil</span>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 overflow-y-auto">
          <ul className="space-y-1 px-2">
            {navItems.map(({ path, label, icon: Icon }) => {
              const isActive = location === path || location.startsWith(path + "/");
              return (
                <li key={path}>
                  <Link href={path}>
                    <div
                      onClick={() => setMobileOpen(false)}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150 cursor-pointer group",
                        isActive
                          ? "bg-primary/10 text-primary border-l-2 border-primary"
                          : "text-[var(--sidebar-foreground)] hover:bg-white/5 hover:text-foreground border-l-2 border-transparent"
                      )}
                    >
                      <Icon className={cn("w-5 h-5 flex-shrink-0", isActive && "text-primary")} />
                      {!collapsed && (
                        <span className="text-sm font-medium truncate">{label}</span>
                      )}
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* User section */}
        <div className="border-t border-[var(--sidebar-border)] p-3 space-y-1">
          <Link href="/profile">
            <div className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer",
              "text-[var(--sidebar-foreground)] hover:bg-white/5 hover:text-foreground transition-colors",
              collapsed && "justify-center"
            )}>
              <div className="w-7 h-7 rounded-full gradient-neon flex items-center justify-center flex-shrink-0 text-xs font-bold text-black">
                {initials}
              </div>
              {!collapsed && (
                <div className="min-w-0">
                  <p className="text-xs font-medium truncate text-foreground">{user?.name ?? "Usuário"}</p>
                  <p className="text-xs text-muted-foreground truncate">{user?.email ?? ""}</p>
                </div>
              )}
            </div>
          </Link>
          <button
            onClick={() => logout.mutate()}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors",
              "text-muted-foreground hover:text-destructive hover:bg-destructive/10",
              collapsed && "justify-center"
            )}
          >
            <LogOut className="w-4 h-4 flex-shrink-0" />
            {!collapsed && <span className="text-xs">Sair</span>}
          </button>
        </div>

        {/* Collapse toggle (desktop) */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden lg:flex absolute -right-3 top-20 w-6 h-6 rounded-full bg-card border border-border items-center justify-center text-muted-foreground hover:text-primary transition-colors z-10"
        >
          {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
        </button>
      </aside>

      {/* Main content */}
      <div className={cn(
        "flex-1 flex flex-col min-h-screen transition-all duration-300",
        collapsed ? "lg:ml-16" : "lg:ml-64"
      )}>
        {/* Mobile header */}
        <header className="lg:hidden flex items-center h-14 px-4 border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-30">
          <button
            onClick={() => setMobileOpen(true)}
            className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/5"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="flex items-center gap-2 ml-3">
            <div className="w-6 h-6 rounded gradient-neon flex items-center justify-center">
              <Zap className="w-3 h-3 text-black" />
            </div>
            <span className="font-display font-bold text-sm text-gradient-neon">Precifica Fácil</span>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
