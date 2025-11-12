import request from "supertest";
import { describe, it, expect, vi, beforeEach } from "vitest";

// Create the prisma mock in a hoisted block
const prismaMock = vi.hoisted(() => ({
  product: {
    findMany: vi.fn(),
    count: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
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

// Mock prisma BEFORE importing app
vi.mock("../src/libs/prisma.js", () => ({ prisma: prismaMock as any }));

// Mock auth to bypass real JWT (hoisted)
vi.mock("../src/middlewares/auth.js", () => ({
  requireAuth: (_req: any, _res: any, next: any) => {
    _req.user = { userId: "user-1", username: "u", role: "ADMIN" };
    next();
  },
  requireAdmin: (_req: any, _res: any, next: any) => next(),
}));

// Import app AFTER mocks
const { default: app } = await import("../src/app.js");

beforeEach(() => {
  vi.clearAllMocks();
});

describe("GET /api/v1/products (search + pagination)", () => {
  it("returns paginated products with spec keys", async () => {
    prismaMock.product.count.mockResolvedValue(2);
    prismaMock.product.findMany.mockResolvedValue([
      {
        id: "p1",
        name: "Samsung S-23",
        description: "Flagship",
        price: "30000",
        stock: 5,
        category: "Mobile",
        imageUrl: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "p2",
        name: "Galaxy Buds",
        description: "Earbuds",
        price: "2999",
        stock: 10,
        category: "Audio",
        imageUrl: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);

    const res = await request(app)
      .get("/api/v1/products?search=galaxy&page=1&pageSize=10")
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.currentPage).toBe(1);
    expect(res.body.pageSize).toBe(10);
    expect(res.body.totalPages).toBe(1);
    expect(res.body.totalProducts).toBe(2);
    expect(Array.isArray(res.body.products)).toBe(true);
    // price should be normalized to number
    expect(typeof res.body.products[0].price).toBe("number");
  });
});

describe("POST /api/v1/products (create)", () => {
  it("creates a product and returns 201", async () => {
    prismaMock.product.create.mockResolvedValue({
      id: "p3",
      name: "New Phone",
      description: "A very nice phone", // >= 10 chars for Zod
      price: 1000,
      stock: 2,
      category: "Mobile",
      imageUrl: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const res = await request(app)
      .post("/api/v1/products")
      .set("Authorization", "Bearer test")
      .send({
        name: "New Phone",
        description: "A very nice phone", // >= 10 chars
        price: 1000,
        stock: 2,
        category: "Mobile",
      })
      .expect(201);

    expect(res.body.success).toBe(true);
    expect(res.body.object.name).toBe("New Phone");
    expect(prismaMock.product.create).toHaveBeenCalledTimes(1);
  });

  it("validates bad input", async () => {
    const res = await request(app)
      .post("/api/v1/products")
      .set("Authorization", "Bearer test")
      .send({
        name: "x", // too short
        description: "too short", // too short
        price: -1, // invalid
        stock: -5, // invalid
      })
      .expect(400);

    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/Validation error/i);
  });
});
