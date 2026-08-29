import { trpc } from "@/lib/trpc";
import { useState, useRef } from "react";
import { cn } from "@/lib/utils";
import { Plus, Trash2, Copy, FileSpreadsheet, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const fmt = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
const fmtPct = (v: number) => `${v.toFixed(1)}%`;

function EditableCell({
  value, type = "text", onSave, className
}: {
  value: string | number;
  type?: "text" | "number";
  onSave: (v: string | number) => void;
  className?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [local, setLocal] = useState(String(value));
  const inputRef = useRef<HTMLInputElement>(null);

  const commit = () => {
    setEditing(false);
    const parsed = type === "number" ? parseFloat(local) || 0 : local;
    if (parsed !== value) onSave(parsed);
  };

  if (editing) {
    return (
      <input
        ref={inputRef}
        type={type}
        value={local}
        onChange={(e) => setLocal(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => { if (e.key === "Enter") commit(); if (e.key === "Escape") setEditing(false); }}
        className={cn(
          "w-full bg-input border border-primary/40 rounded px-2 py-1 text-sm text-foreground outline-none",
          className
        )}
        autoFocus
        step={type === "number" ? 0.01 : undefined}
        min={type === "number" ? 0 : undefined}
      />
    );
  }

  return (
    <span
      onClick={() => { setLocal(String(value)); setEditing(true); }}
      className={cn(
        "cursor-pointer hover:text-primary transition-colors px-1 rounded",
        "hover:bg-primary/5",
        className
      )}
    >
      {value}
    </span>
  );
}

export default function SmartSheet() {
  const utils = trpc.useUtils();
  const { data: rows = [], isLoading } = trpc.smartSheet.list.useQuery();

  const createRow = trpc.smartSheet.create.useMutation({
    onSuccess: () => utils.smartSheet.list.invalidate(),
    onError: () => toast.error("Erro ao adicionar linha"),
  });

  const updateRow = trpc.smartSheet.update.useMutation({
    onSuccess: () => utils.smartSheet.list.invalidate(),
  });

  const deleteRow = trpc.smartSheet.delete.useMutation({
    onSuccess: () => utils.smartSheet.list.invalidate(),
    onError: () => toast.error("Erro ao remover linha"),
  });

  const duplicateRow = trpc.smartSheet.duplicate.useMutation({
    onSuccess: () => { utils.smartSheet.list.invalidate(); toast.success("Linha duplicada!"); },
    onError: () => toast.error("Erro ao duplicar"),
  });

  const handleUpdate = (id: number, field: string, value: string | number) => {
    updateRow.mutate({ id, [field]: typeof value === "string" ? value : Number(value) });
  };

  const totalProfit = rows.reduce((sum, r) => sum + r.profit, 0);
  const avgMargin = rows.length > 0 ? rows.reduce((sum, r) => sum + r.margin, 0) / rows.length : 0;
  const profitableCount = rows.filter((r) => r.profit >= 0).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Planilha Inteligente</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Simule cenários de precificação — clique em qualquer célula para editar
          </p>
        </div>
        <Button
          onClick={() => createRow.mutate({})}
          disabled={createRow.isPending}
          className="gradient-neon text-black font-semibold"
        >
          <Plus className="w-4 h-4 mr-2" />
          Adicionar Linha
        </Button>
      </div>

      {/* Summary bar */}
      {rows.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Lucro Total", value: fmt(totalProfit), positive: totalProfit >= 0 },
            { label: "Margem Média", value: fmtPct(avgMargin), positive: avgMargin >= 20 },
            { label: "Lucrativos", value: `${profitableCount}/${rows.length}`, positive: profitableCount === rows.length },
          ].map(({ label, value, positive }) => (
            <div key={label} className="bg-card border border-border rounded-xl p-3 text-center">
              <p className={cn("text-lg font-display font-bold", positive ? "text-emerald-400" : "text-red-400")}>
                {value}
              </p>
              <p className="text-xs text-muted-foreground">{label}</p>
            </div>
          ))}
        </div>
      )}

      {isLoading ? (
        <div className="h-40 bg-card border border-border rounded-xl animate-pulse" />
      ) : rows.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-12 text-center">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <FileSpreadsheet className="w-8 h-8 text-primary" />
          </div>
          <h3 className="font-display font-semibold text-foreground mb-2">Planilha vazia</h3>
          <p className="text-muted-foreground text-sm mb-4">
            Adicione produtos para simular cenários de precificação
          </p>
          <Button onClick={() => createRow.mutate({})} className="gradient-neon text-black font-semibold">
            <Plus className="w-4 h-4 mr-2" />
            Adicionar Primeiro Produto
          </Button>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  {["Produto", "Custo (R$)", "Preço (R$)", "Taxas (%)", "Frete (R$)", "Anúncios (R$)", "Lucro", "Margem", ""].map((h) => (
                    <th key={h} className="text-left px-3 py-3 text-muted-foreground font-medium text-xs whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const isProfit = row.profit >= 0;
                  return (
                    <tr
                      key={row.id}
                      className={cn(
                        "border-b border-border/50 transition-colors",
                        isProfit ? "hover:bg-emerald-500/3" : "hover:bg-red-500/3"
                      )}
                    >
                      <td className="px-3 py-2.5">
                        <EditableCell
                          value={row.productName}
                          onSave={(v) => handleUpdate(row.id, "productName", v)}
                          className="font-medium text-foreground min-w-[120px]"
                        />
                      </td>
                      <td className="px-3 py-2.5">
                        <EditableCell
                          value={Number(row.cost)}
                          type="number"
                          onSave={(v) => handleUpdate(row.id, "cost", v)}
                          className="text-foreground"
                        />
                      </td>
                      <td className="px-3 py-2.5">
                        <EditableCell
                          value={Number(row.price)}
                          type="number"
                          onSave={(v) => handleUpdate(row.id, "price", v)}
                          className="text-foreground"
                        />
                      </td>
                      <td className="px-3 py-2.5">
                        <EditableCell
                          value={Number(row.taxes)}
                          type="number"
                          onSave={(v) => handleUpdate(row.id, "taxes", v)}
                          className="text-foreground"
                        />
                      </td>
                      <td className="px-3 py-2.5">
                        <EditableCell
                          value={Number(row.freight)}
                          type="number"
                          onSave={(v) => handleUpdate(row.id, "freight", v)}
                          className="text-foreground"
                        />
                      </td>
                      <td className="px-3 py-2.5">
                        <EditableCell
                          value={Number(row.ads)}
                          type="number"
                          onSave={(v) => handleUpdate(row.id, "ads", v)}
                          className="text-foreground"
                        />
                      </td>
                      <td className={cn("px-3 py-2.5 font-semibold whitespace-nowrap", isProfit ? "text-emerald-400" : "text-red-400")}>
                        <span className="flex items-center gap-1">
                          {isProfit
                            ? <TrendingUp className="w-3 h-3" />
                            : <TrendingDown className="w-3 h-3" />
                          }
                          {fmt(row.profit)}
                        </span>
                      </td>
                      <td className={cn(
                        "px-3 py-2.5 font-semibold whitespace-nowrap",
                        row.margin >= 20 ? "text-emerald-400" : row.margin >= 10 ? "text-yellow-400" : "text-red-400"
                      )}>
                        {fmtPct(row.margin)}
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => duplicateRow.mutate({ id: row.id })}
                            className="p-1.5 rounded text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                            title="Duplicar"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => deleteRow.mutate({ id: row.id })}
                            className="p-1.5 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                            title="Remover"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-2 border-t border-border bg-muted/10 text-xs text-muted-foreground">
            💡 Clique em qualquer célula para editar. As cores indicam: <span className="text-emerald-400">verde = lucro</span>, <span className="text-red-400">vermelho = prejuízo</span>
          </div>
        </div>
      )}
    </div>
  );
}

function TrendingDown({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} width="14" height="14">
      <polyline points="23 18 13.5 8.5 8.5 13.5 1 6" />
      <polyline points="17 18 23 18 23 12" />
    </svg>
  );
}
