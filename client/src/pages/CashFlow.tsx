import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Plus, Trash2, DollarSign, TrendingUp, TrendingDown, AlertTriangle, BarChart3 } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

const fmt = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

const INCOME_CATEGORIES = ["Vendas", "Serviços", "Investimento", "Outros"];
const EXPENSE_CATEGORIES = ["Fornecedores", "Marketing", "Frete", "Taxas", "Salários", "Aluguel", "Outros"];

interface EntryForm {
  type: "income" | "expense";
  category: string;
  description: string;
  amount: number;
  date: string;
}

const defaultForm: EntryForm = {
  type: "income",
  category: "Vendas",
  description: "",
  amount: 0,
  date: new Date().toISOString().split("T")[0],
};

export default function CashFlow() {
  const utils = trpc.useUtils();
  const { data: entries = [], isLoading } = trpc.cashFlow.list.useQuery();
  const { data: summary } = trpc.cashFlow.summary.useQuery();
  const { data: monthly = [] } = trpc.reports.cashFlowByMonth.useQuery();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<EntryForm>(defaultForm);

  const createEntry = trpc.cashFlow.create.useMutation({
    onSuccess: () => {
      utils.cashFlow.list.invalidate();
      utils.cashFlow.summary.invalidate();
      utils.dashboard.summary.invalidate();
      toast.success("Lançamento adicionado!");
      setOpen(false);
      setForm(defaultForm);
    },
    onError: () => toast.error("Erro ao adicionar lançamento"),
  });

  const deleteEntry = trpc.cashFlow.delete.useMutation({
    onSuccess: () => {
      utils.cashFlow.list.invalidate();
      utils.cashFlow.summary.invalidate();
      utils.dashboard.summary.invalidate();
      toast.success("Lançamento removido");
    },
    onError: () => toast.error("Erro ao remover"),
  });

  const handleSubmit = () => {
    if (!form.description.trim()) return toast.error("Descrição é obrigatória");
    if (form.amount <= 0) return toast.error("Valor deve ser maior que zero");
    createEntry.mutate({
      ...form,
      date: new Date(form.date + "T12:00:00"),
    });
  };

  const s = summary ?? { totalIncome: 0, totalExpense: 0, balance: 0 };
  const isPositive = s.balance >= 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Fluxo de Caixa</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Controle suas entradas e saídas financeiras
          </p>
        </div>
        <Button onClick={() => setOpen(true)} className="gradient-neon text-black font-semibold">
          <Plus className="w-4 h-4 mr-2" />
          Novo Lançamento
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
            </div>
            <span className="text-xs text-muted-foreground">Receitas</span>
          </div>
          <p className="text-xl font-display font-bold text-emerald-400">{fmt(s.totalIncome)}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center">
              <TrendingDown className="w-4 h-4 text-red-400" />
            </div>
            <span className="text-xs text-muted-foreground">Despesas</span>
          </div>
          <p className="text-xl font-display font-bold text-red-400">{fmt(s.totalExpense)}</p>
        </div>
        <div className={cn(
          "border rounded-xl p-4",
          isPositive ? "bg-emerald-500/5 border-emerald-500/20" : "bg-red-500/5 border-red-500/20"
        )}>
          <div className="flex items-center gap-2 mb-2">
            <div className={cn(
              "w-8 h-8 rounded-lg flex items-center justify-center",
              isPositive ? "bg-emerald-500/10" : "bg-red-500/10"
            )}>
              <DollarSign className={cn("w-4 h-4", isPositive ? "text-emerald-400" : "text-red-400")} />
            </div>
            <span className="text-xs text-muted-foreground">Saldo</span>
          </div>
          <p className={cn("text-xl font-display font-bold", isPositive ? "text-emerald-400" : "text-red-400")}>
            {fmt(s.balance)}
          </p>
        </div>
      </div>

      {/* Monthly chart */}
      {monthly.length > 0 ? (
          <div className="bg-card border border-border rounded-xl p-5">
            <h2 className="font-display font-semibold text-sm text-foreground flex items-center gap-2 mb-4">
              <BarChart3 className="w-4 h-4 text-primary" />
              Evolução Mensal
            </h2>
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={monthly}>
                <defs>
                  <linearGradient id="cfIncomeGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="oklch(0.78 0.22 155)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="oklch(0.78 0.22 155)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="cfExpenseGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="oklch(0.65 0.22 25)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="oklch(0.65 0.22 25)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.20 0.02 160)" />
                <XAxis dataKey="month" tick={{ fill: "oklch(0.55 0.03 160)", fontSize: 11 }} />
                <YAxis tick={{ fill: "oklch(0.55 0.03 160)", fontSize: 11 }} tickFormatter={(v) => `R$${(v/1000).toFixed(0)}k`} />
                <Tooltip
                  contentStyle={{ background: "oklch(0.12 0.015 160)", border: "1px solid oklch(0.20 0.02 160)", borderRadius: "8px" }}
                  formatter={(v: number) => [new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v), ""]}
                />
                <Area type="monotone" dataKey="income" stroke="oklch(0.78 0.22 155)" fill="url(#cfIncomeGrad)" name="Receita" strokeWidth={2} />
                <Area type="monotone" dataKey="expense" stroke="oklch(0.65 0.22 25)" fill="url(#cfExpenseGrad)" name="Despesa" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
      ) : null}

      {/* Alert if negative */}
      {!isPositive && s.balance < 0 && (
        <div className="flex items-start gap-3 p-3 rounded-lg border bg-red-500/10 border-red-500/20 text-red-300 text-sm">
          <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>Seu saldo está negativo. Revise suas despesas e busque aumentar as receitas.</span>
        </div>
      )}

      {/* Entries list */}
      {isLoading ? (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-14 bg-card border border-border rounded-xl animate-pulse" />
          ))}
        </div>
      ) : entries.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-12 text-center">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <DollarSign className="w-8 h-8 text-primary" />
          </div>
          <h3 className="font-display font-semibold text-foreground mb-2">Nenhum lançamento ainda</h3>
          <p className="text-muted-foreground text-sm mb-4">
            Registre suas entradas e saídas para controlar o fluxo de caixa
          </p>
          <Button onClick={() => setOpen(true)} className="gradient-neon text-black font-semibold">
            <Plus className="w-4 h-4 mr-2" />
            Primeiro Lançamento
          </Button>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left px-4 py-3 text-muted-foreground font-medium">Data</th>
                  <th className="text-left px-4 py-3 text-muted-foreground font-medium">Descrição</th>
                  <th className="text-left px-4 py-3 text-muted-foreground font-medium">Categoria</th>
                  <th className="text-left px-4 py-3 text-muted-foreground font-medium">Tipo</th>
                  <th className="text-right px-4 py-3 text-muted-foreground font-medium">Valor</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {entries.map((e) => {
                  const isIncome = e.type === "income";
                  return (
                    <tr key={e.id} className="border-b border-border/50 hover:bg-white/2 transition-colors">
                      <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                        {new Date(e.date).toLocaleDateString("pt-BR")}
                      </td>
                      <td className="px-4 py-3 text-foreground font-medium">{e.description}</td>
                      <td className="px-4 py-3">
                        <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                          {e.category}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn(
                          "text-xs px-2 py-0.5 rounded-full font-medium",
                          isIncome ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"
                        )}>
                          {isIncome ? "Entrada" : "Saída"}
                        </span>
                      </td>
                      <td className={cn(
                        "px-4 py-3 text-right font-semibold",
                        isIncome ? "text-emerald-400" : "text-red-400"
                      )}>
                        {isIncome ? "+" : "-"}{fmt(Number(e.amount))}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => deleteEntry.mutate({ id: e.id })}
                          className="p-1.5 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-card border-border text-foreground max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display">Novo Lançamento</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <Label className="text-sm text-muted-foreground">Tipo</Label>
              <div className="flex gap-2 mt-1">
                {(["income", "expense"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setForm({ ...form, type: t, category: t === "income" ? "Vendas" : "Fornecedores" })}
                    className={cn(
                      "flex-1 py-2 rounded-lg text-sm font-medium transition-colors border",
                      form.type === t
                        ? t === "income"
                          ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                          : "bg-red-500/10 border-red-500/30 text-red-400"
                        : "bg-muted border-border text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {t === "income" ? "Entrada" : "Saída"}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Label className="text-sm text-muted-foreground">Categoria</Label>
              <Select
                value={form.category}
                onValueChange={(v) => setForm({ ...form, category: v })}
              >
                <SelectTrigger className="mt-1 bg-input border-border text-foreground">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  {(form.type === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES).map((c) => (
                    <SelectItem key={c} value={c} className="text-foreground hover:bg-muted">
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-sm text-muted-foreground">Descrição</Label>
              <Input
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="mt-1 bg-input border-border"
                placeholder="Ex: Venda de produto X"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-sm text-muted-foreground">Valor (R$)</Label>
                <Input
                  type="number"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: parseFloat(e.target.value) || 0 })}
                  className="mt-1 bg-input border-border"
                  min={0}
                  step={0.01}
                />
              </div>
              <div>
                <Label className="text-sm text-muted-foreground">Data</Label>
                <Input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  className="mt-1 bg-input border-border"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button variant="outline" onClick={() => setOpen(false)} className="flex-1 border-border">
                Cancelar
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={createEntry.isPending}
                className="flex-1 gradient-neon text-black font-semibold"
              >
                Adicionar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
