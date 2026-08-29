import {
  decimal,
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).unique(),
  email: varchar("email", { length: 320 }).unique(),
  name: text("name"),
  passwordHash: text("passwordHash"),
  loginMethod: varchar("loginMethod", { length: 64 }).default("oauth"),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ─── Products ────────────────────────────────────────────────────────────────

export const products = mysqlTable("products", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  category: varchar("category", { length: 128 }),
  supplier: varchar("supplier", { length: 255 }),
  cost: decimal("cost", { precision: 12, scale: 2 }).notNull().default("0"),
  suggestedPrice: decimal("suggestedPrice", { precision: 12, scale: 2 }).default("0"),
  currentPrice: decimal("currentPrice", { precision: 12, scale: 2 }).default("0"),
  taxes: decimal("taxes", { precision: 5, scale: 2 }).default("0"),
  freight: decimal("freight", { precision: 12, scale: 2 }).default("0"),
  ads: decimal("ads", { precision: 12, scale: 2 }).default("0"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Product = typeof products.$inferSelect;
export type InsertProduct = typeof products.$inferInsert;

// ─── Price History ────────────────────────────────────────────────────────────

export const priceHistory = mysqlTable("priceHistory", {
  id: int("id").autoincrement().primaryKey(),
  productId: int("productId").notNull(),
  price: decimal("price", { precision: 12, scale: 2 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PriceHistory = typeof priceHistory.$inferSelect;

// ─── Cash Flow ────────────────────────────────────────────────────────────────

export const cashFlowEntries = mysqlTable("cashFlowEntries", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  type: mysqlEnum("type", ["income", "expense"]).notNull(),
  category: varchar("category", { length: 128 }).notNull().default("Geral"),
  description: varchar("description", { length: 255 }).notNull(),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  date: timestamp("date").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CashFlowEntry = typeof cashFlowEntries.$inferSelect;
export type InsertCashFlowEntry = typeof cashFlowEntries.$inferInsert;

// ─── Smart Sheet ──────────────────────────────────────────────────────────────

export const smartSheetRows = mysqlTable("smartSheetRows", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  productName: varchar("productName", { length: 255 }).notNull().default("Novo Produto"),
  cost: decimal("cost", { precision: 12, scale: 2 }).notNull().default("0"),
  price: decimal("price", { precision: 12, scale: 2 }).notNull().default("0"),
  taxes: decimal("taxes", { precision: 5, scale: 2 }).notNull().default("0"),
  freight: decimal("freight", { precision: 12, scale: 2 }).notNull().default("0"),
  ads: decimal("ads", { precision: 12, scale: 2 }).notNull().default("0"),
  sortOrder: int("sortOrder").notNull().default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SmartSheetRow = typeof smartSheetRows.$inferSelect;
export type InsertSmartSheetRow = typeof smartSheetRows.$inferInsert;
