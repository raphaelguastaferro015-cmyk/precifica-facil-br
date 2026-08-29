import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { TrendingUp, DollarSign, Target, AlertTriangle, CheckCircle2, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";

const fmt = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
const fmtPct = (v: number) => `${v.toFixed(1)}%`;

interface ResultCardProps {
  label: string;
  value: string;
  icon: React.ElementType;
  color?: "primary" | "success" | "danger" | "warning";
  highlight?: boolean;
}

function ResultCard({ label, value, icon: Icon, color = "primary", highlight }: ResultCardProps) {
  return (
    <div className={cn(
      "bg-card border rounded-xl p-4 transition-all",
      highlight ? "border-primary/40 neon-glow" : "border-border",
    )}>
      <div className={cn(
        "w-9 h-9 rounded-lg flex items-center justify-center mb-3",
        color === "primary" && "bg-primary/10",
        color === "success" && "bg-emerald-500/10",
        color === "danger" && "bg-red-500/10",
        color === "warning" && "bg-yellow-500/10",
      )}>
        <Icon className={cn(
          "w-4 h-4",
          color === "primary" && "text-primary",
          color === "success" && "text-emerald-400",
          color === "danger" && "text-red-400",
          color === "warning" && "text-yellow-400",
        )} />
      </div>
      <p className={cn(
        "text-xl font-display font-bold mb-1",
        color === "success" && "text-emerald-400",
        color === "danger" && "text-red-400",
        color === "warning" && "text-yellow-400",
        color === "primary" && "text-primary",
      )}>{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

export default function Pricing() {
  const [cost, setCost] = useState(50);
  const [price, setPrice] = useState(100);
  const [taxes, setTaxes] = useState(10);
  const [freight, setFreight] = useState(5);
  const [ads, setAds] = useState(5);
  const [desiredMargin, setDesiredMargin] = useState(30);

  const calc = trpc.pricing.calculate.useMutation();

  const handleCalculate = () => {
    calc.mutate({ cost, price, taxes, freight, ads, desiredMargin });
  };

  const result = calc.data;
  const isProfit = result ? result.profit >= 0 : null;

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">Calculadora de Precificação</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Descubra o preço ideal e a margem real do seu produto
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Inputs */}
        <div className="bg-card border border-border rounded-xl p-6 space-y-5">
          <h2 className="font-display font-semibold text-foreground flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-primary" />
            Dados do Produto
          </h2>

          <div className="space-y-4">
            <div>
              <Label className="text-sm text-muted-foreground mb-1.5 block">
                Custo do Produto — <span className="text-foreground font-medium">{fmt(cost)}</span>
              </Label>
              <Input
                type="number"
                value={cost}
                onChange={(e) => setCost(parseFloat(e.target.value) || 0)}
                className="bg-input border-border text-foreground"
                placeholder="0,00"
                min={0}
                step={0.01}
              />
            </div>

            <div>
              <Label className="text-sm text-muted-foreground mb-1.5 block">
                Preço de Venda — <span className="text-foreground font-medium">{fmt(price)}</span>
              </Label>
              <Input
                type="number"
                value={price}
                onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
                className="bg-input border-border text-foreground"
                placeholder="0,00"
                min={0}
                step={0.01}
              />
            </div>

            <div>
              <Label className="text-sm text-muted-foreground mb-1.5 block">
                Taxas / Comissões — <span className="text-foreground font-medium">{taxes}%</span>
              </Label>
              <Slider
                value={[taxes]}
                onValueChange={([v]) => setTaxes(v)}
                min={0} max={50} step={0.5}
                className="mt-2"
              />
            </div>

            <div>
              <Label className="text-sm text-muted-foreground mb-1.5 block">
                Frete — <span className="text-foreground font-medium">{fmt(freight)}</span>
              </Label>
              <Input
                type="number"
                value={freight}
                onChange={(e) => setFreight(parseFloat(e.target.value) || 0)}
                className="bg-input border-border text-foreground"
                placeholder="0,00"
                min={0}
                step={0.01}
              />
            </div>

            <div>
              <Label className="text-sm text-muted-foreground mb-1.5 block">
                Custo de Anúncios — <span className="text-foreground font-medium">{fmt(ads)}</span>
              </Label>
              <Input
                type="number"
                value={ads}
                onChange={(e) => setAds(parseFloat(e.target.value) || 0)}
                className="bg-input border-border text-foreground"
                placeholder="0,00"
                min={0}
                step={0.01}
              />
            </div>

            <div>
              <Label className="text-sm text-muted-foreground mb-1.5 block">
                Margem Desejada — <span className="text-foreground font-medium">{desiredMargin}%</span>
              </Label>
              <Slider
                value={[desiredMargin]}
                onValueChange={([v]) => setDesiredMargin(v)}
                min={1} max={80} step={1}
                className="mt-2"
              />
            </div>
          </div>

          <Button
            onClick={handleCalculate}
            disabled={calc.isPending}
            className="w-full gradient-neon text-black font-bold"
          >
            {calc.isPending ? "Calculando..." : "Calcular Precificação"}
            <Zap className="w-4 h-4 ml-2" />
          </Button>
        </div>

        {/* Results */}
        <div className="space-y-4">
          {!result ? (
            <div className="bg-card border border-border rounded-xl p-8 flex flex-col items-center justify-center text-center h-full min-h-[300px]">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <TrendingUp className="w-8 h-8 text-primary" />
              </div>
              <p className="text-muted-foreground text-sm">
                Preencha os dados e clique em <strong className="text-foreground">Calcular</strong> para ver os resultados
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3">
                <ResultCard
                  label="Lucro por Venda"
                  value={fmt(result.profit)}
                  icon={isProfit ? TrendingUp : TrendingDown}
                  color={isProfit ? "success" : "danger"}
                />
                <ResultCard
                  label="Margem Real"
                  value={fmtPct(result.margin)}
                  icon={Target}
                  color={result.margin >= 20 ? "success" : result.margin >= 10 ? "warning" : "danger"}
                />
                <ResultCard
                  label="Preço Ideal"
                  value={fmt(result.idealPrice)}
                  icon={Zap}
                  color="primary"
                  highlight
                />
                <ResultCard
                  label="Ponto de Equilíbrio"
                  value={fmt(result.breakEven)}
                  icon={DollarSign}
                  color="warning"
                />
              </div>

              {/* Insight */}
              <div className={cn(
                "flex items-start gap-3 p-4 rounded-xl border text-sm",
                isProfit
                  ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-300"
                  : "bg-red-500/10 border-red-500/20 text-red-300"
              )}>
                {isProfit
                  ? <CheckCircle2 className="w-5 h-5 mt-0.5 flex-shrink-0" />
                  : <AlertTriangle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                }
                <span className="leading-relaxed">{result.insight}</span>
              </div>

              {/* Breakdown */}
              <div className="bg-card border border-border rounded-xl p-4">
                <h3 className="font-semibold text-sm text-foreground mb-3">Detalhamento de Custos</h3>
                <div className="space-y-2 text-sm">
                  {[
                    { label: "Custo do produto", value: cost },
                    { label: "Frete", value: freight },
                    { label: "Anúncios", value: ads },
                    { label: `Taxas (${taxes}%)`, value: (price * taxes) / 100 },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex justify-between">
                      <span className="text-muted-foreground">{label}</span>
                      <span className="text-foreground font-medium">{fmt(value)}</span>
                    </div>
                  ))}
                  <div className="border-t border-border pt-2 flex justify-between font-semibold">
                    <span className="text-muted-foreground">Custo Total</span>
                    <span className="text-foreground">{fmt(result.totalCost)}</span>
                  </div>
                  <div className="flex justify-between font-bold">
                    <span className="text-muted-foreground">Lucro</span>
                    <span className={isProfit ? "text-emerald-400" : "text-red-400"}>{fmt(result.profit)}</span>
                  </div>
                </div>
              </div>

              {/* Suggestion */}
              {result.idealPrice > price && (
                <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 text-sm">
                  <p className="text-primary font-medium mb-1">💡 Sugestão de Preço</p>
                  <p className="text-muted-foreground">
                    Para atingir <strong className="text-foreground">{desiredMargin}%</strong> de margem, 
                    aumente seu preço para{" "}
                    <strong className="text-primary">{fmt(result.idealPrice)}</strong>
                    {" "}(+{fmt(result.idealPrice - price)})
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// Fix missing import
function TrendingDown({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <polyline points="23 18 13.5 8.5 8.5 13.5 1 6" />
      <polyline points="17 18 23 18 23 12" />
    </svg>
  );
}
