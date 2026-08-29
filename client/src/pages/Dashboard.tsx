import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { cn } from "@/lib/utils";
import {
  TrendingUp, TrendingDown, DollarSign, BarChart3,
  Package, AlertTriangle, CheckCircle2, Info
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, Cell
} from "recharts";

function KPICard({
  label, value, icon: Icon, trend, color = "primary", subtitle
}: {
  label: string; value: string; icon: React.ElementType;
  trend?: "up" | "down" | "neutral"; color?: string; subtitle?: string;
}) {
  return (
    <div className="bg-card border border-border rounded-xl p-5 card-hover">
      <div className="flex items-start justify-between mb-3">
        <div className={cn(
          "w-10 h-10 rounded-lg flex items-center justify-center",
          color === "primary" && "bg-primary/10",
          color === "success" && "bg-emerald-500/10",
          color === "danger" && "bg-red-500/10",
          color === "warning" && "bg-yellow-500/10",
        )}>
          <Icon className={cn(
            "w-5 h-5",
            color === "primary" && "text-primary",
            color === "success" && "text-emerald-400",
            color === "danger" && "text-red-400",
            color === "warning" && "text-yellow-400",
          )} />
        </div>
        {trend && (
          <div className={cn(
            "flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full",
            trend === "up" && "bg-emerald-500/10 text-emerald-400",
            trend === "down" && "bg-red-500/10 text-red-400",
            trend === "neutral" && "bg-muted text-muted-foreground",
          )}>
            {trend === "up" ? <TrendingUp className="w-3 h-3" /> : trend === "down" ? <TrendingDown className="w-3 h-3" /> : null}
          </div>
        )}
      </div>
      <p className="text-2xl font-display font-bold text-foreground mb-1">{value}</p>
      <p className="text-sm text-muted-foreground">{label}</p>
      {subtitle && <p className="text-xs text-muted-foreground/70 mt-1">{subtitle}</p>}
    </div>
  );
}

function AlertCard({ type, message }: { type: "warning" | "success" | "info"; message: string }) {
  const config = {
    warning: { icon: AlertTriangle, cls: "bg-yellow-500/10 border-yellow-500/20 text-yellow-300" },
    success: { icon: CheckCircle2, cls: "bg-emerald-500/10 border-emerald-500/20 text-emerald-300" },
    info: { icon: Info, cls: "bg-primary/10 border-primary/20 text-primary" },
  }[type];
  const Icon = config.icon;
  return (
    <div className={cn("flex items-start gap-3 p-3 rounded-lg border text-sm", config.cls)}>
      <Icon className="w-4 h-4 mt-0.5 flex-shrink-0" />
      <span>{message}</span>
    </div>
  );
}

const fmt = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

const fmtPct = (v: number) => `${v.toFixed(1)}%`;

export default function Dashboard() {
  const { user } = useAuth();
  const { data: summary, isLoading } = trpc.dashboard.summary.useQuery();
  const { data: cashFlowByMonth } = trpc.reports.cashFlowByMonth.useQuery();
  const { data: profitByProduct } = trpc.reports.profitByProduct.useQuery();

  const firstName = user?.name?.split(" ")[0] ?? "Empreendedor";

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-muted rounded animate-pulse" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-card border border-border rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const s = summary ?? { totalRevenue: 0, totalExpenses: 0, totalProfit: 0, avgMargin: 0, productCount: 0 };
  const isProfit = s.totalProfit >= 0;

  // Generate alerts
  const alerts: Array<{ type: "warning" | "success" | "info"; message: string }> = [];
  if (s.avgMargin < 10 && s.productCount > 0) alerts.push({ type: "warning", message: "Sua margem média está abaixo de 10%. Revise seus preços." });
  if (s.totalProfit < 0) alerts.push({ type: "warning", message: "Você está operando com prejuízo. Analise seus custos e despesas." });
  if (s.avgMargin >= 20) alerts.push({ type: "success", message: "Boa margem! Seus produtos estão bem precificados." });
  if (s.productCount === 0) alerts.push({ type: "info", message: "Cadastre seus produtos para começar a monitorar sua lucratividade." });

  const chartData = cashFlowByMonth ?? [];
  const topProducts = (profitByProduct ?? []).slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">
          Olá, {firstName} 👋
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Aqui está o resumo financeiro do seu negócio
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          label="Receita Total"
          value={fmt(s.totalRevenue)}
          icon={DollarSign}
          color="primary"
          trend="up"
        />
        <KPICard
          label="Despesas Totais"
          value={fmt(s.totalExpenses)}
          icon={TrendingDown}
          color="danger"
          trend="down"
        />
        <KPICard
          label="Lucro / Prejuízo"
          value={fmt(s.totalProfit)}
          icon={isProfit ? TrendingUp : TrendingDown}
          color={isProfit ? "success" : "danger"}
          trend={isProfit ? "up" : "down"}
        />
        <KPICard
          label="Margem Média"
          value={fmtPct(s.avgMargin)}
          icon={BarChart3}
          color={s.avgMargin >= 20 ? "success" : s.avgMargin >= 10 ? "warning" : "danger"}
          subtitle={`${s.productCount} produto${s.productCount !== 1 ? "s" : ""}`}
        />
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map((a, i) => <AlertCard key={i} {...a} />)}
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Cash Flow Evolution */}
        <div className="bg-card border border-border rounded-xl p-5">
          <h2 className="font-display font-semibold text-sm text-foreground mb-4">
            Evolução do Fluxo de Caixa
          </h2>
          {chartData.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">
              Nenhum dado de fluxo de caixa ainda
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="oklch(0.78 0.22 155)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="oklch(0.78 0.22 155)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="oklch(0.65 0.22 25)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="oklch(0.65 0.22 25)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.20 0.02 160)" />
                <XAxis dataKey="month" tick={{ fill: "oklch(0.55 0.03 160)", fontSize: 11 }} />
                <YAxis tick={{ fill: "oklch(0.55 0.03 160)", fontSize: 11 }} tickFormatter={(v) => `R$${(v/1000).toFixed(0)}k`} />
                <Tooltip
                  contentStyle={{ background: "oklch(0.12 0.015 160)", border: "1px solid oklch(0.20 0.02 160)", borderRadius: "8px" }}
                  labelStyle={{ color: "oklch(0.95 0.01 160)" }}
                  formatter={(v: number) => [fmt(v), ""]}
                />
                <Area type="monotone" dataKey="income" stroke="oklch(0.78 0.22 155)" fill="url(#incomeGrad)" name="Receita" strokeWidth={2} />
                <Area type="monotone" dataKey="expense" stroke="oklch(0.65 0.22 25)" fill="url(#expenseGrad)" name="Despesa" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Top Products */}
        <div className="bg-card border border-border rounded-xl p-5">
          <h2 className="font-display font-semibold text-sm text-foreground mb-4">
            Produtos Mais Lucrativos
          </h2>
          {topProducts.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">
              Nenhum produto cadastrado ainda
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={topProducts} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.20 0.02 160)" horizontal={false} />
                <XAxis type="number" tick={{ fill: "oklch(0.55 0.03 160)", fontSize: 11 }} tickFormatter={(v) => `R$${v.toFixed(0)}`} />
                <YAxis type="category" dataKey="name" tick={{ fill: "oklch(0.55 0.03 160)", fontSize: 11 }} width={80} />
                <Tooltip
                  contentStyle={{ background: "oklch(0.12 0.015 160)", border: "1px solid oklch(0.20 0.02 160)", borderRadius: "8px" }}
                  formatter={(v: number) => [fmt(v), "Lucro"]}
                />
                <Bar dataKey="profit" radius={[0, 4, 4, 0]}>
                  {topProducts.map((p, i) => (
                    <Cell key={i} fill={p.profit >= 0 ? "oklch(0.78 0.22 155)" : "oklch(0.65 0.22 25)"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Products summary table */}
      {topProducts.length > 0 && (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="p-4 border-b border-border">
            <h2 className="font-display font-semibold text-sm text-foreground flex items-center gap-2">
              <Package className="w-4 h-4 text-primary" />
              Ranking de Produtos
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left px-4 py-3 text-muted-foreground font-medium">#</th>
                  <th className="text-left px-4 py-3 text-muted-foreground font-medium">Produto</th>
                  <th className="text-right px-4 py-3 text-muted-foreground font-medium">Preço</th>
                  <th className="text-right px-4 py-3 text-muted-foreground font-medium">Lucro</th>
                  <th className="text-right px-4 py-3 text-muted-foreground font-medium">Margem</th>
                </tr>
              </thead>
              <tbody>
                {topProducts.map((p, i) => (
                  <tr key={p.id} className="border-b border-border/50 hover:bg-white/2 transition-colors">
                    <td className="px-4 py-3 text-muted-foreground">{i + 1}</td>
                    <td className="px-4 py-3 font-medium text-foreground">{p.name}</td>
                    <td className="px-4 py-3 text-right text-foreground">{fmt(p.price)}</td>
                    <td className={cn("px-4 py-3 text-right font-medium", p.profit >= 0 ? "text-emerald-400" : "text-red-400")}>
                      {fmt(p.profit)}
                    </td>
                    <td className={cn("px-4 py-3 text-right font-medium", p.margin >= 20 ? "text-emerald-400" : p.margin >= 10 ? "text-yellow-400" : "text-red-400")}>
                      {fmtPct(p.margin)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
