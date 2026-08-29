import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user-001",
    email: "test@precificafacil.com",
    name: "Test User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };

  return { ctx };
}

// ─── Pricing Calculator Tests ─────────────────────────────────────────────────
describe("pricing.calculate", () => {
  it("calculates profit correctly for a profitable product", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.pricing.calculate({
      cost: 50,
      price: 100,
      taxes: 10,
      freight: 5,
      ads: 5,
      desiredMargin: 30,
    });

    // totalCost = 50 + 5 + 5 + (100 * 10/100) = 50 + 5 + 5 + 10 = 70
    expect(result.totalCost).toBeCloseTo(70, 1);
    // profit = 100 - 70 = 30
    expect(result.profit).toBeCloseTo(30, 1);
    // margin = (30 / 100) * 100 = 30%
    expect(result.margin).toBeCloseTo(30, 1);
    // breakEven = totalCost = 70
    expect(result.breakEven).toBeCloseTo(70, 1);
  });

  it("calculates negative profit for an underpriced product", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.pricing.calculate({
      cost: 100,
      price: 80,
      taxes: 10,
      freight: 10,
      ads: 10,
      desiredMargin: 30,
    });

    // totalCost = 100 + 10 + 10 + (80 * 10/100) = 100 + 10 + 10 + 8 = 128
    expect(result.totalCost).toBeCloseTo(128, 1);
    // profit = 80 - 128 = -48
    expect(result.profit).toBeLessThan(0);
    expect(result.margin).toBeLessThan(0);
  });

  it("calculates idealPrice for desired margin", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.pricing.calculate({
      cost: 50,
      price: 100,
      taxes: 0,
      freight: 0,
      ads: 0,
      desiredMargin: 50,
    });

    // With 0 taxes/freight/ads: totalCost = 50
    // idealPrice for 50% margin = 50 / (1 - 0.50) = 100
    expect(result.idealPrice).toBeCloseTo(100, 1);
  });

  it("returns an insight string", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.pricing.calculate({
      cost: 50,
      price: 100,
      taxes: 5,
      freight: 0,
      ads: 0,
      desiredMargin: 20,
    });

    expect(result.insight).toBeDefined();
    expect(typeof result.insight).toBe("string");
    expect(result.insight.length).toBeGreaterThan(10);
  });

  it("handles zero price gracefully", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.pricing.calculate({
      cost: 50,
      price: 0,
      taxes: 10,
      freight: 0,
      ads: 0,
      desiredMargin: 30,
    });

    expect(result.profit).toBeLessThan(0);
    expect(result.margin).toBe(0);
  });
});

// ─── Auth Tests ───────────────────────────────────────────────────────────────
describe("auth.me", () => {
  it("returns the authenticated user", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const user = await caller.auth.me();

    expect(user).toBeDefined();
    expect(user?.openId).toBe("test-user-001");
    expect(user?.name).toBe("Test User");
  });

  it("returns null for unauthenticated context", async () => {
    const ctx: TrpcContext = {
      user: null,
      req: { protocol: "https", headers: {} } as TrpcContext["req"],
      res: { clearCookie: () => {} } as TrpcContext["res"],
    };
    const caller = appRouter.createCaller(ctx);

    const user = await caller.auth.me();
    expect(user).toBeNull();
  });
});

// ─── Dashboard Summary Tests ──────────────────────────────────────────────────
describe("dashboard.summary", () => {
  it("returns summary with correct shape", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const summary = await caller.dashboard.summary();

    expect(summary).toHaveProperty("totalRevenue");
    expect(summary).toHaveProperty("totalExpenses");
    expect(summary).toHaveProperty("totalProfit");
    expect(summary).toHaveProperty("avgMargin");
    expect(summary).toHaveProperty("productCount");
    expect(typeof summary.totalRevenue).toBe("number");
    expect(typeof summary.avgMargin).toBe("number");
  });
});
