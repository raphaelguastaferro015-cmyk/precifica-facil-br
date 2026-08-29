import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, Cell, PieChart, Pie, Legend
} from "recharts";
import { BarChart3, TrendingUp, Package } from "lucide-react";

const fmt = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
const fmtPct = (v: number) => `${Number(v).toFixed(1)}%`;

const NEON_COLORS = [
  "oklch(0.78 0.22 155)",
  "oklch(0.65 0.18 155)",
  "oklch(0.55 0.15 155)",
  "oklch(0.45 0.12 155)",
  "oklch(0.35 0.08 155)",
  "oklch(0.78 0.18 75)",
  "oklch(0.65 0.22 25)",
];

export default function Reports() {
  const { data: profitByProduct = [], isLoading: loadingProducts } = trpc.reports.profitByProduct.useQuery();
  const { data: cashFlowByMonth = [], isLoading: loadingCashFlow } = trpc.reports.cashFlowByMonth.useQuery();

  // Group by category
  const byCategory: Record<string, { category: string; totalProfit: number; count: number; avgMargin: number }> = {};
  for (const p of profitByProduct) {
    const cat = p.category ?? "Sem categoria";
    if (!byCategory[cat]) byCategory[cat] = { category: cat, totalProfit: 0, count: 0, avgMargin: 0 };
    byCategory[cat].totalProfit += p.profit;
    byCategory[cat].count++;
    byCategory[cat].avgMargin += p.margin;
  }
  const categoryData = Object.values(byCategory).map((c) => ({
    ...c,
    avgMargin: c.count > 0 ? c.avgMargin / c.count : 0,
  }));

  const tooltipStyle = {
    contentStyle: {
      background: "oklch(0.12 0.015 160)",
      border: "1px solid oklch(0.20 0.02 160)",
      borderRadius: "8px",
    },
    labelStyle: { color: "oklch(0.95 0.01 160)" },
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">Relatórios</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Análise financeira detalhada do seu negócio
        </p>
      </div>

      {/* Cash Flow Evolution */}
      <div className="bg-card border border-border rounded-xl p-5">
        <h2 className="font-display font-semibold text-foreground flex items-center gap-2 mb-4">
          <TrendingUp className="w-4 h-4 text-primary" />
          Evolução Financeira por Mês
        </h2>
        {loadingCashFlow ? (
          <div className="h-64 bg-muted/20 rounded-lg animate-pulse" />
        ) : cashFlowByMonth.length === 0 ? (
          <div className="h-64 flex items-center justify-center text-muted-foreground text-sm">
            Nenhum dado de fluxo de caixa disponível
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={cashFlowByMonth}>
              <defs>
                <linearGradient id="incomeGrad2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="oklch(0.78 0.22 155)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="oklch(0.78 0.22 155)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="expenseGrad2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="oklch(0.65 0.22 25)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="oklch(0.65 0.22 25)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="profitGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="oklch(0.78 0.18 75)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="oklch(0.78 0.18 75)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.20 0.02 160)" />
              <XAxis dataKey="month" tick={{ fill: "oklch(0.55 0.03 160)", fontSize: 11 }} />
              <YAxis tick={{ fill: "oklch(0.55 0.03 160)", fontSize: 11 }} tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
              <Tooltip {...tooltipStyle} formatter={(v: number) => [fmt(v), ""]} />
              <Legend wrapperStyle={{ color: "oklch(0.55 0.03 160)", fontSize: 12 }} />
              <Area type="monotone" dataKey="income" stroke="oklch(0.78 0.22 155)" fill="url(#incomeGrad2)" name="Receita" strokeWidth={2} />
              <Area type="monotone" dataKey="expense" stroke="oklch(0.65 0.22 25)" fill="url(#expenseGrad2)" name="Despesa" strokeWidth={2} />
              <Area type="monotone" dataKey="profit" stroke="oklch(0.78 0.18 75)" fill="url(#profitGrad)" name="Lucro" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Profit by Product */}
        <div className="bg-card border border-border rounded-xl p-5">
          <h2 className="font-display font-semibold text-foreground flex items-center gap-2 mb-4">
            <Package className="w-4 h-4 text-primary" />
            Lucro por Produto
          </h2>
          {loadingProducts ? (
            <div className="h-48 bg-muted/20 rounded-lg animate-pulse" />
          ) : profitByProduct.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">
              Nenhum produto cadastrado
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={profitByProduct.slice(0, 8)} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.20 0.02 160)" horizontal={false} />
                <XAxis type="number" tick={{ fill: "oklch(0.55 0.03 160)", fontSize: 10 }} tickFormatter={(v) => `R$${v.toFixed(0)}`} />
                <YAxis type="category" dataKey="name" tick={{ fill: "oklch(0.55 0.03 160)", fontSize: 10 }} width={90} />
                <Tooltip {...tooltipStyle} formatter={(v: number) => [fmt(v), "Lucro"]} />
                <Bar dataKey="profit" radius={[0, 4, 4, 0]}>
                  {profitByProduct.slice(0, 8).map((p, i) => (
                    <Cell key={i} fill={p.profit >= 0 ? "oklch(0.78 0.22 155)" : "oklch(0.65 0.22 25)"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Margin by Category */}
        <div className="bg-card border border-border rounded-xl p-5">
          <h2 className="font-display font-semibold text-foreground flex items-center gap-2 mb-4">
            <BarChart3 className="w-4 h-4 text-primary" />
            Margem por Categoria
          </h2>
          {categoryData.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">
              Nenhum dado disponível
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={categoryData}
                  dataKey="totalProfit"
                  nameKey="category"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ category, avgMargin }) => `${category} (${fmtPct(avgMargin)})`}
                  labelLine={false}
                >
                  {categoryData.map((_, i) => (
                    <Cell key={i} fill={NEON_COLORS[i % NEON_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip {...tooltipStyle} formatter={(v: number) => [fmt(v), "Lucro Total"]} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Products table */}
      {profitByProduct.length > 0 && (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="p-4 border-b border-border">
            <h2 className="font-display font-semibold text-sm text-foreground">
              Análise Completa de Produtos
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left px-4 py-3 text-muted-foreground font-medium">#</th>
                  <th className="text-left px-4 py-3 text-muted-foreground font-medium">Produto</th>
                  <th className="text-left px-4 py-3 text-muted-foreground font-medium">Categoria</th>
                  <th className="text-right px-4 py-3 text-muted-foreground font-medium">Custo</th>
                  <th className="text-right px-4 py-3 text-muted-foreground font-medium">Preço</th>
                  <th className="text-right px-4 py-3 text-muted-foreground font-medium">Lucro</th>
                  <th className="text-right px-4 py-3 text-muted-foreground font-medium">Margem</th>
                  <th className="text-left px-4 py-3 text-muted-foreground font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {profitByProduct.map((p, i) => (
                  <tr key={p.id} className="border-b border-border/50 hover:bg-white/2 transition-colors">
                    <td className="px-4 py-3 text-muted-foreground">{i + 1}</td>
                    <td className="px-4 py-3 font-medium text-foreground">{p.name}</td>
                    <td className="px-4 py-3">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                        {p.category ?? "Geral"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-muted-foreground">{fmt(p.cost)}</td>
                    <td className="px-4 py-3 text-right text-foreground">{fmt(p.price)}</td>
                    <td className={cn("px-4 py-3 text-right font-semibold", p.profit >= 0 ? "text-emerald-400" : "text-red-400")}>
                      {fmt(p.profit)}
                    </td>
                    <td className={cn(
                      "px-4 py-3 text-right font-semibold",
                      p.margin >= 20 ? "text-emerald-400" : p.margin >= 10 ? "text-yellow-400" : "text-red-400"
                    )}>
                      {fmtPct(p.margin)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn(
                        "text-xs px-2 py-0.5 rounded-full font-medium",
                        p.profit >= 0 && p.margin >= 20 ? "bg-emerald-500/10 text-emerald-400" :
                        p.profit >= 0 ? "bg-yellow-500/10 text-yellow-400" :
                        "bg-red-500/10 text-red-400"
                      )}>
                        {p.profit >= 0 && p.margin >= 20 ? "Excelente" :
                         p.profit >= 0 ? "Regular" : "Prejuízo"}
                      </span>
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
