import type { Request, Response, NextFunction } from "express";
import { prisma } from "../../libs/prisma.js";
import { registerSchema, loginSchema } from "./auth.schemas.js";
import { hash, compare } from "../../libs/hash.js";
import { signToken } from "../../libs/jwt.js";

function httpError(status: number, message: string) {
  const e: any = new Error(message);
  e.status = status;
  return e;
}

export async function register(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const dto = registerSchema.parse(req.body);

    // check duplicates by email/username
    const existing = await prisma.user.findFirst({
      where: {
        OR: [{ email: dto.email }, { username: dto.username }],
      },
    });
    if (existing) {
      throw httpError(400, "Email or username already taken");
    }

    const hashed = await hash(dto.password);

    // create user
    const created = await prisma.user.create({
      data: {
        username: dto.username,
        email: dto.email,
        password: hashed,
        role: "USER",
      },
    });

    // strip password for response
    const { password: _pw, ...safeUser } = created;

    return res
      .status(201)
      .json({ success: true, message: "User registered", object: safeUser });
  } catch (err: any) {
    if (err.name === "ZodError") {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: err.issues?.map((i: any) => i.message),
      });
    }
    next(err);
  }
}

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const dto = loginSchema.parse(req.body);

    const user = await prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (!user) throw httpError(401, "Invalid credentials");

    const ok = await compare(dto.password, user.password);
    if (!ok) throw httpError(401, "Invalid credentials");

    const token = signToken({
      userId: user.id,
      username: user.username,
      role: user.role,
    });
    return res
      .status(200)
      .json({ success: true, message: "Login successful", object: { token } });
  } catch (err: any) {
    if (err.name === "ZodError") {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: err.issues?.map((i: any) => i.message),
      });
    }
    next(err);
  }
}
