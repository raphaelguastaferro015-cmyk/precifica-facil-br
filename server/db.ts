import { and, desc, eq, gte, lte, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, cashFlowEntries, priceHistory, products, smartSheetRows, users } from "../drizzle/schema";
import type { InsertCashFlowEntry, InsertProduct, InsertSmartSheetRow } from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ─── Users ────────────────────────────────────────────────────────────────────

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) { console.warn("[Database] Cannot upsert user: database not available"); return; }
  try {
    const values: InsertUser = { openId: user.openId };
    const updateSet: Record<string, unknown> = {};
    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];
    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };
    textFields.forEach(assignNullable);
    if (user.lastSignedIn !== undefined) { values.lastSignedIn = user.lastSignedIn; updateSet.lastSignedIn = user.lastSignedIn; }
    if (user.role !== undefined) { values.role = user.role; updateSet.role = user.role; }
    else if (user.openId === ENV.ownerOpenId) { values.role = "admin"; updateSet.role = "admin"; }
    if (!values.lastSignedIn) values.lastSignedIn = new Date();
    if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();
    await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserByEmail(email: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createLocalUser(email: string, name: string, passwordHash: string) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const existing = await getUserByEmail(email);
  if (existing) throw new Error("Email já cadastrado");
  const result = await db.insert(users).values({
    email,
    name,
    passwordHash,
    loginMethod: "local",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  });
  return result;
}

// ─── Products ─────────────────────────────────────────────────────────────────

export async function getProductsByUser(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(products).where(eq(products.userId, userId)).orderBy(desc(products.createdAt));
}

export async function createProduct(data: InsertProduct) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const [result] = await db.insert(products).values(data);
  return result;
}

export async function updateProduct(id: number, userId: number, data: Partial<InsertProduct>) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(products).set(data).where(and(eq(products.id, id), eq(products.userId, userId)));
}

export async function deleteProduct(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.delete(priceHistory).where(eq(priceHistory.productId, id));
  await db.delete(products).where(and(eq(products.id, id), eq(products.userId, userId)));
}

export async function getPriceHistory(productId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(priceHistory).where(eq(priceHistory.productId, productId)).orderBy(desc(priceHistory.createdAt));
}

export async function addPriceHistory(productId: number, price: string) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.insert(priceHistory).values({ productId, price });
}

// ─── Cash Flow ────────────────────────────────────────────────────────────────

export async function getCashFlowEntries(userId: number, from?: Date, to?: Date) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [eq(cashFlowEntries.userId, userId)];
  if (from) conditions.push(gte(cashFlowEntries.date, from));
  if (to) conditions.push(lte(cashFlowEntries.date, to));
  return db.select().from(cashFlowEntries).where(and(...conditions)).orderBy(desc(cashFlowEntries.date));
}

export async function createCashFlowEntry(data: InsertCashFlowEntry) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const [result] = await db.insert(cashFlowEntries).values(data);
  return result;
}

export async function deleteCashFlowEntry(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.delete(cashFlowEntries).where(and(eq(cashFlowEntries.id, id), eq(cashFlowEntries.userId, userId)));
}

export async function getCashFlowSummary(userId: number) {
  const db = await getDb();
  if (!db) return { totalIncome: 0, totalExpense: 0, balance: 0 };
  const rows = await db
    .select({
      type: cashFlowEntries.type,
      total: sql<string>`SUM(${cashFlowEntries.amount})`,
    })
    .from(cashFlowEntries)
    .where(eq(cashFlowEntries.userId, userId))
    .groupBy(cashFlowEntries.type);
  let totalIncome = 0, totalExpense = 0;
  for (const row of rows) {
    if (row.type === "income") totalIncome = parseFloat(row.total ?? "0");
    else totalExpense = parseFloat(row.total ?? "0");
  }
  return { totalIncome, totalExpense, balance: totalIncome - totalExpense };
}

// ─── Smart Sheet ──────────────────────────────────────────────────────────────

export async function getSmartSheetRows(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(smartSheetRows).where(eq(smartSheetRows.userId, userId)).orderBy(smartSheetRows.sortOrder, smartSheetRows.createdAt);
}

export async function createSmartSheetRow(data: InsertSmartSheetRow) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const [result] = await db.insert(smartSheetRows).values(data);
  return result;
}

export async function updateSmartSheetRow(id: number, userId: number, data: Partial<InsertSmartSheetRow>) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(smartSheetRows).set(data).where(and(eq(smartSheetRows.id, id), eq(smartSheetRows.userId, userId)));
}

export async function deleteSmartSheetRow(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.delete(smartSheetRows).where(and(eq(smartSheetRows.id, id), eq(smartSheetRows.userId, userId)));
}

// ─── Dashboard Summary ────────────────────────────────────────────────────────

export async function getDashboardSummary(userId: number) {
  const db = await getDb();
  if (!db) return { totalRevenue: 0, totalExpenses: 0, totalProfit: 0, avgMargin: 0, productCount: 0 };

  const cashSummary = await getCashFlowSummary(userId);
  const userProducts = await getProductsByUser(userId);

  const productCount = userProducts.length;
  let totalProductRevenue = 0;
  let totalProductCost = 0;
  let marginSum = 0;
  let marginCount = 0;

  for (const p of userProducts) {
    const price = parseFloat(p.currentPrice ?? "0");
    const cost = parseFloat(p.cost ?? "0");
    const taxes = parseFloat(p.taxes ?? "0");
    const freight = parseFloat(p.freight ?? "0");
    const ads = parseFloat(p.ads ?? "0");
    const totalCost = cost + freight + ads + (price * taxes) / 100;
    const profit = price - totalCost;
    const margin = price > 0 ? (profit / price) * 100 : 0;
    totalProductRevenue += price;
    totalProductCost += totalCost;
    if (price > 0) { marginSum += margin; marginCount++; }
  }

  const avgMargin = marginCount > 0 ? marginSum / marginCount : 0;
  const totalRevenue = cashSummary.totalIncome + totalProductRevenue;
  const totalExpenses = cashSummary.totalExpense + totalProductCost;
  const totalProfit = cashSummary.balance + (totalProductRevenue - totalProductCost);

  return { totalRevenue, totalExpenses, totalProfit, avgMargin, productCount };
}

// ─── Reports ──────────────────────────────────────────────────────────────────

export async function getReportProfitByProduct(userId: number) {
  const userProducts = await getProductsByUser(userId);
  return userProducts.map((p) => {
    const price = parseFloat(p.currentPrice ?? "0");
    const cost = parseFloat(p.cost ?? "0");
    const taxes = parseFloat(p.taxes ?? "0");
    const freight = parseFloat(p.freight ?? "0");
    const ads = parseFloat(p.ads ?? "0");
    const totalCost = cost + freight + ads + (price * taxes) / 100;
    const profit = price - totalCost;
    const margin = price > 0 ? (profit / price) * 100 : 0;
    return { id: p.id, name: p.name, category: p.category, cost: totalCost, price, profit, margin };
  }).sort((a, b) => b.profit - a.profit);
}

export async function getReportCashFlowByMonth(userId: number) {
  const db = await getDb();
  if (!db) return [];
  const rows = await db
    .select({
      month: sql<string>`DATE_FORMAT(${cashFlowEntries.date}, '%Y-%m')`,
      type: cashFlowEntries.type,
      total: sql<string>`SUM(${cashFlowEntries.amount})`,
    })
    .from(cashFlowEntries)
    .where(eq(cashFlowEntries.userId, userId))
    .groupBy(sql`DATE_FORMAT(${cashFlowEntries.date}, '%Y-%m')`, cashFlowEntries.type)
    .orderBy(sql`DATE_FORMAT(${cashFlowEntries.date}, '%Y-%m')`);

  const byMonth: Record<string, { month: string; income: number; expense: number; profit: number }> = {};
  for (const row of rows) {
    const m = row.month ?? "";
    if (!byMonth[m]) byMonth[m] = { month: m, income: 0, expense: 0, profit: 0 };
    if (row.type === "income") byMonth[m].income = parseFloat(row.total ?? "0");
    else byMonth[m].expense = parseFloat(row.total ?? "0");
  }
  for (const m of Object.values(byMonth)) m.profit = m.income - m.expense;
  return Object.values(byMonth);
}
