import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Plus, Pencil, Trash2, Package, TrendingUp, TrendingDown, X, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";

const fmt = (v: number | string) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(v));
const fmtPct = (v: number) => `${Number(v).toFixed(1)}%`;

interface ProductFormData {
  name: string;
  category: string;
  supplier: string;
  cost: number;
  currentPrice: number;
  taxes: number;
  freight: number;
  ads: number;
  notes: string;
}

const defaultForm: ProductFormData = {
  name: "", category: "", supplier: "", cost: 0,
  currentPrice: 0, taxes: 0, freight: 0, ads: 0, notes: ""
};

export default function Products() {
  const utils = trpc.useUtils();
  const { data: products = [], isLoading } = trpc.products.list.useQuery();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<ProductFormData>(defaultForm);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const createProduct = trpc.products.create.useMutation({
    onSuccess: () => {
      utils.products.list.invalidate();
      utils.dashboard.summary.invalidate();
      toast.success("Produto criado com sucesso!");
      setOpen(false);
      setForm(defaultForm);
    },
    onError: () => toast.error("Erro ao criar produto"),
  });

  const updateProduct = trpc.products.update.useMutation({
    onSuccess: () => {
      utils.products.list.invalidate();
      utils.dashboard.summary.invalidate();
      toast.success("Produto atualizado!");
      setOpen(false);
      setEditId(null);
      setForm(defaultForm);
    },
    onError: () => toast.error("Erro ao atualizar produto"),
  });

  const deleteProduct = trpc.products.delete.useMutation({
    onSuccess: () => {
      utils.products.list.invalidate();
      utils.dashboard.summary.invalidate();
      toast.success("Produto removido");
    },
    onError: () => toast.error("Erro ao remover produto"),
  });

  const handleSubmit = () => {
    if (!form.name.trim()) return toast.error("Nome é obrigatório");
    if (editId) {
      updateProduct.mutate({ id: editId, ...form });
    } else {
      createProduct.mutate(form);
    }
  };

  const handleEdit = (p: typeof products[0]) => {
    setEditId(p.id);
    setForm({
      name: p.name,
      category: p.category ?? "",
      supplier: p.supplier ?? "",
      cost: Number(p.cost),
      currentPrice: Number(p.currentPrice),
      taxes: Number(p.taxes),
      freight: Number(p.freight),
      ads: Number(p.ads),
      notes: p.notes ?? "",
    });
    setOpen(true);
  };

  const handleNew = () => {
    setEditId(null);
    setForm(defaultForm);
    setOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Produtos</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {products.length} produto{products.length !== 1 ? "s" : ""} cadastrado{products.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Button onClick={handleNew} className="gradient-neon text-black font-semibold">
          <Plus className="w-4 h-4 mr-2" />
          Novo Produto
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-20 bg-card border border-border rounded-xl animate-pulse" />
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-12 text-center">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Package className="w-8 h-8 text-primary" />
          </div>
          <h3 className="font-display font-semibold text-foreground mb-2">Nenhum produto ainda</h3>
          <p className="text-muted-foreground text-sm mb-4">
            Cadastre seus produtos para monitorar a lucratividade
          </p>
          <Button onClick={handleNew} className="gradient-neon text-black font-semibold">
            <Plus className="w-4 h-4 mr-2" />
            Cadastrar Primeiro Produto
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {products.map((p) => {
            const isProfit = p.profit >= 0;
            const isExpanded = expandedId === p.id;
            return (
              <div key={p.id} className="bg-card border border-border rounded-xl overflow-hidden card-hover">
                <div
                  className="flex items-center gap-4 p-4 cursor-pointer"
                  onClick={() => setExpandedId(isExpanded ? null : p.id)}
                >
                  <div className={cn(
                    "w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0",
                    isProfit ? "bg-emerald-500/10" : "bg-red-500/10"
                  )}>
                    {isProfit
                      ? <TrendingUp className="w-5 h-5 text-emerald-400" />
                      : <TrendingDown className="w-5 h-5 text-red-400" />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-foreground truncate">{p.name}</p>
                      {p.category && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary flex-shrink-0">
                          {p.category}
                        </span>
                      )}
                    </div>
                    {p.supplier && <p className="text-xs text-muted-foreground truncate">{p.supplier}</p>}
                  </div>
                  <div className="hidden sm:flex items-center gap-6 text-sm">
                    <div className="text-right">
                      <p className="text-muted-foreground text-xs">Preço</p>
                      <p className="font-medium text-foreground">{fmt(p.currentPrice ?? 0)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-muted-foreground text-xs">Lucro</p>
                      <p className={cn("font-medium", isProfit ? "text-emerald-400" : "text-red-400")}>
                        {fmt(p.profit)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-muted-foreground text-xs">Margem</p>
                      <p className={cn(
                        "font-medium",
                        p.margin >= 20 ? "text-emerald-400" : p.margin >= 10 ? "text-yellow-400" : "text-red-400"
                      )}>
                        {fmtPct(p.margin)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => { e.stopPropagation(); handleEdit(p); }}
                      className="text-muted-foreground hover:text-primary h-8 w-8 p-0"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => { e.stopPropagation(); deleteProduct.mutate({ id: p.id }); }}
                      className="text-muted-foreground hover:text-destructive h-8 w-8 p-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                    <ChevronDown className={cn(
                      "w-4 h-4 text-muted-foreground transition-transform",
                      isExpanded && "rotate-180"
                    )} />
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t border-border px-4 py-3 bg-muted/20">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                      {[
                        { label: "Custo", value: fmt(p.cost) },
                        { label: "Frete", value: fmt(p.freight ?? 0) },
                        { label: "Anúncios", value: fmt(p.ads ?? 0) },
                        { label: `Taxas`, value: `${p.taxes ?? 0}%` },
                        { label: "Custo Total", value: fmt(p.totalCost) },
                        { label: "Break-even", value: fmt(p.breakEven) },
                        { label: "Preço Ideal", value: fmt(p.idealPrice) },
                        { label: "Margem", value: fmtPct(p.margin) },
                      ].map(({ label, value }) => (
                        <div key={label}>
                          <p className="text-muted-foreground text-xs">{label}</p>
                          <p className="font-medium text-foreground">{value}</p>
                        </div>
                      ))}
                    </div>
                    {p.notes && (
                      <p className="text-xs text-muted-foreground mt-2 pt-2 border-t border-border">
                        📝 {p.notes}
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-card border-border text-foreground max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display">
              {editId ? "Editar Produto" : "Novo Produto"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <Label className="text-sm text-muted-foreground">Nome *</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="mt-1 bg-input border-border"
                  placeholder="Ex: Camiseta Premium"
                />
              </div>
              <div>
                <Label className="text-sm text-muted-foreground">Categoria</Label>
                <Input
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="mt-1 bg-input border-border"
                  placeholder="Ex: Roupas"
                />
              </div>
              <div>
                <Label className="text-sm text-muted-foreground">Fornecedor</Label>
                <Input
                  value={form.supplier}
                  onChange={(e) => setForm({ ...form, supplier: e.target.value })}
                  className="mt-1 bg-input border-border"
                  placeholder="Ex: Fornecedor ABC"
                />
              </div>
              {[
                { key: "cost", label: "Custo (R$)" },
                { key: "currentPrice", label: "Preço de Venda (R$)" },
                { key: "taxes", label: "Taxas (%)" },
                { key: "freight", label: "Frete (R$)" },
                { key: "ads", label: "Anúncios (R$)" },
              ].map(({ key, label }) => (
                <div key={key}>
                  <Label className="text-sm text-muted-foreground">{label}</Label>
                  <Input
                    type="number"
                    value={form[key as keyof ProductFormData]}
                    onChange={(e) => setForm({ ...form, [key]: parseFloat(e.target.value) || 0 })}
                    className="mt-1 bg-input border-border"
                    min={0}
                    step={0.01}
                  />
                </div>
              ))}
              <div className="col-span-2">
                <Label className="text-sm text-muted-foreground">Observações</Label>
                <Input
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className="mt-1 bg-input border-border"
                  placeholder="Notas adicionais..."
                />
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => setOpen(false)}
                className="flex-1 border-border"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={createProduct.isPending || updateProduct.isPending}
                className="flex-1 gradient-neon text-black font-semibold"
              >
                {editId ? "Salvar" : "Criar Produto"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
