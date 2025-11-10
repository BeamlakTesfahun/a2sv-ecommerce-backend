import jwt from "jsonwebtoken";

export type JwtPayload = {
  userId: string;
  username: string;
  role: "USER" | "ADMIN";
};

export const signToken = (payload: JwtPayload) => {
  const secret = process.env.JWT_SECRET!;
  return jwt.sign(payload, secret, { expiresIn: "7d" });
};

export const verifyToken = (token: string) => {
  const secret = process.env.JWT_SECRET!;
  return jwt.verify(token, secret) as JwtPayload;
};
