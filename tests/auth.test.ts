// tests/auth.test.ts
import request from "supertest";
import { describe, it, expect, vi, beforeEach } from "vitest";

type Role = "USER" | "ADMIN";
type User = {
  id: string;
  username: string;
  email: string;
  password: string; // hashed
  role: Role;
  createdAt: Date;
  updatedAt: Date;
};

// in memory db
const state = vi.hoisted(() => ({
  users: [] as User[],
}));

//prisma mock
const prismaMock = vi.hoisted(() => ({
  user: {
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    create: vi.fn(),
  },
}));

// Mock prisma BEFORE importing app
vi.mock("../src/libs/prisma.js", () => ({ prisma: prismaMock as any }));

// Mock hash helpers
vi.mock("../src/libs/hash.js", () => ({
  hash: vi.fn(async (pw: string) => `hashed:${pw}`),
  compare: vi.fn(
    async (pw: string, hashed: string) => hashed === `hashed:${pw}`
  ),
}));

// 3) Mock JWT
vi.mock("../src/libs/jwt.js", () => ({
  signToken: vi.fn((_payload: any) => "test.jwt.token"),
  verifyToken: vi.fn((_token: string) => ({
    userId: "user-1",
    username: "u",
    role: "USER" as Role,
  })),
}));

// Import app AFTER mocks
const { default: app } = await import("../src/app.js");

beforeEach(() => {
  state.users.length = 0;

  // Helper that finds a matching user given a Prisma-like `where` object
  const matchUser = (where: any): User | null => {
    if (!where) return null;
    if (where.email)
      return state.users.find((u) => u.email === where.email) ?? null;
    if (where.username)
      return state.users.find((u) => u.username === where.username) ?? null;
    if (where.id) return state.users.find((u) => u.id === where.id) ?? null;

    if (Array.isArray(where.OR)) {
      for (const cond of where.OR) {
        const hit = matchUser(cond);
        if (hit) return hit;
      }
      return null;
    }

    if (Array.isArray(where.AND)) {
      const hit = state.users.find((u) =>
        where.AND.every((cond: any) => {
          if (cond.email && u.email !== cond.email) return false;
          if (cond.username && u.username !== cond.username) return false;
          if (cond.id && u.id !== cond.id) return false;
          return true;
        })
      );
      return hit ?? null;
    }

    return null;
  };

  // cast to any
  (prismaMock.user.findUnique as any).mockImplementation(async (args: any) =>
    matchUser(args?.where)
  );
  (prismaMock.user.findFirst as any).mockImplementation(async (args: any) =>
    matchUser(args?.where)
  );
  (prismaMock.user.create as any).mockImplementation(
    async (args: any): Promise<User> => {
      const data = args?.data ?? {};
      const newUser: User = {
        id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
        username: data.username,
        email: data.email,
        password: data.password, // hashed by controller
        role: (data.role as Role) ?? "USER",
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      state.users.push(newUser);
      return newUser;
    }
  );
});

function getReturnedUser(body: any) {
  return body?.object ?? body?.user ?? body?.data;
}

describe("POST /api/v1/auth/register", () => {
  it("registers a new user and returns 201 without exposing password", async () => {
    const res = await request(app)
      .post("/api/v1/auth/register")
      .send({
        username: "beam123",
        email: "beam@example.com",
        password: "StrongP@ssw0rd",
      })
      .expect(201);

    expect(res.body.success).toBe(true);

    const user = getReturnedUser(res.body);
    console.log(user);
    expect(user).toMatchObject({
      id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      username: "beam123",
      email: "beam@example.com",
      role: "USER",
    });
    expect(user.password).toBeUndefined();
    expect(state.users[0]?.password).toBe("hashed:StrongP@ssw0rd");
  });

  it("rejects duplicate email/username with 400", async () => {
    state.users.push({
      id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      username: "beam123",
      email: "beam@example.com",
      password: "hashed:StrongP@ssw0rd",
      role: "USER",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const res = await request(app)
      .post("/api/v1/auth/register")
      .send({
        username: "beam123",
        email: "beam@example.com",
        password: "StrongP@ssw0rd",
      })
      .expect(400);

    expect(res.body.success).toBe(false);
    expect(String(res.body.message).toLowerCase()).toMatch(
      /already|exists|taken/
    );
  });

  it("validates weak inputs with 400", async () => {
    const res = await request(app)
      .post("/api/v1/auth/register")
      .send({
        username: "x",
        email: "not-an-email",
        password: "weak",
      })
      .expect(400);

    expect(res.body.success).toBe(false);
    expect(String(res.body.message).toLowerCase()).toMatch(/validation/);
  });
});

describe("POST /api/v1/auth/login", () => {
  it("logs in with valid credentials and returns a JWT", async () => {
    state.users.push({
      id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      username: "beam123",
      email: "beam@example.com",
      password: "hashed:StrongP@ssw0rd",
      role: "USER",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const res = await request(app)
      .post("/api/v1/auth/login")
      .send({
        email: "beam@example.com",
        password: "StrongP@ssw0rd",
      })
      .expect(200);

    expect(res.body.success).toBe(true);
    const payload = getReturnedUser(res.body);
    expect(typeof payload?.token).toBe("string");
    expect(payload?.token).toBe("test.jwt.token");
  });

  it("rejects invalid credentials with 401", async () => {
    state.users.push({
      id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      username: "beam123",
      email: "beam@example.com",
      password: "hashed:StrongP@ssw0rd",
      role: "USER",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const res = await request(app)
      .post("/api/v1/auth/login")
      .send({
        email: "beam@example.com",
        password: "WrongPassword1!",
      })
      .expect(401);

    expect(res.body.success).toBe(false);
    expect(String(res.body.message).toLowerCase()).toMatch(
      /invalid|unauthorized/
    );
  });

  it("returns 400 on invalid payload", async () => {
    const res = await request(app)
      .post("/api/v1/auth/login")
      .send({
        email: "not-an-email",
        password: "short",
      })
      .expect(400);

    expect(res.body.success).toBe(false);
    expect(String(res.body.message).toLowerCase()).toMatch(/validation/);
  });
});
