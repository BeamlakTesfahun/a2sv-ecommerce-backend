import { z } from "zod";

export const registerSchema = z.object({
  username: z
    .string()
    .regex(/^[a-zA-Z0-9]+$/)
    .min(3)
    .max(30),
  email: z.email(),
  password: z
    .string()
    .min(8)
    .regex(/[A-Z]/, "Must include uppercase letter")
    .regex(/[a-z]/, "Must include lowercase letter")
    .regex(/[0-9]/, "Must include number")
    .regex(/[!@#$%^&*]/, "Must include special character"),
});

export const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
});
