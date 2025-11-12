import request from "supertest";
import { describe, it, expect, vi, beforeEach } from "vitest";

const P1 = "11111111-1111-4111-8111-111111111111";
const P2 = "22222222-2222-4222-8222-222222222222";
const MISSING = "33333333-3333-4333-8333-333333333333";

// Hoisted prisma mock
const prismaMock = vi.hoisted(() => ({
  product: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    update: vi.fn(),
  },
  order: {
    create: vi.fn(),
    findUniqueOrThrow: vi.fn(),
    findMany: vi.fn(),
  },
  orderItem: {
    createMany: vi.fn(),
  },
  $transaction: vi.fn(),
}));

// Mock prisma first
vi.mock("../src/libs/prisma.js", () => ({ prisma: prismaMock as any }));

// Mock auth as authenticated USER
vi.mock("../src/middlewares/auth.js", () => ({
  requireAuth: (_req: any, _res: any, next: any) => {
    _req.user = { userId: "user-1", username: "u", role: "USER" };
    next();
  },
  requireAdmin: (_req: any, _res: any, next: any) => next(),
}));

// Import app after mocks
const { default: app } = await import("../src/app.js");

beforeEach(() => {
  vi.clearAllMocks();
});

describe("POST /api/v1/orders", () => {
  it("places an order transactionally and decrements stock", async () => {
    const items = [
      { productId: P1, quantity: 2 },
      { productId: P2, quantity: 1 },
    ];

    prismaMock.product.findMany.mockResolvedValue([
      { id: P1, price: "100", stock: 5, name: "A" },
      { id: P2, price: "200", stock: 1, name: "B" },
    ]);

    // Mock the transaction flow
    prismaMock.$transaction.mockImplementation(async (cb: any) => {
      const tx = {
        order: {
          create: vi.fn().mockResolvedValue({ id: "o1" }),
          findUniqueOrThrow: vi.fn().mockResolvedValue({
            id: "o1",
            userId: "user-1",
            description: "test",
            totalPrice: "400", // (2 * 100) + (1 * 200)
            status: "pending",
            createdAt: new Date(),
            updatedAt: new Date(),
            items: [
              {
                id: "oi1",
                orderId: "o1",
                productId: P1,
                quantity: 2,
                price: "100",
                product: { id: P1, name: "A", imageUrl: null },
              },
              {
                id: "oi2",
                orderId: "o1",
                productId: P2,
                quantity: 1,
                price: "200",
                product: { id: P2, name: "B", imageUrl: null },
              },
            ],
          }),
        },
        orderItem: {
          createMany: vi.fn().mockResolvedValue({ count: 2 }),
        },
        product: {
          update: vi.fn().mockResolvedValue({}),
        },
      };
      return cb(tx);
    });

    const res = await request(app)
      .post("/api/v1/orders")
      .set("Authorization", "Bearer test")
      .send({ items, description: "test" })
      .expect(201);

    expect(res.body.success).toBe(true);
    expect(res.body.object.id).toBe("o1");
    expect(res.body.object.items).toHaveLength(2);
    expect(res.body.object.totalPrice).toBe(400); // normalized to number
  });

  it("fails with 400 if insufficient stock", async () => {
    // Request uses valid UUIDs
    const items = [{ productId: P1, quantity: 2 }];

    // Only one product returned, but with stock 1 (insufficient)
    prismaMock.product.findMany.mockResolvedValue([
      { id: P1, price: "100", stock: 1, name: "A" },
    ]);

    const res = await request(app)
      .post("/api/v1/orders")
      .set("Authorization", "Bearer test")
      .send({ items })
      .expect(400);

    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/Insufficient stock/i);
  });

  it("fails with 404 if product missing", async () => {
    const items = [{ productId: MISSING, quantity: 1 }];

    // No products found for requested IDs
    prismaMock.product.findMany.mockResolvedValue([]);

    const res = await request(app)
      .post("/api/v1/orders")
      .set("Authorization", "Bearer test")
      .send({ items })
      .expect(404);

    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/Product\(s\) not found/i);
  });
});

describe("GET /api/v1/orders", () => {
  it("returns only my orders (summary)", async () => {
    prismaMock.order.findMany.mockResolvedValue([
      {
        id: "o1",
        status: "pending",
        totalPrice: "150",
        createdAt: new Date(),
        items: [
          { productId: P1, quantity: 1, price: "50" },
          { productId: P2, quantity: 2, price: "50" },
        ],
      },
    ]);

    const res = await request(app)
      .get("/api/v1/orders")
      .set("Authorization", "Bearer test")
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.object)).toBe(true);
    expect(res.body.object[0]).toHaveProperty("itemsCount", 3);
    expect(typeof res.body.object[0].totalPrice).toBe("number");
  });
});
