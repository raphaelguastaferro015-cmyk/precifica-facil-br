import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { getSessionCookieOptions } from "./_core/cookies";
import { scryptSync, randomBytes } from "crypto";
import { invokeLLM } from "./_core/llm";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import {
  addPriceHistory,
  createCashFlowEntry,
  createLocalUser,
  createProduct,
  createSmartSheetRow,
  deleteCashFlowEntry,
  deleteProduct,
  deleteSmartSheetRow,
  getCashFlowEntries,
  getCashFlowSummary,
  getDashboardSummary,
  getPriceHistory,
  getProductsByUser,
  getReportCashFlowByMonth,
  getReportProfitByProduct,
  getSmartSheetRows,
  getUserByEmail,
  updateProduct,
  updateSmartSheetRow,
} from "./db";

// ─── Pricing helpers ──────────────────────────────────────────────────────────

function calcPricing(cost: number, taxes: number, freight: number, ads: number, price: number, desiredMargin?: number) {
  const taxAmount = (price * taxes) / 100;
  const totalCost = cost + freight + ads + taxAmount;
  const profit = price - totalCost;
  const margin = price > 0 ? (profit / price) * 100 : 0;
  const breakEven = totalCost;
  // Ideal price for desired margin (default 30%)
  const targetMargin = desiredMargin ?? 30;
  const fixedCost = cost + freight + ads;
  // price = fixedCost / (1 - taxes/100 - targetMargin/100)
  const denominator = 1 - taxes / 100 - targetMargin / 100;
  const idealPrice = denominator > 0 ? fixedCost / denominator : price;
  return { profit, margin, breakEven, idealPrice, totalCost };
}

// ─── App Router ───────────────────────────────────────────────────────────────

export const appRouter = router({
  system: systemRouter,

  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
    signup: publicProcedure
      .input(
        z.object({
          email: z.string().email("Email inválido"),
          name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
          password: z.string()
            .min(8, "Senha deve ter pelo menos 8 caracteres")
            .regex(/[A-Z]/, "Deve conter letra maiúscula")
            .regex(/[0-9]/, "Deve conter número")
            .regex(/[^a-zA-Z0-9]/, "Deve conter símbolo especial"),
        })
      )
      .mutation(async ({ input }) => {
        const existing = await getUserByEmail(input.email);
        if (existing) throw new TRPCError({ code: "CONFLICT", message: "Email já cadastrado" });
        const salt = randomBytes(16).toString("hex");
        const passwordHash = scryptSync(input.password, salt, 32).toString("hex");
        await createLocalUser(input.email, input.name, `${salt}:${passwordHash}`);
        return { success: true, message: "Conta criada com sucesso! Faça login para continuar." };
      }),
    signin: publicProcedure
      .input(
        z.object({
          email: z.string().email("Email inválido"),
          password: z.string().min(1, "Senha obrigatória"),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const user = await getUserByEmail(input.email);
        if (!user || !user.passwordHash) throw new TRPCError({ code: "UNAUTHORIZED", message: "Email ou senha incorretos" });
        const [salt, hash] = user.passwordHash.split(":");
        const inputHash = scryptSync(input.password, salt, 32).toString("hex");
        if (inputHash !== hash) throw new TRPCError({ code: "UNAUTHORIZED", message: "Email ou senha incorretos" });
        
        // Create session token and set cookie
        const { sdk } = await import("./_core/sdk");
        const sessionToken = await sdk.createSessionToken(user.email || `local-${user.id}`, {
          name: user.name || "",
          expiresInMs: ONE_YEAR_MS,
        });
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
        
        return { success: true, userId: user.id, message: "Login realizado com sucesso!" };
      }),
  }),

  // ─── Dashboard ──────────────────────────────────────────────────────────────
  dashboard: router({
    summary: protectedProcedure.query(async ({ ctx }) => {
      return getDashboardSummary(ctx.user.id);
    }),
  }),

  // ─── Pricing Calculator ─────────────────────────────────────────────────────
  pricing: router({
    calculate: protectedProcedure
      .input(
        z.object({
          cost: z.number().min(0),
          taxes: z.number().min(0).max(100),
          freight: z.number().min(0),
          ads: z.number().min(0),
          price: z.number().min(0),
          desiredMargin: z.number().min(0).max(100).optional(),
        })
      )
      .mutation(({ input }) => {
        const { cost, taxes, freight, ads, price, desiredMargin } = input;
        const result = calcPricing(cost, taxes, freight, ads, price, desiredMargin);
        let insight = "";
        if (result.profit < 0) insight = "⚠️ Você está tendo prejuízo com esse preço!";
        else if (result.margin < 10) insight = "📉 Sua margem está muito baixa. Considere aumentar o preço.";
        else if (result.margin < 20) insight = "💡 Margem razoável, mas há espaço para melhorar.";
        else insight = "✅ Boa margem! Seu produto está bem precificado.";
        return { ...result, insight };
      }),
  }),

  // ─── Products ───────────────────────────────────────────────────────────────
  products: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const prods = await getProductsByUser(ctx.user.id);
      return prods.map((p) => {
        const price = parseFloat(p.currentPrice ?? "0");
        const cost = parseFloat(p.cost ?? "0");
        const taxes = parseFloat(p.taxes ?? "0");
        const freight = parseFloat(p.freight ?? "0");
        const ads = parseFloat(p.ads ?? "0");
        const calc = calcPricing(cost, taxes, freight, ads, price);
        return { ...p, ...calc };
      });
    }),

    create: protectedProcedure
      .input(
        z.object({
          name: z.string().min(1),
          category: z.string().optional(),
          supplier: z.string().optional(),
          cost: z.number().min(0),
          currentPrice: z.number().min(0),
          taxes: z.number().min(0).max(100).default(0),
          freight: z.number().min(0).default(0),
          ads: z.number().min(0).default(0),
          notes: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const { cost, taxes, freight, ads, currentPrice } = input;
        const calc = calcPricing(cost, taxes, freight, ads, currentPrice);
        const result = await createProduct({
          userId: ctx.user.id,
          name: input.name,
          category: input.category,
          supplier: input.supplier,
          cost: String(cost),
          currentPrice: String(currentPrice),
          suggestedPrice: String(Math.round(calc.idealPrice * 100) / 100),
          taxes: String(taxes),
          freight: String(freight),
          ads: String(ads),
          notes: input.notes,
        });
        if (currentPrice > 0) await addPriceHistory(result.insertId, String(currentPrice));
        return result;
      }),

    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          name: z.string().min(1).optional(),
          category: z.string().optional(),
          supplier: z.string().optional(),
          cost: z.number().min(0).optional(),
          currentPrice: z.number().min(0).optional(),
          taxes: z.number().min(0).max(100).optional(),
          freight: z.number().min(0).optional(),
          ads: z.number().min(0).optional(),
          notes: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const { id, ...data } = input;
        const updateData: Record<string, string | undefined> = {};
        if (data.name !== undefined) updateData.name = data.name;
        if (data.category !== undefined) updateData.category = data.category;
        if (data.supplier !== undefined) updateData.supplier = data.supplier;
        if (data.cost !== undefined) updateData.cost = String(data.cost);
        if (data.currentPrice !== undefined) {
          updateData.currentPrice = String(data.currentPrice);
          await addPriceHistory(id, String(data.currentPrice));
        }
        if (data.taxes !== undefined) updateData.taxes = String(data.taxes);
        if (data.freight !== undefined) updateData.freight = String(data.freight);
        if (data.ads !== undefined) updateData.ads = String(data.ads);
        if (data.notes !== undefined) updateData.notes = data.notes;
        await updateProduct(id, ctx.user.id, updateData as any);
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await deleteProduct(input.id, ctx.user.id);
        return { success: true };
      }),

    priceHistory: protectedProcedure
      .input(z.object({ productId: z.number() }))
      .query(async ({ input }) => {
        return getPriceHistory(input.productId);
      }),
  }),

  // ─── Cash Flow ──────────────────────────────────────────────────────────────
  cashFlow: router({
    list: protectedProcedure
      .input(
        z.object({
          from: z.date().optional(),
          to: z.date().optional(),
        }).optional()
      )
      .query(async ({ ctx, input }) => {
        return getCashFlowEntries(ctx.user.id, input?.from, input?.to);
      }),

    summary: protectedProcedure.query(async ({ ctx }) => {
      return getCashFlowSummary(ctx.user.id);
    }),

    create: protectedProcedure
      .input(
        z.object({
          type: z.enum(["income", "expense"]),
          category: z.string().min(1),
          description: z.string().min(1),
          amount: z.number().min(0.01),
          date: z.date(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        return createCashFlowEntry({
          userId: ctx.user.id,
          type: input.type,
          category: input.category,
          description: input.description,
          amount: String(input.amount),
          date: input.date,
        });
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await deleteCashFlowEntry(input.id, ctx.user.id);
        return { success: true };
      }),
  }),

  // ─── Smart Sheet ────────────────────────────────────────────────────────────
  smartSheet: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const rows = await getSmartSheetRows(ctx.user.id);
      return rows.map((r) => {
        const price = parseFloat(r.price ?? "0");
        const cost = parseFloat(r.cost ?? "0");
        const taxes = parseFloat(r.taxes ?? "0");
        const freight = parseFloat(r.freight ?? "0");
        const ads = parseFloat(r.ads ?? "0");
        const calc = calcPricing(cost, taxes, freight, ads, price);
        return { ...r, ...calc };
      });
    }),

    create: protectedProcedure
      .input(
        z.object({
          productName: z.string().default("Novo Produto"),
          cost: z.number().min(0).default(0),
          price: z.number().min(0).default(0),
          taxes: z.number().min(0).max(100).default(0),
          freight: z.number().min(0).default(0),
          ads: z.number().min(0).default(0),
        })
      )
      .mutation(async ({ ctx, input }) => {
        return createSmartSheetRow({
          userId: ctx.user.id,
          productName: input.productName,
          cost: String(input.cost),
          price: String(input.price),
          taxes: String(input.taxes),
          freight: String(input.freight),
          ads: String(input.ads),
        });
      }),

    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          productName: z.string().optional(),
          cost: z.number().min(0).optional(),
          price: z.number().min(0).optional(),
          taxes: z.number().min(0).max(100).optional(),
          freight: z.number().min(0).optional(),
          ads: z.number().min(0).optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const { id, ...data } = input;
        const updateData: Record<string, string | undefined> = {};
        if (data.productName !== undefined) updateData.productName = data.productName;
        if (data.cost !== undefined) updateData.cost = String(data.cost);
        if (data.price !== undefined) updateData.price = String(data.price);
        if (data.taxes !== undefined) updateData.taxes = String(data.taxes);
        if (data.freight !== undefined) updateData.freight = String(data.freight);
        if (data.ads !== undefined) updateData.ads = String(data.ads);
        await updateSmartSheetRow(id, ctx.user.id, updateData as any);
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await deleteSmartSheetRow(input.id, ctx.user.id);
        return { success: true };
      }),

    duplicate: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const rows = await getSmartSheetRows(ctx.user.id);
        const row = rows.find((r) => r.id === input.id);
        if (!row) throw new TRPCError({ code: "NOT_FOUND" });
        return createSmartSheetRow({
          userId: ctx.user.id,
          productName: `${row.productName} (cópia)`,
          cost: row.cost,
          price: row.price,
          taxes: row.taxes,
          freight: row.freight,
          ads: row.ads,
        });
      }),
  }),

  // ─── Reports ────────────────────────────────────────────────────────────────
  reports: router({
    profitByProduct: protectedProcedure.query(async ({ ctx }) => {
      return getReportProfitByProduct(ctx.user.id);
    }),
    cashFlowByMonth: protectedProcedure.query(async ({ ctx }) => {
      return getReportCashFlowByMonth(ctx.user.id);
    }),
  }),

  // ─── AI Assistant ────────────────────────────────────────────────────────────
  ai: router({
    chat: protectedProcedure
      .input(z.object({ message: z.string().min(1), history: z.array(z.object({ role: z.enum(["user", "assistant"]), content: z.string() })).optional() }))
      .mutation(async ({ ctx, input }) => {
        const [products, cashSummary, sheetRows] = await Promise.all([
          getProductsByUser(ctx.user.id),
          getCashFlowSummary(ctx.user.id),
          getSmartSheetRows(ctx.user.id),
        ]);

        const productSummary = products.slice(0, 10).map((p) => {
          const price = parseFloat(p.currentPrice ?? "0");
          const cost = parseFloat(p.cost ?? "0");
          const taxes = parseFloat(p.taxes ?? "0");
          const freight = parseFloat(p.freight ?? "0");
          const ads = parseFloat(p.ads ?? "0");
          const calc = calcPricing(cost, taxes, freight, ads, price);
          return `- ${p.name}: custo R$${cost.toFixed(2)}, preço R$${price.toFixed(2)}, lucro R$${calc.profit.toFixed(2)}, margem ${calc.margin.toFixed(1)}%`;
        }).join("\n");

        const systemPrompt = `Você é o Assistente Financeiro do Precifica Fácil, um consultor especialista em precificação e gestão financeira para pequenos negócios e e-commerce no Brasil.

DADOS FINANCEIROS DO USUÁRIO:
- Receita total (fluxo de caixa): R$${cashSummary.totalIncome.toFixed(2)}
- Despesas totais: R$${cashSummary.totalExpense.toFixed(2)}
- Saldo: R$${cashSummary.balance.toFixed(2)}
- Total de produtos cadastrados: ${products.length}

PRODUTOS (top 10):
${productSummary || "Nenhum produto cadastrado ainda."}

PLANILHA INTELIGENTE: ${sheetRows.length} linhas cadastradas.

INSTRUÇÕES:
- Responda em português brasileiro de forma clara, direta e acionável
- Use os dados reais do usuário para personalizar as respostas
- Sugira melhorias concretas com números quando possível
- Seja como um consultor financeiro especializado, não apenas um chatbot
- Formate valores monetários como R$ X,XX
- Use emojis moderadamente para tornar a resposta mais visual`;

        const messages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
          { role: "system", content: systemPrompt },
          ...(input.history ?? []).map((h) => ({ role: h.role as "user" | "assistant", content: h.content })),
          { role: "user", content: input.message },
        ];

        const response = await invokeLLM({ messages });
        const rawContent = response.choices?.[0]?.message?.content;
        const content = typeof rawContent === "string" ? rawContent : (Array.isArray(rawContent) ? rawContent.map((c: any) => c.text ?? "").join("") : "Desculpe, não consegui processar sua pergunta. Tente novamente.");
        return { content };
      }),
  }),
});

export type AppRouter = typeof appRouter;
