import type { Request, Response, NextFunction } from "express";
import { prisma } from "../../libs/prisma.js";
import { registerSchema, loginSchema } from "./auth.schemas.js";
import { hash, compare } from "../../libs/hash.js";
import { signToken } from "../../libs/jwt.js";

export async function register(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const parsed = registerSchema.parse(req.body);
    const exists = await prisma.user.findFirst({
      where: { OR: [{ email: parsed.email }, { username: parsed.username }] },
    });
    if (exists)
      return res
        .status(400)
        .json({ success: false, message: "Email or username already exists" });

    const hashed = await hash(parsed.password);
    await prisma.user.create({
      data: {
        username: parsed.username,
        email: parsed.email,
        password: hashed,
        role: "USER",
      },
    });
    return res.status(201).json({ success: true, message: "User registered" });
  } catch (err: any) {
    if (err.name === "ZodError")
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: err.issues.map((i: any) => i.message),
      });
    next(err);
  }
}

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password } = loginSchema.parse(req.body);
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user)
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials" });
    const ok = await compare(password, user.password);
    if (!ok)
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials" });

    const token = signToken({
      userId: user.id,
      username: user.username,
      role: user.role as any,
    });
    return res
      .status(200)
      .json({ success: true, message: "Logged in", object: { token } });
  } catch (err: any) {
    if (err.name === "ZodError")
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: err.issues.map((i: any) => i.message),
      });
    next(err);
  }
}
