import type { Request, Response, NextFunction } from "express";

export const trustProxy = false;
export const apiLimiter = (_req: Request, _res: Response, next: NextFunction) =>
  next();
export const authLimiter = (
  _req: Request,
  _res: Response,
  next: NextFunction
) => next();
export const productsLimiter = (
  _req: Request,
  _res: Response,
  next: NextFunction
) => next();
